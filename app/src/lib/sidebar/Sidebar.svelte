<script lang="ts">
    import { goto } from "$app/navigation";
    import MenuOption from "$lib/sidebar/MenuOption.svelte";
    import { currentNodes } from "$lib/stores/stores";
    import { nameElement } from "$lib/helpers";
    import { type ElementDataType } from "$lib/types/types";

    const handleAdd = (option: string) => {
        if (option === 'Component') {
            currentNodes.update((nodes) => {
                return [...nodes, {
                    id: nameElement('component'),
                    type: 'Element',
                    position: { x: 30, y: 30 },
                    data: {
                        element: {
                            connectors: []
                        } as ElementDataType
                    },
                    parentId: 'root'
                }];
            });
        } else if (option === 'System') {
            currentNodes.update((nodes) => {
                return [...nodes, {
                    id: nameElement('system'),
                    type: 'Element',
                    position: { x: 30, y: 30 },
                    data: {
                        element: {
                            connectors: []
                        } as ElementDataType
                    },
                    parentId: 'root'
                }];
            });
        }
    }
</script>
<div class="main-sidebar no-tailwind">
    <div class="top-buttons">
        <button class="menu-option-logo" on:click={() => {goto('/')}}>
            <div class="logo-cont">
                <img class="logo-icon" src="/icon.svg" alt="Home" />
            </div>
        </button>
        <button class="menu-option" aria-label="Back"
            on:click={() => {goto('/')}}>
            <svg class="option-icon back" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.2" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" d="M15.75 19.5 8.25 12l7.5-7.5" />
            </svg>                   
        </button>
        <MenuOption
            options={['Component', 'System']}
            optionIcons={[
                '<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="M5.25 7.5A2.25 2.25 0 0 1 7.5 5.25h9a2.25 2.25 0 0 1 2.25 2.25v9a2.25 2.25 0 0 1-2.25 2.25h-9a2.25 2.25 0 0 1-2.25-2.25v-9Z" /></svg>',
                '<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="M3.75 6A2.25 2.25 0 0 1 6 3.75h2.25A2.25 2.25 0 0 1 10.5 6v2.25a2.25 2.25 0 0 1-2.25 2.25H6a2.25 2.25 0 0 1-2.25-2.25V6ZM3.75 15.75A2.25 2.25 0 0 1 6 13.5h2.25a2.25 2.25 0 0 1 2.25 2.25V18a2.25 2.25 0 0 1-2.25 2.25H6A2.25 2.25 0 0 1 3.75 18v-2.25ZM13.5 6a2.25 2.25 0 0 1 2.25-2.25H18A2.25 2.25 0 0 1 20.25 6v2.25A2.25 2.25 0 0 1 18 10.5h-2.25a2.25 2.25 0 0 1-2.25-2.25V6ZM13.5 15.75a2.25 2.25 0 0 1 2.25-2.25H18a2.25 2.25 0 0 1 2.25 2.25V18A2.25 2.25 0 0 1 18 20.25h-2.25A2.25 2.25 0 0 1 13.5 18v-2.25Z" /></svg>'
            ]}
            onClick={handleAdd}
            icon={`<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.2" stroke="currentColor" class="size-6">
                <path stroke-linecap="round" stroke-linejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
            </svg>`}
        />
        <button class="menu-option" aria-label="Download">
            <svg class="option-icon download" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.2" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" d="M3 16.5v2.25A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75V16.5M16.5 12 12 16.5m0 0L7.5 12m4.5 4.5V3" />
            </svg>                   
        </button>
    </div>
    <div class="bottom-buttons">
        <button class="menu-option" aria-label="Report bug">
            <svg class="option-icon report" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.2" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" d="M12 9v3.75m9-.75a9 9 0 1 1-18 0 9 9 0 0 1 18 0Zm-9 3.75h.008v.008H12v-.008Z" />
            </svg>              
        </button>
    </div>
</div>
<style>
    .main-sidebar {
        all: unset;
        position: fixed;
        top: 15px;
        left: 15px;
        width: 68px;
        height: calc(100vh - 30px);
        background-color: white;
        border: var(--main-border);
        border-radius: var(--main-border-radius);
        z-index: 100;
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: space-between;
        padding: 12px 0;
        box-sizing: border-box;
    }
    .top-buttons {
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: flex-start;
    }
    .bottom-buttons {
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: flex-end;
    }
    .menu-option {
        border: none;
        background: none;
        cursor: pointer;
        width: 68px;
        height: 42px;
    }
    .menu-option-logo {
        border: none;
        background: none;
        cursor: pointer;
        width: 68px;
        height: 42px;
        margin-bottom: 12px;
        position: relative;
        display: flex;
        align-items: center;
        justify-content: center;
    }
    .logo-icon {
        width: 22px;
        height: 22px;
        filter: brightness(10);
        opacity: 0.9;
    }
    .logo-cont {
        background-color: var(--main-dark-color);
        border-radius: var(--main-border-radius);
        width: 42px;
        height: 42px;
        display: flex;
        align-items: center;
        justify-content: center;
    }
    .option-icon {
        width: 20px;
        height: 20px;
        color: rgba(0, 0, 0, 0.9);
        display: inline;
    }
    .bottom-buttons {
        background-color: var(--main-dark-color);
        border-radius: var(--main-border-radius);
        width: 42px;
    }
    .bottom-buttons .option-icon {
        color: rgba(255, 255, 255, 0.9);
    }
</style>