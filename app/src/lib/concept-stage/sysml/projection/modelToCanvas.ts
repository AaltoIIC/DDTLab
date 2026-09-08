import type { Edge, Node } from '@xyflow/svelte';
import type {
  AnySysmlElement,
  ElementId,
  PartUsageElement,
  PortUsageElement,
  SysmlDocument
} from '../model';
import { getPresentation, type PresentationMap } from '../presentation/presentationMap';

export interface ProjectedPort {
  id: ElementId;
  name: string;
  direction: 'in' | 'out' | 'inout';
  definitionId: ElementId | null;
}

export interface ProjectionResult {
  nodes: Node[];
  edges: Edge[];
}

export function modelNodeId(elementId: ElementId): string {
  return `n_${elementId}`;
}

export function modelEdgeId(elementId: ElementId): string {
  return `e_${elementId}`;
}

/**
 * Canvas handle id for a port anchor: `${nodeId}-${direction}-${portName}`.
 *
 * The port *name* (not the element id) is used so projected edges snap to the
 * handles the live `PortHandles` component renders and the authoring layer
 * resolves back (`resolveCanvasSidePort` parses the name). Names are unique
 * per node side, which keeps the handle unambiguous within a node.
 */
export function portHandleId(nodeId: string, portName: string, direction: 'input' | 'output'): string {
  return `${nodeId}-${direction}-${portName}`;
}

export function projectModelToCanvas(
  document: SysmlDocument,
  presentation: PresentationMap = {}
): ProjectionResult {
  const nodes: Node[] = [];
  const edges: Edge[] = [];

  for (const element of Object.values(document.elements)) {
    const view = getPresentation(presentation, element.id);
    if (element.metaclass === 'package') {
      nodes.push({
        id: modelNodeId(element.id),
        type: 'package',
        position: view.position ?? { x: 0, y: 0 },
        data: { modelId: element.id, name: element.name },
        ...(view.width === undefined ? {} : { width: view.width }),
        ...(view.height === undefined ? {} : { height: view.height })
      });
    } else if (element.metaclass === 'partUsage' || element.metaclass === 'itemUsage') {
      nodes.push(projectUsageNode(element, document, view));
    } else if (element.metaclass === 'connectionUsage') {
      const sourceHandle = endpointHandle(document, element.endA, 'output');
      const targetHandle = endpointHandle(document, element.endB, 'input');
      edges.push({
        id: modelEdgeId(element.id),
        source: modelNodeIdForEndpoint(document, element.endA),
        target: modelNodeIdForEndpoint(document, element.endB),
        ...(sourceHandle === undefined ? {} : { sourceHandle }),
        ...(targetHandle === undefined ? {} : { targetHandle }),
        type: 'default',
        data: { modelId: element.id, connectionType: 'connection' }
      });
    } else if (element.metaclass === 'bindingConnectorAsUsage') {
      edges.push({
        id: modelEdgeId(element.id),
        source: modelNodeIdForEndpoint(document, element.endA),
        target: modelNodeIdForEndpoint(document, element.endB),
        type: 'default',
        data: { modelId: element.id, connectionType: 'binding' }
      });
    } else if (element.metaclass === 'flowUsage') {
      const sourceHandle = endpointHandle(document, element.sourceEnd, 'output');
      const targetHandle = endpointHandle(document, element.targetEnd, 'input');
      edges.push({
        id: modelEdgeId(element.id),
        source: modelNodeIdForEndpoint(document, element.sourceEnd),
        target: modelNodeIdForEndpoint(document, element.targetEnd),
        ...(sourceHandle === undefined ? {} : { sourceHandle }),
        ...(targetHandle === undefined ? {} : { targetHandle }),
        type: 'default',
        data: { modelId: element.id, connectionType: 'flow' }
      });
    }
  }

  return { nodes, edges };
}

/**
 * Project a part/item usage into a canvas node with its owned ports as
 * input/output handle records. Shared by the flat projection and by the
 * owner-scoped view projection.
 */
export function projectUsageNode(
  element: Extract<AnySysmlElement, { metaclass: 'partUsage' | 'itemUsage' }>,
  document: SysmlDocument,
  view: ReturnType<typeof getPresentation>
): Node {
  // Both part and item usages may own port usages (Phase 1 cleanup: ports are
  // features of parts/items; items such as tanks and inlets have them).
  const ports = element.ownedUsageIds
    .map((id) => document.elements[id])
    .filter((candidate): candidate is PortUsageElement => candidate?.metaclass === 'portUsage');
  const inputs = ports.filter((port) => port.direction === 'in' || port.direction === 'inout').map(toProjectedPort);
  const outputs = ports.filter((port) => port.direction === 'out' || port.direction === 'inout').map(toProjectedPort);

  return {
    id: modelNodeId(element.id),
    type: element.metaclass === 'partUsage' ? 'part' : 'item',
    position: view.position ?? { x: 0, y: 0 },
    data: {
      modelId: element.id,
      name: element.name,
      definitionId: element.definitionId,
      inputs,
      outputs
    },
    ...(view.width === undefined ? {} : { width: view.width }),
    ...(view.height === undefined ? {} : { height: view.height })
  };
}

export function toProjectedPort(port: PortUsageElement): ProjectedPort {
  return {
    id: port.id,
    name: port.name,
    direction: port.direction ?? 'inout',
    definitionId: port.definitionId
  };
}

function modelNodeIdForEndpoint(document: SysmlDocument, endpointId: ElementId): string {
  const endpoint = document.elements[endpointId];
  if (!endpoint) return modelNodeId(endpointId);
  return modelNodeId(endpoint.ownerId ?? endpoint.id);
}

function endpointHandle(
  document: SysmlDocument,
  endpointId: ElementId,
  direction: 'input' | 'output'
): string | undefined {
  const endpoint = document.elements[endpointId];
  // A usage-level endpoint anchors at the whole node (no port handle); only
  // port usages contribute a handle.
  if (!endpoint || endpoint.metaclass === 'partUsage' || endpoint.metaclass === 'itemUsage') return undefined;
  if (endpoint.metaclass !== 'portUsage') return undefined;
  const nodeId = modelNodeIdForEndpoint(document, endpointId);
  return portHandleId(nodeId, endpoint.name ?? String(endpoint.id), direction);
}
