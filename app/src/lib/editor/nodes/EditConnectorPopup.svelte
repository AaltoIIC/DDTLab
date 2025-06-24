<script lang="ts">
    import { run } from 'svelte/legacy';

    import {
        type Node
    } from '@xyflow/svelte';
    import * as Select from "$lib/components/ui/select";
    import { Input } from "$lib/components/ui/input";
    import VSSoSelect from './VSSoSelect.svelte';
    import { addToHistory, currentNodes } from '$lib/stores/stores';
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
    let newConnectorName: string = $state();
    let newConnectorClass: string | null = $state();
    let newConnectorDataType: { value: string, label: string } = $state();
    let newConnectorUnit: { value: string, label: string } = $state();
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
    
    run(() => {
        if (isOpen && !isExistingConnector) {
            newConnectorName = nameNewConnector();
            newConnectorClass = null;
            newConnectorDataType = { value: "no-dt", label: "No Data Type" };
            newConnectorUnit = { value: "-", label: "-" };
        }
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
                    dataType: newConnectorDataType.value,
                    unit: newConnectorUnit.value
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
            connector.dataType = newConnectorDataType.value;
            connector.unit = newConnectorUnit.value;
            
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
    <button class="done-btn {(isNameError || !newConnectorClass) ? 'inactive' : ''}"
        onclick={isExistingConnector ? editConnector : addConnector}>
        {
            (
                isExistingConnector ? 'Edit Connector' : `Add ${type === 'input' ? 'Input' : 'Output'}`
            )
        }
    </button>
</div>
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
</style>