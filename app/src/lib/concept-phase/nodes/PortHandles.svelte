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
        <div class="handle-group">
            <Handle 
                type={type === 'input' ? 'target' : 'source'}
                position={position}
                id={`${nodeId}-${type}-${i}`}
                style="top: {i * 25}px;"
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
    >
        <Plus size={12} />
    </button>
</div>

<style>
    .handles-container {
        position: absolute;
        display: flex;
        flex-direction: column;
        gap: 4px;
        align-items: center;
    }

    .handles-left {
        left: -12px;
        top: 50%;
        transform: translateY(-50%);
    }

    .handles-right {
        right: -12px;
        top: 50%;
        transform: translateY(-50%);
    }

    .handle-group {
        display: flex;
        align-items: center;
        gap: 4px;
        position: relative;
    }

    .handle-label {
        font-size: 10px;
        color: #6b7280;
        white-space: nowrap;
        opacity: 0;
        transition: opacity 0.2s;
        position: absolute;
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

    .handle-add, .handle-remove {
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

    .handle-remove {
        position: absolute;
        border-radius: 3px;
        padding: 1px;
    }

    .handles-left .handle-remove {
        left: 32px;
    }

    .handles-right .handle-remove {
        right: 32px;
    }

    .handle-remove:hover {
        background-color: #fee2e2;
        border-color: #dc2626;
        color: #dc2626;
    }
</style>