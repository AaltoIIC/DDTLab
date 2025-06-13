<script lang="ts">
    import { useUpdateNodeInternals, useSvelteFlow } from '@xyflow/svelte';
    import Connectors from "./Connectors.svelte";
    import { type ElementDataType, type SubsystemDataType } from "$lib/types/types";
    import {
        isNameValid
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
        fmiComponents
    } from "$lib/stores/stores";
    import VSSoSelect from "./VSSoSelect.svelte";
   
    let hover = false;

    export let id: string;
    export let data: {
        element: ElementDataType | SubsystemDataType;
    };

    const updateNodeInternals = useUpdateNodeInternals();
    $: if (data) {
        updateNodeInternals(id);
    }

    let currentName = id;
    let isNameError = false;
    const validateName = () => {
        const isNameTaken = (currentName !== id) && $currentNodes.some((node) => (
            node.id.replace(/\s+/g, '').toLowerCase() == currentName.replace(/\s+/g, '').toLowerCase()
        ));
        
        isNameError = !isNameValid(currentName) || isNameTaken;
    }

    const saveName = () => {
        if (!isNameError) {
            if (currentName !== id) {
                currentNodes.update((nodes) => {
                    const nodeIndex = nodes.findIndex((node) => node.id === id);
                    nodes[nodeIndex].id = currentName;
                    return nodes;
                });
                addToHistory();
            }
        } else {
            currentName = id;
            isNameError = false;
        }

    }

    // handle VSSo class selection
    let currentVSSoClass = data.element.VSSoClass;
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
    let zoomLevel = 1;
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
        addToHistory();
    }

  const handleDoubleClick = () => {
      if (isSubsystemNode(data)) {
          const subsystemData = data.element as SubsystemDataType;
          if (subsystemData.subsystemId) {
              navigateToSubsystem(subsystemData.subsystemId, id);
          }
      }
  };

    $$restProps
</script>
<!-- svelte-ignore a11y_no_static_element_interactions -->
<!-- svelte-ignore a11y_click_events_have_key_events -->
<div class="main-element-node {data.element.type === 'system' ? 'subsystem' : ''}" 
    on:mouseenter={() => {hover = true;}}
    on:mouseleave={() => hover = false} on:dblclick={handleDoubleClick}
    style:cursor={isSubsystemNode(data) ? 'pointer' : 'move'}>
    
    <div class="element-node-inner">
        <div class="top-param-cont">
            <input class="main-name-field {isNameError ? 'error' : ''}"
                type="text"
                bind:value={currentName}
                on:input={validateName}
                on:blur={saveName} />
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
        on:click={deleteComponent}
        style="transform: scale({1/zoomLevel});">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="size-6">
                <path stroke-linecap="round" stroke-linejoin="round" d="M6 18 18 6M6 6l12 12" />
            </svg>          
        </button>
    </div>
    <Connectors type="output" bind:nodeOnHover={hover} elementName={id} elementData={data.element} />
    <Connectors type="input" bind:nodeOnHover={hover} elementName={id} elementData={data.element} />
</div>
<style>
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
        width: 172px;
        height: 172px;
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
</style>