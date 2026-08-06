<script lang="ts">
    import { goto } from "$app/navigation";
    import { onMount } from 'svelte';
    import DesignStageSidebar from "$lib/sidebar/DesignStageSidebar.svelte";
    import { getScreenSize } from "$lib/helpers";
    import DesignStageEditor from "$lib/design-stage/DesignStageEditor.svelte";
    import TopBar from '$lib/design-stage/TopBar.svelte';
    import { SvelteFlowProvider } from "@xyflow/svelte";
    import DesignStageBreadcrumb from "$lib/design-stage/DesignStageBreadcrumb.svelte";
    import ConceptualStageLayout from "$lib/concept-stage/ConceptualStageLayout.svelte";
    import {
        initializeEditorSession,
        type EditorStage
    } from "$lib/app/initialization/editorSessionController";
    import { startEditorAutosave } from "$lib/app/initialization/editorAutosave";
    import { startEditorNavigationLifecycle } from "$lib/app/navigation/editorNavigationLifecycle";

    let { data } = $props();
    const initialStage: EditorStage = data.stage === 'concept' ? 'concept' : 'design';
    const initialRouteKey = `${data.id ?? 'new'}:${initialStage}`;
    const initialResult = initializeEditorSession({
        id: data.id,
        stage: initialStage
    });
    let editorStage = $derived<'concept' | 'design'>(data.stage === 'concept' ? 'concept' : 'design');
    // Render the layout of the stage whose session is actually loaded into the
    // editor stores. Deriving from the initialized session key (rather than the
    // URL stage) means a stage toggle never renders the new stage's editor against
    // the previous stage's stale nodes — which made SvelteFlow warn about unknown
    // node types (e.g. concept "package"/"part" nodes in the design editor).
    let initializedRouteKey = $state(initialRouteKey);
    let isConceptualStage = $derived(initializedRouteKey.endsWith(':concept'));
    let stopAutosave: (() => void) | undefined;
    let stopNavigationLifecycle: (() => void) | undefined;

    function stopEditorLifecycle() {
        stopAutosave?.();
        stopNavigationLifecycle?.();
        stopAutosave = undefined;
        stopNavigationLifecycle = undefined;
    }

    function applyInitializationResult(result: ReturnType<typeof initializeEditorSession>) {
        if (result.kind === 'redirect-home') {
            void goto('/');
            return;
        }
        if (result.kind === 'redirect-stage') {
            const stageParam = result.stage === 'concept' ? '?stage=concept' : '';
            void goto(`/editor/${result.id}${stageParam}`, { replaceState: true });
            return;
        }
        stopEditorLifecycle();
        stopAutosave = startEditorAutosave();
        stopNavigationLifecycle = startEditorNavigationLifecycle();
    }

    // Keep the pre-refactor synchronous session initialization/render behavior
    // for the first route, while still handling SvelteKit route-data reuse.
    onMount(() => {
        applyInitializationResult(initialResult);
        return stopEditorLifecycle;
    });

    $effect(() => {
        const stage: EditorStage = data.stage === 'concept' ? 'concept' : 'design';
        const routeKey = `${data.id ?? 'new'}:${stage}`;
        if (routeKey === initializedRouteKey) return;
        initializedRouteKey = routeKey;
        stopEditorLifecycle();
        applyInitializationResult(initializeEditorSession({ id: data.id, stage }));
    });

    // Handle different screen sizes for consumers that still use these route values.
    let isMobile = false;
    let defaultFirstSize = 360;
    const screenSize = getScreenSize();
    if (screenSize === 'tablet') {
        defaultFirstSize = 275;
    } else if (screenSize === 'mobile') {
        defaultFirstSize = 0;
        isMobile = true;
    }
</script>
<svelte:head>
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin="">
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@100..900&display=swap" rel="stylesheet">
    <title>Edit | DDT Lab</title>
</svelte:head>
{#if isConceptualStage}
        <SvelteFlowProvider>
            <ConceptualStageLayout />
            <TopBar stage={editorStage} />
        </SvelteFlowProvider>
    {:else}
        <SvelteFlowProvider>
            <div class="main-screen">
                <DesignStageEditor />
                <TopBar stage={editorStage} />
                <DesignStageSidebar />
                <DesignStageBreadcrumb />
            </div>
        </SvelteFlowProvider>
    {/if}
<style>
    .main-screen {
        position: fixed;
        top: 0;
        left: 0;
        width: 100vw;
        height: 100vh;
    }
</style>