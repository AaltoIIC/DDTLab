<script lang="ts">
    import Sidebar from "$lib/sidebar/Sidebar.svelte";
    import { getScreenSize } from "$lib/utils";
    import Editor from "$lib/editor/Editor.svelte";
    import TopBar from '$lib/editor/TopBar.svelte';
    import Button from "$lib/Button.svelte";

    // initialize the editor


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