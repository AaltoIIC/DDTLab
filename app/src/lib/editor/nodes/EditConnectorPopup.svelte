<script lang="ts">
    import { run } from 'svelte/legacy';

    import {
        type Node
    } from '@xyflow/svelte';
    import * as Select from "$lib/components/ui/select";
    import { Input } from "$lib/components/ui/input";
    import VSSoSelect from './VSSoSelect.svelte';
    import { addToHistory, currentNodes, customDataTypes } from '$lib/stores/stores.svelte';
    import _ from 'lodash';
    import { onMount } from 'svelte';
    import {
        isNameValid,
        generateName,
        selectNode
    } from '$lib/helpers';

    interface Props {
        elementName: string;
        isOpen?: boolean;
        connectorName?: string | null;
        type?: 'input' | 'output' | null;
        trigger?: HTMLElement | null;
    }

    let {
        elementName,
        isOpen = $bindable(false),
        connectorName = null,
        type = null,
        trigger = null
    }: Props = $props();

    let isExistingConnector = connectorName !== null;

    if (connectorName === null && type === null) {
        throw new Error("Either `connectorName` or `type` must be defined.");
    }

    // Function to generate a new unique connector name
    const nameNewConnector = () => {
        const connectorNames = ($currentNodes.find((node) => node.id === elementName)?.data.element as any)
            .connectors.map((connector: any) => connector.name);
        return generateName('Connector', connectorNames);
    }

    // Handle new connector parameters
    let newConnectorName: string = $state("");
    let newConnectorClass: string | null = $state(null);
    let newConnectorDataType: { value: string, label: string } | undefined = $state();
    let newConnectorUnit: { value: string, label: string } | undefined = $state();
    if (isExistingConnector) {
        const connector = ($currentNodes.find((node) => node.id === elementName)?.data as any)
            .element.connectors.find((connector: any) => connector.name === connectorName)
        newConnectorName = connector.name;
        newConnectorClass = connector.class;
        newConnectorDataType = { value: "no-dt", label: "No Data Type" };
        newConnectorUnit = { value: "-", label: "-" };
    } else {
        newConnectorName = nameNewConnector();
        newConnectorClass = null;
        newConnectorDataType = { value: "no-dt", label: "No Data Type" };
        newConnectorUnit = { value: "-", label: "-" };
    }
    
    let initialized = $state(false);

    run(() => {
        if (isOpen && !initialized) {
            selectNode(elementName);
            if (!isExistingConnector) {
                newConnectorName = nameNewConnector();
                newConnectorClass = null;
                newConnectorDataType = { value: "no-dt", label: "No Data Type" };
                newConnectorUnit = { value: "-", label: "-" };
            }
            initialized = true;
        }
        if (!isOpen) initialized = false;
    });

    let isNameError = $state(false);
    const validateName = () => {
        const nodeData = $currentNodes.find((node) => node.id === elementName)?.data;
        const isNameTaken = (nodeData?.element as any).connectors.filter((c: any) => c.name !== newConnectorName)
            .some((c: any) => (
                c.name.replace(/\s+/g, '').toLowerCase() === newConnectorName.replace(/\s+/g, '').toLowerCase()
            ));

        isNameError = !isNameValid(newConnectorName) || isNameTaken;
    }

    // Custom data type dialog
    let isAddingCustomType = $state(false);
    let newCustomTypeName = $state("");
    let customTypeError = $state(false);

    const validateCustomTypeName = () => {
        const allTypes = ['real', 'integer', 'string', 'binary', 'boolean', 'enumeration', 'no-dt', ...$customDataTypes];
        customTypeError = !newCustomTypeName.trim() ||
                         allTypes.some(t => t.toLowerCase() === newCustomTypeName.trim().toLowerCase());
    }

    const addCustomDataType = () => {
        const typeName = newCustomTypeName.trim();
        if (!typeName || customTypeError) return;

        customDataTypes.update(types => {
            if (!types.includes(typeName)) {
                return [...types, typeName];
            }
            return types;
        });

        // Set the newly created type as selected
        newConnectorDataType = { value: typeName, label: typeName };

        // Reset and close dialog
        newCustomTypeName = "";
        customTypeError = false;
        isAddingCustomType = false;
    }

    const openCustomTypeDialog = () => {
        isAddingCustomType = true;
        newCustomTypeName = "";
        customTypeError = false;
    }

    const addConnector = () => {
        currentNodes.update((nodes) => {
            const nodeIndex = nodes.findIndex((node) => node.id === elementName);
            const newNodes: Node[] = [...nodes];

            newNodes[nodeIndex].data = _.cloneDeep(newNodes[nodeIndex].data);
            (newNodes[nodeIndex].data.element as any).connectors.push(
                {
                    name: newConnectorName,
                    class: newConnectorClass,
                    type: type,
                    dataType: newConnectorDataType?.value,
                    unit: newConnectorUnit?.value
                }
            );
            return newNodes;
        });
        addToHistory();

        isOpen = false;
    }

    const editConnector = () => {
        currentNodes.update((nodes: Node[]) => {
            const newNodes = [...nodes];
            const connector = (newNodes.find((node) => node.id === elementName)?.data as any)
                .element.connectors.find((connector: any) => connector.name === connectorName)
            
            connector.name = newConnectorName;
            connector.class = newConnectorClass;
            connector.dataType = newConnectorDataType?.value;
            connector.unit = newConnectorUnit?.value;
            
            return newNodes;
        });
        addToHistory();

        isOpen = false;
    }

    let onHover: boolean = $state(false);
    onMount(() => {
        trigger?.addEventListener('pointerdown', () => {
            isOpen = true;
        });

        document.addEventListener('pointerdown', (e: Event) => {
            const eventTarget = e.target as HTMLElement;
            if (!onHover &&
                !trigger?.contains(eventTarget) &&
                eventTarget !== trigger &&
                eventTarget.getAttribute('role') !== 'option') {
                isOpen = false;
            }
        });

        const flowEditor = document.querySelector('.svelte-flow__pane');
        if (flowEditor) {
            flowEditor.addEventListener('wheel', () => {
                if (!onHover) {
                    isOpen = false;
                }
            });
        }
    });
</script>
<!-- svelte-ignore a11y_no_static_element_interactions -->
<div class="main-add-layover {isOpen ? 'open' : ''} shadow-md"
    onmouseenter={() => {selectNode(elementName); onHover = true;}}
    onmouseleave={() => {onHover = false;}}>
    <div class="connector-param">
        <span>Name:</span>
        <Input class="w-[142px] h-8 {isNameError ? 'error-outline' : ''}"
            bind:value={newConnectorName}
            on:input={validateName}
        />
    </div>
    <div class="connector-param">
        <span>Variable:</span>
        <div class="w-[142px] h-8">
            <VSSoSelect
                id={elementName}
                type="connector"
                bind:currentClass={newConnectorClass}
            />
        </div>
    </div>
    <div class="connector-param">
        <span>Data Type:</span>
        <Select.Root bind:selected={newConnectorDataType}>
            <Select.Trigger class="w-[142px] h-8 px-2.5">
                <Select.Value />
            </Select.Trigger>
            <Select.Content>
                <!-- Add Custom Type Button -->
                <button class="add-custom-type-btn" onclick={openCustomTypeDialog}>
                    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                        <line x1="12" y1="5" x2="12" y2="19"></line>
                        <line x1="5" y1="12" x2="19" y2="12"></line>
                    </svg>
                    Add Custom Type
                </button>
                <div class="separator"></div>

                <!-- Default Types -->
                <Select.Item value="real">Real</Select.Item>
                <Select.Item value="integer">Integer</Select.Item>
                <Select.Item value="string">String</Select.Item>
                <Select.Item value="binary">Binary</Select.Item>
                <Select.Item value="boolean">Boolean</Select.Item>
                <Select.Item value="enumeration">Enumeration</Select.Item>
                <Select.Item value="no-dt">No Data Type</Select.Item>

                <!-- Custom Types -->
                {#if $customDataTypes.length > 0}
                    <div class="separator"></div>
                    <div class="custom-types-label">Custom Types</div>
                    {#each $customDataTypes as customType}
                        <Select.Item value={customType}>{customType}</Select.Item>
                    {/each}
                {/if}
            </Select.Content>
        </Select.Root>
    </div>
    <div class="connector-param">
        <span>Unit:</span>
        <Select.Root bind:selected={newConnectorUnit}>
            <Select.Trigger class="w-[142px] h-8 px-2.5">
                <Select.Value placeholder="-" />
            </Select.Trigger>
            <Select.Content>
                <Select.Item value="none">-</Select.Item>
                <Select.Item value="a">A</Select.Item>
                <Select.Item value="cd">cd</Select.Item>
                <Select.Item value="k">K</Select.Item>
                <Select.Item value="kg">kg</Select.Item>
                <Select.Item value="m">m</Select.Item>
                <Select.Item value="mol">mol</Select.Item>
                <Select.Item value="rad">rad</Select.Item>
                <Select.Item value="s">s</Select.Item>
            </Select.Content>
        </Select.Root>
    </div>
    <button class="done-btn {(isNameError || !newConnectorClass) ? 'inactive' : ''}"
        onclick={isExistingConnector ? editConnector : addConnector}>
        {
            (
                isExistingConnector ? 'Edit Connector' : `Add ${type === 'input' ? 'Input' : 'Output'}`
            )
        }
    </button>
</div>

<!-- Custom Data Type Dialog -->
{#if isAddingCustomType}
    <!-- svelte-ignore a11y_no_static_element_interactions -->
    <div class="custom-type-dialog-overlay" onclick={() => isAddingCustomType = false}>
        <!-- svelte-ignore a11y_no_static_element_interactions -->
        <div class="custom-type-dialog" onclick={(e) => e.stopPropagation()}>
            <h3>Add Custom Data Type</h3>
            <div class="dialog-content">
                <label>
                    Type Name:
                    <Input
                        class="h-8 {customTypeError ? 'error-outline' : ''}"
                        bind:value={newCustomTypeName}
                        on:input={validateCustomTypeName}
                        placeholder="e.g., voltage, temperature"
                    />
                </label>
                {#if customTypeError}
                    <span class="error-message">Type name is invalid or already exists</span>
                {/if}
            </div>
            <div class="dialog-actions">
                <button class="cancel-btn" onclick={() => isAddingCustomType = false}>
                    Cancel
                </button>
                <button
                    class="add-btn {customTypeError || !newCustomTypeName.trim() ? 'inactive' : ''}"
                    onclick={addCustomDataType}>
                    Add Type
                </button>
            </div>
        </div>
    </div>
{/if}
<style>
    .connector-param {
        display: flex;
        align-items: center;
        justify-content: space-between;
        width: 100%;
        margin: 0 6px;
        width: calc(100% - 12px);
        padding: 8px 12px;
        box-sizing: border-box;
        border-radius: var(--main-border-radius);
        font-size: 14px;
        color: black;
    }
    .connector-param:nth-last-of-type(2n - 1) {
        background-color: var(--list-dark-color);
    }
    .main-add-layover {
        position: absolute;
        width: 264px;
        top: 100%;
        left: 0;
        margin-top: 6px;
        background: white;
        border-radius: var(--main-border-radius);
        border: solid 1px rgba(0, 0, 0, 0.1);
        z-index: 1000;
        opacity: 0;
        pointer-events: none;
        transition: opacity .3s;
        padding-top: 8px;
    }
    .main-add-layover.open {
        opacity: 1;
        pointer-events: all;
    }
    .done-btn {
        width: calc(100% - 12px);
        padding: 8px;
        background-color: var(--main-dark-color);
        color: white;
        border: none;
        font-family: 'Inter', sans-serif;
        font-size: 12px;
        cursor: pointer;
        border-radius: 50px;
        margin: 10px 6px 6px 6px;
    }
    .done-btn.inactive {
        cursor: initial;
        opacity: 0.8;
        pointer-events: none;
    }
    .done-btn:hover {
        filter: brightness(1.05);
    }

    /* Custom Data Type Styles */
    .add-custom-type-btn {
        width: 100%;
        display: flex;
        align-items: center;
        gap: 8px;
        padding: 6px 12px;
        background: none;
        border: none;
        cursor: pointer;
        font-size: 13px;
        color: var(--main-dark-color);
        transition: background-color 0.15s;
        font-family: 'Inter', sans-serif;
    }
    .add-custom-type-btn:hover {
        background-color: rgba(0, 0, 0, 0.05);
    }
    .separator {
        height: 1px;
        background-color: rgba(0, 0, 0, 0.1);
        margin: 4px 0;
    }
    .custom-types-label {
        padding: 6px 12px;
        font-size: 11px;
        color: rgba(0, 0, 0, 0.5);
        font-weight: 600;
        text-transform: uppercase;
        letter-spacing: 0.5px;
    }

    /* Custom Type Dialog Styles */
    .custom-type-dialog-overlay {
        position: fixed;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        background-color: rgba(0, 0, 0, 0.5);
        display: flex;
        align-items: center;
        justify-content: center;
        z-index: 10000;
    }
    .custom-type-dialog {
        background: white;
        border-radius: 8px;
        padding: 20px;
        width: 400px;
        max-width: 90vw;
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
    }
    .custom-type-dialog h3 {
        margin: 0 0 16px 0;
        font-size: 18px;
        font-weight: 600;
        color: var(--main-dark-color);
    }
    .dialog-content {
        margin-bottom: 20px;
    }
    .dialog-content label {
        display: block;
        font-size: 14px;
        color: rgba(0, 0, 0, 0.7);
        margin-bottom: 8px;
    }
    .dialog-content input {
        margin-top: 8px;
        width: 100%;
    }
    .error-message {
        display: block;
        color: #ef4444;
        font-size: 12px;
        margin-top: 6px;
    }
    .dialog-actions {
        display: flex;
        gap: 8px;
        justify-content: flex-end;
    }
    .cancel-btn, .add-btn {
        padding: 8px 16px;
        border-radius: 6px;
        font-size: 14px;
        cursor: pointer;
        font-family: 'Inter', sans-serif;
        transition: all 0.15s;
    }
    .cancel-btn {
        background: white;
        border: 1px solid rgba(0, 0, 0, 0.2);
        color: rgba(0, 0, 0, 0.7);
    }
    .cancel-btn:hover {
        background: rgba(0, 0, 0, 0.05);
    }
    .add-btn {
        background: var(--main-dark-color);
        border: none;
        color: white;
    }
    .add-btn:hover {
        filter: brightness(1.1);
    }
    .add-btn.inactive {
        opacity: 0.5;
        cursor: not-allowed;
        pointer-events: none;
    }
</style>