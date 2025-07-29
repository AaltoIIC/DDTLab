<script lang="ts">
    import { type ItemDefinition, type PartDefinition, type SysMLDefinition } from '$lib/types/types'
    import { type Writable } from 'svelte/store';
    import { currentPartDefinitions, currentItemDefinitions, addToHistory } from '$lib/stores/stores.svelte'
    import MetadataEditor from "./MetadataEditor.svelte";
    import { generateId, validateName } from '$lib/helpers';
    import { slide } from 'svelte/transition';

    interface Props {
        type: 'part' | 'item';
        currentDefs: Writable<SysMLDefinition[]>
        isOpen: boolean;
        isEdit?: boolean;
    }

    let { type, isOpen=$bindable(), currentDefs, isEdit=false }: Props = $props();

    let description = $state(''); // TODO: Implement description adding

    let inputName = $state('');
    let isNameError = $state(false);

    let attributes: Array<{key: string, value: null}> = $state([]);

    // let partRefs: PartDefinition[] = $state([])
    // let partMetadata: Array<{key: string, value: null}> = $derived(partRefs.map( p => {
    //     return {key: p.name, value: null};
    // }));

    let partMetadata: Array<{key: string, value: null}> = $state([]);
    let partRefs: PartDefinition[] = $derived(partMetadata.map( data => {
        return $currentPartDefinitions.find( p => p.name === data.key);
    }).filter( ref => ref !== undefined ));

    let itemMetadata: Array<{key: string, value: null}> = $state([]);
    let itemRefs: ItemDefinition[] = $derived(itemMetadata.map( data => {
        return $currentItemDefinitions.find( it => it.name === data.key);
    }).filter( ref => ref !== undefined ));

    const validateNameLocal = () => {
        isNameError = validateName('', inputName, $currentDefs.map( p => p.name ));
    }

    function addDefinition() {
        validateNameLocal();
        if (!isNameError) {
            const baseDef = {
                id: generateId($currentDefs.map( p => p.id )),
                name: inputName,
                type: type,
                description: description,
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString(),
                data: {
                    attributes: attributes.map(attr => attr.key),
                    partRefs: null,
                    itemRefs,
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
                        partRefs,
                    }
                }
                currentPartDefinitions.update(defs => [...defs, newDef]);
                console.log(JSON.stringify(newDef));
            }
            else {
                const newDef: ItemDefinition = {
                    ...baseDef,
                    type: 'item'
                }
                currentItemDefinitions.update(defs => [...defs, newDef]);
                console.log(JSON.stringify(newDef));
            }

            addToHistory(); 
            closeNewDef();
        }
    }

    function closeNewDef() {
        inputName = '';
        description = '';
        isOpen = false;
    }
</script>

<div class="library-content" transition:slide={{ duration: 200}}>
    <div class="definition-title">
        {isEdit ? 'Edit' : 'New'} {type} definition
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
        <MetadataEditor 
            metadata={attributes} 
            isDefinition={true} 
            onUpdate={(a: any) => {attributes = a}} 
            type='attribute'
        />
        {#if type === 'part'}
            <MetadataEditor 
                metadata={partMetadata}
                isDefinition={true} 
                onUpdate={(parts: any) => {partMetadata = parts}} 
                type='part' 
                />
        {/if}
        <MetadataEditor
            metadata={itemMetadata}
            isDefinition={true} 
            onUpdate={(items: any) => {itemMetadata = items}} 
            type='item'
            />
        <div class="action-buttons">
            <button type="button" class="action-button" onclick={closeNewDef}>Cancel</button>
            <button type="button" class="action-button" onclick={addDefinition}>Add</button>
        </div>
    </form>
</div>

<style>
    .library-content {
        padding: 12px;
        margin-top: 8px;
        background: #fafbfc;
        border: 1px solid #e5e7eb;
        border-radius: 6px;
    }

    .definition-title {
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

    .action-buttons {
        display: flex;
        gap: 8px;
    }
</style>