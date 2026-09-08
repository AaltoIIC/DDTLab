/**
 * Well-formedness rules WF001–WF008 (plan §5 Phase 4) for the supported
 * SysML v2 subset.
 *
 * Rule ids are stable for tooling; each rule carries a `label` required by the
 * Phase 4 review correction:
 *
 * - `normative` — the check traces to a constraint in the pinned normative
 *   artifacts (`docs/normative/sysml-v2-20250201/`). `source` names the
 *   verbatim constraint/comment, so the rule is table-driven from the same
 *   artifact authority as the metaclass registry.
 * - `tool-integrity` — keeps the repository/serialization consistent; never
 *   presented as SysML validation.
 * - `warning-heuristic` — UX guidance that must not be presented as SysML
 *   validation; emitted at `warning` severity only.
 *
 * Severity contract: `error` diagnostics block repository mutations (decision
 * 8); `warning` diagnostics never block (passive "model health" only).
 */
import type { AnySysmlElement, ElementId, SysmlDocument } from '../model';
import { getOwnedIds } from '../model/namespaces';
import { PORT_OWNER_METACLASSES } from '../model/ownership';
import {
  errorDiagnostic,
  warningDiagnostic,
  type Diagnostic,
  type RuleLabel
} from '../repo/diagnostics';

export interface RuleDefinition {
  ruleId: string;
  label: RuleLabel;
  /**
   * Traceability: verbatim constraint names / XMI comments for normative
   * rules; rationale for tool-integrity and heuristic rules.
   */
  source: string;
  /** Run the rule over a document; returns zero or more diagnostics. */
  check: (document: SysmlDocument) => Diagnostic[];
}

/* ── Reference helpers (single source of id-reference truth) ─────────────── */

/** Every stored id reference an element may hold, in a stable field order. */
export function referenceIdsOf(element: AnySysmlElement): ElementId[] {
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
  if ('aboutIds' in element) refs.push(...element.aboutIds);
  return refs;
}

const USAGE_METACLASSES = new Set(['partUsage', 'itemUsage', 'portUsage', 'attributeUsage']);
const DEFINITION_METACLASSES = new Set([
  'partDefinition',
  'itemDefinition',
  'portDefinition',
  'attributeDefinition',
  'connectionDefinition',
  'flowDefinition'
]);
const FEATURE_METACLASSES = new Set(['partUsage', 'itemUsage', 'portUsage', 'attributeUsage']);
const NAMED_METACLASSES = new Set([...DEFINITION_METACLASSES, ...USAGE_METACLASSES]);

/** definitionId must point to a definition of exactly this metaclass. */
const EXPECTED_DEFINITION: Record<string, string> = {
  partUsage: 'partDefinition',
  itemUsage: 'itemDefinition',
  portUsage: 'portDefinition',
  attributeUsage: 'attributeDefinition'
};

const isEmptyName = (name: string): boolean => name.trim().length === 0;

/* ── WF001 — member names unique within owning namespace ─────────────────── */

function wf001(document: SysmlDocument): Diagnostic[] {
  const diagnostics: Diagnostic[] = [];
  const names = new Map<string, ElementId>();
  for (const element of Object.values(document.elements)) {
    // Anonymous members (empty names) are allowed in KerML and are exempt
    // from name uniqueness (Membership.isDistinguishableFrom defaults to true
    // when either name is absent).
    if (isEmptyName(element.name)) continue;
    const key = `${element.ownerId ?? document.root.id}::${element.name}`;
    const previous = names.get(key);
    if (previous) {
      diagnostics.push(errorDiagnostic('WF001-name-uniqueness', `Duplicate member name ${element.name}`, element.id));
    }
    names.set(key, element.id);
  }
  return diagnostics;
}

/* ── WF002 — usage type exists and metaclass matches ─────────────────────── */

function wf002(document: SysmlDocument): Diagnostic[] {
  const diagnostics: Diagnostic[] = [];
  for (const element of Object.values(document.elements)) {
    if (!USAGE_METACLASSES.has(element.metaclass)) continue;
    const definitionId = 'definitionId' in element ? element.definitionId : null;
    if (definitionId === null) {
      // Untyped usages are legal in SysML v2 (anonymous types) and common in
      // the concept-stage authoring path (ports carry their interface only as
      // presentation — decision 21), so this is a heuristic warning, never a
      // block. Parts/items without a definition show as untyped in the UI.
      if (element.metaclass === 'partUsage' || element.metaclass === 'itemUsage') {
        diagnostics.push(
          warningDiagnostic(
            'WF002-type-exists',
            `Usage ${element.name} is untyped (no definitionId) — heuristic: the UI shows it without a definition`,
            element.id
          )
        );
      }
      continue;
    }
    const definition = document.elements[definitionId];
    if (!definition) continue; // dangling reference is WF006's job
    const expected = EXPECTED_DEFINITION[element.metaclass];
    if (definition.metaclass !== expected) {
      diagnostics.push(
        errorDiagnostic(
          'WF002-type-exists',
          `Usage ${element.name} is typed by ${definition.metaclass} ${definition.name}, expected ${expected}`,
          element.id
        )
      );
    }
  }
  return diagnostics;
}

/* ── WF003 — ownership: owner exists + metaclass containment ─────────────── */

const OWNING_METACLASSES = new Set(['package', 'partDefinition', 'itemDefinition', 'partUsage', 'itemUsage']);

function wf003(document: SysmlDocument): Diagnostic[] {
  const diagnostics: Diagnostic[] = [];
  for (const element of Object.values(document.elements)) {
    if (element.ownerId === null) continue;
    const owner = document.elements[element.ownerId];
    if (!owner) {
      diagnostics.push(
        errorDiagnostic('WF003-ownership', `Owner ${element.ownerId} from ${element.id} does not resolve`, element.id)
      );
      continue;
    }
    if (!OWNING_METACLASSES.has(owner.metaclass)) {
      diagnostics.push(
        errorDiagnostic('WF003-ownership', `${owner.metaclass} cannot own members`, element.id)
      );
      continue;
    }
    // Ports are features of part/item types (KerML/SysML ownedPorts
    // containment): a bare port under a package has no owning feature.
    if (element.metaclass === 'portUsage' && !PORT_OWNER_METACLASSES.has(owner.metaclass)) {
      diagnostics.push(
        errorDiagnostic('WF003-ownership', `${owner.metaclass} cannot own ports`, element.id)
      );
    }
  }
  return diagnostics;
}

/* ── WF004 — connection/flow ends resolve to port features ───────────────── */

function wf004(document: SysmlDocument): Diagnostic[] {
  const diagnostics: Diagnostic[] = [];
  for (const element of Object.values(document.elements)) {
    if (element.metaclass === 'flowUsage') {
      for (const [role, endId] of [['source', element.sourceEnd], ['target', element.targetEnd]] as const) {
        const end = document.elements[endId];
        if (end && end.metaclass !== 'portUsage') {
          diagnostics.push(
            errorDiagnostic('WF004-connection-ends', `Flow ${role} end ${endId} is a ${end.metaclass}, not a port usage`, element.id)
          );
        }
      }
    } else if (element.metaclass === 'connectionUsage') {
      for (const [role, endId] of [['A', element.endA], ['B', element.endB]] as const) {
        const end = document.elements[endId];
        if (end && end.metaclass !== 'portUsage') {
          diagnostics.push(
            errorDiagnostic('WF004-connection-ends', `Connection end ${role} ${endId} is a ${end.metaclass}, not a port usage`, element.id)
          );
        }
      }
    }
  }
  return diagnostics;
}

/* ── WF005 — binding ends resolve to type-compatible features ────────────── */

function wf005(document: SysmlDocument): Diagnostic[] {
  const diagnostics: Diagnostic[] = [];
  for (const element of Object.values(document.elements)) {
    if (element.metaclass !== 'bindingConnectorAsUsage') continue;
    const ends = [element.endA, element.endB];
    for (const endId of ends) {
      const end = document.elements[endId];
      if (end && !FEATURE_METACLASSES.has(end.metaclass)) {
        diagnostics.push(
          errorDiagnostic('WF005-binding-ends', `Binding end ${endId} is a ${end.metaclass}, not a feature usage`, element.id)
        );
      }
    }

    // Type compatibility (KerML BindingConnector): ends must be of compatible
    // types. The supported subset has no generalization/redefinition, so the
    // only provable compatibility is a shared definition id; different types
    // are surfaced as a heuristic warning, never as a blocking error.
    const endA = document.elements[element.endA];
    const endB = document.elements[element.endB];
    const definitionA = endA && 'definitionId' in endA ? endA.definitionId : null;
    const definitionB = endB && 'definitionId' in endB ? endB.definitionId : null;
    if (definitionA !== null && definitionB !== null && definitionA !== definitionB) {
      diagnostics.push(
        warningDiagnostic(
          'WF005-binding-ends',
          `Binding ${element.name} connects features with different types; the supported subset has no specialization to prove compatibility — heuristic`,
          element.id
        )
      );
    }
  }
  return diagnostics;
}

/* ── WF006 — no dangling references ──────────────────────────────────────── */

function wf006(document: SysmlDocument): Diagnostic[] {
  const diagnostics: Diagnostic[] = [];
  for (const element of Object.values(document.elements)) {
    for (const ref of referenceIdsOf(element)) {
      if (!document.elements[ref]) {
        diagnostics.push(
          errorDiagnostic('WF006-no-dangling-refs', `Reference ${ref} from ${element.id} does not resolve`, element.id)
        );
      }
    }
  }
  return diagnostics;
}

/* ── WF007 — exactly one root namespace, consistent membership ───────────── */

function wf007(document: SysmlDocument): Diagnostic[] {
  const diagnostics: Diagnostic[] = [];
  const root = document.root;
  if (!root || !Array.isArray(root.memberIds)) {
    diagnostics.push(errorDiagnostic('WF007-namespace-root', 'System model has no single root namespace'));
    return diagnostics;
  }

  const rootMembers = new Set(root.memberIds);
  if (rootMembers.size !== root.memberIds.length) {
    diagnostics.push(errorDiagnostic('WF007-namespace-root', 'Root namespace lists the same member more than once'));
  }

  for (const id of root.memberIds) {
    const member = document.elements[id];
    if (!member) {
      diagnostics.push(errorDiagnostic('WF007-namespace-root', `Root namespace references missing member ${id}`, id));
    } else if (member.ownerId !== null) {
      diagnostics.push(errorDiagnostic('WF007-namespace-root', `Element ${id} is listed in the root but owned by ${member.ownerId}`, id));
    }
  }

  // Every root-owned element must be listed exactly once in the root.
  for (const element of Object.values(document.elements)) {
    if (element.ownerId !== null) continue;
    if (!rootMembers.has(element.id)) {
      diagnostics.push(errorDiagnostic('WF007-namespace-root', `Root-owned element ${element.id} is missing from the root membership`, element.id));
    }
  }

  return diagnostics;
}

/* ── WF008 — names non-empty where required ──────────────────────────────── */

function wf008(document: SysmlDocument): Diagnostic[] {
  const diagnostics: Diagnostic[] = [];
  for (const element of Object.values(document.elements)) {
    if (!NAMED_METACLASSES.has(element.metaclass)) continue;
    if (isEmptyName(element.name)) {
      diagnostics.push(
        errorDiagnostic('WF008-empty-name', `${element.metaclass} ${element.id} has an empty name`, element.id)
      );
    }
  }
  return diagnostics;
}

/* ── Registry ────────────────────────────────────────────────────────────── */

export const RULES: RuleDefinition[] = [
  {
    ruleId: 'WF001-name-uniqueness',
    label: 'normative',
    source: 'KerML Namespace owned members are pairwise distinguishable (KerML.xmi: Root-Namespaces-Membership-isDistinguishableFrom; the Namespace rule requires m1 <> m2 implies m1.isDistinguishableFrom(m2)); by default distinguishable means distinct memberName.',
    check: wf001
  },
  {
    ruleId: 'WF002-type-exists',
    label: 'normative',
    source: 'SysML usage typing constraints — PartUsage.validatePartUsagePartDefinition, ItemUsage.checkItemUsageSpecialization, PortUsage.validatePortUsageIsReference, AttributeUsage.validateAttributeUsageFeatures (SysML.xmi, release 20250201). Untyped-usage warnings are heuristic (anonymous usages are legal; decision 21 keeps port interfaces presentation-only).',
    check: wf002
  },
  {
    ruleId: 'WF003-ownership',
    label: 'normative',
    source: 'Metaclass containment — PortUsage.checkPortUsageOwnedPortSpecialization (Parts::Part::ownedPorts), KerML Feature ownership; a port is a feature of a part/item (usage or definition), never a bare package member.',
    check: wf003
  },
  {
    ruleId: 'WF004-connection-ends',
    label: 'normative',
    source: 'ConnectionUsage.checkConnectionUsageBinarySpecialization (Connections::binaryConnections) and FlowUsage.checkFlowUsageFlowSpecialization (Flows::flows, SysML.xmi): ends must be the flow/connection features, resolved semantically — never canvas handle strings.',
    check: wf004
  },
  {
    ruleId: 'WF005-binding-ends',
    label: 'normative',
    source: 'KerML BindingConnector.validateBindingConnectorIsBinary + checkBindingConnectorSpecialization (ends must be resolvable features of compatible type). Type compatibility is subset-limited: no generalization, so differing definition ids are a heuristic warning.',
    check: wf005
  },
  {
    ruleId: 'WF006-no-dangling-refs',
    label: 'tool-integrity',
    source: 'Repository/serialization integrity — every stored id reference must resolve so the document round-trips and the projection never dangles. Not a SysML metamodel constraint.',
    check: wf006
  },
  {
    ruleId: 'WF007-namespace-root',
    label: 'tool-integrity',
    source: 'Our serialization format has exactly one synthetic root namespace per system model (decision 20); this rule keeps root membership consistent. Not a SysML metamodel constraint.',
    check: wf007
  },
  {
    ruleId: 'WF008-empty-name',
    label: 'tool-integrity',
    source: 'The name-based handle scheme (decision 19) and the sidebar/definition lists require non-empty names for definitions and usages; anonymous elements are otherwise legal in KerML, so this is not presented as SysML validation.',
    check: wf008
  }
];

export const RULE_LABELS: Record<string, RuleLabel> = Object.fromEntries(
  RULES.map((rule) => [rule.ruleId, rule.label])
);

export function getRuleDefinition(ruleId: string): RuleDefinition | undefined {
  return RULES.find((rule) => rule.ruleId === ruleId);
}