import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { Edge, Node } from '@xyflow/svelte';

vi.mock('$app/environment', () => ({ browser: false }));

import * as session from '$lib/concept-stage/sysml/session';
import * as model from '$lib/concept-stage/sysml/model';
import { internalPortNodeId, modelNodeId, portHandleId } from '$lib/concept-stage/sysml';

interface ScopeFixture {
    engineDef: string;
    pumpDef: string;
    engine: string;
    fuelIn: string;
    pump: string;
    pumpIn: string;
    flow: string;
}

/**
 * engine usage (root) with input port `fuelIn`, an owned child `pump` (typed by
 * `pumpDef`) with input port `pumpIn`, and a scope-owned flow fuelIn -> pumpIn.
 */
function engineScope(): ScopeFixture {
    const document = model.createDocument('Vehicle');
    const engineDef = model.addPartDefinition(document, 'Engine');
    const pumpDef = model.addPartDefinition(document, 'Pump');
    const portDef = model.addPortDefinition(document, 'FuelPort');
    const engine = model.addPartUsage(document, 'engine', engineDef.id);
    const fuelIn = model.addPortUsage(document, 'fuelIn', portDef.id, engine.id, 'in');
    const pump = model.addPartUsage(document, 'pump', pumpDef.id, engine.id);
    const pumpIn = model.addPortUsage(document, 'pumpIn', portDef.id, pump.id, 'in');
    const flow = model.addFlowUsage(document, 'fuelPath', fuelIn.id, pumpIn.id, null, engine.id);
    session.setSemanticSession(session.createSemanticSession(document));
    return { engineDef: engineDef.id, pumpDef: pumpDef.id, engine: engine.id, fuelIn: fuelIn.id, pump: pump.id, pumpIn: pumpIn.id, flow: flow.id };
}

const childNode = (id: string, extra: Record<string, unknown> = {}): Node => ({
    id,
    type: 'part',
    data: { declaredName: id, ...extra },
    position: { x: 0, y: 0 }
});

beforeEach(() => {
    session.semanticSession.set(null);
});

describe('concept-stage scoped authoring seams (Phase 3 completion)', () => {
    it('projects child-port handles name-based so they snap to live handles and resolve back to the port usage', () => {
        const fixture = engineScope();

        // The drill-down view projects the scope-owned flow to the child's
        // *name*-based handle (PortHandles renders `${id}-${side}-${name}`).
        const view = session.projectSemanticDrillDownView(fixture.engine);
        const childNodeId = modelNodeId(fixture.pump);
        const edge = view.edges.find((candidate) => candidate.id === `e_${fixture.flow}`)!;
        expect(edge.source).toBe(internalPortNodeId(fixture.fuelIn, 'input'));
        expect(edge.sourceHandle).toBe(`${internalPortNodeId(fixture.fuelIn, 'input')}-source`);
        expect(edge.target).toBe(childNodeId);
        expect(edge.targetHandle).toBe(portHandleId(childNodeId, 'pumpIn', 'input'));

        // The authoring resolver reads that same handle back to the semantic
        // port id — the loop authoring -> model -> projection -> authoring is closed.
        const childCanvas = view.nodes.find((node) => node.id === childNodeId)!;
        expect(session.resolveSemanticEndpoint(childCanvas, edge.targetHandle)).toBe(fixture.pumpIn);
    });

    it('seeds content dropped inside a model-backed drill-down under the view scope', () => {
        const fixture = engineScope();

        // Simulate a template drop inside the engine view: two fresh children
        // connected by an edge between their ports.
        const cooler = childNode('n-cooler-drop', {
            definition: 'Heat Exchanger',
            inputs: [],
            outputs: [{ id: 'p-1', name: 'coolOut' }]
        });
        const fan = childNode('n-fan-drop', {
            definition: 'Fan',
            inputs: [{ id: 'p-2', name: 'fanIn' }],
            outputs: []
        });
        const edge: Edge = {
            id: 'e-drop-1',
            source: cooler.id,
            target: fan.id,
            sourceHandle: `${cooler.id}-output-coolOut`,
            targetHandle: `${fan.id}-input-fanIn`,
            type: 'default',
            data: { connectionType: 'flow' }
        };

        session.seedNodesIntoScope(fixture.engine, [cooler, fan], [edge]);

        const bound = session.getSemanticSession()!;
        const coolerId = session.modelIdForLegacyId(cooler.id);
        const fanId = session.modelIdForLegacyId(fan.id);
        expect(coolerId).toBeTruthy();
        expect(fanId).toBeTruthy();

        // Both new usages are owned by the scope usage (not the root).
        const coolerUsage = bound.repository.getElement(coolerId!) as model.PartUsageElement;
        const fanUsage = bound.repository.getElement(fanId!) as model.PartUsageElement;
        expect(coolerUsage.ownerId).toBe(fixture.engine);
        expect(fanUsage.ownerId).toBe(fixture.engine);

        // Ports were mirrored under each new usage.
        const ownedPorts = (usageId: string) =>
            (bound.repository.getElement(usageId) as model.PartUsageElement).ownedUsageIds
                .map((id) => bound.repository.getElement(id))
                .filter((element): element is model.PortUsageElement => element?.metaclass === 'portUsage')
                .map((port) => port.name);
        expect(ownedPorts(coolerId!)).toEqual(['coolOut']);
        expect(ownedPorts(fanId!)).toEqual(['fanIn']);

        // The dropped edge created a scope-owned flow between the new ports.
        const flows = Object.values(bound.repository.read().elements).filter(
            (element) => element.metaclass === 'flowUsage' && element.ownerId === fixture.engine
        );
        expect(flows).toHaveLength(2); // the original fuelPath + the dropped one
        const droppedFlow = flows.find((flow) => flow.name === 'coolOut_to_fanIn');
        expect(droppedFlow).toBeDefined();
        expect(session.modelIdForLegacyEdgeId(edge.id)).toBe(droppedFlow!.id);

        // Idempotency: re-seeding the same drop adds nothing.
        session.seedNodesIntoScope(fixture.engine, [cooler, fan], [edge]);
        expect(
            Object.values(bound.repository.read().elements).filter((element) => element.metaclass === 'flowUsage' && element.ownerId === fixture.engine)
        ).toHaveLength(2);
    });

    it('mirrors a connect inside a drill-down to a scope-owned relationship, exactly once', () => {
        const fixture = engineScope();
        const bound = session.getSemanticSession()!;

        // New canvas connection: boundary artifact (engine.fuelIn) feeds a child
        // pump already in the view. Note: fuelIn is already consumed by the
        // original flow, so connect a *second* engine boundary port instead.
        const portDef = Object.values(bound.repository.read().elements).find((element) => element.metaclass === 'portDefinition')!;
        const fuel2 = bound.repository.create({
            id: `port-mirror-${Math.random().toString(36).slice(2, 8)}`,
            metaclass: 'portUsage',
            category: 'usage',
            name: 'fuel2',
            ownerId: fixture.engine,
            definitionId: portDef.id,
            direction: 'in'
        } as model.AnySysmlElement);
        expect(fuel2.ok).toBe(true);
        const fuel2Id = fuel2.value!.id;

        const artifact = {
            id: internalPortNodeId(fuel2Id, 'input'),
            type: 'internalPort',
            data: { modelId: fuel2Id, portType: 'input' },
            position: { x: 20, y: 150 }
        } as Node;
        const pumpCanvas = childNode(modelNodeId(fixture.pump));
        const canvasEdge: Edge = {
            id: 'e-live-1',
            source: artifact.id,
            target: pumpCanvas.id,
            sourceHandle: `${artifact.id}-source`,
            targetHandle: portHandleId(pumpCanvas.id, 'pumpIn', 'input'),
            type: 'default',
            data: { connectionType: 'flow' }
        };

        session.mirrorConnectToScope(fixture.engine, canvasEdge, [artifact, pumpCanvas]);

        const flows = Object.values(bound.repository.read().elements).filter((element) => element.metaclass === 'flowUsage');
        expect(flows).toHaveLength(2); // original + mirrored
        const mirrored = flows.find((flow) => (flow as model.FlowUsageElement).sourceEnd === fuel2Id);
        expect(mirrored).toBeDefined();
        expect((mirrored as model.FlowUsageElement).ownerId).toBe(fixture.engine);
        expect(session.modelIdForLegacyEdgeId(canvasEdge.id)).toBe(mirrored!.id);

        // Mirroring the same canvas edge again is a no-op (no duplicate flow).
        session.mirrorConnectToScope(fixture.engine, canvasEdge, [artifact, pumpCanvas]);
        expect(
            Object.values(bound.repository.read().elements).filter((element) => element.metaclass === 'flowUsage' && (element as model.FlowUsageElement).sourceEnd === fuel2Id)
        ).toHaveLength(1);
    });

    it('mirrors port edits (add/interface/rename/remove) on a mapped node into the model', () => {
        const fixture = engineScope();
        const bound = session.getSemanticSession()!;

        // The engine usage is model-backed at the root; map a legacy canvas id.
        session.registerLegacyModelId('engine-canvas', fixture.engine);

        // Add an input port.
        session.addModelPort('engine-canvas', { name: 'coolant', direction: 'in', interfaceType: 'mdo' });
        let engine = bound.repository.getElement(fixture.engine) as model.PartUsageElement;
        let coolantId = engine.ownedUsageIds.find((id) => (bound.repository.getElement(id) as model.PortUsageElement | undefined)?.name === 'coolant');
        expect(coolantId).toBeTruthy();
        expect((bound.repository.getElement(coolantId!) as model.PortUsageElement).direction).toBe('in');
        expect(bound.presentation[coolantId!]?.interfaceType).toBe('mdo');

        // Rename it.
        session.renameModelPort('engine-canvas', 'coolant', 'coolantIn');
        expect((bound.repository.getElement(coolantId!) as model.PortUsageElement).name).toBe('coolantIn');

        // Removing an input port that a flow references must remove the flow too.
        const flowToRemove = bound.repository.create({
            id: `flow-rm-${Math.random().toString(36).slice(2, 8)}`,
            metaclass: 'flowUsage',
            category: 'relationship',
            name: 'toCoolant',
            ownerId: null,
            sourceEnd: fixture.fuelIn,
            targetEnd: coolantId!,
            flowDefinitionId: null
        } as model.AnySysmlElement);
        expect(flowToRemove.ok).toBe(true);
        session.removeModelPort('engine-canvas', 'coolantIn');
        expect(bound.repository.getElement(coolantId!)).toBeUndefined();
        expect(bound.repository.getElement(flowToRemove.value!.id)).toBeUndefined();
        // The unrelated original flow (fuelIn -> pumpIn) survives.
        expect(bound.repository.getElement(fixture.flow)).toBeDefined();

        // addModelPort is idempotent by name.
        session.addModelPort('engine-canvas', { name: 'coolantIn', direction: 'in' });
        session.addModelPort('engine-canvas', { name: 'coolantIn', direction: 'in' });
        engine = bound.repository.getElement(fixture.engine) as model.PartUsageElement;
        expect(engine.ownedUsageIds.filter((id) => (bound.repository.getElement(id) as model.PortUsageElement | undefined)?.name === 'coolantIn')).toHaveLength(1);
    });

    it('seeds a duplicated model-backed child as its own typed usage under the scope', () => {
        const fixture = engineScope();
        const bound = session.getSemanticSession()!;

        // A duplicate of the model-backed `pump` child: the copy keeps the
        // source usage's definition id and port records but must NOT keep the
        // source usage id (ConceptNode strips `modelId` before seeding).
        const duplicateId = 'dup-pump';
        const duplicate = childNode(duplicateId, {
            definitionId: fixture.pumpDef,
            inputs: [{ id: 'dup-in', name: 'pumpIn' }],
            outputs: []
        });
        delete (duplicate.data as Record<string, unknown>).modelId;

        session.seedNodesIntoScope(fixture.engine, [duplicate], []);

        const copiedId = session.modelIdForLegacyId(duplicateId);
        expect(copiedId).toBeTruthy();
        expect(copiedId).not.toBe(fixture.pump); // a fresh element, not the source
        const copied = bound.repository.getElement(copiedId!) as model.PartUsageElement;
        expect(copied.ownerId).toBe(fixture.engine);
        // Typed by the reused definition instead of degrading to an untyped usage.
        expect(copied.definitionId).toBe(fixture.pumpDef);
        const copiedPort = copied.ownedUsageIds
            .map((id) => bound.repository.getElement(id))
            .find((element): element is model.PortUsageElement => element?.metaclass === 'portUsage');
        expect(copiedPort?.name).toBe('pumpIn');
    });
});
