<script lang="ts">
    import { goto } from '$app/navigation';
    import Tooltip from '$lib/Tooltip.svelte';
    import Package from "lucide-svelte/icons/package";
    import { Component } from "lucide-svelte";
    import { currentPackageView } from './packageStore';

    export let onAddPackage: () => void;
    export let onAddPart: () => void = () => {};
</script>

<div class="sidebar">
    <div class="top-buttons">
        <Tooltip text="Home" position="right">
            <button class="menu-option-logo" on:click={() => {goto('/')}}>
                <div class="logo-cont">
                    <img class="logo-icon" src="/icon.svg" alt="Home" />
                </div>
            </button>
        </Tooltip>

        {#if !$currentPackageView}
            <Tooltip text="Add Package" position="right">
                <button class="menu-option" on:click={onAddPackage}>
                    <Package class="option-icon" />
                </button>
            </Tooltip>
        {:else}
            <Tooltip text="Add Part" position="right">
                <button class="menu-option" on:click={onAddPart}>
                    <Component class="option-icon" />
                </button>
            </Tooltip>
        {/if}
    </div>
</div>

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
  </style>