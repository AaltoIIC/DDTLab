<script lang="ts">
    import { type NodeProps } from '@xyflow/svelte';
    import { onMount } from 'svelte';
   
    type $$Props = NodeProps;
    $$restProps

    onMount(() => {
        const rootElement: HTMLDivElement | null = document.querySelector('[data-id="root"]');
        if (rootElement) {
            rootElement.style.pointerEvents = 'none';
        }
    });
</script>

<div class="node-body">
    <p>Root System</p>
</div>
<style>
    p {
        font-family: 'Robot Mono', monospace;
        font-size: 8px;
        color: rgba(0, 0, 0, 0.8);
        margin: 4px 4px;
    }
    .node-body {
        width: 600px;
        height: 400px;
        border: dashed 2px rgba(0, 0, 0, 0.15);
        border-radius: 6px;
    }
</style>