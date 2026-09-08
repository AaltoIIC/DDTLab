<script lang="ts">
    import { goto } from '$app/navigation';
    import Tooltip from '$lib/Tooltip.svelte';
    import { Component, Box, Library, FileText, Package, Grid2X2, Squircle, Weight } from '@lucide/svelte';
    import { navigateToRoot } from './nodeViewStore';
    import { currentNodes, notification } from '$lib/stores/stores.svelte';
    import { get } from 'svelte/store';
    import ConceptLibrarySlider from './ConceptLibrarySlider.svelte';
    import ConceptTemplateSlider from './ConceptTemplateSlider.svelte';
    import { overSome } from 'lodash';
    import DefinitionSlider from './DefinitionSlider.svelte';
    import ViewpointSelector from './viewpoints/ViewpointSelector.svelte';
    import MassCalculatorSlider from './MassCalculatorSlider.svelte';
    import { modelHealth, semanticSession, type ModelHealthState } from './sysml/session';
    
    let isPackageOpen = $state(false);
    let isPartDefOpen = $state(false);
    let isItemDefOpen = $state(false);
    let isLibraryOpen = $state(false);
    let isTemplateSliderOpen = $state(false);
    let isMassCalculatorOpen = $state(false);

    function handleHomeClick() {
        // Reset to root level before navigating away
        navigateToRoot();
        goto('/');
    }

    function closeAllSliders() {
        isPackageOpen = isItemDefOpen = isPartDefOpen = isLibraryOpen = isTemplateSliderOpen = isMassCalculatorOpen = false;
    }

    function toggleMassCalculator() {
        closeAllSliders();
        isMassCalculatorOpen = true;
    }

    function togglePackageSlider() {
        closeAllSliders();
        isPackageOpen = true;
    }

    function togglePartDefSlider() {
        closeAllSliders();
        isPartDefOpen = true;
    }

    function toggleItemDefSlider() {
        closeAllSliders();
        isItemDefOpen = true;
    }

    function toggleLibrary() {
        closeAllSliders();
        isLibraryOpen = true;
    }
    
    function toggleTemplateSlider() {
        closeAllSliders();
        isTemplateSliderOpen = true;
    }

    // Passive "model health" badge (plan §5 Phase 4): non-blocking, reports
    // the WF001–WF008 diagnostics of the committed semantic model. Errors are
    // impossible in a committed document (the repository rejects them), so in
    // practice this surfaces heuristic warnings.
    function healthLabel(health: ModelHealthState): string {
        if (health.errorCount > 0) return health.errorCount === 1 ? '1 model error' : `${health.errorCount} model errors`;
        if (health.warningCount > 0) return health.warningCount === 1 ? '1 model warning' : `${health.warningCount} model warnings`;
        return 'Model healthy';
    }
</script>

<div id="sidebar" class="sidebar">
        <Tooltip text="Home" position="right">
            <button class="menu-option-logo" onclick={handleHomeClick}>
                <div class="logo-cont">
                    <img class="logo-icon" src="/icon.svg" alt="Home" />
                </div>
            </button>
        </Tooltip>

        <div class="separator"></div>

        <!-- Viewpoint Selector -->
        <ViewpointSelector />

        <div class="separator"></div>

        <Tooltip text="Add Package" position="right">
            <button
                id="pkgBtn"
                class="menu-option" 
                class:active={isPackageOpen}
                onclick={togglePackageSlider} 
            >
                <span class="option-icon"><Package /></span>
            </button>
        </Tooltip>

        <Tooltip text="Add Part" position="right">
            <button 
                id="partBtn"
                class="menu-option" 
                class:active={isPartDefOpen} 
                onclick={togglePartDefSlider}
            >
                <span class="option-icon"><Grid2X2 /></span>
            </button>
        </Tooltip>

        <Tooltip text="Add Item" position="right">
            <button 
                id="itemBtn"
                class="menu-option" 
                class:active={isItemDefOpen} 
                onclick={toggleItemDefSlider}
            >
                <span class="option-icon"><Squircle /></span>
            </button>
        </Tooltip>


        <div class="separator"></div>

        <Tooltip text="Concept Library" position="right">
            <button 
                id="conLibBtn"
                class="menu-option" 
                class:active={isLibraryOpen} 
                onclick={toggleLibrary}
            >
                <span class="option-icon"><Library /></span>
            </button>
        </Tooltip>

        <Tooltip text="Saved Templates" position="right">
            <button
                id="templateBtn"
                class="menu-option"
                class:active={isTemplateSliderOpen}
                onclick={toggleTemplateSlider}
            >
                <span class="option-icon"><FileText /></span>
            </button>
        </Tooltip>

        <div class="separator"></div>

        <Tooltip text="Calculate Total Mass" position="right">
            <button
                id="massCalcBtn"
                class="menu-option"
                class:active={isMassCalculatorOpen}
                onclick={toggleMassCalculator}
            >
                <Weight class="option-icon" />
            </button>
        </Tooltip>

        {#if $semanticSession}
            <Tooltip text={healthLabel($modelHealth)} position="right">
                <div
                    class="model-health"
                    class:ok={$modelHealth.errorCount === 0 && $modelHealth.warningCount === 0}
                    class:warning={$modelHealth.errorCount === 0 && $modelHealth.warningCount > 0}
                    class:error={$modelHealth.errorCount > 0}
                >
                    <span class="health-dot"></span>
                    {#if $modelHealth.warningCount > 0 || $modelHealth.errorCount > 0}
                        <span class="health-count">
                            {$modelHealth.errorCount > 0 ? $modelHealth.errorCount : $modelHealth.warningCount}
                        </span>
                    {/if}
                </div>
            </Tooltip>
        {/if}

        <div class="separator" style="margin-top: auto;"></div>
    <div class="bottom-buttons">
        <Tooltip text="Report Bug" position="right">
            <a href="https://github.com/AaltoIIC/DDTLab/issues"
                aria-label="Report bug" target="_blank">
                <button id="bugBtn" class="menu-option" aria-label="Report bug">
                    <svg class="option-icon report" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.2" stroke="currentColor">
                        <path stroke-linecap="round" stroke-linejoin="round" d="M12 9v3.75m9-.75a9 9 0 1 1-18 0 9 9 0 0 1 18 0Zm-9 3.75h.008v.008H12v-.008Z" />
                    </svg>              
                </button>
            </a>
        </Tooltip>            
    </div>
</div>

<ConceptTemplateSlider isPackage={true} isOpen={isPackageOpen} onClose={closeAllSliders}/>
<DefinitionSlider type='part' isOpen={isPartDefOpen} onClose={closeAllSliders} />
<DefinitionSlider type='item' isOpen={isItemDefOpen} onClose={closeAllSliders} />
<ConceptLibrarySlider isOpen={isLibraryOpen} onClose={closeAllSliders} />
<ConceptTemplateSlider isOpen={isTemplateSliderOpen} onClose={closeAllSliders} />
<MassCalculatorSlider isOpen={isMassCalculatorOpen} onClose={closeAllSliders} />

<style>
    .sidebar {
        position: fixed;
        top: var(--concept-sidebar-top, 110px);
        left: 15px;
        width: 68px;
        height: calc(100vh - var(--concept-sidebar-top, 110px) - 20px);
        background-color: white;
        border: var(--main-border);
        border-radius: var(--main-border-radius);
        z-index: 100;
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: flex-start;
        padding: 12px 0;
        gap: 8px;
        overflow-y: auto;
        overflow-x: hidden;
        box-sizing: border-box;
        box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
    }

    .menu-option {
        border: none;
        background: none;
        cursor: pointer;
        width: 42px;
        height: 42px;
        display: flex;
        align-items: center;
        justify-content: center;
        border-radius: 8px;
        transition: all 0.2s;
    }
    
    .menu-option:hover:not(#bugBtn) {
        background-color: #f3f4f6;
    }
    
    .menu-option.active {
        background-color: #dbeafe;
    }
    
    .menu-option.active .option-icon {
        color: #2563eb;
    }

    .menu-option-logo {
        border: none;
        background: none;
        cursor: pointer;
        width: 42px;
        height: 42px;
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
        background-color: #1f2937;
        border-radius: 8px;
        width: 42px;
        height: 42px;
        display: flex;
        align-items: center;
        justify-content: center;
        transition: all 0.2s;
    }
    
    .logo-cont:hover {
        background-color: #374151;
    }

    .bottom-buttons {
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: flex-end;
        background-color: var(--main-dark-color);
        border-radius: var(--main-border-radius);
        width: 42px;
        border-radius: 50px;
        border: var(--main-border);
    }

    .bottom-buttons .option-icon {
        color: rgba(255, 255, 255, 0.9);
        width: 20px;
        height: 20px;
    }

    .separator {
        width: 32px;
        height: 1px;
        background-color: #e5e7eb;
        margin: 8px 0;
    }

    .model-health {
        width: 42px;
        height: 24px;
        display: flex;
        align-items: center;
        justify-content: center;
        gap: 4px;
        border-radius: 12px;
        background: #f9fafb;
        border: 1px solid #e5e7eb;
    }

    .model-health.ok .health-dot {
        background-color: #10b981;
        box-shadow: 0 0 0 3px rgba(16, 185, 129, 0.15);
    }

    .model-health.warning .health-dot {
        background-color: #f59e0b;
        box-shadow: 0 0 0 3px rgba(245, 158, 11, 0.15);
    }

    .model-health.error .health-dot {
        background-color: #ef4444;
        box-shadow: 0 0 0 3px rgba(239, 68, 68, 0.15);
    }

    .health-dot {
        width: 10px;
        height: 10px;
        border-radius: 50%;
        background-color: #d1d5db;
    }

    .health-count {
        font-size: 11px;
        font-weight: 600;
        color: #4b5563;
        line-height: 1;
    }

  </style>
