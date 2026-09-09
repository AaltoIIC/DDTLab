import { generateId } from '$lib/shared/identifiers';
import type { AnySysmlElement, ElementId } from '../model';
import { getMetaclassInfo, type MetaclassKey } from '../model/metaclassRegistry';
import { getOwnedIds } from '../model/namespaces';
import type { ModelRepository } from '../repo/ModelRepository';
import type { MutationResult } from '../repo/diagnostics';

/**
 * Nested editing intents — the canvas → model commands a drill-down view
 * issues against the repository. These mirror the UI actions available inside
 * a part/item view: create a child usage, connect two port usages, and delete
 * a node with its whole nested content.
 *
 * Every command is atomic: `create`-style intents go through the repository's
 * single-commit path, and deletes cascade inside one transaction so a partial
 * removal can never be committed.
 */

/**
 * Mint a fresh semantic id for `metaclass` that is free in this repository.
 *
 * The 6-character value comes from the shared `generateId` helper (decision 14:
 * reuse `shared/identifiers.ts`, no new ID library), prefixed per metaclass
 * from the registry. generateId compares the bare candidate against the
 * supplied list, so the per-prefix suffixes already present in the repository
 * are passed in — the returned id is then provably free in one call, with no
 * collision loop needed.
 */
export function nextModelId(repository: ModelRepository, metaclass: MetaclassKey): ElementId {
  const prefix = getMetaclassInfo(metaclass).idPrefix;
  const usedSuffixes = Object.values(repository.read().elements)
    .map((element) => element.id)
    .filter((id) => id.startsWith(prefix))
    .map((id) => id.slice(prefix.length));
  return `${prefix}${generateId(usedSuffixes)}`;
}

export interface CreateUsageIntent {
  /** Owning part/item usage or package; null means the document root. */
  scopeId: ElementId | null;
  kind: 'part' | 'item';
  name: string;
  /** Must resolve to a part/item definition already in the model. */
  definitionId: ElementId;
}

/** Create a part/item usage owned by the current view scope. */
export function createUsageInView(
  repository: ModelRepository,
  intent: CreateUsageIntent
): MutationResult<AnySysmlElement> {
  const id = nextModelId(repository, intent.kind === 'part' ? 'partUsage' : 'itemUsage');
  const element: AnySysmlElement = intent.kind === 'part'
    ? {
        id,
        metaclass: 'partUsage',
        category: 'usage',
        name: intent.name,
        ownerId: intent.scopeId,
        definitionId: intent.definitionId,
        ownedUsageIds: [],
        attributeIds: []
      }
    : {
        id,
        metaclass: 'itemUsage',
        category: 'usage',
        name: intent.name,
        ownerId: intent.scopeId,
        definitionId: intent.definitionId,
        ownedUsageIds: []
      };
  return repository.create(element);
}

export interface ConnectIntent {
  /** Container that owns the new relationship (the current view scope). */
  scopeId: ElementId | null;
  type: 'flow' | 'binding';
  /** Semantic port usage ids — never canvas handles. */
  sourcePortId: ElementId;
  targetPortId: ElementId;
  name?: string;
}

/**
 * Create a flow or binding relationship between two existing port usages.
 * Endpoints must already be in the model; the repository validates that the
 * owner can own members and that the referenced ports resolve.
 */
export function connectInView(repository: ModelRepository, intent: ConnectIntent): MutationResult<AnySysmlElement> {
  const document = repository.read();
  const source = document.elements[intent.sourcePortId];
  const target = document.elements[intent.targetPortId];
  if (!source || source.metaclass !== 'portUsage') {
    return { ok: false, diagnostics: [{ severity: 'error', ruleId: 'WF004-connection-ends', elementId: intent.sourcePortId, message: `Connect source ${intent.sourcePortId} is not a port usage` }] };
  }
  if (!target || target.metaclass !== 'portUsage') {
    return { ok: false, diagnostics: [{ severity: 'error', ruleId: 'WF004-connection-ends', elementId: intent.targetPortId, message: `Connect target ${intent.targetPortId} is not a port usage` }] };
  }

  const metaclass: MetaclassKey = intent.type === 'flow' ? 'flowUsage' : 'bindingConnectorAsUsage';
  const id = nextModelId(repository, metaclass);
  const element: AnySysmlElement = intent.type === 'flow'
    ? {
        id,
        metaclass: 'flowUsage',
        category: 'relationship',
        name: intent.name ?? `${source.name}_to_${target.name}`,
        ownerId: intent.scopeId,
        sourceEnd: intent.sourcePortId,
        targetEnd: intent.targetPortId,
        flowDefinitionId: null
      }
    : {
        id,
        metaclass: 'bindingConnectorAsUsage',
        category: 'relationship',
        name: intent.name ?? `bind_${source.name}_${target.name}`,
        ownerId: intent.scopeId,
        endA: intent.sourcePortId,
        endB: intent.targetPortId
      };
  return repository.create(element as AnySysmlElement);
}

/** Every id reference an element may hold, including comment `about` links. */
function allReferenceIds(element: AnySysmlElement): ElementId[] {
  const refs: ElementId[] = [];
  if ('definitionId' in element && element.definitionId !== null) refs.push(element.definitionId);
  if ('connectionDefinitionId' in element && element.connectionDefinitionId !== null) refs.push(element.connectionDefinitionId);
  if ('flowDefinitionId' in element && element.flowDefinitionId !== null) refs.push(element.flowDefinitionId);
  if ('endA' in element) refs.push(element.endA);
  if ('endB' in element) refs.push(element.endB);
  if ('sourceEnd' in element) refs.push(element.sourceEnd);
  if ('targetEnd' in element) refs.push(element.targetEnd);
  if ('endIds' in element) refs.push(...element.endIds);
  if ('memberElementId' in element) refs.push(element.memberElementId);
  if ('aboutIds' in element) refs.push(...(element.aboutIds as ElementId[]));
  return refs;
}

/**
 * Delete a usage and everything it owns (ports, nested usages, attributes),
 * plus every relationship/comment/membership that references the removed
 * subtree. Runs in one transaction: any dangling reference discovered by the
 * final validation rolls the whole removal back.
 */
export function cascadeDelete(repository: ModelRepository, rootId: ElementId): MutationResult<void> {
  const document = repository.read();
  if (!document.elements[rootId]) {
    return { ok: false, diagnostics: [{ severity: 'error', ruleId: 'WF006-no-dangling-refs', elementId: rootId, message: `Element ${rootId} does not exist` }] };
  }

  // Collect the owned subtree (children first so deletion is bottom-up).
  const subtree: ElementId[] = [];
  const visit = (id: ElementId): void => {
    for (const childId of getOwnedIds(document, id)) {
      if (document.elements[childId]) visit(childId);
    }
    subtree.push(id);
  };
  visit(rootId);

  const doomed = new Set(subtree);
  // Relationships/comments/memberships referencing any doomed element must go
  // first, or the final validation would report dangling endpoints.
  const referencing = Object.values(document.elements)
    .filter((element) => element.id !== rootId && !doomed.has(element.id) && allReferenceIds(element).some((ref) => doomed.has(ref)))
    .map((element) => element.id);

  return repository.transaction((transaction) => {
    for (const id of referencing) transaction.delete(id);
    for (const id of subtree) transaction.delete(id);
  });
}
