<script lang="ts">
    import { Box, X } from 'lucide-svelte';
    import type { NodeProps } from '@xyflow/svelte';
    import { currentNodes, currentEdges, addToHistory } from '$lib/stores/stores';
    import { createPortHandlers, type PortData } from './portUtils';
    import PortHandles from './PortHandles.svelte';

    type ItemData = {
        declaredName: string;
        comment: string;
        id: string;
    } & PortData;

    export let data: ItemData;
    export let selected: boolean = false;
    export let id: string;
    export let dragging: boolean = false;

    // Initialize inputs/outputs if not present
    $: if (!data.inputs) data.inputs = [];
    $: if (!data.outputs) data.outputs = [];

    // Create port handlers
    const { addInput, removeInput, addOutput, removeOutput } = createPortHandlers<ItemData>(id);

    let editingName = false;
    let editingComment = false;
    let tempName = data.declaredName;
    let tempComment = data.comment || '';

    function updateNodeData(field: string, value: string) {
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

    function handleDelete() {
        // Remove this node and any connected edges
        currentNodes.update(nodes => nodes.filter(n => n.id !== id));
        currentEdges.update(edges => edges.filter(e => e.source !== id && e.target !== id));
        addToHistory();
    }

</script>

<div class="item-node" class:selected>
    <!-- Input Handles -->
    <PortHandles 
        nodeId={id}
        ports={data.inputs || []}
        type="input"
        onAdd={addInput}
        onRemove={removeInput}
    />

    <div class="item-header">
        <div class="item-header-left">
            <Box size={12} />
            <span class="item-title">Item</span>
        </div>
        <button 
            class="delete-button" 
            on:click|stopPropagation={handleDelete}
            title="Delete item"
        >
            <X size={10} />
        </button>
    </div>

    <div class="item-content">
        <div class="item-field">
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
                >
                    {data.declaredName || 'Unnamed Item'}
                </span>
            {/if}
        </div>

        <div class="item-field">
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
                            tempComment = data.comment || '';
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
                        tempComment = data.comment || '';
                    }}
                >
                    {data.comment || 'Click to add comment'}
                </span>
            {/if}
        </div>

        <div class="item-field">
            <span class="field-label">ID:</span>
            <span class="field-value">{data.id}</span>
        </div>
    </div>

    <!-- Output Handles -->
    <PortHandles 
        nodeId={id}
        ports={data.outputs || []}
        type="output"
        onAdd={addOutput}
        onRemove={removeOutput}
    />
</div>

<style>
    .item-node {
        background: white;
        border: 2px solid #e5e7eb;
        border-radius: 4px;
        padding: 8px;
        min-width: 160px;
        box-shadow: 0 1px 2px rgba(0, 0, 0, 0.08);
        cursor: move;
        transition: all 0.2s;
    }

    .item-node:hover {
        border-color: #93c5fd;
        box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
    }

    .item-node.selected {
        border-color: #60a5fa;
        box-shadow: 0 0 0 2px rgba(96, 165, 250, 0.2);
    }

    .item-header {
        display: flex;
        align-items: center;
        justify-content: space-between;
        margin-bottom: 8px;
        padding-bottom: 4px;
        border-bottom: 1px solid #f3f4f6;
    }

    .item-header-left {
        display: flex;
        align-items: center;
        gap: 4px;
    }

    .item-title {
        font-weight: 600;
        font-size: 11px;
        color: #6b7280;
    }

    .item-content {
        display: flex;
        flex-direction: column;
        gap: 3px;
    }

    .item-field {
        display: flex;
        gap: 3px;
        font-size: 10px;
        align-items: center;
    }

    .field-label {
        color: #9ca3af;
        font-weight: 500;
        min-width: 30px;
        font-size: 10px;
    }

    .field-value {
        color: #374151;
        word-break: break-word;
        flex: 1;
        font-size: 10px;
    }

    .field-value.editable {
        cursor: text;
        padding: 1px 2px;
        border-radius: 2px;
        transition: background-color 0.2s;
    }

    .field-value.editable:hover {
        background-color: #f9fafb;
    }

    .field-input {
        border: 1px solid #93c5fd;
        border-radius: 2px;
        padding: 1px 2px;
        font-size: 10px;
        font-family: inherit;
        color: #374151;
        background: white;
        outline: none;
        width: 100%;
        flex: 1;
    }

    .field-input:focus {
        box-shadow: 0 0 0 1px rgba(147, 197, 253, 0.3);
    }

    .delete-button {
        background: none;
        border: none;
        padding: 2px;
        cursor: pointer;
        color: #d1d5db;
        border-radius: 2px;
        transition: all 0.2s;
        display: flex;
        align-items: center;
        justify-content: center;
    }

    .delete-button:hover {
        background-color: #fef2f2;
        color: #ef4444;
    }
</style>