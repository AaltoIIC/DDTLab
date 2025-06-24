<script lang="ts">
    import { createEventDispatcher } from 'svelte';
    import { Copy } from 'lucide-svelte';
    
    export let x: number = 0;
    export let y: number = 0;
    export let visible: boolean = false;
    
    const dispatch = createEventDispatcher<{
        duplicate: void;
    }>();
    
    function handleDuplicate() {
        dispatch('duplicate');
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
        on:click|stopPropagation
    >
        <button 
            class="context-menu-item"
            on:click={handleDuplicate}
        >
            <Copy size={14} />
            <span>Duplicate</span>
        </button>
    </div>
{/if}

<svelte:window on:click={handleClickOutside} />

<style>
    .context-menu {
        position: absolute;
        background: white;
        border: 1px solid #e5e7eb;
        border-radius: 6px;
        box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
        padding: 4px;
        z-index: 1000;
        min-width: 120px;
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