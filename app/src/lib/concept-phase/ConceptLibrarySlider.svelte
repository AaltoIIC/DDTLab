<script lang="ts">
    import { ChevronRight, X, Search, Package, Folder, FolderOpen } from 'lucide-svelte';
    import { slide } from 'svelte/transition';
    import { componentCategories, searchComponents } from './data/hierarchicalComponentLibrary';
    import type { ComponentCategory, LibraryComponent } from './types/componentLibrary';
    
    export let isOpen = false;
    export let onClose: () => void;
    
    let componentLibraryExpanded = true;
    let designLibraryExpanded = false;
    let isDragging = false;
    let searchTerm = '';
    
    // Track expanded state for categories
    let expandedCategories: Set<string> = new Set();
    let expandedSubcategories: Set<string> = new Set();
    
    // Search results
    $: searchResults = searchTerm ? searchComponents(searchTerm) : [];
    $: isSearching = searchTerm.length > 0;
    
    function toggleComponentLibrary() {
        componentLibraryExpanded = !componentLibraryExpanded;
    }
    
    function toggleDesignLibrary() {
        designLibraryExpanded = !designLibraryExpanded;
    }
    
    function toggleCategory(categoryId: string) {
        if (expandedCategories.has(categoryId)) {
            expandedCategories.delete(categoryId);
        } else {
            expandedCategories.add(categoryId);
        }
        expandedCategories = expandedCategories;
    }
    
    function toggleSubcategory(subcategoryId: string) {
        if (expandedSubcategories.has(subcategoryId)) {
            expandedSubcategories.delete(subcategoryId);
        } else {
            expandedSubcategories.add(subcategoryId);
        }
        expandedSubcategories = expandedSubcategories;
    }
    
    function handleDragStart(event: DragEvent, component: LibraryComponent) {
        isDragging = true;
        event.dataTransfer!.effectAllowed = 'copy';
        // Convert the component template to the format expected by the editor
        const dragData = {
            ...component.template,
            name: component.name
        };
        event.dataTransfer!.setData('application/json', JSON.stringify(dragData));
    }
    
    function handleDragEnd() {
        isDragging = false;
    }
    
    function expandAll() {
        componentCategories.forEach(category => {
            expandedCategories.add(category.id);
            if (category.subcategories) {
                category.subcategories.forEach(sub => {
                    expandedSubcategories.add(sub.id);
                });
            }
        });
        expandedCategories = expandedCategories;
        expandedSubcategories = expandedSubcategories;
    }
    
    function collapseAll() {
        expandedCategories.clear();
        expandedSubcategories.clear();
        expandedCategories = expandedCategories;
        expandedSubcategories = expandedSubcategories;
    }
</script>

{#if isOpen}
    <div 
        class="slider-overlay {isDragging ? 'dragging' : ''}" 
        on:click={onClose} 
        transition:slide={{ duration: 300, axis: 'x' }}
    ></div>
    <div class="slider-panel" transition:slide={{ duration: 300, axis: 'x' }}>
        <div class="slider-header">
            <h2 class="slider-title">Concept Library</h2>
            <button class="close-button" on:click={onClose}>
                <X size={20} />
            </button>
        </div>
        
        <div class="slider-content">
            <!-- Component Library Section -->
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
                        <!-- Search Bar -->
                        <div class="search-container">
                            <Search size={16} class="search-icon" />
                            <input
                                type="text"
                                class="search-input"
                                placeholder="Search components..."
                                bind:value={searchTerm}
                            />
                        </div>
                        
                        <!-- Expand/Collapse All Buttons -->
                        {#if !isSearching}
                            <div class="action-buttons">
                                <button class="action-button" on:click={expandAll}>
                                    Expand All
                                </button>
                                <button class="action-button" on:click={collapseAll}>
                                    Collapse All
                                </button>
                            </div>
                        {/if}
                        
                        <!-- Component Tree or Search Results -->
                        {#if isSearching}
                            <div class="search-results">
                                {#if searchResults.length > 0}
                                    <div class="results-header">Found {searchResults.length} component{searchResults.length !== 1 ? 's' : ''}</div>
                                    {#each searchResults as component}
                                        <div 
                                            class="component-item search-result"
                                            draggable="true"
                                            on:dragstart={(e) => handleDragStart(e, component)}
                                            on:dragend={handleDragEnd}
                                        >
                                            <Package size={14} />
                                            <span>{component.name}</span>
                                        </div>
                                    {/each}
                                {:else}
                                    <div class="no-results">No components found</div>
                                {/if}
                            </div>
                        {:else}
                            <!-- Category Tree -->
                            <div class="category-tree">
                                {#each componentCategories as category}
                                    <div class="category">
                                        <button 
                                            class="category-header"
                                            on:click={() => toggleCategory(category.id)}
                                        >
                                            <ChevronRight 
                                                size={14} 
                                                class="chevron {expandedCategories.has(category.id) ? 'expanded' : ''}"
                                            />
                                            {#if category.icon}
                                                <svelte:component this={category.icon} size={16} />
                                            {:else}
                                                <Folder size={16} />
                                            {/if}
                                            <span class="category-name">{category.name}</span>
                                        </button>
                                        
                                        {#if expandedCategories.has(category.id) && category.subcategories}
                                            <div class="subcategories" transition:slide={{ duration: 150 }}>
                                                {#each category.subcategories as subcategory}
                                                    <div class="subcategory">
                                                        <button 
                                                            class="subcategory-header"
                                                            on:click={() => toggleSubcategory(subcategory.id)}
                                                        >
                                                            <ChevronRight 
                                                                size={12} 
                                                                class="chevron {expandedSubcategories.has(subcategory.id) ? 'expanded' : ''}"
                                                            />
                                                            {#if expandedSubcategories.has(subcategory.id)}
                                                                <FolderOpen size={14} />
                                                            {:else}
                                                                <Folder size={14} />
                                                            {/if}
                                                            <span class="subcategory-name">{subcategory.name}</span>
                                                            {#if subcategory.components && subcategory.components.length > 0}
                                                                <span class="component-count">{subcategory.components.length}</span>
                                                            {/if}
                                                        </button>
                                                        
                                                        {#if expandedSubcategories.has(subcategory.id) && subcategory.components}
                                                            <div class="components" transition:slide={{ duration: 150 }}>
                                                                {#each subcategory.components as component}
                                                                    <div 
                                                                        class="component-item"
                                                                        draggable="true"
                                                                        on:dragstart={(e) => handleDragStart(e, component)}
                                                                        on:dragend={handleDragEnd}
                                                                        title={component.description || component.name}
                                                                    >
                                                                        <Package size={12} />
                                                                        <span class="component-name">{component.name}</span>
                                                                    </div>
                                                                {/each}
                                                            </div>
                                                        {/if}
                                                    </div>
                                                {/each}
                                            </div>
                                        {/if}
                                    </div>
                                {/each}
                            </div>
                        {/if}
                    </div>
                {/if}
            </div>
            
            <!-- Design Library Section -->
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
    
    .slider-overlay.dragging {
        pointer-events: none;
    }
    
    .slider-panel {
        position: fixed;
        top: 0;
        left: 88px;
        width: 320px;
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
        flex-shrink: 0;
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
    
    /* Search Bar */
    .search-container {
        position: relative;
        margin-bottom: 12px;
    }
    
    .search-icon {
        position: absolute;
        left: 10px;
        top: 50%;
        transform: translateY(-50%);
        color: #6b7280;
    }
    
    .search-input {
        width: 100%;
        padding: 8px 8px 8px 32px;
        border: 1px solid #e5e7eb;
        border-radius: 6px;
        font-size: 13px;
        outline: none;
        transition: all 0.2s;
    }
    
    .search-input:focus {
        border-color: #3b82f6;
        box-shadow: 0 0 0 2px rgba(59, 130, 246, 0.1);
    }
    
    /* Action Buttons */
    .action-buttons {
        display: flex;
        gap: 8px;
        margin-bottom: 12px;
    }
    
    .action-button {
        flex: 1;
        padding: 6px 12px;
        background: white;
        border: 1px solid #e5e7eb;
        border-radius: 4px;
        font-size: 12px;
        color: #6b7280;
        cursor: pointer;
        transition: all 0.2s;
    }
    
    .action-button:hover {
        background: #f3f4f6;
        color: #374151;
    }
    
    /* Category Tree */
    .category-tree {
        display: flex;
        flex-direction: column;
        gap: 4px;
    }
    
    .category {
        background: white;
        border: 1px solid #e5e7eb;
        border-radius: 6px;
        overflow: hidden;
    }
    
    .category-header {
        width: 100%;
        display: flex;
        align-items: center;
        gap: 8px;
        padding: 10px 12px;
        background: white;
        border: none;
        cursor: pointer;
        transition: all 0.2s;
        text-align: left;
    }
    
    .category-header:hover {
        background: #f9fafb;
    }
    
    .category-name {
        font-size: 14px;
        font-weight: 500;
        color: #1f2937;
        flex: 1;
    }
    
    /* Subcategories */
    .subcategories {
        background: #f9fafb;
        padding: 4px 8px 8px 20px;
    }
    
    .subcategory {
        margin: 4px 0;
    }
    
    .subcategory-header {
        width: 100%;
        display: flex;
        align-items: center;
        gap: 6px;
        padding: 6px 8px;
        background: white;
        border: 1px solid #e5e7eb;
        border-radius: 4px;
        cursor: pointer;
        transition: all 0.2s;
        text-align: left;
    }
    
    .subcategory-header:hover {
        background: #f3f4f6;
    }
    
    .subcategory-name {
        font-size: 13px;
        color: #374151;
        flex: 1;
    }
    
    .component-count {
        font-size: 11px;
        color: #6b7280;
        background: #e5e7eb;
        padding: 2px 6px;
        border-radius: 10px;
    }
    
    /* Components */
    .components {
        padding: 4px 0 0 24px;
    }
    
    .component-item {
        display: flex;
        align-items: center;
        gap: 6px;
        padding: 6px 10px;
        margin: 2px 0;
        background-color: white;
        border: 1px solid #e5e7eb;
        border-radius: 4px;
        cursor: move;
        transition: all 0.2s;
        user-select: none;
        font-size: 12px;
    }
    
    .component-item:hover {
        background-color: #eff6ff;
        border-color: #93c5fd;
        transform: translateX(2px);
    }
    
    .component-item:active {
        opacity: 0.7;
        transform: scale(0.98);
    }
    
    .component-name {
        color: #374151;
    }
    
    /* Search Results */
    .search-results {
        margin-top: 8px;
    }
    
    .results-header {
        font-size: 12px;
        color: #6b7280;
        margin-bottom: 8px;
    }
    
    .search-result {
        margin-bottom: 4px;
    }
    
    .no-results {
        text-align: center;
        color: #9ca3af;
        font-size: 13px;
        padding: 20px;
    }
    
    /* Other */
    .placeholder-text {
        color: #9ca3af;
        font-size: 13px;
        text-align: center;
        padding: 20px;
        margin: 0;
    }
</style>