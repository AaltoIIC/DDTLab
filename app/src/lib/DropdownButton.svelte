<script lang="ts">
    import { onMount } from 'svelte';
    interface Props {
        icon?: string;
        isActive?: boolean;
        options?: string[];
        optionIcons?: string[];
        onClick?: (option: string) => void;
        color?: string;
        textColor?: 'light' | 'dark';
        children?: import('svelte').Snippet;
    }

    let {
        icon = '',
        isActive = true,
        options = [],
        optionIcons = [],
        onClick = () => {},
        color = 'var(--main-color)',
        textColor = 'light',
        children
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
<div class="main-button-cont {isDropdownOpen ? "open" : ""}"
    onmouseenter={() => {onHover = true}}
    onmouseleave={() => {onHover = false}}>
<button
    class={`btn ${textColor === 'dark' ? 'dark-txt' : 'light-txt'}`}
    style={`${(isActive ?
            `background-color: ${color};`
        :
            'pointer-events: none !important; background-color: var(--main-color-dark-2); opacity: 0.7;'
    )}`}
    onclick={() => {isDropdownOpen = !isDropdownOpen}}>
    {#if icon}
        <span class="main-icon">
                {@html icon} 
        </span>             
    {/if}
    <span class="main-text" style="{icon ? '' : 'padding-left: 14px !important;'}">
        {@render children?.()}
        <svg class="icon-dropdown" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.7" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" d="m19.5 8.25-7.5 7.5-7.5-7.5" />
          </svg>
    </span>
</button>
<div class="main-dropdown shadow-md">
    {#each options as option, index}
        <button onclick={() => {onClick(option); isDropdownOpen = false;}}>
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
    .option-text {
        line-height: 34px;
        width: max-content;
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
        background-color: rgba(0, 0, 0, 0.05);
    }
    .main-dropdown {
        position: absolute;
        top: 100%;
        left: 0;
        margin-top: 6px;
        width: fit-content;
        max-width: 200px;
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
    }
    .icon-dropdown {
        width: 15px;
        height: 15px;
        margin: 0 0 -3px 0;
        fill: none;
        stroke-width: 2.4px;
        stroke-linejoin: round;
    }
    .open .icon-dropdown {
        transform: rotate(180deg);
    }

    .btn {
        padding: 0;
        display: inline-flex;
        border: none;
        border-radius: 50px;
        cursor: pointer;
        transition: .2s;
        overflow: hidden;
        font-family: 'Inter', sans-serif;
    }
    .btn:hover {
        background-image: linear-gradient(to bottom, rgba(255,255,255,0.12), rgba(255,255,255,0.12));
    }
    .btn.dark-txt {
        color: rgba(0, 0, 0, 0.9);
    }
    .btn.light-txt {
        color: rgba(255, 255, 255, 0.9);
    }
    .main-text {
        padding: 8.5px 14px 9px 12px;
        font-weight: 500;
    }
    .main-icon {
        width: 18px;
        height: 18px;
        padding: 8px 6px 13px 8px;
        border-right: solid 2px rgba(0, 0, 0, 0.025);
        margin: 0 -2px -5px 0;
    }
</style>