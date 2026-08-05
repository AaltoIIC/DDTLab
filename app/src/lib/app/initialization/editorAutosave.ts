import { get } from 'svelte/store';
import {
    currentEdges,
    currentItemDefinitions,
    currentNodes,
    currentPackages,
    currentPartDefinitions,
    currentReqs,
    currentSystemMeta
} from '$lib/domains/editor-core/state/activeEditorSessionStore';
import { saveCurrentSystem } from '$lib/domains/editor-core/services/activeEditorActions';
import { navigationStack } from '$lib/concept-phase/nodeViewStore';

/**
 * Subscribe to active-session fields and persist changes on route unmount.
 * While a part/item view is open, currentNodes/currentEdges represent that
 * node's internal diagram; nodeViewStore commits it back to the hierarchy
 * on exit.
 */
export function startEditorAutosave(): () => void {
    let initialized = false;
    const autosave = () => {
        if (initialized && get(navigationStack).length === 0) saveCurrentSystem();
    };
    const unsubscribe = [
        currentSystemMeta.subscribe(autosave),
        currentEdges.subscribe(autosave),
        currentNodes.subscribe(autosave),
        currentReqs.subscribe(autosave),
        currentPartDefinitions.subscribe(autosave),
        currentItemDefinitions.subscribe(autosave),
        currentPackages.subscribe(autosave)
    ];
    initialized = true;

    return () => {
        for (const unsubscribeStore of unsubscribe) unsubscribeStore();
    };
}
