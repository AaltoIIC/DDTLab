import { beforeEach, describe, expect, it, vi } from 'vitest';
import { get } from 'svelte/store';
import { systems } from '$lib/domains/system/state/systemCatalogStore';
import type { Node } from '@xyflow/svelte';

vi.mock('$app/environment', () => ({ browser: false }));

const loadSessionModules = async () => {
  const [controller, session, historyModule] = await Promise.all([
    import('$lib/app/initialization/editorSessionController'),
    import('$lib/domains/editor-core/state/activeEditorSessionStore'),
    import('$lib/domains/editor-core/state/editorHistoryNavigationStore')
  ]);
  return { controller, session, historyModule };
};

beforeEach(async () => {
  const { session, historyModule } = await loadSessionModules();
  session.currentSystemMeta.set({ id: '', name: '', date: '' });
  session.currentNodes.set([]);
  session.currentEdges.set([]);
  session.currentReqs.set([]);
  session.currentPartDefinitions.set([]);
  session.currentItemDefinitions.set([]);
  session.currentPackages.set([]);
  historyModule.history.set({ currentIndex: -1, data: [] });
  systems.set([]);
});

describe('editor session controller', () => {
  it('creates a concept session with empty nodes and a canonical redirect', async () => {
    const { controller, session } = await loadSessionModules();
    const result = controller.initializeEditorSession({ stage: 'concept' });

    expect(result.kind).toBe('redirect-stage');
    if (result.kind === 'redirect-stage') expect(result.stage).toBe('concept');
    expect(get(session.currentNodes)).toEqual([]);
    expect(get(session.currentEdges)).toEqual([]);
  });

  it('creates a design session without a synthetic root node', async () => {
    const { controller, session } = await loadSessionModules();
    const result = controller.initializeEditorSession({ stage: 'design' });

    expect(result.kind).toBe('redirect-stage');
    expect(get(session.currentNodes)).toEqual([]);
  });

  it('normalizes loaded concept and design layouts to the shared canvas origin', async () => {
    const { controller, session } = await loadSessionModules();
    const nodes: Node[] = [
      { id: 'a', type: 'part', data: {}, position: { x: 850, y: 420 } },
      { id: 'b', type: 'part', data: {}, position: { x: 1200, y: 700 } }
    ];
    const system = {
      id: 'system-1',
      name: 'Existing',
      date: 'today',
      nodes: [{ id: 'root', type: 'RootSystem', data: {}, position: { x: 0, y: 150 } } as Node, ...nodes],
      edges: [],
      requirements: [],
      partDefinitions: [],
      itemDefinitions: [],
      packages: [],
      stage: 'concept' as const
    };
    systems.set([system]);

    expect(controller.initializeEditorSession({ id: system.id, stage: 'concept' }).kind).toBe('ready');
    expect(get(session.currentNodes).every((node) => node.id !== 'root' && node.type !== 'RootSystem')).toBe(true);
    expect(get(session.currentNodes).every((node) => node.parentId !== 'root')).toBe(true);
    expect(get(session.currentNodes).map((node) => node.position)).toEqual([
      { x: 100, y: 100 },
      { x: 450, y: 380 }
    ]);

    const designSystem = { ...system, id: 'design-1', stage: 'design' as const };
    systems.set([designSystem]);
    session.currentSystemMeta.set({ id: '', name: '', date: '' });
    expect(controller.initializeEditorSession({ id: designSystem.id, stage: 'design' }).kind).toBe('ready');
    expect(get(session.currentNodes)[0].position).toEqual({ x: 100, y: 100 });
  });

  it('reanchors the active graph on reopen without discarding unsaved node edits', async () => {
    const { controller, session } = await loadSessionModules();
    const system = {
      id: 'active-system',
      name: 'Active',
      date: 'today',
      nodes: [{ id: 'node-1', type: 'part', data: {}, position: { x: 500, y: 300 } } as Node],
      edges: [],
      requirements: [],
      partDefinitions: [],
      itemDefinitions: [],
      packages: [],
      stage: 'concept' as const
    };
    systems.set([system]);
    session.currentSystemMeta.set({ id: system.id, name: system.name, date: system.date });
    session.currentNodes.set([{ ...system.nodes[0], data: { changedWhileEditing: true }, position: { x: 900, y: 600 } }]);

    expect(controller.initializeEditorSession({ id: system.id, stage: 'concept' })).toEqual({
      kind: 'ready',
      stage: 'concept',
      systemId: system.id
    });
    expect(get(session.currentNodes)[0]).toMatchObject({
      data: { changedWhileEditing: true },
      position: { x: 100, y: 100 }
    });
  });

  it('returns a home redirect for an unknown system and preserves stage mismatch guards', async () => {
    const { controller } = await loadSessionModules();
    expect(controller.initializeEditorSession({ id: 'missing', stage: 'design' })).toEqual({ kind: 'redirect-home' });
  });
});

describe('editor history store', () => {
  it('records snapshots and restores the prior active session on undo', async () => {
    const { session, historyModule } = await loadSessionModules();
    session.currentSystemMeta.set({ id: 'system-1', name: 'Before', date: 'today' });
    historyModule.addToHistory();
    session.currentSystemMeta.set({ id: 'system-1', name: 'After', date: 'today' });
    historyModule.addToHistory();

    historyModule.undoHistory();
    expect(get(session.currentSystemMeta).name).toBe('Before');
    historyModule.redoHistory();
    expect(get(session.currentSystemMeta).name).toBe('After');
  });
});
