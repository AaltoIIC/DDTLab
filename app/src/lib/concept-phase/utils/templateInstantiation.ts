import type { Node, Edge } from '@xyflow/svelte';
import type { ConceptTemplate } from '$lib/types/types';

export function instantiateTemplate(template: ConceptTemplate, position: { x: number, y: number }): { nodes: Node[], edges: Edge[] } {
    const idMap = new Map<string, string>();
    const timestamp = Date.now();
    
    // Calculate bounding box of template nodes
    let minX = Infinity, minY = Infinity;
    template.data.nodes.forEach(node => {
        minX = Math.min(minX, node.position.x);
        minY = Math.min(minY, node.position.y);
    });
    
    // Create new nodes with updated IDs and positions
    const newNodes = template.data.nodes.map(node => {
        const oldId = node.id;
        const newId = `${node.id}-${timestamp}`;
        idMap.set(oldId, newId);
        
        // Update position relative to drop point
        const newPosition = {
            x: position.x + (node.position.x - minX),
            y: position.y + (node.position.y - minY)
        };
        
        // Deep clone the node data
        const newNodeData = JSON.parse(JSON.stringify(node.data));
        
        // Update IDs in nested structures if they exist
        if (newNodeData.nodes) {
            newNodeData.nodes = newNodeData.nodes.map((subNode: any) => {
                const oldSubId = subNode.id;
                const newSubId = `${subNode.id}-${timestamp}`;
                idMap.set(oldSubId, newSubId);
                
                return {
                    ...subNode,
                    id: newSubId,
                    position: {
                        x: subNode.position.x,
                        y: subNode.position.y
                    }
                };
            });
        }
        
        // Update edges in nested structures
        if (newNodeData.edges) {
            newNodeData.edges = newNodeData.edges.map((edge: any) => {
                const newSource = idMap.get(edge.source) || edge.source;
                const newTarget = idMap.get(edge.target) || edge.target;
                
                return {
                    ...edge,
                    id: `${edge.id}-${timestamp}`,
                    source: newSource,
                    target: newTarget,
                    sourceHandle: edge.sourceHandle?.replace(edge.source, newSource),
                    targetHandle: edge.targetHandle?.replace(edge.target, newTarget)
                };
            });
        }
        
        return {
            ...node,
            id: newId,
            position: newPosition,
            data: newNodeData
        };
    });
    
    // Create new edges with updated IDs
    const newEdges = template.data.edges.map(edge => {
        const newSource = idMap.get(edge.source) || edge.source;
        const newTarget = idMap.get(edge.target) || edge.target;
        
        return {
            ...edge,
            id: `${edge.id}-${timestamp}`,
            source: newSource,
            target: newTarget,
            sourceHandle: edge.sourceHandle?.replace(edge.source, newSource),
            targetHandle: edge.targetHandle?.replace(edge.target, newTarget)
        };
    });
    
    return { nodes: newNodes, edges: newEdges };
}