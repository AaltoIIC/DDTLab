<script lang="ts">
    import type { SvelteComponent } from "svelte";
    import ElementLayover from "../element-layover/ElementLayover.svelte";
   
    let hover = false;
    let layover: SvelteComponent;

    export let id: string;
    $$restProps
</script>
<!-- svelte-ignore a11y_no_static_element_interactions -->
<!-- svelte-ignore a11y_click_events_have_key_events -->
<div class="main-element-node"
    on:mouseenter={() => hover = true}
    on:mouseleave={() => hover = false}
    on:click={() => {layover ? layover.nodeClick() : ''}}>
    <p>{id}</p>
</div>
<ElementLayover bind:this={layover} id={id} nodeOnHover={hover} />
<style>
    p {
        font-family: 'Robot Mono', monospace;
        font-size: 8px;
        color: rgba(0, 0, 0, 0.8);
        margin: 4px 4px;
    }
    .main-element-node {
        width: 64px;
        height: 64px;
        border: solid 2px rgba(0, 0, 0, 0.7);
        border-radius: 5px;
        backdrop-filter: blur(5px);
        transition: .2s;
    }
    .main-element-node:hover {
        background: rgba(255, 255, 255, 0.4);
    }
</style>