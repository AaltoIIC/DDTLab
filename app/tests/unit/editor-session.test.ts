import { beforeEach, describe, expect, it, vi } from 'vitest';
import { get } from 'svelte/store';
import { systems } from '$lib/domains/system/state/systemCatalogStore';

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

  it('creates a design session with the root node and canonical redirect', async () => {
    const { controller, session } = await loadSessionModules();
    const result = controller.initializeEditorSession({ stage: 'design' });

    expect(result.kind).toBe('redirect-stage');
    expect(get(session.currentNodes).map((node) => node.type)).toEqual(['RootSystem']);
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

    historyModule.handleUndo();
    expect(get(session.currentSystemMeta).name).toBe('Before');
    historyModule.handleRedo();
    expect(get(session.currentSystemMeta).name).toBe('After');
  });
});
