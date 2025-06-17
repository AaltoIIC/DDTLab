<script lang="ts">
    import { Handle, Position } from '@xyflow/svelte';
    import { Plus, Minus, Plug } from 'lucide-svelte';
    import { onMount } from 'svelte';
    import type { Port } from '../interfaces';
    import { standardInterfaces, getInterfacesByCategory } from '../interfaces';
    
    export let nodeId: string;
    export let ports: Port[] = [];
    export let type: 'input' | 'output';
    export let onAdd: () => void;
    export let onRemove: (index: number) => void;
    export let onUpdateInterface: (index: number, interfaceType: string | undefined) => void;
    
    $: position = type === 'input' ? Position.Left : Position.Right;
    $: containerClass = type === 'input' ? 'handles-left' : 'handles-right';
    $: offset = type === 'input' ? -8 : -8;
    $: side = type === 'input' ? 'left' : 'right';

    // Force re-render when component mounts to ensure handles are registered
    let mounted = false;
    onMount(() => {
        mounted = true;
    });
    
    // Interface selection state
    let showInterfaceSelector: number | null = null;
    let selectedCategory: string = 'electrical';
    
    function selectInterface(index: number, interfaceId: string | undefined) {
        onUpdateInterface(index, interfaceId);
        showInterfaceSelector = null;
    }
    
    function getInterfaceColor(interfaceType: string | undefined): string {
        if (!interfaceType) return '#6b7280'; // gray
        const intf = standardInterfaces[interfaceType];
        if (!intf) return '#6b7280';
        
        switch (intf.category) {
            case 'electrical': return '#f59e0b'; // yellow
            case 'mechanical': return '#6b7280'; // gray
            case 'fluid': return '#3b82f6'; // blue
            case 'data': return '#10b981'; // green
            default: return '#6b7280';
        }
    }
</script>

<div class="handles-container {containerClass}">
    {#each ports as port, i (`${nodeId}-${type}-${i}`)}
        <div class="handle-group" style="top: {20 + i * 30}px;">
            <Handle 
                type={type === 'input' ? 'target' : 'source'}
                position={position}
                id={`${nodeId}-${type}-${port.name}`}
                style="position: absolute; top: 50%; transform: translateY(-50%); background: {getInterfaceColor(port.interfaceType)}; border-color: {getInterfaceColor(port.interfaceType)};"
                isConnectable={true}
            />
            <span class="handle-label">
                {port.name}
                {#if port.interfaceType}
                    <span class="interface-type">({standardInterfaces[port.interfaceType]?.name || 'Unknown'})</span>
                {/if}
            </span>
            <button 
                class="handle-interface" 
                on:click|stopPropagation={() => showInterfaceSelector = showInterfaceSelector === i ? null : i}
                title="Set interface type"
                style="color: {getInterfaceColor(port.interfaceType)}"
            >
                <Plug size={10} />
            </button>
            {#if ports.length > 0}
                <button 
                    class="handle-remove" 
                    on:click|stopPropagation={() => onRemove(i)}
                    title="Remove {type}"
                >
                    <Minus size={10} />
                </button>
            {/if}
            
            {#if showInterfaceSelector === i}
                <div class="interface-selector" on:click|stopPropagation>
                    <div class="interface-categories">
                        <button 
                            class="category-tab" 
                            class:active={selectedCategory === 'electrical'}
                            on:click={() => selectedCategory = 'electrical'}
                        >
                            Electrical
                        </button>
                        <button 
                            class="category-tab" 
                            class:active={selectedCategory === 'mechanical'}
                            on:click={() => selectedCategory = 'mechanical'}
                        >
                            Mechanical
                        </button>
                        <button 
                            class="category-tab" 
                            class:active={selectedCategory === 'fluid'}
                            on:click={() => selectedCategory = 'fluid'}
                        >
                            Fluid
                        </button>
                        <button 
                            class="category-tab" 
                            class:active={selectedCategory === 'data'}
                            on:click={() => selectedCategory = 'data'}
                        >
                            Data
                        </button>
                    </div>
                    <div class="interface-list">
                        <button 
                            class="interface-option"
                            class:selected={!port.interfaceType}
                            on:click={() => selectInterface(i, undefined)}
                        >
                            None
                        </button>
                        {#each getInterfacesByCategory(selectedCategory) as intf}
                            <button 
                                class="interface-option"
                                class:selected={port.interfaceType === intf.id}
                                on:click={() => selectInterface(i, intf.id)}
                            >
                                {intf.name}
                            </button>
                        {/each}
                    </div>
                </div>
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
    
    .interface-type {
        font-size: 9px;
        color: #9ca3af;
        display: block;
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
    :global(.package-node:hover) .handle-interface,
    :global(.part-node:hover) .handle-add,
    :global(.part-node:hover) .handle-remove,
    :global(.part-node:hover) .handle-interface,
    :global(.item-node:hover) .handle-add,
    :global(.item-node:hover) .handle-remove,
    :global(.item-node:hover) .handle-interface {
        opacity: 1;
    }
    
    .interface-selector {
        position: absolute;
        background: white;
        border: 1px solid #e5e7eb;
        border-radius: 4px;
        box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
        z-index: 1000;
        min-width: 200px;
        max-height: 300px;
        overflow: hidden;
        display: flex;
        flex-direction: column;
    }
    
    .handles-left .interface-selector {
        left: 60px;
        top: -10px;
    }
    
    .handles-right .interface-selector {
        right: 60px;
        top: -10px;
    }
    
    .interface-categories {
        display: flex;
        border-bottom: 1px solid #e5e7eb;
        background: #f9fafb;
    }
    
    .category-tab {
        flex: 1;
        padding: 4px 8px;
        font-size: 10px;
        border: none;
        background: none;
        cursor: pointer;
        color: #6b7280;
        transition: all 0.2s;
    }
    
    .category-tab:not(:last-child) {
        border-right: 1px solid #e5e7eb;
    }
    
    .category-tab:hover {
        background: #f3f4f6;
    }
    
    .category-tab.active {
        background: white;
        color: #1f2937;
        font-weight: 500;
    }
    
    .interface-list {
        max-height: 200px;
        overflow-y: auto;
    }
    
    .interface-option {
        display: block;
        width: 100%;
        padding: 6px 12px;
        font-size: 11px;
        text-align: left;
        border: none;
        background: none;
        cursor: pointer;
        color: #374151;
        transition: all 0.2s;
    }
    
    .interface-option:hover {
        background: #f0f9ff;
    }
    
    .interface-option.selected {
        background: #dbeafe;
        color: #1e40af;
        font-weight: 500;
    }

    .handle-add:hover {
        background-color: #dbeafe;
        border-color: #3b82f6;
        color: #3b82f6;
    }

    .handles-left .handle-remove {
        left: 35px;
    }

    .handles-right .handle-remove {
        right: 35px;
    }
    
    .handle-interface {
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
    
    .handles-left .handle-interface {
        left: 20px;
    }

    .handles-right .handle-interface {
        right: 20px;
    }
    
    .handle-interface:hover {
        background-color: #f0f9ff;
        border-color: #0ea5e9;
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