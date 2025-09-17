<script lang="ts">
  import { Eye, Check, Plus, Edit2, Trash2 } from '@lucide/svelte';
  import { activeViewpoint, viewpoints, type Viewpoint } from './viewpointStore';
  import { currentNodes, currentSystemMeta } from '$lib/stores/stores.svelte';
  import { slide, fade } from 'svelte/transition';
  import { get } from 'svelte/store';

  let showDropdown = $state(false);
  let showCreateDialog = $state(false);
  let editingViewpoint: Viewpoint | null = $state(null);

  // Form state
  let viewpointName = $state('');
  let selectedNodeIds: Set<string> = $state(new Set());

  // Separate system and custom viewpoints
  let systemViewpoints = $derived($viewpoints.filter(v => v.type === 'system'));
  let customViewpoints = $derived($viewpoints.filter(v => v.type === 'custom'));

  // Watch for system changes and reload viewpoints
  let previousSystemId: string | null = null;
  $effect(() => {
    const currentId = $currentSystemMeta.id;
    if (currentId && currentId !== previousSystemId) {
      previousSystemId = currentId;
      viewpoints.reloadForSystem();

      // Check if the current active viewpoint still exists
      // (it might be a custom viewpoint from another system)
      const stillExists = $viewpoints.some(vp => vp.id === $activeViewpoint);
      if (!stillExists && $activeViewpoint !== 'all') {
        $activeViewpoint = 'all';
      }
    }
  });

  function selectViewpoint(id: string) {
    $activeViewpoint = id;
    showDropdown = false;
  }

  function startCreateCustom() {
    // Get currently selected nodes
    const nodes = get(currentNodes);
    selectedNodeIds = new Set(nodes.filter(n => n.selected).map(n => n.id));

    viewpointName = '';
    editingViewpoint = null;
    showCreateDialog = true;
    showDropdown = false;
  }

  function editCustom(vp: Viewpoint, e: Event) {
    e.stopPropagation();
    editingViewpoint = vp;
    viewpointName = vp.name;
    selectedNodeIds = new Set(vp.nodeIds || []);
    showCreateDialog = true;
  }

  function deleteCustom(vp: Viewpoint, e: Event) {
    e.stopPropagation();
    if (confirm(`Delete viewpoint "${vp.name}"?`)) {
      viewpoints.deleteCustom(vp.id);
      if ($activeViewpoint === vp.id) {
        $activeViewpoint = 'all';
      }
    }
  }

  function saveViewpoint() {
    if (!viewpointName.trim()) return;

    const viewpointData = {
      name: viewpointName,
      icon: '👁️',
      nodeIds: Array.from(selectedNodeIds)
    };

    if (editingViewpoint) {
      viewpoints.updateCustom(editingViewpoint.id, viewpointData);
    } else {
      const newId = viewpoints.addCustom(viewpointData);
      $activeViewpoint = newId;
    }

    closeDialog();
  }

  function closeDialog() {
    showCreateDialog = false;
    editingViewpoint = null;
    viewpointName = '';
    selectedNodeIds.clear();
  }

  function toggleNodeSelection(nodeId: string) {
    if (selectedNodeIds.has(nodeId)) {
      selectedNodeIds.delete(nodeId);
    } else {
      selectedNodeIds.add(nodeId);
    }
    selectedNodeIds = new Set(selectedNodeIds); // Trigger reactivity
  }

  // Close dropdown when clicking outside
  function handleOutsideClick(event: MouseEvent) {
    const target = event.target as HTMLElement;
    if (!target.closest('.viewpoint-selector')) {
      showDropdown = false;
    }
  }

  $effect(() => {
    if (showDropdown) {
      document.addEventListener('click', handleOutsideClick);
      return () => document.removeEventListener('click', handleOutsideClick);
    }
  });
</script>

<div class="viewpoint-selector">
  <button
    class="viewpoint-button"
    class:active={showDropdown}
    onclick={(e) => {
      e.stopPropagation();
      showDropdown = !showDropdown;
    }}
  >
    <Eye size={16} />
    <span class="button-text">
      {$viewpoints.find(v => v.id === $activeViewpoint)?.name || 'All'}
    </span>
  </button>

  {#if showDropdown}
    <div class="dropdown" transition:slide={{ duration: 200 }}>
      <div class="section">
        <div class="section-title">System Views</div>
        {#each systemViewpoints as vp}
          <button
            class="viewpoint-item"
            class:selected={vp.id === $activeViewpoint}
            onclick={() => selectViewpoint(vp.id)}
          >
            {#if vp.icon}
              <span class="icon">{vp.icon}</span>
            {/if}
            <span class="name">{vp.name}</span>
            {#if vp.id === $activeViewpoint}
              <Check size={14} class="check" />
            {/if}
          </button>
        {/each}
      </div>

      {#if customViewpoints.length > 0}
        <div class="section">
          <div class="section-title">Custom Views</div>
          {#each customViewpoints as vp}
            <div
              class="viewpoint-item custom"
              class:selected={vp.id === $activeViewpoint}
              onclick={() => selectViewpoint(vp.id)}
              role="button"
              tabindex="0"
            >
              <span class="icon">{vp.icon}</span>
              <span class="name">{vp.name}</span>
              <div class="actions">
                <button class="action-btn" onclick={(e) => editCustom(vp, e)}>
                  <Edit2 size={12} />
                </button>
                <button class="action-btn delete" onclick={(e) => deleteCustom(vp, e)}>
                  <Trash2 size={12} />
                </button>
              </div>
              {#if vp.id === $activeViewpoint}
                <Check size={14} class="check" />
              {/if}
            </div>
          {/each}
        </div>
      {/if}

      <button class="create-btn" onclick={startCreateCustom}>
        <Plus size={14} />
        Create Custom View
      </button>
    </div>
  {/if}
</div>

<!-- Create/Edit Dialog -->
{#if showCreateDialog}
  <div class="dialog-overlay" transition:fade={{ duration: 150 }} onclick={closeDialog}>
    <div class="dialog" onclick={(e) => e.stopPropagation()}>
      <h3>{editingViewpoint ? 'Edit' : 'Create'} Custom View</h3>

      <div class="form-group">
        <label>Name</label>
        <input
          type="text"
          bind:value={viewpointName}
          placeholder="Enter view name"
        />
      </div>

      <div class="form-group">
        <label>Select Nodes</label>
        <div class="node-list">
          {#each $currentNodes as node}
            <label class="node-item">
              <input
                type="checkbox"
                checked={selectedNodeIds.has(node.id)}
                onchange={() => toggleNodeSelection(node.id)}
              />
              <span class="node-name">
                {node.data.declaredName || node.id}
                <span class="node-type">({node.type})</span>
              </span>
            </label>
          {/each}
          {#if $currentNodes.length === 0}
            <p class="empty">No nodes in the system</p>
          {/if}
        </div>
      </div>

      <div class="dialog-buttons">
        <button class="cancel-btn" onclick={closeDialog}>Cancel</button>
        <button
          class="save-btn"
          onclick={saveViewpoint}
          disabled={!viewpointName.trim() || selectedNodeIds.size === 0}
        >
          {editingViewpoint ? 'Update' : 'Create'}
        </button>
      </div>
    </div>
  </div>
{/if}

<style>
  .viewpoint-selector {
    position: relative;
    width: 100%;
    margin-bottom: 10px;
    padding: 0 8px;
  }

  .viewpoint-button {
    width: 100%;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 4px;
    padding: 8px 4px;
    background: white;
    border: 1px solid #e5e7eb;
    border-radius: 6px;
    font-size: 12px;
    font-weight: 500;
    color: #374151;
    cursor: pointer;
    transition: all 0.2s;
  }

  .viewpoint-button:hover {
    background: #f9fafb;
    border-color: #d1d5db;
  }

  .viewpoint-button.active {
    background: #f3f4f6;
    border-color: #9ca3af;
  }

  .button-text {
    flex: 1;
    text-align: center;
    max-width: 100px;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .dropdown {
    position: absolute;
    top: 0;
    left: calc(100% + 8px);
    width: 250px;
    background: white;
    border: 1px solid #e5e7eb;
    border-radius: 6px;
    box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
    z-index: 1000;
    max-height: 400px;
    overflow-y: auto;
  }

  .section {
    padding: 8px 0;
    border-bottom: 1px solid #f3f4f6;
  }

  .section:last-of-type {
    border-bottom: none;
  }

  .section-title {
    padding: 4px 12px;
    font-size: 11px;
    font-weight: 600;
    color: #9ca3af;
    text-transform: uppercase;
  }

  .viewpoint-item {
    width: 100%;
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 8px 12px;
    background: none;
    border: none;
    font-size: 13px;
    color: #374151;
    cursor: pointer;
    transition: background 0.15s;
  }

  .viewpoint-item:hover {
    background: #f9fafb;
  }

  .viewpoint-item.selected {
    background: #eff6ff;
    color: #1e40af;
  }

  .viewpoint-item.custom {
    position: relative;
  }

  .icon {
    width: 20px;
    text-align: center;
  }

  .name {
    flex: 1;
    text-align: left;
  }

  .actions {
    display: flex;
    gap: 4px;
    opacity: 0;
    transition: opacity 0.2s;
  }

  .viewpoint-item.custom:hover .actions {
    opacity: 1;
  }

  .action-btn {
    padding: 4px;
    background: none;
    border: none;
    border-radius: 4px;
    color: #6b7280;
    cursor: pointer;
    transition: all 0.15s;
  }

  .action-btn:hover {
    background: #e5e7eb;
    color: #374151;
  }

  .action-btn.delete:hover {
    background: #fee2e2;
    color: #dc2626;
  }

  .check {
    color: #10b981;
    margin-left: auto;
  }

  .create-btn {
    width: 100%;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 6px;
    padding: 8px;
    background: #f9fafb;
    border: none;
    border-top: 1px solid #e5e7eb;
    font-size: 13px;
    font-weight: 500;
    color: #6b7280;
    cursor: pointer;
    transition: all 0.2s;
  }

  .create-btn:hover {
    background: #f3f4f6;
    color: #374151;
  }

  /* Dialog styles */
  .dialog-overlay {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: rgba(0, 0, 0, 0.5);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 1000;
  }

  .dialog {
    background: white;
    border-radius: 8px;
    padding: 24px;
    width: 400px;
    max-width: 90vw;
    max-height: 80vh;
    display: flex;
    flex-direction: column;
    box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1);
  }

  .dialog h3 {
    margin: 0 0 20px 0;
    font-size: 18px;
    font-weight: 600;
    color: #111827;
  }

  .form-group {
    margin-bottom: 20px;
  }

  .form-group label {
    display: block;
    margin-bottom: 8px;
    font-size: 14px;
    font-weight: 500;
    color: #374151;
  }

  .form-group input {
    width: 100%;
    padding: 8px 12px;
    border: 1px solid #d1d5db;
    border-radius: 6px;
    font-size: 14px;
    transition: border-color 0.2s;
  }

  .form-group input:focus {
    outline: none;
    border-color: #6b7280;
  }

  .node-list {
    max-height: 300px;
    overflow-y: auto;
    border: 1px solid #e5e7eb;
    border-radius: 6px;
    padding: 8px;
  }

  .node-item {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 6px 8px;
    border-radius: 4px;
    cursor: pointer;
    transition: background 0.15s;
  }

  .node-item:hover {
    background: #f9fafb;
  }

  .node-item input {
    cursor: pointer;
  }

  .node-name {
    font-size: 13px;
    color: #374151;
  }

  .node-type {
    color: #9ca3af;
    font-size: 12px;
  }

  .empty {
    text-align: center;
    color: #9ca3af;
    font-size: 13px;
    padding: 20px;
  }

  .dialog-buttons {
    display: flex;
    gap: 12px;
    justify-content: flex-end;
    margin-top: 20px;
  }

  .cancel-btn, .save-btn {
    padding: 8px 16px;
    border: none;
    border-radius: 6px;
    font-size: 14px;
    font-weight: 500;
    cursor: pointer;
    transition: all 0.2s;
  }

  .cancel-btn {
    background: #f3f4f6;
    color: #374151;
  }

  .cancel-btn:hover {
    background: #e5e7eb;
  }

  .save-btn {
    background: #111827;
    color: white;
  }

  .save-btn:hover:not(:disabled) {
    background: #374151;
  }

  .save-btn:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
</style>