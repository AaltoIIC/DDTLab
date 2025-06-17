<script lang="ts">
    import { ChevronRight, X } from 'lucide-svelte';
    import { slide } from 'svelte/transition';
    
    export let isOpen = false;
    export let onClose: () => void;
    
    let componentLibraryExpanded = false;
    let designLibraryExpanded = false;
    
    function toggleComponentLibrary() {
        componentLibraryExpanded = !componentLibraryExpanded;
    }
    
    function toggleDesignLibrary() {
        designLibraryExpanded = !designLibraryExpanded;
    }
</script>

{#if isOpen}
    <div class="slider-overlay" on:click={onClose} transition:slide={{ duration: 300, axis: 'x' }}></div>
    <div class="slider-panel" transition:slide={{ duration: 300, axis: 'x' }}>
        <div class="slider-header">
            <h2 class="slider-title">Concept Library</h2>
            <button class="close-button" on:click={onClose}>
                <X size={20} />
            </button>
        </div>
        
        <div class="slider-content">
            <div class="library-section">
                <button class="library-header" on:click={toggleComponentLibrary}>
                    <ChevronRight 
                        size={16} 
                        class="chevron {componentLibraryExpanded ? 'expanded' : ''}"
                    />
                    <span>Component Library</span>
                </button>
                {#if componentLibraryExpanded}
                    <div class="library-content" transition:slide={{ duration: 200 }}>
                        <p class="placeholder-text">Component items will appear here</p>
                    </div>
                {/if}
            </div>
            
            <div class="library-section">
                <button class="library-header" on:click={toggleDesignLibrary}>
                    <ChevronRight 
                        size={16} 
                        class="chevron {designLibraryExpanded ? 'expanded' : ''}"
                    />
                    <span>Design Library</span>
                </button>
                {#if designLibraryExpanded}
                    <div class="library-content" transition:slide={{ duration: 200 }}>
                        <p class="placeholder-text">Design items will appear here</p>
                    </div>
                {/if}
            </div>
        </div>
    </div>
{/if}

<style>
    .slider-overlay {
        position: fixed;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        background-color: rgba(0, 0, 0, 0.1);
        z-index: 200;
    }
    
    .slider-panel {
        position: fixed;
        top: 0;
        left: 88px;
        width: 280px;
        height: 100vh;
        background-color: white;
        border-right: 1px solid #e5e7eb;
        box-shadow: 2px 0 8px rgba(0, 0, 0, 0.1);
        z-index: 201;
        display: flex;
        flex-direction: column;
    }
    
    .slider-header {
        display: flex;
        align-items: center;
        justify-content: space-between;
        padding: 20px;
        border-bottom: 1px solid #e5e7eb;
    }
    
    .slider-title {
        font-size: 18px;
        font-weight: 600;
        color: #1f2937;
        margin: 0;
    }
    
    .close-button {
        background: none;
        border: none;
        padding: 4px;
        cursor: pointer;
        color: #6b7280;
        border-radius: 4px;
        transition: all 0.2s;
        display: flex;
        align-items: center;
        justify-content: center;
    }
    
    .close-button:hover {
        background-color: #f3f4f6;
        color: #1f2937;
    }
    
    .slider-content {
        flex: 1;
        overflow-y: auto;
        padding: 16px;
    }
    
    .library-section {
        margin-bottom: 16px;
    }
    
    .library-header {
        width: 100%;
        display: flex;
        align-items: center;
        gap: 8px;
        padding: 12px;
        background: #f9fafb;
        border: 1px solid #e5e7eb;
        border-radius: 6px;
        cursor: pointer;
        transition: all 0.2s;
        font-size: 14px;
        font-weight: 500;
        color: #374151;
        text-align: left;
    }
    
    .library-header:hover {
        background: #f3f4f6;
        border-color: #d1d5db;
    }
    
    .chevron {
        transition: transform 0.2s;
        color: #6b7280;
    }
    
    .chevron.expanded {
        transform: rotate(90deg);
    }
    
    .library-content {
        padding: 12px;
        margin-top: 8px;
        background: #fafbfc;
        border: 1px solid #e5e7eb;
        border-radius: 6px;
    }
    
    .placeholder-text {
        color: #9ca3af;
        font-size: 13px;
        text-align: center;
        padding: 20px;
        margin: 0;
    }
</style>