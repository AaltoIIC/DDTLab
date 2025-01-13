<script lang="ts">
    import {
        useSvelteFlow
    } from '@xyflow/svelte';
    import {
        selectNode
    } from '$lib/helpers';
    import EditConnectorPopup from './EditConnectorPopup.svelte';

    export let elementName: string;
    export let type: 'input' | 'output' = 'output';
    export let nodeOnHover: boolean = false;
    let btnOnHover: boolean = false;
    let isAddingNew: boolean = false;
    let addBtn: HTMLSpanElement;

    
    // Make button and layover compensate for zoom level
    const { viewport } = useSvelteFlow();
    let zoomLevel = 1;
    viewport.subscribe((value) => {
        zoomLevel = value.zoom;
    });
</script>

<!-- svelte-ignore a11y_no_static_element_interactions -->
<!-- svelte-ignore a11y_click_events_have_key_events -->
<span class="btn-add-cont {type}"
    style="transform: scale({1/zoomLevel});"
    on:mouseenter={() => {btnOnHover = true; nodeOnHover = false;}}
    on:mouseleave={() => {btnOnHover = false; nodeOnHover = true;}}>
    <button class="add-btn {nodeOnHover || btnOnHover || isAddingNew ? 'hover' : ''}"
        aria-label="Add Connector"
        on:click={() => {selectNode(elementName);}}
        bind:this={addBtn}>
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="size-6">
            <path stroke-linecap="round" stroke-linejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
        </svg>
    </button>
    <EditConnectorPopup {elementName} {type}
        isOpen={isAddingNew}
        trigger={addBtn}
    />
</span>
<style>
    .btn-add-cont {
        position: absolute;
        right: -46px;
        z-index: 5;
    }
    .output.btn-add-cont {
        position: absolute;
        right: unset;
        left: -46px;
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
        opacity: 0;
        transition: opacity .3s;
        pointer-events: none;
    }
    .add-btn.hover {
        opacity: 1;
        pointer-events: all;
    }
</style>