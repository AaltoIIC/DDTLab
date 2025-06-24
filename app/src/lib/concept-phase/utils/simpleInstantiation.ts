import type { Node, Edge } from '@xyflow/svelte';

// Deep clone with new IDs
function generateUniqueId(prefix: string): string {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
}

function cloneNodeWithNewIds(node: any, parentId?: string): Node {
  const newId = generateUniqueId(node.id);
  
  const clonedNode: Node = {
    id: newId,
    type: node.type,
    position: { ...node.position },
    data: {
      ...node.data,
      id: generateUniqueId(node.data.id),
      metadata: [...(node.data.metadata || [])],
      inputs: (node.data.inputs || []).map((port: any) => ({
        ...port,
        id: generateUniqueId(port.id)
      })),
      outputs: (node.data.outputs || []).map((port: any) => ({
        ...port,
        id: generateUniqueId(port.id)
      }))
    }
  };
  
  if (parentId) {
    clonedNode.parentId = parentId;
  }
  
  // Handle nested nodes recursively
  if (node.data.nodes && Array.isArray(node.data.nodes)) {
    const childNodes: Node[] = [];
    const childEdges: Edge[] = [];
    const idMapping = new Map<string, string>();
    
    // First pass: create all nodes and build ID mapping
    node.data.nodes.forEach((childNode: any) => {
      const clonedChild = cloneNodeWithNewIds(childNode, newId);
      idMapping.set(childNode.id, clonedChild.id);
      childNodes.push(clonedChild);
    });
    
    // Second pass: clone edges with updated IDs
    if (node.data.edges && Array.isArray(node.data.edges)) {
      node.data.edges.forEach((edge: any) => {
        const newSourceId = idMapping.get(edge.source);
        const newTargetId = idMapping.get(edge.target);
        
        if (newSourceId && newTargetId) {
          // Find the actual nodes to get port names
          const sourceNode = childNodes.find(n => n.id === newSourceId);
          const targetNode = childNodes.find(n => n.id === newTargetId);
          
          if (sourceNode && targetNode && edge.sourceHandle && edge.targetHandle) {
            // Extract port type and name from original handle
            const sourceHandleParts = edge.sourceHandle.split('-');
            const targetHandleParts = edge.targetHandle.split('-');
            
            // Get the port type (input/output) and port name
            const sourceType = sourceHandleParts[sourceHandleParts.length - 2];
            const sourcePortName = sourceHandleParts[sourceHandleParts.length - 1];
            const targetType = targetHandleParts[targetHandleParts.length - 2];
            const targetPortName = targetHandleParts[targetHandleParts.length - 1];
            
            // Reconstruct handle IDs with new node IDs
            const sourceHandle = `${newSourceId}-${sourceType}-${sourcePortName}`;
            const targetHandle = `${newTargetId}-${targetType}-${targetPortName}`;
            
            childEdges.push({
              id: generateUniqueId('edge'),
              source: newSourceId,
              target: newTargetId,
              sourceHandle,
              targetHandle,
              type: edge.type || 'default',
              data: { ...edge.data }
            });
          }
        }
      });
    }
    
    clonedNode.data.nodes = childNodes;
    clonedNode.data.edges = childEdges;
  }
  
  return clonedNode;
}

export function instantiateSimpleComponent(
  component: any,
  position: { x: number; y: number }
): { nodes: Node[]; edges: Edge[] } {
  console.log('Instantiating component:', component.name);
  
  // Create the package node with new position
  const packageNode = {
    ...component,
    position,
    data: { ...component.data }
  };
  
  const instantiatedPackage = cloneNodeWithNewIds(packageNode);
  
  console.log('Created package:', instantiatedPackage);
  
  // Return only the package node at the root level
  // Parts and items are stored inside the package data
  return {
    nodes: [instantiatedPackage],
    edges: []
  };
}