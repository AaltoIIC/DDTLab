  <script lang="ts">
  import { run, stopPropagation, createBubbler } from 'svelte/legacy';

  const bubble = createBubbler();
      import { Package, X } from 'lucide-svelte';
      import type { NodeProps } from '@xyflow/svelte';
      import { useUpdateNodeInternals } from '@xyflow/svelte';
      import { navigateToPackage } from '../packageStore';
      import { currentNodes, currentEdges, addToHistory } from '$lib/stores/stores';
      import { createPortHandlers, type PortData } from './portUtils';
      import PortHandles from './PortHandles.svelte';
      import MetadataEditor from '../MetadataEditor.svelte';
      import ContextMenu from '../ContextMenu.svelte';
      import { get } from 'svelte/store';

        type MetadataItem = {
            key: string;
            value: string;
        };

        type PackageData = {
            declaredName: string;
            comment: string;
            id: string;
            orderStatus?: 'Delivered' | 'Pending' | 'Order Placed' | 'Confirmed' | 'In Production / In-House' | 'Not Ordered';
            metadata?: MetadataItem[];
            nodes?: import('@xyflow/svelte').Node[];
            edges?: import('@xyflow/svelte').Edge[];
        } & PortData;



  interface Props {
    data: PackageData;
    selected: NodeProps['selected'];
    id: NodeProps['id'];
    dragging: NodeProps['dragging'];
  }

  let {
    data = $bindable(),
    selected,
    id,
    dragging
  }: Props = $props();

    // Initialize inputs/outputs if not present
    run(() => {
    if (!data.inputs) data.inputs = [];
  });
    run(() => {
    if (!data.outputs) data.outputs = [];
  });
    run(() => {
    if (!data.metadata) data.metadata = [];
  });

    // Create port handlers
    const { addInput, removeInput, addOutput, removeOutput, updatePortInterface } = createPortHandlers<PackageData>(id);
    
    function handleUpdateInputInterface(index: number, interfaceType: string | undefined) {
        updatePortInterface('input', index, interfaceType);
    }
    
    function handleUpdateOutputInterface(index: number, interfaceType: string | undefined) {
        updatePortInterface('output', index, interfaceType);
    }
    
    // Update React Flow internals when data changes
    const updateNodeInternals = useUpdateNodeInternals();
    run(() => {
    if (data) {
          updateNodeInternals(id);
      }
  });

    let editingName = $state(false);
    let editingComment = $state(false);
    let tempName = $state(data.declaredName);
    let tempComment = $state(data.comment);

    function updateNodeData(field: 'declaredName' | 'comment' | 'metadata', value: any) {
        currentNodes.update(nodes => {
            return nodes.map(node => {
                if (node.id === id) {
                    return {
                        ...node,
                        data: {
                            ...node.data,
                            [field]: value
                        }
                    };
                }
                return node;
            });
        });
        addToHistory();
    }
    
    function handleMetadataUpdate(metadata: Array<{ key: string; value: string }>) {
        updateNodeData('metadata', metadata);
    }

    function handleNameEdit() {
        if (tempName.trim()) {
            updateNodeData('declaredName', tempName.trim());
        } else {
            tempName = data.declaredName;
        }
        editingName = false;
    }

    function handleCommentEdit() {
        updateNodeData('comment', tempComment.trim());
        editingComment = false;
    }

    function handleDoubleClick(event: MouseEvent) {
        // Check if the click was on an editable field
        const target = event.target as HTMLElement;
        if (target.classList.contains('editable') || target.classList.contains('field-input')) {
            return; // Don't navigate if clicking on editable fields
        }
        
        // Navigate into this package
        console.log('Opening package:', id, data);
        navigateToPackage(id, data.declaredName || 'Unnamed Package');
    }

    function handleDelete() {
        // Remove this node and any connected edges
        currentNodes.update(nodes => nodes.filter(n => n.id !== id));
        currentEdges.update(edges => edges.filter(e => e.source !== id && e.target !== id));
        addToHistory();
    }

    // Context menu handling
    let showContextMenu = $state(false);
    let contextMenuX = $state(0);
    let contextMenuY = $state(0);
    let nodeElement: HTMLDivElement = $state();

    function handleContextMenu(event: MouseEvent) {
        event.preventDefault();
        event.stopPropagation();
        
        // Position relative to the node
        const rect = nodeElement.getBoundingClientRect();
        contextMenuX = event.clientX - rect.left + nodeElement.scrollLeft;
        contextMenuY = event.clientY - rect.top + nodeElement.scrollTop;
        
        showContextMenu = true;
    }

    function handleDuplicate() {
        const nodes = get(currentNodes);
        const currentNode = nodes.find(n => n.id === id);
        
        if (currentNode) {
            const newNode = {
                ...currentNode,
                id: `package-${Date.now()}`,
                position: {
                    x: currentNode.position.x + 20,
                    y: currentNode.position.y + 20
                },
                data: {
                    ...currentNode.data,
                    id: `PKG-${Math.random().toString(36).substring(2, 9).toUpperCase()}`,
                    inputs: Array.isArray(currentNode.data.inputs) ? currentNode.data.inputs.map(input => ({...input})) : [],
                    outputs: Array.isArray(currentNode.data.outputs) ? currentNode.data.outputs.map(output => ({...output})) : [],
                    metadata: Array.isArray(currentNode.data.metadata) ? currentNode.data.metadata.map(meta => ({...meta})) : [],
                    nodes: Array.isArray(currentNode.data.nodes) ? currentNode.data.nodes.map(node => ({...node})) : [],
                    edges: Array.isArray(currentNode.data.edges) ? currentNode.data.edges.map(edge => ({...edge})) : []
                },
                selected: false
            };
            
            currentNodes.update(n => [...n, newNode]);
            addToHistory();
        }
        showContextMenu = false;
    }
  </script>

    <div class="package-node" ondblclick={stopPropagation(handleDoubleClick)} oncontextmenu={handleContextMenu} bind:this={nodeElement}>
      <!-- Input Handles -->
      <PortHandles 
          nodeId={id}
          ports={data.inputs || []}
          type="input"
          onAdd={addInput}
          onRemove={removeInput}
          onUpdateInterface={handleUpdateInputInterface}
      />

      <div class="package-header">
          <div class="package-header-left">
              <Package size={16} />
              <span class="package-title">Package</span>
          </div>
          <button 
              class="delete-button" 
              onclick={stopPropagation(handleDelete)}
              title="Delete package"
          >
              <X size={14} />
          </button>
      </div>

      <div class="package-content">
          <div class="package-field">
              <span class="field-label">Name:</span>
              {#if editingName}
                  <input
                      class="field-input"
                      type="text"
                      bind:value={tempName}
                      onblur={handleNameEdit}
                      onkeydown={(e) => {
                          if (e.key === 'Enter') handleNameEdit();
                          if (e.key === 'Escape') {
                              tempName = data.declaredName;
                              editingName = false;
                          }
                      }}
                      onclick={stopPropagation(bubble('click'))}
                      autofocus
                  />
              {:else}
                  <span 
                      class="field-value editable" 
                      onclick={stopPropagation(() => {
                          editingName = true;
                          tempName = data.declaredName;
                      })}
                      ondblclick={stopPropagation(bubble('dblclick'))}
                  >
                      {data.declaredName || 'Unnamed'}
                  </span>
              {/if}
          </div>

          <div class="package-field">
              <span class="field-label">Comment:</span>
              {#if editingComment}
                  <input
                      class="field-input"
                      type="text"
                      bind:value={tempComment}
                      onblur={handleCommentEdit}
                      onkeydown={(e) => {
                          if (e.key === 'Enter') handleCommentEdit();
                          if (e.key === 'Escape') {
                              tempComment = data.comment;
                              editingComment = false;
                          }
                      }}
                      onclick={stopPropagation(bubble('click'))}
                      autofocus
                  />
              {:else}
                  <span 
                      class="field-value editable" 
                      onclick={stopPropagation(() => {
                          editingComment = true;
                          tempComment = data.comment;
                      })}
                      ondblclick={stopPropagation(bubble('dblclick'))}
                  >
                      {data.comment || 'Click to add comment'}
                  </span>
              {/if}
          </div>

          <div class="package-field">
              <span class="field-label">ID:</span>
              <span class="field-value">{data.id}</span>
          </div>

          <div class="package-field">
              <span class="field-label">Order status:</span>
              <select 
                  class="field-select"
                  value={data.orderStatus || 'Not Ordered'}
                  onchange={(e) => updateNodeData('orderStatus', e.target.value)}
                  onclick={stopPropagation(bubble('click'))}
              >
                  <option value="Delivered">Delivered</option>
                  <option value="Pending">Pending</option>
                  <option value="Order Placed">Order Placed</option>
                  <option value="Confirmed">Confirmed</option>
                  <option value="In Production / In-House">In Production / In-House</option>
                  <option value="Not Ordered">Not Ordered</option>
              </select>
          </div>
          
          <MetadataEditor 
              metadata={data.metadata || []}
              onUpdate={handleMetadataUpdate}
          />
      </div>

      <!-- Output Handles -->
      <PortHandles 
          nodeId={id}
          ports={data.outputs || []}
          type="output"
          onAdd={addOutput}
          onRemove={removeOutput}
          onUpdateInterface={handleUpdateOutputInterface}
      />
      
      <ContextMenu 
          bind:visible={showContextMenu}
          x={contextMenuX}
          y={contextMenuY}
          on:duplicate={handleDuplicate}
      />
  </div>

    <style>
      .package-node {
          position: relative;
          background: white;
          border: 2px solid #e5e7eb;
          border-radius: 8px;
          padding: 12px;
          min-width: 200px;
          box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
          cursor: move;
      }

      .package-node:hover {
          border-color: #3b82f6;
          box-shadow: 0 4px 8px rgba(0, 0, 0, 0.15);
          cursor: pointer;
      }

      .package-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-bottom: 12px;
          padding-bottom: 8px;
          border-bottom: 1px solid #e5e7eb;
      }

      .package-header-left {
          display: flex;
          align-items: center;
          gap: 8px;
      }

      .package-title {
          font-weight: 600;
          font-size: 14px;
      }

      .package-content {
          display: flex;
          flex-direction: column;
          gap: 6px;
      }

      .package-field {
          display: flex;
          gap: 6px;
          font-size: 12px;
      }

      .field-label {
          color: #6b7280;
          font-weight: 500;
      }

      .field-value {
          color: #111827;
          word-break: break-word;
      }

      .field-value.editable {
          cursor: text;
          padding: 2px 4px;
          border-radius: 4px;
          transition: background-color 0.2s;
      }

      .field-value.editable:hover {
          background-color: #f3f4f6;
      }

      .field-input {
          border: 1px solid #3b82f6;
          border-radius: 4px;
          padding: 2px 4px;
          font-size: 12px;
          font-family: inherit;
          color: #111827;
          background: white;
          outline: none;
          width: 100%;
          max-width: 150px;
      }

      .field-input:focus {
          box-shadow: 0 0 0 2px rgba(59, 130, 246, 0.2);
      }

      .field-select {
          border: 1px solid #e5e7eb;
          border-radius: 4px;
          padding: 2px 8px;
          font-size: 12px;
          font-family: inherit;
          color: #111827;
          background: white;
          outline: none;
          cursor: pointer;
          flex: 1;
      }

      .field-select:focus {
          border-color: #3b82f6;
          box-shadow: 0 0 0 2px rgba(59, 130, 246, 0.2);
      }

      .field-select:hover {
          background-color: #f3f4f6;
      }

      .delete-button {
          background: none;
          border: none;
          padding: 4px;
          cursor: pointer;
          color: #9ca3af;
          border-radius: 4px;
          transition: all 0.2s;
          display: flex;
          align-items: center;
          justify-content: center;
      }

      .delete-button:hover {
          background-color: #fee2e2;
          color: #dc2626;
      }
  </style>