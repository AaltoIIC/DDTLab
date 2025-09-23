<script lang="ts">
    import { createBubbler, stopPropagation } from 'svelte/legacy';

    const bubble = createBubbler();
    import { createEventDispatcher } from 'svelte';
    import { Copy, Settings, FolderPlus } from '@lucide/svelte';

    interface Props {
        x?: number;
        y?: number;
        visible?: boolean;
        showSystemType?: boolean;
        showAddToView?: boolean;
    }

    let { x = 0, y = 0, visible = $bindable(false), showSystemType = false, showAddToView = false }: Props = $props();

    const dispatch = createEventDispatcher<{
        duplicate: void;
        setSystemType: void;
        addToView: void;
    }>();

    function handleDuplicate() {
        dispatch('duplicate');
        visible = false;
    }

    function handleSetSystemType() {
        dispatch('setSystemType');
        visible = false;
    }

    function handleAddToView() {
        dispatch('addToView');
        visible = false;
    }

    function handleClickOutside(event: MouseEvent) {
        const target = event.target as HTMLElement;
        if (!target.closest('.context-menu')) {
            visible = false;
        }
    }
</script>

{#if visible}
    <div 
        class="context-menu"
        style="left: {x}px; top: {y}px;"
        onclick={stopPropagation(bubble('click'))}
    >
        <button
            class="context-menu-item"
            onclick={handleDuplicate}
        >
            <Copy size={14} />
            <span>Duplicate</span>
        </button>
        {#if showSystemType}
            <button
                class="context-menu-item"
                onclick={handleSetSystemType}
            >
                <Settings size={14} />
                <span>Set System Type</span>
            </button>
        {/if}
        {#if showAddToView}
            <button
                class="context-menu-item"
                onclick={handleAddToView}
            >
                <FolderPlus size={14} />
                <span>Add Package to View</span>
            </button>
        {/if}
    </div>
{/if}

<svelte:window onclick={handleClickOutside} />

<style>
    .context-menu {
        position: fixed;
        background: white;
        border: 1px solid #e5e7eb;
        border-radius: 6px;
        box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
        padding: 4px;
        z-index: 10000;
        min-width: 120px;
        pointer-events: auto !important;
    }
    
    .context-menu-item {
        display: flex;
        align-items: center;
        gap: 8px;
        width: 100%;
        padding: 6px 8px;
        border: none;
        background: none;
        border-radius: 4px;
        font-size: 12px;
        color: #374151;
        cursor: pointer;
        transition: all 0.2s;
        text-align: left;
    }
    
    .context-menu-item:hover {
        background-color: #f3f4f6;
        color: #111827;
    }
</style>