<script lang="ts">
    import { goto } from "$app/navigation";
    import MenuOption from "$lib/sidebar/MenuOption.svelte";
    import {
        currentNodes,
        currentEdges,
        currentReqs,
        addToHistory,
        currentSystemMeta,
        createSystem,
        createSubsystem,
        saveSystem,
    } from "$lib/stores/stores.svelte";
    import { nameElement, generateId, makeValidFileName } from "$lib/helpers";
    import { type ElementDataType } from "$lib/types/types";
    import ReqsPopover from "./requirements/ReqsPopover.svelte";
    import TestScenariosPopover from './testScenarios/TestScenariosPopover.svelte';
    import FMIComponentsPopover from '$lib/fmi/FMIComponentsPopover.svelte';
    import {
        convertToTTL,
        convertToSSD,
        parseTTLToRequirements
    } from "./conversions";
    import { parseSSDFile, isValidSSD } from "$lib/importers/ssdParser";
    import Tooltip from "$lib/Tooltip.svelte";
    import type { SubsystemDataType } from "$lib/types/types";
    import JSZip from 'jszip';  

    let isReqsOpen = $state(false);
    let isAddDropdownOpen = $state(false);
    let isDownloadDropdownOpen = $state(false);
    let isUploadDropdownOpen = $state(false);
    let isTestScenariosOpen = $state(false);
    let isFMIOpen = $state(false);

    let ttlFileInput: HTMLInputElement;
    let ssdFileInput: HTMLInputElement;

    const downloadFile = async (format: string) => {
        let content = '';
        let filename = '';

        try {
            if (format === 'TTL') {
                content = await convertToTTL();
                filename = `${makeValidFileName($currentSystemMeta.name)}.ttl`;
            } else if (format === 'SSD') {
                content = convertToSSD();
                filename = `${makeValidFileName($currentSystemMeta.name)}.ssd`;
            } else if (format === 'ZIP') {
                // Generate both SSD and TTL files
                const ssdContent = convertToSSD();
                const ttlContent = await convertToTTL();

                // Create a new JSZip instance
                const zip = new JSZip();

                // Add both files to the ZIP
                const baseName = makeValidFileName($currentSystemMeta.name);
                zip.file(`${baseName}.ssd`, ssdContent);
                zip.file(`${baseName}.ttl`, ttlContent);

                // Generate the ZIP file
                const zipBlob = await zip.generateAsync({ type: 'blob' });
                const url = URL.createObjectURL(zipBlob);
                const a = document.createElement('a');
                a.href = url;
                a.download = `${baseName}.zip`;
                document.body.appendChild(a);
                a.click();
                document.body.removeChild(a);
                URL.revokeObjectURL(url);
                return;
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
        } catch (error) {
            console.error('Error downloading file:', error);
            alert(`Failed to generate ${format} file: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    }

    const handleUpload = (type: string) => {
        if (type === 'TTL') {
            ttlFileInput.click();
        } else if (type === 'SSD') {
            ssdFileInput.click();
        }
    }

    const handleTTLUpload = async (event: Event) => {
        const target = event.target as HTMLInputElement;
        const file = target.files?.[0];

        if (!file) return;

        try {
            const content = await file.text();
            const parsedRequirements = await parseTTLToRequirements(content);

            // Add parsed requirements to current requirements
            currentReqs.update(reqs => [...reqs, ...parsedRequirements]);
            addToHistory();

            console.log(`Successfully imported ${parsedRequirements.length} requirement(s)`);
            alert(`Successfully imported ${parsedRequirements.length} requirement(s) from TTL file`);

            // Reset file input
            target.value = '';
        } catch (error) {
            console.error('Error uploading TTL file:', error);
            alert(`Failed to parse TTL file: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    }

    const handleSSDUpload = async (event: Event) => {
        const target = event.target as HTMLInputElement;
        const file = target.files?.[0];

        if (!file) return;

        try {
            const content = await file.text();

            // Validate SSD file
            if (!isValidSSD(content)) {
                throw new Error('Invalid SSD file format');
            }

            // Parse SSD file
            const { nodes, edges, systemName } = parseSSDFile(content);

            console.log('Parsed SSD file:', {
                systemName,
                nodeCount: nodes.length,
                edgeCount: edges.length,
                nodes: nodes.map(n => ({ id: n.id, name: n.data.name, position: n.position })),
                edges: edges.map(e => ({ id: e.id, source: e.source, target: e.target }))
            });

            // Validate parsed data
            if (nodes.length === 0) {
                throw new Error('No components found in SSD file');
            }

            // Update stores in sequence to avoid race conditions
            // First update metadata
            currentSystemMeta.update(meta => ({
                ...meta,
                name: systemName
            }));

            // Small delay to ensure metadata update completes
            await new Promise(resolve => setTimeout(resolve, 10));

            // Then update nodes and edges
            currentNodes.set(nodes);
            currentEdges.set(edges);

            // Add to history after a small delay to ensure renders complete
            setTimeout(() => {
                addToHistory();
            }, 50);

            console.log(`Successfully imported system: ${systemName}`);
            alert(`Successfully imported system "${systemName}"\n${nodes.length - 1} components\n${edges.length} connections`);

            // Reset file input
            target.value = '';
        } catch (error) {
            console.error('Error uploading SSD file:', error);
            alert(`Failed to parse SSD file: ${error instanceof Error ? error.message : 'Unknown error'}`);

            // Reset file input even on error
            target.value = '';
        }
    }

    const handleAdd = (option: string) => {
        const nodesLength = $currentNodes.length - 1;
        if (option === 'Component') {
            currentNodes.update((nodes) => {
                return [...nodes, {
                    id: generateId($currentNodes.map(n => n.id)),
                    type: 'Element',
                    position: { x: 30, y: 30 + nodesLength * 100 },
                    data: {
                        name: nameElement('component'),
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
        } else if (option === 'Sub-System') {
            const nodeId = generateId($currentNodes.map(n => n.id));
            const sysName = nameElement('subsystem');
            const subsystem = createSubsystem($currentSystemMeta.id, nodeId, sysName);

            const elementData: SubsystemDataType = {
                type: 'system',
                VSSoClass: null,
                connectors: [],
                subsystemId: subsystem.id,
                hasSubsystems: true,
            };

            const node = {
                id: nodeId,
                type: 'Element',
                position: { x: 30, y: 30 + nodesLength * 100 },
                data: {
                    name: sysName,
                    element: elementData
                },
                dragHandle: '.element-node-inner',
                parentId: 'root'
            };

            currentNodes.update((nodes) => {
                return [...nodes, node];
            });
            addToHistory();
        }
    }
</script>
<div class="main-sidebar shadow-sm">
    <div class="top-buttons">
        <Tooltip text="Home" position="right">
            <button class="menu-option-logo" onclick={() => {goto('/')}}>
                <div class="logo-cont">
                    <img class="logo-icon" src="/icon.svg" alt="Home" />
                </div>
            </button>
        </Tooltip>
        <Tooltip text="Back to Dashboard" position="right">
            <button class="menu-option" aria-label="Back"
                onclick={() => {goto('/')}}>
                <svg class="option-icon back" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.2" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" d="M15.75 19.5 8.25 12l7.5-7.5" />
                </svg>                   
            </button>
        </Tooltip>
        <Tooltip text="Add Component/System" position="right" disabled={isAddDropdownOpen}>
            <MenuOption
                options={['Component', 'Sub-System']}
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
                onclick={() => {isReqsOpen = !isReqsOpen}}>
                <svg class="option-icon req {isReqsOpen ? 'active' : ''}" width="23" height="14" viewBox="0 0 23 14" fill="none" xmlns="http://www.w3.org/2000/svg" stroke-width="1.2" stroke="currentColor">
                    <path d="M9.875 1.375H21.875M11.0742 6.625H21.875M9.875 11.875H21.875" stroke-linecap="round" stroke-linejoin="round"/>
                    <path d="M1 11L3.25 13.25L7 8" stroke-linecap="round" stroke-linejoin="round"/>
                </svg>                                                            
            </button>
        </Tooltip>
        <Tooltip text="Test Scenarios" position="right">
            <button class="menu-option" aria-label="Test Scenarios"
                onclick={() => {isTestScenariosOpen = !isTestScenariosOpen}}>
            <svg class="option-icon test-scenarios {isTestScenariosOpen ? 'active' : ''}" width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" stroke-width="1.5" stroke="currentColor">
                <path d="M5 3l14 9-14 9V3z" stroke-linecap="round" stroke-linejoin="round"/>
            </svg>
            </button>
        </Tooltip>
        <Tooltip text="FMI Components" position="right">
            <button class="menu-option" aria-label="FMI Components"
                onclick={() => {isFMIOpen = !isFMIOpen}}>
                <svg class="option-icon fmi {isFMIOpen ? 'active' : ''}" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.2" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" d="M20.25 6.375c0 2.278-3.694 4.125-8.25 4.125S3.75 8.653 3.75 6.375m16.5 0c0-2.278-3.694-4.125-8.25-4.125S3.75 4.097 3.75 6.375m16.5 0v11.25c0 2.278-3.694 4.125-8.25 4.125s-8.25-1.847-8.25-4.125V6.375m16.5 0v3.75m-16.5-3.75v3.75m16.5 0v3.75C20.25 16.153 16.556 18 12 18s-8.25-1.847-8.25-4.125v-3.75m16.5 0c0 2.278-3.694 4.125-8.25 4.125s-8.25-1.847-8.25-4.125" />
                </svg>
            </button>
        </Tooltip>
    </div>
    <div class="bottom-buttons">
        <Tooltip text="Upload TTL/SSD" position="right" disabled={isUploadDropdownOpen}>
            <MenuOption
                options={['TTL', 'SSD']}
                optionIcons={[
                    '<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="M10.125 2.25h-4.5c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125v-9M10.125 2.25h.375a9 9 0 0 1 9 9v.375M10.125 2.25A3.375 3.375 0 0 1 13.5 5.625v1.5c0 .621.504 1.125 1.125 1.125h1.5a3.375 3.375 0 0 1 3.375 3.375M9 15l2.25 2.25L15 12" /></svg>',
                    '<svg viewBox="-3 -1 23 23" fill="none" xmlns="http://www.w3.org/2000/svg" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M16 13V10.375C16 9.47989 15.6444 8.62145 15.0115 7.98851C14.3786 7.35558 13.5201 7 12.625 7H11.125C10.8266 7 10.5405 6.88147 10.3295 6.6705C10.1185 6.45952 10 6.17337 10 5.875V4.375C10 3.47989 9.64442 2.62145 9.01149 1.98851C8.37855 1.35558 7.52011 1 6.625 1H4.75M7 1H2.125C1.504 1 1 1.504 1 2.125V19.375C1 19.996 1.504 20.5 2.125 20.5H14.875C15.496 20.5 16 19.996 16 19.375V10C16 7.61305 15.0518 5.32387 13.364 3.63604C11.6761 1.94821 9.38695 1 7 1Z" /><path d="M10.75 11L13 13.25L10.75 15.5M6.25 15.5L4 13.25L6.25 11" /></svg>'
                ]}
                onClick={handleUpload}
                bind:isOpen={isUploadDropdownOpen}
                icon={`<svg class="option-icon upload" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.2" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" d="M3 16.5v2.25A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75V16.5m-13.5-9L12 3m0 0 4.5 4.5M12 3v13.5" />
                </svg>`}
                iconColor="white"
            />
        </Tooltip>
        <input
            type="file"
            accept=".ttl"
            bind:this={ttlFileInput}
            onchange={handleTTLUpload}
            style="display: none;"
        />
        <input
            type="file"
            accept=".ssd,.xml"
            bind:this={ssdFileInput}
            onchange={handleSSDUpload}
            style="display: none;"
        />
        <Tooltip text="Download TTL/SSD/ZIP" position="right" disabled={isDownloadDropdownOpen}>
            <MenuOption
                options={['TTL', 'SSD', 'ZIP']}
                optionIcons={[
                    '<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="M10.125 2.25h-4.5c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125v-9M10.125 2.25h.375a9 9 0 0 1 9 9v.375M10.125 2.25A3.375 3.375 0 0 1 13.5 5.625v1.5c0 .621.504 1.125 1.125 1.125h1.5a3.375 3.375 0 0 1 3.375 3.375M9 15l2.25 2.25L15 12" /></svg>',
                    '<svg viewBox="-3 -1 23 23" fill="none" xmlns="http://www.w3.org/2000/svg" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M16 13V10.375C16 9.47989 15.6444 8.62145 15.0115 7.98851C14.3786 7.35558 13.5201 7 12.625 7H11.125C10.8266 7 10.5405 6.88147 10.3295 6.6705C10.1185 6.45952 10 6.17337 10 5.875V4.375C10 3.47989 9.64442 2.62145 9.01149 1.98851C8.37855 1.35558 7.52011 1 6.625 1H4.75M7 1H2.125C1.504 1 1 1.504 1 2.125V19.375C1 19.996 1.504 20.5 2.125 20.5H14.875C15.496 20.5 16 19.996 16 19.375V10C16 7.61305 15.0518 5.32387 13.364 3.63604C11.6761 1.94821 9.38695 1 7 1Z" /><path d="M10.75 11L13 13.25L10.75 15.5M6.25 15.5L4 13.25L6.25 11" /></svg>',
                    '<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="M20.25 7.5l-.625 10.632a2.25 2.25 0 01-2.247 2.118H6.622a2.25 2.25 0 01-2.247-2.118L3.75 7.5M10 11.25h4M3.375 7.5h17.25c.621 0 1.125-.504 1.125-1.125v-1.5c0-.621-.504-1.125-1.125-1.125H3.375c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125z" /></svg>'
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
<FMIComponentsPopover bind:isOpen={isFMIOpen} />
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