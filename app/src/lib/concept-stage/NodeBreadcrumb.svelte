<script lang="ts">
    import { ChevronRight, Home } from '@lucide/svelte';
    import { navigationStack, navigateToRoot, navigateToLevel } from './nodeViewStore';

    function navigateToIndex(index: number) {
        if (index === -1) {
            navigateToRoot();
        } else {
            // Use the new navigateToLevel function for proper multi-level navigation
            navigateToLevel(index);
        }
    }
</script>

<div class="breadcrumb-container">
    <button 
        class="breadcrumb-item"
        class:active={$navigationStack.length === 0}
        onclick={() => navigateToIndex(-1)}
    >
        <Home size={14} />
        <span>Root</span>
    </button>
    
    {#each $navigationStack as view, index}
        {#if view.nodeId !== 'root'}
            <ChevronRight size={14} class="breadcrumb-separator" />
            <button 
                class="breadcrumb-item"
                class:active={index === $navigationStack.length - 1}
                onclick={() => navigateToIndex(index)}
            >
                <span>{view.nodeName}</span>
            </button>
        {/if}
    {/each}
</div>

<style>
    .breadcrumb-container {
        display: flex;
        align-items: center;
        gap: 8px;
        padding: 12px 20px;
        background: white;
        border-bottom: 1px solid #e5e7eb;
        font-size: 13px;
    }

    .breadcrumb-item {
        display: flex;
        align-items: center;
        gap: 4px;
        padding: 4px 8px;
        background: none;
        border: none;
        border-radius: 4px;
        color: #6b7280;
        cursor: pointer;
        transition: all 0.2s;
    }

    .breadcrumb-item:hover {
        background: #f3f4f6;
        color: #111827;
    }

    .breadcrumb-item.active {
        color: #111827;
        font-weight: 500;
        cursor: default;
    }

    .breadcrumb-item.active:hover {
        background: none;
    }

    :global(.breadcrumb-separator) {
        color: #d1d5db;
    }
</style>
