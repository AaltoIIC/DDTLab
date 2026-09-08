import { describe, expect, it } from 'vitest';
import {
  ModelRepository,
  addFlowUsage,
  addPackage,
  addPartDefinition,
  addPartUsage,
  addPortDefinition,
  addPortUsage,
  cascadeDelete,
  cloneDocument,
  connectInView,
  createDocument,
  createUsageInView,
  internalPortNodeId,
  modelEdgeId,
  modelNodeId,
  portHandleId,
  portIdFromInternalPortNodeId,
  projectView,
  setPresentation
} from '$lib/concept-stage/sysml';

interface EngineSystem {
  repository: ModelRepository;
  engineDef: string;
  pumpDef: string;
  engine: string;
  engineIn: string;
  engineOut: string;
  heatEx: string;
  heatExIn: string;
  heatExOut: string;
  pump: string;
  pumpIn: string;
  pumpOut: string;
  rootFlow: string;
  nestedFlow: string;
}

/**
 * Legacy-shaped system, authored semantically:
 *   root
 *   └── Bay (package)
 *       ├── engine : Engine     (ports fuelIn, shaftOut)
 *       │   └── heatEx : HeatExchanger  (ports hxIn, hxOut)
 *       └── pump : Pump         (ports pIn, pOut)
 * plus a root flow engine.shaftOut -> pump.pIn and a nested flow
 * engine.fuelIn -> heatEx.hxIn owned by the engine usage.
 */
function buildEngineSystem(): EngineSystem {
  const repository = new ModelRepository(cloneDocument(createDocument('Vehicle')));

  // The factories register ownership on their scratch document, so an element
  // minted there already carries its children in its ownership arrays. The
  // repository is the single owner of ownership, so membership arrays are
  // detached before insertion and repopulated by repository.create() as each
  // child is added in dependency order.
  const detach = <T extends Parameters<ModelRepository['create']>[0]>(element: T): T => {
    const copy = { ...element } as Record<string, unknown>;
    for (const field of ['memberIds', 'ownedUsageIds', 'attributeIds', 'endIds'] as const) {
      if (Array.isArray(copy[field])) copy[field] = [];
    }
    return copy as T;
  };
  const put = (element: Parameters<ModelRepository['create']>[0]) => {
    const result = repository.create(detach(element));
    expect(result.ok).toBe(true);
  };

  // Factory-minted ids come from this throwaway document; only the ids and
  // shapes are reused (see the detach note above).
  const scratch = createDocument('Vehicle');
  const portDef = addPortDefinition(scratch, 'ConnectorPort');
  const engineDef = addPartDefinition(scratch, 'Engine');
  const heatExDef = addPartDefinition(scratch, 'HeatExchanger');
  const pumpDef = addPartDefinition(scratch, 'Pump');

  const bay = addPackage(scratch, 'Bay');
  const engine = addPartUsage(scratch, 'engine', engineDef.id, bay.id);
  const pump = addPartUsage(scratch, 'pump', pumpDef.id, bay.id);
  const engineIn = addPortUsage(scratch, 'fuelIn', portDef.id, engine.id, 'in');
  const engineOut = addPortUsage(scratch, 'shaftOut', portDef.id, engine.id, 'out');
  const heatEx = addPartUsage(scratch, 'heatEx', heatExDef.id, engine.id);
  const heatExIn = addPortUsage(scratch, 'hxIn', portDef.id, heatEx.id, 'in');
  const heatExOut = addPortUsage(scratch, 'hxOut', portDef.id, heatEx.id, 'out');
  const pumpIn = addPortUsage(scratch, 'pIn', portDef.id, pump.id, 'in');
  const pumpOut = addPortUsage(scratch, 'pOut', portDef.id, pump.id, 'out');

  const rootFlow = addFlowUsage(scratch, 'drive', engineOut.id, pumpIn.id, null, null);
  const nestedFlow = addFlowUsage(scratch, 'fuelPath', engineIn.id, heatExIn.id, null, engine.id);

  // Insert in dependency order: root -> package -> usages -> ports -> flows.
  for (const element of [portDef, engineDef, heatExDef, pumpDef, bay, engine, pump, heatEx]) {
    put(element);
  }
  for (const element of [engineIn, engineOut, heatExIn, heatExOut, pumpIn, pumpOut, rootFlow, nestedFlow]) {
    put(element);
  }

  return {
    repository,
    engineDef: engineDef.id,
    pumpDef: pumpDef.id,
    engine: engine.id,
    engineIn: engineIn.id,
    engineOut: engineOut.id,
    heatEx: heatEx.id,
    heatExIn: heatExIn.id,
    heatExOut: heatExOut.id,
    pump: pump.id,
    pumpIn: pumpIn.id,
    pumpOut: pumpOut.id,
    rootFlow: rootFlow.id,
    nestedFlow: nestedFlow.id
  };
}

describe('SysML nested view projection + intents (Phase 3)', () => {
  it('scopes the root view: package members flatten, drill-down content stays hidden', () => {
    const system = buildEngineSystem();
    const view = projectView(system.repository.read(), {}, 'root');

    const packageId = Object.values(system.repository.read().elements).find((element) => element.metaclass === 'package')!.id;
    const nodeIds = view.nodes.map((node) => node.id);
    expect(nodeIds).toContain(modelNodeId(packageId)); // Bay
    expect(nodeIds).toContain(modelNodeId(system.engine)); // engine (package member flattened)
    expect(nodeIds).toContain(modelNodeId(system.pump)); // pump (package member flattened)
    expect(nodeIds).not.toContain(modelNodeId(system.heatEx)); // engine's drill-down content
    expect(nodeIds.filter((id) => id.startsWith('internal-port-'))).toHaveLength(0); // no boundary artifacts at root

    const edgeIds = view.edges.map((edge) => edge.id);
    expect(edgeIds).toContain(modelEdgeId(system.rootFlow));
    expect(edgeIds).not.toContain(modelEdgeId(system.nestedFlow)); // owned by engine -> only in engine's view
  });

  it('shows the engine usage node with its own ports as handles at the root level', () => {
    const system = buildEngineSystem();
    const view = projectView(system.repository.read(), {}, 'root');
    const engineNode = view.nodes.find((node) => node.id === modelNodeId(system.engine))!;
    const data = engineNode.data as { inputs: Array<{ id: string }>; outputs: Array<{ id: string }> };
    expect(data.inputs.map((port) => port.id)).toEqual([system.engineIn]);
    expect(data.outputs.map((port) => port.id)).toEqual([system.engineOut]);
  });

  it('reproduces the drill-down view: boundary artifacts + child nodes + nested edges', () => {
    const system = buildEngineSystem();
    const view = projectView(system.repository.read(), {}, system.engine);

    const nodeIds = view.nodes.map((node) => node.id);
    // Internal port artifacts for the engine's own ports (inputs left, outputs right).
    const inputArtifact = internalPortNodeId(system.engineIn, 'input');
    const outputArtifact = internalPortNodeId(system.engineOut, 'output');
    expect(nodeIds).toContain(inputArtifact);
    expect(nodeIds).toContain(outputArtifact);
    // The engine's own child renders as a node; its sibling pump does not.
    expect(nodeIds).toContain(modelNodeId(system.heatEx));
    expect(nodeIds).not.toContain(modelNodeId(system.pump));

    const inputNode = view.nodes.find((node) => node.id === inputArtifact)!;
    expect(inputNode.type).toBe('internalPort');
    expect(inputNode.position).toEqual({ x: 20, y: 150 }); // legacy left column default
    expect((inputNode.data as { portType: string }).portType).toBe('input');
    expect(portIdFromInternalPortNodeId(inputNode.id)).toBe(system.engineIn);

    const outputNode = view.nodes.find((node) => node.id === outputArtifact)!;
    expect(outputNode.position).toEqual({ x: 800, y: 150 }); // legacy right column default

    // Nested boundary flow: engine.fuelIn (artifact source handle) -> heatEx.hxIn (handle, target).
    const nestedEdge = view.edges.find((edge) => edge.id === modelEdgeId(system.nestedFlow))!;
    expect(nestedEdge.source).toBe(inputArtifact);
    expect(nestedEdge.sourceHandle).toBe(`${inputArtifact}-source`); // InternalPortNode input artifacts expose a source handle
    expect(nestedEdge.target).toBe(modelNodeId(system.heatEx));
    expect(nestedEdge.targetHandle).toBe(portHandleId(modelNodeId(system.heatEx), 'hxIn', 'input'));
    expect(view.omittedRelationshipIds).toEqual([]);
  });

  it('honours presentation positions for draggable boundary artifacts', () => {
    const system = buildEngineSystem();
    const presentation = setPresentation({}, system.engineIn, { position: { x: 40, y: 333 } });
    const view = projectView(system.repository.read(), presentation, system.engine);
    const artifact = view.nodes.find((node) => node.id === internalPortNodeId(system.engineIn, 'input'))!;
    expect(artifact.position).toEqual({ x: 40, y: 333 });
  });

  it('creates nested usages and connects ports through the repository (round trip)', () => {
    const system = buildEngineSystem();

    // Drop a new child part into the engine drill-down.
    const created = createUsageInView(system.repository, {
      scopeId: system.engine,
      kind: 'part',
      name: 'cooler',
      definitionId: system.pumpDef
    });
    expect(created.ok).toBe(true);
    const coolerId = created.value!.id;

    const viewAfterAdd = projectView(system.repository.read(), {}, system.engine);
    expect(viewAfterAdd.nodes.map((node) => node.id)).toContain(modelNodeId(coolerId));

    // Connect a new nested flow cooler.hxOut-like port -> engine boundary.
    const connected = connectInView(system.repository, {
      scopeId: system.engine,
      type: 'flow',
      sourcePortId: system.heatExOut,
      targetPortId: system.engineOut,
      name: 'coolingReturn'
    });
    expect(connected.ok).toBe(true);
    const flowId = connected.value!.id;

    const view = projectView(system.repository.read(), {}, system.engine);
    const edge = view.edges.find((candidate) => candidate.id === modelEdgeId(flowId))!;
    expect(edge.source).toBe(modelNodeId(system.heatEx));
    expect(edge.sourceHandle).toBe(portHandleId(modelNodeId(system.heatEx), 'hxOut', 'output'));
    expect(edge.target).toBe(internalPortNodeId(system.engineOut, 'output'));
    expect(edge.targetHandle).toBe(`${internalPortNodeId(system.engineOut, 'output')}-target`);

    // The edit survives a serialization round trip.
    const readBack = system.repository.serializeReadBack();
    expect(readBack.elements[flowId]).toBeDefined();
  });

  it('rejects connects whose endpoints are not port usages', () => {
    const system = buildEngineSystem();
    const result = connectInView(system.repository, {
      scopeId: system.engine,
      type: 'flow',
      sourcePortId: system.heatEx, // a part usage, not a port
      targetPortId: system.engineIn
    });
    expect(result.ok).toBe(false);
    expect(result.diagnostics[0].ruleId).toBe('WF004-connection-ends');
  });

  it('cascades a usage delete across its nested content and boundary flows', () => {
    const system = buildEngineSystem();

    const removed = cascadeDelete(system.repository, system.engine);
    expect(removed.ok).toBe(true);

    const document = system.repository.read();
    for (const id of [
      system.engine,
      system.engineIn,
      system.engineOut,
      system.heatEx,
      system.heatExIn,
      system.heatExOut,
      system.nestedFlow,
      system.rootFlow // references engine.shaftOut, so it must go too
    ]) {
      expect(document.elements[id]).toBeUndefined();
    }
    // Unrelated content survives.
    expect(document.elements[system.pump]).toBeDefined();
    expect(document.elements[system.pumpIn]).toBeDefined();
    expect(document.elements[system.engineDef]).toBeDefined();
  });

  it('rolls back when deleting an element that external content depends on', () => {
    const system = buildEngineSystem();

    // engine usage is typed by engineDef; silently removing the definition
    // would dangle that reference, so the transaction must roll back.
    const result = cascadeDelete(system.repository, system.engineDef);
    expect(result.ok).toBe(false);
    expect(system.repository.getElement(system.engineDef)).toBeDefined();
    expect(system.repository.getElement(system.engine)).toBeDefined();
  });
});
