<script lang="ts">
    import {
        Handle,
        Position,
        useSvelteFlow,
        type Node
    } from '@xyflow/svelte';
    import * as Select from "$lib/components/ui/select";
    import { Input } from "$lib/components/ui/input";
    import { onMount } from 'svelte';
    import { type ElementDataType } from '$lib/types/types';
    import { currentEdges } from '$lib/stores/stores';
    import { currentNodes } from '$lib/stores/stores';

    export let type: 'input' | 'output' = 'output';
    export let elementName: string;
    export let elementData: ElementDataType;

    export let nodeOnHover: boolean = false;
    let btnOnHover: boolean = false;
    let isAddingNew: boolean = false;

    let btnAddCont: HTMLSpanElement;

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
            (newNodes[nodeIndex].data.element as any).connectors = [
                ...(newNodes[nodeIndex].data.element as any).connectors,
                {
                    name: 'new-connector-' + Math.random().toString(36).substring(7),
                    type: type,
                    dataType: 'real',
                    unit: 'none'
                }
            ]
            return newNodes;
        });
        isAddingNew = false;
    }

    onMount(() => {
        btnAddCont.addEventListener('click', (e: Event) => {
            e.stopPropagation();
            isAddingNew = true;
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
<div class="main-connectors {type}">
    <div class="handle-outer">
        {#each elementData.connectors.filter(c => c.type === type) as connector, i}
            <Handle
                id={`${elementName}.${connector.name}`}
                type="{type === 'input' ? 'source' : 'target'}"
                position={type === 'input' ? Position.Right : Position.Left}
                style="position: relative; top: 0; left: 0; transform: none;"
            />
        {/each}
    </div>

    <!-- svelte-ignore a11y_no_static_element_interactions -->
    <span class="btn-add-cont {nodeOnHover || btnOnHover || isAddingNew ? 'hover' : ''}"
        bind:this={btnAddCont}
        style="transform: scale({1/zoomLevel});"
        on:mouseenter={() => {btnOnHover = true; nodeOnHover = false;}}
        on:mouseleave={() => {btnOnHover = false; nodeOnHover = true;}}>
        <button class="add-btn" aria-label="Add Connector">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="size-6">
                <path stroke-linecap="round" stroke-linejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
            </svg>        
        </button>
        <div class="main-add-layover {isAddingNew ? 'open' : ''}">
            <div class="connector-param">
                <span>Name:</span>
                <Input class="w-[148px]" />
            </div>
            <div class="connector-param">
                <span>Data Type:</span>
                <Select.Root>
                    <Select.Trigger class="w-[148px]">
                        <Select.Value placeholder="Real" />
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
                <Select.Root>
                    <Select.Trigger class="w-[148px]">
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
            <button class="done-btn" on:click={addConnector}>
                Add {type === 'input' ? 'Input' : 'Output'}
            </button>
        </div>
    </span>
</div>
<style>
    .handle-outer {
        position: relative;
    }
    .done-btn {
        width: 100%;
        padding: 8px;
        background-color: var(--main-color);
        color: white;
        border: none;
        font-family: 'Inter', sans-serif;
        font-size: 12px;
        cursor: pointer;
        border-radius: 0 0 var(--main-border-radius) var(--main-border-radius);
        margin-top: 6px;
    }
    .done-btn:hover {
        filter: brightness(1.05);
    }
    .btn-add-cont {
        position: relative;
        opacity: 0;
        transition: opacity .3s;
        pointer-events: none;
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
        background-color: rgba(0, 0, 0, 0.03);
    }
    .main-add-layover {
        position: absolute;
        width: 264px;
        top: 100%;
        left: 0;
        margin-top: 6px;
        background: white;
        border-radius: var(--main-border-radius);
        border: solid 1px var(--main-color);
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
    .main-connectors {
        position: absolute;
        width: 10px;
        height: 100%;
        top: 0;
        right: 0;
        transform: translateX(50%);
        z-index: 100;
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
    }
    .main-connectors.output {
        left: 0;
        transform: translateX(-50%);
        right: auto;
    }
</style>