<script lang="ts">
    import { type ItemDefinition, type PartDefinition, type SysMLDefinition } from '$lib/types/types'
    import { type Writable } from 'svelte/store';
    import { currentPartDefinitions, currentItemDefinitions, addToHistory } from '$lib/stores/stores.svelte'
    import MetadataEditor from "./MetadataEditor.svelte";
    import { generateId, validateName } from '$lib/helpers';
    import { slide } from 'svelte/transition';
    import _, { capitalize, update } from 'lodash';
    import type { Node, Edge } from '@xyflow/svelte';
    import type { Port } from './interfaces';
    import { generatePortId } from './nodes/portUtils';

    interface Props {
        type: 'part' | 'item';
        currentDefs: Writable<SysMLDefinition[]>
        isOpen: boolean;
        editDef?: SysMLDefinition; // If definition is not given, we are in create mode
    }

    let { type, isOpen=$bindable(), currentDefs, editDef }: Props = $props();

    let description = $state(''); // TODO: Implement description adding

    let currentName = $state(editDef?.name ?? '');
    let inputName = $state(currentName);
    let isNameError = $state(false);

     const toMetadata = (data: SysMLDefinition[] | string[] | undefined) => {
        return data?.map( n => {
            const key = typeof n === 'string' ? n : ('name' in n ? n.name : '');
            return { key, value: null};
        }) ?? [];
    };

    let attributes: Array<{key: string, value: null}> = $state(toMetadata(editDef?.data.attributes));

    let partMetadata: Array<{key: string, value: null}> = $state(toMetadata(editDef?.data.partRefs ?? [])); 
    let partRefs: PartDefinition[] = $derived(partMetadata.map( data => {
        return $currentPartDefinitions.find( p => p.name === data.key);
    }).filter( ref => ref !== undefined ));

    let itemMetadata: Array<{key: string, value: null}> = $state(toMetadata(editDef?.data.itemRefs));
    let itemRefs: ItemDefinition[] = $derived(itemMetadata.map( data => {
        return $currentItemDefinitions.find( it => it.name === data.key);
    }).filter( ref => ref !== undefined ));

    const validateNameLocal = () => {
        isNameError = validateName(currentName, inputName, $currentDefs.map( p => p.name ));
    }

    function createData(definition: SysMLDefinition): {nodes: Node[], edges: Edge[]} {

        const inputPort: Port = {
            id: generatePortId(),
            name: "ref_input",
            interfaceType: undefined
        }

        const outputPort: Port = {
            id: generatePortId(),
            name: "ref_output",
            interfaceType: undefined
        }

        function defToNode(def: SysMLDefinition, initialPos: {x: number, y: number}, inputs: Port[], outputs: Port[]): Node {
            return {
                id: `${type}-${Math.random().toString(36).substring(2, 9).toUpperCase()}`,
                type: def.type,
                position: initialPos,
                data: {
                    declaredName: `New "${def.name}" ${capitalize(def.type)}`,
                    definition: def.name,
                    comment: '',
                    id: Math.random().toString(36).substring(2, 9).toUpperCase(),
                    orderStatus: 'Not Ordered',
                    metadata: toMetadata(def.data.attributes),
                    nodes: [],
                    edges: [],
                    inputs,
                    outputs
                }
            }
        }

        const mainNode = defToNode(
            definition, 
            {x: 0, y: 0},
            partRefs.length ? [inputPort] : [],
            itemRefs.length ? [outputPort] : []
        );

        const partNodes = partRefs.map( (def, index) => {
            return defToNode(
                def, 
                {x: -400, y: -200 + index * 200},
                [],
                [outputPort]
            );
        });
        const partEdges: Edge[] = partRefs.map( (_, index) => {
            const partNode = partNodes[index];
            return {
                id: `${partNode.id}-${mainNode.id}-${Date.now()}`,
                source: partNode.id,
                target: mainNode.id,
                sourceHandle: `${partNode.id}-output-ref_output`,
                targetHandle: `${mainNode.id}-input-ref_input`,
                type: 'default',
                data: {
                    compatibility: 'direct',
                    connectionType: 'flow'
                }
            }
        });


        const itemNodes = itemRefs.map( (def, index) => {
            return defToNode(
                def, 
                {x: 400, y: -200 + index * 200},
                [inputPort],
                []
            );
        });
        const itemEdges: Edge[] = itemRefs.map( (_, index) => {
            const itemNode = itemNodes[index];
            return {
                id: `${mainNode.id}-${itemNode.id}-${Date.now()}`,
                source: mainNode.id,
                target: itemNode.id,
                sourceHandle: `${mainNode.id}-output-ref_output`,
                targetHandle: `${itemNode.id}-input-ref_input`,
                type: 'default',
                data: {
                    compatibility: 'direct',
                    connectionType: 'flow'
                }
            }
        });

        const nodes = [mainNode, ...partNodes, ...itemNodes];
        const edges = [...partEdges, ...itemEdges];
        
        return {nodes, edges};
    }

    function handleAddDef() {
        validateNameLocal();
        if (!isNameError) {
            const baseDef = {
                id: generateId($currentDefs.map( p => p.id )),
                name: inputName,
                type,
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
            
            let newDef: SysMLDefinition 
            if (type === 'part') {
                newDef = {
                    ...baseDef,
                    type: 'part',
                    data: {
                        ...baseDef.data,
                        partRefs
                    }
                }
            }
            else {
                newDef = {
                    ...baseDef,
                    type: 'item'
                }
            }
            const data = createData(newDef);
            newDef.data.nodes = data.nodes;
            newDef.data.edges = data.edges;

            currentDefs.update(defs => [...defs, newDef]);
            console.log(JSON.stringify(newDef, null, 2));
            
            addToHistory(); 
            handleCloseDef();
        }
    }

    function handleEditDef() {
        validateNameLocal();
        if (editDef && !isNameError) {
            const defIndex = $currentDefs.findIndex(def => editDef.id === def.id)
            const updatedDefs = [ ...$currentDefs ]

            const baseDef = {
                ...editDef,
                name: inputName,
                description: description,
                updatedAt: new Date().toISOString(),
                data: {
                    ...editDef.data,
                    attributes: attributes.map(attr => attr.key),
                    partRefs: null,
                    itemRefs,
                    nodes: [],
                    edges: [],
                }
            };
            
            let editedDef: SysMLDefinition
            if (type === 'part') {
                editedDef = {
                    ...baseDef,
                    type: 'part',
                    data: {
                        ...baseDef.data,
                        partRefs
                    }
                }
            }
            else {
                editedDef = {
                    ...baseDef,
                    type: 'item',
                }
            }

            const data = createData(editedDef);
            editedDef.data.nodes = data.nodes;
            editedDef.data.edges = data.edges;

            updatedDefs[defIndex] = editedDef;
            console.log(JSON.stringify(editedDef, null, 2));            
            currentDefs.update(_ => updatedDefs)

            addToHistory(); 
            handleCloseDef();
        }
    }

    function handleCloseDef() {
        inputName = '';
        description = '';
        isOpen = false;
    }
</script>

<div class="library-content" transition:slide={{ duration: 200}}>
    <div class="definition-title">
        {editDef ? 'Edit' : 'New'} {type} definition
    </div>
    <form 
        class="definition-form"
        autocomplete="off"
    >
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
            <button type="button" class="action-button" onclick={handleCloseDef}>Cancel</button>
            {#if editDef}
                <button type="button" class="action-button" onclick={handleEditDef}>Accept</button>
            {:else}
                <button type="button" class="action-button" onclick={handleAddDef}>Add</button>
            {/if}
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