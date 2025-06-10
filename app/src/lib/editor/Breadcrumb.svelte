  <script lang="ts">
      import { navigationContext, navigateToParent, currentSystemMeta } from '$lib/stores/stores';

      $: breadcrumbs = [
          ...$navigationContext.path,
          $currentSystemMeta
      ];
  </script>

  {#if $navigationContext.path.length > 0}
      <div class="breadcrumb-container">
          <button class="back-button" on:click={navigateToParent} title="Go back (ESC)" aria-label="Go back">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5"
  stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M10.5 19.5 3 12m0 0 7.5-7.5M3 12h18" />
              </svg>
          </button>
          <div class="breadcrumb-trail">
              {#each breadcrumbs as crumb, i}
                  <span class="breadcrumb-item" class:current={i === breadcrumbs.length - 1}>
                      {crumb.name}
                  </span>
                  {#if i < breadcrumbs.length - 1}
                      <span class="breadcrumb-separator">›</span>
                  {/if}
              {/each}
          </div>
      </div>
  {/if}

  <style>
      .breadcrumb-container {
          position: fixed;
          top: 15px;
          left: 98px;
          display: flex;
          align-items: center;
          gap: 12px;
          z-index: 90;
          background: white;
          padding: 8px 16px;
          border-radius: var(--main-border-radius);
          border: var(--main-border);
          box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
      }

      .back-button {
          background: none;
          border: none;
          cursor: pointer;
          width: 28px;
          height: 28px;
          padding: 4px;
          display: flex;
          align-items: center;
          justify-content: center;
          border-radius: 6px;
          transition: background-color 0.2s;
      }

      .back-button:hover {
          background-color: rgba(0, 0, 0, 0.05);
      }

      .back-button svg {
          width: 20px;
          height: 20px;
      }

      .breadcrumb-trail {
          display: flex;
          align-items: center;
          gap: 6px;
          font-size: 14px;
      }

      .breadcrumb-item {
          color: rgba(0, 0, 0, 0.6);
      }

      .breadcrumb-item.current {
          color: rgba(0, 0, 0, 0.9);
          font-weight: 500;
      }

      .breadcrumb-separator {
          color: rgba(0, 0, 0, 0.3);
      }
  </style>