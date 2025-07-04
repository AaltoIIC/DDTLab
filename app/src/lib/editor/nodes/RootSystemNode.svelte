<script lang="ts">
    import { type NodeProps } from '@xyflow/svelte';
    import { onMount } from 'svelte';
    import { currentNodes } from '$lib/stores/stores.svelte';
   interface Props {
      [key: string]: any
   }

   let { ...rest }: Props = $props();
   
    type $$Props = NodeProps;
    rest

    onMount(() => {
        const rootElement: HTMLDivElement | null = document.querySelector('[data-id="root"]');
        if (rootElement) {
            rootElement.style.pointerEvents = 'none';
        }
    });
</script>

<div class="node-body">
    <p>Root System</p>
    {#if $currentNodes.length === 1}
        <h2>
            <svg class="icon-add-elements" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" d="M12 9v6m3-3H9m12 0a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
            </svg>              
            Add elements here</h2>
    {/if}
</div>
<style>
    h2 {
        color: rgba(0, 0, 0, 0.45);
        font-size: 24px;
        font-weight: 500;
    }
    .icon-add-elements {
        width: 32px;
        height: 32px;
        display: inline;
        margin-top: -4px;
        color: rgba(0, 0, 0, 0.9);
    }
    p {
        font-size: 22px;
        color: rgba(0, 0, 0, 0.45);
        font-weight: 500;
        position: absolute;
        top: 12px;
        left: 12px;
    }
    .node-body {
        width: 1800px;
        height: 1200px;
        border: dashed 6px rgba(0, 0, 0, 0.15);
        border-radius: 18px;
        position: relative;
        display: flex;
        align-items: center;
        justify-content: center;
    }
</style>