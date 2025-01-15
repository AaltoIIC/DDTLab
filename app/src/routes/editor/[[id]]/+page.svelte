<script lang="ts">
    import { goto } from "$app/navigation";
    import { onMount } from "svelte";
    import Sidebar from "$lib/sidebar/Sidebar.svelte";
    import { getScreenSize } from "$lib/helpers";
    import Editor from "$lib/editor/Editor.svelte";
    import TopBar from '$lib/editor/TopBar.svelte';
    import type { SystemType } from "$lib/types/types";
    import {
        createSystem,
        currentSystemMeta,
        currentEdges,
        currentNodes,
        systems
    } from "$lib/stores/stores.js";

    // initialize the editor
    export let data;
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
        currentNodes.set([{
            id: 'root',
            type: 'RootSystem',
            data: { label: 'Node' },
            position: { x: 0, y: 150 }
        }]);
        currentEdges.set([]);
        onMount(() => {
            goto(`/editor/${newSys.id}`, {replaceState: true});
        });
    }

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
</script>
<svelte:head>
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin="">
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@100..900&display=swap" rel="stylesheet">
    <title>Edit | SSP Lab</title>
</svelte:head>
<div class="main-screen">
    <Editor />
    <TopBar />
    <Sidebar />
</div>
<style>
    .main-screen {
        position: fixed;
        top: 0;
        left: 0;
        width: 100vw;
        height: 100vh;
    }
</style>