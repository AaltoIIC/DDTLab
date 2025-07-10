<script lang="ts">
    import { run } from 'svelte/legacy';

    import { BaseEdge, EdgeLabelRenderer, getSmoothStepPath, type EdgeProps } from '@xyflow/svelte';
    import { currentEdges, addToHistory } from '$lib/stores/stores.svelte';
    import type { CompatibilityStatus } from '../interfaces';
    
    interface Props {
        id: EdgeProps['id'];
        sourceX: EdgeProps['sourceX'];
        sourceY: EdgeProps['sourceY'];
        targetX: EdgeProps['targetX'];
        targetY: EdgeProps['targetY'];
        sourcePosition: EdgeProps['sourcePosition'];
        targetPosition: EdgeProps['targetPosition'];
        markerEnd: EdgeProps['markerEnd'];
        data?: { compatibility?: CompatibilityStatus; adapterRequired?: string; message?: string; connectionType?: 'binding' | 'flow' };
    }

    let {
        id,
        sourceX,
        sourceY,
        targetX,
        targetY,
        sourcePosition,
        targetPosition,
        markerEnd,
        data = {}
    }: Props = $props();
    
    let edgePath = $derived(getSmoothStepPath({
        sourceX,
        sourceY,
        sourcePosition,
        targetX,
        targetY,
        targetPosition,
    }));
    
    let centerX = $derived((sourceX + targetX) / 2);
    let centerY = $derived((sourceY + targetY) / 2);
    
    // Determine edge color based on compatibility
    run(() => {
        console.log('Edge data:', id, data);
    });
    
    // Determine edge color based on connection type and compatibility
    let strokeColor = $derived(
        data?.compatibility === 'incompatible' ? '#ef4444' :
        data?.connectionType === 'binding' ? '#dc2626' :
        data?.connectionType === 'flow' ? '#3b82f6' :
        {
            'direct': '#10b981',     // green
            'adapter': '#f59e0b',    // yellow
            'incompatible': '#ef4444' // red
        }[data?.compatibility || 'direct']
    );
    
    let strokeWidth = $derived(data?.connectionType === 'binding' ? 3 : 2);
    
    // Stroke pattern for binding connections
    let strokeDasharray = $derived(data?.connectionType === 'binding' ? '0' : '5,5');
    
    function handleDelete() {
        currentEdges.update(edges => edges.filter(edge => edge.id !== id));
        addToHistory();
    }
</script>

<BaseEdge 
    path={edgePath[0]} 
    {markerEnd} 
    style={`stroke: ${strokeColor}; stroke-width: ${strokeWidth}px; stroke-dasharray: ${strokeDasharray};`}
/>

<EdgeLabelRenderer>
    <div
        style="position: absolute; transform: translate(-50%, -50%); transform: translate({centerX}px, {centerY}px)"
        class="nodrag nopan edge-button-container"
    >
        {#if data?.connectionType}
            <div class="connection-type-label {data.connectionType}-label">
                {data.connectionType === 'binding' ? 'Binding' : 'Flow'}
            </div>
        {/if}
        {#if data?.compatibility === 'adapter' && data?.adapterRequired}
            <div class="adapter-label">
                {data.adapterRequired}
            </div>
        {/if}
        {#if data?.compatibility === 'incompatible' && data?.message}
            <div class="incompatible-label">
                {data.message}
            </div>
        {/if}
        <button class="edge-button" onclick={handleDelete}>
            ×
        </button>
    </div>
</EdgeLabelRenderer>

<style>
    .edge-button-container {
        pointer-events: all;
    }
    
    .edge-button {
        width: 20px;
        height: 20px;
        background: #fff;
        border: 1px solid #e5e7eb;
        border-radius: 50%;
        font-size: 16px;
        line-height: 1;
        cursor: pointer;
        display: flex;
        align-items: center;
        justify-content: center;
        padding: 0;
        color: #6b7280;
        transition: all 0.2s;
    }
    
    .edge-button:hover {
        background: #ef4444;
        border-color: #ef4444;
        color: white;
        transform: scale(1.1);
    }
    
    .adapter-label {
        position: absolute;
        bottom: 25px;
        left: 50%;
        transform: translateX(-50%);
        background: #fef3c7;
        border: 1px solid #f59e0b;
        border-radius: 4px;
        padding: 2px 8px;
        font-size: 10px;
        color: #92400e;
        white-space: nowrap;
        pointer-events: none;
    }
    
    .incompatible-label {
        position: absolute;
        bottom: 25px;
        left: 50%;
        transform: translateX(-50%);
        background: #fee2e2;
        border: 1px solid #ef4444;
        border-radius: 4px;
        padding: 2px 8px;
        font-size: 10px;
        color: #991b1b;
        white-space: nowrap;
        pointer-events: none;
        font-weight: 500;
    }
    
    .connection-type-label {
        position: absolute;
        top: -20px;
        left: 50%;
        transform: translateX(-50%);
        border-radius: 4px;
        padding: 2px 8px;
        font-size: 10px;
        white-space: nowrap;
        pointer-events: none;
        font-weight: 500;
    }
    
    .binding-label {
        background: #fef2f2;
        border: 1px solid #dc2626;
        color: #991b1b;
    }
    
    .flow-label {
        background: #eff6ff;
        border: 1px solid #3b82f6;
        color: #1e40af;
    }
</style>