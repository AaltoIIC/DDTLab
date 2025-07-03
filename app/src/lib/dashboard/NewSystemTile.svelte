<script lang="ts">
    import { goto } from "$app/navigation";

    import Button from "$lib/Button.svelte";
    let hover = $state(false);
    let showDropdown = $state(false);

    function handleNewClick(e: MouseEvent) {
        e.stopPropagation();
        showDropdown = !showDropdown;
    }

    function handleStageSelect(stage: 'concept' | 'design') {
        showDropdown = false;
        if (stage === 'design') {
            goto("/editor");
        } else {
            goto("/editor?stage=concept");
        }
    }

    function handleClickOutside(e: MouseEvent) {
        if (showDropdown && !(e.target as HTMLElement).closest('.dropdown-container')) {
            showDropdown = false;
        }
    }
</script>

<svelte:window onclick={handleClickOutside} />

<!-- svelte-ignore a11y_no_static_element_interactions -->
<!-- svelte-ignore a11y_click_events_have_key_events -->
<div class="main-tile {hover ? 'hover' : ''} shadow"
    onmouseenter={() => hover = true}
    onmouseleave={() => hover = false}>
    <span class="bg-icon">
        <svg class="outline" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.75" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
        </svg>
        <svg class="inside" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
        </svg>
    </span>
    <p>Create New System</p>
    <div class="btn-cont">
        <div class="dropdown-container">
            <Button
            onClick={() => showDropdown = !showDropdown}
            color="rgb(30, 30, 30)" textColor="rgba(255, 255, 255, 0.9)"
            icon='<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="M12 4.5v15m7.5-7.5h-15" /></svg>'>
                New
                <svg class="icon-arrow" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" d="m8.25 4.5 7.5 7.5-7.5 7.5" />
                </svg>          
            </Button>
            {#if showDropdown}
                <div class="dropdown">
                    <button class="dropdown-item" onclick={() => handleStageSelect('concept')}>
                        Conceptual Stage
                    </button>
                    <button class="dropdown-item" onclick={() => handleStageSelect('design')}>
                        Design Stage
                    </button>
                </div>
            {/if}
        </div>
    </div>
</div>
<style>
    .bg-icon * {
        width: 212px;
        height: 212px;
        position: absolute;
        bottom: -40px;
        left: -60px;
    }
    .bg-icon .inside {
        color: white;
    }
    .hover .bg-icon .inside {
        color: var(--main-hover-color);
    }
    .bg-icon .outline {
        color: rgba(10, 10, 10, 0.102);
        outline-style: initial;
    }
    .icon-arrow {
        width: 18px;
        height: 18px;
    }
    .main-tile {
        width: 175px;
        height: 248px;
        border-radius: var(--main-border-radius);
        background-color: white;
        cursor: pointer;
        margin: 0 0 15px 15px;
        position: relative;
        border: var(--main-border);
        overflow: hidden;
    }
    .main-tile.hover {
        background-color: var(--main-hover-color);
    }
    p {
        font-family: "Inter", sans-serif;
        font-size: 14px;
        opacity: 0.9;
        width: max-content;
        position: absolute;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
    }
    .btn-cont {
        position: absolute;
        bottom: 14px;
        right: 14px;
    }
    .dropdown-container {
        position: relative;
    }
    .dropdown {
        position: absolute;
        bottom: 100%;
        right: 0;
        margin-bottom: 4px;
        background: white;
        border: 1px solid rgba(0, 0, 0, 0.1);
        border-radius: 6px;
        box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
        overflow: hidden;
        min-width: 140px;
        z-index: 10;
    }
    .dropdown-item {
        display: block;
        width: 100%;
        padding: 8px 12px;
        text-align: left;
        background: none;
        border: none;
        font-size: 13px;
        cursor: pointer;
        transition: background-color 0.15s ease;
    }
    .dropdown-item:hover {
        background-color: #f5f5f5;
    }
    .dropdown-item:not(:last-child) {
        border-bottom: 1px solid rgba(0, 0, 0, 0.05);
    }
    @media (max-width: 492px) {
        .main-tile {
            width: 100%;
            margin: 0 0 15px 0;
        }
    }
</style>