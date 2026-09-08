import { describe, expect, it, beforeEach } from 'vitest';
import { get } from 'svelte/store';
import {
  COMPLIANCE_FIXTURES,
  ModelRepository,
  RULES,
  addItemDefinition,
  addPackage,
  addPartDefinition,
  addPartUsage,
  addPortDefinition,
  addPortUsage,
  createDocument,
  getComplianceFixturesForRule,
  getRuleDefinition,
  summarizeDiagnostics,
  validateDocument,
  type AnySysmlElement
} from '$lib/concept-stage/sysml';
import * as session from '$lib/concept-stage/sysml/session';
import * as model from '$lib/concept-stage/sysml/model';

const ruleIds = () => RULES.map((rule) => rule.ruleId);

describe('WF001–WF008 rule registry (Phase 4)', () => {
  it('exposes exactly the eight plan rule ids in stable order', () => {
    expect(ruleIds()).toEqual([
      'WF001-name-uniqueness',
      'WF002-type-exists',
      'WF003-ownership',
      'WF004-connection-ends',
      'WF005-binding-ends',
      'WF006-no-dangling-refs',
      'WF007-namespace-root',
      'WF008-empty-name'
    ]);
  });

  it('labels each rule normative, tool-integrity or warning-heuristic per the review correction', () => {
    expect(getRuleDefinition('WF001-name-uniqueness')?.label).toBe('normative');
    expect(getRuleDefinition('WF002-type-exists')?.label).toBe('normative');
    expect(getRuleDefinition('WF003-ownership')?.label).toBe('normative');
    expect(getRuleDefinition('WF004-connection-ends')?.label).toBe('normative');
    expect(getRuleDefinition('WF005-binding-ends')?.label).toBe('normative');
    // Heuristic checks (untyped usages, subset-limited binding compatibility)
    // are surfaced as warnings, never as SysML validation errors.
    expect(getRuleDefinition('WF006-no-dangling-refs')?.label).toBe('tool-integrity');
    expect(getRuleDefinition('WF007-namespace-root')?.label).toBe('tool-integrity');
    expect(getRuleDefinition('WF008-empty-name')?.label).toBe('tool-integrity');

    for (const rule of RULES) {
      expect(['normative', 'tool-integrity', 'warning-heuristic']).toContain(rule.label);
      expect(rule.source.length).toBeGreaterThan(10);
    }
  });

  it('attaches the rule label to every emitted diagnostic', () => {
    const document = createDocument('Vehicle');
    const definition = addPartDefinition(document, 'Engine');
    addPartUsage(document, 'pump', definition.id);
    addPartUsage(document, 'pump', definition.id);
    const diagnostics = validateDocument(document);
    const duplicate = diagnostics.find((diagnostic) => diagnostic.ruleId === 'WF001-name-uniqueness');
    expect(duplicate?.ruleLabel).toBe('normative');
  });
});

describe('compliance fixtures (plan §9 format)', () => {
  it('covers every rule with at least one positive and one negative fixture', () => {
    for (const ruleId of ruleIds()) {
      const fixtures = getComplianceFixturesForRule(ruleId);
      expect(fixtures.filter((fixture) => fixture.valid).length).toBeGreaterThan(0);
      expect(fixtures.filter((fixture) => !fixture.valid).length).toBeGreaterThan(0);
    }
  });

  it('validates every fixture exactly as declared', () => {
    for (const fixture of COMPLIANCE_FIXTURES) {
      const diagnostics = validateDocument(fixture.document);
      if (fixture.valid) {
        expect(diagnostics, `${fixture.id} must be silent`).toEqual([]);
      } else {
        const expected = new Set(fixture.expectedRuleIds ?? [fixture.ruleId]);
        expect(
          new Set(diagnostics.map((diagnostic) => diagnostic.ruleId)),
          `${fixture.id} must trip exactly ${[...expected].join(', ')}`
        ).toEqual(expected);
        expect(
          diagnostics.some(
            (diagnostic) =>
              diagnostic.ruleId === fixture.ruleId &&
              diagnostic.severity === (fixture.expectedSeverity ?? 'error')
          ),
          `${fixture.id} must emit a ${fixture.expectedSeverity ?? 'error'} for ${fixture.ruleId}`
        ).toBe(true);
      }
    }
  });
});

describe('WF001 — member names unique within owning namespace', () => {
  it('accepts distinct names and flags duplicates', () => {
    const document = createDocument('Vehicle');
    const definition = addPartDefinition(document, 'Engine');
    addPartUsage(document, 'engine', definition.id);
    expect(validateDocument(document)).toEqual([]);

    addPartUsage(document, 'engine', definition.id);
    const diagnostics = validateDocument(document);
    expect(diagnostics).toHaveLength(1);
    expect(diagnostics[0]).toMatchObject({
      ruleId: 'WF001-name-uniqueness',
      severity: 'error'
    });
    expect(diagnostics[0].message).toContain('Duplicate member name engine');
  });

  it('exempts anonymous members (empty names) from uniqueness', () => {
    const document = createDocument('Vehicle');
    const definition = addPartDefinition(document, 'Engine');
    const usage = addPartUsage(document, 'engine', definition.id);
    (document.elements[usage.id] as { name: string }).name = '';
    expect(validateDocument(document).some((d) => d.ruleId === 'WF001-name-uniqueness')).toBe(false);
  });
});

describe('WF002 — usage type exists and metaclass matches', () => {
  it('rejects a usage typed by the wrong definition metaclass', () => {
    const document = createDocument('Vehicle');
    const partDefinition = addPartDefinition(document, 'Engine');
    const itemDefinition = addItemDefinition(document, 'Fuel');
    const usage = addPartUsage(document, 'motorA', partDefinition.id);
    (document.elements[usage.id] as { definitionId: string }).definitionId = itemDefinition.id;

    const diagnostics = validateDocument(document);
    expect(diagnostics).toHaveLength(1);
    expect(diagnostics[0]).toMatchObject({
      ruleId: 'WF002-type-exists',
      severity: 'error'
    });
    expect(diagnostics[0].message).toContain('expected partDefinition');
  });

  it('warns (never blocks) on untyped part/item usages, and stays silent on untyped ports', () => {
    const document = createDocument('Vehicle');
    const definition = addPartDefinition(document, 'Engine');
    const portDefinition = addPortDefinition(document, 'PowerPort');
    const usage = addPartUsage(document, 'engine', definition.id);
    const port = addPortUsage(document, 'power', portDefinition.id, usage.id, 'in');
    (document.elements[usage.id] as { definitionId: string | null }).definitionId = null;
    // Ports carry their interface only as presentation (decision 21); they
    // must not be flagged as untyped.
    (document.elements[port.id] as { definitionId: string | null }).definitionId = null;

    const diagnostics = validateDocument(document);
    expect(diagnostics).toHaveLength(1);
    expect(diagnostics[0]).toMatchObject({
      ruleId: 'WF002-type-exists',
      severity: 'warning',
      ruleLabel: 'normative'
    });
    expect(diagnostics[0].message).toContain('untyped');
  });
});

describe('WF003 — ownership respects metaclass containment', () => {
  it('rejects a bare port owned by a package', () => {
    const document = createDocument('Vehicle');
    const library = addPackage(document, 'Library');
    const engineDefinition = addPartDefinition(document, 'Engine', library.id);
    const portDefinition = addPortDefinition(document, 'PowerPort', library.id);
    const engine = addPartUsage(document, 'engine', engineDefinition.id);
    const power = addPortUsage(document, 'power', portDefinition.id, engine.id, 'in');
    // Hand-rewire the port to the package, keeping membership lists consistent.
    document.elements[power.id].ownerId = library.id;
    (engine as { ownedUsageIds: string[] }).ownedUsageIds = (engine as { ownedUsageIds: string[] }).ownedUsageIds.filter((id) => id !== power.id);
    (library as { memberIds: string[] }).memberIds.push(power.id);

    const diagnostics = validateDocument(document);
    expect(diagnostics).toHaveLength(1);
    expect(diagnostics[0]).toMatchObject({ ruleId: 'WF003-ownership', severity: 'error' });
    expect(diagnostics[0].message).toContain('cannot own ports');
  });

  it('rejects an unknown owner', () => {
    const document = createDocument('Vehicle');
    const definition = addPartDefinition(document, 'Engine');
    const usage = addPartUsage(document, 'engine', definition.id);
    document.elements[usage.id].ownerId = 'missing-owner';
    document.root.memberIds = document.root.memberIds.filter((id) => id !== usage.id);

    const diagnostics = validateDocument(document);
    expect(diagnostics.some((d) => d.ruleId === 'WF003-ownership' && d.severity === 'error')).toBe(true);
  });
});

describe('WF004 — connection ends resolve to port features', () => {
  it('accepts port-to-port flows and rejects flows ending at a part usage', () => {
    const document = createDocument('Vehicle');
    const definition = addPartDefinition(document, 'Engine');
    const portDefinition = addPortDefinition(document, 'PowerPort');
    const source = addPartUsage(document, 'source', definition.id);
    const target = addPartUsage(document, 'target', definition.id);
    const sourcePort = addPortUsage(document, 'out', portDefinition.id, source.id, 'out');
    const targetPort = addPortUsage(document, 'in', portDefinition.id, target.id, 'in');
    const flow = model.addFlowUsage(document, 'drive', sourcePort.id, targetPort.id);

    expect(validateDocument(document)).toEqual([]);

    (document.elements[flow.id] as { targetEnd: string }).targetEnd = target.id;
    const diagnostics = validateDocument(document);
    expect(diagnostics).toHaveLength(1);
    expect(diagnostics[0]).toMatchObject({ ruleId: 'WF004-connection-ends', severity: 'error' });
    expect(diagnostics[0].message).toContain('not a port usage');
  });
});

describe('WF005 — binding ends resolve to type-compatible features', () => {
  it('rejects a binding whose end is not a feature usage', () => {
    const document = createDocument('Vehicle');
    const definition = addPartDefinition(document, 'Engine');
    const portDefinition = addPortDefinition(document, 'PowerPort');
    const source = addPartUsage(document, 'source', definition.id);
    const target = addPartUsage(document, 'target', definition.id);
    const sourcePort = addPortUsage(document, 'out', portDefinition.id, source.id, 'out');
    const targetPort = addPortUsage(document, 'in', portDefinition.id, target.id, 'in');
    const binding = model.addBindingConnectorAsUsage(document, 'bind', sourcePort.id, targetPort.id);
    (document.elements[binding.id] as { endA: string }).endA = portDefinition.id;

    const diagnostics = validateDocument(document);
    expect(diagnostics).toHaveLength(1);
    expect(diagnostics[0]).toMatchObject({ ruleId: 'WF005-binding-ends', severity: 'error' });
    expect(diagnostics[0].message).toContain('not a feature usage');
  });

  it('warns (never blocks) when differently-typed features are bound', () => {
    const document = createDocument('Vehicle');
    const definition = addPartDefinition(document, 'Engine');
    const powerDefinition = addPortDefinition(document, 'PowerPort');
    const signalDefinition = addPortDefinition(document, 'SignalPort');
    const source = addPartUsage(document, 'source', definition.id);
    const target = addPartUsage(document, 'target', definition.id);
    const sourcePort = addPortUsage(document, 'out', powerDefinition.id, source.id, 'out');
    const targetPort = addPortUsage(document, 'in', signalDefinition.id, target.id, 'in');
    model.addBindingConnectorAsUsage(document, 'bind', sourcePort.id, targetPort.id);

    const diagnostics = validateDocument(document);
    expect(diagnostics).toHaveLength(1);
    expect(diagnostics[0]).toMatchObject({ ruleId: 'WF005-binding-ends', severity: 'warning' });
  });
});

describe('WF006 — no dangling references (tool integrity)', () => {
  it('flags a relationship end whose id does not resolve', () => {
    const document = createDocument('Vehicle');
    const definition = addPartDefinition(document, 'Engine');
    const portDefinition = addPortDefinition(document, 'PowerPort');
    const source = addPartUsage(document, 'source', definition.id);
    const target = addPartUsage(document, 'target', definition.id);
    const sourcePort = addPortUsage(document, 'out', portDefinition.id, source.id, 'out');
    const targetPort = addPortUsage(document, 'in', portDefinition.id, target.id, 'in');
    const flow = model.addFlowUsage(document, 'drive', sourcePort.id, targetPort.id);
    (document.elements[flow.id] as { sourceEnd: string }).sourceEnd = 'missing-port';

    const diagnostics = validateDocument(document);
    expect(diagnostics).toHaveLength(1);
    expect(diagnostics[0]).toMatchObject({
      ruleId: 'WF006-no-dangling-refs',
      severity: 'error',
      ruleLabel: 'tool-integrity'
    });
  });
});

describe('WF007 — exactly one root namespace (tool integrity)', () => {
  it('flags a root-owned element missing from the root membership list', () => {
    const document = createDocument('Vehicle');
    const definition = addPartDefinition(document, 'Engine');
    const usage = addPartUsage(document, 'engine', definition.id);
    document.root.memberIds = document.root.memberIds.filter((id) => id !== usage.id);

    const diagnostics = validateDocument(document);
    expect(diagnostics).toHaveLength(1);
    expect(diagnostics[0]).toMatchObject({
      ruleId: 'WF007-namespace-root',
      severity: 'error',
      ruleLabel: 'tool-integrity'
    });
  });
});

describe('WF008 — names non-empty where required (tool integrity)', () => {
  it('flags an empty usage name', () => {
    const document = createDocument('Vehicle');
    const definition = addPartDefinition(document, 'Engine');
    const usage = addPartUsage(document, '', definition.id);

    const diagnostics = validateDocument(document);
    expect(diagnostics).toHaveLength(1);
    expect(diagnostics[0]).toMatchObject({
      ruleId: 'WF008-empty-name',
      severity: 'error',
      ruleLabel: 'tool-integrity'
    });
    expect(diagnostics[0].message).toContain(usage.id);
  });
});

describe('validator runs on every repository mutation and on load', () => {
  it('rejects a create that would duplicate a member name (WF001) without committing', () => {
    const document = createDocument('Vehicle');
    const repository = new ModelRepository(document);
    const definition = addPartDefinition(document, 'Engine');
    expect(repository.create(definition).ok).toBe(true);

    const first = addPartUsage(document, 'pump', definition.id);
    expect(repository.create(first).ok).toBe(true);

    const duplicate = addPartUsage(document, 'pump', definition.id);
    const rejected = repository.create(duplicate);
    expect(rejected.ok).toBe(false);
    expect(rejected.diagnostics.some((d) => d.ruleId === 'WF001-name-uniqueness')).toBe(true);
    expect(repository.getElement(duplicate.id)).toBeUndefined();
  });

  it('rejects a create that violates containment (WF003) and typing (WF002)', () => {
    const document = createDocument('Vehicle');
    const repository = new ModelRepository(document);
    const library = addPackage(document, 'Library');
    const engineDefinition = addPartDefinition(document, 'Engine', library.id);
    const itemDefinition = addItemDefinition(document, 'Fuel', library.id);
    const portDefinition = addPortDefinition(document, 'PowerPort', library.id);
    expect(repository.create(library).ok).toBe(true);
    expect(repository.create(engineDefinition).ok).toBe(true);
    expect(repository.create(itemDefinition).ok).toBe(true);
    expect(repository.create(portDefinition).ok).toBe(true);

    // A bare port under a package is rejected at creation.
    const loosePort = repository.create({
      id: 'ptu-loose',
      metaclass: 'portUsage',
      category: 'usage',
      name: 'loose',
      ownerId: library.id,
      definitionId: portDefinition.id,
      direction: 'in'
    } as AnySysmlElement);
    expect(loosePort.ok).toBe(false);
    expect(loosePort.diagnostics[0].ruleId).toBe('WF003-ownership');
    expect(repository.getElement('ptu-loose')).toBeUndefined();

    // A part usage typed by an item definition is rejected at creation.
    const engine = repository.create({
      id: 'pu-bad',
      metaclass: 'partUsage',
      category: 'usage',
      name: 'motorA',
      ownerId: null,
      definitionId: itemDefinition.id,
      ownedUsageIds: [],
      attributeIds: []
    } as AnySysmlElement);
    expect(engine.ok).toBe(false);
    expect(engine.diagnostics[0].ruleId).toBe('WF002-type-exists');
    expect(repository.getElement('pu-bad')).toBeUndefined();
  });

  it('allows an untyped usage (warning only) and exposes it through validate()', () => {
    const document = createDocument('Vehicle');
    const repository = new ModelRepository(document);
    const definition = addPartDefinition(document, 'Engine');
    expect(repository.create(definition).ok).toBe(true);

    const usage = addPartUsage(document, 'engine', definition.id);
    const created = repository.create({ ...usage, definitionId: null });
    expect(created.ok).toBe(true); // warnings never block

    const diagnostics = repository.validate();
    expect(diagnostics).toHaveLength(1);
    expect(diagnostics[0]).toMatchObject({ ruleId: 'WF002-type-exists', severity: 'warning' });
    expect(summarizeDiagnostics(diagnostics)).toMatchObject({ errorCount: 0, warningCount: 1 });
  });

  it('rejects an update that would violate a rule and keeps the committed state', () => {
    const document = createDocument('Vehicle');
    const repository = new ModelRepository(document);
    const definition = addPartDefinition(document, 'Engine');
    const usage = addPartUsage(document, 'engine', definition.id);
    expect(repository.create(definition).ok).toBe(true);
    expect(repository.create(usage).ok).toBe(true);

    const pump = addPartUsage(document, 'pump', definition.id);
    expect(repository.create(pump).ok).toBe(true);

    const rejected = repository.update(pump.id, { name: 'engine' });
    expect(rejected.ok).toBe(false);
    expect(rejected.diagnostics.some((d) => d.ruleId === 'WF001-name-uniqueness')).toBe(true);
    expect(repository.getElement(pump.id)?.name).toBe('pump');
  });

  it('rolls back a transaction whose final document violates a rule', () => {
    const document = createDocument('Vehicle');
    const repository = new ModelRepository(document);
    const definition = addPartDefinition(document, 'Engine');
    expect(repository.create(definition).ok).toBe(true);

    // The transaction's per-op pre-checks pass (id/owner/refs are fine), so
    // the final full-document validation is what must reject the commit —
    // duplicating the definition's name in the root namespace (WF001).
    const result = repository.transaction((transaction) => {
      transaction.create({
        id: 'dupe-usage',
        metaclass: 'partUsage',
        category: 'usage',
        name: 'Engine',
        ownerId: null,
        definitionId: definition.id,
        ownedUsageIds: [],
        attributeIds: []
      });
    });
    expect(result.ok).toBe(false);
    expect(result.diagnostics[0].ruleId).toBe('WF001-name-uniqueness');
    expect(repository.getElement('dupe-usage')).toBeUndefined();
  });

  it('runs validation on load: error documents are rejected, warning documents load', () => {
    const withErrors = createDocument('Vehicle');
    const definition = addPartDefinition(withErrors, 'Engine');
    addPartUsage(withErrors, 'pump', definition.id);
    addPartUsage(withErrors, 'pump', definition.id);
    expect(() => new ModelRepository(withErrors)).toThrow(/Duplicate member name/);

    const withWarnings = createDocument('Vehicle');
    const engineDefinition = addPartDefinition(withWarnings, 'Engine');
    const usage = addPartUsage(withWarnings, 'engine', engineDefinition.id);
    (withWarnings.elements[usage.id] as { definitionId: string | null }).definitionId = null;
    const repository = new ModelRepository(withWarnings); // does not throw
    expect(repository.validate().some((d) => d.ruleId === 'WF002-type-exists' && d.severity === 'warning')).toBe(true);
  });

  it('keeps the document well-formed after every delete', () => {
    const document = createDocument('Vehicle');
    const repository = new ModelRepository(document);
    const definition = addPartDefinition(document, 'Engine');
    expect(repository.create(definition).ok).toBe(true);

    const deleted = repository.delete(definition.id);
    expect(deleted.ok).toBe(true);
    expect(repository.validate()).toEqual([]);
  });
});

describe('passive model-health store (session wiring)', () => {
  beforeEach(() => {
    session.semanticSession.set(null);
    session.modelHealth.set(session.emptyModelHealth());
  });

  it('computes health on load and refreshes it after every repository mutation', () => {
    const sessionInst = session.createSemanticSession(createDocument('Vehicle'));
    expect(get(session.modelHealth)).toMatchObject({ errorCount: 0, warningCount: 0 });

    const scratch = createDocument('Vehicle');
    const definition = addPartDefinition(scratch, 'Engine');
    expect(sessionInst.repository.create(definition).ok).toBe(true);
    expect(get(session.modelHealth).warningCount).toBe(0);

    const usage = addPartUsage(scratch, 'engine', definition.id);
    const created = sessionInst.repository.create({ ...usage, definitionId: null });
    expect(created.ok).toBe(true);
    expect(get(session.modelHealth).warningCount).toBe(1);
    expect(get(session.modelHealth).diagnostics[0]).toMatchObject({
      ruleId: 'WF002-type-exists',
      severity: 'warning'
    });

    // Deleting the untyped usage clears the warning.
    expect(sessionInst.repository.delete(created.value!.id).ok).toBe(true);
    expect(get(session.modelHealth).warningCount).toBe(0);
  });

  it('resets when the session is unbound', () => {
    session.bindConceptStageSession('sys-health', 'Vehicle');
    expect(get(session.modelHealth)).toMatchObject({ errorCount: 0, warningCount: 0 });

    session.unbindConceptStageSession('sys-health');
    expect(get(session.modelHealth)).toEqual(session.emptyModelHealth());
  });
});