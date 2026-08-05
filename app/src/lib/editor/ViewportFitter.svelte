<script lang="ts">
    import { useSvelteFlow } from '@xyflow/svelte';

    interface Props {
        /**
         * A value that changes whenever the flow's loaded content changes (e.g.
         * the currently viewed system id, or the active package id). The viewport
         * is re-fitted to the new content on every change.
         */
        signal: string | null | undefined;
    }

    let { signal }: Props = $props();

    // This component renders inside <SvelteFlow>, so the flow context (and thus
    // fitView) is available. The double requestAnimationFrame gives the freshly
    // loaded nodes time to render and be measured; fitView also queues internally
    // until node dimensions are ready, so this is a belt-and-braces delay.
    const { fitView } = useSvelteFlow();

    // Skip the very first run — the flow's own fitView prop handles the initial mount.
    let previousSignal: string | null | undefined = undefined;

    $effect(() => {
        if (previousSignal === undefined) {
            previousSignal = signal;
            return;
        }
        if (previousSignal === signal) return;
        previousSignal = signal;

        requestAnimationFrame(() => {
            requestAnimationFrame(() => {
                fitView({ padding: 0.2, duration: 400 });
            });
        });
    });
</script>
