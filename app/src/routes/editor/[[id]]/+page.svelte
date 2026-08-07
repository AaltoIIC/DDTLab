<script lang="ts">
    import { goto } from "$app/navigation";
    import { onMount } from 'svelte';
    import Tour from '$lib/Tour.svelte';
    import { type Driver, type DriveStep } from 'driver.js';
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
    // svelte-ignore state_referenced_locally -- intentional one-time session init capture
    const initialStage: EditorStage = data.stage === 'concept' ? 'concept' : 'design';
    // svelte-ignore state_referenced_locally -- intentional one-time session init capture
    const initialRouteKey = `${data.id ?? 'new'}:${initialStage}`;
    // svelte-ignore state_referenced_locally -- intentional one-time session init capture
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
    let designDriver: Driver | undefined = $state();
    let startDesignTour = $state(false);
    let firstDesignTour = $state(false);

    const designTourSteps: DriveStep[] = [
        {
            popover: {
                title: 'Welcome to the Design Stage tour!',
                description: '<p>The <strong>design stage</strong> is where you turn a system concept into a detailed structure with components, subsystems, connectors, and simulation-ready models.</p><p>This tour introduces the main tools for building and validating your design.</p>',
                side: 'top',
                align: 'center'
            }
        },
        {
            element: '#design-topbar',
            popover: {
                title: 'Top bar',
                description: '<p>The top bar contains history controls, stage navigation, system naming, saving, and deletion.</p><p>Use <strong>Undo</strong> and <strong>Redo</strong> to safely explore changes while you build.</p>',
                side: 'bottom',
                align: 'center'
            }
        },
        {
            element: '#design-sidebar',
            popover: {
                title: 'Design tools',
                description: '<p>The left sidebar contains the tools used to create, inspect, simulate, and exchange your design.</p><p>Hover over an icon at any time to see its purpose.</p>',
                side: 'right',
                align: 'start'
            }
        },
        {
            element: '#design-add-menu',
            popover: {
                title: 'Add components and subsystems',
                description: '<p>Use this menu to add a <strong>component</strong> or a <strong>subsystem</strong> to the canvas.</p><p>Subsystems organize nested parts of a larger design and can be opened through the design breadcrumb.</p>',
                side: 'right',
                align: 'start'
            }
        },
        {
            element: '#design-requirements-btn',
            popover: {
                title: 'Requirements',
                description: '<p>Open the requirements panel to create and manage system requirements.</p><p>Requirements can reference component inputs and outputs when you build logical expressions.</p>',
                side: 'right',
                align: 'start'
            }
        },
        {
            element: '#design-test-scenarios-btn',
            popover: {
                title: 'Test scenarios and analysis',
                description: '<p>Use test scenarios to run available analyses and simulations against the current design.</p><p>Results can be reviewed in the panel and saved as reports where supported.</p>',
                side: 'right',
                align: 'start'
            }
        },
        {
            element: '#design-fmi-btn',
            popover: {
                title: 'FMI components',
                description: '<p>The FMI components panel provides simulation models that can be linked to design components.</p><p>Use the catalog and filters to find models, then connect them to the appropriate elements.</p>',
                side: 'right',
                align: 'start'
            }
        },
        {
            element: '#design-import-export',
            popover: {
                title: 'Import and export',
                description: '<p>Use the upload and download tools to exchange your design as <strong>TTL</strong>, <strong>SSD</strong>, or <strong>ZIP</strong> files.</p><p>The adjacent download menu provides the matching export options, making it easier to share a model or continue work in another tool.</p>',
                side: 'right',
                align: 'start'
            }
        },
        {
            element: '#stage-help-btn',
            popover: {
                title: 'Replay the tour',
                description: '<p><strong>You are ready to start designing!</strong> 🎉</p><p>Click this help button whenever you want to replay the design-stage tour.</p>',
                side: 'bottom',
                align: 'center',
                onNextClick: () => {
                    if (typeof localStorage !== 'undefined') {
                        localStorage.setItem('showedDesignTour', 'true');
                    }
                    firstDesignTour = false;
                    designDriver?.destroy();
                }
            }
        }
    ];

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
        const requestDesignTour = (event: Event) => {
            const stage = (event as CustomEvent<{ stage?: string }>).detail?.stage;
            if (stage !== 'design') return;

            firstDesignTour = false;
            // Force a false -> true transition so Tour can rebuild its driver
            // after the previous run has been destroyed.
            startDesignTour = false;
            setTimeout(() => {
                startDesignTour = true;
            }, 0);
        };
        window.addEventListener('editor-tour-request', requestDesignTour);

        if (!isConceptualStage && typeof localStorage !== 'undefined' && localStorage.getItem('showedDesignTour') !== 'true') {
            firstDesignTour = true;
            startDesignTour = true;
        }

        applyInitializationResult(initialResult);
        return () => {
            window.removeEventListener('editor-tour-request', requestDesignTour);
            stopEditorLifecycle();
        };
    });

    $effect(() => {
        const stage: EditorStage = data.stage === 'concept' ? 'concept' : 'design';
        const routeKey = `${data.id ?? 'new'}:${stage}`;
        if (routeKey === initializedRouteKey) return;
        initializedRouteKey = routeKey;
        stopEditorLifecycle();
        applyInitializationResult(initializeEditorSession({ id: data.id, stage }));
    });

    // The editor route component can be reused when switching stages, so the
    // design tour also needs to be considered when the rendered stage changes.
    $effect(() => {
        if (
            isConceptualStage ||
            startDesignTour ||
            typeof localStorage === 'undefined' ||
            localStorage.getItem('showedDesignTour') === 'true'
        ) return;

        firstDesignTour = true;
        startDesignTour = true;
    });

    // Tour.svelte persists the first-run decision when the user closes or
    // completes the automatic tour. Clear the first-run-only UI mode after it
    // has been dismissed so a later replay remains normally dismissible.
    $effect(() => {
        if (
            !startDesignTour &&
            firstDesignTour &&
            typeof localStorage !== 'undefined' &&
            localStorage.getItem('showedDesignTour') === 'true'
        ) {
            firstDesignTour = false;
        }
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
                <Tour
                    bind:driverObj={designDriver}
                    bind:start={startDesignTour}
                    steps={designTourSteps}
                    disableCancel={firstDesignTour}
                    storageKey="showedDesignTour"
                />
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