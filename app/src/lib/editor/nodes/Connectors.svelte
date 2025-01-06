<script lang="ts">
    import {
        Handle,
        Position,
        useSvelteFlow
    } from '@xyflow/svelte';
    import { type ElementDataType } from '$lib/types/types';
    import AddConnectorButton from './AddConnectorButton.svelte';

    export let type: 'input' | 'output' = 'output';
    export let elementName: string;
    export let elementData: ElementDataType;

    export let nodeOnHover: boolean = false;

    // Make tooltips compensate for zoom level
    const { viewport } = useSvelteFlow();
    let zoomLevel = 1;
    viewport.subscribe((value) => {
        zoomLevel = value.zoom;
    });
</script>
<div class="main-connectors {type}">
    <AddConnectorButton bind:nodeOnHover {elementName} {type} />
    <div class="handles-outer">
        {#each elementData.connectors.filter(c => c.type === type) as connector, i}
            <div class="handle-wrapper">
                <Handle
                    id={`${elementName}.${connector.name}`}
                    type="{type === 'input' ? 'target' : 'source'}"
                    position={type === 'input' ? Position.Left : Position.Right}
                    style="position: relative; top: 0; left: 0; transform: none;"
                />
                <div class="handle-tooltip" style={`transform: scale(${1 / zoomLevel});`}>
                    <span>{connector.name}</span>
                    <svg class="icon-remove" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor">
                        <path stroke-linecap="round" stroke-linejoin="round" d="M6 18 18 6M6 6l12 12" />
                    </svg>                      
                </div>
            </div>
        {/each}
    </div>
</div>
<style>
    .icon-remove {
        width: 16px;
        height: 16px;
        cursor: pointer;
        color: var(--main-error-color-dark);
    }
    .handle-tooltip {
        transform-origin: top left;
        width: 120px;
        background-color: white;
        border-radius: var(--main-border-radius);
        border: var(--main-border);
        padding: 4px;
        position: absolute;
        left: 0;
        display: flex;
        justify-content: space-between;
        font-size: 12px;
        margin: 0 8px;
    }
    .input .handle-tooltip {
        margin-right: 100px;
    }

    .handle-wrapper {
        position: relative;
        display: flex;
        vertical-align: middle;
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
        z-index: 100;
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