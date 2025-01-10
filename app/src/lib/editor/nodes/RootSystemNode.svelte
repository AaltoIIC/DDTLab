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
        font-size: 24px;
        color: rgba(0, 0, 0, 0.8);
        margin: 12px 12px;
    }
    .node-body {
        width: 1800px;
        height: 1200px;
        border: dashed 6px rgba(0, 0, 0, 0.15);
        border-radius: 18px;
    }
</style>