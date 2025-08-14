<script lang="ts">
    import { type Writable } from 'svelte/store';
    import { type ItemDefinition, type PartDefinition, type SysMLDefinition } from '$lib/types/types'
    import { currentPartDefinitions, currentItemDefinitions, addToHistory } from '$lib/stores/stores.svelte'
    import { formatDate, generateId } from '$lib/helpers';
    import { ChevronRight, X, FileText, Trash2, Download, Upload, Copy, Search, CirclePlus, SquarePen, defaultAttributes, Grid2x2, Squircle } from '@lucide/svelte';
    import { slide, fade } from 'svelte/transition';
    import { capitalize } from 'lodash';
    import DefinitionEditor from './DefinitionEditor.svelte';
    import { createData } from './utils/templateInstantiation';

    interface Props {
        type: 'part' | 'item';
        isOpen?: boolean;
        // defBtnRef?: HTMLElement | undefined;
        onClose: () => void;
    }

    let { type, isOpen = false, onClose }: Props = $props();

    let currentDefs: Writable<SysMLDefinition[]> = $derived.by(() => {
        return type === 'part' ? currentPartDefinitions : currentItemDefinitions;
    });

    let newDefMenuOpen = $state(false);
    let defsExpanded = $state(false);

    let isDragging = $state(false);
    let selectedDefinition: PartDefinition | ItemDefinition | null = $state(null);
    
    let searchTerm = $state('');

    let filteredDefs = $derived.by(() => {
        const sanitized = searchTerm.trim().toLowerCase();
        if (sanitized) {
            return $currentDefs.filter(o => o.name.toLowerCase().includes(sanitized));
        }
        else {
            return $currentDefs;
        }
    });

    let currentEditId: string | null = $state(null);
    let editDefMenuOpen: boolean = $derived(currentEditId ? true : false);

    $effect(() => {
        if (!editDefMenuOpen) {
            currentEditId = null;
        }
    });

    function handleDuplicate(id: string) {
        const original = $currentDefs.find( d => d.id === id );

        if (!original) return null;

        const duplicate: SysMLDefinition = {
            ...original,
            id: generateId($currentDefs.map( p => p.id )),
            name: `${original.name} (Copy)`,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
        };

        const data = createData(duplicate);
        duplicate.data.nodes = data.nodes;
        duplicate.data.edges = data.edges;
        
        currentDefs.update( defs => [...defs, duplicate]);

        addToHistory();
    }

    function handleDragStart(event: DragEvent, definition: SysMLDefinition) {
        console.log(definition.data.nodes)
        isDragging = true;
        event.dataTransfer!.effectAllowed = 'copy';
        event.dataTransfer!.setData('application/json', JSON.stringify({
            type: 'template',
            template: definition
        }));
    }

    function handleDragEnd() {
        isDragging = false;
    }

    function handleImport() {alert("Coming soon!")} // TODO: Implement eventually

    function handleClose() {
        newDefMenuOpen = defsExpanded = false;
        onClose();
    }

    function handleDelete(definition: PartDefinition | ItemDefinition) {
        if (confirm(`Are you sure you want to delete ${definition.type} definition "${definition.name}"?`)) {
                currentDefs.update(defs => defs.filter(d => d.id !== definition.id));
                addToHistory();
            }
        }

</script>

<!-- svelte-ignore a11y_click_events_have_key_events -->
<!-- svelte-ignore a11y_no_static_element_interactions -->
{#if isOpen}
    <div
        class="slider-overlay {isDragging ? 'dragging' : ''}"
        onclick={handleClose}
        transition:fade={{ duration:200 }}
    ></div>
    <div id="def-slider" class="slider-panel" transition:slide={{ duration: 300, axis: 'x' }}>
        <div class="slider-header">
            <h2 class="slider-title">{capitalize(type)} Definitions</h2>
            <div class="header-actions">
                <button class="icon-button" onclick={handleImport} title="Import template">
                    <Upload size={18} />
                </button>
                <button id="closeDefSliderBtn" class="close-button" onclick={handleClose}>
                    <X size={20} />
                </button>
            </div>
        </div>

        <div class="slider-content">
            <div class="new-definition">
                {#if !newDefMenuOpen}
                    <button
                        id="defBtn"
                        class="library-header" 
                        onclick={() => newDefMenuOpen = !newDefMenuOpen}
                    >
                        <span>
                            <CirclePlus size={18} />
                        </span>
                        <span>Define a New {capitalize(type)}</span>
                    </button>
                {:else}
                    <DefinitionEditor {currentDefs} {type} bind:isOpen={newDefMenuOpen}/>
                {/if}
            </div>
            <div id="allDefsSection" class="library-section">
                <button id="allDefsBtn" class="library-header" onclick={() => defsExpanded = !defsExpanded}>
                    <span class="chevron {defsExpanded ? 'expanded' : ''}">
                        <ChevronRight size={16} />
                    </span>
                    <span>All {capitalize(type)} Definitions ({$currentDefs.length})</span>
                </button>
                {#if defsExpanded}
                    <div class="library-content" transition:slide={{ duration: 200 }}>
                        <div class="search-container">
                            <span class="search-icon">
                                <Search size={14} />
                            </span>
                            <input
                                type="text"
                                class="search-input"
                                placeholder="Search {type}s"
                                bind:value={searchTerm}
                            />
                        </div>
                        {#if $currentDefs.length}
                            {#if filteredDefs.length}
                                {#each filteredDefs as definition}
                                    {#if currentEditId === definition.id}
                                        <div class="card-editor">
                                            <DefinitionEditor
                                                {type}
                                                {currentDefs}
                                                bind:isOpen={editDefMenuOpen}
                                                editDef={definition}
                                            />
                                        </div>
                                    {:else}
                                        <div
                                            class="template-card"
                                            draggable="true"
                                            ondragstart={(e) => handleDragStart(e, definition)}
                                            ondragend={handleDragEnd}
                                            onclick={() => selectedDefinition = definition}
                                            class:selected={selectedDefinition?.id === definition.id}
                                        >
                                            <div class="template-header">
                                                {#if type === 'part'}
                                                    <Grid2x2 size={16} />
                                                {:else}
                                                    <Squircle size={16} />
                                                {/if}
                                                <span class="template-name">{definition.name}</span>
                                            </div>
                                            {#if definition.description}
                                                <p class="template-description">{definition.description}</p>
                                            {/if}
                                            <div class="template-meta">
                                                <ul>
                                                {#if definition.data.attributes.length}
                                                    <li>attributes: {definition.data.attributes.join(", ")}</li>
                                                {/if}
                                                {#if definition.data.partRefs?.length}
                                                    <li>parts: {definition.data.partRefs.map( ref => ref.name ).join(", ")}</li>
                                                {/if}
                                                {#if definition.data.itemRefs.length}
                                                    <li>items: {definition.data.itemRefs.map( ref => ref.name ).join(", ")}</li>
                                                {/if}
                                                </ul>
                                            </div>
                                            <div class="template-footer">
                                                <span class="date">{formatDate(definition.createdAt)}</span>
                                                <div class="template-actions">
                                                    <button 
                                                        class="action-button" 
                                                        onclick={() => handleDuplicate(definition.id)}
                                                        title="Duplicate"
                                                    >
                                                        <Copy size={14} />
                                                    </button>
                                                    <button 
                                                        class="action-button" 
                                                        onclick={() => {currentEditId = definition.id}}
                                                        title="Edit"
                                                    >
                                                        <SquarePen size={14} />
                                                    </button>
                                                    <button 
                                                        class="action-button delete" 
                                                        onclick={() => handleDelete(definition)}
                                                        title="Delete"
                                                    >
                                                        <Trash2 size={14} />
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                    {/if}
                                {/each}
                            {:else}
                                <p class="placeholder-text">No {type} definitions match your search... Try again.</p>
                            {/if}
                        {:else}
                            <p class="placeholder-text">No {type} definitions yet. Create a {type} definition to get started.</p>
                        {/if}
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

    .header-actions {
        display: flex;
        align-items: center;
        gap: 8px;
    }

    .icon-button,
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

    .icon-button:hover,
    .close-button:hover {
        background-color: #f3f4f6;
        color: #1f2937;
    }

    .slider-content {
        flex: 1;
        overflow-y: auto;
        padding: 16px;
    }

    .new-definition {
        margin-bottom: 16px;
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

    .library-content {
        padding: 12px;
        margin-top: 8px;
        background: #fafbfc;
        border: 1px solid #e5e7eb;
        border-radius: 6px;
    }

    .search-container {
        position: relative;
        margin-bottom: 12px;
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
    .search-icon {
        position: absolute;
        left: 10px;
        top: 50%;
        transform: translateY(-50%);
        color: #6b7280;
    }

    .placeholder-text {
        color: #9ca3af;
        font-size: 13px;
        text-align: center;
        padding: 20px;
        margin: 0;
    }

    .chevron {
        transition: transform 0.2s;
        color: #6b7280;
        flex-shrink: 0;
    }

    .chevron.expanded {
        transform: rotate(90deg);
    }

    .card-editor {
        margin-bottom: 8px;
    }
    /* Copied from ConceptTemplateSlider.svelte for now, TODO: refactor later so CSS is not repeating
     I could probably refactor the whole TemplateCard into its own component too. */
    .template-card {
        background: white;
        border: 1px solid #e5e7eb;
        border-radius: 6px;
        padding: 12px;
        margin-bottom: 8px;
        cursor: move;
        transition: all 0.2s;
        user-select: none;
    }
    
    .template-card:hover {
        border-color: #d1d5db;
        box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
        transform: translateY(-1px);
    }
    
    .template-card.selected {
        border-color: #3b82f6;
        background-color: #eff6ff;
    }
    
    .template-card:active {
        opacity: 0.5;
    }
    
    .template-header {
        display: flex;
        align-items: center;
        gap: 8px;
        margin-bottom: 8px;
    }
    
    .template-name {
        font-weight: 500;
        color: #1f2937;
        font-size: 14px;
    }
    
    .template-description {
        font-size: 12px;
        color: #6b7280;
        margin: 0 0 8px 0;
        line-height: 1.4;
    }
    
    .template-meta {
        display: flex;
        justify-content: space-between;
        align-items: center;
        font-size: 11px;
        color: #9ca3af;
        margin-bottom: 8px;
    }

    .template-footer {
        display: flex;
        justify-content: space-between;
        color: #6b7280;
    }

    .date {
        font-size: 10px;
        align-self: flex-end;
        color: #9ca3af;
    }
    
    .template-actions {
        display: flex;
        gap: 4px;
        justify-content: flex-end;
    }
    
    .action-button {
        background: none;
        border: none;
        padding: 4px 8px;
        cursor: pointer;
        color: #6b7280;
        border-radius: 4px;
        transition: all 0.2s;
        display: flex;
        align-items: center;
        justify-content: center;
    }
    
    .action-button:hover {
        background-color: #f3f4f6;
        color: #1f2937;
    }
    
    .action-button.delete:hover {
        background-color: #fee2e2;
        color: #dc2626;
    }
</style>