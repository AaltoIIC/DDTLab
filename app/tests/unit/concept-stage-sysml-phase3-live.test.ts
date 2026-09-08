import { beforeEach, describe, expect, it, vi } from 'vitest';
import { get } from 'svelte/store';
import type { Node } from '@xyflow/svelte';

vi.mock('$app/environment', () => ({ browser: false }));

import * as session from '$lib/concept-stage/sysml/session';
import * as model from '$lib/concept-stage/sysml/model';
import * as nodeViewStore from '$lib/concept-stage/nodeViewStore';
import * as editorStore from '$lib/domains/editor-core/state/activeEditorSessionStore';
import * as historyStore from '$lib/domains/editor-core/state/editorHistoryNavigationStore';

interface EngineIds {
    usage: string;
    fuelIn: string;
    pump: string;
    pumpIn: string;
    flow: string;
}

/**
 * Factory-authored system: engine usage (owner null) with an input port
 * `fuelIn`, an owned child `pump` with an input port `pumpIn`, and a nested
 * flow fuelIn -> pumpIn owned by the engine usage.
 */
function engineSystem(): { document: model.SysmlDocument; ids: EngineIds } {
    const document = model.createDocument('Vehicle');
    const engineDef = model.addPartDefinition(document, 'Engine');
    const pumpDef = model.addPartDefinition(document, 'Pump');
    const portDef = model.addPortDefinition(document, 'FuelPort');
    const usage = model.addPartUsage(document, 'engine', engineDef.id);
    const fuelIn = model.addPortUsage(document, 'fuelIn', portDef.id, usage.id, 'in');
    const pump = model.addPartUsage(document, 'pump', pumpDef.id, usage.id);
    const pumpIn = model.addPortUsage(document, 'pumpIn', portDef.id, pump.id, 'in');
    const flow = model.addFlowUsage(document, 'fuelPath', fuelIn.id, pumpIn.id, null, usage.id);
    return {
        document,
        ids: { usage: usage.id, fuelIn: fuelIn.id, pump: pump.id, pumpIn: pumpIn.id, flow: flow.id }
    };
}

const partNode = (id: string, extra: Record<string, unknown> = {}): Node => ({
    id,
    type: 'part',
    data: { declaredName: id, ...extra },
    position: { x: 0, y: 0 }
});

beforeEach(async () => {
    editorStore.currentSystemMeta.set({ id: '', name: '', date: '' });
    editorStore.currentNodes.set([]);
    editorStore.currentEdges.set([]);
    editorStore.currentReqs.set([]);
    editorStore.currentPartDefinitions.set([]);
    editorStore.currentItemDefinitions.set([]);
    editorStore.currentPackages.set([]);
    historyStore.history.set({ currentIndex: -1, data: [] });
    nodeViewStore.navigationStack.set([]);
    session.semanticSession.set(null);
});

describe('concept-stage semantic session binding (Phase 3 live wiring)', () => {
    it('binds and detaches a session per concept system', () => {
        const bound = session.bindConceptStageSession('sys-1', 'Vehicle');
        expect(session.getSemanticSession()).toBe(bound);
        expect(session.bindConceptStageSession('sys-1', 'Vehicle')).toBe(bound);

        session.unbindConceptStageSession('sys-2'); // wrong system: no-op
        expect(session.getSemanticSession()).toBe(bound);
        session.unbindConceptStageSession('sys-1');
        expect(session.getSemanticSession()).toBeNull();
    });

    it('opens semantic drill-downs only for mapped usages without legacy nested content', () => {
        const { document, ids } = engineSystem();
        session.setSemanticSession(session.createSemanticSession(document));
        session.registerLegacyModelId('legacy-engine', ids.usage);

        expect(session.semanticDrillDownScope(partNode('legacy-engine'))).toBe(ids.usage);

        // A mapped node that still carries a legacy nested diagram stays legacy.
        const withLegacy = partNode('legacy-engine', {
            nodes: [{ id: 'x', type: 'part', data: {}, position: { x: 0, y: 0 } }]
        });
        expect(session.semanticDrillDownScope(withLegacy)).toBeUndefined();

        // Unmapped nodes and packages never open semantically.
        expect(session.semanticDrillDownScope(partNode('other'))).toBeUndefined();
        expect(session.semanticDrillDownScope({ id: 'p', type: 'package', data: {} } as Node)).toBeUndefined();
    });

    it('shapes projected drill-down nodes/edges for the existing canvas components', () => {
        const { document, ids } = engineSystem();
        session.setSemanticSession(session.createSemanticSession(document));

        session.getSemanticSession()!.presentation = {
            ...session.getSemanticSession()!.presentation,
            [ids.fuelIn]: { position: { x: 20, y: 150 }, interfaceType: 'mdo' }
        };

        const view = session.projectSemanticDrillDownView(ids.usage);
        const artifact = view.nodes.find((node) => node.id === `internal-port-input-${ids.fuelIn}`)!;
        expect(artifact.type).toBe('internalPort');
        expect(artifact.position).toEqual({ x: 20, y: 150 });
        expect((artifact.data as { portType: string }).portType).toBe('input');
        expect((artifact.data as { interfaceType?: string }).interfaceType).toBe('mdo');
        expect((artifact.data as { parentNodeName: string }).parentNodeName).toBe('engine');

        const child = view.nodes.find((node) => node.id === `n_${ids.pump}`)!;
        expect((child.data as { declaredName: string }).declaredName).toBe('pump');
        expect((child.data as { inputs: unknown[] }).inputs).toHaveLength(1); // pumpIn projected

        expect(view.edges).toHaveLength(1);
        const edge = view.edges[0];
        expect(edge.source).toBe(`internal-port-input-${ids.fuelIn}`);
        expect(edge.sourceHandle).toBe(`internal-port-input-${ids.fuelIn}-source`);
        expect(edge.target).toBe(`n_${ids.pump}`);
        expect((edge.data as { compatibility: string }).compatibility).toBe('direct');
        expect((edge.data as { connectionType: string }).connectionType).toBe('flow');
    });

    it('routes drill-down through the model and keeps drag positions on exit', () => {
        const { document, ids } = engineSystem();
        session.setSemanticSession(session.createSemanticSession(document));
        session.registerLegacyModelId('legacy-engine', ids.usage);

        editorStore.currentNodes.set([partNode('legacy-engine')]);
        nodeViewStore.navigateIntoNode('legacy-engine', 'Engine');

        const view = get(editorStore.currentNodes);
        expect(view.some((node) => node.type === 'internalPort')).toBe(true);
        expect(view.some((node) => node.id === `n_${ids.pump}`)).toBe(true);
        expect(get(editorStore.currentEdges)).toHaveLength(1);
        expect(get(nodeViewStore.currentNodeView)?.semantic?.scopeId).toBe(ids.usage);

        // Drag the boundary artifact, then leave the view.
        editorStore.currentNodes.update((nodes) =>
            nodes.map((node) =>
                node.id === `internal-port-input-${ids.fuelIn}` ? { ...node, position: { x: 55, y: 240 } } : node
            )
        );
        nodeViewStore.navigateBack();

        // Back at the root: the root node is untouched (no legacy write-back).
        const rootNodes = get(editorStore.currentNodes);
        expect(rootNodes).toHaveLength(1);
        expect((rootNodes[0].data as { nodes?: unknown[] }).nodes).toBeUndefined();
        // The drag was committed to the presentation map under the port's id.
        expect(session.getSemanticSession()!.presentation[ids.fuelIn]?.position).toEqual({ x: 55, y: 240 });

        // Re-entering restores the dragged position from the presentation map.
        nodeViewStore.navigateIntoNode('legacy-engine', 'Engine');
        const artifact = get(editorStore.currentNodes).find((node) => node.id === `internal-port-input-${ids.fuelIn}`)!;
        expect(artifact.position).toEqual({ x: 55, y: 240 });
    });

    it('opens a model-backed drill-down for a node seeded from a library drop', () => {
        const document = model.createDocument('Vehicle');
        session.setSemanticSession(session.createSemanticSession(document));

        const engineNode: Node = {
            id: 'n-engine',
            type: 'part',
            position: { x: 0, y: 0 },
            data: {
                declaredName: 'Main Diesel Engine',
                definition: 'Marine Diesel Engine',
                inputs: [{ id: 'p-in', name: 'fuel', interfaceType: 'mdo' }],
                outputs: [{ id: 'p-out', name: 'shaft', interfaceType: 'propeller-drive-shaft' }]
            }
        };
        session.seedRootCanvasToModel([engineNode], []);
        editorStore.currentNodes.set([engineNode]);

        // The seeded node maps to a usage, so drill-down is model-backed and
        // its boundary ports come from the model.
        nodeViewStore.navigateIntoNode('n-engine', 'Main Diesel Engine');

        const view = get(editorStore.currentNodes);
        expect(view.filter((node) => node.type === 'internalPort')).toHaveLength(2);
        const usageId = session.modelIdForLegacyId('n-engine')!;
        expect(get(nodeViewStore.currentNodeView)?.semantic?.scopeId).toBe(usageId);
        const modelPortIds = (session.getSemanticSession()!.repository.getElement(usageId) as { ownedUsageIds: string[] }).ownedUsageIds;
        const artifactIds = view.map((node) => node.id);
        for (const portId of modelPortIds) {
            expect(artifactIds.some((id) => id.includes(portId))).toBe(true);
        }
    });

    it('falls back to the legacy drill-down for unmapped nodes', () => {
        editorStore.currentNodes.set([
            partNode('legacy-part', {
                nodes: [
                    { id: 'a', type: 'part', data: {}, position: { x: 520, y: 330 } },
                    { id: 'b', type: 'part', data: {}, position: { x: 900, y: 700 } }
                ]
            })
        ]);

        nodeViewStore.navigateIntoNode('legacy-part', 'Legacy Part');

        const nodes = get(editorStore.currentNodes);
        expect(nodes.find((n) => n.id === 'a')!.position).toEqual({ x: 100, y: 100 }); // legacy normalization
        expect(get(nodeViewStore.currentNodeView)?.semantic).toBeUndefined();
    });
});
