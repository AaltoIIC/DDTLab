<script lang="ts">
    import { onMount } from 'svelte';
    import { fmiComponents, componentLinks, currentNodes } from '$lib/stores/stores';
    import type { FMIComponentType } from '$lib/types/types';
    import { generateId } from '$lib/helpers';
    import { useSvelteFlow } from "@xyflow/svelte";
    
    export let isOpen = false;
    
    let searchQuery = '';
    let selectedCategory: string = 'all';
    let expandedCategories: Set<string> = new Set(['motors', 'propellers', 'sensors']);
    
    // Handle viewport adjustment like requirements popover
    const { setViewport, getViewport } = useSvelteFlow();
    const popoverWidth = 340;
    $: if (isOpen) {
        const currentViewport = getViewport();
        setViewport({
            ...currentViewport,
            x: currentViewport.x + popoverWidth
        });
    } else {
        const currentViewport = getViewport();
        setViewport({
            ...currentViewport,
            x: currentViewport.x - popoverWidth
        });
    }
    
    // Mock components for MVP
    const mockComponents: FMIComponentType[] = [
        {
            id: 'fmi_1',
            name: 'DC_Motor - ABB',
            category: 'motors',
            description: 'DC motor with speed control',
            modelIdentifier: 'DCMotor',
            fmiVersion: '2.0',
            fmiType: 'Co-Simulation',
            linkedElements: [],
            uploadDate: new Date().toISOString(),
            isUserUploaded: false
        },
        {
            id: 'fmi_2',
            name: 'BLDC_Motor_High_Performance',
            category: 'motors',
            description: 'Brushless DC motor model',
            modelIdentifier: 'BLDCMotor',
            fmiVersion: '3.0',
            fmiType: 'Model Exchange',
            linkedElements: [],
            uploadDate: new Date().toISOString(),
            isUserUploaded: false
        },
        {
            id: 'fmi_3',
            name: 'Variable_Pitch_Propeller - Kongsberg',
            category: 'propellers',
            description: 'Variable pitch propeller',
            modelIdentifier: 'Propeller',
            fmiVersion: '2.0',
            fmiType: 'Co-Simulation & Model Exchange',
            linkedElements: [],
            uploadDate: new Date().toISOString(),
            isUserUploaded: false
        },
        {
            id: 'fmi_4',
            name: 'Fixed_Pitch_Propeller',
            category: 'propellers',
            description: 'Fixed pitch propeller model',
            modelIdentifier: 'FixedPropeller',
            fmiVersion: '2.0',
            fmiType: 'Co-Simulation',
            linkedElements: [],
            uploadDate: new Date().toISOString(),
            isUserUploaded: false
        },
        {
            id: 'fmi_5',
            name: 'Temperature_Sensor_K_Type',
            category: 'sensors',
            description: 'K-type thermocouple model',
            modelIdentifier: 'TempSensorK',
            fmiVersion: '2.0',
            fmiType: 'Model Exchange',
            linkedElements: [],
            uploadDate: new Date().toISOString(),
            isUserUploaded: false
        },
        {
            id: 'fmi_6',
            name: 'Pressure_Sensor_Absolute',
            category: 'sensors',
            description: 'Absolute pressure sensor',
            modelIdentifier: 'PressureSensor',
            fmiVersion: '3.0',
            fmiType: 'Co-Simulation',
            linkedElements: [],
            uploadDate: new Date().toISOString(),
            isUserUploaded: false
        }
    ];
    
    // Initialize with mock data if empty
    onMount(() => {
        if ($fmiComponents.length === 0) {
            fmiComponents.set(mockComponents);
        }
    });
    
    $: filteredComponents = $fmiComponents.filter(comp => {
        const matchesSearch = comp.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                            comp.description.toLowerCase().includes(searchQuery.toLowerCase());
        return matchesSearch;
    });
    
    $: componentsByCategory = filteredComponents.reduce((acc, comp) => {
        if (!acc[comp.category]) {
            acc[comp.category] = [];
        }
        acc[comp.category].push(comp);
        return acc;
    }, {} as Record<string, FMIComponentType[]>);
    
    $: selectedNodeId = $currentNodes.find(n => n.selected)?.id || null;
    
    const toggleCategory = (category: string) => {
        if (expandedCategories.has(category)) {
            expandedCategories.delete(category);
        } else {
            expandedCategories.add(category);
        }
        expandedCategories = expandedCategories;
    };
    
    const linkComponent = (componentId: string) => {
        if (!selectedNodeId) {
            alert('Please select a component in the editor first');
            return;
        }
        
        componentLinks.update(links => {
            if (links[selectedNodeId] === componentId) {
                // Unlink if already linked
                delete links[selectedNodeId];
            } else {
                // Link component
                links[selectedNodeId] = componentId;
            }
            return { ...links };
        });
    };
    
    const handleUpload = () => {
        alert('FMU upload functionality coming soon!');
    };
    
    const handleAutoSelect = () => {
        alert('Auto-select based on requirements coming soon!');
    };
    
    const getCategoryIcon = (category: string) => {
        switch(category) {
            case 'motors':
                return 'M';
            case 'propellers':
                return 'P';
            case 'sensors':
                return 'S';
            case 'engines':
                return 'E';
            case 'controllers':
                return 'C';
            default:
                return 'O';
        }
    };
</script>

<div class="main-fmi-cont {isOpen ? 'open' : ''} shadow-sm" style:width={popoverWidth + 'px'}>
    <button class="btn-close" aria-label="Close" on:click={() => isOpen = false}>
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" d="M6 18 18 6M6 6l12 12" />
        </svg>          
    </button>
    
    <div class="fmi-header">
        <h3>FMI Components</h3>
        <div class="header-actions">
            <button class="btn-small" on:click={handleUpload} title="Upload FMU">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" d="M3 16.5v2.25A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75V16.5m-13.5-9L12 3m0 0 4.5 4.5M12 3v13.5" />
                </svg>
            </button>
        </div>
    </div>
    
    <div class="search-container">
        <input 
            type="text" 
            placeholder="Search components..."
            bind:value={searchQuery}
            class="search-input"
        />
    </div>
    
    <div class="components-tree">
        {#if Object.keys(componentsByCategory).length === 0}
            <div class="empty-state">
                <p>No components found</p>
            </div>
        {:else}
            {#each Object.entries(componentsByCategory) as [category, components]}
                <div class="category-section">
                    <button 
                        class="category-header"
                        on:click={() => toggleCategory(category)}
                    >
                        <svg 
                            class="expand-icon {expandedCategories.has(category) ? 'expanded' : ''}"
                            xmlns="http://www.w3.org/2000/svg" 
                            fill="none" 
                            viewBox="0 0 24 24" 
                            stroke-width="2" 
                            stroke="currentColor"
                        >
                            <path stroke-linecap="round" stroke-linejoin="round" d="m8.25 4.5 7.5 7.5-7.5 7.5" />
                        </svg>
                        <span class="category-icon">{getCategoryIcon(category)}</span>
                        <span class="category-name">{category.charAt(0).toUpperCase() + category.slice(1)}</span>
                        <span class="component-count">({components.length})</span>
                    </button>
                    
                    {#if expandedCategories.has(category)}
                        <div class="components-list">
                            {#each components as component}
                                <div 
                                    class="component-item {$componentLinks[selectedNodeId || ''] === component.id ? 'linked' : ''}"
                                    on:click={() => linkComponent(component.id)}
                                    role="button"
                                    tabindex="0"
                                >
                                    <div class="component-main">
                                        <span class="component-name">{component.name}</span>
                                        {#if $componentLinks[selectedNodeId || ''] === component.id}
                                            <svg class="link-icon" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor">
                                                <path stroke-linecap="round" stroke-linejoin="round" d="M13.19 8.688a4.5 4.5 0 0 1 1.242 7.244l-4.5 4.5a4.5 4.5 0 0 1-6.364-6.364l1.757-1.757m13.35-.622 1.757-1.757a4.5 4.5 0 0 0-6.364-6.364l-4.5 4.5a4.5 4.5 0 0 0 1.242 7.244" />
                                            </svg>
                                        {/if}
                                    </div>
                                    <div class="component-details">
                                        <span class="fmi-version">FMI {component.fmiVersion}</span>
                                        <span class="fmi-type">{component.fmiType}</span>
                                    </div>
                                </div>
                            {/each}
                        </div>
                    {/if}
                </div>
            {/each}
        {/if}
    </div>
    
    <div class="auto-select-section">
        <button class="auto-select-btn" on:click={handleAutoSelect}>
            <div class="auto-select-title">Auto</div>
            <div class="auto-select-description">Run auto select of components based on test scenarios and requirements</div>
        </button>
    </div>
    
    {#if selectedNodeId}
        <div class="selected-footer">
            <span>Selected: {selectedNodeId}</span>
        </div>
    {:else}
        <div class="selected-footer no-selection">
            <span>Select a component in the editor to link</span>
        </div>
    {/if}
</div>

<style>
    .main-fmi-cont {
        position: fixed;
        top: 90px;
        right: 15px;
        height: calc(100vh - 85px);
        background-color: white;
        border: var(--main-border);
        border-radius: var(--main-border-radius);
        z-index: 150;
        display: flex;
        flex-direction: column;
        transform: translateX(100%);
        transition: transform 0.3s;
    }
    
    .main-fmi-cont.open {
        transform: translateX(0);
    }
    
    .btn-close {
        position: absolute;
        top: 12px;
        left: 12px;
        width: 20px;
        height: 20px;
        background: none;
        border: none;
        cursor: pointer;
        display: flex;
        align-items: center;
        justify-content: center;
        border-radius: 4px;
        transition: background-color 0.2s;
        z-index: 10;
    }
    
    .btn-close:hover {
        background-color: rgba(0, 0, 0, 0.05);
    }
    
    .btn-close svg {
        width: 14px;
        height: 14px;
    }
    
    .fmi-header {
        padding: 20px;
        border-bottom: var(--main-border);
        display: flex;
        justify-content: space-between;
        align-items: center;
    }
    
    .fmi-header h3 {
        margin: 0;
        font-size: 18px;
        font-weight: 600;
    }
    
    .header-actions {
        display: flex;
        gap: 8px;
    }
    
    .btn-small {
        padding: 6px 12px;
        background: var(--main-dark-color);
        color: white;
        border: none;
        border-radius: 6px;
        cursor: pointer;
        font-size: 12px;
        display: flex;
        align-items: center;
        gap: 4px;
        transition: filter 0.2s;
    }
    
    .btn-small:hover {
        filter: brightness(1.1);
    }
    
    .btn-small svg {
        width: 14px;
        height: 14px;
    }
    
    
    .search-container {
        padding: 12px 20px;
        border-bottom: var(--main-border);
    }
    
    .search-input {
        width: 100%;
        padding: 8px 12px;
        border: 1px solid rgba(0, 0, 0, 0.1);
        border-radius: 6px;
        font-size: 14px;
        outline: none;
    }
    
    .search-input:focus {
        border-color: var(--main-dark-color);
    }
    
    .components-tree {
        flex: 1;
        overflow-y: auto;
        padding: 8px 0;
    }
    
    .empty-state {
        text-align: center;
        padding: 40px 20px;
        color: rgba(0, 0, 0, 0.5);
        font-size: 14px;
    }
    
    .category-section {
        margin-bottom: 4px;
    }
    
    .category-header {
        width: 100%;
        padding: 8px 20px;
        background: none;
        border: none;
        cursor: pointer;
        display: flex;
        align-items: center;
        gap: 8px;
        font-size: 14px;
        text-align: left;
        transition: background-color 0.2s;
    }
    
    .category-header:hover {
        background-color: rgba(0, 0, 0, 0.02);
    }
    
    .expand-icon {
        width: 16px;
        height: 16px;
        transition: transform 0.2s;
        flex-shrink: 0;
    }
    
    .expand-icon.expanded {
        transform: rotate(90deg);
    }
    
    .category-icon {
        width: 20px;
        height: 20px;
        background: var(--main-dark-color);
        color: white;
        border-radius: 4px;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 12px;
        font-weight: 600;
        flex-shrink: 0;
    }
    
    .category-name {
        flex: 1;
        font-weight: 500;
    }
    
    .component-count {
        color: rgba(0, 0, 0, 0.5);
        font-size: 12px;
    }
    
    .components-list {
        padding-left: 44px;
        padding-right: 20px;
    }
    
    .component-item {
        padding: 8px 12px;
        margin-bottom: 2px;
        background: var(--main-grey-color);
        border-radius: 6px;
        cursor: pointer;
        transition: all 0.2s;
        border: 1px solid transparent;
    }
    
    .component-item:hover {
        background: white;
        border-color: rgba(0, 0, 0, 0.1);
    }
    
    .component-item.linked {
        background: #e8f0fe;
        border-color: #3b82f6;
    }
    
    .component-main {
        display: flex;
        align-items: center;
        justify-content: space-between;
        margin-bottom: 4px;
    }
    
    .component-name {
        font-size: 13px;
        font-weight: 500;
        color: rgba(0, 0, 0, 0.8);
    }
    
    .link-icon {
        width: 14px;
        height: 14px;
        color: #3b82f6;
    }
    
    .component-details {
        display: flex;
        gap: 12px;
        font-size: 11px;
        color: rgba(0, 0, 0, 0.5);
    }
    
    .fmi-version {
        background: rgba(0, 0, 0, 0.05);
        padding: 2px 6px;
        border-radius: 3px;
    }
    
    .selected-footer {
        padding: 12px 20px;
        border-top: var(--main-border);
        font-size: 13px;
        background: rgba(59, 130, 246, 0.05);
        color: #3b82f6;
    }
    
    .selected-footer.no-selection {
        background: rgba(0, 0, 0, 0.02);
        color: rgba(0, 0, 0, 0.5);
    }
    
    .auto-select-section {
        padding: 16px 20px;
        border-top: var(--main-border);
    }
    
    .auto-select-btn {
        width: 100%;
        padding: 12px 16px;
        background: var(--main-dark-color);
        color: white;
        border: none;
        border-radius: 8px;
        cursor: pointer;
        text-align: left;
        transition: filter 0.2s;
    }
    
    .auto-select-btn:hover {
        filter: brightness(1.1);
    }
    
    .auto-select-title {
        font-size: 14px;
        font-weight: 600;
        margin-bottom: 4px;
    }
    
    .auto-select-description {
        font-size: 12px;
        color: rgba(255, 255, 255, 0.8);
        line-height: 1.3;
    }
</style>