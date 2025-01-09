<script lang="ts">
    import {
        Handle,
        Position,
        useSvelteFlow
    } from '@xyflow/svelte';
    import { type ElementDataType } from '$lib/types/types';
    import _ from 'lodash';
    import { currentNodes } from '$lib/stores/stores';
    import AddConnectorButton from './AddConnectorButton.svelte';
    import { selectNode } from '$lib/helpers';

    export let type: 'input' | 'output' = 'output';
    export let elementName: string;
    export let elementData: ElementDataType;

    export let nodeOnHover: boolean = false;

    const removeConnector = (name: string) => {
        currentNodes.update((nodes) => {
            const nodeIndex = nodes.findIndex((node) => node.id === elementName);
            const newNodes = [...nodes];

            newNodes[nodeIndex].data = _.cloneDeep(newNodes[nodeIndex].data);
            (newNodes[nodeIndex].data.element as any).connectors = (newNodes[nodeIndex].data.element as any)
                .connectors.filter((connector: any) => connector.name !== name);

            return newNodes;
        });
    }

    // Make tooltips compensate for zoom level
    const { viewport } = useSvelteFlow();
    let zoomLevel = 1;
    viewport.subscribe((value) => {
        zoomLevel = value.zoom;
    });

    // Handle handle hover
    let handleHovered: string = '';

</script>
<div class="main-connectors {type}">
    <AddConnectorButton bind:nodeOnHover {elementName} {type} />
    <div class="handles-outer">
        {#each elementData.connectors.filter(c => c.type === type) as connector, i}
            <!-- svelte-ignore a11y_no_static_element_interactions -->
            <div class="handle-wrapper {handleHovered === connector.name ? 'hovered' : ''}"
                on:mouseenter={() => {handleHovered = connector.name; selectNode(elementName);}}
                on:mouseleave={() => {handleHovered = '';}}>
                <div class="handle-back">
                </div>
                <Handle
                    id={`${elementName}.${connector.name}`}
                    type="{type === 'input' ? 'target' : 'source'}"
                    position={type === 'input' ? Position.Left : Position.Right}
                    style="position: relative; top: 0; left: 0; transform: none; z-index: 4;"
                />
                <div class="tooltip-outer" style={`transform: scale(${1 / zoomLevel});`}>
                    <div class="handle-tooltip">
                        <span>{connector.name}</span>
                        <button class="btn-remove"
                            on:click={() => removeConnector(connector.name)}
                            aria-label="Remove Connector">
                            <svg class="icon-remove" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor">
                                <path stroke-linecap="round" stroke-linejoin="round" d="M6 18 18 6M6 6l12 12" />
                            </svg>        
                        </button>              
                    </div>
                </div>
            </div>
        {/each}
    </div>
</div>
<style>
    .handle-back {
        position: absolute;
        top: -3px;
        width: 12px;
        height: 12px;
        z-index: 3;
    }
    .tooltip-outer {
        position: relative;
        width: 0;
        height: 0;
        display: none;
        z-index: 6;
    }
    .hovered .tooltip-outer {
        display: block;
    }
    .btn-remove {
        flex-shrink: 0;
        border: none;
        background: none;
        padding: 0;
        cursor: pointer;
    }
    .icon-remove {
        width: 15px;
        height: 15px;
        color: var(--main-error-color-dark);
    }
    .handle-tooltip {
        max-width: 128px;
        width: fit-content;
        background-color: var(--main-dark-color);
        color: rgba(255, 255, 255, 0.9);
        border-radius: 50px;
        padding: 6px 8px;
        position: absolute;
        left: 0;
        display: flex;
        justify-content: space-between;
        gap: 2px;
        font-size: 12px;
        margin: 0 8px;
        margin-top: -8px;
    }
    .input .handle-tooltip {
        position: absolute;
        left: unset;
        right: 0;
        flex-direction: row-reverse;
    }
    .handle-tooltip span {
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
        padding: 0 4px;
    }
    .output .handle-tooltip:after {
        content: " ";
        position: absolute;
        right: calc(100% - 3px);
        top: calc(50% - 9.5px);
        margin-left: -10px;
        border-width: 10px;
        border-style: solid;
        border-color: transparent var(--main-dark-color) transparent transparent;
        border-left: none;
    }
    .input .handle-tooltip:after {
        content: " ";
        position: absolute;
        left: calc(100% - 3px);
        top: calc(50% - 9.5px);
        margin-right: -10px;
        border-width: 10px;
        border-style: solid;
        border-color: transparent transparent transparent var(--main-dark-color);
        border-right: none;
    }

    .handle-wrapper {
        position: relative;
        display: flex;
        vertical-align: middle;
    }
    .input .handle-wrapper {
        flex-direction: row-reverse;
    }

    .handles-outer {
        position: relative;
        height: 100%;
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: space-evenly;
    }
    .main-connectors {
        position: absolute;
        width: 10px;
        height: 100%;
        top: 0;
        right: 0;
        transform: translateX(50%);
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
    }
    .main-connectors.input {
        left: 0;
        transform: translateX(-50%);
        right: auto;
    }
</style>