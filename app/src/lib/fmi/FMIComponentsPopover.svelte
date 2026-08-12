<script lang="ts">
    import { onMount } from 'svelte';
    import { RefreshCw, Plus, ShieldCheck, ShieldOff, Trash2 } from '@lucide/svelte';
    import { fmiComponents, componentLinks, currentNodes, ckanSites, addCkanSite, removeCkanSite, type CkanSite } from '$lib/stores/stores.svelte';
    import type { FMIComponentType } from '$lib/types/types';
    import { fetchCatalogFmuComponents, getCatalogApiBaseUrl } from './catalogApi';
    import { capitalize } from 'lodash';
    
    interface Props {
        isOpen?: boolean;
    }

    let { isOpen = $bindable(false) }: Props = $props();

    type ManufacturerFilter = string;
    type SourceFilter = string;
    
    let searchQuery = $state('');
    let manufacturerFilter = $state<ManufacturerFilter>('all');
    let sourceFilter = $state<SourceFilter>('all');
    let expandedCategories: Set<string> = $state(new Set(['motors', 'propellers', 'sensors', 'engines', 'controllers', 'other']));
    let isLoadingCatalog = $state(false);
    let catalogError = $state('');
    let catalogLastLoadedCount = $state(0);

    // Add Catalog state
    let showAddCatalog = $state(false);
    let newCatalogName = $state('');
    let newCatalogUrl = $state('');
    let addCatalogError = $state('');
    let isAddingCatalog = $state(false);
    let newCatalogIsSecure = $state(false);

    const popoverWidth = 360;

    // ─── Dynamic source filters: OEM Platform (hardcoded) + CKAN sites from store ───

    let sourceFilters = $derived([
        { value: 'all', label: 'All sources', isSecure: false },
        { value: 'oem', label: 'OEM Platform', isSecure: true },
        ...$ckanSites.map((site) => ({ value: site.id, label: site.name, isSecure: site.isSecure }))
    ]);

    // ─── Dynamic manufacturer filters: derived from actual oemName on components ───

    let manufacturerFilters = $derived.by(() => {
        const counts = new Map<string, number>();
        for (const c of $fmiComponents) {
            const oem = c.oemName?.trim();
            if (oem) counts.set(oem, (counts.get(oem) || 0) + 1);
        }
        // Sort by frequency descending, take top 8
        const topOems = Array.from(counts.entries())
            .sort((a, b) => b[1] - a[1])
            .slice(0, 8)
            .map(([oem]) => ({ value: oem, label: truncateLabel(oem, 14) }));

        // Add 'Other' for components without an oemName
        const hasUnknown = $fmiComponents.some(c => !c.oemName?.trim());
        const filters: { value: ManufacturerFilter; label: string }[] = [
            { value: 'all', label: 'All' },
            ...topOems
        ];
        if (hasUnknown) filters.push({ value: 'other', label: 'Other' });
        return filters;
    });

    function truncateLabel(text: string, max: number) {
        return text.length > max ? text.slice(0, max - 1) + '…' : text;
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
            isUserUploaded: false,
            oemName: 'ABB',
            oemShortCode: 'ABB',
            requirements: [
                {
                    name: 'MotorTorqueLimit',
                    id: 'FMI-MOT-001',
                    description: 'Motor output torque shall not exceed rated torque',
                    temporalOperator: 'Globally',
                    rightHandSide: {
                        leftHandSide: 'motor.outputTorque',
                        operator: '<=',
                        rightHandSide: 420
                    }
                },
                {
                    name: 'MotorTemperatureLimit',
                    id: 'FMI-MOT-002',
                    description: 'Motor temperature shall remain within safe operating range',
                    temporalOperator: 'Globally',
                    rightHandSide: {
                        leftHandSide: 'motor.temperature',
                        operator: '<=',
                        rightHandSide: 150
                    }
                }
            ]
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
            isUserUploaded: false,
            requirements: [
                {
                    name: 'BLDCSpeedRange',
                    id: 'FMI-MOT-003',
                    description: 'BLDC motor speed shall remain within operational limits',
                    temporalOperator: 'Globally',
                    rightHandSide: {
                        leftHandSide: 'motor.speed',
                        operator: '<=',
                        rightHandSide: 8000
                    }
                }
            ]
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
            isUserUploaded: false,
            oemName: 'Kongsberg',
            oemShortCode: 'KM'
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
            isUserUploaded: false,
            requirements: [
                {
                    name: 'SensorTemperatureRange',
                    id: 'FMI-SEN-001',
                    description: 'Temperature sensor reading shall be within calibrated range',
                    temporalOperator: 'Globally',
                    rightHandSide: {
                        leftHandSide: 'sensor.temperature',
                        operator: '<=',
                        rightHandSide: 500
                    }
                },
                {
                    name: 'SensorAccuracy',
                    id: 'FMI-SEN-002',
                    description: 'Sensor error shall remain within specified tolerance',
                    temporalOperator: 'Globally',
                    rightHandSide: {
                        leftHandSide: 'sensor.error',
                        operator: '<=',
                        rightHandSide: 2.5
                    }
                }
            ]
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
            isUserUploaded: false,
            requirements: [
                {
                    name: 'PressureRangeLimit',
                    id: 'FMI-SEN-003',
                    description: 'Pressure reading shall not exceed sensor maximum rating',
                    temporalOperator: 'Globally',
                    rightHandSide: {
                        leftHandSide: 'sensor.pressure',
                        operator: '<=',
                        rightHandSide: 1000
                    }
                }
            ]
        }
    ];
    
    const loadCatalogComponents = async (force = false) => {
        // Session cache: fmiComponents (writable) survives component remounts —
        // skip fetch if we already have catalog data from this page session.
        if (!force && $fmiComponents.length > 0) return;
        isLoadingCatalog = true;
        catalogError = '';

        try {
            const catalogComponents = await fetchCatalogFmuComponents();

            if (catalogComponents.length === 0) {
                console.warn('Catalog returned no FMUs; loading sample FMUs');
                fmiComponents.set(mockComponents.map(component => ({
                    ...component,
                    catalogSource: 'mock'
                })));
                catalogLastLoadedCount = mockComponents.length;
            } else {
                const catalogIds = new Set(catalogComponents.map(component => component.id));
                const linkedFmuIds = new Set(Object.values($componentLinks));
                const existingLinkedComponents = $fmiComponents.filter(component => linkedFmuIds.has(component.id) && !catalogIds.has(component.id));
                fmiComponents.set([...catalogComponents, ...existingLinkedComponents]);
                catalogLastLoadedCount = catalogComponents.length;
            }
        } catch (error) {
            console.error('Failed to load FMU catalog:', error);
            catalogError = error instanceof Error ? error.message : 'Failed to load FMU catalog';
            fmiComponents.set(mockComponents.map(component => ({
                ...component,
                catalogSource: 'mock'
            })));
            catalogLastLoadedCount = mockComponents.length;
        } finally {
            isLoadingCatalog = false;
        }
    };

    onMount(() => {
        loadCatalogComponents();
    });

    /** Returns the oemName for filtering, or 'other' if none set */
    const getManufacturer = (component: FMIComponentType): ManufacturerFilter => {
        return component.oemName?.trim() || 'other';
    };

    const getSource = (component: FMIComponentType): string => {
        if (component.catalogSource === 'digitalTwin') {
            return $ckanSites.find((site) => component.id.startsWith(`ckan-${site.id}-`))?.id ?? 'digitalTwin';
        }
        return 'oem';
    };

    const getSourceLabel = (component: FMIComponentType): string => {
        if (component.catalogSource === 'digitalTwin') {
            return $ckanSites.find((site) => component.id.startsWith(`ckan-${site.id}-`))?.name ?? 'Digital Twin';
        }
        return 'OEM Platform';
    };

    // ─── Add Catalog ───

    async function handleAddCatalog() {
        addCatalogError = '';
        const name = newCatalogName.trim();
        let url = newCatalogUrl.trim();

        if (!name || !url) {
            addCatalogError = 'Both name and catalog URL are required.';
            return;
        }

        // Allow scheme-less input like "trustedtwincatalog.com/catalog.jsonld"
        if (!/^https?:\/\//i.test(url)) {
            url = `https://${url}`;
        }

        // Only accept jsonld catalog URLs
        if (!/\.jsonld$/i.test(url) && !url.includes('catalog.jsonld')) {
            addCatalogError = 'Only catalog.jsonld endpoints are accepted.';
            return;
        }

        isAddingCatalog = true;
        try {
            // Validate the catalog URL is reachable
            const response = await fetch(`/api/ckan-catalog?url=${encodeURIComponent(url)}&page=1`, {
                headers: { Accept: 'application/ld+json' }
            });
            if (!response.ok) {
                const text = await response.text().catch(() => '');
                throw new Error(`Catalog fetch failed (${response.status}): ${text.slice(0, 120)}`);
            }
            addCkanSite(name, url, newCatalogIsSecure);
            newCatalogName = '';
            newCatalogUrl = '';
            newCatalogIsSecure = false;
            showAddCatalog = false;
            // Load the newly added catalog's digital twins immediately (bypasses the session cache)
            loadCatalogComponents(true);
        } catch (error) {
            addCatalogError = error instanceof Error ? error.message : 'Failed to add catalog';
        } finally {
            isAddingCatalog = false;
        }
    }

    function handleRemoveCatalog(siteId: string) {
        removeCkanSite(siteId);
    }
    
    let filteredComponents = $derived($fmiComponents.filter(comp => {
        const query = searchQuery.trim().toLowerCase();

        if (manufacturerFilter !== 'all' && getManufacturer(comp) !== manufacturerFilter) {
            return false;
        }

        if (sourceFilter !== 'all' && getSource(comp) !== sourceFilter) {
            return false;
        }

        if (!query) {
            return true;
        }

        const searchableText = [
            comp.name,
            comp.description,
            comp.domain,
            comp.filename,
            comp.modelIdentifier,
            comp.oemName,
            comp.oemShortCode,
            comp.fmiType,
            comp.fmiVersion
        ].filter(Boolean).join(' ').toLowerCase();

        return searchableText.includes(query);
    }));
    
    let componentsByCategory = $derived(filteredComponents.reduce((acc, comp) => {
        if (!acc[comp.category]) {
            acc[comp.category] = [];
        }
        acc[comp.category].push(comp);
        return acc;
    }, {} as Record<string, FMIComponentType[]>));
    
    let selectedNodeId = $derived($currentNodes.find(n => n.selected)?.id || null);
    
    const toggleCategory = (category: string) => {
        const next = new Set(expandedCategories);
        if (next.has(category)) {
            next.delete(category);
        } else {
            next.add(category);
        }
        expandedCategories = next;
    };

    // All categories currently visible (respects search/filter)
    let visibleCategories = $derived(Object.keys(componentsByCategory));

    // True when every visible category is expanded
    let allExpanded = $derived(
        visibleCategories.length > 0 && visibleCategories.every((cat) => expandedCategories.has(cat))
    );

    const toggleAllCategories = () => {
        if (allExpanded) {
            expandedCategories = new Set();
        } else {
            expandedCategories = new Set(visibleCategories);
        }
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
    
    const handleAutoSelect = () => {
        alert('Auto-select based on requirements coming soon!');
    };

    const getVariableSummary = (component: FMIComponentType) => {
        const counts = [
            typeof component.inputCount === 'number' ? `${component.inputCount} in` : '',
            typeof component.outputCount === 'number' ? `${component.outputCount} out` : '',
            typeof component.parameterCount === 'number' ? `${component.parameterCount} param` : ''
        ].filter(Boolean);

        return counts.join(' / ');
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
    <button class="btn-close" aria-label="Close" onclick={() => isOpen = false}>
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" d="M6 18 18 6M6 6l12 12" />
        </svg>          
    </button>
    
    <div class="fmi-header">
        <h3>FMU Catalog</h3>
        <div class="header-actions">
            <button class="btn-small" onclick={() => showAddCatalog = !showAddCatalog} title="Add CKAN catalog">
                <Plus size={14} />
            </button>
            <button class="btn-small" onclick={() => loadCatalogComponents(true)} title="Refresh FMU catalog" disabled={isLoadingCatalog}>
                <span class={isLoadingCatalog ? 'spin-icon' : ''}>
                    <RefreshCw size={14} />
                </span>
            </button>
        </div>
    </div>

    <div class="catalog-status {catalogError ? 'error' : ''}">
        {#if catalogError}
            <span>Catalog unavailable. Showing cached FMUs.</span>
        {:else if isLoadingCatalog}
            <span>Loading FMUs from {getCatalogApiBaseUrl()}</span>
        {:else}
            <span>{catalogLastLoadedCount || $fmiComponents.length} FMUs loaded from catalog</span>
        {/if}
    </div>
    
    <div class="search-container">
        <input 
            type="text" 
            placeholder="Search FMUs..."
            bind:value={searchQuery}
            class="search-input"
        />
    </div>

    <!-- ─── Add Catalog Section ─── -->
    {#if showAddCatalog}
        <div class="add-catalog-section">
            <div class="add-catalog-header">
                <span class="add-catalog-title">Add CKAN Catalog</span>
                <button class="add-catalog-close" onclick={() => { showAddCatalog = false; addCatalogError = ''; }} aria-label="Close">
                    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                </button>
            </div>
            <div class="add-catalog-form">
                <input type="text" placeholder="Catalog name (e.g., My Catalog)" bind:value={newCatalogName} class="add-catalog-input" />
                <input type="url" placeholder="https://example.com/catalog.jsonld" bind:value={newCatalogUrl} class="add-catalog-input" />
                <label class="add-catalog-secure">
                    <input type="checkbox" bind:checked={newCatalogIsSecure} />
                    <span>Secure catalog</span>
                </label>
                <button class="add-catalog-btn" onclick={handleAddCatalog} disabled={isAddingCatalog}>
                    {isAddingCatalog ? 'Adding...' : 'Add Catalog'}
                </button>
            </div>
            {#if addCatalogError}
                <div class="add-catalog-error">{addCatalogError}</div>
            {/if}
            <!-- Existing CKAN sites with remove buttons -->
            {#if $ckanSites.length > 0}
                <div class="ckan-sites-list">
                    <span class="ckan-sites-label">Active catalogs</span>
                    {#each $ckanSites as site}
                        <div class="ckan-site-row">
                            <span class="ckan-site-secure {site.isSecure ? 'is-secure' : 'is-insecure'}" title={site.isSecure ? 'Secure catalog' : 'Not secure catalog'}>
                                {#if site.isSecure}
                                    <ShieldCheck size={11} strokeWidth={2.4} />
                                    <span>Secure</span>
                                {:else}
                                    <ShieldOff size={11} strokeWidth={2.4} />
                                    <span>Not secure</span>
                                {/if}
                            </span>
                            <span class="ckan-site-name">{site.name}</span>
                            <button class="ckan-site-remove" onclick={() => handleRemoveCatalog(site.id)} title="Remove {site.name}">
                                <Trash2 size={12} />
                            </button>
                        </div>
                    {/each}
                </div>
            {/if}
        </div>
    {/if}

    <div class="filter-container">
        <div class="filter-label">Manufacturer</div>
        <div class="manufacturer-filter" role="group" aria-label="Filter FMUs by manufacturer">
            {#each manufacturerFilters as filter}
                <button
                    type="button"
                    class:active={manufacturerFilter === filter.value}
                    onclick={() => manufacturerFilter = filter.value}
                    title={filter.label}
                >
                    {filter.label}
                </button>
            {/each}
        </div>
    </div>

    <div class="filter-container">
        <div class="filter-label">Source</div>
        <div class="source-filter" role="group" aria-label="Filter FMUs by catalog source">
            {#each sourceFilters as filter}
                <button
                    type="button"
                    class:active={sourceFilter === filter.value}
                    onclick={() => sourceFilter = filter.value}
                    title={filter.label}
                >
                    {#if filter.value !== 'all'}
                        {#if filter.isSecure}
                            <span class="source-secure-check">
                                <ShieldCheck size={14} strokeWidth={2.5} />
                            </span>
                        {:else}
                            <span class="source-insecure-check">
                                <ShieldOff size={14} strokeWidth={2.5} />
                            </span>
                        {/if}
                    {/if}
                    {filter.label}
                </button>
            {/each}
        </div>
    </div>
    
    <div class="components-tree">
        {#if visibleCategories.length > 0}
            <div class="tree-header">
                <button class="tree-toggle-btn" onclick={toggleAllCategories}>
                    {allExpanded ? 'Collapse all' : 'Expand all'}
                </button>
            </div>
        {/if}
        {#if visibleCategories.length === 0}
            <div class="empty-state">
                <p>{isLoadingCatalog ? 'Loading FMUs...' : 'No FMUs found'}</p>
            </div>
        {:else}
            {#each Object.entries(componentsByCategory) as [category, components]}
                <div class="category-section">
                    <button 
                        class="category-header"
                        onclick={() => toggleCategory(category)}
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
                        <span class="category-name">{capitalize(category)}</span>
                        <span class="component-count">({components.length})</span>
                    </button>
                    
                    {#if expandedCategories.has(category)}
                        <div class="components-list">
                            {#each components as component}
                                <button
                                    type="button"
                                    class="component-item {$componentLinks[selectedNodeId || ''] === component.id ? 'linked' : ''}"
                                    onclick={() => linkComponent(component.id)}
                                >
                                    <div class="component-main">
                                        <span class="component-name">{component.name}</span>
                                        <div class="component-main-actions">
                                            {#if component.isSecure === true}
                                                <span class="secure-check" title="Secure source">
                                                    <ShieldCheck size={18} strokeWidth={2.7} />
                                                </span>
                                            {:else if component.isSecure === false}
                                                <span class="insecure-check" title="Not a secure source">
                                                    <ShieldOff size={18} strokeWidth={2.7} />
                                                </span>
                                            {/if}
                                            {#if $componentLinks[selectedNodeId || ''] === component.id}
                                                <svg class="link-icon" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor">
                                                    <path stroke-linecap="round" stroke-linejoin="round" d="M13.19 8.688a4.5 4.5 0 0 1 1.242 7.244l-4.5 4.5a4.5 4.5 0 0 1-6.364-6.364l1.757-1.757m13.35-.622 1.757-1.757a4.5 4.5 0 0 0-6.364-6.364l-4.5 4.5a4.5 4.5 0 0 0 1.242 7.244" />
                                                </svg>
                                            {/if}
                                        </div>
                                    </div>
                                    <div class="component-description">{component.description}</div>
                                    <div class="component-details">
                                        <span class="fmi-version">FMI {component.fmiVersion}</span>
                                        <span class="fmi-type">{component.fmiType}</span>
                                        {#if component.oemShortCode}
                                            <span>{component.oemShortCode}</span>
                                        {/if}
                                        {#if getVariableSummary(component)}
                                            <span>{getVariableSummary(component)}</span>
                                        {/if}
                                        <span class="source-badge">{getSourceLabel(component)}</span>
                                    </div>
                                </button>
                            {/each}
                        </div>
                    {/if}
                </div>
            {/each}
        {/if}
    </div>
    
    <div class="auto-select-section">
        <button class="auto-select-btn" onclick={handleAutoSelect}>
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
        transform: translateX(120%);
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
        padding: 30px;
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

    .btn-small:disabled {
        cursor: wait;
        opacity: 0.7;
    }
    
    .btn-small span {
        display: flex;
        align-items: center;
        justify-content: center;
    }

    .spin-icon {
        animation: spin 1s linear infinite;
    }

    @keyframes spin {
        from { transform: rotate(0deg); }
        to { transform: rotate(360deg); }
    }

    .catalog-status {
        padding: 8px 20px;
        border-bottom: var(--main-border);
        font-size: 12px;
        color: rgba(0, 0, 0, 0.55);
        line-height: 1.3;
    }

    .catalog-status.error {
        color: #b45309;
        background: #fffbeb;
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

    /* ─── Add Catalog Section ─── */

    .add-catalog-section {
        padding: 12px 20px;
        border-bottom: var(--main-border);
        background: rgba(59, 130, 246, 0.03);
    }

    .add-catalog-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 8px;
    }

    .add-catalog-title {
        font-size: 12px;
        font-weight: 600;
        color: rgba(0, 0, 0, 0.7);
    }

    .add-catalog-close {
        background: none;
        border: none;
        cursor: pointer;
        padding: 2px;
        border-radius: 3px;
        display: flex;
        align-items: center;
    }

    .add-catalog-close:hover {
        background: rgba(0, 0, 0, 0.06);
    }

    .add-catalog-form {
        display: flex;
        flex-direction: column;
        gap: 6px;
    }

    .add-catalog-input {
        width: 100%;
        padding: 6px 8px;
        border: 1px solid rgba(0, 0, 0, 0.15);
        border-radius: 4px;
        font-size: 12px;
        outline: none;
        box-sizing: border-box;
    }

    .add-catalog-input:focus {
        border-color: var(--main-dark-color);
    }

    .add-catalog-btn {
        padding: 6px 10px;
        background: var(--main-dark-color);
        color: white;
        border: none;
        border-radius: 4px;
        cursor: pointer;
        font-size: 12px;
        font-weight: 600;
        transition: filter 0.2s;
    }

    .add-catalog-btn:hover {
        filter: brightness(1.1);
    }

    .add-catalog-btn:disabled {
        opacity: 0.6;
        cursor: not-allowed;
    }

    .add-catalog-secure {
        display: flex;
        align-items: center;
        gap: 6px;
        font-size: 12px;
        color: rgba(0, 0, 0, 0.65);
        cursor: pointer;
        user-select: none;
    }

    .add-catalog-secure input {
        accent-color: #16a34a;
        cursor: pointer;
    }

    .add-catalog-error {
        margin-top: 6px;
        font-size: 11px;
        color: #b91c1c;
        background: #fef2f2;
        border: 1px solid #fecaca;
        border-radius: 4px;
        padding: 4px 8px;
    }

    .ckan-sites-list {
        margin-top: 10px;
        max-height: 100px;
        overflow-y: auto;
    }

    .ckan-sites-label {
        display: block;
        font-size: 10px;
        font-weight: 600;
        color: rgba(0, 0, 0, 0.45);
        margin-bottom: 4px;
        text-transform: uppercase;
    }

    .ckan-site-row {
        display: flex;
        align-items: center;
        justify-content: space-between;
        padding: 3px 0;
        font-size: 11px;
        color: rgba(0, 0, 0, 0.65);
    }

    .ckan-site-name {
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
        flex: 1;
        min-width: 0;
    }

    .ckan-site-secure {
        display: inline-flex;
        align-items: center;
        gap: 3px;
        font-size: 10px;
        font-weight: 500;
        padding: 2px 6px;
        border-radius: 3px;
        margin-right: 6px;
        background: rgba(0, 0, 0, 0.06);
        color: rgba(0, 0, 0, 0.5);
        flex-shrink: 0;
    }

    .ckan-site-secure.is-secure {
        background: rgba(22, 163, 74, 0.12);
        color: #16a34a;
    }

    .ckan-site-secure.is-insecure {
        background: rgba(220, 38, 38, 0.1);
        color: #dc2626;
    }

    .ckan-site-remove {
        background: none;
        border: none;
        cursor: pointer;
        padding: 2px 4px;
        border-radius: 3px;
        color: rgba(0, 0, 0, 0.35);
        flex-shrink: 0;
        display: flex;
        align-items: center;
    }

    .ckan-site-remove:hover {
        color: #b91c1c;
        background: rgba(185, 28, 28, 0.06);
    }

    /* ─── Filter Containers ─── */

    .filter-container {
        padding: 10px 20px 12px;
        border-bottom: var(--main-border);
    }

    .filter-label {
        margin-bottom: 8px;
        color: rgba(0, 0, 0, 0.55);
        font-size: 12px;
        line-height: 1;
    }

    .manufacturer-filter {
        display: grid;
        grid-template-columns: repeat(4, minmax(0, 1fr));
        padding: 3px;
        border: 1px solid rgba(0, 0, 0, 0.1);
        border-radius: 6px;
        background: var(--main-grey-color);
        gap: 2px;
    }

    .manufacturer-filter button {
        min-width: 0;
        height: 28px;
        padding: 0 6px;
        border: none;
        border-radius: 4px;
        background: transparent;
        color: rgba(0, 0, 0, 0.65);
        cursor: pointer;
        font-family: inherit;
        font-size: 11px;
        font-weight: 500;
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
    }

    .manufacturer-filter button:hover {
        background: rgba(255, 255, 255, 0.75);
    }

    .manufacturer-filter button.active {
        background: white;
        color: var(--main-dark-color);
        box-shadow: 0 1px 2px rgba(0, 0, 0, 0.08);
    }

    .source-filter {
        display: flex;
        flex-wrap: wrap;
        gap: 4px;
        padding: 3px;
        border: 1px solid rgba(0, 0, 0, 0.1);
        border-radius: 6px;
        background: var(--main-grey-color);
    }

    .source-filter button {
        min-width: 0;
        padding: 4px 8px;
        border: none;
        border-radius: 4px;
        background: transparent;
        color: rgba(0, 0, 0, 0.65);
        cursor: pointer;
        font-family: inherit;
        font-size: 11px;
        font-weight: 500;
        line-height: 1.2;
        text-align: left;
        display: inline-flex;
        align-items: center;
        gap: 3px;
    }

    .source-filter button:hover {
        background: rgba(255, 255, 255, 0.75);
    }

    .source-filter button.active {
        background: white;
        color: var(--main-dark-color);
        box-shadow: 0 1px 2px rgba(0, 0, 0, 0.08);
    }

    .source-secure-check {
        display: inline-flex;
        align-items: center;
        color: #16a34a;
        flex-shrink: 0;
    }

    .source-insecure-check {
        display: inline-flex;
        align-items: center;
        color: #dc2626;
        flex-shrink: 0;
    }

    .source-badge {
        background: rgba(59, 130, 246, 0.1);
        color: #3b82f6;
        padding: 2px 6px;
        border-radius: 3px;
        font-size: 10px;
    }
    
    .components-tree {
        flex: 1;
        overflow-y: auto;
        padding: 0 0 8px 0;
    }

    .tree-header {
        display: flex;
        justify-content: flex-end;
        padding: 10px 20px 0 20px;
    }

    .tree-toggle-btn {
        padding: 8px 12px;
        background: var(--main-dark-color);
        color: white;
        border: none;
        border-radius: 6px;
        cursor: pointer;
        font-size: 12px;
        font-family: inherit;
        transition: filter 0.2s;
    }

    .tree-toggle-btn:hover {
        filter: brightness(1.1);
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
        width: 100%;
        padding: 8px 12px;
        margin-bottom: 2px;
        background: var(--main-grey-color);
        border-radius: 6px;
        cursor: pointer;
        transition: all 0.2s;
        border: 1px solid transparent;
        display: block;
        text-align: left;
        font-family: inherit;
        appearance: none;
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
        min-width: 0;
    }

    .component-description {
        color: rgba(0, 0, 0, 0.55);
        font-size: 11px;
        line-height: 1.25;
        margin-bottom: 6px;
        overflow: hidden;
        display: -webkit-box;
        -webkit-box-orient: vertical;
        -webkit-line-clamp: 2;
        line-clamp: 2;
    }
    
    .component-main-actions {
        display: flex;
        align-items: center;
        gap: 6px;
        flex-shrink: 0;
        margin-left: 8px;
    }

    .secure-check {
        display: flex;
        align-items: center;
        justify-content: center;
        color: #16a34a;
        flex-shrink: 0;
    }

    .insecure-check {
        display: flex;
        align-items: center;
        justify-content: center;
        color: #dc2626;
        flex-shrink: 0;
    }


    .link-icon {
        width: 14px;
        height: 14px;
        color: #3b82f6;
        flex-shrink: 0;
    }
    
    .component-details {
        display: flex;
        flex-wrap: wrap;
        gap: 4px 8px;
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
