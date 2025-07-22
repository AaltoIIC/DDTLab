<script lang="ts">
    import { type ItemDefinition, type PartDefinition } from '$lib/types/types'
    import { currentPartDefinitions, currentItemDefinitions, addToHistory } from '$lib/stores/stores.svelte'
    import { generateId, validateName } from '$lib/helpers';
    import { ChevronRight, X, FileText, Trash2, Download, Upload, Copy, Search, CirclePlus, Plus } from 'lucide-svelte';
    import { slide, fade } from 'svelte/transition';
    import { capitalize } from 'lodash';

    interface Props {
        type: 'part' | 'item';
        isOpen?: boolean;
        onClose: () => void;
    }

    let { type, isOpen = false, onClose }: Props = $props();

    let currentDefs = $derived.by(() => {
        return type === 'part' ? currentPartDefinitions : currentItemDefinitions;
    });

    let newDefMenuOpen = $state(false);
    let defsExpanded = $state(false);
    let isDragging = $state(false);
    let searchTerm = $state('');

    let description = $state(''); // TODO: Implement description adding

    let inputName = $state('');
    let isNameError = $state(false);

    const validateNameLocal = () => {
        isNameError = validateName('', inputName, $currentDefs.map( p => p.name ));
    }
    function handleImport() {} // TODO: Implement eventually

    function addDefinition() {
        validateNameLocal();
        if (!isNameError) {
            const baseDef = {
                id: generateId($currentDefs.map( p => p.id )),
                name: inputName,
                description: description,
                createdAt: Date.now(),
                updatedAt: Date.now(),
                data: {
                    attributes: [],
                    itemRefs: [],
                    nodes: [],
                    edges: [],
                }
            };

            if (type === 'part') {
                const newDef: PartDefinition = {
                    ...baseDef,
                    type: 'part',
                    data: {
                        ...baseDef.data,
                        partRefs: [],
                    }
                }
                currentPartDefinitions.update(defs => [...defs, newDef]);
            }
            else {
                const newDef: ItemDefinition = {
                    ...baseDef,
                    type: 'item'
                }
                currentItemDefinitions.update(defs => [...defs, newDef]);
            }

            addToHistory(); 
            closeNewDef();
        }
    }

    function closeNewDef() {
        inputName = '';
        description = '';
        newDefMenuOpen = false;
    }
</script>

<!-- svelte-ignore a11y_click_events_have_key_events -->
<!-- svelte-ignore a11y_no_static_element_interactions -->
{#if isOpen}
    <div
        class="slider-overlay {isDragging ? 'dragging' : ''}"
        onclick={() => {newDefMenuOpen = false; onClose()}}
        transition:fade={{ duration:200 }}
    ></div>
    <div class="slider-panel" transition:slide={{ duration: 300, axis: 'x' }}>
        <div class="slider-header">
            <h2 class="slider-title">{capitalize(type)} Definitions</h2>
            <div class="header-actions">
                <button class="icon-button" onclick={handleImport} title="Import template">
                    <Upload size={18} />
                </button>
                <button class="close-button" onclick={onClose}>
                    <X size={20} />
                </button>
            </div>
        </div>

        <div class="slider-content">
            <div class="new-definition">
                {#if !newDefMenuOpen}
                        <button class="library-header" onclick={() => newDefMenuOpen = !newDefMenuOpen}>
                            <span>
                                <CirclePlus size={18} />
                            </span>
                            <span>Define a New {capitalize(type)}</span>
                        </button>
                {:else}
                    <div>
                        <div class="library-content" transition:slide={{ duration: 200}}>
                            <div class="new-definition-title">
                                New {type} definition
                            </div>
                            <form class="definition-form">
                                <div class="name-field">
                                    <label for="nameinput" class="name-label">Name:</label>
                                    <input
                                        id="nameinput"
                                        class="name-input {isNameError ? 'error' : ''}"
                                        type="text"
                                        bind:value={inputName}
                                        oninput={validateNameLocal}
                                    />
                                </div>
                                <div class="information-field">
                                    <span class="information-label">Attributes</span>
                                    <span class="add-button"><Plus size={16}/></span>
                                </div>
                                <div class="information-field">
                                    <span class="information-label">Parts</span>
                                    <span class="add-button"><Plus size={16}/></span>
                                </div>
                                <div class="information-field">
                                    <span class="information-label">Items</span>
                                    <span class="add-button"><Plus size={16}/></span>
                                </div>
                                <div class="action-buttons">
                                    <button type="button" class="action-button" onclick={closeNewDef}>Cancel</button>
                                    <button type="button" class="action-button" onclick={addDefinition}>Add</button>
                                </div>
                            </form>
                        </div>
                    </div>
                {/if}
            </div>
            <div class="library-section">
                <button class="library-header" onclick={() => defsExpanded = !defsExpanded}>
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
                        {#if $currentDefs.length > 0}
                            <ul>
                                {#each $currentDefs as definition}
                                    <li>{definition.name}</li>
                                {/each}
                            </ul>
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

    .new-definition-title {
        font-weight: 600;
        font-size: 16px;
        color: #4b5563;
        padding-bottom: 12px;
    }

    .definition-form {
        display: flex;
        flex-direction: column;
        gap: 8px;
    }

    .name-field {
        display: flex;
        gap: 12px;
        font-size: 14px;
        align-items: center;
    }

    .name-label {
        font-weight: 500;
    }

    .name-input {
        width: 100%;
        padding: 2px 2px 2px 4px;
        border: 1px solid #e5e7eb;
        border-radius: 6px;
        font-weight: 400;
        outline: none;
        transition: all 0.2s;
    }

    .name-input:focus {
        border-color: #3b82f6;
        box-shadow: 0 0 0 2px rgba(59, 130, 246, 0.1);
    }

    .name-input.error {
        border-color: var(--main-error-color);
        box-shadow: 0 0 0 2px rgba(227, 97, 97, 0.1)
    }

    .information-field {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-top: 4px;
        padding-top: 4px;
        border-top: 1px solid #e5e7eb;
    }

    .information-label {
        font-size: 12px;
        font-weight: 600;
        color: #6b7280;
    }

    .add-button {
        background: none;
        border: none;
        padding: 2px;
        cursor: pointer;
        color: #9ca3af;
        border-radius: 3px;
        transition: all 0.2s;
    }

    .add-button:hover {
        background-color: #e0f2fe;
        color: #0284c7;
    }

    .action-button {
        flex: 1;
        padding: 6px;
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

    .action-buttons {
        display: flex;
        gap: 8px;
    }
</style>