import type { Node, Edge } from '@xyflow/svelte';
import type { ConceptTemplate, SysMLDefinition } from '$lib/types/types';
import type { Port } from '../interfaces';
import { generatePortId } from '../nodes/portUtils';
import { capitalize } from 'lodash';

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
        console.log(newNodeData)
        
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


// Definition utils

export const toMetadata = (data: SysMLDefinition[] | string[] | undefined) => {
    return data?.map( n => {
        const key = typeof n === 'string' ? n : ('name' in n ? n.name : '');
        return { key, value: null};
    }) ?? [];
}

export function createData(definition: SysMLDefinition): {nodes: Node[], edges: Edge[]} {

    const inputPort: Port = {
        id: generatePortId(),
        name: "ref_input",
        interfaceType: undefined
    }

    const outputPort: Port = {
        id: generatePortId(),
        name: "ref_output",
        interfaceType: undefined
    }

    function defToNode(def: SysMLDefinition, initialPos: {x: number, y: number}, inputs: Port[], outputs: Port[]): Node {
        return {
            id: `${def.type}-${Math.random().toString(36).substring(2, 9).toUpperCase()}`,
            type: def.type,
            position: initialPos,
            data: {
                declaredName: `New "${def.name}" ${capitalize(def.type)}`,
                definition: def.name,
                comment: '',
                mass: 0, // Initialize mass to 0
                orderStatus: 'Not Ordered',
                metadata: toMetadata(def.data.attributes),
                nodes: [],
                edges: [],
                inputs,
                outputs
            }
        }
    }

    const partRefs = definition.data.partRefs ?? [];
    const itemRefs = definition.data.itemRefs;

    const mainNode = defToNode(
        definition, 
        {x: 0, y: 0},
        partRefs?.length ? [inputPort] : [],
        itemRefs.length ? [outputPort] : []
    );

    const partNodes = partRefs.map( (def, index) => {
        return defToNode(
            def, 
            {x: -400, y: -200 + index * 200},
            [],
            [outputPort]
        );
    });
    const partEdges: Edge[] = partRefs.map( (_, index) => {
        const partNode = partNodes[index];
        return {
            id: `${partNode.id}-${mainNode.id}-${Date.now()}`,
            source: partNode.id,
            target: mainNode.id,
            sourceHandle: `${partNode.id}-output-ref_output`,
            targetHandle: `${mainNode.id}-input-ref_input`,
            type: 'default',
            data: {
                compatibility: 'direct',
                connectionType: 'flow'
            }
        }
    });


    const itemNodes = itemRefs.map( (def, index) => {
        return defToNode(
            def, 
            {x: 400, y: -200 + index * 200},
            [inputPort],
            []
        );
    });
    const itemEdges: Edge[] = itemRefs.map( (_, index) => {
        const itemNode = itemNodes[index];
        return {
            id: `${mainNode.id}-${itemNode.id}-${Date.now()}`,
            source: mainNode.id,
            target: itemNode.id,
            sourceHandle: `${mainNode.id}-output-ref_output`,
            targetHandle: `${itemNode.id}-input-ref_input`,
            type: 'default',
            data: {
                compatibility: 'direct',
                connectionType: 'flow'
            }
        }
    });

    const nodes = [mainNode, ...partNodes, ...itemNodes];
    const edges = [...partEdges, ...itemEdges];
    
    return {nodes, edges};
}