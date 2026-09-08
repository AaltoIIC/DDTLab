import { get, writable, type Writable } from 'svelte/store';
import type { Edge, Node } from '@xyflow/svelte';
import {
  ModelRepository,
  type SysmlDocument,
  type AnySysmlElement,
  createDocument,
  projectModelToCanvas,
  projectView,
  type PresentationMap,
  createPresentationMap,
  getPresentation,
  setPresentation,
  modelEdgeId,
  modelNodeId,
  type ProjectViewResult
} from '$lib/concept-stage/sysml';

export interface ConceptStageSemanticSession {
  repository: ModelRepository;
  presentation: PresentationMap;
  /** Legacy canvas id -> semantic model id. */
  legacyToModel: Map<string, string>;
  /** Semantic model id -> legacy canvas id. */
  modelToLegacy: Map<string, string>;
  /** Legacy edge id -> semantic relationship id. */
  legacyEdgeToModel: Map<string, string>;
  /** Semantic relationship id -> legacy edge id. */
  modelToLegacyEdge: Map<string, string>;
}

export const semanticSession: Writable<ConceptStageSemanticSession | null> = writable(null);

/** System id the current session was bound to (concept stage lifecycle). */
let boundSystemId: string | null = null;

/**
 * Bind (or lazily create) the semantic session for the open concept system.
 * A fresh system starts with an empty document: content enters the model
 * through the semantic authoring path, never by converting the legacy canvas.
 */
export function bindConceptStageSession(systemId: string, systemName: string): ConceptStageSemanticSession {
  if (boundSystemId === systemId) {
    const existing = getSemanticSession();
    if (existing) return existing;
  }
  boundSystemId = systemId;
  const session = initializeSemanticSession(systemName || 'Concept System');
  semanticSession.set(session);
  return session;
}

/** Detach the session when leaving the concept stage for this system. */
export function unbindConceptStageSession(systemId: string): void {
  if (boundSystemId !== systemId) return;
  boundSystemId = null;
  semanticSession.set(null);
}

export function createSemanticSession(document: SysmlDocument): ConceptStageSemanticSession {
  return {
    repository: new ModelRepository(document),
    presentation: createPresentationMap(),
    legacyToModel: new Map(),
    modelToLegacy: new Map(),
    legacyEdgeToModel: new Map(),
    modelToLegacyEdge: new Map()
  };
}

export function initializeSemanticSession(name: string): ConceptStageSemanticSession {
  const session = createSemanticSession(createDocument(name));
  semanticSession.set(session);
  return session;
}

export function setSemanticSession(session: ConceptStageSemanticSession): void {
  semanticSession.set(session);
}

export function getSemanticSession(): ConceptStageSemanticSession | null {
  return get(semanticSession);
}

export function registerLegacyModelId(legacyId: string, modelId: string): void {
  const session = getSemanticSession();
  if (!session) return;
  session.legacyToModel.set(legacyId, modelId);
  session.modelToLegacy.set(modelId, legacyId);
}

export function modelIdForLegacyId(legacyId: string): string | undefined {
  return getSemanticSession()?.legacyToModel.get(legacyId);
}

export function legacyIdForModelId(modelId: string): string | undefined {
  return getSemanticSession()?.modelToLegacy.get(modelId);
}

export function modelIdForLegacyEdgeId(legacyId: string): string | undefined {
  return getSemanticSession()?.legacyEdgeToModel.get(legacyId);
}

export function legacyEdgeIdForModelId(modelId: string): string | undefined {
  return getSemanticSession()?.modelToLegacyEdge.get(modelId);
}

/**
 * Project the semantic model into the existing canvas stores while retaining
 * legacy ids at the rendering boundary. New projected data carries modelId;
 * callers can gradually migrate existing components without a visual change.
 */
export function projectSemanticSessionToCanvas(): { nodes: Node[]; edges: Edge[] } {
  const session = getSemanticSession();
  if (!session) return { nodes: [], edges: [] };
  const projection = projectModelToCanvas(session.repository.read(), session.presentation);
  const nodes = projection.nodes.map((node) => {
    const modelId = String((node.data as { modelId?: string }).modelId ?? modelIdFromProjectedId(node.id));
    const legacyId = legacyIdForModelId(modelId) ?? node.id;
    registerLegacyModelId(legacyId, modelId);
    return { ...node, id: legacyId, data: { ...node.data, modelId } };
  });
  const edges = projection.edges.map((edge) => {
    const modelId = String((edge.data as { modelId?: string }).modelId ?? modelIdFromProjectedId(edge.id));
    const legacyEdgeId = session.modelToLegacyEdge.get(modelId) ?? edge.id;
    session.legacyEdgeToModel.set(legacyEdgeId, modelId);
    session.modelToLegacyEdge.set(modelId, legacyEdgeId);
    return {
      ...edge,
      id: legacyEdgeId,
      source: legacyIdForModelId(modelIdFromProjectedId(edge.source)) ?? edge.source,
      target: legacyIdForModelId(modelIdFromProjectedId(edge.target)) ?? edge.target,
      data: { ...edge.data, modelId }
    };
  });
  return { nodes, edges };
}

function modelIdFromProjectedId(id: string): string {
  return id.startsWith('n_') || id.startsWith('e_') ? id.slice(2) : id;
}

export function semanticElementFromCanvasNode(node: Pick<Node, 'id' | 'data'>): AnySysmlElement | undefined {
  const session = getSemanticSession();
  if (!session) return undefined;
  const modelId = typeof node.data === 'object' && node.data !== null && 'modelId' in node.data
    ? String((node.data as { modelId: string }).modelId)
    : modelIdForLegacyId(node.id);
  return modelId ? session.repository.getElement(modelId) : undefined;
}

export function syncPresentationFromCanvasNode(node: Pick<Node, 'id' | 'position' | 'width' | 'height'>): void {
  const session = getSemanticSession();
  if (!session) return;
  const modelId = modelIdForLegacyId(node.id);
  if (!modelId) return;
  session.presentation = {
    ...session.presentation,
    [modelId]: {
      ...session.presentation[modelId],
      position: { ...node.position },
      ...(node.width === undefined ? {} : { width: node.width }),
      ...(node.height === undefined ? {} : { height: node.height })
    }
  };
}

/* ── Model-backed drill-down (Phase 3, live wiring) ──────────────────────── */

/**
 * Whether a canvas node may be opened as a model-backed drill-down.
 *
 * Returns the semantic usage id when (a) a session is bound, (b) the node
 * maps to a part/item usage in the model, and (c) the node carries no legacy
 * nested diagram (`data.nodes`/`data.edges`) that would be lost by switching
 * the view to the model's owned content.
 */
export function semanticDrillDownScope(node: Pick<Node, 'id' | 'type' | 'data'>): string | undefined {
  const session = getSemanticSession();
  if (!session) return undefined;
  if (node.type !== 'part' && node.type !== 'item') return undefined;

  const element = semanticElementFromCanvasNode(node);
  if (!element || (element.metaclass !== 'partUsage' && element.metaclass !== 'itemUsage')) return undefined;

  const legacy = (node.data ?? {}) as { nodes?: unknown[]; edges?: unknown[] };
  if (Array.isArray(legacy.nodes) && (legacy.nodes.length > 0 || (legacy.edges?.length ?? 0) > 0)) {
    return undefined; // legacy-authored nested content: keep the legacy path
  }
  return element.id;
}

/**
 * Project a usage's drill-down view and shape it for the existing canvas
 * components (declaredName, Port-shaped inputs/outputs, internal-port data).
 * Node/edge ids are the stable model-backed ids produced by projectView.
 */
export function projectSemanticDrillDownView(scopeId: string): { nodes: Node[]; edges: Edge[] } {
  const session = getSemanticSession();
  if (!session) return { nodes: [], edges: [] };
  const document = session.repository.read();
  const scope = document.elements[scopeId];
  if (!scope || (scope.metaclass !== 'partUsage' && scope.metaclass !== 'itemUsage')) {
    return { nodes: [], edges: [] };
  }

  const raw: ProjectViewResult = projectView(document, session.presentation, scopeId);
  const scopeName = scope.name;

  const nodes: Node[] = raw.nodes.map((node) => {
    const modelId = String((node.data as { modelId?: string }).modelId ?? '');
    if (node.type === 'internalPort') {
      const portPresentation = getPresentation(session.presentation, modelId);
      return {
        ...node,
        data: {
          ...node.data,
          id: modelId,
          description: '',
          interfaceType: (portPresentation as { interfaceType?: string }).interfaceType,
          parentNodeName: scopeName
        }
      };
    }
    if (node.type === 'package') {
      return { ...node, data: { ...node.data, declaredName: node.data.name ?? '' } };
    }
    const data = node.data as { name?: string; inputs?: Array<{ id: string; name: string }>; outputs?: Array<{ id: string; name: string }> };
    return {
      ...node,
      data: {
        ...node.data,
        declaredName: data.name ?? '',
        comment: '',
        metadata: [],
        inputs: (data.inputs ?? []).map((port) => legacyPort(port.id, port.name, session)),
        outputs: (data.outputs ?? []).map((port) => legacyPort(port.id, port.name, session))
      }
    };
  });

  const edges: Edge[] = raw.edges.map((edge) => ({
    ...edge,
    data: {
      ...edge.data,
      compatibility: 'direct',
      message: ''
    }
  }));

  return { nodes, edges };
}

function legacyPort(portId: string, name: string, session: ConceptStageSemanticSession): Record<string, unknown> {
  const presentation = getPresentation(session.presentation, portId) as { interfaceType?: string };
  return {
    id: portId,
    name,
    description: '',
    ...(presentation.interfaceType === undefined ? {} : { interfaceType: presentation.interfaceType })
  };
}

/**
 * Persist canvas node positions back into the presentation map when leaving a
 * model-backed drill-down (boundary artifacts and child usages alike).
 */
export function syncDrillDownPresentation(nodes: Node[]): void {
  const session = getSemanticSession();
  if (!session) return;
  for (const node of nodes) {
    const data = node.data as { modelId?: string };
    if (!data?.modelId) continue;
    session.presentation = setPresentation(session.presentation, data.modelId, {
      position: { ...node.position },
      ...(node.width === undefined ? {} : { width: node.width }),
      ...(node.height === undefined ? {} : { height: node.height })
    });
  }
}
