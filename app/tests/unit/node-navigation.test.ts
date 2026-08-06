import { beforeEach, describe, expect, it, vi } from 'vitest';
import { get } from 'svelte/store';
import type { Node } from '@xyflow/svelte';

vi.mock('$app/environment', () => ({ browser: false }));

const loadModules = async () => {
    const [nodeViewStore, session, historyModule] = await Promise.all([
        import('$lib/concept-stage/nodeViewStore'),
        import('$lib/domains/editor-core/state/activeEditorSessionStore'),
        import('$lib/domains/editor-core/state/editorHistoryNavigationStore')
    ]);
    return { nodeViewStore, session, historyModule };
};

const positionOf = (nodes: Node[], id: string) => nodes.find((n) => n.id === id)?.position;

const partNode = (id: string, children: Node[] = []): Node => ({
    id,
    type: 'part',
    data: { declaredName: id, nodes: children, edges: [] },
    position: { x: 0, y: 0 }
});

beforeEach(async () => {
    const { session, historyModule } = await loadModules();
    session.currentSystemMeta.set({ id: '', name: '', date: '' });
    session.currentNodes.set([]);
    session.currentEdges.set([]);
    session.currentReqs.set([]);
    session.currentPartDefinitions.set([]);
    session.currentItemDefinitions.set([]);
    session.currentPackages.set([]);
    historyModule.history.set({ currentIndex: -1, data: [] });
    await import('$lib/concept-stage/nodeViewStore').then(({ navigationStack }) =>
        navigationStack.set([])
    );
});

describe('node drill-down navigation', () => {
    it('normalizes the internal diagram to the shared canvas origin on entry', async () => {
        const { nodeViewStore, session } = await loadModules();
        session.currentNodes.set([
            partNode('node-1', [
                { id: 'a', type: 'part', data: {}, position: { x: 520, y: 330 } },
                { id: 'b', type: 'part', data: {}, position: { x: 900, y: 700 } }
            ])
        ]);

        nodeViewStore.navigateIntoNode('node-1', 'Node One');

        const nodes = get(session.currentNodes);
        expect(positionOf(nodes, 'a')).toEqual({ x: 100, y: 100 });
        expect(positionOf(nodes, 'b')).toEqual({ x: 480, y: 470 });
    });

    it('persists the normalized diagram coordinates after navigating back', async () => {
        const { nodeViewStore, session } = await loadModules();
        session.currentNodes.set([
            partNode('node-1', [
                { id: 'a', type: 'part', data: {}, position: { x: 520, y: 330 } },
                { id: 'b', type: 'part', data: {}, position: { x: 900, y: 700 } }
            ])
        ]);

        nodeViewStore.navigateIntoNode('node-1', 'Node One');
        // Simulate an edit inside the node's diagram: move node 'a'
        session.currentNodes.update((nodes) =>
            nodes.map((n) => (n.id === 'a' ? { ...n, position: { x: 200, y: 150 } } : n))
        );

        nodeViewStore.navigateBack();

        const rootNodes = get(session.currentNodes);
        expect(rootNodes[0].id).toBe('node-1');
        const storedDiagram = (rootNodes[0].data as any).nodes as Node[];
        // Coordinates stay in the (normalized) diagram space — untouched nodes
        // keep their entry-anchored positions, edited ones keep the edit.
        expect(positionOf(storedDiagram, 'a')).toEqual({ x: 200, y: 150 });
        expect(positionOf(storedDiagram, 'b')).toEqual({ x: 480, y: 470 });
    });

    it('normalizes each level of a nested drill-down independently', async () => {
        const { nodeViewStore, session } = await loadModules();
        session.currentNodes.set([
            partNode('node-a', [
                { id: 'a1', type: 'part', data: {}, position: { x: 600, y: 400 } },
                {
                    ...partNode('node-b', [
                        { id: 'g1', type: 'part', data: {}, position: { x: 850, y: 650 } }
                    ]),
                    position: { x: 800, y: 600 }
                }
            ])
        ]);

        nodeViewStore.navigateIntoNode('node-a', 'A');
        const levelA = get(session.currentNodes);
        expect(positionOf(levelA, 'a1')).toEqual({ x: 100, y: 100 });
        expect(positionOf(levelA, 'node-b')).toEqual({ x: 300, y: 300 });

        nodeViewStore.navigateIntoNode('node-b', 'B');
        expect(positionOf(get(session.currentNodes), 'g1')).toEqual({ x: 100, y: 100 });

        nodeViewStore.navigateBack();
        const backToA = get(session.currentNodes);
        const bInA = (backToA.find((n) => n.id === 'node-b')?.data as any).nodes as Node[];
        expect(positionOf(bInA, 'g1')).toEqual({ x: 100, y: 100 });

        nodeViewStore.navigateBack();
        const backToRoot = get(session.currentNodes);
        const aInRoot = (backToRoot.find((n) => n.id === 'node-a')?.data as any).nodes as Node[];
        expect(positionOf(aInRoot, 'a1')).toEqual({ x: 100, y: 100 });
        expect(positionOf(aInRoot, 'node-b')).toEqual({ x: 300, y: 300 });
        const bNested = (aInRoot.find((n) => n.id === 'node-b')?.data as any).nodes as Node[];
        expect(positionOf(bNested, 'g1')).toEqual({ x: 100, y: 100 });
    });

    it('refuses to navigate into package nodes (no internal view)', async () => {
        const { nodeViewStore, session } = await loadModules();
        const packageNode: Node = {
            id: 'pkg-1',
            type: 'package',
            data: {
                declaredName: 'Container',
                nodes: [{ id: 'inner', type: 'part', data: {}, position: { x: 10, y: 10 } }]
            },
            position: { x: 0, y: 0 }
        };
        session.currentNodes.set([packageNode]);

        nodeViewStore.navigateIntoNode('pkg-1', 'Container');

        expect(get(session.currentNodes)[0].id).toBe('pkg-1');
        expect(get(nodeViewStore.navigationStack)).toHaveLength(0);
    });

    it('shows internal port nodes for parts/items with no stored diagram', async () => {
        const { nodeViewStore, session } = await loadModules();
        const portedPart: Node = {
            id: 'part-1',
            type: 'part',
            data: {
                inputs: [{ name: 'in1' }],
                outputs: [{ name: 'out1' }]
            },
            position: { x: 0, y: 0 }
        };
        session.currentNodes.set([portedPart]);

        nodeViewStore.navigateIntoNode('part-1', 'Part One');

        const nodes = get(session.currentNodes);
        expect(nodes).toHaveLength(2);
        expect(nodes.every((n) => n.type === 'internalPort')).toBe(true);
        expect(positionOf(nodes, 'internal-port-input-in1')).toEqual({ x: 20, y: 150 });
        expect(positionOf(nodes, 'internal-port-output-out1')).toEqual({ x: 800, y: 150 });
    });
});
