import { writable, derived, get } from 'svelte/store';
import type { Node, Edge } from '@xyflow/svelte';
import { currentNodes, currentEdges, addToHistory } from '$lib/stores/stores';

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
    const stack = get(packageViewStack);
    const nodes = get(currentNodes);
    const edges = get(currentEdges);
    
    // If we're at root level (stack is empty), create a root view to save current state
    if (stack.length === 0) {
        packageViewStack.update(s => [{
            packageId: 'root',
            packageName: 'Root',
            nodes: nodes,
            edges: edges
        }]);
    } else {
        // Save current nodes/edges to the current package view
        packageViewStack.update(s => {
            const updated = [...s];
            updated[updated.length - 1].nodes = nodes;
            updated[updated.length - 1].edges = edges;
            return updated;
        });
    }

    // Find the package node to get its internal content
    const packageNode = nodes.find(n => n.id === packageId);
    const packageData = packageNode?.data as any;
    
    // Create new view with the package's internal content
    const newView: PackageView = {
        packageId,
        packageName,
        parentId,
        nodes: packageData?.nodes || [],
        edges: packageData?.edges || []
    };

    // Update the stack
    packageViewStack.update(stack => [...stack, newView]);
    
    // Update the current nodes and edges to show the package's content
    currentNodes.set(newView.nodes);
    currentEdges.set(newView.edges);
    
    // Add to history for undo/redo support
    addToHistory();
}

// Navigate back to parent
export function navigateBack() {
    const stack = get(packageViewStack);
    if (stack.length > 1) {
        // Save current package content before navigating back
        const currentView = stack[stack.length - 1];
        const currentPackageId = currentView.packageId;
        
        // Update the package node in the parent level with the current content
        const parentView = stack[stack.length - 2];
        parentView.nodes = parentView.nodes.map(node => {
            if (node.id === currentPackageId) {
                return {
                    ...node,
                    data: {
                        ...node.data,
                        nodes: get(currentNodes),
                        edges: get(currentEdges)
                    }
                };
            }
            return node;
        });

        // Remove current view from stack
        packageViewStack.update(stack => stack.slice(0, -1));
        
        // Restore parent level nodes/edges
        currentNodes.set(parentView.nodes);
        currentEdges.set(parentView.edges);
        
        // Add to history
        addToHistory();
    }
}

// Clear navigation (go to root)
export function navigateToRoot() {
    const stack = get(packageViewStack);
    
    // If we're already at root (no stack), do nothing
    if (stack.length === 0) {
        return;
    }
    
    // Save current content if we're in a package
    if (stack.length > 1) {
        const currentView = stack[stack.length - 1];
        const currentPackageId = currentView.packageId;
        
        // Update the package node in its parent level with current content
        const parentIndex = stack.length - 2;
        const parentView = stack[parentIndex];
        
        parentView.nodes = parentView.nodes.map(node => {
            if (node.id === currentPackageId) {
                return {
                    ...node,
                    data: {
                        ...node.data,
                        nodes: get(currentNodes),
                        edges: get(currentEdges)
                    }
                };
            }
            return node;
        });
    }
    
    // Restore root level content
    if (stack.length > 0 && stack[0].packageId === 'root') {
        currentNodes.set(stack[0].nodes);
        currentEdges.set(stack[0].edges);
    }
    
    packageViewStack.set([]);
    addToHistory();
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