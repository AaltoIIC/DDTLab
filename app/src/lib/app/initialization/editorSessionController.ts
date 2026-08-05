import { get } from 'svelte/store';
import type { SystemType } from '$lib/types/types';
import { normalizeNodePositions, stripSyntheticRootNodes } from '$lib/editor-core/canvas/nodePositionNormalization';
import {
    currentEdges,
    currentItemDefinitions,
    currentNodes,
    currentPackages,
    currentPartDefinitions,
    currentReqs,
    currentSystemMeta
} from '$lib/domains/editor-core/state/activeEditorSessionStore';
import {
    createSystem,
    getSystem,
    saveSystem
} from '$lib/domains/system/state/systemCatalogStore';

export type EditorStage = 'concept' | 'design';

export interface EditorRouteInput {
    id?: string;
    stage: EditorStage;
}

export type EditorSessionResult =
    | { kind: 'ready'; stage: EditorStage; systemId: string }
    | { kind: 'redirect-home' }
    | { kind: 'redirect-stage'; id: string; stage: EditorStage };

export function initializeEditorSession(input: EditorRouteInput): EditorSessionResult {
    if (input.id) {
        const system = findSystem(input.id);

        if (!system) {
            return { kind: 'redirect-home' };
        }

        const systemStage: EditorStage = system.stage ?? 'design';

        // Preserve the route's existing guard: remounting the active system must
        // not overwrite an in-progress nested/unsaved editor session. The stage
        // must also match, otherwise a concept/design route change would be
        // incorrectly treated as already initialized.
        if (get(currentSystemMeta).id === input.id && systemStage === input.stage) {
            // A route can be reopened while the active stores still contain this
            // system. Re-anchor that active graph too, without replacing it with
            // the persisted snapshot and losing in-progress edits.
            currentNodes.set(normalizeNodePositions(stripSyntheticRootNodes(get(currentNodes))));
            return { kind: 'ready', stage: input.stage, systemId: input.id };
        }

        // Redirect before mutating active stores so a stage-only route change
        // cannot overwrite an unsaved session while the router settles.
        if (systemStage !== input.stage) {
            return {
                kind: 'redirect-stage',
                id: system.id,
                stage: systemStage
            };
        }

        loadSystemIntoEditor(system);
        return { kind: 'ready', stage: input.stage, systemId: system.id };
    }

    const newSystem = createSystem();
    const stage = input.stage;
    const nodes = normalizeNodePositions([]);

    currentSystemMeta.set({
        name: newSystem.name,
        date: newSystem.date,
        id: newSystem.id
    });
    currentNodes.set(nodes);
    currentEdges.set([]);
    currentReqs.set([]);
    currentPartDefinitions.set([]);
    currentItemDefinitions.set([]);
    currentPackages.set([]);

    saveSystem({
        ...newSystem,
        nodes,
        edges: [],
        requirements: [],
        partDefinitions: [],
        itemDefinitions: [],
        packages: [],
        parentSystemId: null,
        stage
    });

    return { kind: 'redirect-stage', id: newSystem.id, stage };
}

function findSystem(id: string): SystemType | undefined {
    return getSystem(id) ?? undefined;
}

function loadSystemIntoEditor(system: SystemType): void {
    currentSystemMeta.set({
        name: system.name,
        date: system.date,
        id: system.id
    });
    currentNodes.set(normalizeNodePositions(stripSyntheticRootNodes(system.nodes)));
    currentEdges.set(system.edges);
    currentReqs.set(system.requirements || []);
    currentPartDefinitions.set(system.partDefinitions || []);
    currentItemDefinitions.set(system.itemDefinitions || []);
    currentPackages.set(system.packages || []);
}
