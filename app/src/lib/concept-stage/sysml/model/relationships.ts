import { generateId } from '$lib/shared/identifiers';
import { getMetaclassInfo } from './metaclassRegistry';
import type { MetaclassKey } from './metaclassRegistry';
import { registerOwnedElement, requireOwner } from './ownership';
import type {
  BindingConnectorAsUsageElement,
  ConnectionDefinitionElement,
  ConnectionUsageElement,
  ElementId,
  FlowUsageElement,
  NonOwningMembershipElement,
  OwningMembershipElement,
  SysmlDocument
} from './elements';

const createId = (document: SysmlDocument, metaclass: MetaclassKey): ElementId => {
  // Same prefix-aware uniqueness loop as the element factories — generateId()
  // compares the bare candidate, so the full prefixed id must be re-checked.
  const prefix = getMetaclassInfo(metaclass).idPrefix;
  let id = `${prefix}${generateId([])}`;
  while (document.elements[id]) {
    id = `${prefix}${generateId([])}`;
  }
  return id;
};

function addElement<T extends { id: ElementId; ownerId: ElementId | null }>(document: SysmlDocument, element: T): T {
  // Validate before inserting so a rejected add leaves no partial state.
  requireOwner(document, element.ownerId);
  document.elements[element.id] = element as never;
  registerOwnedElement(document, element.id, element.ownerId);
  return element;
}

export function addOwningMembership(
  document: SysmlDocument,
  memberElementId: ElementId,
  owningNamespaceId: ElementId | null,
  memberShortName?: string
): OwningMembershipElement {
  return addElement(document, {
    id: createId(document, 'owningMembership'),
    metaclass: 'owningMembership',
    name: memberShortName ?? '',
    ownerId: owningNamespaceId,
    memberElementId,
    owningNamespaceId,
    ...(memberShortName ? { memberShortName } : {})
  });
}

export function addMembership(
  document: SysmlDocument,
  memberElementId: ElementId,
  owningNamespaceId: ElementId | null,
  memberShortName?: string
): NonOwningMembershipElement {
  return addElement(document, {
    id: createId(document, 'membership'),
    metaclass: 'membership',
    name: memberShortName ?? '',
    ownerId: owningNamespaceId,
    memberElementId,
    owningNamespaceId,
    ...(memberShortName ? { memberShortName } : {})
  });
}

export function addConnectionDefinition(
  document: SysmlDocument,
  name: string,
  endIds: ElementId[] = [],
  ownerId: ElementId | null = null
): ConnectionDefinitionElement {
  return addElement(document, {
    id: createId(document, 'connectionDefinition'),
    metaclass: 'connectionDefinition',
    category: 'definition',
    name,
    ownerId,
    endIds: [...endIds],
    isSufficient: true
  });
}

export function addConnectionUsage(
  document: SysmlDocument,
  name: string,
  endA: ElementId,
  endB: ElementId,
  connectionDefinitionId: ElementId | null = null,
  ownerId: ElementId | null = null
): ConnectionUsageElement {
  return addElement(document, {
    id: createId(document, 'connectionUsage'),
    metaclass: 'connectionUsage',
    category: 'relationship',
    name,
    ownerId,
    endA,
    endB,
    connectionDefinitionId
  });
}

export function addBindingConnectorAsUsage(
  document: SysmlDocument,
  name: string,
  endA: ElementId,
  endB: ElementId,
  ownerId: ElementId | null = null
): BindingConnectorAsUsageElement {
  return addElement(document, {
    id: createId(document, 'bindingConnectorAsUsage'),
    metaclass: 'bindingConnectorAsUsage',
    category: 'relationship',
    name,
    ownerId,
    endA,
    endB
  });
}

/**
 * Creates the serialized `FlowUsage` shape identified in SysML.json. The
 * plan's UI-level "flow connection" terminology is deliberately not stored as
 * a nonexistent `FlowConnectionUsage` JSON type.
 */
export function addFlowUsage(
  document: SysmlDocument,
  name: string,
  sourceEnd: ElementId,
  targetEnd: ElementId,
  flowDefinitionId: ElementId | null = null,
  ownerId: ElementId | null = null
): FlowUsageElement {
  return addElement(document, {
    id: createId(document, 'flowUsage'),
    metaclass: 'flowUsage',
    category: 'relationship',
    name,
    ownerId,
    sourceEnd,
    targetEnd,
    flowDefinitionId
  });
}
