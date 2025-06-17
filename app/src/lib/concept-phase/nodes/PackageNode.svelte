  <script lang="ts">
      import { Handle, Position } from '@xyflow/svelte';
      import { Package, X } from 'lucide-svelte';
      import type { NodeProps } from '@xyflow/svelte';
      import { navigateToPackage } from '../packageStore';
      import { currentNodes, currentEdges, addToHistory } from '$lib/stores/stores';

        type PackageData = {
            declaredName: string;
            comment: string;
            id: string;
        };


    export let data: PackageData;
    export let selected: NodeProps['selected'];

    export let id: NodeProps['id'];
    export let dragging: NodeProps['dragging'];

    let editingName = false;
    let editingComment = false;
    let tempName = data.declaredName;
    let tempComment = data.comment;

    function updateNodeData(field: 'declaredName' | 'comment', value: string) {
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
  </script>

    <div class="package-node" on:dblclick|stopPropagation={handleDoubleClick}>
      <Handle type="target" position={Position.Left} />

      <div class="package-header">
          <div class="package-header-left">
              <Package size={16} />
              <span class="package-title">Package</span>
          </div>
          <button 
              class="delete-button" 
              on:click|stopPropagation={handleDelete}
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
                      on:blur={handleNameEdit}
                      on:keydown={(e) => {
                          if (e.key === 'Enter') handleNameEdit();
                          if (e.key === 'Escape') {
                              tempName = data.declaredName;
                              editingName = false;
                          }
                      }}
                      on:click|stopPropagation
                      autofocus
                  />
              {:else}
                  <span 
                      class="field-value editable" 
                      on:click|stopPropagation={() => {
                          editingName = true;
                          tempName = data.declaredName;
                      }}
                      on:dblclick|stopPropagation
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
                      on:blur={handleCommentEdit}
                      on:keydown={(e) => {
                          if (e.key === 'Enter') handleCommentEdit();
                          if (e.key === 'Escape') {
                              tempComment = data.comment;
                              editingComment = false;
                          }
                      }}
                      on:click|stopPropagation
                      autofocus
                  />
              {:else}
                  <span 
                      class="field-value editable" 
                      on:click|stopPropagation={() => {
                          editingComment = true;
                          tempComment = data.comment;
                      }}
                      on:dblclick|stopPropagation
                  >
                      {data.comment || 'Click to add comment'}
                  </span>
              {/if}
          </div>

          <div class="package-field">
              <span class="field-label">ID:</span>
              <span class="field-value">{data.id}</span>
          </div>
      </div>

      <Handle type="source" position={Position.Right} />
  </div>

    <style>
      .package-node {
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