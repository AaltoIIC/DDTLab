<script lang="ts">
    import { goto } from '$app/navigation';
    import Tooltip from '$lib/Tooltip.svelte';
    import Package from "lucide-svelte/icons/package";
    import { Component, Box, Library, FileText } from "lucide-svelte";
    import { currentPackageView, navigateToRoot } from './packageStore';
    import { currentNodes } from '$lib/stores/stores.svelte';
    import { get } from 'svelte/store';
    import ConceptLibrarySlider from './ConceptLibrarySlider.svelte';
    import ConceptTemplateSlider from './ConceptTemplateSlider.svelte';
    import { overSome } from 'lodash';
    import DefinitionSlider from './DefinitionSlider.svelte';

    interface Props {
        onAddPackage: () => void;
        onAddPart?: () => void;
        onAddItem?: () => void;
    }

    let { onAddPackage, onAddPart = () => {}, onAddItem = () => {} }: Props = $props();
    
    let isPartDefOpen = $state(false);
    let isItemDefOpen = $state(false);
    let isLibraryOpen = $state(false);
    let isTemplateSliderOpen = $state(false);
    
    function handleHomeClick() {
        // Reset to root level before navigating away
        navigateToRoot();
        goto('/');
    }
    
    function closeAllSliders() {
        isItemDefOpen = isPartDefOpen = isLibraryOpen = isTemplateSliderOpen = false;
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
</script>

<div class="sidebar">
    <div class="top-buttons">
        <Tooltip text="Home" position="right">
            <button class="menu-option-logo" onclick={handleHomeClick}>
                <div class="logo-cont">
                    <img class="logo-icon" src="/icon.svg" alt="Home" />
                </div>
            </button>
        </Tooltip>


        <Tooltip text="Add Package" position="right">
            <button class="menu-option" onclick={onAddPackage}>
                <Package class="option-icon" />
            </button>
        </Tooltip>

        <Tooltip text="Add Part" position="right">
            <button class="menu-option" class:active={isPartDefOpen} onclick={togglePartDefSlider}>
                <Component class="option-icon" />
            </button>
        </Tooltip>

        <Tooltip text="Add Item" position="right">
            <button class="menu-option" class:active={isItemDefOpen} onclick={toggleItemDefSlider}>
                <Box class="option-icon" />
            </button>
        </Tooltip>


        <div class="separator"></div>

        <Tooltip text="Concept Library" position="right">
            <button class="menu-option" class:active={isLibraryOpen} onclick={toggleLibrary}>
                <Library class="option-icon" />
            </button>
        </Tooltip>

        <Tooltip text="Saved Templates" position="right">
            <button class="menu-option" class:active={isTemplateSliderOpen} onclick={toggleTemplateSlider}>
                <FileText class="option-icon" />
            </button>
        </Tooltip>
    </div>
</div>

<!-- DISABLE FOR NOW AS CONCEPT STAGE IS BEING REFACTORED-->

<DefinitionSlider type='part' isOpen={isPartDefOpen} onClose={closeAllSliders} />
<DefinitionSlider type='item' isOpen={isItemDefOpen} onClose={closeAllSliders} />
<ConceptLibrarySlider isOpen={isLibraryOpen} onClose={closeAllSliders} />
<ConceptTemplateSlider isOpen={isTemplateSliderOpen} onClose={closeAllSliders} />

  <style>
      .sidebar {
          position: fixed;
          top: 110px;
          left: 15px;
          width: 68px;
          height: 520px;
          background-color: white;
          border: 1px solid #e5e7eb;
          border-radius: 8px;
          z-index: 100;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: flex-start;
          padding: 12px 0;
          box-sizing: border-box;
          box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
      }

      .top-buttons {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 8px;
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
      
      .menu-option:hover {
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

      .option-icon {
          width: 20px;
          height: 20px;
          color: #6b7280;
      }
      
      .menu-option:hover .option-icon {
          color: #1f2937;
      }

      .separator {
          width: 32px;
          height: 1px;
          background-color: #e5e7eb;
          margin: 8px 0;
      }
  </style>