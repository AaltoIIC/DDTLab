<script lang="ts">
    import { onMount } from 'svelte';
    import Portal from "svelte-portal";
    import {
        currentNodes
    } from '$lib/stores/stores';
    import { writable } from 'svelte/store';
    
    export let id;
    
    // handle deletion
    const deleteElement = () => {
        isOpen = false;
        isEditing = false;
        currentNodes.update(nodes => {
            return nodes.filter(node => node.id !== id);
        })
    }

    // handle layover behavior (position, visibility, etc.)
    let onHover = false;
    let isOpen = false;
    let isEditing = false;
    let x = writable<number>(0);
    let y = writable<number>(0);
    export const show = (parentX: number, parentY: number) => {
        x.set(parentX);
        y.set(parentY);

        isEditing = true;
    }
    export let nodeOnHover = false;
    $: isOpen = ($x !== 0) && (isEditing || nodeOnHover || onHover);

    export const nodeClick = () => {isEditing = true;}

    const handleMouseMove = (event: any) => {
        if (isEditing) return;
        x.set(event.clientX);
        y.set(event.clientY);
    };

    // update transform based on the position of the layover
    const transform = ['0', '0'];
    x.subscribe(value => {
        if (value > window.innerWidth/2) {
            transform[0] = 'calc(-100% - 15px)';
        } else {
            transform[0] = '15px';
        }
    });
    y.subscribe(value => {
        if (value > window.innerHeight/2) {
            transform[1] = 'calc(-100% - 15px)';
        } else {
            transform[1] = '15px';
        }
    });

    const closeLayover = () => {
        isOpen = false;
        isEditing = false;
    }
    
    const handleClickOutside = (event: any) => {
        if (onHover || nodeOnHover) return;
        closeLayover();
    };

    const handleKeydown = (event: any) => {
        if (event.key === 'Escape') {
            closeLayover();
        }
    };

    onMount(() => {
        window.addEventListener('mousemove', handleMouseMove);
        document.addEventListener('pointerdown', handleClickOutside);
        document.addEventListener('dragstart', closeLayover);
        document.addEventListener('keydown', handleKeydown);

        const flowEditor = document.querySelector('.svelte-flow__pane');
        if (flowEditor) {
            flowEditor.addEventListener('wheel', closeLayover);
        }

        return () => {
            window.removeEventListener('mousemove', handleMouseMove);
            document.removeEventListener('pointerdown', handleClickOutside);
            document.removeEventListener('dragstart', closeLayover);
            document.removeEventListener('keydown', handleKeydown);
            flowEditor?.removeEventListener('wheel', closeLayover);
        };
    });

</script>
<Portal target="body">
    <!-- svelte-ignore a11y-no-static-element-interactions -->
    <div class="main-layover-cont {isOpen ? 'active' : ''}"
        style={`top: ${$y}px;
                left: ${$x}px;
                border: ${isEditing ? 'solid 1px var(--main-color)' : 'solid 1px rgba(0, 0, 0, 0.06)'};
                transform: translate(${transform[0]},${transform[1]});
            `}
        on:mouseenter={() => {onHover = true}}
        on:mouseleave={() => {onHover = false}}>
        <div class="name-cont {isEditing ? 'editing' : ''}">
            <!-- svelte-ignore a11y-click-events-have-key-events -->
            <svg
                on:click={deleteElement}
                xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="size-6">
                <path stroke-linecap="round" stroke-linejoin="round" d="m14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 0 1 3.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 0 0-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 0 0-7.5 0" />
            </svg>          
        </div>
        <button class="close-btn"
            on:click={() => {closeLayover()}}
            style="display: {isEditing ? 'block' : 'none'};">
            Done
        </button>
    </div>
</Portal>
<style>
    .name-cont.editing svg {
        display: block;
    }
    .name-cont svg {
        cursor: pointer;
        width: 14px;
        height: 14px;
        padding: 4px;
        border-radius: 50px;
        background-color: rgba(0, 0, 0, 0.1);
        border: solid 1px rgba(255, 255, 255, 0.2);
        color: rgba(0, 0, 0, 0.4);
        display: none;
    }
    .name-cont svg:hover {
        background-color:  rgb(240, 100, 100);
        color: rgba(255, 255, 255, 0.9)
    }
    .close-btn {
        width: 100%;
        padding: 8px;
        background-color: var(--main-color);
        color: white;
        border: none;
        font-family: 'Inter', sans-serif;
        font-size: 12px;
        cursor: pointer;
        border-radius: 0 0 var(--main-border-radius) var(--main-border-radius);
    }
    .close-btn:hover {
        filter: brightness(1.05);
    }
    .name-cont {
        padding: 8px 12px;
        border-top-left-radius: 5px;
        border-top-right-radius: 5px;
        font-weight: 600;
        display: flex;
        justify-content: space-between;
    }
    .main-layover-cont {
        display: none;
        position: absolute;
        width: 268px;
        height: fit-content;
        background-color: white;
        border: solid 1px rgba(0, 0, 0, 0.06);
        z-index: 1000000;
        font-family: 'Inter', sans-serif;
        font-size: 14px;
        color: rgba(0, 0, 0, 0.9);
        border-radius: var(--main-border-radius);
    }
    .main-layover-cont.active {
        display: block;
    }

    @media (max-width: 1048px) {
        .main-layover-cont {
            display: none !important;
        }
    }
</style>