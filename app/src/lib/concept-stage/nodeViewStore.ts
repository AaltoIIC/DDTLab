import { writable, derived, get } from 'svelte/store';
import type { Node, Edge } from '@xyflow/svelte';
import { currentNodes, currentEdges } from '$lib/domains/editor-core/state/activeEditorSessionStore';
import { addToHistory } from '$lib/domains/editor-core/state/editorHistoryNavigationStore';
import { saveCurrentSystem } from '$lib/domains/editor-core/services/activeEditorActions';
import { normalizeNodePositions } from '$lib/editor-core/canvas/nodePositionNormalization';

/**
 * A level of the concept-stage drill-down navigation. Double-clicking a part or
 * item usage opens its internal diagram. Package nodes are plain visual
 * containers on the same level as the nodes they wrap — they have no internal
 * view and are NOT navigable.
 */
export interface NodeView {
    nodeId: string;
    nodeName: string;
    parentId?: string;
    nodes: Node[];
    edges: Edge[];
}

// Stack of nested node views for breadcrumb navigation
export const navigationStack = writable<NodeView[]>([]);

// Current node being viewed (top of stack)
export const currentNodeView = derived(
    navigationStack,
    $stack => $stack.length > 0 ? $stack[$stack.length - 1] : null
);

// Navigate into a part/item usage to inspect its internal diagram
export function navigateIntoNode(nodeId: string, nodeName: string, parentId?: string) {
    const stack = get(navigationStack);
    const nodes = get(currentNodes);
    const edges = get(currentEdges);

    // Only part and item usages have an internal diagram — packages are
    // containers that wrap nodes at the same level, so they cannot be entered.
    const node = nodes.find(n => n.id === nodeId);
    if (!node || (node.type !== 'part' && node.type !== 'item')) return;

    // If we're at root level (stack is empty), create a root view to save current state
    if (stack.length === 0) {
        navigationStack.update(s => [{
            nodeId: 'root',
            nodeName: 'Root',
            nodes,
            edges
        }]);
    } else {
        // Save current nodes/edges to the current node view
        navigationStack.update(s => {
            const updated = [...s];
            updated[updated.length - 1].nodes = nodes;
            updated[updated.length - 1].edges = edges;
            return updated;
        });
    }

    const nodeData = node.data as any;

    // Anchor the internal diagram at the shared canvas origin so it sits near
    // the fixed-position internal port nodes, no matter where the stored diagram
    // coordinates were. The diagram is the node's own space (never rendered on
    // the parent canvas), so the normalized positions persist as-is — exactly
    // like the design stage re-anchors subsystem content on load.
    const storedContent: Node[] = Array.isArray(nodeData?.nodes) ? nodeData.nodes as Node[] : [];
    const normalizedContent = normalizeNodePositions(storedContent);

    // Create internal port nodes for the node's inputs (left) and outputs (right)
    const internalPortNodes: Node[] = [];

    (nodeData?.inputs || []).forEach((port: any, index: number) => {
        internalPortNodes.push({
            id: `internal-port-input-${port.name}`,
            type: 'internalPort',
            position: { x: 20, y: 150 + index * 100 },  // More spread out vertically
            data: {
                ...port,
                portType: 'input',
                parentNodeId: nodeId,
                parentNodeName: nodeName,
                isInternal: true
            },
            draggable: true,  // Allow users to position ports where needed
            deletable: false
        });
    });

    (nodeData?.outputs || []).forEach((port: any, index: number) => {
        internalPortNodes.push({
            id: `internal-port-output-${port.name}`,
            type: 'internalPort',
            position: { x: 800, y: 150 + index * 100 },  // Further right and more spread
            data: {
                ...port,
                portType: 'output',
                parentNodeId: nodeId,
                parentNodeName: nodeName,
                isInternal: true
            },
            draggable: true,  // Allow users to position ports where needed
            deletable: false
        });
    });

    // Create new view with the node's internal content plus internal port nodes
    const newView: NodeView = {
        nodeId,
        nodeName,
        parentId,
        nodes: [...normalizedContent, ...internalPortNodes],
        edges: nodeData?.edges || []
    };

    // Update the stack
    navigationStack.update(stack => [...stack, newView]);

    // Update the current nodes and edges to show the node's internal diagram
    currentNodes.set(newView.nodes);
    currentEdges.set(newView.edges);

    // Add to history for undo/redo support
    addToHistory();
}

// Navigate back to parent
export function navigateBack() {
    const stack = get(navigationStack);
    if (stack.length > 1) {
        // Save current content before navigating back
        const currentView = stack[stack.length - 1];
        const currentNodeId = currentView.nodeId;

        // Filter out internal port nodes before saving
        const currentNodesFiltered = get(currentNodes).filter(n => n.type !== 'internalPort');
        const currentEdgesValue = get(currentEdges);

        // Update the node in the parent level with the current content
        const parentView = stack[stack.length - 2];
        parentView.nodes = parentView.nodes.map(node => {
            if (node.id === currentNodeId) {
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
        navigationStack.update(stack => stack.slice(0, -1));

        // Restore parent level nodes/edges
        currentNodes.set(parentView.nodes);
        currentEdges.set(parentView.edges);

        // Add to history
        addToHistory();
    }
}

// Navigate to a specific level in the stack
export function navigateToLevel(targetIndex: number) {
    const stack = get(navigationStack);
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
                if (node.id === childView.nodeId) {
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
        navigationStack.set(updatedStack);

        // Now navigate to the target level
        const targetView = updatedStack[targetIndex];
        currentNodes.set(targetView.nodes);
        currentEdges.set(targetView.edges);

        // Trim the stack to the target level
        navigationStack.update(s => s.slice(0, targetIndex + 1));
    }

    addToHistory();
}

// Clear navigation (go to root)
export function navigateToRoot() {
    const stack = get(navigationStack);

    // If we're already at root (no stack), do nothing
    if (stack.length === 0) {
        return;
    }

    // Use navigateToLevel to properly save all intermediate content
    navigateToLevel(0);

    // Restore root level content and clear stack
    if (stack[0].nodeId === 'root') {
        const rootView = get(navigationStack)[0];
        currentNodes.set(rootView.nodes);
        currentEdges.set(rootView.edges);
    }

    navigationStack.set([]);
    saveCurrentSystem();
    addToHistory();
}
