<script lang="ts">
    import ConceptualStageEditor from './ConceptualStageEditor.svelte';
    import ConceptualStageSidebar from './ConceptualStageSidebar.svelte';
    import PackageBreadcrumb from './PackageBreadcrumb.svelte';
    import { currentSystemMeta, currentNodes, currentEdges } from '$lib/stores/stores';
    import { currentPackageView, packageViewStack, navigateToRoot } from './packageStore';
    import { onMount, onDestroy } from 'svelte';
    import { get } from 'svelte/store';
    
    let conceptEditor: ConceptualStageEditor;
    
    // Clear the package view stack when component mounts (start at root)
    onMount(() => {
        // If we have a stack, save current state and go to root
        if (get(packageViewStack).length > 0) {
            navigateToRoot();
        }
        packageViewStack.set([]);
    });
    
    // Clean up when leaving the editor
    onDestroy(() => {
        // Save current state if needed
        const stack = get(packageViewStack);
        if (stack.length > 0) {
            // Save any pending changes
            navigateToRoot();
        }
    });
</script>

<div class="conceptual-layout">
    <ConceptualStageSidebar 
        onAddPackage={() => conceptEditor?.addPackageNode()} 
        onAddPart={() => conceptEditor?.addPartNode()}
    />
    
    <div class="main-content">
        <div class="top-bar">
            <div class="left-section">
                <span class="system-name">{$currentSystemMeta.name}</span>
            </div>
            <div class="stage-indicator">
                Conceptual Stage
                {#if $currentPackageView}
                    - {$currentPackageView.packageName}
                {/if}
            </div>
        </div>
        
        <PackageBreadcrumb />
        
        <ConceptualStageEditor bind:this={conceptEditor} />
    </div>
</div>

<style>
    .conceptual-layout {
        width: 100vw;
        height: 100vh;
        display: flex;
        overflow: hidden;
        position: relative;
    }
    
    .main-content {
        flex: 1;
        display: flex;
        flex-direction: column;
    }
    
    .top-bar {
        height: 60px;
        background: white;
        border-bottom: 1px solid #e5e7eb;
        display: flex;
        align-items: center;
        justify-content: space-between;
        padding: 0 20px;
        box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
    }
    
    .left-section {
        display: flex;
        align-items: center;
        gap: 20px;
    }
    
    .system-name {
        font-weight: 500;
        color: #111827;
        font-size: 16px;
    }
    
    .stage-indicator {
        padding: 6px 12px;
        background: #dbeafe;
        color: #1e40af;
        border-radius: 4px;
        font-size: 13px;
        font-weight: 500;
    }
</style>