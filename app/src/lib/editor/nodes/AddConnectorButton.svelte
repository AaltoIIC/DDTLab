<script lang="ts">
    import {
        useSvelteFlow,
        type Node
    } from '@xyflow/svelte';
    import { onMount } from 'svelte';
    import { currentNodes } from '$lib/stores/stores';
    import _ from 'lodash';
    import * as Select from "$lib/components/ui/select";
    import { Input } from "$lib/components/ui/input";
    import VSSoSelect from './VSSoSelect.svelte';
    import {
        isNameValid,
        generateName,
        selectNode
    } from '$lib/helpers';

    export let elementName: string;
    export let type: 'input' | 'output' = 'output';
    export let nodeOnHover: boolean = false;
    let btnOnHover: boolean = false;
    let isAddingNew: boolean = false;
    let addBtn: HTMLSpanElement;

    // Function to generate a new unique connector name
    const nameNewConnector = () => {
        const connectorNames = ($currentNodes.find((node) => node.id === elementName)?.data.element as any)
            .connectors.map((connector: any) => connector.name);
        return generateName('Connector', connectorNames);
    }

    // Handle new connector parameters
    let newConnectorName: string = nameNewConnector();
    let newConnectorDataType = { value: "real", label: "Real" };
    let newConnectorUnit = { value: "-", label: "-" };
    $: if (isAddingNew) {
        newConnectorName = nameNewConnector();
        newConnectorDataType = { value: "real", label: "Real" };
        newConnectorUnit = { value: "-", label: "-" };
    }

    let isNameError = false;
    const validateName = () => {
        const nodeData = $currentNodes.find((node) => node.id === elementName)?.data;
        const isNameTaken = (nodeData?.element as any).connectors
            .some((connector: any) => (
                connector.name.replace(/\s+/g, '').toLowerCase() === newConnectorName.replace(/\s+/g, '').toLowerCase()
            ));

        isNameError = !isNameValid(newConnectorName) || isNameTaken;
    }
    
    // Make layover component compensate for zoom level
    const { viewport } = useSvelteFlow();
    let zoomLevel = 1;
    viewport.subscribe((value) => {
        zoomLevel = value.zoom;
    });

    const addConnector = () => {
        currentNodes.update((nodes) => {
            const nodeIndex = nodes.findIndex((node) => node.id === elementName);
            const newNodes: Node[] = [...nodes];

            newNodes[nodeIndex].data = _.cloneDeep(newNodes[nodeIndex].data);
            (newNodes[nodeIndex].data.element as any).connectors.push(
                {
                    name: newConnectorName,
                    type: type,
                    dataType: 'real',
                    unit: 'none'
                }
            );
            return newNodes;
        });

        isAddingNew = false;
    }

    onMount(() => {
        addBtn.addEventListener('click', (e: Event) => {
            isAddingNew = true;
            selectNode(elementName);
        });
        document.addEventListener('pointerdown', (e: Event) => {
            const eventTarget = e.target as HTMLElement;
            if (!btnOnHover && eventTarget.getAttribute('role') !== 'option') {
                isAddingNew = false;
            }
        });
        const flowEditor = document.querySelector('.svelte-flow__pane');
        if (flowEditor) {
            flowEditor.addEventListener('wheel', () => {isAddingNew = false});
        }
    });
</script>

<!-- svelte-ignore a11y_no_static_element_interactions -->
<!-- svelte-ignore a11y_click_events_have_key_events -->
<span class="btn-add-cont {nodeOnHover || btnOnHover || isAddingNew ? 'hover' : ''} {type}"
    style="transform: scale({1/zoomLevel});"
    on:mouseenter={() => {btnOnHover = true; nodeOnHover = false;}}
    on:mouseleave={() => {btnOnHover = false; nodeOnHover = true;}}>
    <button class="add-btn" aria-label="Add Connector"
        bind:this={addBtn}>
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="size-6">
            <path stroke-linecap="round" stroke-linejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
        </svg>
    </button>
    <div class="main-add-layover {isAddingNew ? 'open' : ''}"
        on:mouseenter={() => {selectNode(elementName);}}>
        <div class="connector-param">
            <span>Name:</span>
            <Input class="w-[142px] h-8 {isNameError ? 'error-outline' : ''}"
                bind:value={newConnectorName}
                on:input={validateName}
            />
        </div>
        <div class="connector-param">
            <span>Class:</span>
            <div class="w-[142px] h-8">
                <VSSoSelect id={elementName} type="connector"/>
            </div>
        </div>
        <div class="connector-param">
            <span>Data Type:</span>
            <Select.Root bind:selected={newConnectorDataType}>
                <Select.Trigger class="w-[142px] h-8 px-2.5">
                    <Select.Value />
                </Select.Trigger>
                <Select.Content>
                    <Select.Item value="real">Real</Select.Item>
                    <Select.Item value="integer">Integer</Select.Item>
                    <Select.Item value="string">String</Select.Item>
                    <Select.Item value="binary">Binary</Select.Item>
                    <Select.Item value="boolean">Boolean</Select.Item>
                    <Select.Item value="enumeration">Enumeration</Select.Item>
                    <Select.Item value="no-dt">No Data Type</Select.Item>
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
        <button class="done-btn {isNameError ? 'inactive' : ''}" on:click={addConnector}>
            Add {type === 'input' ? 'Input' : 'Output'}
        </button>
    </div>
</span>
<style>
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
    .btn-add-cont {
        position: absolute;
        right: -46px;
        opacity: 0;
        transition: opacity .3s;
        pointer-events: none;
        z-index: 5;
    }
    .output.btn-add-cont {
        position: absolute;
        right: unset;
        left: -46px;
    }
    .btn-add-cont.hover {
        opacity: 1;
        pointer-events: all;
    }
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
    .add-btn svg {
        width: 20px;
        height: 20px;
        color: rgba(255, 255, 255, 0.9);
        position: absolute;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
    }
    .add-btn {
        border: solid 1px rgba(255, 255, 255, 0.1);
        background: var(--main-dark-color);
        border-radius: 50%;
        width: 32px;
        height: 32px;
        cursor: pointer;
        position: relative;
    }
</style>