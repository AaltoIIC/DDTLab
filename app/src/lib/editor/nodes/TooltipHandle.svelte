<script lang="ts">
    import {
        Handle,
        Position,
        useSvelteFlow
    } from '@xyflow/svelte';
    import _ from 'lodash';
    import { currentNodes, addToHistory } from '$lib/stores/stores.svelte';
    import { selectNode } from '$lib/helpers';
    import EditConnectorPopup from './EditConnectorPopup.svelte';

    interface Props {
        elementName: string;
        connectorName: string;
        type: 'input' | 'output';
    }

    let { elementName, connectorName, type }: Props = $props();

    let onHover: boolean = $state(false);
    let isEditing: boolean = $state(false);
    

    const removeConnector = (name: string) => {
        currentNodes.update((nodes) => {
            const nodeIndex = nodes.findIndex((node) => node.id === elementName);
            const newNodes = [...nodes];

            newNodes[nodeIndex].data = _.cloneDeep(newNodes[nodeIndex].data);
            (newNodes[nodeIndex].data.element as any).connectors = (newNodes[nodeIndex].data.element as any)
                .connectors.filter((connector: any) => connector.name !== name);

            return newNodes;
        });
        addToHistory();
    }

    // Dispatch a custom event on click (so that it can be read in requirements tab)
    const dispatchCustomEvent = () => {
        const event = new CustomEvent('connector-click', {
            detail: {
                connectorName,
                elementName,
                type
            }
        });
        document.dispatchEvent(event);
    }

    // Make tooltips compensate for zoom level
    const { viewport } = useSvelteFlow();
    let zoomLevel = $state(1);
    viewport.subscribe((value) => {
        zoomLevel = value.zoom;
    });
</script>
<!-- svelte-ignore a11y_no_static_element_interactions -->
<!-- svelte-ignore a11y_click_events_have_key_events -->
<div class="handle-wrapper {onHover || isEditing ? 'hovered' : ''} {type}"
    onmouseenter={() => {onHover = true; selectNode(elementName);}}
    onmouseleave={() => {onHover = false;}}
    onclick={(e) => {e.stopPropagation(); dispatchCustomEvent();}}>
    <div class="handle-back">
    </div>
    <Handle
        id={`${elementName}.${connectorName}`}
        type="{type === 'input' ? 'target' : 'source'}"
        position={type === 'input' ? Position.Left : Position.Right}
        style="position: relative; top: 0; left: 0; transform: none; z-index: 4;"
    />
    <div class="tooltip-outer" style={`transform: scale(${1 / zoomLevel});`}>
        <div class="handle-tooltip">
            <span>{connectorName}</span>
            <button class="btn-remove-edit"
                onclick={() => isEditing = true}
                aria-label="Edit Connector">
                <svg class="icon-edit" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" d="m16.862 4.487 1.687-1.688a1.875 1.875 0 1 1 2.652 2.652L6.832 19.82a4.5 4.5 0 0 1-1.897 1.13l-2.685.8.8-2.685a4.5 4.5 0 0 1 1.13-1.897L16.863 4.487Zm0 0L19.5 7.125" />
                </svg>                                               
            </button>
            <button class="btn-remove-edit"
                onclick={() => removeConnector(connectorName)}
                aria-label="Remove Connector">                             
                <svg class="icon-remove" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" d="M6 18 18 6M6 6l12 12" />
                </svg>
            </button>
            <EditConnectorPopup {elementName} {connectorName} bind:isOpen={isEditing} />
        </div>
    </div>
</div>

<style>
    .hovered .tooltip-outer {
        display: block;
    }
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
    .btn-remove-edit {
        flex-shrink: 0;
        border: none;
        background: none;
        padding: 0;
        cursor: pointer;
    }
    .icon-remove {
        width: 17px;
        height: 17px;
        color: var(--main-color);
    }
    .icon-edit {
        width: 14px;
        height: 14px;
        color: rgba(255, 255, 255, 0.7);
    }
    .handle-tooltip {
        max-width: 140px;
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
    .input.handle-wrapper {
        flex-direction: row-reverse;
    }
</style>