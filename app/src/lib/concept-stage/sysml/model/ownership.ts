import type { ElementId, SysmlDocument } from './elements';

const OWNING_METACLASSES = new Set([
  'package',
  'partDefinition',
  'itemDefinition',
  'partUsage',
  'itemUsage'
]);

/**
 * Validate that `ownerId` exists and is allowed to own members. Throws before
 * any element is inserted, so factory construction stays atomic: a rejected
 * add leaves the document untouched.
 */
export function requireOwner(document: SysmlDocument, ownerId: ElementId | null): void {
  if (ownerId === null) return;
  const owner = document.elements[ownerId];
  if (!owner) throw new Error(`Cannot own: owner ${ownerId} does not exist`);
  if (!OWNING_METACLASSES.has(owner.metaclass)) {
    throw new Error(`Cannot own: ${owner.metaclass} cannot own members`);
  }
}

/**
 * Register `elementId` as an owned member of `ownerId` (or of the root
 * namespace when `ownerId` is null), keeping the owner's membership list in
 * sync. Callers validate with `requireOwner` first so registration cannot
 * fail mid-mutation; this function re-validates defensively.
 *
 * This is the single place that knows which metaclasses hold ownership, so
 * the element factories and the relationship factories cannot drift apart.
 */
export function registerOwnedElement(
  document: SysmlDocument,
  elementId: ElementId,
  ownerId: ElementId | null
): void {
  requireOwner(document, ownerId);
  if (ownerId === null) {
    document.root.memberIds.push(elementId);
    return;
  }
  const owner = document.elements[ownerId];
  if (owner.metaclass === 'package') owner.memberIds.push(elementId);
  else if (
    owner.metaclass === 'partDefinition' ||
    owner.metaclass === 'itemDefinition' ||
    owner.metaclass === 'partUsage' ||
    owner.metaclass === 'itemUsage'
  ) {
    owner.ownedUsageIds.push(elementId);
  }
}
