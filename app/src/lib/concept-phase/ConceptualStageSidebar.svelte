<script lang="ts">
    import { goto } from '$app/navigation';
    import Tooltip from '$lib/Tooltip.svelte';
    import Package from "lucide-svelte/icons/package";
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

        <Tooltip text="Add Package" position="right">
            <button class="menu-option" on:click={() => {
                console.log('Add package clicked');
                }}>
                <Package class="option-icon" />
            </button>
        </Tooltip>
    </div>
</div>

  <style>
      .sidebar {
          position: absolute;
          top: 0;
          left: 0;
          width: 110px;
          height: 100%;
          background: white;
          border-right: 1px solid #e5e7eb;
          z-index: 1;
          display: flex;
          flex-direction: column;
      }

      .top-buttons {
          display: flex;
          flex-direction: column;
          align-items: center;
          padding-top: 10px;
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

      .menu-option {
          border: none;
          background: none;
          cursor: pointer;
          width: 42px;
          height: 42px;
          margin-bottom: 12px;
          display: flex;
          align-items: center;
          justify-content: center;
          border-radius: var(--main-border-radius);
          transition: background-color 0.2s;
      }

      .menu-option:hover {
          background-color: rgba(0, 0, 0, 0.05);
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

      .logo-icon {
          width: 22px;
          height: 22px;
          filter: brightness(10);
          opacity: 0.9;
      }

      .option-icon {
          width: 20px;
          height: 20px;
          stroke: rgba(0, 0, 0, 0.9);
          stroke-width: 1.2;
      }
  </style>