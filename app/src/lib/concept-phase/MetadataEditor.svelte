<script lang="ts">
    import { stopPropagation, createBubbler } from 'svelte/legacy';

    const bubble = createBubbler();
    import { Plus, X } from 'lucide-svelte';
    import { capitalize, zip } from 'lodash';
    import DefinitionDropdown from './DefinitionDropdown.svelte';
    import DefinitionEditor from './DefinitionEditor.svelte';
    import { currentPartDefinitions, currentItemDefinitions } from '$lib/stores/stores.svelte';
    import type { Writable } from 'svelte/store';
    import type { SysMLDefinition } from '$lib/types/types';
    import { validateName } from '$lib/helpers';
    
    interface Props {
        metadata?: Array<{ key: string; value: string | null}>;
        type?: 'attribute' | 'part' | 'item';
        isDefinition?: boolean;
        onUpdate: (metadata: Array<{ key: string; value: string | null}>) => void;
    }

    let {
        metadata = [], 
        isDefinition = false,
        type = 'attribute',
        onUpdate 
    }: Props = $props();
    
    let newKey = $state('');
    let newValue: string | null = $state(null);
    let currentKey = $state('');
    let showAddForm = $state(false);
    let editingIndex: number | null = $state(null);
    let editKey = $state('');
    let editValue: string | null = $state(null);

    let isNameError = $state(false);

    let inputRef: HTMLInputElement | undefined = $state();
    let options = $derived.by(() => {
        const defs: SysMLDefinition[] = type === 'part' ? $currentPartDefinitions : $currentItemDefinitions;
        return defs.map( d => d.name );
    });

    const isValidDef = () => {
        if (type === 'attribute') return isDefinition;
        const defs = type === 'part' ? $currentPartDefinitions : $currentItemDefinitions;
        const currentDefExists = defs.map( d => d.name).includes(newKey);
        return isDefinition && currentDefExists;
    }

    const validateNameLocal = (name: string) => {
        const nameList = metadata.map( data => data.key)
        const isNameInvalid = validateName(currentKey, name, nameList);
        isNameError = isDefinition ? isNameInvalid || !isValidDef() : isNameInvalid;
    }

    function addMetadata() {
        // Manually set the newKey for part and item refs
        if (type !== 'attribute' && isDefinition) {
            newKey = inputRef?.value ?? '';
        }
        validateNameLocal(newKey);
        if (!isNameError && (newValue?.trim() || isValidDef())) {
            const updated = [...metadata, { key: newKey.trim(), value: newValue?.trim() ?? null }];
            currentKey = newKey;
            onUpdate(updated);
            newKey = '';
            newValue = null;
            showAddForm = false;
        }
    }
    
    function removeMetadata(index: number) {
        const updated = metadata.filter((_, i) => i !== index);
        onUpdate(updated);
    }
    
    function startEdit(index: number) {
        editingIndex = index;
        editKey = metadata[index].key;
        editValue = metadata[index].value;
    }
    
    function saveEdit() {
        validateNameLocal(editKey);
        if (editingIndex !== null && !isNameError && (editValue?.trim() || isDefinition)) {
            const updated = [...metadata];
            updated[editingIndex] = { key: editKey.trim(), value: editValue?.trim() ?? null };
            onUpdate(updated);
            editingIndex = null;
        }
    }
    
    function cancelEdit() {
        editingIndex = null;
        editKey = '';
        editValue = null;
    }
    
    function handleKeyDown(event: KeyboardEvent, action: 'add' | 'edit') {
        if (event.key === 'Enter') {
            event.preventDefault();
            if (action === 'add') {
                addMetadata();
            } else {
                saveEdit();
            }
        } else if (event.key === 'Escape') {
            event.preventDefault();
            if (action === 'add') {
                showAddForm = false;
                newKey = '';
                newValue = '';
            } else {
                cancelEdit();
            }
        }
    }
</script>

<div class={`metadata-section ${isDefinition ? 'definition-section' : 'node-section'}`}>
    <div class="metadata-header">
        <span class="metadata-title {isDefinition ? 'definition-fontsize' : 'node-fontsize'}">{capitalize(type) + 's'}</span>
        {#if !showAddForm}
            <button 
                type="button"
                class="add-button" 
                onclick={stopPropagation(() => showAddForm = true)}
                title="Add attribute"
            >
                <Plus size={isDefinition ? 16 : 12} />
            </button>
        {/if}
    </div>
    <!--svelte-ignore a11y_no_static_element_interactions-->
    <!--svelte-ignore a11y_click_events_have_key_events-->
    {#if metadata.length > 0 || showAddForm}
        <div class="metadata-items">
            {#each metadata as item, index}
                <div class="metadata-item">
                    {#if editingIndex === index && type === 'attribute'}
                        <div class="edit-form">
                            <input
                                class="metadata-input {isNameError ? 'error' : ''}"
                                type="text"
                                bind:value={editKey}
                                placeholder={type === 'attribute' ? 'Key' : 'Search existing ' + type + ' definitions...'}
                                onkeydown={(e) => handleKeyDown(e, 'edit')}
                                onclick={stopPropagation(bubble('click'))}
                                oninput={() => validateNameLocal(editKey)}
                                autofocus
                            />
                            {#if !isDefinition}
                                <input
                                    class="metadata-input"
                                    type="text"
                                    bind:value={editValue}
                                    placeholder="Value"
                                    onkeydown={(e) => handleKeyDown(e, 'edit')}
                                    onclick={stopPropagation(bubble('click'))}
                                />
                            {/if}
                            <div class="edit-actions">
                                <button
                                    type="button"
                                    class="save-button"
                                    onclick={stopPropagation(saveEdit)}
                                    title="Save"
                                >
                                    ✓
                                </button>
                                <button
                                    type="button"
                                    class="cancel-button"
                                    onclick={stopPropagation(cancelEdit)}
                                    title="Cancel"
                                >
                                    ✗
                                </button>
                            </div>
                        </div>
                    {:else}
                        <div 
                            class="metadata-content"
                            onclick={stopPropagation(() => startEdit(index))}
                            ondblclick={stopPropagation(bubble('dblclick'))}
                        >
                            <span class="metadata-key">{item.key}{!isDefinition ? ':' : ''}</span>
                            <span class="metadata-value">{item.value}</span>
                        </div>
                        <button
                            type="button"
                            class="remove-button"
                            onclick={stopPropagation(() => removeMetadata(index))}
                            title="Remove"
                        >
                            <X size={10} />
                        </button>
                    {/if}
                </div>
            {/each}
            
            {#if showAddForm}
                <div class = "combobox">
                    <div class="add-form">
                        <input
                            bind:this={inputRef}
                            class="metadata-input {isNameError ? 'error' : ''}"
                            type="text"
                            bind:value={newKey}
                            placeholder={type === 'attribute' ? 'Key' : 'Search existing ' + type + ' definitions...'}
                            onkeydown={(e) => handleKeyDown(e, 'add')}
                            onclick={stopPropagation(bubble('click'))}
                            oninput={() => validateNameLocal(newKey)}
                            autofocus
                        />
                        {#if !isDefinition}
                            <input
                                class="metadata-input"
                                type="text"
                                bind:value={newValue}
                                placeholder="Value"
                                onkeydown={(e) => handleKeyDown(e, 'add')}
                                onclick={stopPropagation(bubble('click'))}
                            />
                        {/if}
                        <div class="add-actions">
                            <button
                                type="button"
                                class="save-button"
                                onclick={stopPropagation(addMetadata)}
                                title="Add"
                            >
                                ✓
                            </button>
                            <button
                                type="button"
                                class="cancel-button"
                                onclick={stopPropagation(() => {
                                    showAddForm = false;
                                    newKey = '';
                                    newValue = '';
                                })}
                                title="Cancel"
                            >
                                ✗
                            </button>
                        </div>
                    </div>
                        {#if type !== 'attribute'}
                            <DefinitionDropdown {type} inputElement={inputRef} {options}/>
                        {/if}
                </div>
            {/if}
        </div>
    {/if}
</div>

<style>
    .combobox {
        position: relative;
        display: flex;
        flex-direction: column;
    }

    .metadata-section {
        border-top: 1px solid #e5e7eb;
    }

    .node-section {
        margin-top: 8px;
        padding-top: 8px;
    }
    
    .definition-section {
        margin-top: 4px;
        padding-top: 4px;
    }

    .metadata-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
    }
    
    .metadata-title {
        font-weight: 600;
        color: #6b7280;
    }

    .node-fontsize {
        font-size: 11px;
    }

    .definition-fontsize {
        font-size: 12px;
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
    
    .metadata-items {
        display: flex;
        flex-direction: column;
        padding-top: 4px;
        gap: 2px;
    }
    
    .metadata-item {
        display: flex;
        align-items: center;
        gap: 4px;
        font-size: 10px;
    }
    
    .metadata-content {
        flex: 1;
        display: flex;
        gap: 4px;
        padding: 2px 4px;
        border-radius: 3px;
        cursor: pointer;
        transition: background-color 0.2s;
    }
    
    .metadata-content:hover {
        background-color: #f3f4f6;
    }
    
    .metadata-key {
        font-weight: 500;
        color: #6b7280;
    }
    
    .metadata-value {
        color: #111827;
        word-break: break-word;
    }
    
    .remove-button {
        background: none;
        border: none;
        padding: 2px;
        cursor: pointer;
        color: #d1d5db;
        border-radius: 2px;
        transition: all 0.2s;
        display: flex;
        align-items: center;
        justify-content: center;
        opacity: 0;
    }
    
    .metadata-item:hover .remove-button {
        opacity: 1;
    }
    
    .remove-button:hover {
        background-color: #fee2e2;
        color: #dc2626;
    }
    
    .add-form,
    .edit-form {
        display: flex;
        gap: 3px;
        width: 100%;
    }
    
    .metadata-input {
        border: 1px solid #3b82f6;
        border-radius: 3px;
        padding: 2px 4px;
        font-size: 10px;
        font-family: inherit;
        color: #111827;
        background: white;
        outline: none;
        flex: 1;
        min-width: 0;
    }
    
    .metadata-input:focus {
        box-shadow: 0 0 0 2px rgba(59, 130, 246, 0.2);
    }
    
    .metadata-input::placeholder {
        color: #9ca3af;
    }

    .metadata-input.error {
        border-color: var(--main-error-color);
        box-shadow: 0 0 0 2px rgba(227, 97, 97, 0.1)
    }
    
    .add-actions,
    .edit-actions {
        display: flex;
        gap: 2px;
    }
    
    .save-button,
    .cancel-button {
        background: none;
        border: none;
        padding: 2px 6px;
        cursor: pointer;
        border-radius: 2px;
        transition: all 0.2s;
        font-size: 12px;
        font-weight: 500;
    }
    
    .save-button {
        color: #059669;
    }
    
    .save-button:hover {
        background-color: #d1fae5;
    }
    
    .cancel-button {
        color: #dc2626;
    }
    
    .cancel-button:hover {
        background-color: #fee2e2;
    }
</style>