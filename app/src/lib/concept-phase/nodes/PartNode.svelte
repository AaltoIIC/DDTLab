<script lang="ts">
    import { run, stopPropagation, createBubbler } from 'svelte/legacy';

    const bubble = createBubbler();
    import { Component, X } from 'lucide-svelte';
    import type { NodeProps } from '@xyflow/svelte';
    import { useUpdateNodeInternals } from '@xyflow/svelte';
    import { currentNodes, currentEdges, addToHistory } from '$lib/stores/stores.svelte';
    import { navigateToPackage } from '../packageStore';
    import { createPortHandlers, type PortData } from './portUtils';
    import PortHandles from './PortHandles.svelte';
    import MetadataEditor from '../MetadataEditor.svelte';
    import ContextMenu from '../ContextMenu.svelte';
    import { get } from 'svelte/store';

    type MetadataItem = {
        key: string;
        value: string;
    };

    type PartData = {
        declaredName: string;
        comment: string;
        id: string;
        orderStatus?: 'Delivered' | 'Pending' | 'Order Placed' | 'Confirmed' | 'In Production / In-House' | 'Not Ordered';
        metadata?: MetadataItem[];
        nodes?: import('@xyflow/svelte').Node[];
        edges?: import('@xyflow/svelte').Edge[];
    } & PortData;

    interface Props {
        data: PartData;
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
    const { addInput, removeInput, addOutput, removeOutput, updatePortInterface } = createPortHandlers<PartData>(id);
    
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

    function handleDoubleClick(event: MouseEvent) {
        // Check if the click was on an editable field
        const target = event.target as HTMLElement;
        if (target.classList.contains('editable') || target.classList.contains('field-input')) {
            return; // Don't navigate if clicking on editable fields
        }
        
        // Navigate into this part
        console.log('Opening part:', id, data);
        navigateToPackage(id, data.declaredName || 'Unnamed Part');
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
                id: `part-${Date.now()}`,
                position: {
                    x: currentNode.position.x + 20,
                    y: currentNode.position.y + 20
                },
                data: {
                    ...currentNode.data,
                    id: `PRT-${Math.random().toString(36).substring(2, 9).toUpperCase()}`,
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
<!-- svelte-ignore a11y_no_static_element_interactions -->
<!-- svelte-ignore a11y_click_events_have_key_events -->
<div class="part-node" class:selected ondblclick={handleDoubleClick as (event: Event) => void} oncontextmenu={handleContextMenu} bind:this={nodeElement}>
    <!-- Input Handles -->
    <PortHandles 
        nodeId={id}
        ports={data.inputs || []}
        type="input"
        onAdd={addInput}
        onRemove={removeInput}
        onUpdateInterface={handleUpdateInputInterface}
    />

    <div class="part-header">
        <div class="part-header-left">
            <Component size={14} />
            <span class="part-title">Part</span>
        </div>
        <button 
            class="delete-button" 
            onclick={stopPropagation(handleDelete)}
            title="Delete part"
        >
            <X size={12} />
        </button>
    </div>

    <div class="part-content">
        <div class="part-field">
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
                    {data.declaredName || 'Unnamed Part'}
                </span>
            {/if}
        </div>

        <div class="part-field">
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

        <div class="part-field">
            <span class="field-label">ID:</span>
            <span class="field-value">{data.id}</span>
        </div>

        <div class="part-field">
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
    .part-node {
        position: relative;
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
        cursor: pointer;
    }

    .part-node.selected {
        border-color: #3b82f6;
        box-shadow: 0 0 0 2px rgba(59, 130, 246, 0.2);
    }

    .part-header {
        display: flex;
        align-items: center;
        justify-content: space-between;
        margin-bottom: 10px;
        padding-bottom: 6px;
        border-bottom: 1px solid #e5e7eb;
    }

    .part-header-left {
        display: flex;
        align-items: center;
        gap: 6px;
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

    .field-select {
        border: 1px solid #e5e7eb;
        border-radius: 3px;
        padding: 1px 6px;
        font-size: 11px;
        font-family: inherit;
        color: #111827;
        background: white;
        outline: none;
        cursor: pointer;
        flex: 1;
    }

    .field-select:focus {
        border-color: #60a5fa;
        box-shadow: 0 0 0 2px rgba(96, 165, 250, 0.2);
    }

    .field-select:hover {
        background-color: #f3f4f6;
    }

    .delete-button {
        background: none;
        border: none;
        padding: 3px;
        cursor: pointer;
        color: #9ca3af;
        border-radius: 3px;
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