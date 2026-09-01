/**
 * Metaclass registry for the supported SysML v2 subset (Phase 0).
 *
 * Every entry is traceable to the pinned normative artifacts
 * (`docs/normative/sysml-v2-20250201/`, release 20250201). xmiIds,
 * generalization refs, ownedRule names and `specializesFromLibrary(...)`
 * arguments are quoted verbatim from the artifacts, so the Phase 4 validator
 * and the Phase 6 `.sysml` emitter stay table-driven from this single source
 * of truth. Cross-check source: `SysML.json` (same release).
 *
 * Honesty notes:
 * - `supertypes` lists only generalizations actually read from the artifact;
 *   an empty array means "not yet extracted", not "no supertypes".
 * - `verified: false` marks metaclasses the plan supports but whose Class
 *   element was not located in `SysML.xmi` (referenced only via documentation
 *   or derived constraints). Resolve these against `SysML.json` before Phase 6.
 * - JSON serialization authority: `SysML.json` $defs (183 defs, 175 @type
 *   constants). A metaclass present in XMI comments but absent from the JSON
 *   @type set cannot be emitted to interchange in this release. Concretely:
 *   `FlowConnectionUsage` has NO @type in SysML.json — serialize flows as
 *   `FlowUsage` / `SuccessionFlowUsage` instead.
 * - `ConnectorAsUsage` cannot itself be instantiated in a SysML model (verbatim
 *   XMI comment on Systems-Connections-ConnectorAsUsage); it is listed as the
 *   abstract base documenting the concrete connector set.
 */
import { SYSML_NORMATIVE } from './normativeConfig';

export type MetaclassCategory =
  | 'namespace'
  | 'definition'
  | 'usage'
  | 'relationship'
  | 'membership'
  | 'annotation';

export interface MetaclassInfo {
  /** Verbatim metaclass name from the normative XMI. */
  name: string;
  /** Verbatim xmi:id of the packagedElement (null when not yet located). */
  xmiId: string | null;
  /** Artifact that pins this element. */
  source: 'SysML.xmi' | 'KerML.xmi';
  category: MetaclassCategory;
  /** Direct generalizations (xmi:id refs verbatim; hrefs shortened to the referenced id). */
  supertypes: string[];
  /** ownedAttribute names read verbatim (subset). */
  attributes: string[];
  /** ownedRule names read verbatim. */
  constraints: string[];
  /** Map constraint name -> specializesFromLibrary() argument (verbatim OCL). */
  libraryBases: Record<string, string>;
  /** Element id prefix for generateId() (plan §5 Phase 0 / decision 14). */
  idPrefix: string;
  /** Abstract base — cannot be instantiated in a SysML model. */
  abstract?: boolean;
  /** False when the Class element itself was not located in the XMI. */
  verified: boolean;
  /**
   * When this metaclass has no serialized form in the release's JSON abstract
   * syntax, the registry key that represents it instead (e.g. the plan's
   * `flowConnectionUsage` serializes as `flowUsage`). Typed as string to avoid
   * a circular reference with `MetaclassKey`; consumers should treat it as a
   * registry key. Lets the Phase 6 emitter stay table-driven instead of
   * re-deriving artifact findings from prose.
   */
  serializesAs?: string;
}

export const METACLASS_REGISTRY = {
  package: {
    name: 'Package',
    xmiId: 'Kernel-Packages-Package',
    source: 'KerML.xmi',
    category: 'namespace',
    supertypes: [],
    attributes: [],
    constraints: [],
    libraryBases: {},
    idPrefix: 'pk-',
    verified: true
  },

  partDefinition: {
    name: 'PartDefinition',
    xmiId: 'Systems-Parts-PartDefinition',
    source: 'SysML.xmi',
    category: 'definition',
    supertypes: ['Systems-Items-ItemDefinition'],
    attributes: [],
    constraints: ['checkPartDefinitionSpecialization'],
    libraryBases: { checkPartDefinitionSpecialization: 'Parts::Part' },
    idPrefix: 'pd-',
    verified: true
  },
  partUsage: {
    name: 'PartUsage',
    xmiId: 'Systems-Parts-PartUsage',
    source: 'SysML.xmi',
    category: 'usage',
    supertypes: ['Systems-Items-ItemUsage'],
    attributes: ['partDefinition'],
    constraints: [
      'checkPartUsageActorSpecialization',
      'checkPartUsageSpecialization',
      'checkPartUsageStakeholderSpecialization',
      'validatePartUsagePartDefinition',
      'checkPartUsageSubpartSpecialization'
    ],
    libraryBases: {
      checkPartUsageSpecialization: 'parts',
      checkPartUsageSubpartSpecialization: 'Items::Item::subparts'
    },
    idPrefix: 'pu-',
    verified: true
  },

  itemDefinition: {
    name: 'ItemDefinition',
    xmiId: 'Systems-Items-ItemDefinition',
    source: 'SysML.xmi',
    category: 'definition',
    supertypes: ['Kernel-Structures-Structure', 'Systems-Occurrences-OccurrenceDefinition'],
    attributes: [],
    constraints: ['checkItemDefinitionSpecialization'],
    libraryBases: {},
    idPrefix: 'itd-',
    verified: true
  },
  itemUsage: {
    name: 'ItemUsage',
    xmiId: 'Systems-Items-ItemUsage',
    source: 'SysML.xmi',
    category: 'usage',
    supertypes: ['Systems-Occurrences-OccurrenceUsage'],
    attributes: ['itemDefinition'],
    constraints: [
      'deriveItemUsageItemDefinition',
      'checkItemUsageSpecialization',
      'checkItemUsageSubitemSpecialization'
    ],
    libraryBases: {
      checkItemUsageSpecialization: 'Items::items',
      checkItemUsageSubitemSpecialization: 'Items::Item::subitem'
    },
    idPrefix: 'itu-',
    verified: true
  },

  attributeDefinition: {
    name: 'AttributeDefinition',
    xmiId: 'Systems-Attributes-AttributeDefinition',
    source: 'SysML.xmi',
    category: 'definition',
    supertypes: [],
    attributes: [],
    constraints: ['validateAttributeDefinitionFeatures'],
    libraryBases: {},
    idPrefix: 'ad-',
    verified: true
  },
  attributeUsage: {
    name: 'AttributeUsage',
    xmiId: 'Systems-Attributes-AttributeUsage',
    source: 'SysML.xmi',
    category: 'usage',
    supertypes: [],
    attributes: [],
    constraints: [
      'validateAttributeUsageIsReference',
      'checkAttributeUsageSpecialization',
      'validateAttributeUsageFeatures'
    ],
    libraryBases: {},
    idPrefix: 'au-',
    verified: true
  },

  portDefinition: {
    name: 'PortDefinition',
    xmiId: 'Systems-Ports-PortDefinition',
    source: 'SysML.xmi',
    category: 'definition',
    supertypes: [],
    attributes: [],
    constraints: [
      'validatePortDefinitionOwnedUsagesNotComposite',
      'validatePortDefinitionConjugatedPortDefinition',
      'checkPortDefinitionSpecialization'
    ],
    libraryBases: {},
    idPrefix: 'ptd-',
    verified: true
  },
  portUsage: {
    name: 'PortUsage',
    xmiId: 'Systems-Ports-PortUsage',
    source: 'SysML.xmi',
    category: 'usage',
    supertypes: ['Systems-Occurrences-OccurrenceUsage'],
    attributes: ['portDefinition'],
    constraints: [
      'validatePortUsageNestedUsagesNotComposite',
      'checkPortUsageSubportSpecialization',
      'validatePortUsageIsReference',
      'checkPortUsageSpecialization',
      'checkPortUsageOwnedPortSpecialization'
    ],
    libraryBases: {
      checkPortUsageSpecialization: 'Ports::ports',
      checkPortUsageSubportSpecialization: 'Ports::Port::subports',
      checkPortUsageOwnedPortSpecialization: 'Parts::Part::ownedPorts'
    },
    idPrefix: 'ptu-',
    verified: true
  },

  connectionDefinition: {
    name: 'ConnectionDefinition',
    xmiId: 'Systems-Connections-ConnectionDefinition',
    source: 'SysML.xmi',
    category: 'definition',
    supertypes: ['Kernel-Associations-AssociationStructure', 'Systems-Parts-PartDefinition'],
    attributes: ['connectionEnd', 'isSufficient'],
    constraints: ['checkConnectionDefinitionSpecializations', 'validateConnectionDefinitionIsSufficient'],
    libraryBases: { checkConnectionDefinitionSpecializations: 'Connections::Connection' },
    idPrefix: 'cd-',
    verified: true
  },
  connectionUsage: {
    name: 'ConnectionUsage',
    xmiId: 'Systems-Connections-ConnectionUsage',
    source: 'SysML.xmi',
    category: 'relationship',
    supertypes: ['Systems-Parts-PartUsage', 'Systems-Connections-ConnectorAsUsage'],
    attributes: ['connectionDefinition'],
    constraints: ['checkConnectionUsageSpecialization', 'checkConnectionUsageBinarySpecialization'],
    libraryBases: {
      checkConnectionUsageSpecialization: 'Connections::connections',
      checkConnectionUsageBinarySpecialization: 'Connections::binaryConnections'
    },
    idPrefix: 'cu-',
    verified: true
  },
  bindingConnectorAsUsage: {
    name: 'BindingConnectorAsUsage',
    xmiId: 'Systems-Connections-BindingConnectorAsUsage',
    source: 'SysML.xmi',
    category: 'relationship',
    supertypes: ['Kernel-Connectors-BindingConnector', 'Systems-Connections-ConnectorAsUsage'],
    attributes: [],
    constraints: [],
    libraryBases: {},
    idPrefix: 'bau-',
    verified: true
  },
  successionAsUsage: {
    name: 'SuccessionAsUsage',
    xmiId: 'Systems-Connections-SuccessionAsUsage',
    source: 'SysML.xmi',
    category: 'relationship',
    supertypes: ['Systems-Connections-ConnectorAsUsage', 'Kernel-Connectors-Succession'],
    attributes: [],
    constraints: [],
    libraryBases: {},
    idPrefix: 'sau-',
    verified: true
  },
  connectorAsUsage: {
    name: 'ConnectorAsUsage',
    xmiId: 'Systems-Connections-ConnectorAsUsage',
    source: 'SysML.xmi',
    category: 'relationship',
    supertypes: [],
    attributes: [],
    constraints: [],
    libraryBases: {},
    idPrefix: 'cau-',
    abstract: true,
    verified: true
  },

  flowDefinition: {
    name: 'FlowDefinition',
    xmiId: 'Systems-Flows-FlowDefinition',
    source: 'SysML.xmi',
    category: 'definition',
    supertypes: ['Systems-Actions-ActionDefinition', 'Kernel-Interactions-Interaction'],
    attributes: ['flowEnd'],
    constraints: [
      'checkFlowDefinitionSpecialization',
      'checkFlowDefinitionBinarySpecialization',
      'validateFlowDefinitionFlowEnds'
    ],
    libraryBases: {
      checkFlowDefinitionSpecialization: 'Flows::MessageAction',
      checkFlowDefinitionBinarySpecialization: 'Flows::Message'
    },
    idPrefix: 'fd-',
    verified: true
  },
  flowUsage: {
    name: 'FlowUsage',
    xmiId: 'Systems-Flows-FlowUsage',
    source: 'SysML.xmi',
    category: 'usage',
    supertypes: [],
    attributes: ['flowDefinition'],
    constraints: ['checkFlowUsageSpecialization', 'checkFlowUsageFlowSpecialization'],
    libraryBases: {
      checkFlowUsageSpecialization: 'Flows::messages',
      checkFlowUsageFlowSpecialization: 'Flows::flows'
    },
    idPrefix: 'fu-',
    verified: true
  },
  successionFlowUsage: {
    name: 'SuccessionFlowUsage',
    xmiId: 'Systems-Flows-SuccessionFlowUsage',
    source: 'SysML.xmi',
    category: 'usage',
    supertypes: ['Systems-Flows-FlowUsage'],
    attributes: [],
    constraints: ['checkSuccessionFlowUsageSpecialization'],
    libraryBases: { checkSuccessionFlowUsageSpecialization: 'Flows::successionFlows' },
    idPrefix: 'sfu-',
    verified: true
  },
  // NOTE (Phase 0 finding, SysML.json 20250201): the JSON serialization defines
  // NO `FlowConnectionUsage` @type. The concrete serialized flow-connector
  // usage types are `FlowUsage` and `SuccessionFlowUsage` (verified by walking
  // all 175 @type constants in SysML.json $defs). FlowConnectionUsage exists
  // only as a metaclass referenced in XMI comments. The plan's §4 mapping
  // `connectionType: 'flow'` -> FlowConnectionUsage must therefore serialize
  // as FlowUsage; `serializesAs` below pins that resolution as data.
  flowConnectionUsage: {
    name: 'FlowConnectionUsage',
    xmiId: null,
    source: 'SysML.xmi',
    category: 'relationship',
    supertypes: ['Systems-Connections-ConnectorAsUsage'],
    attributes: [],
    constraints: [],
    libraryBases: {},
    idPrefix: 'fcu-',
    verified: false,
    serializesAs: 'flowUsage'
  },

  interfaceDefinition: {
    name: 'InterfaceDefinition',
    xmiId: 'Systems-Interfaces-InterfaceDefinition',
    source: 'SysML.xmi',
    category: 'definition',
    supertypes: [],
    attributes: ['interfaceEnd'],
    constraints: [],
    libraryBases: {},
    idPrefix: 'ifd-',
    verified: true
  },
  interfaceUsage: {
    name: 'InterfaceUsage',
    xmiId: 'Systems-Interfaces-InterfaceUsage',
    source: 'SysML.xmi',
    category: 'usage',
    supertypes: ['Systems-Connections-ConnectionUsage'],
    attributes: ['interfaceDefinition'],
    constraints: ['checkInterfaceUsageBinarySpecialization'],
    libraryBases: {},
    idPrefix: 'ifu-',
    verified: true
  },

  variantMembership: {
    name: 'VariantMembership',
    xmiId: 'Systems-DefinitionAndUsage-VariantMembership',
    source: 'SysML.xmi',
    category: 'membership',
    supertypes: [],
    attributes: [],
    constraints: [],
    libraryBases: {},
    idPrefix: 'vm-',
    verified: true
  },
  membership: {
    name: 'Membership',
    xmiId: 'Root-Namespaces-Membership',
    source: 'KerML.xmi',
    category: 'membership',
    supertypes: ['Root-Elements-Relationship'],
    attributes: ['memberElementId', 'membershipOwningNamespace', 'memberShortName', 'memberElement'],
    constraints: [],
    libraryBases: {},
    idPrefix: 'm-',
    verified: true
  },
  owningMembership: {
    name: 'OwningMembership',
    xmiId: 'Root-Namespaces-OwningMembership',
    source: 'KerML.xmi',
    category: 'membership',
    supertypes: ['Root-Namespaces-Membership'],
    attributes: ['ownedMemberElementId', 'ownedMemberShortName', 'ownedMemberName', 'ownedMemberElement'],
    constraints: [],
    libraryBases: {},
    idPrefix: 'om-',
    verified: true
  },

  comment: {
    name: 'Comment',
    xmiId: 'Root-Annotations-Comment',
    source: 'KerML.xmi',
    category: 'annotation',
    supertypes: ['Root-Annotations-AnnotatingElement'],
    attributes: ['locale', 'body'],
    constraints: [],
    libraryBases: {},
    idPrefix: 'cm-',
    verified: true
  }
} as const satisfies Record<string, MetaclassInfo>;

export type MetaclassKey = keyof typeof METACLASS_REGISTRY;

/** The supported subset — anything outside this union is rejected at the type level. */
export const METACLASS_KEYS = Object.keys(METACLASS_REGISTRY) as MetaclassKey[];

export function isSupportedMetaclass(key: string): key is MetaclassKey {
  return Object.prototype.hasOwnProperty.call(METACLASS_REGISTRY, key);
}

export function getMetaclassInfo(key: MetaclassKey): MetaclassInfo {
  return METACLASS_REGISTRY[key];
}

/**
 * Metaclasses with no Class element / JSON @type in the pinned artifacts.
 * `serializesAs` (when present) records the serialized form they map to.
 */
export const UNVERIFIED_METACLASSES: MetaclassKey[] = METACLASS_KEYS.filter(
  (key) => !METACLASS_REGISTRY[key].verified
);

/** Id prefixes must be unique so element ids decode back to their metaclass. */
export function assertUniquePrefixes(): void {
  const seen = new Set<string>();
  for (const key of METACLASS_KEYS) {
    const prefix = METACLASS_REGISTRY[key].idPrefix;
    if (seen.has(prefix)) {
      throw new Error(`Duplicate id prefix "${prefix}" for metaclass "${key}"`);
    }
    seen.add(prefix);
  }
}

assertUniquePrefixes();

export const NORMATIVE_RELEASE = SYSML_NORMATIVE.releaseId;
