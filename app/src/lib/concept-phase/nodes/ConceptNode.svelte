<script lang="ts">
    import { stopPropagation, createBubbler } from 'svelte/legacy';

    const bubble = createBubbler();
    import { Grid2X2, Squircle, X, Lock } from '@lucide/svelte';
    import { useSvelteFlow, useUpdateNodeInternals } from '@xyflow/svelte';
    import { currentNodes, currentEdges, addToHistory } from '$lib/stores/stores.svelte';
    import { navigateToPackage } from '../packageStore';
    import { createPortHandlers, type PortData } from './portUtils';
    import PortHandles from './PortHandles.svelte';
    import AttributeEditor from '../MetadataEditor.svelte';
    import ContextMenu from '../ContextMenu.svelte';
    import { get } from 'svelte/store';
    import { capitalize } from 'lodash';
    import { onMount } from 'svelte';
    import { activeViewpointDetails, activeViewpoint, viewpoints } from '../viewpoints/viewpointStore';
    import { detectSystemType, nodeMatchesViewpoint, getSystemTypeColor, getSystemTypeLabel, type SystemTypeInfo } from '../utils/systemTypeDetection';

    type MetadataItem = {
        key: string;
        value: string;
    };

    type NodeData = {
        declaredName: string;
        definition: string;
        comment: string;
        orderStatus?: 'Delivered' | 'Pending' | 'Order Placed' | 'Confirmed' | 'In Production / In-House' | 'Not Ordered';
        metadata?: MetadataItem[];
        nodes?: import('@xyflow/svelte').Node[];
        edges?: import('@xyflow/svelte').Edge[];
    } & PortData;

    interface Props {
        data: NodeData;
        type: 'part' | 'item';
        width: number,
        height: number,
        selected?: boolean;
        id: string;
        dragging?: boolean;
    }

    let {
        data = $bindable(),
        type,
        selected = false,
        id,
        dragging = false
    }: Props = $props();

    // Initialize inputs/outputs if not present
    if (!data.inputs) data.inputs = [];
    if (!data.outputs) data.outputs = [];
    if (!data.metadata) data.metadata = [];

    // Get system type info
    let systemTypeInfo = $derived.by(() => {
        // If it has a custom viewpoint assigned, return that info
        if (data.systemType?.customViewpointId) {
            const customViewpoint = $viewpoints.find(v => v.id === data.systemType.customViewpointId);
            return {
                primary: 'custom' as any,
                customViewpointName: customViewpoint?.name || data.systemType.customViewpointName,
                customViewpointIcon: customViewpoint?.icon || '👁️',
                isAutoDetected: false
            };
        }
        return data.systemType || detectSystemType({ id, type: 'custom', position: {x: 0, y: 0}, data });
    });

    // Check if node should be hidden by viewpoint
    let isHiddenByViewpoint = $derived.by(() => {
        // For custom viewpoints, check both manual selection AND nodes with matching custom system type
        if ($activeViewpointDetails?.type === 'custom') {
            // Check if node is manually included in the viewpoint
            const manuallyIncluded = $activeViewpointDetails.nodeIds?.includes(id) || false;

            // Check if node has this custom viewpoint as its system type
            const hasMatchingCustomType = data.systemType?.customViewpointId === $activeViewpoint;

            // Show node if either condition is true
            return !(manuallyIncluded || hasMatchingCustomType);
        }

        // For system viewpoints, use system type matching
        if ($activeViewpointDetails?.type === 'system') {
            // Also check if node has a matching custom type that was assigned
            if (data.systemType?.customViewpointId) {
                // Custom-typed nodes only show in their custom viewpoint or 'all'
                return $activeViewpoint !== 'all';
            }
            return !nodeMatchesViewpoint({ id, type: 'custom', position: {x: 0, y: 0}, data }, $activeViewpoint);
        }

        return false;
    });

    // Create port handlers
    const { addInput, removeInput, addOutput, removeOutput, updatePortInterface } = createPortHandlers<NodeData>(id);
    
    function handleUpdateInputInterface(index: number, interfaceType: string | undefined) {
        updatePortInterface('input', index, interfaceType);
    }
    
    function handleUpdateOutputInterface(index: number, interfaceType: string | undefined) {
        updatePortInterface('output', index, interfaceType);
    }
    
    // Update React Flow internals when data changes
    const updateNodeInternals = useUpdateNodeInternals();
    $effect(() => {
        if (data) {
            updateNodeInternals(id);
        }
    });

    const { viewport } = useSvelteFlow();
    let zoomLevel = $state(1);
    viewport.subscribe((value) => {
        zoomLevel = value.zoom;
    });

    // Measure and save the nodes width and height into the store
    let nodeElement: HTMLDivElement | undefined = $state();
    onMount(() => {
        const rect = nodeElement!.getBoundingClientRect();
        currentNodes.update(nodes =>
            nodes.map(n => n.id === id ? { ...n, width: rect.width / zoomLevel, height: rect.height / zoomLevel} : n)
        );
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

    // System type dialog
    let showSystemTypeDialog = $state(false);
    let selectedSystemType = $state('auto');

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
                id: `${type}-${Date.now()}`,
                position: {
                    x: currentNode.position.x + 30,
                    y: currentNode.position.y + 30
                },
                data: {
                    ...currentNode.data,
                    id: `${Math.random().toString(36).substring(2, 9).toUpperCase()}`,
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

    function handleSetSystemType() {
        // Initialize with current system type
        if (data.systemType && !data.systemType.isAutoDetected) {
            // Check if it's a custom viewpoint
            if (data.systemType.customViewpointId) {
                selectedSystemType = data.systemType.customViewpointId;
            } else {
                selectedSystemType = data.systemType.primary;
            }
        } else {
            selectedSystemType = 'auto';
        }
        showSystemTypeDialog = true;
    }

    function applySystemType() {
        if (selectedSystemType === 'auto') {
            // Remove manual override, use auto-detection
            delete data.systemType;
        } else {
            // Check if it's a custom viewpoint ID
            const customViewpoint = $viewpoints.find(v => v.id === selectedSystemType && v.type === 'custom');
            if (customViewpoint) {
                // Set as a custom type with the viewpoint's info
                data.systemType = {
                    primary: 'custom' as any, // We'll need to handle this in detection
                    customViewpointId: selectedSystemType,
                    customViewpointName: customViewpoint.name,
                    isAutoDetected: false
                };
            } else {
                // Set as standard system type
                data.systemType = {
                    primary: selectedSystemType as import('../utils/systemTypeDetection').SystemType,
                    isAutoDetected: false
                };
            }
        }

        // Update the nodes store
        const nodes = get(currentNodes);
        const nodeIndex = nodes.findIndex(n => n.id === id);
        if (nodeIndex !== -1) {
            nodes[nodeIndex].data = { ...data };
            currentNodes.set([...nodes]);
            addToHistory();
        }

        showSystemTypeDialog = false;
    }

</script>
<!-- svelte-ignore a11y_no_static_element_interactions -->
<!-- svelte-ignore a11y_click_events_have_key_events -->
<div
    class="concept-node"
    class:selected
    class:hidden-by-viewpoint={isHiddenByViewpoint}
    ondblclick={handleDoubleClick as (event: Event) => void}
    oncontextmenu={handleContextMenu}
    bind:this={nodeElement}>
    <!-- Input Handles -->
    <PortHandles 
        nodeId={id}
        ports={data.inputs || []}
        type="input"
        onAdd={addInput}
        onRemove={removeInput}
        onUpdateInterface={handleUpdateInputInterface}
    />

    <div class="header">
        <div class="header-left">
            {#if type === 'part'}
                <Grid2X2 size={14} />
            {:else}
                <Squircle size={14} />
            {/if}
            <span class="title">{data.definition ? `${data.definition} (${type})` : `${capitalize(type)}`}</span>
            {#if systemTypeInfo.primary !== 'none'}
                <div class="system-badges">
                    <!-- Primary badge -->
                    {#if systemTypeInfo.primary === 'custom'}
                        <!-- Custom viewpoint badge -->
                        <span
                            class="system-badge custom"
                            style="background-color: #8b5cf6"
                            title="Custom View: {systemTypeInfo.customViewpointName}"
                        >
                            <Lock size={8} class="badge-icon" />
                            {systemTypeInfo.customViewpointIcon} {systemTypeInfo.customViewpointName}
                        </span>
                    {:else}
                        <!-- Standard system type badge -->
                        <span
                            class="system-badge"
                            style="background-color: {getSystemTypeColor(systemTypeInfo.primary)}"
                            title="{systemTypeInfo.isAutoDetected ? 'Auto-detected' : 'Manually set'}: {systemTypeInfo.primary}"
                        >
                            {#if !systemTypeInfo.isAutoDetected}
                                <Lock size={8} class="badge-icon" />
                            {/if}
                            {getSystemTypeLabel(systemTypeInfo.primary)}
                        </span>
                    {/if}

                    <!-- Secondary badges -->
                    {#if systemTypeInfo.secondary && systemTypeInfo.secondary.length > 0}
                        {#each systemTypeInfo.secondary as secondaryType}
                            <span
                                class="system-badge secondary"
                                style="background-color: {getSystemTypeColor(secondaryType)}"
                                title="Auto-detected: {secondaryType}"
                            >
                                {getSystemTypeLabel(secondaryType)}
                            </span>
                        {/each}
                    {/if}
                </div>
            {/if}
        </div>
        <button 
            class="delete-button" 
            onclick={stopPropagation(handleDelete)}
            title={`Delete ${type}`}
        >
            <X size={12} />
        </button>
    </div>

    <div class="content">
        <div class="field">
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
                    {data.declaredName || `Unnamed ${capitalize(type)}`}
                </span>
            {/if}
        </div>

        <div class="field">
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

        <div class="field">
            <span class="field-label">ID:</span>
            <span class="field-value">{id}</span>
        </div>

        <div class="field">
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
        
        <AttributeEditor
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
        showSystemType={true}
        on:duplicate={handleDuplicate}
        on:setSystemType={handleSetSystemType}
    />

    {#if showSystemTypeDialog}
        <div class="system-type-dialog">
            <div class="dialog-header">Set System Type</div>
            <div class="dialog-content">
                <label>
                    <input type="radio" bind:group={selectedSystemType} value="auto" />
                    Auto-detect (based on interfaces)
                </label>

                <div class="dialog-section-label">System Types</div>
                <label>
                    <input type="radio" bind:group={selectedSystemType} value="electrical" />
                    Electrical
                </label>
                <label>
                    <input type="radio" bind:group={selectedSystemType} value="mechanical" />
                    Mechanical
                </label>
                <label>
                    <input type="radio" bind:group={selectedSystemType} value="fluid" />
                    Fluid
                </label>
                <label>
                    <input type="radio" bind:group={selectedSystemType} value="data" />
                    Data
                </label>

                {#if $viewpoints.filter(v => v.type === 'custom').length > 0}
                    {@const customViewpoints = $viewpoints.filter(v => v.type === 'custom')}
                    <div class="dialog-section-label">Custom Views</div>
                    {#each customViewpoints as viewpoint}
                        <label>
                            <input type="radio" bind:group={selectedSystemType} value={viewpoint.id} />
                            {viewpoint.icon} {viewpoint.name}
                        </label>
                    {/each}
                {/if}
            </div>
            <div class="dialog-buttons">
                <button onclick={() => showSystemTypeDialog = false}>Cancel</button>
                <button onclick={applySystemType}>Apply</button>
            </div>
        </div>
    {/if}
</div>

<style>
    .concept-node {
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

    .concept-node:hover {
        border-color: #60a5fa;
        box-shadow: 0 2px 6px rgba(0, 0, 0, 0.12);
        cursor: pointer;
    }

    .concept-node.selected {
        border-color: #3b82f6;
        box-shadow: 0 0 0 2px rgba(59, 130, 246, 0.2);
    }

    .header {
        display: flex;
        align-items: center;
        justify-content: space-between;
        margin-bottom: 10px;
        padding-bottom: 6px;
        border-bottom: 1px solid #e5e7eb;
    }

    .header-left {
        display: flex;
        align-items: center;
        gap: 6px;
    }

    .title {
        font-weight: 600;
        font-size: 12px;
        color: #4b5563;
    }

    .system-badges {
        display: inline-flex;
        align-items: center;
        gap: 4px;
        margin-left: 8px;
    }

    .system-badge {
        display: inline-flex;
        align-items: center;
        gap: 2px;
        padding: 2px 6px;
        border-radius: 4px;
        font-size: 10px;
        font-weight: 600;
        color: white;
        text-transform: uppercase;
        letter-spacing: 0.5px;
    }

    .system-badge.secondary {
        opacity: 0.8;
    }

    .system-badge.custom {
        text-transform: none;
        padding: 2px 8px;
    }

    .badge-icon {
        display: inline-block;
        vertical-align: middle;
    }

    .content {
        display: flex;
        flex-direction: column;
        gap: 4px;
    }

    .field {
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

    /* Hide nodes not in viewpoint */
    .concept-node.hidden-by-viewpoint {
        opacity: 0.2;
        pointer-events: none;
    }

    .system-type-dialog {
        position: absolute;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
        background: white;
        border: 1px solid #e5e7eb;
        border-radius: 6px;
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
        padding: 16px;
        z-index: 1001;
        min-width: 200px;
    }

    .dialog-header {
        font-weight: 600;
        font-size: 14px;
        margin-bottom: 12px;
        color: #111827;
    }

    .dialog-content {
        display: flex;
        flex-direction: column;
        gap: 8px;
        margin-bottom: 16px;
    }

    .dialog-content label {
        display: flex;
        align-items: center;
        gap: 8px;
        font-size: 13px;
        color: #4b5563;
        cursor: pointer;
    }

    .dialog-content input[type="radio"] {
        cursor: pointer;
    }

    .dialog-section-label {
        font-weight: 600;
        font-size: 12px;
        text-transform: uppercase;
        color: #6b7280;
        margin-top: 8px;
        margin-bottom: 4px;
    }

    .dialog-buttons {
        display: flex;
        gap: 8px;
        justify-content: flex-end;
    }

    .dialog-buttons button {
        padding: 4px 12px;
        border: 1px solid #e5e7eb;
        border-radius: 4px;
        background: white;
        font-size: 12px;
        cursor: pointer;
        transition: all 0.2s;
    }

    .dialog-buttons button:hover {
        background: #f3f4f6;
    }

    .dialog-buttons button:last-child {
        background: #3b82f6;
        color: white;
        border-color: #3b82f6;
    }

    .dialog-buttons button:last-child:hover {
        background: #2563eb;
    }
</style>