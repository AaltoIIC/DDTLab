<script lang="ts">
    import { BaseEdge, EdgeLabelRenderer, getSmoothStepPath, type EdgeProps } from '@xyflow/svelte';
    import { currentEdges, addToHistory } from '$lib/stores/stores';
    
    export let id: EdgeProps['id'];
    export let sourceX: EdgeProps['sourceX'];
    export let sourceY: EdgeProps['sourceY'];
    export let targetX: EdgeProps['targetX'];
    export let targetY: EdgeProps['targetY'];
    export let sourcePosition: EdgeProps['sourcePosition'];
    export let targetPosition: EdgeProps['targetPosition'];
    export let markerEnd: EdgeProps['markerEnd'];
    
    $: edgePath = getSmoothStepPath({
        sourceX,
        sourceY,
        sourcePosition,
        targetX,
        targetY,
        targetPosition,
    });
    
    $: centerX = (sourceX + targetX) / 2;
    $: centerY = (sourceY + targetY) / 2;
    
    function handleDelete() {
        currentEdges.update(edges => edges.filter(edge => edge.id !== id));
        addToHistory();
    }
</script>

<BaseEdge path={edgePath[0]} {markerEnd} />

<EdgeLabelRenderer>
    <div
        style="position: absolute; transform: translate(-50%, -50%); transform: translate({centerX}px, {centerY}px)"
        class="nodrag nopan edge-button-container"
    >
        <button class="edge-button" on:click={handleDelete}>
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
</style>