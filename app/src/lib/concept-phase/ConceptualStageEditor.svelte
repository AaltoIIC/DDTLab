<script lang="ts">
    import { SvelteFlow, Background, Controls, MiniMap } from '@xyflow/svelte';
    import type { Node, Edge, NodeTypes, EdgeTypes, Connection } from '@xyflow/svelte';
    import '@xyflow/svelte/dist/style.css';
    import PackageNode from './nodes/PackageNode.svelte';
    import PartNode from './nodes/PartNode.svelte';
    import ItemNode from './nodes/ItemNode.svelte';
    import RemovableEdge from './edges/RemovableEdge.svelte';
    import { get } from 'svelte/store';
    import { currentNodes, currentEdges, addToHistory } from '$lib/stores/stores';
    import { 
        currentPackageView, 
        navigateToPackage,
        updateCurrentPackageContent 
    } from './packageStore';
    import { checkCompatibility } from './interfaces';
    import type { Port } from './interfaces';
    

    const nodeTypes = {
        package: PackageNode,
        part: PartNode,
        item: ItemNode,
    } as {} as NodeTypes;
    
    const edgeTypes = {
        default: RemovableEdge,
    } as {} as EdgeTypes;

    export function addPackageNode() {
            console.log('addPackageNode called');
            const existingNodes = get(currentNodes);
            const newNode: Node = {
              id: `package-${Date.now()}`,
              type: 'package',
              position: { x: 250, y: 100 + existingNodes.length * 150 },
              data: {
                  declaredName: 'New Package',
                  comment: '',
                  id: `PKG-${Math.random().toString(36).substring(2, 9).toUpperCase()}`,
                  nodes: [],  // Initialize with empty nodes array
                  edges: [],   // Initialize with empty edges array
                  inputs: [],  // Initialize with one input
                  outputs: [] // Initialize with one output
              }
          };

          console.log('Creating new node:', newNode);
          currentNodes.update(n => [...n, newNode]);
          addToHistory(); // Track changes for undo/redo
          currentNodes.subscribe(n => console.log('Total nodes:', n.length))();
    }
    
    export function addPartNode() {
        console.log('addPartNode called');
        const existingNodes = get(currentNodes);
        const newNode: Node = {
            id: `part-${Date.now()}`,
            type: 'part',
            position: { x: 250, y: 100 + existingNodes.length * 150 },
            data: {
                declaredName: 'New Part',
                comment: '',
                id: `PRT-${Math.random().toString(36).substring(2, 9).toUpperCase()}`,
                nodes: [],  // Initialize with empty nodes array
                edges: [],   // Initialize with empty edges array
                inputs: [],  // Initialize with no inputs
                outputs: [] // Initialize with no outputs
            }
        };

        console.log('Creating new part:', newNode);
        currentNodes.update(n => [...n, newNode]);
        addToHistory(); // Track changes for undo/redo
    }
    
    export function addItemNode() {
        console.log('addItemNode called');
        const existingNodes = get(currentNodes);
        const newNode: Node = {
            id: `item-${Date.now()}`,
            type: 'item',
            position: { x: 250, y: 100 + existingNodes.length * 150 },
            data: {
                declaredName: 'New Item',
                comment: '',
                id: `ITM-${Math.random().toString(36).substring(2, 9).toUpperCase()}`,
                inputs: [],  // Initialize with one default input
                outputs: [] // Initialize with one default output
            }
        };

        console.log('Creating new item:', newNode);
        currentNodes.update(n => [...n, newNode]);
        addToHistory(); // Track changes for undo/redo
    }
    
    function findPort(node: Node | undefined, handleId: string | null | undefined): Port | undefined {
        if (!node || !handleId) return undefined;
        
        // Handle ID format: nodeId-type-portName
        const parts = handleId.split('-');
        const type = parts[parts.length - 2]; // input or output
        const portName = parts[parts.length - 1];
        
        const ports = type === 'input' ? node.data.inputs : node.data.outputs;
        return ports?.find((p: Port) => p.name === portName);
    }
    
    function onConnect(params: Connection) {
        console.log('Connection params:', params);
        
        const nodes = get(currentNodes);
        const sourceNode = nodes.find(n => n.id === params.source);
        const targetNode = nodes.find(n => n.id === params.target);
        
        const sourcePort = findPort(sourceNode, params.sourceHandle);
        const targetPort = findPort(targetNode, params.targetHandle);
        
        console.log('Source port:', sourcePort, 'Target port:', targetPort);
        
        if (sourcePort && targetPort) {
            const compatibility = checkCompatibility(sourcePort, targetPort);
            console.log('Compatibility check:', compatibility);
            
            if (compatibility.status === 'incompatible') {
                // Show error message - in a real app, you'd show a toast or modal
                alert(`Cannot connect: ${compatibility.message}`);
                return;
            }
            
            // Create edge with compatibility metadata
            const newEdge: Edge = {
                id: `${params.source}-${params.target}-${Date.now()}`,
                source: params.source!,
                target: params.target!,
                sourceHandle: params.sourceHandle,
                targetHandle: params.targetHandle,
                type: 'default',
                data: {
                    compatibility: compatibility.status,
                    adapterRequired: compatibility.adapterType,
                    message: compatibility.message
                }
            };
            
            currentEdges.update(edges => [...edges, newEdge]);
        } else {
            // No interface types specified, allow connection
            const newEdge: Edge = {
                id: `${params.source}-${params.target}-${Date.now()}`,
                source: params.source!,
                target: params.target!,
                sourceHandle: params.sourceHandle,
                targetHandle: params.targetHandle,
                type: 'default',
                data: {
                    compatibility: 'direct'
                }
            };
            
            currentEdges.update(edges => [...edges, newEdge]);
        }
        
        addToHistory();
    } 
</script>



  <div class="conceptual-editor">
      <div class="flow-container">
          <SvelteFlow
              nodes={currentNodes}
              edges={currentEdges}
              {nodeTypes}
              {edgeTypes}
              defaultEdgeOptions={{
                  type: 'default',
              }}
              {onConnect}
          >
              <Background />
              <Controls />
              <MiniMap />
          </SvelteFlow>
      </div>
  </div>

  <style>
      .conceptual-editor {
          display: flex;
          flex-direction: column;
          height: 100%;
          width: 100%;
          background-color: #f9fafb;
      }

      .conceptual-header {
          padding: 24px;
          background-color: white;
          border-bottom: 1px solid #e5e7eb;
          box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
      }

      .conceptual-header h2 {
          margin: 0;
          font-size: 24px;
          font-weight: 600;
          color: #111827;
      }

      .conceptual-header p {
          margin: 4px 0 0 0;
          color: #6b7280;
          font-size: 14px;
      }

      .flow-container {
          flex: 1;
          width: 100%;
          height: 100%;
      }
  </style>