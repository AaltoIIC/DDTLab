import { writable, derived } from 'svelte/store';
import type { Node, Edge } from '@xyflow/svelte';

export interface PackageView {
    packageId: string;
    packageName: string;
    parentId?: string;
    nodes: Node[];
    edges: Edge[];
}

// Stack of package views for breadcrumb navigation
export const packageViewStack = writable<PackageView[]>([]);

// Current package being viewed (top of stack)
export const currentPackageView = derived(
    packageViewStack,
    $stack => $stack.length > 0 ? $stack[$stack.length - 1] : null
);

// Navigate into a package
export function navigateToPackage(packageId: string, packageName: string, parentId?: string) {
    packageViewStack.update(stack => {
        const newView: PackageView = {
            packageId,
            packageName,
            parentId,
            nodes: [],
            edges: []
        };
        return [...stack, newView];
    });
}

// Navigate back to parent
export function navigateBack() {
    packageViewStack.update(stack => {
        if (stack.length > 1) {
            return stack.slice(0, -1);
        }
        return stack;
    });
}

// Clear navigation (go to root)
export function navigateToRoot() {
    packageViewStack.set([]);
}

// Update nodes/edges for current package
export function updateCurrentPackageContent(nodes: Node[], edges: Edge[]) {
    packageViewStack.update(stack => {
        if (stack.length > 0) {
            const updated = [...stack];
            updated[updated.length - 1] = {
                ...updated[updated.length - 1],
                nodes,
                edges
            };
            return updated;
        }
        return stack;
    });
}