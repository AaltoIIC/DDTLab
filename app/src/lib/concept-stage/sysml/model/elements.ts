/**
 * Abstract-syntax model types — Phase 0 sketch (plan §3, §4).
 *
 * Persistence-first data model (plan §1 review correction): plain serializable
 * data + a repository (Phase 2), not class instances. Identity, ownership,
 * typing, memberships and relationship ends are modeled explicitly so the
 * persisted model can represent the selected abstract-syntax metaclasses.
 * Presentation data (positions, colors, compatibility) NEVER lives here —
 * it goes to the presentation map keyed by element id (decision 13).
 */
import type { MetaclassKey } from './metaclassRegistry';

/** every id is produced by generateId() with the metaclass prefix (decision 14). */
export type ElementId = string;

/** Base of every element in the semantic model. */
export interface BaseElement {
  id: ElementId;
  metaclass: MetaclassKey;
  /** Non-unique display name; uniqueness is enforced per namespace (WF001). */
  name: string;
  /** Owning namespace/element id; null only for the root namespace. */
  ownerId: ElementId | null;
  declaredShortName?: string;
  /** Comment bodies attached to this element (emitted as `Comment` on export). */
  documentation?: string;
}

/* ── Namespaces ──────────────────────────────────────────────────────────── */

export interface PackageElement extends BaseElement {
  metaclass: 'package';
  /** Child members in ownership order (Membership-style links, Phase 1). */
  memberIds: ElementId[];
}

/** Single synthetic root per system model (WF007 — exactly one). */
export interface RootNamespace {
  id: ElementId;
  name: string;
  memberIds: ElementId[];
}

/* ── Definitions ─────────────────────────────────────────────────────────── */

interface DefinitionBase extends BaseElement {
  category: 'definition';
}

export interface PartDefinitionElement extends DefinitionBase {
  metaclass: 'partDefinition';
  /** Nested part usages owned by this definition (from partRefs). */
  ownedUsageIds: ElementId[];
  attributeIds: ElementId[];
}

export interface ItemDefinitionElement extends DefinitionBase {
  metaclass: 'itemDefinition';
  ownedUsageIds: ElementId[];
  attributeIds: ElementId[];
}

export interface PortDefinitionElement extends DefinitionBase {
  metaclass: 'portDefinition';
  /** Flow features declared on this port type (direction + typed payload). */
  flowFeatureIds: ElementId[];
}

export interface AttributeDefinitionElement extends DefinitionBase {
  metaclass: 'attributeDefinition';
  attributeType?: ElementId;
}

/* ── Usages ──────────────────────────────────────────────────────────────── */

interface UsageBase extends BaseElement {
  category: 'usage';
  /** Immutable definition id — never a name (decision 10). */
  definitionId: ElementId | null;
}

export interface PartUsageElement extends UsageBase {
  metaclass: 'partUsage';
  /** Usages nested inside this part (drill-down content, Phase 3). */
  ownedUsageIds: ElementId[];
  attributeIds: ElementId[];
}

export interface ItemUsageElement extends UsageBase {
  metaclass: 'itemUsage';
  ownedUsageIds: ElementId[];
}

export interface PortUsageElement extends UsageBase {
  metaclass: 'portUsage';
  /** UI direction is presentation; normative direction lives on flow ends. */
  direction?: 'in' | 'out' | 'inout';
}

export interface AttributeUsageElement extends UsageBase {
  metaclass: 'attributeUsage';
  /** Literal value support (decision 4). */
  literal?: string | number | boolean;
  isReference?: boolean;
}

/* ── Relationships ───────────────────────────────────────────────────────── */

interface RelationshipBase extends BaseElement {
  category: 'relationship';
}

/** ConnectionUsage — typed by a ConnectionDefinition; ends are feature refs. */
export interface ConnectionUsageElement extends RelationshipBase {
  metaclass: 'connectionUsage';
  connectionDefinitionId: ElementId | null;
  /** Semantic endpoints — PortUsage/feature ids, never XYFlow handle strings. */
  endA: ElementId;
  endB: ElementId;
}

/** BindingConnectorAsUsage — binds two resolvable, type-compatible features. */
export interface BindingConnectorAsUsageElement extends RelationshipBase {
  metaclass: 'bindingConnectorAsUsage';
  endA: ElementId;
  endB: ElementId;
}

/**
 * Serialized flow relationship (SysML.json `FlowUsage` shape). The plan's
 * `FlowConnectionUsage` name has no JSON @type in this release, so the model
 * type is `FlowUsage`; `flowConnectionUsage` stays in the registry only as
 * traceability for the UI-level "flow connection" mapping.
 */
export interface FlowUsageElement extends RelationshipBase {
  metaclass: 'flowUsage';
  sourceEnd: ElementId;
  targetEnd: ElementId;
  flowDefinitionId: ElementId | null;
}

/** Comment attached `about` an element; body survives interchange. */
export interface CommentElement extends RelationshipBase {
  metaclass: 'comment';
  body: string;
  aboutIds: ElementId[];
}

export interface ConnectionDefinitionElement extends BaseElement {
  metaclass: 'connectionDefinition';
  category: 'definition';
  endIds: ElementId[];
  isSufficient: true;
}

/* ── Membership (KerML ownership links) ──────────────────────────────────── */

export interface MembershipElement extends BaseElement {
  metaclass: 'membership' | 'owningMembership' | 'variantMembership';
  memberElementId: ElementId;
  memberShortName?: string;
}

/** Explicit ownership link corresponding to KerML OwningMembership. */
export interface OwningMembershipElement extends MembershipElement {
  metaclass: 'owningMembership';
  owningNamespaceId: ElementId | null;
}

/** Non-owning membership link, retained for future shared memberships. */
export interface NonOwningMembershipElement extends MembershipElement {
  metaclass: 'membership';
  owningNamespaceId: ElementId | null;
}

/* ── Document root ───────────────────────────────────────────────────────── */

/** Serializable document — the persisted per-system semantic model. */
export interface SysmlDocument {
  /** Schema version for forward-compatible migrations. */
  schemaVersion: 1;
  normativeRelease: '20250201';
  root: RootNamespace;
  elements: Record<ElementId, AnySysmlElement>;
}

export type AnySysmlElement =
  | PackageElement
  | PartDefinitionElement
  | ItemDefinitionElement
  | PortDefinitionElement
  | AttributeDefinitionElement
  | ConnectionDefinitionElement
  | PartUsageElement
  | ItemUsageElement
  | PortUsageElement
  | AttributeUsageElement
  | FlowUsageElement
  | ConnectionUsageElement
  | BindingConnectorAsUsageElement
  | CommentElement
  | OwningMembershipElement
  | NonOwningMembershipElement;

export type AnyDefinition =
  | PartDefinitionElement
  | ItemDefinitionElement
  | PortDefinitionElement
  | AttributeDefinitionElement
  | ConnectionDefinitionElement;

export type AnyUsage =
  | PartUsageElement
  | ItemUsageElement
  | PortUsageElement
  | AttributeUsageElement;
