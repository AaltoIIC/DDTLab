<script lang="ts">
    import { stopPropagation, createBubbler } from 'svelte/legacy';

    const bubble = createBubbler();
    import { Handle, Position } from '@xyflow/svelte';
    import { Plus, Minus, Plug, Pencil } from '@lucide/svelte';
    import { onMount, tick } from 'svelte';
    import type { InterfaceCategory, Port } from '../interfaces';
    import { standardInterfaces, getInterfacesByCategory } from '../interfaces';
    import { customInterfaces, addCustomInterface, getCustomInterfaces } from '../interfaces/customInterfaceStore';

    type TabCategory = InterfaceCategory | 'all';
    
    interface Props {
        nodeId: string;
        ports?: Port[];
        type: 'input' | 'output';
        onAdd: () => void;
        onRemove: (index: number) => void;
        onUpdateInterface: (index: number, interfaceType: string | undefined) => void;
        onUpdatePort?: (index: number, name: string, description: string) => void;
    }

    let {
        nodeId,
        ports = [],
        type,
        onAdd,
        onRemove,
        onUpdateInterface,
        onUpdatePort
    }: Props = $props();
    
    let position = $derived(type === 'input' ? Position.Left : Position.Right);
    let containerClass = $derived(type === 'input' ? 'handles-left' : 'handles-right');

    // Force re-render when component mounts to ensure handles are registered
    let mounted = false;
    onMount(() => {
        mounted = true;
    });
    
    // Interface selection state
    let showInterfaceSelector: number | null = $state(null);
    let selectedCategory: TabCategory = $state('all');
    let searchQuery: string = $state('');
    let searchInputRef: HTMLInputElement | null = $state(null);
    
    function clickOutside(node: HTMLElement, callback: () => void) {
        const handleClick = (event: MouseEvent) => {
            if (node && !node.contains(event.target as Node)) {
                callback();
            }
        };

        document.addEventListener('click', handleClick, true);
        return {
            destroy() {
                document.removeEventListener('click', handleClick, true);
            }
        };
    }
    let showCustomInput: boolean = $state(false);
    let customInterfaceName: string = $state('');

    // Subscribe to custom interfaces
    let allCustomInterfaces = $state(getCustomInterfaces());
    $effect(() => {
        customInterfaces.subscribe(() => {
            allCustomInterfaces = getCustomInterfaces();
        });
    });

    function selectInterface(index: number, interfaceId: string | undefined) {
        onUpdateInterface(index, interfaceId);
        showInterfaceSelector = null;
        searchQuery = ''; // Reset search when closing
        showCustomInput = false;
        customInterfaceName = '';
    }

    function createCustomInterface(index: number) {
        if (customInterfaceName.trim()) {
            const newId = addCustomInterface(customInterfaceName.trim());
            selectInterface(index, newId);
        }
    }

    // Filter interfaces based on search query
    function getFilteredInterfaces(category: TabCategory) {
        let interfaces;
        if (category === 'all') {
            interfaces = [...Object.values(standardInterfaces), ...allCustomInterfaces];
        } else if (category === 'other') {
            interfaces = allCustomInterfaces;
        } else {
            interfaces = getInterfacesByCategory(category);
        }

        if (!searchQuery.trim()) return interfaces;

        const query = searchQuery.toLowerCase();
        return interfaces.filter(intf =>
            intf.name.toLowerCase().includes(query) ||
            intf.id.toLowerCase().includes(query)
        );
    }
    
    // Open interface selector and reset search
    async function openInterfaceSelector(index: number) {
        showPortInfoEditor = null;
        showInterfaceSelector = showInterfaceSelector === index ? null : index;
        if (showInterfaceSelector === index) {
            searchQuery = ''; // Reset search when opening
            await tick(); // Wait for DOM update
            searchInputRef?.focus(); // Focus the search input
        }
    }
    
    /** Resolve interfaceType to its string ID, handling the case where an entire
     *  InterfaceDefinition object was stored instead of a plain string ID. */
    function resolveInterfaceId(interfaceType: any): string | undefined {
        if (!interfaceType) return undefined;
        // Already a string ID
        if (typeof interfaceType === 'string') return interfaceType;
        // Accidentally stored as an InterfaceDefinition object — extract its .id
        if (typeof interfaceType === 'object' && interfaceType !== null && typeof interfaceType.id === 'string') {
            return interfaceType.id;
        }
        return undefined;
    }

    function getInterfaceColor(interfaceType: string | undefined): string {
        const interfaceId = resolveInterfaceId(interfaceType);
        if (!interfaceId) return '#6b7280'; // gray

        // Check standard interfaces first
        let intf = standardInterfaces[interfaceId];

        // If not found in standard, check custom interfaces
        if (!intf) {
            const customIntf = allCustomInterfaces.find(ci => ci.id === interfaceId);
            if (customIntf) {
                intf = customIntf;
            }
        }

        if (!intf) return '#6b7280';

        switch (intf.category) {
            case 'electrical': return '#f59e0b'; // yellow
            case 'mechanical': return '#6b7280'; // gray
            case 'fluid': return '#3b82f6'; // blue
            case 'data': return '#10b981'; // green
            case 'other': return '#9333ea'; // purple for custom
            default: return '#6b7280';
        }
    }

    // Port info editor state
    let showPortInfoEditor: number | null = $state(null);
    let tempPortName: string = $state('');
    let tempPortDescription: string = $state('');
    let portNameInputRef: HTMLInputElement | null = $state(null);

    async function openPortInfoEditor(index: number, port: Port) {
        showInterfaceSelector = null;
        showPortInfoEditor = showPortInfoEditor === index ? null : index;
        if (showPortInfoEditor === index) {
            tempPortName = port.name;
            tempPortDescription = port.description || '';
            await tick();
            portNameInputRef?.focus();
            portNameInputRef?.select();
        }
    }

    function applyPortInfo(index: number) {
        if (onUpdatePort && tempPortName.trim()) {
            onUpdatePort(index, tempPortName.trim(), tempPortDescription.trim());
        }
        showPortInfoEditor = null;
    }

    function cancelPortInfo() {
        showPortInfoEditor = null;
        tempPortName = '';
        tempPortDescription = '';
    }
</script>

<div class="handles-container {containerClass}">
    {#each ports as port, i (`${nodeId}-${type}-${i}`)}
        <div class="handle-group" style="top: {20 + i * 30}px;">
            <Handle 
                type={type === 'input' ? 'target' : 'source'}
                position={position}
                id={`${nodeId}-${type}-${port.name}`}
                style="position: absolute; top: 50%; transform: translateY(-50%); background: {getInterfaceColor(port.interfaceType)}; border-color: {getInterfaceColor(port.interfaceType)};"
                isConnectable={true}
            />
            <span class="handle-label">
                {port.name}
                {#if port.interfaceType}
                    {@const interfaceId = resolveInterfaceId(port.interfaceType)}
                    {@const interfaceName = standardInterfaces[interfaceId]?.name ||
                        allCustomInterfaces.find(ci => ci.id === interfaceId)?.name ||
                        'Unknown'}
                    <span class="interface-type">({interfaceName})</span>
                {/if}
            </span>
            <button 
                class="handle-edit"
                onclick={stopPropagation(() => openPortInfoEditor(i, port))}
                title="Edit port information"
            >
                <Pencil size={14} />
            </button>
            <button 
                class="handle-interface" 
                onclick={stopPropagation(() => openInterfaceSelector(i))}
                title="Set interface type"
                style="color: {getInterfaceColor(port.interfaceType)}"
            >
                <Plug size={14} />
            </button>
            {#if ports.length > 0}
                <button 
                    class="handle-remove" 
                    onclick={stopPropagation(() => onRemove(i))}
                    title="Remove {type}"
                >
                    <Minus size={14} />
                </button>
            {/if}
            
            {#if showPortInfoEditor === i}
                <!-- svelte-ignore a11y_no_static_element_interactions -->
                <!-- svelte-ignore a11y_click_events_have_key_events -->
                <div 
                    class="port-info-editor"
                    onclick={stopPropagation(bubble('click'))}
                    onwheel={stopPropagation(bubble('wheel'))}
                    use:clickOutside={() => showPortInfoEditor = null}
                >
                    <div class="port-info-header">Edit Port Information</div>
                    <div class="port-info-body">
                        <label class="port-info-field">
                            <span class="field-label">Name</span>
                            <input
                                type="text"
                                class="port-info-input"
                                bind:value={tempPortName}
                                bind:this={portNameInputRef}
                                onkeydown={(e) => {
                                    if (e.key === 'Enter') applyPortInfo(i);
                                    if (e.key === 'Escape') cancelPortInfo();
                                    stopPropagation(() => {});
                                }}
                                onclick={stopPropagation(() => {})}
                            />
                        </label>
                        <label class="port-info-field">
                            <span class="field-label">Description</span>
                            <input
                                type="text"
                                class="port-info-input"
                                bind:value={tempPortDescription}
                                onkeydown={(e) => {
                                    if (e.key === 'Enter') applyPortInfo(i);
                                    if (e.key === 'Escape') cancelPortInfo();
                                    stopPropagation(() => {});
                                }}
                                onclick={stopPropagation(() => {})}
                                placeholder="Optional description..."
                            />
                        </label>
                    </div>
                    <div class="port-info-actions">
                        <button class="port-info-btn cancel" onclick={() => cancelPortInfo()}>Cancel</button>
                        <button
                            class="port-info-btn apply"
                            onclick={() => applyPortInfo(i)}
                            disabled={!tempPortName.trim()}
                        >Apply</button>
                    </div>
                </div>
            {/if}

            {#if showInterfaceSelector === i}
                <!-- svelte-ignore a11y_no_static_element_interactions -->
                <!-- svelte-ignore a11y_click_events_have_key_events -->
                <div 
                    class="interface-selector" 
                    onclick={stopPropagation(bubble('click'))} 
                    onwheel={stopPropagation(bubble('wheel'))}
                    use:clickOutside={() => showInterfaceSelector = null}
                >
                    <div class="search-container">
                        <input
                            type="text"
                            class="search-input"
                            placeholder="Search interfaces..."
                            bind:value={searchQuery}
                            bind:this={searchInputRef}

                        />
                    </div>
                    <div class="interface-categories">
                        <button 
                            class="category-tab" 
                            class:active={selectedCategory === 'all'}
                            onclick={() => selectedCategory = 'all'}
                        >
                            All
                        </button>
                        <button 
                            class="category-tab" 
                            class:active={selectedCategory === 'electrical'}
                            onclick={() => selectedCategory = 'electrical'}
                        >
                            Electrical
                        </button>
                        <button 
                            class="category-tab" 
                            class:active={selectedCategory === 'mechanical'}
                            onclick={() => selectedCategory = 'mechanical'}
                        >
                            Mechanical
                        </button>
                        <button 
                            class="category-tab" 
                            class:active={selectedCategory === 'fluid'}
                            onclick={() => selectedCategory = 'fluid'}
                        >
                            Fluid
                        </button>
                        <button
                            class="category-tab"
                            class:active={selectedCategory === 'data'}
                            onclick={() => selectedCategory = 'data'}
                        >
                            Data
                        </button>
                        <button
                            class="category-tab"
                            class:active={selectedCategory === 'other'}
                            onclick={() => selectedCategory = 'other'}
                        >
                            Other
                        </button>
                    </div>
                    <div class="interface-list">
                        <button 
                            class="interface-option"
                            class:selected={!port.interfaceType}
                            onclick={() => selectInterface(i, undefined)}
                        >
                            None
                        </button>
                        {#each getFilteredInterfaces(selectedCategory) as intf}
                            <button 
                                class="interface-option"
                                class:selected={port.interfaceType === intf.id}
                                onclick={() => selectInterface(i, intf.id)}
                            >
                                {intf.name}
                                {#if selectedCategory === 'all'}
                                    <span class="interface-category-badge" style="background-color: {getInterfaceColor(intf.id)}20; color: {getInterfaceColor(intf.id)}">
                                        {intf.category}
                                    </span>
                                {/if}
                            </button>
                        {/each}
                        {#if getFilteredInterfaces(selectedCategory).length === 0}
                            <div class="no-results">No matching interfaces found</div>
                        {/if}

                        {#if selectedCategory === 'other'}
                            {#if !showCustomInput}
                                <button
                                    class="interface-option create-custom"
                                    onclick={() => showCustomInput = true}
                                >
                                    <Plus size={12} style="margin-right: 4px;" />
                                    Create Custom Interface
                                </button>
                            {:else}
                                <div class="custom-input-container">
                                    <input
                                        type="text"
                                        class="custom-input"
                                        placeholder="Enter interface name..."
                                        bind:value={customInterfaceName}
                                        onkeydown={(e) => {
                                            if (e.key === 'Enter') {
                                                createCustomInterface(i);
                                            } else if (e.key === 'Escape') {
                                                showCustomInput = false;
                                                customInterfaceName = '';
                                            }
                                            stopPropagation(() => {});
                                        }}
                                        onclick={stopPropagation(() => {})}
                                    />
                                    <button
                                        class="custom-btn"
                                        onclick={() => createCustomInterface(i)}
                                        disabled={!customInterfaceName.trim()}
                                    >
                                        Add
                                    </button>
                                    <button
                                        class="custom-btn cancel"
                                        onclick={() => {
                                            showCustomInput = false;
                                            customInterfaceName = '';
                                        }}
                                    >
                                        Cancel
                                    </button>
                                </div>
                            {/if}
                        {/if}
                    </div>
                </div>
            {/if}
        </div>
    {/each}
    <button 
        class="handle-add" 
        onclick={stopPropagation(onAdd)}
        title="Add {type}"
        style="top: {20 + ports.length * 30}px;"
    >
        <Plus size={12} />
    </button>
</div>

<style>
    .handles-container {
        position: absolute;
        top: 0;
        height: 100%;
        width: 30px;
    }

    .handles-left {
        left: -15px;
    }

    .handles-right {
        right: -15px;
    }

    .handle-group {
        position: absolute;
        display: flex;
        align-items: center;
        justify-content: center;
        width: 100%;
        height: 20px;
    }

    .handle-label {
        font-size: 10px;
        color: #374151;
        white-space: nowrap;
        opacity: 0;
        transition: opacity 0.2s;
        position: absolute;
        pointer-events: none;
        z-index: 9999;
        bottom: 100%;
        left: 50%;
        transform: translateX(-50%);
        margin-bottom: 2px;
        background: white;
        padding: 1px 6px;
        border-radius: 3px;
        box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
    }

    .handle-group:hover .handle-label {
        opacity: 1;
    }
    
    .interface-type {
        font-size: 9px;
        color: #9ca3af;
        display: block;
    }

    .handle-add {
        position: absolute;
        background: white;
        border: 1px solid #e5e7eb;
        border-radius: 4px;
        padding: 4px;
        cursor: pointer;
        display: flex;
        align-items: center;
        justify-content: center;
        transition: all 0.2s;
        opacity: 0;
    }

    .handle-edit,
    .handle-remove,
    .handle-interface {
        background: white;
        border: 1px solid #e5e7eb;
        border-radius: 4px;
        padding: 4px;
        cursor: pointer;
        display: flex;
        align-items: center;
        justify-content: center;
        transition: all 0.2s;
        opacity: 0;
        position: absolute;
        z-index: 10;
    }

    .handles-left .handle-add {
        left: 50%;
        transform: translateX(-50%);
    }

    .handles-right .handle-add {
        right: 50%;
        transform: translateX(50%);
    }

    :global(.concept-node:hover) .handle-add,
    :global(.concept-node:hover) .handle-edit,
    :global(.concept-node:hover) .handle-remove,
    :global(.concept-node:hover) .handle-interface {
        opacity: 1;
    }

    /* ---- Button positions: edit | interface | remove ---- */    
    .handles-left .handle-edit {
        left: 22px;
    }

    .handles-right .handle-edit {
        right: 22px;
    }

    .handles-left .handle-interface {
        left: 48px;
    }

    .handles-right .handle-interface {
        right: 48px;
    }

    .handles-left .handle-remove {
        left: 74px;
    }

    .handles-right .handle-remove {
        right: 74px;
    }

    .handle-add:hover {
        background-color: #dbeafe;
        border-color: #3b82f6;
        color: #3b82f6;
    }
    
    .handle-edit:hover {
        background-color: #f0f9ff;
        border-color: #06b6d4;
    }

    .handle-interface:hover {
        background-color: #f0f9ff;
        border-color: #0ea5e9;
    }

    .handle-remove:hover {
        background-color: #fee2e2;
        border-color: #dc2626;
        color: #dc2626;
    }

    /* ---- Port info editor dropdown ---- */
    .port-info-editor {
        position: absolute;
        background: white;
        border: 1px solid #e5e7eb;
        border-radius: 6px;
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.12);
        z-index: 1000;
        min-width: 220px;
        overflow: hidden;
    }

    .handles-left .port-info-editor {
        left: 70px;
        top: -10px;
    }

    .handles-right .port-info-editor {
        right: 70px;
        top: -10px;
    }

    .port-info-header {
        font-weight: 600;
        font-size: 12px;
        padding: 8px 12px;
        background: #f9fafb;
        border-bottom: 1px solid #e5e7eb;
        color: #111827;
    }

    .port-info-body {
        padding: 10px 12px;
        display: flex;
        flex-direction: column;
        gap: 8px;
    }

    .port-info-field {
        display: flex;
        flex-direction: column;
        gap: 3px;
    }

    .port-info-field .field-label {
        font-size: 10px;
        font-weight: 600;
        color: #6b7280;
        text-transform: uppercase;
        letter-spacing: 0.5px;
    }

    .port-info-input {
        width: 100%;
        padding: 5px 8px;
        font-size: 11px;
        border: 1px solid #e5e7eb;
        border-radius: 4px;
        outline: none;
        transition: border-color 0.2s;
    }

    .port-info-input:focus {
        border-color: #3b82f6;
        box-shadow: 0 0 0 2px rgba(59, 130, 246, 0.1);
    }

    .port-info-actions {
        display: flex;
        gap: 6px;
        justify-content: flex-end;
        padding: 8px 12px;
        background: #f9fafb;
        border-top: 1px solid #e5e7eb;
    }

    .port-info-btn {
        padding: 4px 10px;
        font-size: 11px;
        border: 1px solid #e5e7eb;
        border-radius: 4px;
        background: white;
        cursor: pointer;
        transition: all 0.2s;
    }

    .port-info-btn.cancel:hover {
        background: #f3f4f6;
    }

    .port-info-btn.apply {
        background: #3b82f6;
        color: white;
        border-color: #3b82f6;
    }

    .port-info-btn.apply:hover:not(:disabled) {
        background: #2563eb;
    }

    .port-info-btn:disabled {
        opacity: 0.5;
        cursor: not-allowed;
    }

    /* ---- Interface selector (existing) ---- */
    .interface-selector {
        position: absolute;
        background: white;
        border: 1px solid #e5e7eb;
        border-radius: 4px;
        box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
        z-index: 1000;
        min-width: 250px;
        max-height: 350px;
        overflow: hidden;
        display: flex;
        flex-direction: column;
    }
    
    .handles-left .interface-selector {
        left: 100px;
        top: -10px;
    }
    
    .handles-right .interface-selector {
        right: 100px;
        top: -10px;
    }
    
    .interface-categories {
        display: flex;
        border-bottom: 1px solid #e5e7eb;
        background: #f9fafb;
    }
    
    .category-tab {
        flex: 1;
        padding: 4px 8px;
        font-size: 10px;
        border: none;
        background: none;
        cursor: pointer;
        color: #6b7280;
        transition: all 0.2s;
    }
    
    .category-tab:not(:last-child) {
        border-right: 1px solid #e5e7eb;
    }
    
    .category-tab:hover {
        background: #f3f4f6;
    }
    
    .category-tab.active {
        background: white;
        color: #1f2937;
        font-weight: 500;
    }
    
    .interface-list {
        max-height: 200px;
        overflow-y: auto;
    }
    
    .interface-option {
        display: block;
        width: 100%;
        padding: 6px 12px;
        font-size: 11px;
        text-align: left;
        border: none;
        background: none;
        cursor: pointer;
        color: #374151;
        transition: all 0.2s;
    }
    
    .interface-option:hover {
        background: #f0f9ff;
    }
    
    .interface-option.selected {
        background: #dbeafe;
        color: #1e40af;
        font-weight: 500;
    }

    :global(.handle) {
        position: absolute;
        width: 8px;
        height: 8px;
        background: white;
        border: 1px solid #6b7280;
        border-radius: 50%;
    }

    .handles-left :global(.handle) {
        left: 11px;
    }

    .handles-right :global(.handle) {
        right: 11px;
    }
    
    .search-container {
        padding: 8px;
        border-bottom: 1px solid #e5e7eb;
        background: #f9fafb;
    }
    
    .search-input {
        width: 100%;
        padding: 6px 10px;
        font-size: 12px;
        border: 1px solid #e5e7eb;
        border-radius: 4px;
        outline: none;
        transition: border-color 0.2s;
    }
    
    .search-input:focus {
        border-color: #3b82f6;
        box-shadow: 0 0 0 2px rgba(59, 130, 246, 0.1);
    }
    
    .no-results {
        padding: 20px;
        text-align: center;
        color: #6b7280;
        font-size: 12px;
        font-style: italic;
    }
    
    .interface-category-badge {
        display: inline-block;
        padding: 2px 6px;
        border-radius: 3px;
        font-size: 9px;
        font-weight: 500;
        margin-left: 8px;
        text-transform: capitalize;
    }

    .create-custom {
        display: flex;
        align-items: center;
        justify-content: center;
        background: #f3f0ff;
        color: #7c3aed;
        font-weight: 500;
    }

    .create-custom:hover {
        background: #ede9fe;
        color: #6d28d9;
    }

    .custom-input-container {
        padding: 8px;
        border-top: 1px solid #e5e7eb;
        background: #f9fafb;
    }

    .custom-input {
        width: 100%;
        padding: 6px 8px;
        font-size: 11px;
        border: 1px solid #e5e7eb;
        border-radius: 4px;
        margin-bottom: 6px;
        outline: none;
    }

    .custom-input:focus {
        border-color: #9333ea;
        box-shadow: 0 0 0 2px rgba(147, 51, 234, 0.1);
    }

    .custom-btn {
        padding: 4px 12px;
        font-size: 10px;
        border: 1px solid #e5e7eb;
        border-radius: 4px;
        background: white;
        cursor: pointer;
        margin-right: 4px;
        transition: all 0.2s;
    }

    .custom-btn:not(:disabled):hover {
        background: #f3f0ff;
        border-color: #9333ea;
        color: #7c3aed;
    }

    .custom-btn:disabled {
        opacity: 0.5;
        cursor: not-allowed;
    }

    .custom-btn.cancel {
        background: #f3f4f6;
    }

    .custom-btn.cancel:hover {
        background: #e5e7eb;
        border-color: #9ca3af;
        color: #6b7280;
    }
</style>
