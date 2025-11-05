<script lang="ts">
    import { run } from 'svelte/legacy';

    import {
        useSvelteFlow
    } from '@xyflow/svelte';
    import VSSo from "../VSSo.json";
    import { Input } from "$lib/components/ui/input";
    import { onMount } from "svelte";
    import { currentNodes, customVSSoVariables } from '$lib/stores/stores.svelte';

    interface Props {
        id: string;
        type?: 'element' | 'connector';
        currentClass?: string | null;
        onChange?: (value: string) => void;
    }

    let {
        id,
        type = 'element',
        currentClass = $bindable(null),
        onChange
    }: Props = $props();

    let isPopoverOpen = $state(false);

    // Make node only draggable when popover is closed
    run(() => {
        if (isPopoverOpen) {
            currentNodes.update((nodes) => {
                return nodes.map((node) => {
                    if (node.id === id && node.dragHandle !== '.none') {
                        return {...node, dragHandle: '.none'};
                    }
                    return node;
                });
            });
        } else {
            currentNodes.update((nodes) => {
                return nodes.map((node) => {
                    if (node.id === id && node.dragHandle !== '.element-node-inner') {
                        return {...node, dragHandle: '.element-node-inner'};
                    }
                    return node;
                });
            });
        }
    });

    let currentSearch: string = $state("");

    const defaultClasses = (type === 'element' ? Object.keys(VSSo.elementTypes) :
        Object.values(VSSo.elementTypes).flat());

    // Combine default classes with custom variables
    let allClasses = $derived([...defaultClasses, ...$customVSSoVariables]);

    let shownClasses: string[] = $state(allClasses);
    const updateResults = () => {
        shownClasses = allClasses.filter((VSSoClass) => {
            return VSSoClass.toLowerCase().includes(currentSearch.toLowerCase());
        });
    }

    // Update shown classes when custom variables change
    run(() => {
        updateResults();
    });

    const selectClass = (VSSoClass: string) => {
        currentClass = VSSoClass;
        isPopoverOpen = false;
        onChange?.(VSSoClass);
    }

    // Custom variable dialog
    let isAddingCustomVariable = $state(false);
    let newCustomVariableName = $state("");
    let customVariableError = $state(false);

    const validateCustomVariableName = () => {
        customVariableError = !newCustomVariableName.trim() ||
                             allClasses.some(v => v.toLowerCase() === newCustomVariableName.trim().toLowerCase());
    }

    const addCustomVariable = () => {
        const varName = newCustomVariableName.trim();
        if (!varName || customVariableError) return;

        customVSSoVariables.update(vars => {
            if (!vars.includes(varName)) {
                return [...vars, varName];
            }
            return vars;
        });

        // Set the newly created variable as selected
        currentClass = varName;
        onChange?.(varName);

        // Reset and close dialog
        newCustomVariableName = "";
        customVariableError = false;
        isAddingCustomVariable = false;
        isPopoverOpen = false;
    }

    const openCustomVariableDialog = () => {
        isAddingCustomVariable = true;
        newCustomVariableName = "";
        customVariableError = false;
    }

    currentNodes.subscribe((value) => {
        const node = value.find((node) => node.id === id);
        if (node) {
            if (type === 'element') {
                currentClass = (node.data as any).element.VSSoClass;
            }
            
        }
    });

    // Make popover element compensate for zoom level
    const { viewport } = useSvelteFlow();
    let zoomLevel = $state(1);
    if (type === 'element') {
        viewport.subscribe((value) => {
            zoomLevel = value.zoom;
        });
    }

    // Make scroll work in popover
    let selectOnHover = $state(false);
    let listOnHover = $state(false);

    onMount(() => {
        document.addEventListener('pointerdown', (e) => {
            if (!selectOnHover) {
                isPopoverOpen = false;
            }
        });

        const flowEditor = document.querySelector('.svelte-flow__pane');
        if (flowEditor) {
            flowEditor.addEventListener('wheel', (e) => {
                if (listOnHover) {
                    e.stopPropagation();
                } else {
                    isPopoverOpen = false;
                }
            });
        }
    });
</script>
    <!-- svelte-ignore a11y_no_static_element_interactions -->
<div class="select-outer {type}"
    onmouseenter={() => selectOnHover = true}
    onmouseleave={() => selectOnHover = false}>
    <button class="main-class-cont border-input border rounded-md bg-background text-sm h-8"
        onclick={() => isPopoverOpen = !isPopoverOpen}>
        <span>
            {currentClass ? currentClass : "Select Type..."}
        </span>
        <svg class="icon-updown" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" d="M8.25 15 12 18.75 15.75 15m-7.5-6L12 5.25 15.75 9" />
        </svg>      
    </button>
    <div class="main-popover {isPopoverOpen ? 'open' : ''} shadow-md"
        style:transform="scale({1/zoomLevel}) translate(-50%, 0)">
        <button class="add-custom-var-btn" onclick={openCustomVariableDialog}>
            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <line x1="12" y1="5" x2="12" y2="19"></line>
                <line x1="5" y1="12" x2="19" y2="12"></line>
            </svg>
            Add Custom Variable
        </button>
        <div class="separator"></div>
        <Input
            type="text"
            class="h-8"
            bind:value={currentSearch}
            on:input={updateResults}
            placeholder="Search types..."
        />
        <!-- svelte-ignore a11y_no_static_element_interactions -->
        <div class="main-class-list"
            onmouseenter={() => listOnHover = true}
            onmouseleave={() => listOnHover = false}>
            {#if shownClasses.length === 0}
                <span class="no-classes">No classes found</span>
            {:else}
                {#each shownClasses as VSSoClass}
                    <button onclick={() => {selectClass(VSSoClass)}}>{VSSoClass}</button>
                {/each}
            {/if}
        </div>
    </div>
</div>

<!-- Custom Variable Dialog -->
{#if isAddingCustomVariable}
    <!-- svelte-ignore a11y_no_static_element_interactions -->
    <div class="custom-var-dialog-overlay" onclick={() => isAddingCustomVariable = false}>
        <!-- svelte-ignore a11y_no_static_element_interactions -->
        <div class="custom-var-dialog" onclick={(e) => e.stopPropagation()}>
            <h3>Add Custom Variable</h3>
            <div class="dialog-content">
                <label>
                    Variable Name:
                    <Input
                        class="h-8 {customVariableError ? 'error-outline' : ''}"
                        bind:value={newCustomVariableName}
                        on:input={validateCustomVariableName}
                        placeholder="e.g., Motor.Temperature, Battery.Voltage"
                    />
                </label>
                {#if customVariableError}
                    <span class="error-message">Variable name is invalid or already exists</span>
                {/if}
            </div>
            <div class="dialog-actions">
                <button class="cancel-btn" onclick={() => isAddingCustomVariable = false}>
                    Cancel
                </button>
                <button
                    class="add-btn {customVariableError || !newCustomVariableName.trim() ? 'inactive' : ''}"
                    onclick={addCustomVariable}>
                    Add Variable
                </button>
            </div>
        </div>
    </div>
{/if}

<style>
    .main-class-list {
        display: flex;
        flex-direction: column;
        max-height: 180px;
        overflow-y: scroll;
        overflow-x: hidden;
        margin-top: 12px;
    }
    .main-class-list button {
        flex-shrink: 0;
        width: calc(100% - 2px);
        font-size: 14px;
        color: rgba(0, 0, 0, 9);
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
        line-height: 1.5;
        padding: 5px 8px;
        border-radius: var(--main-border-radius);
        cursor: pointer;
        transition: color .2s;
        text-align: left;
    }
    .main-class-list button:nth-of-type(odd) {
        background: var(--list-dark-color);
    }
    .main-class-list button:hover {
        color: rgb(0, 0, 0);
    }
    .no-classes {
        background: none;
        color: rgba(0, 0, 0, 0.5);
        padding: 10px 0;
        font-size: 14px;
        text-align: center;
    }
    .main-popover {
        border-radius: var(--main-border-radius);
        border: var(--main-border);
        padding: 9px;
        width: 264px;
        height: fit-content;
        background: white;
        position: absolute;
        top: 100%;
        left: 50%;
        margin-top: 6px;
        transform-origin: top left;
        opacity: 0;
        transition: opacity .3s;
        pointer-events: none;
        z-index: 9;
    }
    .main-popover.open {
        display: block;
        opacity: 1;
        pointer-events: all;
    }

    .select-outer {
        position: relative;
        display: flex;
        flex-direction: column;
    }

    .main-class-cont {
        background: white;
        font-size: 14px;
        color: rgba(0, 0, 0, 0.9);
        border-radius: 5px;
        padding: 0.5rem 0.625rem;
        box-sizing: border-box;
        width: 100%;
        margin: 0;
        display: flex;
        justify-content: space-between;
        align-items: center;
        flex-wrap: nowrap;
        cursor: pointer;
        transition: background .2s;
    }
    .element .main-class-cont {
        font-weight: 550;
    }

    .main-class-cont:hover {
        background: var(--main-hover-color);
    }
    .main-class-cont span {
        flex-grow: 0;
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
    }
    .icon-updown {
        width: 20px;
        height: 20px;
        color: rgba(0, 0, 0, 0.5);
        flex-shrink: 0;
        margin-right: -2.5px;
    }

    /* Custom Variable Styles */
    .add-custom-var-btn {
        width: 100%;
        display: flex;
        align-items: center;
        gap: 8px;
        padding: 8px 10px;
        background: none;
        border: none;
        cursor: pointer;
        font-size: 13px;
        color: var(--main-dark-color);
        transition: background-color 0.15s;
        font-family: 'Inter', sans-serif;
        border-radius: var(--main-border-radius);
        font-weight: 500;
    }
    .add-custom-var-btn:hover {
        background-color: rgba(0, 0, 0, 0.05);
    }
    .separator {
        height: 1px;
        background-color: rgba(0, 0, 0, 0.1);
        margin: 8px 0;
    }

    /* Custom Variable Dialog Styles */
    .custom-var-dialog-overlay {
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
    .custom-var-dialog {
        background: white;
        border-radius: 8px;
        padding: 20px;
        width: 400px;
        max-width: 90vw;
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
    }
    .custom-var-dialog h3 {
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
        font-weight: 500;
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
