import type { Node } from '@xyflow/svelte';
import { get, writable } from 'svelte/store';
import _ from 'lodash';
import { appendHistoryCursor, redoHistoryIndex, undoHistoryIndex } from '$lib/editor-core/history/historyTransitions';
import type {
    HistoryEntryType,
    NavigationContextType,
    SubsystemDataType
} from '$lib/types/types';
import {
    currentEdges,
    currentItemDefinitions,
    currentNodes,
    currentPackages,
    currentPartDefinitions,
    currentReqs,
    currentSystemMeta
} from '$lib/domains/editor-core/state/activeEditorSessionStore';
import { getSystem } from '$lib/domains/system/state/systemCatalogStore';
import {
    normalizeNodePositions,
    stripSyntheticRootNodes
} from '$lib/editor-core/canvas/nodePositionNormalization';

export const history = writable<{ currentIndex: number; data: HistoryEntryType[] }>({
    currentIndex: -1,
    data: []
});

export function addToHistory(): void {
    history.update((currentHistory) => {
        const nextData = currentHistory.currentIndex !== -1
            ? currentHistory.data.slice(0, currentHistory.currentIndex + 1)
            : [...currentHistory.data];
        const nextCursor = appendHistoryCursor({
            currentIndex: currentHistory.currentIndex,
            dataLength: currentHistory.data.length
        });

        nextData.push({
            systemMeta: _.cloneDeep(get(currentSystemMeta)),
            nodes: _.cloneDeep(get(currentNodes)),
            edges: _.cloneDeep(get(currentEdges)),
            requirements: _.cloneDeep(get(currentReqs)),
            partDefinitions: _.cloneDeep(get(currentPartDefinitions)),
            itemDefinitions: _.cloneDeep(get(currentItemDefinitions)),
            packages: _.cloneDeep(get(currentPackages))
        });

        if (nextCursor.dataLength > 10) nextData.shift();
        return { currentIndex: -1, data: nextData };
    });
}

function restoreHistoryEntry(entry: HistoryEntryType): void {
    currentSystemMeta.set(entry.systemMeta);
    currentNodes.set(entry.nodes);
    currentEdges.set(entry.edges);
    currentReqs.set(entry.requirements);
    currentPartDefinitions.set(entry.partDefinitions);
    currentItemDefinitions.set(entry.itemDefinitions);
    currentPackages.set(entry.packages);
}

export function undoHistory(): void {
    const snapshot = get(history);
    const currentIndex = undoHistoryIndex({
        currentIndex: snapshot.currentIndex,
        dataLength: snapshot.data.length
    });
    if (currentIndex === null) return;
    history.update((currentHistory) => ({ ...currentHistory, currentIndex }));
    restoreHistoryEntry(get(history).data[currentIndex]);
}

export function redoHistory(): void {
    const snapshot = get(history);
    if (snapshot.currentIndex === -1 || snapshot.currentIndex >= snapshot.data.length - 1) return;

    const entryIndex = redoHistoryIndex({
        currentIndex: snapshot.currentIndex,
        dataLength: snapshot.data.length
    });
    if (entryIndex === null) return;
    const currentIndex = entryIndex === snapshot.data.length - 1 ? -1 : entryIndex;
    history.update((currentHistory) => ({ ...currentHistory, currentIndex }));

    const entry = get(history).data[entryIndex];
    if (entry) restoreHistoryEntry(entry);
}

export const navigationContext = writable<NavigationContextType>({
    path: [],
    currentSystemId: '',
    parentSystemId: '',
    rootSystemId: ''
});

export const currentViewSystemId = writable<string>('');

export function navigateToSubsystem(subsystemId: string, parentNodeId: string): void {
    const subsystem = getSystem(subsystemId);
    if (!subsystem) {
        console.error('Subsystem not found:', subsystemId);
        return;
    }

    const parentNodeData = get(currentNodes).find((node) => node.id === parentNodeId)?.data;
    const parentNodeElement = parentNodeData?.element as SubsystemDataType | undefined;
    if (!parentNodeElement) return;

    const internalPortNodes: Node[] = [
        ...parentNodeElement.connectors
            .filter((connector) => connector.type === 'input')
            .map((connector, index) => ({
                id: `internal-port-input-${connector.name}`,
                type: 'Internal',
                position: { x: 20, y: 150 + index * 100 },
                data: {
                    ...connector,
                    portType: 'input',
                    parentNodeId,
                    parentNodeName: parentNodeData?.name as string,
                    isInternal: true
                },
                draggable: true,
                deletable: false
            })),
        ...parentNodeElement.connectors
            .filter((connector) => connector.type === 'output')
            .map((connector, index) => ({
                id: `internal-port-output-${connector.name}`,
                type: 'Internal',
                position: { x: 800, y: 150 + index * 100 },
                data: {
                    ...connector,
                    portType: 'output',
                    parentNodeId,
                    parentNodeName: parentNodeData?.name as string,
                    isInternal: true
                },
                draggable: true,
                deletable: false
            }))
    ];

    // Normalize the stored content only — the internal port nodes are re-created at
    // fixed positions on every navigation, so including them in the normalization
    // would let their min-corner (x:20, y:150) dominate and drift the content on
    // each enter/leave cycle. Content-only normalization is idempotent.
    const subNodes = [
        ...normalizeNodePositions(
            stripSyntheticRootNodes(subsystem.nodes).filter((node) => node.type !== 'Internal')
        ),
        ...internalPortNodes
    ];

    navigationContext.update((context) => ({
        ...context,
        path: [...context.path, get(currentSystemMeta)],
        currentSystemId: subsystem.id
    }));
    currentSystemMeta.set({ id: subsystem.id, name: subsystem.name, date: subsystem.date });
    currentNodes.set(subNodes);
    currentEdges.set(subsystem.edges);
    currentReqs.set(subsystem.requirements || []);
    currentPartDefinitions.set(subsystem.partDefinitions || []);
    currentItemDefinitions.set(subsystem.itemDefinitions || []);
    currentPackages.set(subsystem.packages || []);
    currentViewSystemId.set(subsystem.id);
    history.set({ currentIndex: -1, data: [] });
    addToHistory();
}

export function navigateToParent(): void {
    const context = get(navigationContext);
    if (context.path.length === 0) return;

    const parentMeta = context.path[context.path.length - 1];
    const parentSystem = getSystem(parentMeta.id);
    if (!parentSystem) {
        console.error('Parent system not found:', parentMeta.id);
        return;
    }

    navigationContext.update((currentContext) => ({
        ...currentContext,
        path: currentContext.path.slice(0, -1),
        currentSystemId: parentMeta.id,
        parentSystemId: currentContext.path.length > 1
            ? currentContext.path[currentContext.path.length - 2].id
            : ''
    }));
    currentSystemMeta.set(parentMeta);
    currentNodes.set(normalizeNodePositions(stripSyntheticRootNodes(parentSystem.nodes)));
    currentEdges.set(parentSystem.edges);
    currentReqs.set(parentSystem.requirements || []);
    currentPartDefinitions.set(parentSystem.partDefinitions || []);
    currentItemDefinitions.set(parentSystem.itemDefinitions || []);
    currentPackages.set(parentSystem.packages || []);
    currentViewSystemId.set(parentMeta.id);
    history.set({ currentIndex: -1, data: [] });
    addToHistory();
}

export function resetNavigation(): void {
    const systemId = get(currentSystemMeta).id;
    navigationContext.set({
        path: [],
        currentSystemId: systemId,
        parentSystemId: '',
        rootSystemId: systemId
    });
    currentViewSystemId.set(systemId);
}
