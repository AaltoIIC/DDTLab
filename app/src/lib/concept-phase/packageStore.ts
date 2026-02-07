import { writable, derived, get } from 'svelte/store';
import type { Node, Edge } from '@xyflow/svelte';
import { currentNodes, currentEdges, addToHistory } from '$lib/stores/stores.svelte';

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

    // Create internal port nodes if this is a part or item (not a package)
    let internalPortNodes: Node[] = [];
    if (packageNode?.type === 'part' || packageNode?.type === 'item') {
        const inputs = packageData?.inputs || [];
        const outputs = packageData?.outputs || [];

        // Create internal nodes for input ports (appear on left side)
        inputs.forEach((port: any, index: number) => {
            internalPortNodes.push({
                id: `internal-port-input-${port.name}`,
                type: 'internalPort',
                position: { x: 20, y: 150 + index * 100 },  // More spread out vertically
                data: {
                    ...port,
                    portType: 'input',
                    parentNodeId: packageId,
                    parentNodeName: packageName,
                    isInternal: true
                },
                draggable: true,  // Allow users to position ports where needed
                deletable: false
            });
        });

        // Create internal nodes for output ports (appear on right side)
        outputs.forEach((port: any, index: number) => {
            internalPortNodes.push({
                id: `internal-port-output-${port.name}`,
                type: 'internalPort',
                position: { x: 800, y: 150 + index * 100 },  // Further right and more spread
                data: {
                    ...port,
                    portType: 'output',
                    parentNodeId: packageId,
                    parentNodeName: packageName,
                    isInternal: true
                },
                draggable: true,  // Allow users to position ports where needed
                deletable: false
            });
        });
    }

    // Create new view with the package's internal content plus internal port nodes
    const newView: PackageView = {
        packageId,
        packageName,
        parentId,
        nodes: [...(packageData?.nodes || []), ...internalPortNodes],
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

        // Filter out internal port nodes before saving
        const currentNodesFiltered = get(currentNodes).filter(n => n.type !== 'internalPort');
        const currentEdgesValue = get(currentEdges);

        // Update the package node in the parent level with the current content
        const parentView = stack[stack.length - 2];
        parentView.nodes = parentView.nodes.map(node => {
            if (node.id === currentPackageId) {
                return {
                    ...node,
                    data: {
                        ...node.data,
                        nodes: currentNodesFiltered,
                        edges: currentEdgesValue
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

// Navigate to a specific level in the stack
export function navigateToLevel(targetIndex: number) {
    const stack = get(packageViewStack);
    const currentLevel = stack.length - 1;
    
    // If we're already at the target level, do nothing
    if (targetIndex === currentLevel) {
        return;
    }
    
    // Save current content to the stack
    if (currentLevel >= 0) {
        let updatedStack = [...stack];

        // Filter out internal port nodes before saving
        const currentNodesFiltered = get(currentNodes).filter(n => n.type !== 'internalPort');

        updatedStack[currentLevel] = {
            ...updatedStack[currentLevel],
            nodes: currentNodesFiltered,
            edges: get(currentEdges)
        };

        // Now propagate changes up the stack
        // Start from current level and work backwards to update all parent references
        for (let i = currentLevel; i > targetIndex; i--) {
            const childView = updatedStack[i];
            const parentView = updatedStack[i - 1];

            // Filter out internal port nodes from child view
            const childNodesFiltered = childView.nodes.filter(n => n.type !== 'internalPort');

            // Update the child node in the parent's nodes array
            parentView.nodes = parentView.nodes.map(node => {
                if (node.id === childView.packageId) {
                    return {
                        ...node,
                        data: {
                            ...node.data,
                            nodes: childNodesFiltered,
                            edges: childView.edges
                        }
                    };
                }
                return node;
            });
        }
        
        // Update the stack with all the propagated changes
        packageViewStack.set(updatedStack);
        
        // Now navigate to the target level
        const targetView = updatedStack[targetIndex];
        currentNodes.set(targetView.nodes);
        currentEdges.set(targetView.edges);
        
        // Trim the stack to the target level
        packageViewStack.update(s => s.slice(0, targetIndex + 1));
    }
    
    addToHistory();
}

// Clear navigation (go to root)
export function navigateToRoot() {
    const stack = get(packageViewStack);
    
    // If we're already at root (no stack), do nothing
    if (stack.length === 0) {
        return;
    }
    
    // Use navigateToLevel to properly save all intermediate content
    navigateToLevel(0);
    
    // Restore root level content and clear stack
    if (stack[0].packageId === 'root') {
        const rootView = get(packageViewStack)[0];
        currentNodes.set(rootView.nodes);
        currentEdges.set(rootView.edges);
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