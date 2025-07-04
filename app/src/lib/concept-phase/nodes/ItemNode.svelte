<script lang="ts">
    import { run, stopPropagation, createBubbler } from 'svelte/legacy';

    const bubble = createBubbler();
    import { Box, X } from 'lucide-svelte';
    import type { NodeProps } from '@xyflow/svelte';
    import { useUpdateNodeInternals } from '@xyflow/svelte';
    import { currentNodes, currentEdges, addToHistory } from '$lib/stores/stores.svelte';
    import { createPortHandlers, type PortData } from './portUtils';
    import PortHandles from './PortHandles.svelte';
    import MetadataEditor from '../MetadataEditor.svelte';
    import ContextMenu from '../ContextMenu.svelte';
    import { get } from 'svelte/store';

    type MetadataItem = {
        key: string;
        value: string;
    };

    type ItemData = {
        declaredName: string;
        comment: string;
        id: string;
        orderStatus?: 'Delivered' | 'Pending' | 'Order Placed' | 'Confirmed' | 'In Production / In-House' | 'Not Ordered';
        metadata?: MetadataItem[];
    } & PortData;

    interface Props {
        data: ItemData;
        selected?: boolean;
        id: string;
        dragging?: boolean;
    }

    let {
        data = $bindable(),
        selected = false,
        id,
        dragging = false
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
    const { addInput, removeInput, addOutput, removeOutput, updatePortInterface } = createPortHandlers<ItemData>(id);
    
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
    let tempComment = $state(data.comment || '');

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

    // Context menu handling
    let showContextMenu = $state(false);
    let contextMenuX = $state(0);
    let contextMenuY = $state(0);
    let nodeElement: HTMLDivElement | undefined = $state();

    function handleContextMenu(event: MouseEvent) {
        event.preventDefault();
        event.stopPropagation();
        
        if (!nodeElement) return;

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
                id: `item-${Date.now()}`,
                position: {
                    x: currentNode.position.x + 20,
                    y: currentNode.position.y + 20
                },
                data: {
                    ...currentNode.data,
                    id: `ITM-${Math.random().toString(36).substring(2, 9).toUpperCase()}`,
                    inputs: Array.isArray(currentNode.data.inputs) ? currentNode.data.inputs.map(input => ({...input})) : [],
                    outputs: Array.isArray(currentNode.data.outputs) ? currentNode.data.outputs.map(output => ({...output})) : [],
                    metadata: Array.isArray(currentNode.data.metadata) ? currentNode.data.metadata.map(meta => ({...meta})) : []
                },
                selected: false
            };
            
            currentNodes.update(n => [...n, newNode]);
            addToHistory();
        }
        showContextMenu = false;
    }

</script>

<div class="item-node" class:selected oncontextmenu={handleContextMenu} bind:this={nodeElement}>
    <!-- Input Handles -->
    <PortHandles 
        nodeId={id}
        ports={data.inputs || []}
        type="input"
        onAdd={addInput}
        onRemove={removeInput}
        onUpdateInterface={handleUpdateInputInterface}
    />

    <div class="item-header">
        <div class="item-header-left">
            <Box size={12} />
            <span class="item-title">Item</span>
        </div>
        <button 
            class="delete-button" 
            onclick={stopPropagation(handleDelete)}
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
                    onblur={handleCommentEdit}
                    onkeydown={(e) => {
                        if (e.key === 'Enter') handleCommentEdit();
                        if (e.key === 'Escape') {
                            tempComment = data.comment || '';
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
                        tempComment = data.comment || '';
                    })}
                >
                    {data.comment || 'Click to add comment'}
                </span>
            {/if}
        </div>

        <div class="item-field">
            <span class="field-label">ID:</span>
            <span class="field-value">{data.id}</span>
        </div>

        <div class="item-field">
            <span class="field-label">Order status:</span>
            <select 
                class="field-select"
                value={data.orderStatus || 'Not Ordered'}
                onchange={(e) => updateNodeData('orderStatus', (e.target as HTMLSelectElement).value)}
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
            onUpdate={(metadata) => updateNodeData('metadata', metadata)}
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
    .item-node {
        position: relative;
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

    .field-select {
        border: 1px solid #e5e7eb;
        border-radius: 2px;
        padding: 1px 4px;
        font-size: 10px;
        font-family: inherit;
        color: #374151;
        background: white;
        outline: none;
        cursor: pointer;
        flex: 1;
    }

    .field-select:focus {
        border-color: #93c5fd;
        box-shadow: 0 0 0 1px rgba(147, 197, 253, 0.3);
    }

    .field-select:hover {
        background-color: #f9fafb;
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