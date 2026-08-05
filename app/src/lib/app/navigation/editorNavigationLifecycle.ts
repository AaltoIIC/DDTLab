import {
    addToHistory,
    navigateToParent,
    navigationContext,
    resetNavigation
} from '$lib/domains/editor-core/state/editorHistoryNavigationStore';
import { get } from 'svelte/store';

export function startEditorNavigationLifecycle(): () => void {
    addToHistory();
    resetNavigation();

    const handleKeydown = (event: KeyboardEvent) => {
        if (event.key === 'Escape' && get(navigationContext).path.length > 0) {
            navigateToParent();
        }
    };

    window.addEventListener('keydown', handleKeydown);
    return () => window.removeEventListener('keydown', handleKeydown);
}
