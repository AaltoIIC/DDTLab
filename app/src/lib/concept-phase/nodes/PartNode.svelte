<script lang="ts">
    import { Handle, Position } from '@xyflow/svelte';
    import { Component } from 'lucide-svelte';
    import type { NodeProps } from '@xyflow/svelte';
    import { currentNodes, addToHistory } from '$lib/stores/stores';

    type PartData = {
        declaredName: string;
        comment: string;
        id: string;
        type?: string;
    };

    export let data: PartData;
    export let selected: boolean = false;
    export let id: string;
    export let dragging: boolean = false;

    let editingName = false;
    let editingType = false;
    let tempName = data.declaredName;
    let tempType = data.type || '';

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

    function handleTypeEdit() {
        updateNodeData('type', tempType.trim());
        editingType = false;
    }
</script>

<div class="part-node" class:selected>
    <Handle type="target" position={Position.Top} />

    <div class="part-header">
        <Component size={14} />
        <span class="part-title">Part</span>
    </div>

    <div class="part-content">
        <div class="part-field">
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
                    {data.declaredName || 'Unnamed Part'}
                </span>
            {/if}
        </div>

        <div class="part-field">
            <span class="field-label">Type:</span>
            {#if editingType}
                <input
                    class="field-input"
                    type="text"
                    bind:value={tempType}
                    on:blur={handleTypeEdit}
                    on:keydown={(e) => {
                        if (e.key === 'Enter') handleTypeEdit();
                        if (e.key === 'Escape') {
                            tempType = data.type || '';
                            editingType = false;
                        }
                    }}
                    on:click|stopPropagation
                    autofocus
                />
            {:else}
                <span 
                    class="field-value editable" 
                    on:click|stopPropagation={() => {
                        editingType = true;
                        tempType = data.type || '';
                    }}
                >
                    {data.type || 'Click to set type'}
                </span>
            {/if}
        </div>

        <div class="part-field">
            <span class="field-label">ID:</span>
            <span class="field-value">{data.id}</span>
        </div>
    </div>

    <Handle type="source" position={Position.Bottom} />
</div>

<style>
    .part-node {
        background: white;
        border: 2px solid #d1d5db;
        border-radius: 6px;
        padding: 10px;
        min-width: 180px;
        box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
        cursor: move;
        transition: all 0.2s;
    }

    .part-node:hover {
        border-color: #60a5fa;
        box-shadow: 0 2px 6px rgba(0, 0, 0, 0.12);
    }

    .part-node.selected {
        border-color: #3b82f6;
        box-shadow: 0 0 0 2px rgba(59, 130, 246, 0.2);
    }

    .part-header {
        display: flex;
        align-items: center;
        gap: 6px;
        margin-bottom: 10px;
        padding-bottom: 6px;
        border-bottom: 1px solid #e5e7eb;
    }

    .part-title {
        font-weight: 600;
        font-size: 12px;
        color: #4b5563;
    }

    .part-content {
        display: flex;
        flex-direction: column;
        gap: 4px;
    }

    .part-field {
        display: flex;
        gap: 4px;
        font-size: 11px;
        align-items: center;
    }

    .field-label {
        color: #6b7280;
        font-weight: 500;
        min-width: 35px;
    }

    .field-value {
        color: #111827;
        word-break: break-word;
        flex: 1;
    }

    .field-value.editable {
        cursor: text;
        padding: 1px 3px;
        border-radius: 3px;
        transition: background-color 0.2s;
    }

    .field-value.editable:hover {
        background-color: #f3f4f6;
    }

    .field-input {
        border: 1px solid #60a5fa;
        border-radius: 3px;
        padding: 1px 3px;
        font-size: 11px;
        font-family: inherit;
        color: #111827;
        background: white;
        outline: none;
        width: 100%;
        flex: 1;
    }

    .field-input:focus {
        box-shadow: 0 0 0 2px rgba(96, 165, 250, 0.2);
    }
</style>