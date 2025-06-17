<script lang="ts">
    import { Handle, Position } from '@xyflow/svelte';
    import { Plus, Minus } from 'lucide-svelte';
    import { onMount } from 'svelte';
    
    export let nodeId: string;
    export let ports: string[] = [];
    export let type: 'input' | 'output';
    export let onAdd: () => void;
    export let onRemove: (index: number) => void;
    
    $: position = type === 'input' ? Position.Left : Position.Right;
    $: containerClass = type === 'input' ? 'handles-left' : 'handles-right';
    $: offset = type === 'input' ? -8 : -8;
    $: side = type === 'input' ? 'left' : 'right';

    // Force re-render when component mounts to ensure handles are registered
    let mounted = false;
    onMount(() => {
        mounted = true;
    });
</script>

<div class="handles-container {containerClass}">
    {#each ports as port, i (`${nodeId}-${type}-${i}`)}
        <div class="handle-group" style="top: {20 + i * 30}px;">
            <Handle 
                type={type === 'input' ? 'target' : 'source'}
                position={position}
                id={`${nodeId}-${type}-${port}`}
                style="position: absolute; top: 50%; transform: translateY(-50%);"
                isConnectable={true}
            />
            <span class="handle-label">{port}</span>
            {#if ports.length > 0}
                <button 
                    class="handle-remove" 
                    on:click|stopPropagation={() => onRemove(i)}
                    title="Remove {type}"
                >
                    <Minus size={12} />
                </button>
            {/if}
        </div>
    {/each}
    <button 
        class="handle-add" 
        on:click|stopPropagation={onAdd}
        title="Add {type}"
        style="top: {20 + ports.length * 30}px;"
    >
        <Plus size={12} />
    </button>
</div>

<style>
    .handles-container {
        position: absolute;
        top: 0;
        height: 100%;
        width: 30px;
    }

    .handles-left {
        left: -15px;
    }

    .handles-right {
        right: -15px;
    }

    .handle-group {
        position: absolute;
        display: flex;
        align-items: center;
        justify-content: center;
        width: 100%;
        height: 20px;
    }

    .handle-label {
        font-size: 10px;
        color: #6b7280;
        white-space: nowrap;
        opacity: 0;
        transition: opacity 0.2s;
        position: absolute;
        pointer-events: none;
    }

    .handles-left .handle-label {
        left: 20px;
    }

    .handles-right .handle-label {
        right: 20px;
    }

    :global(.package-node:hover) .handle-label,
    :global(.part-node:hover) .handle-label,
    :global(.item-node:hover) .handle-label {
        opacity: 1;
    }

    .handle-add {
        position: absolute;
        background: white;
        border: 1px solid #e5e7eb;
        border-radius: 4px;
        padding: 4px;
        cursor: pointer;
        display: flex;
        align-items: center;
        justify-content: center;
        transition: all 0.2s;
        opacity: 0;
    }

    .handle-remove {
        background: white;
        border: 1px solid #e5e7eb;
        border-radius: 4px;
        padding: 2px;
        cursor: pointer;
        display: flex;
        align-items: center;
        justify-content: center;
        transition: all 0.2s;
        opacity: 0;
        position: absolute;
        z-index: 10;
    }

    .handles-left .handle-add {
        left: 50%;
        transform: translateX(-50%);
    }

    .handles-right .handle-add {
        right: 50%;
        transform: translateX(50%);
    }

    :global(.package-node:hover) .handle-add,
    :global(.package-node:hover) .handle-remove,
    :global(.part-node:hover) .handle-add,
    :global(.part-node:hover) .handle-remove,
    :global(.item-node:hover) .handle-add,
    :global(.item-node:hover) .handle-remove {
        opacity: 1;
    }

    .handle-add:hover {
        background-color: #dbeafe;
        border-color: #3b82f6;
        color: #3b82f6;
    }

    .handles-left .handle-remove {
        left: 20px;
    }

    .handles-right .handle-remove {
        right: 20px;
    }

    .handle-remove:hover {
        background-color: #fee2e2;
        border-color: #dc2626;
        color: #dc2626;
    }

    :global(.handle) {
        position: absolute;
        width: 8px;
        height: 8px;
        background: white;
        border: 1px solid #6b7280;
        border-radius: 50%;
    }

    .handles-left :global(.handle) {
        left: 11px;
    }

    .handles-right :global(.handle) {
        right: 11px;
    }
</style>