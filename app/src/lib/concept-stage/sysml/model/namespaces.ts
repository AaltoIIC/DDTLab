import type { AnySysmlElement, ElementId, SysmlDocument } from './elements';

export function getElement(document: SysmlDocument, id: ElementId): AnySysmlElement | undefined {
  return document.elements[id];
}

export function getOwnedIds(document: SysmlDocument, ownerId: ElementId | null): ElementId[] {
  if (ownerId === null) return document.root.memberIds;
  const owner = document.elements[ownerId];
  if (!owner) return [];
  if (owner.metaclass === 'package') return owner.memberIds;
  if (owner.metaclass === 'partDefinition' || owner.metaclass === 'itemDefinition') return owner.ownedUsageIds;
  if (owner.metaclass === 'partUsage' || owner.metaclass === 'itemUsage') return owner.ownedUsageIds;
  return [];
}

export function getQualifiedName(document: SysmlDocument, id: ElementId): string | undefined {
  const element = document.elements[id];
  if (!element) return undefined;
  const names: string[] = [element.name];
  let ownerId = element.ownerId;
  while (ownerId !== null) {
    const owner = document.elements[ownerId];
    if (!owner) return undefined;
    names.unshift(owner.name);
    ownerId = owner.ownerId;
  }
  names.unshift(document.root.name);
  return names.join('::');
}

export function findByQualifiedName(document: SysmlDocument, qualifiedName: string): AnySysmlElement | undefined {
  const parts = qualifiedName.split('::').filter(Boolean);
  if (parts.length === 0 || parts[0] !== document.root.name) return undefined;

  let ownerId: ElementId | null = null;
  let current: AnySysmlElement | undefined;
  for (const name of parts.slice(1)) {
    current = getOwnedIds(document, ownerId)
      .map((id) => document.elements[id])
      .find((element) => element?.name === name);
    if (!current) return undefined;
    ownerId = current.id;
  }
  return current;
}

export function namesInNamespace(document: SysmlDocument, ownerId: ElementId | null): string[] {
  return getOwnedIds(document, ownerId)
    .map((id) => document.elements[id]?.name)
    .filter((name): name is string => name !== undefined);
}

/**
 * Port usages owned by a part usage. Derived from the ownership list rather
 * than stored separately, so there is a single source of truth.
 */
export function getPortIds(document: SysmlDocument, partUsageId: ElementId): ElementId[] {
  return getOwnedIds(document, partUsageId).filter((id) => document.elements[id]?.metaclass === 'portUsage');
}
