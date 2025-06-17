<script lang="ts">
    import { SvelteFlow, Background, Controls, MiniMap } from '@xyflow/svelte';
    import type { Node, Edge, NodeTypes, EdgeTypes } from '@xyflow/svelte';
    import '@xyflow/svelte/dist/style.css';
    import PackageNode from './nodes/PackageNode.svelte';
    import PartNode from './nodes/PartNode.svelte';
    import RemovableEdge from './edges/RemovableEdge.svelte';
    import { get } from 'svelte/store';
    import { currentNodes, currentEdges, addToHistory } from '$lib/stores/stores';
    import { 
        currentPackageView, 
        navigateToPackage,
        updateCurrentPackageContent 
    } from './packageStore';
    

    const nodeTypes = {
        package: PackageNode,
        part: PartNode,
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
                  edges: []   // Initialize with empty edges array
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
                id: `PRT-${Math.random().toString(36).substring(2, 9).toUpperCase()}`
            }
        };

        console.log('Creating new part:', newNode);
        currentNodes.update(n => [...n, newNode]);
        addToHistory(); // Track changes for undo/redo
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
              onconnect={() => addToHistory()}
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