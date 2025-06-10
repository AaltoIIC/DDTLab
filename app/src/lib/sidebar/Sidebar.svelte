<script lang="ts">
    import { goto } from "$app/navigation";
    import MenuOption from "$lib/sidebar/MenuOption.svelte";
    import {
        currentNodes,
        addToHistory,
        currentSystemMeta,
        createSystem,
        createSubsystem,
    } from "$lib/stores/stores";
    import { nameElement, makeValidFileName } from "$lib/helpers";
    import { type ElementDataType } from "$lib/types/types";
    import ReqsPopover from "./requirements/ReqsPopover.svelte";
    import TestScenariosPopover from './testScenarios/TestScenariosPopover.svelte';
    import {
        convertToTTL,
        convertToSSD
    } from "./conversions";
    import Tooltip from "$lib/Tooltip.svelte";
    import type { SubsystemDataType } from "$lib/types/types";  

    let isReqsOpen = false;
    let isAddDropdownOpen = false;
    let isDownloadDropdownOpen = false;
    let isTestScenariosOpen = false;

    const downloadFile = (format: string) => {
        let content = '';
        let filename = '';

        if (format === 'TTL') {
            content = convertToTTL();
            filename = `${makeValidFileName($currentSystemMeta.name)}.ttl`;
        } else if (format === 'SSD') {
            content = convertToSSD();
            filename = `${makeValidFileName($currentSystemMeta.name)}.ssd`;
        }

        const blob = new Blob([content], { type: 'text/plain' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    }

    const handleAdd = (option: string) => {
        if (option === 'Component') {
            currentNodes.update((nodes) => {
                return [...nodes, {
                    id: nameElement('component'),
                    type: 'Element',
                    position: { x: 30, y: 30 },
                    data: {
                        element: {
                            type: 'component',
                            VSSoClass: null,
                            connectors: []
                        } as ElementDataType
                    },
                    dragHandle: '.element-node-inner',
                    parentId: 'root'
                }];
            });
            addToHistory();
        } else if (option === 'System') {
            currentNodes.update((nodes) => {
                const nodeId = nameElement('system');
                const subsystem = createSubsystem($currentSystemMeta.id, nodeId);

                const elementData: SubsystemDataType = {
                    type: 'system',
                    VSSoClass: null,
                    connectors: [],
                    subsystemId: subsystem.id,
                    hasSubsystems: true,
                };

                return [...nodes, {
                    id: nodeId,
                    type: 'Element',
                    position: { x: 30, y: 30 },
                    data: {
                        element: elementData
                    },
                    dragHandle: '.element-node-inner',
                    parentId: 'root'
                }];
            });
            addToHistory();
        }
    }
</script>
<div class="main-sidebar shadow-sm">
    <div class="top-buttons">
        <Tooltip text="Home" position="right">
            <button class="menu-option-logo" on:click={() => {goto('/')}}>
                <div class="logo-cont">
                    <img class="logo-icon" src="/icon.svg" alt="Home" />
                </div>
            </button>
        </Tooltip>
        <Tooltip text="Back to Dashboard" position="right">
            <button class="menu-option" aria-label="Back"
                on:click={() => {goto('/')}}>
                <svg class="option-icon back" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.2" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" d="M15.75 19.5 8.25 12l7.5-7.5" />
                </svg>                   
            </button>
        </Tooltip>
        <Tooltip text="Add Component/System" position="right" disabled={isAddDropdownOpen}>
            <MenuOption
                options={['Component', 'System']}
                optionIcons={[
                    '<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="M5.25 7.5A2.25 2.25 0 0 1 7.5 5.25h9a2.25 2.25 0 0 1 2.25 2.25v9a2.25 2.25 0 0 1-2.25 2.25h-9a2.25 2.25 0 0 1-2.25-2.25v-9Z" /></svg>',
                    '<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="M3.75 6A2.25 2.25 0 0 1 6 3.75h2.25A2.25 2.25 0 0 1 10.5 6v2.25a2.25 2.25 0 0 1-2.25 2.25H6a2.25 2.25 0 0 1-2.25-2.25V6ZM3.75 15.75A2.25 2.25 0 0 1 6 13.5h2.25a2.25 2.25 0 0 1 2.25 2.25V18a2.25 2.25 0 0 1-2.25 2.25H6A2.25 2.25 0 0 1 3.75 18v-2.25ZM13.5 6a2.25 2.25 0 0 1 2.25-2.25H18A2.25 2.25 0 0 1 20.25 6v2.25A2.25 2.25 0 0 1 18 10.5h-2.25a2.25 2.25 0 0 1-2.25-2.25V6ZM13.5 15.75a2.25 2.25 0 0 1 2.25-2.25H18a2.25 2.25 0 0 1 2.25 2.25V18A2.25 2.25 0 0 1 18 20.25h-2.25A2.25 2.25 0 0 1 13.5 18v-2.25Z" /></svg>'
                ]}
                onClick={handleAdd}
                bind:isOpen={isAddDropdownOpen}
                icon={`<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.2" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                </svg>`}
            />
        </Tooltip>
        <Tooltip text="Manage Requirements" position="right">
            <button class="menu-option" aria-label="Add requirements"
                on:click={() => {isReqsOpen = !isReqsOpen}}>
                <svg class="option-icon req {isReqsOpen ? 'active' : ''}" width="23" height="14" viewBox="0 0 23 14" fill="none" xmlns="http://www.w3.org/2000/svg" stroke-width="1.2" stroke="currentColor">
                    <path d="M9.875 1.375H21.875M11.0742 6.625H21.875M9.875 11.875H21.875" stroke-linecap="round" stroke-linejoin="round"/>
                    <path d="M1 11L3.25 13.25L7 8" stroke-linecap="round" stroke-linejoin="round"/>
                </svg>                                                            
            </button>
        </Tooltip>
        <Tooltip text="Test Scenarios" position="right">
            <button class="menu-option" aria-label="Test Scenarios"
                on:click={() => {isTestScenariosOpen = !isTestScenariosOpen}}>
            <svg class="option-icon test-scenarios {isTestScenariosOpen ? 'active' : ''}" width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" stroke-width="1.5" stroke="currentColor">
                <path d="M5 3l14 9-14 9V3z" stroke-linecap="round" stroke-linejoin="round"/>
            </svg>
            </button>
        </Tooltip>
    </div>
    <div class="bottom-buttons">
        <Tooltip text="Download TTL/SSD" position="right" disabled={isDownloadDropdownOpen}>
            <MenuOption
                options={['TTL', 'SSD']}
                optionIcons={[
                    '<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="M10.125 2.25h-4.5c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125v-9M10.125 2.25h.375a9 9 0 0 1 9 9v.375M10.125 2.25A3.375 3.375 0 0 1 13.5 5.625v1.5c0 .621.504 1.125 1.125 1.125h1.5a3.375 3.375 0 0 1 3.375 3.375M9 15l2.25 2.25L15 12" /></svg>',
                    '<svg viewBox="-3 -1 23 23" fill="none" xmlns="http://www.w3.org/2000/svg" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M16 13V10.375C16 9.47989 15.6444 8.62145 15.0115 7.98851C14.3786 7.35558 13.5201 7 12.625 7H11.125C10.8266 7 10.5405 6.88147 10.3295 6.6705C10.1185 6.45952 10 6.17337 10 5.875V4.375C10 3.47989 9.64442 2.62145 9.01149 1.98851C8.37855 1.35558 7.52011 1 6.625 1H4.75M7 1H2.125C1.504 1 1 1.504 1 2.125V19.375C1 19.996 1.504 20.5 2.125 20.5H14.875C15.496 20.5 16 19.996 16 19.375V10C16 7.61305 15.0518 5.32387 13.364 3.63604C11.6761 1.94821 9.38695 1 7 1Z" /><path d="M10.75 11L13 13.25L10.75 15.5M6.25 15.5L4 13.25L6.25 11" /></svg>'
                ]}
                onClick={downloadFile}
                bind:isOpen={isDownloadDropdownOpen}
                icon={`<svg class="option-icon download" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.2" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" d="M3 16.5v2.25A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75V16.5M16.5 12 12 16.5m0 0L7.5 12m4.5 4.5V3" />
                </svg>  `}
                iconColor="white"
            />
        </Tooltip>
        <Tooltip text="Report Bug" position="right">
            <a href="https://github.com/AaltoIIC/DDTLab/issues"
                aria-label="Report bug" target="_blank">
                <button class="menu-option" aria-label="Report bug">
                    <svg class="option-icon report" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.2" stroke="currentColor">
                        <path stroke-linecap="round" stroke-linejoin="round" d="M12 9v3.75m9-.75a9 9 0 1 1-18 0 9 9 0 0 1 18 0Zm-9 3.75h.008v.008H12v-.008Z" />
                    </svg>              
                </button>
            </a>
        </Tooltip>
    </div>
</div>
<ReqsPopover bind:isOpen={isReqsOpen} />
  {#if isTestScenariosOpen}
      <TestScenariosPopover onclose={() => isTestScenariosOpen = false} />
  {/if}
<style>
    .main-sidebar {
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
        width: 42px;
        height: 42px;
    }
    .menu-option-logo {
        border: none;
        background: none;
        cursor: pointer;
        width: 42px;
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
    .option-icon.req.active {
        stroke-width: 1.5;
    }
    .bottom-buttons {
        background-color: var(--main-dark-color);
        border-radius: var(--main-border-radius);
        width: 42px;
        border-radius: 50px;
        border: var(--main-border);
    }
    .bottom-buttons .option-icon {
        color: rgba(255, 255, 255, 0.9);
    }
</style>