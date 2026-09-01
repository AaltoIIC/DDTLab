/**
 * Barrel export for the SysML abstract-syntax model layer (Phase 0 skeleton).
 * Repository, validator, projection and interchange layers land in later phases.
 */
export { SYSML_NORMATIVE } from './normativeConfig';
export type { SysmlNormativeConfig } from './normativeConfig';
export {
  createDocument,
  addPackage,
  addPartDefinition,
  addItemDefinition,
  addPortDefinition,
  addAttributeDefinition,
  addPartUsage,
  addItemUsage,
  addPortUsage,
  addAttributeUsage
} from './factories';
export { cloneDocument, updateDocument, updateElement } from './immutable';
export {
  addOwningMembership,
  addMembership,
  addConnectionDefinition,
  addConnectionUsage,
  addBindingConnectorAsUsage,
  addFlowUsage
} from './relationships';
export {
  getElement,
  getOwnedIds,
  getQualifiedName,
  findByQualifiedName,
  namesInNamespace,
  getPortIds
} from './namespaces';
export {
  METACLASS_REGISTRY,
  METACLASS_KEYS,
  UNVERIFIED_METACLASSES,
  NORMATIVE_RELEASE,
  isSupportedMetaclass,
  getMetaclassInfo,
  assertUniquePrefixes
} from './metaclassRegistry';
export type { MetaclassKey, MetaclassCategory, MetaclassInfo } from './metaclassRegistry';
export type {
  BaseElement,
  ElementId,
  PackageElement,
  RootNamespace,
  PartDefinitionElement,
  ItemDefinitionElement,
  PortDefinitionElement,
  AttributeDefinitionElement,
  PartUsageElement,
  ItemUsageElement,
  PortUsageElement,
  AttributeUsageElement,
  FlowUsageElement,
  ConnectionDefinitionElement,
  ConnectionUsageElement,
  BindingConnectorAsUsageElement,
  CommentElement,
  MembershipElement,
  OwningMembershipElement,
  NonOwningMembershipElement,
  SysmlDocument,
  AnySysmlElement,
  AnyDefinition,
  AnyUsage
} from './elements';
