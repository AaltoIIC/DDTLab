import type { Edge, Node } from '@xyflow/svelte';
import type {
  BindingConnectorAsUsageElement,
  ConnectionUsageElement,
  ElementId,
  FlowUsageElement,
  PackageElement,
  PortUsageElement,
  SysmlDocument
} from '../model';
import { collectViewElements, type ViewScopeId } from '../model/viewScoping';
import { getPresentation, type PresentationMap } from '../presentation/presentationMap';
import { modelEdgeId, modelNodeId, portHandleId, projectUsageNode } from './modelToCanvas';

/**
 * Owner-scoped projection — the semantic counterpart of the legacy
 * `nodeViewStore` drill-down. `scopeId` is 'root' for the system level or a
 * part/item usage id for its internal diagram.
 *
 * Rendering contract (kept identical to the current UI):
 * - the scope usage's own port usages become `internalPort` boundary nodes
 *   (inputs left column, outputs right column) — a rendering artifact whose
 *   identity is the *semantic port id*, so renames never break boundary edges;
 * - the scope's owned child usages render as nodes, packages flatten into the
 *   same level (they are overlays, not navigable views);
 * - relationships owned by the visible containers render as edges whose
 *   endpoints attach to a child node's port handle or to a boundary node;
 * - a relationship whose endpoint resolves outside the view is omitted and
 *   reported (it belongs to a deeper level or is dangling).
 */
export interface ProjectViewResult {
  nodes: Node[];
  edges: Edge[];
  /** Semantic relationship ids that could not be drawn at this level. */
  omittedRelationshipIds: ElementId[];
}

const INPUT_COLUMN_X = 20;
const OUTPUT_COLUMN_X = 800;
const COLUMN_TOP_Y = 150;
const COLUMN_STEP_Y = 100;

/** Stable canvas id for a boundary-port artifact node. */
export function internalPortNodeId(portId: ElementId, side: 'input' | 'output'): string {
  return `internal-port-${side}-${portId}`;
}

/** Recover the semantic port id carried by an internal-port artifact id. */
export function portIdFromInternalPortNodeId(nodeId: string): ElementId | undefined {
  const match = /^internal-port-(input|output)-(.+)$/.exec(nodeId);
  return match ? match[2] : undefined;
}

export function projectView(
  document: SysmlDocument,
  presentation: PresentationMap,
  scopeId: ViewScopeId
): ProjectViewResult {
  const collected = collectViewElements(document, scopeId);

  const scope = scopeId === 'root' ? null : document.elements[scopeId];
  const visibleNodeIds = new Set(collected.nodes.map((node) => node.id));

  const nodes: Node[] = [];
  for (const element of collected.nodes) {
    const view = getPresentation(presentation, element.id);
    if (element.metaclass === 'package') {
      nodes.push(packageNode(element, view));
    } else {
      nodes.push(projectUsageNode(element, document, view));
    }
  }

  // Boundary artifacts: the usage's own ports, one node per port on the side
  // matching its direction. Positions follow the legacy nodeViewStore layout
  // unless the presentation map overrides them (ports are draggable today).
  const boundaryByPortId = new Map<ElementId, Node>();
  const sideCount = { input: 0, output: 0 };
  for (const port of collected.boundaryPorts) {
    const side: 'input' | 'output' = port.direction === 'out' ? 'output' : 'input';
    const index = sideCount[side]++;
    const view = getPresentation(presentation, port.id);
    const nodeId = internalPortNodeId(port.id, side);
    const node: Node = {
      id: nodeId,
      type: 'internalPort',
      position: view.position ?? (side === 'input'
        ? { x: INPUT_COLUMN_X, y: COLUMN_TOP_Y + index * COLUMN_STEP_Y }
        : { x: OUTPUT_COLUMN_X, y: COLUMN_TOP_Y + index * COLUMN_STEP_Y }),
      data: {
        modelId: port.id,
        name: port.name,
        direction: port.direction,
        portType: side,
        parentNodeId: scope?.id,
        isInternal: true
      },
      draggable: true,
      deletable: false
    };
    boundaryByPortId.set(port.id, node);
    nodes.push(node);
  }

  const edges: Edge[] = [];
  const omittedRelationshipIds: ElementId[] = [];
  for (const relationship of collected.relationships) {
    const edge = projectRelationshipEdge(document, relationship, { visibleNodeIds, boundaryByPortId });
    if (edge) edges.push(edge);
    else omittedRelationshipIds.push(relationship.id);
  }

  return { nodes, edges, omittedRelationshipIds };
}

function packageNode(element: PackageElement, view: ReturnType<typeof getPresentation>): Node {
  return {
    id: modelNodeId(element.id),
    type: 'package',
    position: view.position ?? { x: 0, y: 0 },
    data: { modelId: element.id, name: element.name },
    ...(view.width === undefined ? {} : { width: view.width }),
    ...(view.height === undefined ? {} : { height: view.height })
  };
}

type BoundaryLookup = Map<ElementId, Node>;

interface EdgeAnchor {
  nodeId: string;
  /** Boundary artifacts are whole-node anchors; child nodes anchor at a port handle. */
  kind: 'boundary' | 'node';
  /** For boundary anchors: which side the artifact renders on. */
  portSide?: 'input' | 'output';
}

/**
 * Resolve a relationship endpoint to a canvas anchor at this view level.
 * Returns undefined when the endpoint lives outside the visible scope.
 */
function resolveEndpoint(
  document: SysmlDocument,
  endpointId: ElementId,
  visibleNodeIds: Set<ElementId>,
  boundaryByPortId: BoundaryLookup
): EdgeAnchor | undefined {
  const endpoint = document.elements[endpointId];
  if (!endpoint) return undefined;

  // A usage endpoint anchors at the node itself (feature-level binding).
  if (endpoint.metaclass === 'partUsage' || endpoint.metaclass === 'itemUsage') {
    return visibleNodeIds.has(endpoint.id) ? { nodeId: modelNodeId(endpoint.id), kind: 'node' } : undefined;
  }
  if (endpoint.metaclass !== 'portUsage') return undefined;

  const boundary = boundaryByPortId.get(endpoint.id);
  if (boundary) {
    return {
      nodeId: boundary.id,
      kind: 'boundary',
      portSide: (boundary.data as { portType?: string }).portType === 'output' ? 'output' : 'input'
    };
  }
  if (endpoint.ownerId !== null && visibleNodeIds.has(endpoint.ownerId)) {
    return { nodeId: modelNodeId(endpoint.ownerId), kind: 'node' };
  }
  return undefined;
}

function projectRelationshipEdge(
  document: SysmlDocument,
  relationship: FlowUsageElement | ConnectionUsageElement | BindingConnectorAsUsageElement,
  context: { visibleNodeIds: Set<ElementId>; boundaryByPortId: BoundaryLookup }
): Edge | undefined {
  const { visibleNodeIds, boundaryByPortId } = context;

  const isFlow = relationship.metaclass === 'flowUsage';
  const isConnection = relationship.metaclass === 'connectionUsage';
  const isBinding = relationship.metaclass === 'bindingConnectorAsUsage';

  const first = isFlow ? relationship.sourceEnd : relationship.endA;
  const second = isFlow ? relationship.targetEnd : relationship.endB;

  const source = resolveEndpoint(document, first, visibleNodeIds, boundaryByPortId);
  const target = resolveEndpoint(document, second, visibleNodeIds, boundaryByPortId);
  if (!source || !target) return undefined;

  // Port endpoints on child nodes attach to the source's output side and the
  // target's input side (the legacy handle scheme). Boundary artifacts expose
  // a single real handle each (`${id}-source` for input ports, `${id}-target`
  // for output ports) mirroring InternalPortNode.svelte; usage-level
  // endpoints are whole-node anchors without a handle.
  const sourceHandle = isBinding ? undefined : handleForEndpoint(document, first, source, 'source');
  const targetHandle = isBinding ? undefined : handleForEndpoint(document, second, target, 'target');

  const connectionType = isFlow ? 'flow' : isConnection ? 'connection' : 'binding';
  return {
    id: modelEdgeId(relationship.id),
    source: source.nodeId,
    target: target.nodeId,
    ...(sourceHandle === undefined ? {} : { sourceHandle }),
    ...(targetHandle === undefined ? {} : { targetHandle }),
    type: 'default',
    data: { modelId: relationship.id, connectionType }
  };
}

function handleForEndpoint(
  document: SysmlDocument,
  endpointId: ElementId,
  anchor: EdgeAnchor,
  role: 'source' | 'target'
): string | undefined {
  if (anchor.kind === 'boundary') {
    // Boundary artifacts are directional: an input port (left column) owns a
    // `source` handle, an output port (right column) owns a `target` handle.
    const side = anchor.portSide ?? 'input';
    if (role === 'source' && side === 'input') return `${anchor.nodeId}-source`;
    if (role === 'target' && side === 'output') return `${anchor.nodeId}-target`;
    return undefined;
  }
  const endpoint = document.elements[endpointId];
  if (endpoint?.metaclass !== 'portUsage' || endpoint.ownerId === null) return undefined;
  const side = role === 'source' ? 'output' : 'input';
  // Name-based on purpose: it must equal the handle the live PortHandles
  // component renders for the child node, and the authoring layer parses names
  // back to port usages (port ids are stable only on boundary artifacts).
  return portHandleId(modelNodeId(endpoint.ownerId), endpoint.name ?? String(endpoint.id), side);
}
