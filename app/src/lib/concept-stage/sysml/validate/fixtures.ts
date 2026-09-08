/**
 * Compliance fixtures (§9 open item — "add a compliance fixture format before
 * implementing the validator").
 *
 * A fixture is a model plus the diagnostics it must produce. Every WF rule has
 * at least one positive fixture (a well-formed model that must be silent) and
 * one negative fixture (an intentionally invalid model that must trip the
 * rule). Negative fixtures are built with the element factories and then
 * hand-rewired (the factories themselves enforce most invariants, so an
 * invalid model cannot be produced by factory calls alone); membership lists
 * are kept consistent so each negative fixture trips exactly its rule.
 *
 * The same fixture set drives the Vitest suite and can be reused by tooling
 * (e.g. a `--validate` CLI or the Phase 6 exporter's pre-flight check).
 */
import {
  addBindingConnectorAsUsage,
  addFlowUsage,
  addItemDefinition,
  addPackage,
  addPartDefinition,
  addPartUsage,
  addPortDefinition,
  addPortUsage,
  createDocument,
  type ElementId,
  type SysmlDocument
} from '../model';
import type { DiagnosticSeverity } from '../repo/diagnostics';

export interface ComplianceFixture {
  /** Stable id, e.g. `WF001-duplicate-member-name` (used in test names). */
  id: string;
  /** The rule under test. */
  ruleId: string;
  /** Human-readable description of what the fixture demonstrates. */
  description: string;
  /** true = well-formed (must produce no diagnostics); false = must trip the rule. */
  valid: boolean;
  document: SysmlDocument;
  /** Rules that must fire for a negative fixture (defaults to `[ruleId]`). */
  expectedRuleIds?: string[];
  /** Severity expected for the primary diagnostic (defaults to `error`). */
  expectedSeverity?: DiagnosticSeverity;
}

/* ── Builder helpers ─────────────────────────────────────────────────────── */

interface BaseSystem {
  document: SysmlDocument;
  engineDef: ElementId;
  pumpDef: ElementId;
  portDef: ElementId;
  engine: ElementId;
  power: ElementId;
  pump: ElementId;
  pumpIn: ElementId;
  flow: ElementId;
}

/**
 * A small, fully valid engine system:
 *   root ── engine : Engine (port power)
 *        ── pump : Pump (port pumpIn)
 *        ── flow drive: power -> pumpIn
 * Used as the positive fixture for rules whose happy path is a realistic model.
 */
function baseSystem(): BaseSystem {
  const document = createDocument('Vehicle');
  const engineDef = addPartDefinition(document, 'Engine');
  const pumpDef = addPartDefinition(document, 'Pump');
  const portDef = addPortDefinition(document, 'PowerPort');
  const engine = addPartUsage(document, 'engine', engineDef.id);
  const power = addPortUsage(document, 'power', portDef.id, engine.id, 'out');
  const pump = addPartUsage(document, 'pump', pumpDef.id);
  const pumpIn = addPortUsage(document, 'pumpIn', portDef.id, pump.id, 'in');
  const flow = addFlowUsage(document, 'drive', power.id, pumpIn.id);
  return {
    document,
    engineDef: engineDef.id,
    pumpDef: pumpDef.id,
    portDef: portDef.id,
    engine: engine.id,
    power: power.id,
    pump: pump.id,
    pumpIn: pumpIn.id,
    flow: flow.id
  };
}

/** Re-own `id` under `newOwnerId`, keeping both membership lists consistent. */
function rewireOwner(document: SysmlDocument, id: ElementId, newOwnerId: ElementId | null): void {
  const element = document.elements[id];
  const previousOwnerId = element.ownerId;
  if (previousOwnerId === newOwnerId) return;

  if (previousOwnerId === null) {
    document.root.memberIds = document.root.memberIds.filter((memberId) => memberId !== id);
  } else {
    const previous = document.elements[previousOwnerId];
    if (previous && 'memberIds' in previous) {
      previous.memberIds = previous.memberIds.filter((memberId) => memberId !== id);
    } else if (previous && 'ownedUsageIds' in previous) {
      previous.ownedUsageIds = previous.ownedUsageIds.filter((usageId) => usageId !== id);
    }
  }

  element.ownerId = newOwnerId;
  if (newOwnerId === null) {
    document.root.memberIds.push(id);
  } else {
    const owner = document.elements[newOwnerId];
    if (owner && 'memberIds' in owner) owner.memberIds.push(id);
    else if (owner && 'ownedUsageIds' in owner) owner.ownedUsageIds.push(id);
  }
}

/* ── Fixtures ────────────────────────────────────────────────────────────── */

export const COMPLIANCE_FIXTURES: ComplianceFixture[] = [
  /* WF001 — name uniqueness */
  {
    id: 'WF001-unique-member-names',
    ruleId: 'WF001-name-uniqueness',
    description: 'Distinct member names within each namespace are valid.',
    valid: true,
    document: baseSystem().document
  },
  {
    id: 'WF001-duplicate-member-name',
    ruleId: 'WF001-name-uniqueness',
    description: 'Two usages named `pump` in the root namespace violate member-name uniqueness.',
    valid: false,
    document: (() => {
      const document = createDocument('Vehicle');
      const engineDef = addPartDefinition(document, 'Engine');
      addPartUsage(document, 'pump', engineDef.id);
      addPartUsage(document, 'pump', engineDef.id);
      return document;
    })()
  },

  /* WF002 — type exists and metaclass matches */
  {
    id: 'WF002-typed-usages',
    ruleId: 'WF002-type-exists',
    description: 'Part/item/port usages typed by the matching definition metaclass are valid.',
    valid: true,
    document: baseSystem().document
  },
  {
    id: 'WF002-mismatched-definition-type',
    ruleId: 'WF002-type-exists',
    description: 'A part usage whose definitionId resolves to an item definition violates usage typing.',
    valid: false,
    document: (() => {
      const document = createDocument('Vehicle');
      const engineDef = addPartDefinition(document, 'Engine');
      const itemDef = addItemDefinition(document, 'Fuel');
      const usage = addPartUsage(document, 'motorA', engineDef.id);
      (document.elements[usage.id] as { definitionId: ElementId }).definitionId = itemDef.id;
      return document;
    })()
  },
  {
    id: 'WF002-untyped-usage',
    ruleId: 'WF002-type-exists',
    description: 'An untyped part usage is legal SysML; the heuristic warning must not block.',
    valid: false,
    expectedSeverity: 'warning',
    document: (() => {
      const document = createDocument('Vehicle');
      const engineDef = addPartDefinition(document, 'Engine');
      const usage = addPartUsage(document, 'motorA', engineDef.id);
      (document.elements[usage.id] as { definitionId: ElementId | null }).definitionId = null;
      return document;
    })()
  },

  /* WF003 — ownership containment */
  {
    id: 'WF003-ownership-valid',
    ruleId: 'WF003-ownership',
    description: 'Ports owned by part usages and usages owned by packages are valid containment.',
    valid: true,
    document: (() => {
      const document = createDocument('Vehicle');
      const library = addPackage(document, 'Library');
      const engineDef = addPartDefinition(document, 'Engine', library.id);
      const portDef = addPortDefinition(document, 'PowerPort', library.id);
      const engine = addPartUsage(document, 'engine', engineDef.id);
      addPortUsage(document, 'power', portDef.id, engine.id, 'in');
      return document;
    })()
  },
  {
    id: 'WF003-port-owned-by-package',
    ruleId: 'WF003-ownership',
    description: 'A bare port usage owned by a package has no owning part/item feature and is invalid.',
    valid: false,
    document: (() => {
      const document = createDocument('Vehicle');
      const library = addPackage(document, 'Library');
      const engineDef = addPartDefinition(document, 'Engine', library.id);
      const portDef = addPortDefinition(document, 'PowerPort', library.id);
      const engine = addPartUsage(document, 'engine', engineDef.id);
      const power = addPortUsage(document, 'power', portDef.id, engine.id, 'in');
      rewireOwner(document, power.id, library.id);
      return document;
    })()
  },

  /* WF004 — connection ends */
  {
    id: 'WF004-connection-ends-valid',
    ruleId: 'WF004-connection-ends',
    description: 'A flow between two port usages is a valid connection.',
    valid: true,
    document: baseSystem().document
  },
  {
    id: 'WF004-flow-end-not-a-port',
    ruleId: 'WF004-connection-ends',
    description: 'A flow whose target end resolves to a part usage (not a port) is invalid.',
    valid: false,
    document: (() => {
      const system = baseSystem();
      (system.document.elements[system.flow] as { targetEnd: ElementId }).targetEnd = system.pump;
      return system.document;
    })()
  },

  /* WF005 — binding ends */
  {
    id: 'WF005-binding-ends-valid',
    ruleId: 'WF005-binding-ends',
    description: 'A binding between two features typed by the same definition is valid.',
    valid: true,
    document: (() => {
      const system = baseSystem();
      addBindingConnectorAsUsage(system.document, 'bindPower', system.power, system.pumpIn);
      return system.document;
    })()
  },
  {
    id: 'WF005-binding-end-not-a-feature',
    ruleId: 'WF005-binding-ends',
    description: 'A binding whose end resolves to a port definition (not a feature usage) is invalid.',
    valid: false,
    document: (() => {
      const system = baseSystem();
      const binding = addBindingConnectorAsUsage(system.document, 'bind', system.power, system.pumpIn);
      (system.document.elements[binding.id] as { endA: ElementId }).endA = system.portDef;
      return system.document;
    })()
  },
  {
    id: 'WF005-binding-type-mismatch',
    ruleId: 'WF005-binding-ends',
    description: 'Binding ends typed by different definitions cannot be proven compatible in the subset (heuristic warning).',
    valid: false,
    expectedSeverity: 'warning',
    document: (() => {
      const document = createDocument('Vehicle');
      const engineDef = addPartDefinition(document, 'Engine');
      const pumpDef = addPartDefinition(document, 'Pump');
      const powerDef = addPortDefinition(document, 'PowerPort');
      const signalDef = addPortDefinition(document, 'SignalPort');
      const engine = addPartUsage(document, 'engine', engineDef.id);
      const pump = addPartUsage(document, 'pump', pumpDef.id);
      const power = addPortUsage(document, 'power', powerDef.id, engine.id, 'out');
      const signal = addPortUsage(document, 'signal', signalDef.id, pump.id, 'in');
      addBindingConnectorAsUsage(document, 'bind', power.id, signal.id);
      return document;
    })()
  },

  /* WF006 — dangling references */
  {
    id: 'WF006-all-references-resolve',
    ruleId: 'WF006-no-dangling-refs',
    description: 'A model whose definition and relationship end references all resolve is valid.',
    valid: true,
    document: baseSystem().document
  },
  {
    id: 'WF006-dangling-flow-end',
    ruleId: 'WF006-no-dangling-refs',
    description: 'A flow whose source end id does not resolve is invalid.',
    valid: false,
    document: (() => {
      const system = baseSystem();
      (system.document.elements[system.flow] as { sourceEnd: ElementId }).sourceEnd = 'missing-port';
      return system.document;
    })()
  },

  /* WF007 — single root namespace */
  {
    id: 'WF007-single-root-namespace',
    ruleId: 'WF007-namespace-root',
    description: 'A model whose root membership is consistent is valid.',
    valid: true,
    document: baseSystem().document
  },
  {
    id: 'WF007-orphaned-root-member',
    ruleId: 'WF007-namespace-root',
    description: 'A root-owned element missing from the root membership list breaks the single-root invariant.',
    valid: false,
    document: (() => {
      const document = createDocument('Vehicle');
      const engineDef = addPartDefinition(document, 'Engine');
      const usage = addPartUsage(document, 'engine', engineDef.id);
      document.root.memberIds = document.root.memberIds.filter((id) => id !== usage.id);
      return document;
    })()
  },

  /* WF008 — non-empty names */
  {
    id: 'WF008-named-elements',
    ruleId: 'WF008-empty-name',
    description: 'Definitions and usages with non-empty names are valid.',
    valid: true,
    document: baseSystem().document
  },
  {
    id: 'WF008-empty-usage-name',
    ruleId: 'WF008-empty-name',
    description: 'A usage with an empty name breaks the name-based handle scheme and is invalid.',
    valid: false,
    document: (() => {
      const document = createDocument('Vehicle');
      const engineDef = addPartDefinition(document, 'Engine');
      addPartUsage(document, '', engineDef.id);
      return document;
    })()
  }
];

export function getComplianceFixturesForRule(ruleId: string): ComplianceFixture[] {
  return COMPLIANCE_FIXTURES.filter((fixture) => fixture.ruleId === ruleId);
}