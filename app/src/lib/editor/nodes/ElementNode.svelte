<script lang="ts">
    import { run } from 'svelte/legacy';

    import { useUpdateNodeInternals, useSvelteFlow } from '@xyflow/svelte';
    import Connectors from "./Connectors.svelte";
    import { type ElementDataType, type SubsystemDataType } from "$lib/types/types";
    import {
        isNameValid, generateId, nameElement, generateName
     } from "$lib/helpers";
    import {
        currentEdges,
        currentNodes,
        currentSystemMeta,
        currentReqs,
        addToHistory,
        navigateToSubsystem,
        isSubsystemNode,
        componentLinks,
        fmiComponents,
        createSubsystem,
        cloneSystem,
        getSystem,
        saveSystem,
        systems,
        removeSystem,
    } from "$lib/stores/stores.svelte";
    import VSSoSelect from "./VSSoSelect.svelte";
    import { onMount } from 'svelte';
    import { get } from 'svelte/store';
    import _ from 'lodash';

    const portal = (node: HTMLElement) => {
        // move the node into document.body
        document.body.appendChild(node);
        return {
            destroy() {
            // clean up when the node is removed
            node.parentNode?.removeChild(node);
            }
        };
    }


    let hover = $state(false);

    interface Props {
        id: string;
        data: {
        name: string;
        element: ElementDataType | SubsystemDataType;
    };
        [key: string]: any
    }

    let { id, data, ...rest }: Props = $props();

    const updateNodeInternals = useUpdateNodeInternals();
    run(() => {
        if (data) {
            updateNodeInternals(id);
        }
    });

    let currentName = $derived.by( () => {
        const syss = $systems;
        if (isSubsystemNode(data)) {
            const subsystem = syss.find( sys => sys.id === (data.element as SubsystemDataType).subsystemId );
            return  subsystem ? subsystem.name : data.name;
        }
        else {return data.name;}
    });

    // svelte-ignore state_referenced_locally
    let inputName = $state(currentName);

    let isNameError = $state(false);
    const validateName = () => {
        const nodeNames = get(currentNodes)
            .map(n => n.data?.name)
            .filter((name): name is string => typeof name === 'string');

    const systemNames = get(systems)
        .map(s => s.name)
        .filter((name): name is string => typeof name === 'string');

  const allNames = nodeNames.concat(systemNames);
        console.log(allNames)
        const isNameTaken = (inputName !== data.name) && allNames.some(name => name.replace(/\s+/g, '').toLowerCase() === inputName.replace(/\s+/g, '').toLowerCase());
        
        isNameError = !isNameValid(inputName) || isNameTaken;
    }

    const saveName = () => {
        if (!isNameError && inputName !== data.name) {
            currentNodes.update((nodes) => {
                const nodeIndex = nodes.findIndex((node) => node.data.name === data.name);
                nodes[nodeIndex].data.name = inputName;
                return nodes;
            });
            if (isSubsystemNode(data)) {
                const subsystemId = (data.element as SubsystemDataType).subsystemId;
                if (subsystemId) {
                    const subsystem = getSystem(subsystemId);
                    if (subsystem) {
                        subsystem.name = inputName;
                        saveSystem(subsystem);
                    }
                }
            }
            addToHistory();
        } else if (isNameError) {
            inputName = currentName;
            isNameError = false;
        }
    }

    // handle VSSo class selection
    let currentVSSoClass = $state(data.element.VSSoClass);
    const updateVSSOClass = (value: string) => {
        currentNodes.update((nodes) => {
            return nodes.map((node) => {
                if (node.id === id) {
                    (node.data as any).element.VSSoClass = currentVSSoClass;
                }
                return node;
            });
        });
        addToHistory();
    }

    // Make delete button compensate for zoom level
    const { viewport } = useSvelteFlow();
    let zoomLevel = $state(1);
    viewport.subscribe((value) => {
        zoomLevel = value.zoom;
    });

    const deleteComponent = () => {
        currentNodes.update((nodes) => {
            return nodes.filter((node) => node.id !== id);
        });
        currentEdges.update((edges) => {
            return edges.filter((edge) => edge.source !== id && edge.target !== id);
        });

        const subsystemData = data.element as SubsystemDataType;
        if (isSubsystemNode(data) && subsystemData.subsystemId) {
            removeSystem(subsystemData.subsystemId);
        };        
        addToHistory();
    }

    const duplicateComponent = () => {
        const nodes = get(currentNodes);
        const currentNode = nodes.find(n => n.id === id);
        const elementNames = nodes.map(elem => elem.data.name) as string[];
        const allNames = elementNames.concat(get(systems).map(s => s.name));

        if (currentNode) {
            const newNode = {
                ..._.cloneDeep(currentNode),
                id: generateId(nodes.map( n => n.id )),
                position: {
                    x: currentNode.position.x + 20,
                    y: currentNode.position.y + 20
                },
                selected: false
            };

            const subsystemData = newNode.data.element as SubsystemDataType;
            if (subsystemData.subsystemId) {
                const newSubsystem = cloneSystem(subsystemData.subsystemId)!;
                subsystemData.subsystemId = newSubsystem.id;
            }
            else {
                newNode.data.name = generateName('Copy of ' + currentNode.data.name, elementNames);
            }

            currentNodes.update(n => [...n, newNode]);
            addToHistory();

            console.log(JSON.stringify(newNode));
        }
    }

    const handleDoubleClick = (e: MouseEvent) => {
        const target = e.target as HTMLElement;
        const interactiveTags = ['INPUT', 'BUTTON', 'SELECT', 'TEXTAREA'];
        if (interactiveTags.includes(target.tagName) ||
            target.closest('button, input, select, textarea, svg, .delete-btn') 
        ) { return; }
        if (isSubsystemNode(data)) {
            const subsystemData = data.element as SubsystemDataType;
            if (subsystemData.subsystemId) {
                navigateToSubsystem(subsystemData.subsystemId, id);
            }
      }
    }

    let showDropdown = $state(false);
    let menuX = $state(0);
    let menuY = $state(0);
    const options = ['Duplicate', 'Delete'];
    const openContextMenu = (e: MouseEvent) => {
        e.preventDefault();
        menuX = e.clientX;
        menuY = e.clientY;
        showDropdown = true;
    }

    const handleOptionClick = (option: string) => {
        switch (option) {
            case 'Duplicate':
                duplicateComponent();
                break;
            case 'Delete':
                deleteComponent();
                break;
            default:
                // Impossible to reach
        }
        showDropdown = false;
    }

    const handleOutsideClick = (e: MouseEvent) => {
        if (!(e.target as HTMLElement).closest(".custom-menu")) {
            showDropdown = false;
        }
    }

    onMount(() => {
        document.addEventListener('mousedown', handleOutsideClick);
        return () => document.removeEventListener('mousedown', handleOutsideClick);
    });
    rest
</script>
<!-- svelte-ignore a11y_no_static_element_interactions -->
<!-- svelte-ignore a11y_click_events_have_key_events -->
<!-- svelte-ignore a11y_no_noninteractive_element_interactions -->
<div class="main-element-node {data.element.type === 'system' ? 'subsystem' : ''}" 
    onmouseenter={() => {hover = true;}}
    onmouseleave={() => hover = false} 
    ondblclick={handleDoubleClick}
    oncontextmenu={openContextMenu} 
    onclick={() => showDropdown = false}
    style:cursor={isSubsystemNode(data) ? 'pointer' : 'move'}>
    
    <div class="element-node-inner">
        <div class="top-param-cont">
            <input class="main-name-field {isNameError ? 'error' : ''}"
                type="text"
                bind:value={inputName}
                oninput={validateName}
                onblur={saveName} />
            <div class="element-type-cont {data.element.type === 'system' ? 'subsystem-type' : ''}">
                {#if data.element.type === 'system'}
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor">
                        <path stroke-linecap="round" stroke-linejoin="round" d="M3.75 6A2.25 2.25 0 0 1 6 3.75h2.25A2.25 2.25 0 0 1 10.5 6v2.25a2.25 2.25 0 0 1-2.25 2.25H6a2.25 2.25 0 0 1-2.25-2.25V6ZM3.75 15.75A2.25 2.25 0 0 1 6 13.5h2.25a2.25 2.25 0 0 1 2.25 2.25V18a2.25 2.25 0 0 1-2.25 2.25H6A2.25 2.25 0 0 1 3.75 18v-2.25ZM13.5 6a2.25 2.25 0 0 1 2.25-2.25H18A2.25 2.25 0 0 1 20.25 6v2.25A2.25 2.25 0 0 1 18 10.5h-2.25a2.25 2.25 0 0 1-2.25-2.25V6ZM13.5 15.75a2.25 2.25 0 0 1 2.25-2.25H18a2.25 2.25 0 0 1 2.25 2.25V18A2.25 2.25 0 0 1 18 20.25h-2.25A2.25 2.25 0 0 1 13.5 18v-2.25Z" />
                    </svg>
                {:else}
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor">
                        <path stroke-linecap="round" stroke-linejoin="round" d="M5.25 7.5A2.25 2.25 0 0 1 7.5 5.25h9a2.25 2.25 0 0 1 2.25 2.25v9a2.25 2.25 0 0 1-2.25 2.25h-9a2.25 2.25 0 0 1-2.25-2.25v-9Z" />
                    </svg>
                {/if}
            </div>
        </div>
        
        {#if $componentLinks[id]}
            <div class="fmi-indicator" title="FMI: {$fmiComponents.find(c => c.id === $componentLinks[id])?.name || 'Unknown'}">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" d="M13.19 8.688a4.5 4.5 0 0 1 1.242 7.244l-4.5 4.5a4.5 4.5 0 0 1-6.364-6.364l1.757-1.757m13.35-.622 1.757-1.757a4.5 4.5 0 0 0-6.364-6.364l-4.5 4.5a4.5 4.5 0 0 0 1.242 7.244" />
                </svg>
            </div>
        {/if}

        <div class="bottom-param-cont">
            <VSSoSelect {id}
                bind:currentClass={currentVSSoClass}
                onChange={updateVSSOClass}
            />
        </div>

    </div>
    <div class="delete-btn-wrapper">
        <button class="delete-btn {hover ? 'hover' : ''}" aria-label="Delete"
        onclick={deleteComponent}
        style="transform: scale({1/zoomLevel});">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="size-6">
                <path stroke-linecap="round" stroke-linejoin="round" d="M6 18 18 6M6 6l12 12" />
            </svg>          
        </button>
    </div>
    <Connectors type="output" bind:nodeOnHover={hover} elementName={id} elementData={data.element} />
    <Connectors type="input" bind:nodeOnHover={hover} elementName={id} elementData={data.element} />

    {#if showDropdown}
        <div 
            class="menu-overlay"
            use:portal
            >
            <ul
                class="custom-menu"
                style="top: {menuY}px; left: {menuX}px;"
            >
                {#each options as option}
                <li
                    class="custom-menu-item"
                    onclick={() =>handleOptionClick(option)}
                >
                    {option}
                </li>
                {/each}
            </ul>
        </div>
    {/if}
</div>

<style>
    .menu-overlay {
        position: fixed;
        top: 0;
        left: 0;
        width: 100vw;
        height: 100vh;
        z-index: 999;
    }
    .delete-btn svg {
        width: 20px;
        height: 20px;
        color: rgba(255, 255, 255, 0.9);
        position: absolute;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
    }
    .delete-btn {
        border: solid 1px rgba(255, 255, 255, 0.1);
        background: var(--main-dark-color);
        border-radius: 50%;
        width: 32px;
        height: 32px;
        cursor: pointer;
        position: absolute;
        top: 0px;
        right: 0;
        opacity: 0;
        transition: opacity .3s;
        pointer-events: none;
        transform-origin: bottom right;
    }
    .delete-btn.hover {
        opacity: 1;
        pointer-events: all;
    }
    .delete-btn-wrapper {
        width: 52px;
        height: 40px;
        position: absolute;
        top: -40px;
        right: 0;
    }

    .top-param-cont {
        position: absolute;
        top: 10px;
        left: 10px;
        width: calc(100% - 20px);
        display: flex;
        justify-content: space-between;
        gap: 6px;
    }
    .element-type-cont {
        width: 36px;
        height: 36px;
        padding: 6px;
        background-color: var(--main-dark-color);
        border: solid 1.5px rgba(0, 0, 0, 0.08);
        border-radius: 50px;
        position: relative;
        flex-shrink: 0;
    }
    .element-type-cont svg {
        width: 18px;
        height: 18px;
        color:rgba(255, 255, 255, 0.9);
        position: absolute;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
    }
    .bottom-param-cont {
        position: absolute;
        bottom: 10px;
        left: 10px;
        width: calc(100% - 20px);
    }
    .main-name-field {
        font-family: 'Inter', sans-serif;
        width: 100%;
        box-sizing: border-box;
        font-size: 14px;
        color: rgba(0, 0, 0, 0.8);
        padding: 8px;
        line-height: 1;
        background: none;
        border-radius: 5px;
        transition: .2s;
        margin-bottom: 8px;
        border: solid 2px rgba(0, 0, 0, 0);
        outline: none !important;
    }
    .main-name-field:focus {
        border: solid 2px rgba(0, 0, 0, 0.1);
    }
    .main-name-field.error {
        border: solid 2px var(--main-error-color);
    }
    .main-element-node {
        width: 200px;
        height: 200px;
        border: solid 3px rgba(0, 0, 0, 0.1);
        border-radius: 15px;
        backdrop-filter: blur(15px);
        transition: .2s;
        position: relative;
        background: var(--main-grey-color);
    }
    .main-element-node:hover {
        background: white;
    }
    .element-node-inner {
        width: 100%;
        height: 100%;
    }

    .element-type-cont.subsystem-type {
          background-color: #494974;
      }
      
    .fmi-indicator {
        position: absolute;
        top: 10px;
        right: 10px;
        width: 24px;
        height: 24px;
        background: #3b82f6;
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        cursor: help;
    }
    
    .fmi-indicator svg {
        width: 14px;
        height: 14px;
        color: white;
    }
    .custom-menu {
        position: absolute;
        background: white;
        border: 1px solid #ccc;
        border-radius: 6px;
        box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
        z-index: 1000;
        min-width: 150px;
    }
    .custom-menu-item {
        padding: 8px 12px;
        cursor: pointer;
    }
    .custom-menu-item:hover {
        background-color: #f0f0f0;
    }
</style>