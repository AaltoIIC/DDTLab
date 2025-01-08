<script lang="ts">
    import type { SvelteComponent } from "svelte";
    import { useUpdateNodeInternals } from '@xyflow/svelte';
    import ElementLayover from "../element-layover/ElementLayover.svelte";
    import Connectors from "./Connectors.svelte";
    import { type ElementDataType } from "$lib/types/types";
   
    let hover = false;
    let layover: SvelteComponent;

    export let id: string;
    export let data: {
        element: ElementDataType;
    };

    const updateNodeInternals = useUpdateNodeInternals();
    $: if (data) {
        updateNodeInternals(id);
    }

    $$restProps
</script>
<!-- svelte-ignore a11y_no_static_element_interactions -->
<!-- svelte-ignore a11y_click_events_have_key_events -->
<div class="element-node-outer"
    on:mouseenter={() => hover = true}
    on:mouseleave={() => hover = false}
    on:click={() => {layover ? layover.nodeClick() : ''}}>
    <div class="main-element-node">
        <div class="element-type-cont">
            {#if data.element.type === 'system'}
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" d="M3.75 6A2.25 2.25 0 0 1 6 3.75h2.25A2.25 2.25 0 0 1 10.5 6v2.25a2.25 2.25 0 0 1-2.25 2.25H6a2.25 2.25 0 0 1-2.25-2.25V6ZM3.75 15.75A2.25 2.25 0 0 1 6 13.5h2.25a2.25 2.25 0 0 1 2.25 2.25V18a2.25 2.25 0 0 1-2.25 2.25H6A2.25 2.25 0 0 1 3.75 18v-2.25ZM13.5 6a2.25 2.25 0 0 1 2.25-2.25H18A2.25 2.25 0 0 1 20.25 6v2.25A2.25 2.25 0 0 1 18 10.5h-2.25a2.25 2.25 0 0 1-2.25-2.25V6ZM13.5 15.75a2.25 2.25 0 0 1 2.25-2.25H18a2.25 2.25 0 0 1 2.25 2.25V18A2.25 2.25 0 0 1 18 20.25h-2.25A2.25 2.25 0 0 1 13.5 18v-2.25Z" />
                </svg>
            {:else}
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" d="M5.25 7.5A2.25 2.25 0 0 1 7.5 5.25h9a2.25 2.25 0 0 1 2.25 2.25v9a2.25 2.25 0 0 1-2.25 2.25h-9a2.25 2.25 0 0 1-2.25-2.25v-9Z" />
                </svg>
            {/if}
        </div>
        <p>{id}</p>
        <Connectors type="output" bind:nodeOnHover={hover} elementName={id} elementData={data.element} />
        <Connectors type="input" bind:nodeOnHover={hover} elementName={id} elementData={data.element} />
    </div>
</div>
<ElementLayover bind:this={layover} id={id} nodeOnHover={hover} />
<style>
    .element-type-cont {
        width: 14px;
        height: 14px;
        padding: 2px;
        background-color: var(--main-dark-color);
        border: solid 0.5px rgba(0, 0, 0, 0.08);
        border-radius: 20px;
        position: absolute;
        top: 4px;
        right: 4px;
    }
    .element-type-cont svg {
        width: 7px;
        height: 7px;
        color:rgba(255, 255, 255, 0.9);
        position: absolute;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
    }

    .element-node-outer {
        height: fit-content;
        width: fit-content;
        padding: 0 14px;
    }
    p {
        font-family: 'Inter', sans-serif;
        font-size: 5px;
        color: rgba(0, 0, 0, 0.8);
        margin: 4px 4px;
        position: absolute;
        bottom: 0;
    }
    .main-element-node {
        width: 64px;
        height: 64px;
        border: solid 1.5px rgba(0, 0, 0, 0.15);
        border-radius: 5px;
        backdrop-filter: blur(5px);
        transition: .2s;
        position: relative;
        background: var(--main-grey-color);
    }
    .main-element-node:hover {
        background: white;
    }
</style>