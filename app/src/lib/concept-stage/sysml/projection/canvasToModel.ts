import type { Edge } from '@xyflow/svelte';
import type { ElementId, SysmlDocument } from '../model';
import { ModelRepository, type ElementUpdate } from '../repo';

export interface DeleteNodeIntent {
  kind: 'delete-node';
  modelId: ElementId;
}

export interface RenameElementIntent {
  kind: 'rename';
  modelId: ElementId;
  name: string;
}

export interface DeleteEdgeIntent {
  kind: 'delete-edge';
  modelId: ElementId;
}

export interface MovePresentationIntent {
  kind: 'move';
  modelId: ElementId;
  position: { x: number; y: number };
}

export type CanvasIntent = DeleteNodeIntent | RenameElementIntent | DeleteEdgeIntent | MovePresentationIntent;

export interface IntentResult {
  ok: boolean;
  diagnostics: ReturnType<ModelRepository['delete']>['diagnostics'];
  presentation?: { modelId: ElementId; position: { x: number; y: number } };
}

/** Extract a semantic id from a projected XYFlow node id (`n_<modelId>`). */
export function modelIdFromNodeId(nodeId: string): ElementId | undefined {
  return nodeId.startsWith('n_') ? nodeId.slice(2) : undefined;
}

/** Extract a semantic id from a projected XYFlow edge id (`e_<modelId>`). */
export function modelIdFromEdgeId(edgeId: string): ElementId | undefined {
  return edgeId.startsWith('e_') ? edgeId.slice(2) : undefined;
}

/** Extract the semantic id carried in projected node/edge data when available. */
export function modelIdFromCanvasData(data: unknown): ElementId | undefined {
  if (typeof data === 'object' && data !== null && 'modelId' in data && typeof data.modelId === 'string') {
    return data.modelId;
  }
  return undefined;
}

export function applyCanvasIntent(
  repository: ModelRepository,
  intent: CanvasIntent
): IntentResult {
  if (intent.kind === 'move') {
    if (!repository.getElement(intent.modelId)) {
      return { ok: false, diagnostics: [{ severity: 'error', ruleId: 'WF006-no-dangling-refs', elementId: intent.modelId, message: `Element ${intent.modelId} does not exist` }] };
    }
    return { ok: true, diagnostics: [], presentation: { modelId: intent.modelId, position: { ...intent.position } } };
  }

  if (intent.kind === 'rename') {
    const result = repository.update(intent.modelId, { name: intent.name } as ElementUpdate);
    return { ok: result.ok, diagnostics: result.diagnostics };
  }

  return intent.kind === 'delete-node'
    ? repository.delete(intent.modelId)
    : repository.delete(intent.modelId);
}

/** Convert a projected edge into a semantic delete intent. */
export function deleteEdgeIntent(edge: Pick<Edge, 'id' | 'data'>): DeleteEdgeIntent | undefined {
  const modelId = modelIdFromCanvasData(edge.data) ?? modelIdFromEdgeId(edge.id);
  return modelId ? { kind: 'delete-edge', modelId } : undefined;
}

/** The canvas is a projection; this adapter never persists XYFlow handles. */
export function assertSemanticEdge(edge: Pick<Edge, 'id' | 'source' | 'target'>, document: SysmlDocument): void {
  if (edge.source.startsWith('n_') && edge.target.startsWith('n_')) return;
  throw new Error(`Canvas edge ${edge.id} does not reference projected semantic nodes in this model`);
}
