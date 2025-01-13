<script lang="ts">
    import { type ElementDataType } from '$lib/types/types';
    import AddConnectorButton from './AddConnectorButton.svelte';
    import TooltipHandle from './TooltipHandle.svelte';

    export let type: 'input' | 'output' = 'output';
    export let elementName: string;
    export let elementData: ElementDataType;
    export let nodeOnHover: boolean = false;
</script>
<div class="main-connectors {type}">
    <AddConnectorButton bind:nodeOnHover {elementName} {type} />
    <div class="handles-outer">
        {#each elementData.connectors.filter(c => c.type === type) as connector, i}
            <TooltipHandle
                {elementName}
                connectorName={connector.name}
                type={connector.type}
            />
        {/each}
    </div>
</div>
<style>
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