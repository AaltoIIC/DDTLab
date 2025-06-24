  <script lang="ts">
      import { navigationContext, navigateToParent, currentSystemMeta, currentNodes, currentEdges, currentReqs,
  history, addToHistory, currentViewSystemId, systems } from '$lib/stores/stores';
      import { get } from 'svelte/store';
      import type { SystemMetaType } from '$lib/types/types';

      let breadcrumbs = $derived([
          ...$navigationContext.path,
          $currentSystemMeta
      ]);

      function navigateToSystem(targetSystem: SystemMetaType, index: number) {
          // If clicking on current system, do nothing
          if (index === breadcrumbs.length - 1) return;

          const systemsStore = get(systems);
          const targetSystemData = systemsStore.find(s => s.id === targetSystem.id);

          if (!targetSystemData) {
              console.error('System not found:', targetSystem.id);
              return;
          }

          // Update navigation context with new path
          navigationContext.update(ctx => ({
              ...ctx,
              path: $navigationContext.path.slice(0, index),
              currentSystemId: targetSystem.id,
              parentSystemId: index > 0 ? $navigationContext.path[index - 1].id : '',
          }));

          // Load the target system
          currentSystemMeta.set(targetSystem);
          currentNodes.set(targetSystemData.nodes);
          currentEdges.set(targetSystemData.edges);
          currentReqs.set(targetSystemData.requirements);

          currentViewSystemId.set(targetSystem.id);
          history.set({currentIndex: -1, data: []});
          addToHistory();
      }
  </script>

  {#if $navigationContext.path.length > 0}
      <div class="breadcrumb-container">
          <button class="back-button" onclick={navigateToParent} title="Go back (ESC)" aria-label="Go back">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5"
  stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M10.5 19.5 3 12m0 0 7.5-7.5M3 12h18" />
              </svg>
          </button>
          <div class="breadcrumb-trail">
              {#each breadcrumbs as crumb, i}
                  <button
                      class="breadcrumb-item"
                      class:current={i === breadcrumbs.length - 1}
                      class:clickable={i < breadcrumbs.length - 1}
                      onclick={() => navigateToSystem(crumb, i)}
                      disabled={i === breadcrumbs.length - 1}
                      type="button"
                  >
                      {crumb.name}
                  </button>
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
          background: none;
          border: none;
          padding: 2px 4px;
          font-size: 14px;
          font-family: inherit;
          transition: all 0.2s;
          border-radius: 4px;
      }

      .breadcrumb-item.clickable {
          cursor: pointer;
      }

      .breadcrumb-item.clickable:hover {
          color: rgba(0, 0, 0, 0.9);
          background-color: rgba(0, 0, 0, 0.05);
          text-decoration: underline;
      }

      .breadcrumb-item.current {
          color: rgba(0, 0, 0, 0.9);
          font-weight: 500;
          cursor: default;
      }

      .breadcrumb-separator {
          color: rgba(0, 0, 0, 0.3);
      }
  </style>