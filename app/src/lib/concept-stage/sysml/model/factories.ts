import { generateId } from '$lib/shared/identifiers';
import { getMetaclassInfo } from './metaclassRegistry';
import { SYSML_NORMATIVE } from './normativeConfig';
import { registerOwnedElement, requireOwner, requirePortOwner } from './ownership';
import type {
  AttributeDefinitionElement,
  AttributeUsageElement,
  ElementId,
  ItemDefinitionElement,
  ItemUsageElement,
  PackageElement,
  PartDefinitionElement,
  PartUsageElement,
  PortDefinitionElement,
  PortUsageElement,
  RootNamespace,
  SysmlDocument
} from './elements';

const idFor = (document: SysmlDocument, prefix: string): ElementId => {
  // generateId() checks its candidate against the supplied list, so the
  // prefix must be excluded from the comparison or same-metaclass elements
  // could collide. Loop on the full prefixed id to guarantee uniqueness.
  let id = `${prefix}${generateId([])}`;
  while (document.elements[id]) {
    id = `${prefix}${generateId([])}`;
  }
  return id;
};

function requireElement(document: SysmlDocument, id: ElementId, role: string): void {
  if (!document.elements[id]) throw new Error(`${role} ${id} does not exist`);
}

function requireDefinition(document: SysmlDocument, id: ElementId, expectedMetaclass: string, role: string): void {
  requireElement(document, id, role);
  const metaclass = document.elements[id].metaclass;
  if (metaclass !== expectedMetaclass) throw new Error(`${role} ${id} is not a ${expectedMetaclass}`);
}

type FactoryMetaclass =
  | 'package'
  | 'partDefinition'
  | 'itemDefinition'
  | 'portDefinition'
  | 'attributeDefinition'
  | 'partUsage'
  | 'itemUsage'
  | 'portUsage'
  | 'attributeUsage';

/**
 * Build the id/metaclass/name/ownerId base. The id prefix is derived from the
 * metaclass registry (single source of truth) instead of being duplicated
 * here; `requireOwner` runs first so a rejected add leaves no partial state.
 */
const createElementBase = <T extends FactoryMetaclass>(
  document: SysmlDocument,
  metaclass: T,
  name: string,
  ownerId: ElementId | null
) => {
  requireOwner(document, ownerId);
  return {
    id: idFor(document, getMetaclassInfo(metaclass).idPrefix),
    metaclass,
    name,
    ownerId
  };
};

export function createDocument(name: string): SysmlDocument {
  const root: RootNamespace = { id: 'root', name, memberIds: [] };
  return {
    schemaVersion: 1,
    normativeRelease: SYSML_NORMATIVE.releaseId,
    root,
    elements: {}
  };
}

export function addPackage(document: SysmlDocument, name: string, ownerId: ElementId | null = null): PackageElement {
  const element = {
    ...createElementBase(document, 'package', name, ownerId),
    memberIds: []
  } satisfies PackageElement;
  document.elements[element.id] = element;
  registerOwnedElement(document, element.id, ownerId);
  return element;
}

export function addPartDefinition(document: SysmlDocument, name: string, ownerId: ElementId | null = null): PartDefinitionElement {
  const element = {
    ...createElementBase(document, 'partDefinition', name, ownerId),
    category: 'definition',
    ownedUsageIds: [],
    attributeIds: []
  } satisfies PartDefinitionElement;
  document.elements[element.id] = element;
  registerOwnedElement(document, element.id, ownerId);
  return element;
}

export function addItemDefinition(document: SysmlDocument, name: string, ownerId: ElementId | null = null): ItemDefinitionElement {
  const element = {
    ...createElementBase(document, 'itemDefinition', name, ownerId),
    category: 'definition',
    ownedUsageIds: [],
    attributeIds: []
  } satisfies ItemDefinitionElement;
  document.elements[element.id] = element;
  registerOwnedElement(document, element.id, ownerId);
  return element;
}

export function addPortDefinition(document: SysmlDocument, name: string, ownerId: ElementId | null = null): PortDefinitionElement {
  const element = {
    ...createElementBase(document, 'portDefinition', name, ownerId),
    category: 'definition',
    flowFeatureIds: []
  } satisfies PortDefinitionElement;
  document.elements[element.id] = element;
  registerOwnedElement(document, element.id, ownerId);
  return element;
}

export function addAttributeDefinition(document: SysmlDocument, name: string, ownerId: ElementId | null = null): AttributeDefinitionElement {
  const element = {
    ...createElementBase(document, 'attributeDefinition', name, ownerId),
    category: 'definition'
  } satisfies AttributeDefinitionElement;
  document.elements[element.id] = element;
  registerOwnedElement(document, element.id, ownerId);
  return element;
}

export function addPartUsage(document: SysmlDocument, name: string, definitionId: ElementId, ownerId: ElementId | null = null): PartUsageElement {
  requireDefinition(document, definitionId, 'partDefinition', 'Part definition');
  const element = {
    ...createElementBase(document, 'partUsage', name, ownerId),
    category: 'usage',
    definitionId,
    ownedUsageIds: [],
    attributeIds: []
  } satisfies PartUsageElement;
  document.elements[element.id] = element;
  registerOwnedElement(document, element.id, ownerId);
  return element;
}

export function addItemUsage(document: SysmlDocument, name: string, definitionId: ElementId, ownerId: ElementId | null = null): ItemUsageElement {
  requireDefinition(document, definitionId, 'itemDefinition', 'Item definition');
  const element = {
    ...createElementBase(document, 'itemUsage', name, ownerId),
    category: 'usage',
    definitionId,
    ownedUsageIds: []
  } satisfies ItemUsageElement;
  document.elements[element.id] = element;
  registerOwnedElement(document, element.id, ownerId);
  return element;
}

export function addPortUsage(
  document: SysmlDocument,
  name: string,
  definitionId: ElementId,
  ownerId: ElementId,
  direction?: PortUsageElement['direction']
): PortUsageElement {
  requireDefinition(document, definitionId, 'portDefinition', 'Port definition');
  requirePortOwner(document, ownerId);
  const element = {
    ...createElementBase(document, 'portUsage', name, ownerId),
    category: 'usage',
    definitionId,
    ...(direction ? { direction } : {})
  } satisfies PortUsageElement;
  document.elements[element.id] = element;
  registerOwnedElement(document, element.id, ownerId);
  return element;
}

export function addAttributeUsage(
  document: SysmlDocument,
  name: string,
  definitionId: ElementId,
  ownerId: ElementId | null = null,
  literal?: AttributeUsageElement['literal']
): AttributeUsageElement {
  requireDefinition(document, definitionId, 'attributeDefinition', 'Attribute definition');
  const element = {
    ...createElementBase(document, 'attributeUsage', name, ownerId),
    category: 'usage',
    definitionId,
    ...(literal === undefined ? {} : { literal })
  } satisfies AttributeUsageElement;
  document.elements[element.id] = element;
  registerOwnedElement(document, element.id, ownerId);
  return element;
}
