<script lang="ts">
    import { onMount } from 'svelte';

    export let icon: string = '';
    export let iconColor: string = 'black';
    export let options: string[] = [];
    export let optionIcons: string[] = [];
    export let onClick: (option: string) => void = () => {};
    export let visible = true;

    let isDropdownOpen = false;
    let onHover = false;

    onMount(() => {
        document.addEventListener('pointerdown', (event) => {
            if (!onHover) {
                isDropdownOpen = false;
            }
        });
    });
</script>

<!-- svelte-ignore a11y-no-static-element-interactions -->
<div class="main-button-cont {isDropdownOpen ? "open" : ""} {visible ? 'visible' : ''}"
    on:mouseenter={() => {onHover = true}}
    on:mouseleave={() => {onHover = false}}>
<button
    class="btn"
    aria-label="Dropdown"
    on:click={(e) => {e.stopPropagation(); isDropdownOpen = !isDropdownOpen}}
    style:color={iconColor}>
        {@html icon}
</button>
<div class="main-dropdown">
    {#each options as option, index}
        <button on:click={(e) => {e.stopPropagation(); onClick(option); isDropdownOpen = false;}}>
            {#if optionIcons.length > index}
                <span class="option-icon">
                    {@html optionIcons[index]}
                </span>
            {/if}
            <span class="option-text">
                {option}
            </span>
            <svg class="option-chevron" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" d="m8.25 4.5 7.5 7.5-7.5 7.5" />
            </svg>              
        </button>
    {/each}
</div>
</div>
<style>
    .option-chevron {
        display: inline;
        width: 16px;
        height: 16px;
        margin: 8.5px 0 0 8px;
        float: right;
    }
    .btn {
        width: 20px;
        height: 20px;
        margin: 0 -2px -2px 0;
        cursor: pointer;
        visibility: hidden;
        opacity: 0.9;
    }
    .visible .btn {
        visibility: visible;
    }
    .option-text {
        line-height: 34px;
        white-space: nowrap;
        flex-grow: 1;
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
        font-weight: 500;
        padding: 2px 10px;
        overflow: hidden;
        display: flex;
        align-items: left;
        vertical-align: middle;
        transition: 0.4s;
    }
    .main-dropdown button:hover {
        background-color: rgba(0, 0, 0, 0.03);
    }
    .main-dropdown {
        position: absolute;
        top: 0;
        right: -13px;
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
        transform: translateX(calc(100% + 4px));
        box-sizing: border-box;
    }
    .open .main-dropdown {
        visibility: visible;
        opacity: 1;
    }
    .main-button-cont {
        position: relative;
        width: 42px;
        height: 42px;
        display: flex;
        align-items: center;
        justify-content: center;
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