<script lang="ts">
    import { onMount } from 'svelte';

    interface Props {
        options?: string[];
        optionIcons?: string[];
        onClick?: (option: string) => void;
        visible?: boolean;
    }

    let {
        options = [],
        optionIcons = [],
        onClick = () => {},
        visible = true
    }: Props = $props();

    let isDropdownOpen = $state(false);
    let onHover = $state(false);

    onMount(() => {
        document.addEventListener('pointerdown', (event) => {
            if (!onHover) {
                isDropdownOpen = false;
            }
        });
    });
</script>

<!-- svelte-ignore a11y_no_static_element_interactions -->
<div class="main-button-cont {isDropdownOpen ? "open" : ""} {visible ? 'visible' : ''}"
    onmouseenter={() => {onHover = true}}
    onmouseleave={() => {onHover = false}}>
<button
    class="btn"
    aria-label="Open dropdown"
    onclick={(e) => {e.stopPropagation(); isDropdownOpen = !isDropdownOpen}}>
        <svg class="icon-menu" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" d="M12 6.75a.75.75 0 1 1 0-1.5.75.75 0 0 1 0 1.5ZM12 12.75a.75.75 0 1 1 0-1.5.75.75 0 0 1 0 1.5ZM12 18.75a.75.75 0 1 1 0-1.5.75.75 0 0 1 0 1.5Z" />
        </svg>
</button>
<div class="main-dropdown shadow-md">
    {#each options as option, index}
        <button onclick={(e) => {e.stopPropagation(); onClick(option); isDropdownOpen = false;}}>
            {#if optionIcons.length > index}
                <span class="option-icon">
                    {@html optionIcons[index]}
                </span>
            {/if}
            <span class="option-text">
                {option}
            </span>
        </button>
    {/each}
</div>
</div>
<style>
    .icon-menu {
        width: 20px;
        height: 20px;
        margin: 0 -2px -2px 0;
        stroke: rgba(0, 0, 0, 0.4);
        cursor: pointer;
        visibility: hidden;
        display: inline;
    }
    .visible .icon-menu {
        visibility: visible;
    }
    .option-text {
        line-height: 34px;
        white-space: nowrap;
    }
    .option-icon {
        display: block;
        width: 16px;
        height: 16px;
        color: rgba(0, 0, 0, 0.9);
        margin: 8px 4px 0px 0;
    }
    .main-dropdown button {
        border: none;
        background-color: transparent;
        cursor: pointer;
        text-align: left;
        font-family: 'Inter', sans-serif;
        font-size: 14px;
        width: 100%;
        color: rgba(0, 0, 0, 0.9);
        font-weight: 450;
        padding: 2px 10px;
        overflow: hidden;
        display: flex;
        align-items: left;
        vertical-align: middle;
        transition: 0.4s;
    }
    .main-dropdown button:hover {
        background-color: rgba(0, 0, 0, 0.05);
    }
    .main-dropdown {
        position: absolute;
        top: 100%;
        right: 0;
        margin-top: 6px;
        width: fit-content;
        padding: 0;
        background-color: white;
        transition: opacity 0.2s;
        visibility: hidden;
        z-index: 10000002;
        opacity: 0;
        border-radius: var(--main-border-radius);
        border: var(--main-border);
        overflow: hidden;
    }
    .open .main-dropdown {
        visibility: visible;
        opacity: 1;
    }
    .main-button-cont {
        position: relative;
        display: inline-flex;
        width: 20px;
        height: 20px;
    }

    .btn {
        padding: 0;
        display: inline-flex;
        cursor: pointer;
        border: none;
        background-color: transparent;
        transition: .2s;
        overflow: hidden;
        font-family: 'Inter', sans-serif;
    }
</style>