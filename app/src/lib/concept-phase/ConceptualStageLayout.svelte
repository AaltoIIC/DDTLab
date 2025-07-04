<script lang="ts">
    import { createBubbler, stopPropagation } from 'svelte/legacy';

    const bubble = createBubbler();
    import ConceptualStageEditor from './ConceptualStageEditor.svelte';
    import ConceptualStageSidebar from './ConceptualStageSidebar.svelte';
    import PackageBreadcrumb from './PackageBreadcrumb.svelte';
    import { currentSystemMeta, currentNodes, currentEdges } from '$lib/stores/stores.svelte';
    import { currentPackageView, packageViewStack, navigateToRoot, navigateToPackage } from './packageStore';
    import type { PackageView } from './packageStore';
    import { onMount, onDestroy } from 'svelte';
    import { get } from 'svelte/store';
    import { Save } from 'lucide-svelte';
    import { saveTemplate } from './utils/templateStorage';
    
    let conceptEditor: ConceptualStageEditor | undefined = $state();
    let showSaveDialog = $state(false);
    let templateName = $state('');
    let templateDescription = $state('');
    let previousViewStack: PackageView[] = [];
    
    // Notification system
    let notification = $state({
        show: false,
        message: '',
        type: 'info' // 'info', 'success', 'error'
    });
    
    function showNotification(message: string, type = 'info') {
        notification = { show: true, message, type };
        setTimeout(() => {
            notification.show = false;
        }, 3000);
    }
    
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
    
    function handleSaveAsTemplate() {
        // Store current view stack before navigating to root
        const stack = get(packageViewStack);
        const isInNestedView = stack.length > 0;
        
        if (isInNestedView) {
            // Save the current stack to restore later
            previousViewStack = [...stack];
            // Navigate to root to capture full hierarchy
            navigateToRoot();
        }
        
        // Now get the root-level nodes and edges (full hierarchy)
        const nodes = get(currentNodes);
        const edges = get(currentEdges);
        
        if (nodes.length === 0) {
            showNotification('No content to save as template', 'error');
            // Restore view if we navigated away
            if (isInNestedView && previousViewStack.length > 0) {
                restorePreviousView();
            }
            return;
        }
        
        showSaveDialog = true;
        templateName = '';
        templateDescription = '';
    }
    
    function confirmSaveTemplate() {
        if (!templateName.trim()) {
            showNotification('Please enter a template name', 'error');
            return;
        }
        
        const nodes = get(currentNodes);
        const edges = get(currentEdges);
        
        saveTemplate({
            name: templateName,
            description: templateDescription,
            data: {
                nodes,
                edges
            }
        });
        
        showSaveDialog = false;
        showNotification('Template saved successfully!', 'success');
        
        // Restore previous view if we navigated away
        if (previousViewStack.length > 0) {
            restorePreviousView();
        }
    }
    
    function cancelSaveTemplate() {
        showSaveDialog = false;
        templateName = '';
        templateDescription = '';
        
        // Restore previous view if we navigated away
        if (previousViewStack.length > 0) {
            restorePreviousView();
        }
    }
    
    function restorePreviousView() {
        if (previousViewStack.length === 0) return;
        
        // Rebuild the navigation stack
        const stackToRestore = [...previousViewStack];
        packageViewStack.set([]);
        
        // Navigate through each level to restore the view
        for (let i = 0; i < stackToRestore.length; i++) {
            const view = stackToRestore[i];
            if (i === 0 && view.packageId === 'root') {
                // Skip root restoration, just set the stack
                packageViewStack.update(s => [view]);
            } else {
                // For nested views, we need to navigate into them
                const parentNodes = i === 0 ? view.nodes : stackToRestore[i-1].nodes;
                const packageNode = parentNodes.find(n => n.id === view.packageId);
                if (packageNode) {
                    navigateToPackage(view.packageId, view.packageName, view.parentId);
                }
            }
        }
        
        // Clear the stored stack
        previousViewStack = [];
    }
</script>

<div class="conceptual-layout">
    <ConceptualStageSidebar 
        onAddPackage={() => conceptEditor?.addPackageNode()} 
        onAddPart={() => conceptEditor?.addPartNode()}
        onAddItem={() => conceptEditor?.addItemNode()}
    />
    
    <div class="main-content">
        <div class="top-bar">
            <div class="left-section">
                <span class="system-name">{$currentSystemMeta.name}</span>
                <button class="save-template-btn" onclick={handleSaveAsTemplate}>
                    <Save size={16} />
                    Save as Template
                </button>
                <div class="stage-indicator">
                    Conceptual Stage
                    {#if $currentPackageView}
                        - {$currentPackageView.packageName}
                    {/if}
                </div>
            </div>
        </div>
        
        <PackageBreadcrumb />
        
        <ConceptualStageEditor bind:this={conceptEditor} />
    </div>
</div>

{#if showSaveDialog}
    <div class="dialog-overlay" onclick={cancelSaveTemplate}>
        <div class="dialog" onclick={stopPropagation(bubble('click'))}>
            <h3>Save as Template</h3>
            <div class="form-group">
                <label for="template-name">Template Name</label>
                <input 
                    id="template-name"
                    type="text" 
                    bind:value={templateName} 
                    placeholder="Enter template name"
                    onkeydown={(e) => e.key === 'Enter' && confirmSaveTemplate()}
                />
            </div>
            <div class="form-group">
                <label for="template-desc">Description (optional)</label>
                <textarea 
                    id="template-desc"
                    bind:value={templateDescription} 
                    placeholder="Enter template description"
                    rows="3"
></textarea>
            </div>
            <div class="dialog-buttons">
                <button class="cancel-btn" onclick={cancelSaveTemplate}>Cancel</button>
                <button class="save-btn" onclick={confirmSaveTemplate}>Save Template</button>
            </div>
        </div>
    </div>
{/if}

{#if notification.show}
    <div class="notification {notification.type}">
        {notification.message}
    </div>
{/if}

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
        /* justify-content: space-between; */
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
    
    .save-template-btn {
        display: flex;
        align-items: center;
        gap: 6px;
        padding: 8px 16px;
        background: #111827;
        color: white;
        border: none;
        border-radius: 6px;
        font-size: 14px;
        font-weight: 500;
        cursor: pointer;
        transition: all 0.2s;
    }
    
    .save-template-btn:hover {
        background: #374151;
        transform: translateY(-1px);
        box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
    }
    
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
        box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1);
    }
    
    .dialog h3 {
        margin: 0 0 20px 0;
        font-size: 18px;
        font-weight: 600;
        color: #111827;
    }
    
    .form-group {
        margin-bottom: 16px;
    }
    
    .form-group label {
        display: block;
        margin-bottom: 6px;
        font-size: 14px;
        font-weight: 500;
        color: #374151;
    }
    
    .form-group input,
    .form-group textarea {
        width: 100%;
        padding: 8px 12px;
        border: 1px solid #d1d5db;
        border-radius: 6px;
        font-size: 14px;
        transition: border-color 0.2s;
    }
    
    .form-group input:focus,
    .form-group textarea:focus {
        outline: none;
        border-color: #374151;
    }
    
    .dialog-buttons {
        display: flex;
        gap: 12px;
        justify-content: flex-end;
        margin-top: 24px;
    }
    
    .cancel-btn,
    .save-btn {
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
    
    .save-btn:hover {
        background: #374151;
    }
    
    /* Notification styles */
    .notification {
        position: fixed;
        top: 20px;
        right: 20px;
        padding: 12px 20px;
        border-radius: 6px;
        font-size: 14px;
        font-weight: 500;
        display: flex;
        align-items: center;
        gap: 8px;
        box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
        animation: slideIn 0.3s ease-out;
        z-index: 1001;
    }
    
    .notification.info {
        background: #f3f4f6;
        color: #374151;
        border: 1px solid #e5e7eb;
    }
    
    .notification.success {
        background: #d1fae5;
        color: #065f46;
        border: 1px solid #a7f3d0;
    }
    
    .notification.error {
        background: #fee2e2;
        color: #991b1b;
        border: 1px solid #fecaca;
    }
    
    @keyframes slideIn {
        from {
            transform: translateX(100%);
            opacity: 0;
        }
        to {
            transform: translateX(0);
            opacity: 1;
        }
    }
</style>