import { describe, expect, it, beforeEach, vi } from 'vitest';
import { get } from 'svelte/store';
import type { Node } from '@xyflow/svelte';

vi.mock('$app/environment', () => ({ browser: false }));

import {
  ModelRepository,
  addPackage,
  addPartDefinition,
  addPartUsage,
  createDocument,
  getOwnedIds
} from '$lib/concept-stage/sysml';
import * as session from '$lib/concept-stage/sysml/session';
import * as editorStore from '$lib/domains/editor-core/state/activeEditorSessionStore';

const {
  upsertPackageEntryForCanvasNode,
  removePackageEntryForCanvasNode,
  renamePackageEntryForCanvasNode,
  packageEntryForCanvasNode,
  canvasNodeIdForPackageEntry,
  isCanvasNodeSaved
} = editorStore;

const partNode = (id: string): Node => ({
  id,
  type: 'part',
  position: { x: 0, y: 0 },
  data: { declaredName: id }
});

beforeEach(() => {
  editorStore.currentPackages.set([]);
  session.semanticSession.set(null);
});

describe('re-ownership move (Phase 3 package wrap/unwrap)', () => {
  it('re-owns an element from one package to another and keeps membership lists in sync', () => {
    const document = createDocument('Vehicle');
    const repository = new ModelRepository(document);
    const packageA = addPackage(document, 'Powertrain', null);
    const packageB = addPackage(document, 'Cooling', null);
    const definition = addPartDefinition(document, 'Motor');
    const usage = addPartUsage(document, 'motorA', definition.id);
    // Commit everything through the repository.
    repository.create(packageA);
    repository.create(packageB);
    repository.create(definition);
    repository.create(usage);

    const moved = repository.move(usage.id, packageA.id);
    expect(moved.ok).toBe(true);
    expect(repository.getElement(usage.id)?.ownerId).toBe(packageA.id);
    expect(repository.getElement(packageA.id)).toMatchObject({ memberIds: [usage.id] });
    expect(repository.getElement(packageB.id)).toMatchObject({ memberIds: [] });

    // Move back to the root namespace.
    const back = repository.move(usage.id, null);
    expect(back.ok).toBe(true);
    expect(repository.getElement(usage.id)?.ownerId).toBeNull();
    expect(repository.getElement(packageA.id)).toMatchObject({ memberIds: [] });
    expect(getOwnedIds(repository.read(), null)).toContain(usage.id);
  });

  it('rejects self-ownership and unknown destinations without mutation', () => {
    const source = createDocument('Vehicle');
    const definition = addPartDefinition(source, 'Motor');
    const usage = addPartUsage(source, 'motorA', definition.id);
    const repository = new ModelRepository(source);

    const self = repository.move(usage.id, usage.id);
    expect(self.ok).toBe(false);

    const missing = repository.move(usage.id, 'no-such-owner');
    expect(missing.ok).toBe(false);
    expect(missing.diagnostics[0].ruleId).toBe('WF003-ownership');

    expect(repository.getElement(usage.id)?.ownerId).toBeNull();
  });

  it('rejects a move that would violate name uniqueness in the destination namespace', () => {
    const source = createDocument('Vehicle');
    const definition = addPartDefinition(source, 'Motor');
    const repository = new ModelRepository(source);

    const packageElement = addPackage(source, 'Pack', null);
    const inside = addPartUsage(source, 'motorB', definition.id);
    const usage = addPartUsage(source, 'duplicate', definition.id);
    repository.create(packageElement);
    repository.create(inside);
    repository.create(usage);
    repository.move(inside.id, packageElement.id);
    // Inside the package there is now an element named like `usage`.
    repository.update(inside.id, { name: 'duplicate' });

    // Moving `duplicate` into the package would create two same-named members.
    const conflicting = repository.move(usage.id, packageElement.id);
    expect(conflicting.ok).toBe(false);
    expect(conflicting.diagnostics.some((d) => d.ruleId === 'WF001-name-uniqueness')).toBe(true);
    expect(repository.getElement(usage.id)?.ownerId).toBeNull(); // rolled back
  });

  it('moves elements inside one transaction with full rollback on conflict', () => {
    const source = createDocument('Vehicle');
    const repository = new ModelRepository(source);
    const packageElement = addPackage(source, 'Pack', null);
    const definition = addPartDefinition(source, 'Motor');
    repository.create(packageElement);
    repository.create(definition);

    const usageA = addPartUsage(source, 'motorA', definition.id);
    repository.create(usageA);

    // Transaction: move usageA under the package, then a dangling-reference
    // create makes the final validation fail and rolls the whole thing back.
    const result = repository.transaction((transaction) => {
      transaction.reown(usageA.id, packageElement.id);
      transaction.create({
        id: 'bad-usage',
        metaclass: 'partUsage',
        category: 'usage',
        name: 'bad',
        ownerId: null,
        definitionId: 'no-such-definition',
        ownedUsageIds: [],
        attributeIds: []
      });
    });
    expect(result.ok).toBe(false);
    // The move must have been rolled back with the rest of the transaction.
    expect(repository.getElement(usageA.id)?.ownerId).toBeNull();
  });
});

describe('canvas package save/unsave wrap (Phase 3 saved-package binding)', () => {
  const withSession = () => {
    const sessionInst = session.createSemanticSession(createDocument('Vehicle'));
    session.setSemanticSession(sessionInst);
    return sessionInst;
  };

  const createDef = (sessionInst: ReturnType<typeof withSession>, name: string, metaclass: 'partDefinition' | 'itemDefinition' = 'partDefinition') => {
    const created = sessionInst.repository.create(
      metaclass === 'partDefinition'
        ? { id: `d-${name}-${Math.random().toString(36).slice(2, 8)}`, metaclass: 'partDefinition', category: 'definition', name, ownerId: null, ownedUsageIds: [], attributeIds: [] }
        : { id: `d-${name}-${Math.random().toString(36).slice(2, 8)}`, metaclass: 'itemDefinition', category: 'definition', name, ownerId: null, ownedUsageIds: [], attributeIds: [] }
    );
    return created.value!;
  };

  const createUsage = (sessionInst: ReturnType<typeof withSession>, name: string, definitionId: string) => {
    const created = sessionInst.repository.create({
      id: `u-${name}-${Math.random().toString(36).slice(2, 8)}`,
      metaclass: 'partUsage',
      category: 'usage',
      name,
      ownerId: null,
      definitionId,
      ownedUsageIds: [],
      attributeIds: []
    });
    return created.value!;
  };

  it('save wraps the mapped members under a model Package element bound to the canvas node', () => {
    const sessionInst = withSession();
    const engineDef = createDef(sessionInst, 'Engine');
    const engine = createUsage(sessionInst, 'engine', engineDef.id);
    const pumpDef = createDef(sessionInst, 'Pump');
    const pump = createUsage(sessionInst, 'pump', pumpDef.id);
    sessionInst.legacyToModel.set('canvas-engine', engine.id);
    sessionInst.legacyToModel.set('canvas-pump', pump.id);

    session.saveCanvasPackageMembers('package-node-1', 'Powertrain', [partNode('canvas-engine'), partNode('canvas-pump')]);

    const boundId = session.modelIdForLegacyId('package-node-1');
    expect(boundId).toBeDefined();
    const bound = sessionInst.repository.getElement(boundId!)!;
    expect(bound.metaclass).toBe('package');
    expect((bound as { memberIds: string[] }).memberIds.sort()).toEqual([engine.id, pump.id].sort());
    expect(sessionInst.repository.getElement(engine.id)?.ownerId).toBe(boundId);
    expect(sessionInst.repository.getElement(pump.id)?.ownerId).toBe(boundId);
  });

  it('re-saving is convergent: members dragged out of the package move back to the root', () => {
    const sessionInst = withSession();
    const engineDef = createDef(sessionInst, 'Engine');
    const engine = createUsage(sessionInst, 'engine', engineDef.id);
    const pumpDef = createDef(sessionInst, 'Pump');
    const pump = createUsage(sessionInst, 'pump', pumpDef.id);
    sessionInst.legacyToModel.set('canvas-engine', engine.id);
    sessionInst.legacyToModel.set('canvas-pump', pump.id);

    session.saveCanvasPackageMembers('pkg-1', 'Powertrain', [partNode('canvas-engine'), partNode('canvas-pump')]);
    const packageId = session.modelIdForLegacyId('pkg-1')!;
    expect(sessionInst.repository.getElement(packageId)).toMatchObject({ memberIds: expect.arrayContaining([engine.id, pump.id]) });

    // User drags the pump outside the package rectangle and re-saves.
    session.saveCanvasPackageMembers('pkg-1', 'Powertrain', [partNode('canvas-engine')]);
    expect(sessionInst.repository.getElement(packageId)).toMatchObject({ memberIds: [engine.id] });
    expect(sessionInst.repository.getElement(pump.id)?.ownerId).toBeNull();
  });

  it('unsave (delete from list / delete canvas node) moves members back to the root and removes the element', () => {
    const sessionInst = withSession();
    const engineDef = createDef(sessionInst, 'Engine');
    const engine = createUsage(sessionInst, 'engine', engineDef.id);
    sessionInst.legacyToModel.set('canvas-engine', engine.id);

    session.saveCanvasPackageMembers('pkg-1', 'FuelSystem', [partNode('canvas-engine')]);
    const packageId = session.modelIdForLegacyId('pkg-1')!;
    expect(sessionInst.repository.getElement(engine.id)?.ownerId).toBe(packageId);

    session.deleteCanvasPackageMembers('pkg-1');

    expect(sessionInst.repository.getElement(packageId)).toBeUndefined();
    expect(sessionInst.repository.getElement(engine.id)?.ownerId).toBeNull();
    expect(session.modelIdForLegacyId('pkg-1')).toBeUndefined();
  });

  it('no-ops without a session, and creates an empty package when members are unmapped', () => {
    // No session bound: no throw, no state anywhere.
    expect(() => session.saveCanvasPackageMembers('pkg-x', 'Pack', [partNode('n1')])).not.toThrow();
    expect(() => session.deleteCanvasPackageMembers('pkg-x')).not.toThrow();

    // Bound session, but the inside canvas node has no model mapping: the
    // saved package element is created (the entry exists in the list), but the
    // unmapped member cannot be re-owned.
    const sessionInst = withSession();
    session.saveCanvasPackageMembers('pkg-x', 'Pack', [partNode('canvas-unmapped')]);
    const boundId = session.modelIdForLegacyId('pkg-x');
    expect(boundId).toBeDefined();
    expect(sessionInst.repository.getElement(boundId!)).toMatchObject({ metaclass: 'package', memberIds: [] });

    // Unmapped member was never in the model, so nothing to unwrap.
    session.deleteCanvasPackageMembers('pkg-x');
    expect(session.modelIdForLegacyId('pkg-x')).toBeUndefined();
  });
});

describe('saved-package list binding (Phase 3 store helpers)', () => {
  const snapshot = (name: string) => ({ name, type: 'package' as const, description: '', data: { nodes: [], edges: [] } });

  it('upserts one entry per canvas node: re-saving never duplicates', () => {
    const first = upsertPackageEntryForCanvasNode('node-a', snapshot('Cooling'));
    expect(get(editorStore.currentPackages)).toHaveLength(1);

    // Re-saving the same canvas node refreshes the same entry.
    const second = upsertPackageEntryForCanvasNode('node-a', snapshot('Cooling (revised)'));
    expect(get(editorStore.currentPackages)).toHaveLength(1);
    expect(second.id).toBe(first.id);
    expect(get(editorStore.currentPackages)[0].name).toBe('Cooling (revised)');
    expect(packageEntryForCanvasNode('node-a')?.id).toBe(first.id);
  });

  it('binds distinct entries to distinct canvas nodes and resolves both directions', () => {
    upsertPackageEntryForCanvasNode('node-a', snapshot('Cooling'));
    upsertPackageEntryForCanvasNode('node-b', snapshot('Lubrication'));

    expect(get(editorStore.currentPackages)).toHaveLength(2);
    expect(isCanvasNodeSaved('node-a')).toBe(true);
    expect(isCanvasNodeSaved('node-b')).toBe(true);
    expect(isCanvasNodeSaved('node-c')).toBe(false);

    const entryA = packageEntryForCanvasNode('node-a')!;
    expect(canvasNodeIdForPackageEntry(entryA.id)).toBe('node-a');
    expect(canvasNodeIdForPackageEntry('missing')).toBeUndefined();
  });

  it('propagates canvas-node rename to the bound entry and delete removes both sides', () => {
    upsertPackageEntryForCanvasNode('node-a', snapshot('Cooling'));
    renamePackageEntryForCanvasNode('node-a', 'Cooling System');
    expect(get(editorStore.currentPackages)[0].name).toBe('Cooling System');

    removePackageEntryForCanvasNode('node-a');
    expect(get(editorStore.currentPackages)).toHaveLength(0);
    expect(isCanvasNodeSaved('node-a')).toBe(false);
  });
});
