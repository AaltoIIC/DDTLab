<script lang="ts">
    import { run } from 'svelte/legacy';
    import { fade } from 'svelte/transition';
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
    
    // Hover state for showing labels
    let isHovered = $state(false);
    
    function handleDelete() {
        currentEdges.update(edges => edges.filter(edge => edge.id !== id));
        addToHistory();
    }
</script>

<g 
    onmouseenter={() => isHovered = true}
    onmouseleave={() => isHovered = false}
>
    <BaseEdge 
        path={edgePath[0]} 
        {markerEnd} 
        style={`stroke: ${strokeColor}; stroke-width: ${strokeWidth}px; stroke-dasharray: ${strokeDasharray};`}
    />
</g>

<EdgeLabelRenderer>
    <div
        style="position: absolute; transform: translate(-50%, -50%); transform: translate({centerX}px, {centerY}px)"
        class="nodrag nopan edge-label-group"
    >
        {#if isHovered}
            <div class="labels-container" transition:fade={{ duration: 150 }}>
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
            </div>
        {/if}
        <button class="edge-button" onclick={handleDelete}>
            ×
        </button>
    </div>
</EdgeLabelRenderer>

<style>
    .edge-label-group {
        pointer-events: all;
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 4px;
    }
    
    .labels-container {
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 4px;
        position: absolute;
        bottom: 100%;
        margin-bottom: 8px;
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
        opacity: 0;
    }
    
    .edge-label-group:hover .edge-button {
        opacity: 1;
    }
    
    .edge-button:hover {
        background: #ef4444;
        border-color: #ef4444;
        color: white;
        transform: scale(1.1);
    }
    
    .adapter-label {
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