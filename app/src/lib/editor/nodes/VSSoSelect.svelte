<script lang="ts">
    import { run } from 'svelte/legacy';

    import {
        useSvelteFlow
    } from '@xyflow/svelte';
    import VSSo from "../VSSo.json";
    import { Input } from "$lib/components/ui/input";
    import { onMount } from "svelte";
    import { currentNodes } from '$lib/stores/stores';

    interface Props {
        id: string;
        type?: 'element' | 'connector';
        currentClass?: string | null;
        onChange?: (value: string) => void;
    }

    let {
        id,
        type = 'element',
        currentClass = $bindable(null),
        onChange
    }: Props = $props();

    let isPopoverOpen = $state(false);

    // Make node only draggable when popover is closed
    run(() => {
        if (isPopoverOpen) {
            currentNodes.update((nodes) => {
                return nodes.map((node) => {
                    if (node.id === id && node.dragHandle !== '.none') {
                        return {...node, dragHandle: '.none'};
                    }
                    return node;
                });
            });
        } else {
            currentNodes.update((nodes) => {
                return nodes.map((node) => {
                    if (node.id === id && node.dragHandle !== '.element-node-inner') {
                        return {...node, dragHandle: '.element-node-inner'};
                    }
                    return node;
                });
            });
        }
    });

    let currentSearch: string = $state("");

    const classes = (type === 'element' ? Object.keys(VSSo.elementTypes) :
        Object.values(VSSo.elementTypes).flat());

    let shownClasses: string[] = $state(classes);
    const updateResults = () => {
        shownClasses = classes.filter((VSSoClass) => {
            return VSSoClass.toLowerCase().includes(currentSearch.toLowerCase());
        });
    }

    const selectClass = (VSSoClass: string) => {
        currentClass = VSSoClass;
        isPopoverOpen = false;
        onChange?.(VSSoClass);
    }

    currentNodes.subscribe((value) => {
        const node = value.find((node) => node.id === id);
        if (node) {
            if (type === 'element') {
                currentClass = (node.data as any).element.VSSoClass;
            }
            
        }
    });

    // Make popover element compensate for zoom level
    const { viewport } = useSvelteFlow();
    let zoomLevel = $state(1);
    if (type === 'element') {
        viewport.subscribe((value) => {
            zoomLevel = value.zoom;
        });
    }

    // Make scroll work in popover
    let selectOnHover = $state(false);
    let listOnHover = $state(false);

    onMount(() => {
        document.addEventListener('pointerdown', (e) => {
            if (!selectOnHover) {
                isPopoverOpen = false;
            }
        });

        const flowEditor = document.querySelector('.svelte-flow__pane');
        if (flowEditor) {
            flowEditor.addEventListener('wheel', (e) => {
                if (listOnHover) {
                    e.stopPropagation();
                } else {
                    isPopoverOpen = false;
                }
            });
        }
    });
</script>
    <!-- svelte-ignore a11y_no_static_element_interactions -->
<div class="select-outer {type}"
    onmouseenter={() => selectOnHover = true}
    onmouseleave={() => selectOnHover = false}>
    <button class="main-class-cont border-input border rounded-md bg-background text-sm h-8"
        onclick={() => isPopoverOpen = !isPopoverOpen}>
        <span>
            {currentClass ? currentClass : "Select Type..."}
        </span>
        <svg class="icon-updown" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" d="M8.25 15 12 18.75 15.75 15m-7.5-6L12 5.25 15.75 9" />
        </svg>      
    </button>
    <div class="main-popover {isPopoverOpen ? 'open' : ''} shadow-md"
        style:transform="scale({1/zoomLevel}) translate(-50%, 0)">
        <Input
            type="text"
            class="h-8"
            bind:value={currentSearch}
            on:input={updateResults}
            placeholder="Search types..." 
        />
        <!-- svelte-ignore a11y_no_static_element_interactions -->
        <div class="main-class-list"
            onmouseenter={() => listOnHover = true}
            onmouseleave={() => listOnHover = false}>
            {#if shownClasses.length === 0}
                <span class="no-classes">No classes found</span>
            {:else}
                {#each shownClasses as VSSoClass}
                    <button onclick={() => {selectClass(VSSoClass)}}>{VSSoClass}</button>
                {/each}
            {/if}
        </div>
    </div>
</div>

<style>
    .main-class-list {
        display: flex;
        flex-direction: column;
        max-height: 180px;
        overflow-y: scroll;
        overflow-x: hidden;
        margin-top: 12px;
    }
    .main-class-list button {
        flex-shrink: 0;
        width: calc(100% - 2px);
        font-size: 14px;
        color: rgba(0, 0, 0, 9);
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
        line-height: 1.5;
        padding: 5px 8px;
        border-radius: var(--main-border-radius);
        cursor: pointer;
        transition: color .2s;
        text-align: left;
    }
    .main-class-list button:nth-of-type(odd) {
        background: var(--list-dark-color);
    }
    .main-class-list button:hover {
        color: rgb(0, 0, 0);
    }
    .no-classes {
        background: none;
        color: rgba(0, 0, 0, 0.5);
        padding: 10px 0;
        font-size: 14px;
        text-align: center;
    }
    .main-popover {
        border-radius: var(--main-border-radius);
        border: var(--main-border);
        padding: 9px;
        width: 264px;
        height: fit-content;
        background: white;
        position: absolute;
        top: 100%;
        left: 50%;
        margin-top: 6px;
        transform-origin: top left;
        opacity: 0;
        transition: opacity .3s;
        pointer-events: none;
        z-index: 9;
    }
    .main-popover.open {
        display: block;
        opacity: 1;
        pointer-events: all;
    }

    .select-outer {
        position: relative;
        display: flex;
        flex-direction: column;
    }

    .main-class-cont {
        background: white;
        font-size: 14px;
        color: rgba(0, 0, 0, 0.9);
        border-radius: 5px;
        padding: 0.5rem 0.625rem;
        box-sizing: border-box;
        width: 100%;
        margin: 0;
        display: flex;
        justify-content: space-between;
        align-items: center;
        flex-wrap: nowrap;
        cursor: pointer;
        transition: background .2s;
    }
    .element .main-class-cont {
        font-weight: 550;
    }

    .main-class-cont:hover {
        background: var(--main-hover-color);
    }
    .main-class-cont span {
        flex-grow: 0;
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
    }
    .icon-updown {
        width: 20px;
        height: 20px;
        color: rgba(0, 0, 0, 0.5);
        flex-shrink: 0;
        margin-right: -2.5px;
    }
</style>
