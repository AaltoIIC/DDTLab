import type { Node } from '@xyflow/svelte';
import type { AnySysmlElement, ElementId } from '../model';
import { nextModelId } from '../projection';
import { getSemanticSession, registerLegacyModelId, type ConceptStageSemanticSession } from './conceptStageSemanticSession';

/**
 * Canvas package ↔ model `Package` binding (Phase 3 saved-package wrap).
 *
 * The canvas keeps a flat, geometry-derived view: a `package` node is a
 * non-navigable overlay that visually wraps the nodes inside its rectangle.
 * Saving a canvas package (adding it to the saved-package list) also makes
 * the grouping real in the semantic model — this module creates a model
 * `Package` element for the canvas node and re-owns the mapped usage nodes
 * inside the canvas rectangle under it (plan Phase 3: "wrapping = re-ownership
 * in the model; un-wrapping = re-ownership to parent").
 *
 * The canvas stays the immediate render source. The model `Package` mirrors
 * the *saved* grouping; because `collectViewElements` flattens package
 * members into the same level, projecting the model keeps every usage node on
 * the same canvas level whether it is owned by the root or by a package.
 *
 * All functions are no-ops when no session is bound.
 */

/** Root-level package container keeps canvas-package names out of the usage namespace. */
function ensurePackageContainer(session: ConceptStageSemanticSession): ElementId {
  const document = session.repository.read();
  for (const id of document.root.memberIds) {
    const element = document.elements[id];
    if (element?.metaclass === 'package' && element.name === 'Packages') return id;
  }
  const id = nextModelId(session.repository, 'package');
  const created = session.repository.create({
    id,
    metaclass: 'package',
    name: 'Packages',
    ownerId: null,
    memberIds: []
  } as AnySysmlElement);
  if (!created.ok || !created.value) throw new Error(created.diagnostics.map((d) => d.message).join('; '));
  return created.value.id;
}

/** Create a `Package` element under the container with `name`, keeping it unique. */
function createPackageElement(session: ConceptStageSemanticSession, containerId: ElementId, name: string): ElementId {
  const document = session.repository.read();
  const container = document.elements[containerId];
  const used = new Set(
    (container?.metaclass === 'package' ? container.memberIds : []).map((id) => document.elements[id]?.name)
  );
  let uniqueName = name || 'Package';
  let index = 2;
  while (used.has(uniqueName)) uniqueName = `${name} ${index++}`;
  const id = nextModelId(session.repository, 'package');
  const created = session.repository.create({
    id,
    metaclass: 'package',
    name: uniqueName,
    ownerId: containerId,
    memberIds: []
  } as AnySysmlElement);
  if (!created.ok || !created.value) throw new Error(created.diagnostics.map((d) => d.message).join('; '));
  return created.value.id;
}

/** Model `Package` element currently bound to a canvas package node, if any. */
function modelPackageIdForCanvasNode(session: ConceptStageSemanticSession, canvasNodeId: string): ElementId | undefined {
  const modelId = session.legacyToModel.get(canvasNodeId);
  if (!modelId) return undefined;
  const element = session.repository.getElement(modelId);
  return element?.metaclass === 'package' ? modelId : undefined;
}

function packageMembers(session: ConceptStageSemanticSession, packageId: ElementId): ElementId[] {
  const element = session.repository.getElement(packageId);
  if (!element || element.metaclass !== 'package') return [];
  return [...(element as { memberIds: ElementId[] }).memberIds];
}

/**
 * Save = wrap. Make sure a model `Package` (bound to the canvas node id)
 * exists and owns the mapped usage nodes that lie inside the canvas package.
 * `insideNodes` are the canvas part/item nodes geometrically inside the
 * package; each one maps to a model usage via the session id map. Convergent
 * per canvas node: members that are no longer inside move back to the model
 * root, and usages that moved inside are re-owned under the package. Nothing
 * happens for unmapped canvas content (no session, no model elements).
 */
export function saveCanvasPackageMembers(canvasNodeId: string, name: string, insideNodes: Node[]): void {
  const session = getSemanticSession();
  if (!session) return;

  const insideModelIds: ElementId[] = insideNodes
    .filter((node) => node.type === 'part' || node.type === 'item')
    .map((node) => session.legacyToModel.get(node.id))
    .filter((modelId): modelId is string => Boolean(modelId));

  let packageId = modelPackageIdForCanvasNode(session, canvasNodeId);
  if (!packageId) {
    const containerId = ensurePackageContainer(session);
    packageId = createPackageElement(session, containerId, name);
    registerLegacyModelId(canvasNodeId, packageId);
  }

  const members = packageMembers(session, packageId);
  const toRemove = members.filter((id) => !insideModelIds.includes(id));
  const toAdd = insideModelIds.filter((id) => !members.includes(id));
  if (toRemove.length === 0 && toAdd.length === 0) return;

  session.repository.transaction((transaction) => {
    for (const memberId of toRemove) transaction.reown(memberId, null);
    for (const memberId of toAdd) transaction.reown(memberId, packageId as ElementId);
  });
}

/**
 * Un-save / delete = unwrap: move every member back to the model root, then
 * delete the package element. Members keep existing — they are just no longer
 * children of the package. No-op when the canvas package has no model element.
 */
export function deleteCanvasPackageMembers(canvasNodeId: string): void {
  const session = getSemanticSession();
  if (!session) return;
  const packageId = modelPackageIdForCanvasNode(session, canvasNodeId);
  if (!packageId) return;
  const members = packageMembers(session, packageId);
  const result = session.repository.transaction((transaction) => {
    for (const memberId of members) transaction.reown(memberId, null);
    transaction.delete(packageId);
  });
  if (!result.ok) return;
  session.legacyToModel.delete(canvasNodeId);
}

/** Rename the model package element bound to a canvas node (keep name unique). */
export function renameCanvasPackageInModel(canvasNodeId: string, name: string): void {
  const session = getSemanticSession();
  if (!session) return;
  const packageId = modelPackageIdForCanvasNode(session, canvasNodeId);
  if (!packageId) return;
  session.repository.update(packageId, { name });
}
