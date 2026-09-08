import { describe, expect, it } from 'vitest';
import {
  ModelRepository,
  addFlowUsage,
  addPackage,
  addPartDefinition,
  addPartUsage,
  addPortDefinition,
  addPortUsage,
  applyCanvasIntent,
  createDocument,
  getPortIds,
  modelEdgeId,
  modelIdFromCanvasData,
  modelIdFromEdgeId,
  modelIdFromNodeId,
  modelNodeId,
  projectModelToCanvas,
  cloneDocument,
  setPresentation
} from '$lib/concept-stage/sysml';

describe('SysML model/canvas projection (Phase 3)', () => {
  it('projects semantic usages and ports with stable model-backed ids', () => {
    const document = createDocument('Vehicle');
    const library = addPackage(document, 'Library');
    const motorDefinition = addPartDefinition(document, 'Motor', library.id);
    const portDefinition = addPortDefinition(document, 'PowerPort', library.id);
    const motor = addPartUsage(document, 'motorA', motorDefinition.id);
    const port = addPortUsage(document, 'power', portDefinition.id, motor.id, 'out');
    const presentation = setPresentation({}, motor.id, { position: { x: 100, y: 200 } });

    const projection = projectModelToCanvas(document, presentation);
    const node = projection.nodes.find((candidate) => candidate.id === modelNodeId(motor.id));

    expect(node?.type).toBe('part');
    expect(node?.position).toEqual({ x: 100, y: 200 });
    expect((node?.data as { modelId: string }).modelId).toBe(motor.id);
    expect((node?.data as { outputs: Array<{ id: string }> }).outputs.map((item) => item.id)).toEqual([port.id]);
    expect(getPortIds(document, motor.id)).toEqual([port.id]);
    expect(modelIdFromNodeId(node!.id)).toBe(motor.id);
  });

  it('projects flow relationships and keeps endpoint ids semantic', () => {
    const document = createDocument('Vehicle');
    const definition = addPartDefinition(document, 'Motor');
    const sourcePortDefinition = addPortDefinition(document, 'SourcePort');
    const targetPortDefinition = addPortDefinition(document, 'TargetPort');
    const source = addPartUsage(document, 'source', definition.id);
    const target = addPartUsage(document, 'target', definition.id);
    const sourcePort = addPortUsage(document, 'out', sourcePortDefinition.id, source.id, 'out');
    const targetPort = addPortUsage(document, 'in', targetPortDefinition.id, target.id, 'in');
    const flow = addFlowUsage(document, 'flow', sourcePort.id, targetPort.id);

    const edge = projectModelToCanvas(document).edges.find((candidate) => candidate.id === modelEdgeId(flow.id));
    expect(edge?.source).toBe(modelNodeId(source.id));
    expect(edge?.target).toBe(modelNodeId(target.id));
    // Handles use the port *name* so projected edges snap to the live
    // PortHandles scheme (`${nodeId}-${side}-${portName}`).
    expect(edge?.sourceHandle).toBe(`${modelNodeId(source.id)}-output-${sourcePort.name}`);
    expect(edge?.targetHandle).toBe(`${modelNodeId(target.id)}-input-${targetPort.name}`);
    expect(modelIdFromEdgeId(edge!.id)).toBe(flow.id);
    expect((edge?.data as { modelId: string }).modelId).toBe(flow.id);
  });

  it('routes rename/delete intents through the repository and extracts model ids', () => {
    const source = createDocument('Vehicle');
    const definition = addPartDefinition(source, 'Motor');
    const repository = new ModelRepository(cloneDocument(createDocument('Vehicle')));
    expect(repository.create(definition).ok).toBe(true);

    const renamed = applyCanvasIntent(repository, { kind: 'rename', modelId: definition.id, name: 'ElectricMotor' });
    expect(renamed.ok).toBe(true);
    expect(repository.getElement(definition.id)?.name).toBe('ElectricMotor');

    expect(modelIdFromCanvasData({ modelId: definition.id })).toBe(definition.id);
    expect(modelIdFromCanvasData({ position: { x: 1, y: 2 } })).toBeUndefined();

    const deleted = applyCanvasIntent(repository, { kind: 'delete-node', modelId: definition.id });
    expect(deleted.ok).toBe(true);
    expect(repository.getElement(definition.id)).toBeUndefined();
  });
});
