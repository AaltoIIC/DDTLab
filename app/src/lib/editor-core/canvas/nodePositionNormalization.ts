import type { Node } from '@xyflow/svelte';

export const EDITOR_LAYOUT_ORIGIN = { x: 100, y: 100 } as const;

/**
 * Re-anchor a graph without changing the distance between any of its nodes.
 *
 * The returned nodes are cloned so loading a system never mutates the catalog
 * record that was read from persistence. Nodes without finite coordinates are
 * left unchanged and do not affect the graph bounds.
 */
export function normalizeNodePositions(
    nodes: Node[],
    origin: { x: number; y: number } = EDITOR_LAYOUT_ORIGIN
): Node[] {
    const positionedNodes = nodes.filter(
        (node) => Number.isFinite(node.position?.x) && Number.isFinite(node.position?.y)
    );

    if (positionedNodes.length === 0) {
        return nodes.map((node) => ({ ...node }));
    }

    const minX = Math.min(...positionedNodes.map((node) => node.position.x));
    const minY = Math.min(...positionedNodes.map((node) => node.position.y));
    const offsetX = origin.x - minX;
    const offsetY = origin.y - minY;

    return nodes.map((node) => ({
        ...node,
        position: Number.isFinite(node.position?.x) && Number.isFinite(node.position?.y)
            ? {
                ...node.position,
                x: node.position.x + offsetX,
                y: node.position.y + offsetY
            }
            : node.position
    }));
}
