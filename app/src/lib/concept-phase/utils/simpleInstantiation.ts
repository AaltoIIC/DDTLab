import type { Node, Edge } from '@xyflow/svelte';

// Deep clone with new IDs
function generateUniqueId(prefix: string): string {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
}

export function instantiateSimpleComponent(
  component: any,
  position: { x: number; y: number }
): { nodes: Node[]; edges: Edge[] } {
  console.log('Instantiating component:', component.name);

  // Generate new ID for the package
  const packageId = generateUniqueId(component.id);

  // Calculate bounding box for all child nodes to size the package appropriately
  let minX = Infinity, minY = Infinity;
  let maxX = -Infinity, maxY = -Infinity;

  if (component.data.nodes && Array.isArray(component.data.nodes)) {
    component.data.nodes.forEach((node: any) => {
      minX = Math.min(minX, node.position.x);
      minY = Math.min(minY, node.position.y);
      // Assume a default node size if not specified
      const nodeWidth = node.measured?.width || 200;
      const nodeHeight = node.measured?.height || 100;
      maxX = Math.max(maxX, node.position.x + nodeWidth);
      maxY = Math.max(maxY, node.position.y + nodeHeight);
    });
  }

  // Set package size with very generous padding
  const padding = 150;
  let packageWidth = 800;
  let packageHeight = 600;

  if (minX !== Infinity) {
    packageWidth = maxX - minX + padding * 2;
    packageHeight = maxY - minY + padding * 2;
  }

  // Create the package node
  const instantiatedPackage: Node = {
    id: packageId,
    type: component.type,
    position,
    width: packageWidth,
    height: packageHeight,
    style: {
      width: packageWidth,
      height: packageHeight
    },
    data: {
      ...component.data,
      id: generateUniqueId(component.data.id),
      nodes: [],
      edges: [],
      metadata: [...(component.data.metadata || [])],
      inputs: (component.data.inputs || []).map((port: any) => ({
        ...port,
        id: generateUniqueId(port.id)
      })),
      outputs: (component.data.outputs || []).map((port: any) => ({
        ...port,
        id: generateUniqueId(port.id)
      }))
    }
  };

  console.log('Created package:', instantiatedPackage);

  // Prepare all nodes including package
  const allNodes: Node[] = [instantiatedPackage];
  const allEdges: Edge[] = [];

  // Process child nodes and create ID mapping for edges
  const idMapping = new Map<string, string>();

  if (component.data.nodes && Array.isArray(component.data.nodes)) {
    // Offset for positioning nodes relative to package top-left with padding
    const offsetX = minX !== Infinity ? minX - padding : 0;
    const offsetY = minY !== Infinity ? minY - padding : 0;

    component.data.nodes.forEach((node: any) => {
      const newNodeId = generateUniqueId(node.id);
      idMapping.set(node.id, newNodeId);

      const childNode: Node = {
        id: newNodeId,
        type: node.type,
        parentId: packageId,
        position: {
          x: node.position.x - offsetX,
          y: node.position.y - offsetY
        },
        data: {
          ...node.data,
          id: generateUniqueId(node.data.id),
          mass: node.data.mass || 0,
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

      allNodes.push(childNode);
    });
  }

  // Process edges with updated IDs
  if (component.data.edges && Array.isArray(component.data.edges)) {
    component.data.edges.forEach((edge: any) => {
      const newSourceId = idMapping.get(edge.source);
      const newTargetId = idMapping.get(edge.target);

      if (newSourceId && newTargetId) {
        // Update handle IDs with new node IDs
        let sourceHandle = edge.sourceHandle;
        let targetHandle = edge.targetHandle;

        // Replace old node IDs in handles with new ones
        if (sourceHandle) {
          for (const [oldId, newId] of idMapping.entries()) {
            if (sourceHandle.includes(oldId)) {
              sourceHandle = sourceHandle.replace(oldId, newId);
              break;
            }
          }
        }
        if (targetHandle) {
          for (const [oldId, newId] of idMapping.entries()) {
            if (targetHandle.includes(oldId)) {
              targetHandle = targetHandle.replace(oldId, newId);
              break;
            }
          }
        }

        const newEdge: Edge = {
          id: generateUniqueId(edge.id),
          source: newSourceId,
          target: newTargetId,
          sourceHandle,
          targetHandle,
          type: edge.type || 'default',
          data: { ...edge.data }
        };

        allEdges.push(newEdge);
      }
    });
  }

  return {
    nodes: allNodes,
    edges: allEdges
  };
}