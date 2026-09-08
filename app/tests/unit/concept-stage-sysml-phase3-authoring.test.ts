import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { Edge, Node } from '@xyflow/svelte';

vi.mock('$app/environment', () => ({ browser: false }));

import * as session from '$lib/concept-stage/sysml/session';
import * as model from '$lib/concept-stage/sysml/model';

const portRecord = (id: string, name: string, interfaceType: string) => ({ id, name, interfaceType });

/** Two parts with ports and one flow edge, shaped exactly like dropped legacy content. */
function droppedGraph(): { nodes: Node[]; edges: Edge[] } {
    const engineId = 'n-engine';
    const gearboxId = 'n-gearbox';
    const nodes: Node[] = [
        {
            id: engineId,
            type: 'part',
            position: { x: 0, y: 0 },
            data: {
                declaredName: 'Main Diesel Engine',
                definition: 'Marine Diesel Engine',
                inputs: [portRecord('p-in', 'fuel', 'mdo')],
                outputs: [portRecord('p-out', 'shaft', 'propeller-drive-shaft')]
            }
        },
        {
            id: gearboxId,
            type: 'part',
            position: { x: 0, y: 0 },
            data: {
                declaredName: 'Reduction Gearbox',
                definition: 'Marine Gearbox',
                inputs: [portRecord('g-in', 'shaft_in', 'propeller-drive-shaft')],
                outputs: []
            }
        }
    ];
    const edges: Edge[] = [
        {
            id: 'e1',
            source: engineId,
            target: gearboxId,
            sourceHandle: `${engineId}-output-shaft`,
            targetHandle: `${gearboxId}-input-shaft_in`,
            type: 'default',
            data: { compatibility: 'direct', connectionType: 'flow' }
        }
    ];
    return { nodes, edges };
}

beforeEach(async () => {
    session.semanticSession.set(null);
});

describe('concept-stage root authoring (Phase 3, Milestone B part 2)', () => {
    it('seeds usages, definitions, ports and the flow into the semantic session', () => {
        const document = model.createDocument('Vehicle');
        session.setSemanticSession(session.createSemanticSession(document));
        const { nodes, edges } = droppedGraph();

        session.seedRootCanvasToModel(nodes, edges);

        const seeded = session.getSemanticSession()!.repository.read();
        const engineModelId = session.modelIdForLegacyId('n-engine');
        const gearboxModelId = session.modelIdForLegacyId('n-gearbox');
        expect(engineModelId).toBeTruthy();
        expect(gearboxModelId).toBeTruthy();
        const usageIds = [engineModelId!, gearboxModelId!];

        for (const usageId of usageIds) {
            const usage = seeded.elements[usageId];
            expect(['partUsage', 'itemUsage']).toContain(usage?.metaclass);
        }

        // Definitions synthesized from the legacy `definition` strings (in a
        // root-owned Definitions package, never colliding with usage names).
        const definitions = Object.values(seeded.elements).filter((element) => element.metaclass === 'partDefinition');
        expect(definitions.map((definition) => definition.name)).toEqual(
            expect.arrayContaining(['Marine Diesel Engine', 'Marine Gearbox'])
        );
        for (const definition of definitions) {
            const owner = seeded.elements[definition.ownerId!];
            expect(owner?.metaclass).toBe('package');
        }

        // Ports per input/output record, with the interface label kept in presentation.
        const engineUsage = seeded.elements[usageIds[0]] as model.PartUsageElement;
        const portNames = engineUsage.ownedUsageIds
            .map((id) => seeded.elements[id])
            .filter((element): element is model.PortUsageElement => element?.metaclass === 'portUsage')
            .map((port) => `${port.name}:${port.direction}`);
        expect(portNames).toEqual(expect.arrayContaining(['fuel:in', 'shaft:out']));
        const fuelPort = engineUsage.ownedUsageIds
            .map((id) => seeded.elements[id])
            .find((element) => element?.metaclass === 'portUsage' && element.name === 'fuel');
        expect(session.getSemanticSession()!.presentation[fuelPort!.id]?.interfaceType).toBe('mdo');

        // The flow relationship resolved through the legacy handle scheme.
        const flows = Object.values(seeded.elements).filter((element) => element.metaclass === 'flowUsage');
        expect(flows).toHaveLength(1);
        expect(session.modelIdForLegacyEdgeId('e1')).toBe(flows[0].id);
    });

    it('is idempotent when the same canvas content is seeded twice', () => {
        const document = model.createDocument('Vehicle');
        session.setSemanticSession(session.createSemanticSession(document));
        const { nodes, edges } = droppedGraph();

        session.seedRootCanvasToModel(nodes, edges);
        const countAfterFirst = Object.keys(session.getSemanticSession()!.repository.read().elements).length;
        session.seedRootCanvasToModel(nodes, edges);
        const countAfterSecond = Object.keys(session.getSemanticSession()!.repository.read().elements).length;

        expect(countAfterSecond).toBe(countAfterFirst);
        expect(Object.values(session.getSemanticSession()!.repository.read().elements).filter((e) => e.metaclass === 'flowUsage')).toHaveLength(1);
    });

    it('routes renames and deletes of mapped root nodes through the repository', () => {
        const document = model.createDocument('Vehicle');
        session.setSemanticSession(session.createSemanticSession(document));
        const { nodes, edges } = droppedGraph();
        session.seedRootCanvasToModel(nodes, edges);

        const engineModelId = session.modelIdForLegacyId('n-engine')!;

        session.renameModelElementForLegacyNode('n-engine', 'Main Engine (Electric)');
        expect(session.getSemanticSession()!.repository.getElement(engineModelId)?.name).toBe('Main Engine (Electric)');

        session.deleteModelContentForLegacyNode('n-engine');
        const after = session.getSemanticSession()!.repository.read();
        expect(after.elements[engineModelId]).toBeUndefined();
        // Deleting the usage removed its ports and the flow that referenced them,
        // but the gearbox and its ports survive.
        expect(session.getSemanticSession()!.repository.getElement(session.modelIdForLegacyId('n-gearbox')!)).toBeDefined();
        expect(Object.values(after.elements).filter((element) => element.metaclass === 'flowUsage')).toHaveLength(0);
        expect(Object.values(after.elements).filter((element) => element.metaclass === 'portUsage')).toHaveLength(1); // gearbox input only
    });

    it('routes edge deletion through the mapped relationship', () => {
        const document = model.createDocument('Vehicle');
        session.setSemanticSession(session.createSemanticSession(document));
        const { nodes, edges } = droppedGraph();
        session.seedRootCanvasToModel(nodes, edges);

        const flowId = session.modelIdForLegacyEdgeId('e1')!;
        session.deleteModelRelationshipForLegacyEdge('e1');

        expect(session.getSemanticSession()!.repository.getElement(flowId)).toBeUndefined();
        expect(session.modelIdForLegacyEdgeId('e1')).toBeUndefined();
    });

    it('handles model-backed drill-down node and edge ids (`n_`/`e_`)', () => {
        const document = model.createDocument('Vehicle');
        const engineDef = model.addPartDefinition(document, 'Engine');
        const pumpDef = model.addPartDefinition(document, 'Pump');
        const portDef = model.addPortDefinition(document, 'PowerPort');
        const usage = model.addPartUsage(document, 'engine', engineDef.id);
        const fuelIn = model.addPortUsage(document, 'fuelIn', portDef.id, usage.id, 'in');
        const pump = model.addPartUsage(document, 'pump', pumpDef.id, usage.id);
        const pumpIn = model.addPortUsage(document, 'pumpIn', portDef.id, pump.id, 'in');
        const flow = model.addFlowUsage(document, 'fuelPath', fuelIn.id, pumpIn.id, null, usage.id);
        session.setSemanticSession(session.createSemanticSession(document));

        session.deleteModelRelationshipForLegacyEdge(`e_${flow.id}`);
        expect(session.getSemanticSession()!.repository.getElement(flow.id)).toBeUndefined();

        session.deleteModelContentForLegacyNode(`n_${pump.id}`);
        expect(session.getSemanticSession()!.repository.getElement(pump.id)).toBeUndefined();
        expect(session.getSemanticSession()!.repository.getElement(pumpIn.id)).toBeUndefined();
        expect(session.getSemanticSession()!.repository.getElement(usage.id)).toBeDefined();
    });

    it('is a no-op without a bound session', () => {
        session.semanticSession.set(null);
        expect(() => {
            session.seedRootCanvasToModel(droppedGraph().nodes, droppedGraph().edges);
            session.renameModelElementForLegacyNode('x', 'y');
            session.deleteModelContentForLegacyNode('x');
            session.deleteModelRelationshipForLegacyEdge('e1');
        }).not.toThrow();
    });
});
