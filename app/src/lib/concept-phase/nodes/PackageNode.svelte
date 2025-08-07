  <script lang="ts">
  import { run, stopPropagation, createBubbler } from 'svelte/legacy';

      import { Package, X, MoveDiagonal2, Info } from 'lucide-svelte';
      import { useUpdateNodeInternals, NodeResizeControl } from '@xyflow/svelte';
      import { currentNodes, currentEdges, addToHistory } from '$lib/stores/stores.svelte';

        type MetadataItem = {
            key: string;
            value: string;
        };

        type PackageData = {
            declaredName: string;
            comment: string;
            id: string;
        };



  interface Props {
    data: PackageData;
    selected: boolean;
    id: string;
    dragging: boolean;
  }

  let {
    data = $bindable(),
    selected,
    id,
    dragging
  }: Props = $props();
    
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
    let showComment = $state(false);
    let infoClicked = $state(false);

    function updateNodeData(field: string, value: any) {
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

    function handleMouseLeave() {
        if (!infoClicked) {
            showComment = false;
        }
    }

    function handleCommentEdit() {
        updateNodeData('comment', tempComment.trim());
        editingComment = false;
        showComment = false;
        infoClicked = false;
        
    }

    function handleDelete() {
        // Remove this node and any connected edges
        currentNodes.update(nodes => nodes.filter(n => n.id !== id));
        currentEdges.update(edges => edges.filter(e => e.source !== id && e.target !== id));
        addToHistory();
    }

  </script>
    <!-- svelte-ignore a11y_no_static_element_interactions -->
     <!-- svelte-ignore a11y_click_events_have_key_events -->
    <div class:selected class="package-node">
        <div class="package-header">
            <div class="package-header-left">
                <Package size={22} />
                {#if editingName}
                    <input
                        class="package-title"
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
                        autofocus
                    />
                {:else}
                    <span 
                        class="package-title editable" 
                        onclick={() => {
                            editingName = true;
                            tempName = data.declaredName;
                        }}
                    >
                        {`${data.declaredName} (Package)`|| 'Unnamed'}
                    </span>
                {/if}
            </div>
            <button 
                class="delete-button" 
                onclick={stopPropagation(handleDelete)}
                title="Delete package"
            >
                <X size={20} />
            </button>
        </div>

        <div class="package-footer">
            <div
                class="package-info"
                onmouseenter={() => showComment = true}
                onmouseleave={handleMouseLeave}
            >
                <Info 
                    size={22}
                    onclick={() => {infoClicked = !infoClicked}}
                />
                {#if showComment}
                    {#if infoClicked}
                        <input 
                            class="package-comment"
                            type="text"
                            bind:value={tempComment}
                            onblur={handleCommentEdit}
                            onkeydown={(e) => {
                                if (e.key === 'Enter') handleCommentEdit();
                                if (e.key === 'Escape') {
                                    tempComment = data.comment;
                                    editingComment = false;
                                    showComment = false;
                                }
                            }}
                            autofocus
                            
                        />
                    {:else}
                        <span class="package-comment">{data.comment || 'Click to add comment'}</span>
                    {/if}
                {/if}
            </div>
            <span class="resize-control">
            <NodeResizeControl minWidth={300} minHeight={100} style="background: transparent; border: none;">
                <MoveDiagonal2 size={22} />
            </NodeResizeControl>
            </span>
        </div>
  </div>

<style>
    .package-node {
        display: flex;
        flex-direction: column;
        position: relative;
        width: 100%;
        height: 100%;
        justify-content: space-between;
        border: 4px dashed #c6c7c9;
        background-color: transparent;
        color: #8e8f91;
        border-radius: 10px;
        padding: 10px;
        cursor: move;
    }

    .package-node:hover {
        border-color: #8e8f91;
        cursor: pointer;
    }

    .package-node.selected {
        border-color: #3b82f6;

    }

    .package-header {
        display: flex;
        align-items: center;
        justify-content: space-between;
        margin-bottom: 12px;
        padding-bottom: 8px;
    }

    .package-header-left {
        display: flex;
        align-items: center;
        gap: 8px;
    }

    .package-title {
        font-weight: 600;
        font-size: 18px;
    }

    .package-title.editable {
        cursor: text;
        padding: 1px 3px;
        border-radius: 3px;
        transition: background-color 0.2s;
    }

    .package-title.editable:hover {
        background-color: #eceef0;
    }

    .package-footer {
        position: relative;
        display: flex;
        justify-content: space-between;
    }

    .package-info {
        position: relative;
        display: flex;
        align-items: center;
    }

    .package-comment {
        position: absolute;
        left: calc(100% + 5px);
        white-space: nowrap;
    }

    .resize-control {
        position: relative;
        bottom: 19px;
        right: 19px;
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