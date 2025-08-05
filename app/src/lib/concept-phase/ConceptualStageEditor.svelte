<script lang="ts">
    import { SvelteFlow, Background, Controls, MiniMap, BackgroundVariant } from '@xyflow/svelte';
    import type { Node, Edge, NodeTypes, EdgeTypes, Connection } from '@xyflow/svelte';
    import '@xyflow/svelte/dist/style.css';
    import PackageNode from './nodes/PackageNode.svelte';
    import ConceptNode from './nodes/ConceptNode.svelte';
    import RemovableEdge from './edges/RemovableEdge.svelte';
    import ConnectionTypeDropdown from './ConnectionTypeDropdown.svelte';
    import { get } from 'svelte/store';
    import { currentNodes, currentEdges, addToHistory } from '$lib/stores/stores.svelte';
    import { 
        currentPackageView, 
        navigateToPackage,
        updateCurrentPackageContent 
    } from './packageStore';
    import { checkCompatibility } from './interfaces';
    import type { Port } from './interfaces';
    import { instantiateSimpleComponent } from './utils/simpleInstantiation';
    import { instantiateTemplate } from './utils/templateInstantiation';
    import { onMount } from 'svelte';
    

    const nodeTypes = {
        package: PackageNode,
        part: ConceptNode,
        item: ConceptNode,
    } as {} as NodeTypes;
    
    const edgeTypes = {
        default: RemovableEdge,
    } as {} as EdgeTypes;

    export function addPackageNode(name: String = 'New Package') {
            console.log('addPackageNode called');
            const existingNodes = get(currentNodes);
            const newNode: Node = {
              id: `package-${Date.now()}`,
              type: 'package',
              position: { x: 250, y: 100 + existingNodes.length * 150 },
              data: {
                  declaredName: name,
                  comment: '',
                  id: `PKG-${Math.random().toString(36).substring(2, 9).toUpperCase()}`,
              }
          };

        //   console.log('Creating new node:', newNode);
          currentNodes.update(n => [newNode, ...n]);
          addToHistory(); // Track changes for undo/redo
          currentNodes.subscribe(n => console.log('Total nodes:', n.length))();
          console.log(JSON.stringify($currentEdges, null, 2));
          console.log(JSON.stringify($currentNodes, null, 2));
    }
    

    // DEPRECATED WAY OF ADDING NODES
    // *******************************
    // export function addPartNode(definitionName: string = '') {
    //     console.log('addPartNode called');
    //     const existingNodes = get(currentNodes);
    //     const newNode: Node = {
    //         id: `part-${Date.now()}`,
    //         type: 'part',
    //         position: { x: 250, y: 100 + existingNodes.length * 150 },
    //         data: {
    //             declaredName: `New ${definitionName} Part` ,
    //             definition: definitionName,
    //             comment: '',
    //             id: `PRT-${Math.random().toString(36).substring(2, 9).toUpperCase()}`,
    //             orderStatus: 'Not Ordered',
    //             metadata: [],  // Initialize with empty metadata array
    //             nodes: [],  // Initialize with empty nodes array
    //             edges: [],   // Initialize with empty edges array
    //             inputs: [],  // Initialize with no inputs
    //             outputs: [] // Initialize with no outputs
    //         }
    //     };

    //     console.log('Creating new part:', newNode);
    //     currentNodes.update(n => [...n, newNode]);
    //     addToHistory(); // Track changes for undo/redo
    // }
    
    // export function addItemNode(name: string = 'New Item') {
    //     console.log('addItemNode called ' + name);
    //     const existingNodes = get(currentNodes);
    //     const newNode: Node = {
    //         id: `item-${Date.now()}`,
    //         type: 'item',
    //         position: { x: 250, y: 100 + existingNodes.length * 150 },
    //         data: {
    //             declaredName: name,
    //             comment: '',
    //             id: `ITM-${Math.random().toString(36).substring(2, 9).toUpperCase()}`,
    //             orderStatus: 'Not Ordered',
    //             metadata: [],  // Initialize with empty metadata array
    //             inputs: [],  // Initialize with one default input
    //             outputs: [] // Initialize with one default output
    //         }
    //     };

    //     console.log('Creating new item:', newNode);
    //     currentNodes.update(n => [...n, newNode]);
    //     addToHistory(); // Track changes for undo/redo
    // }
    
    function findPort(node: Node | undefined, handleId: string | null | undefined): Port | undefined {
        if (!node || !handleId) return undefined;
        
        // Handle ID format: nodeId-type-portName
        const parts = handleId.split('-');
        const type = parts[parts.length - 2]; // input or output
        const portName = parts[parts.length - 1];
        
        const ports = type === 'input' ? node.data.inputs : node.data.outputs;
        if (!Array.isArray(ports)) return undefined;
        return ports.find((p: Port) => p.name === portName);
    }
    
    let flowContainer: HTMLDivElement | undefined = $state();
    
    // Global drag over prevention
    onMount(() => {
        function preventDefaultDragOver(e: DragEvent) {
            e.preventDefault();
            e.dataTransfer!.dropEffect = 'copy';
        }
        
        document.addEventListener('dragover', preventDefaultDragOver);
        
        return () => {
            document.removeEventListener('dragover', preventDefaultDragOver);
        };
    });
    
    function handleDragOver(event: DragEvent) {
        event.preventDefault();
        event.dataTransfer!.dropEffect = 'copy';
    }
    
    function handleDrop(event: DragEvent) {
        event.preventDefault();
        event.stopPropagation();
        
        const jsonData = event.dataTransfer?.getData('application/json');
        if (!jsonData) return;
        
        try {
            const data = JSON.parse(jsonData);
            console.log('Dropping data:', data);
            
            if (!flowContainer) return;
            
            // Get drop position relative to the flow container
            const rect = flowContainer.getBoundingClientRect();
            const position = {
                x: event.clientX - rect.left - 100,
                y: event.clientY - rect.top - 50
            };
            
            console.log('Drop position:', position);
            
            let newNodes: Node[] = [];
            let newEdges: Edge[] = [];
            
            // Check if it's a template or a simple component
            if (data.type === 'template' && data.template) {
                // Instantiate template
                const result = instantiateTemplate(data.template, position);
                newNodes = result.nodes;
                newEdges = result.edges;
            } else {
                // Instantiate simple component
                const result = instantiateSimpleComponent(data, position);
                newNodes = result.nodes;
                newEdges = result.edges;
            }
            
            console.log('New nodes:', newNodes);
            
            // Add to current view
            currentNodes.update(nodes => [...nodes, ...newNodes]);
            if (newEdges.length > 0) {
                currentEdges.update(edges => [...edges, ...newEdges]);
            }
            
            addToHistory();
        } catch (error) {
            console.error('Failed to instantiate:', error);
        }
    }
    
    // State for connection type dropdown
    let showConnectionDropdown = $state(false);
    let pendingConnection: Connection | null = $state(null);
    let dropdownX = $state(0);
    let dropdownY = $state(0);
    
    function onConnect(params: Connection) {
        console.log('Connection params:', params);
        
        const nodes = get(currentNodes);
        const sourceNode = nodes.find(n => n.id === params.source);
        const targetNode = nodes.find(n => n.id === params.target);
        
        // Check if source or target is a package node
        if (sourceNode?.type === 'package' || targetNode?.type === 'package') {
            console.log('Cannot connect to/from package nodes');
            return; // Prevent connection
        }
        
        // Store the pending connection and show dropdown at midpoint of connection
        pendingConnection = params;
        
        // Calculate position for dropdown (midpoint of the connection)
        const sourceElement = document.querySelector(`[data-id="${params.source}"]`);
        const targetElement = document.querySelector(`[data-id="${params.target}"]`);
        
        if (sourceElement && targetElement) {
            const sourceRect = sourceElement.getBoundingClientRect();
            const targetRect = targetElement.getBoundingClientRect();
            
            dropdownX = (sourceRect.left + targetRect.left) / 2;
            dropdownY = (sourceRect.top + targetRect.top) / 2;
        } else {
            // Fallback to center of viewport
            dropdownX = window.innerWidth / 2;
            dropdownY = window.innerHeight / 2;
        }
        
        showConnectionDropdown = true;
    }
    
    function handleConnectionTypeSelect(connectionType: 'binding' | 'flow') {
        if (!pendingConnection) return;
        
        const nodes = get(currentNodes);
        const sourceNode = nodes.find(n => n.id === pendingConnection?.source);
        const targetNode = nodes.find(n => n.id === pendingConnection?.target);
        
        const sourcePort = findPort(sourceNode, pendingConnection?.sourceHandle);
        const targetPort = findPort(targetNode, pendingConnection?.targetHandle);
        
        console.log('Source port:', sourcePort, 'Target port:', targetPort);
        
        let edgeData: any = { 
            compatibility: 'direct',
            connectionType: connectionType // Store the connection type
        };
        
        if (sourcePort && targetPort) {
            const compatibility = checkCompatibility(sourcePort, targetPort);
            console.log('Compatibility check:', compatibility);
            
            edgeData = {
                ...edgeData,
                compatibility: compatibility.status,
                adapterRequired: compatibility.adapterType,
                message: compatibility.message
            };
        }
        
        // Check if an edge already exists between these nodes with these handles
        const existingEdges = get(currentEdges);
        const duplicateEdgeIndex = existingEdges.findIndex(edge => 
            edge.source === pendingConnection?.source &&
            edge.target === pendingConnection.target &&
            edge.sourceHandle === pendingConnection.sourceHandle &&
            edge.targetHandle === pendingConnection.targetHandle
        );
        
        if (duplicateEdgeIndex !== -1) {
            console.log('Updating existing edge with compatibility data');
            // Update the existing edge with compatibility data
            currentEdges.update(edges => {
                const updatedEdges = [...edges];
                updatedEdges[duplicateEdgeIndex] = {
                    ...updatedEdges[duplicateEdgeIndex],
                    data: edgeData
                };
                return updatedEdges;
            });
        } else {
            // Create new edge with compatibility metadata
            const newEdge: Edge = {
                id: `${pendingConnection.source}-${pendingConnection.target}-${Date.now()}`,
                source: pendingConnection.source!,
                target: pendingConnection.target!,
                sourceHandle: pendingConnection.sourceHandle,
                targetHandle: pendingConnection.targetHandle,
                type: 'default',
                data: edgeData
            };
            
            currentEdges.update(edges => [...edges, newEdge]);
        }
        
        addToHistory();
        showConnectionDropdown = false;
        pendingConnection = null;
    }
    
    function handleConnectionCancel() {
        showConnectionDropdown = false;
        pendingConnection = null;
    } 
</script>



  <div class="conceptual-editor" ondragover={handleDragOver} ondrop={handleDrop} role="application" aria-label="Conceptual stage editor">
      <div class="flow-container" bind:this={flowContainer}>
          <SvelteFlow
              nodes={currentNodes}
              edges={currentEdges}
              {nodeTypes}
              {edgeTypes}
              defaultEdgeOptions={{
                  type: 'default',
              }}
              onconnect={onConnect}
          >
              <Background bgColor="rgb(245,245,245)" variant={BackgroundVariant.Dots} gap={36} />
              <Controls />
              <MiniMap />
          </SvelteFlow>
      </div>
  </div>
  
  {#if showConnectionDropdown}
      <ConnectionTypeDropdown 
          x={dropdownX}
          y={dropdownY}
          onSelect={handleConnectionTypeSelect}
          onCancel={handleConnectionCancel}
      />
  {/if}

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