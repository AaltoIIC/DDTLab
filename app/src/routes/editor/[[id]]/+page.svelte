<script lang="ts">
    import { goto } from "$app/navigation";
    import { onMount } from "svelte";
    import Sidebar from "$lib/sidebar/Sidebar.svelte";
    import { getScreenSize } from "$lib/helpers";
    import Editor from "$lib/editor/Editor.svelte";
    import TopBar from '$lib/editor/TopBar.svelte';
    import type { SystemType } from "$lib/types/types";
    import { SvelteFlowProvider } from "@xyflow/svelte";
    import {
        createSystem,
        currentSystemMeta,
        currentEdges,
        currentNodes,
        currentReqs,
        saveCurrentSystem,
        systems,
        addToHistory,
        history,
        navigateToParent,
        resetNavigation,
        navigationContext,

        saveSystem

    } from "$lib/stores/stores";
    import Breadcrumb from "$lib/editor/Breadcrumb.svelte";
    import ConceptualStageLayout from "$lib/concept-phase/ConceptualStageLayout.svelte";

    
    // initialize the editor
    let { data } = $props();
    
    // Check if we're in conceptual stage
    const isConceptualStage = data.stage === 'concept';
    
    if (data.id) {
        if ($currentSystemMeta.id === data.id) {
            // if system is already loaded, do nothing
        } else if ($systems.some(s => s.id === data.id)) {
            // if system exists, load it
            const sys = $systems.find(s => s.id === data.id) as SystemType;
            currentSystemMeta.set({
                name: sys.name,
                date: sys.date,
                id: sys.id
            });
            currentNodes.set(sys.nodes);
            currentEdges.set(sys.edges);
            currentReqs.set(sys.requirements);
            
            // If system has a different stage than URL, redirect to correct stage
            if (sys.stage && sys.stage !== data.stage) {
                onMount(() => {
                    const stageParam = sys.stage === 'concept' ? '?stage=concept' : '';
                    goto(`/editor/${sys.id}${stageParam}`, {replaceState: true});
                });
            }
        } else {
            // if system does not exist, redirect home
            onMount(() => {
                goto('/');
            });
        }
    } else {
        // create new system
        const newSys = createSystem();
        currentSystemMeta.set({
            name: newSys.name,
            date: newSys.date,
            id: newSys.id
        });
        
        if (isConceptualStage) {
            // For conceptual stage, start with blank canvas
            currentNodes.set([]);
            currentEdges.set([]);
            currentReqs.set([]);
            
            saveSystem({
                ...newSys,
                nodes: [],
                edges: [],
                requirements: [],
                isSubsystem: false,
                stage: 'concept'
            });
        } else {
            // For design stage, use the existing default setup
            currentNodes.set([{
                id: 'root',
                type: 'RootSystem',
                data: { label: 'Node' },
                position: { x: 0, y: 150 }
            }]);
            currentEdges.set([]);
            currentReqs.set([]);

            saveSystem({
                ...newSys,
                nodes: [{
                    id: 'root',
                    type: 'RootSystem',
                    data: { label: 'Node' },
                    position: { x: 0, y: 150 }
                }],
                edges: [],
                requirements: [],
                isSubsystem: false
            });
        }

        onMount(() => {
            const stageParam = isConceptualStage ? '?stage=concept' : '';
            goto(`/editor/${newSys.id}${stageParam}`, {replaceState: true});
        });
    }

    // handle autosave and history
    currentSystemMeta.subscribe(() => {
        saveCurrentSystem();
    });
    currentEdges.subscribe(() => {
        saveCurrentSystem();
    });
    currentNodes.subscribe(() => {
        saveCurrentSystem();
    });
    currentReqs.subscribe(() => {
        saveCurrentSystem();
    });


    // handle different screen sizes
    let isMobile = false;
    let defaultFirstSize = 360;
    const screenSize = getScreenSize();
    if (screenSize === 'tablet') {
        defaultFirstSize = 275;
    } else if (screenSize === 'mobile') {
        defaultFirstSize = 0;
        isMobile = true;
    }

    function handleKeydown(event: KeyboardEvent) {
        if (event.key === 'Escape' && $navigationContext.path.length > 0) {
            navigateToParent();
        }
    }

    onMount(() => {
        addToHistory();

        resetNavigation();

        window.addEventListener('keydown', handleKeydown);
        return () => {
            window.removeEventListener('keydown', handleKeydown);
        };
    });
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
    </SvelteFlowProvider>
{:else}
    <SvelteFlowProvider>
        <div class="main-screen">
            <Editor />
            <TopBar />
            <Sidebar />
            <Breadcrumb />
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