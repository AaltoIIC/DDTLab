<script lang="ts">
    import ConceptualStageEditor from './ConceptualStageEditor.svelte';
    import ConceptualStageSidebar from './ConceptualStageSidebar.svelte';
    import PackageBreadcrumb from './PackageBreadcrumb.svelte';
    import { currentSystemMeta, currentNodes, currentEdges } from '$lib/stores/stores';
    import { currentPackageView, packageViewStack, navigateToRoot } from './packageStore';
    import { onMount, onDestroy } from 'svelte';
    import { get } from 'svelte/store';
    import { Save } from 'lucide-svelte';
    import { saveTemplate } from './utils/templateStorage';
    
    let conceptEditor: ConceptualStageEditor;
    let showSaveDialog = false;
    let templateName = '';
    let templateDescription = '';
    
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
        const nodes = get(currentNodes);
        const edges = get(currentEdges);
        
        if (nodes.length === 0) {
            alert('No content to save as template');
            return;
        }
        
        showSaveDialog = true;
        templateName = '';
        templateDescription = '';
    }
    
    function confirmSaveTemplate() {
        if (!templateName.trim()) {
            alert('Please enter a template name');
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
        alert('Template saved successfully!');
    }
    
    function cancelSaveTemplate() {
        showSaveDialog = false;
        templateName = '';
        templateDescription = '';
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
                <button class="save-template-btn" on:click={handleSaveAsTemplate}>
                    <Save size={16} />
                    Save as Template
                </button>
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

{#if showSaveDialog}
    <div class="dialog-overlay" on:click={cancelSaveTemplate}>
        <div class="dialog" on:click|stopPropagation>
            <h3>Save as Template</h3>
            <div class="form-group">
                <label for="template-name">Template Name</label>
                <input 
                    id="template-name"
                    type="text" 
                    bind:value={templateName} 
                    placeholder="Enter template name"
                    on:keydown={(e) => e.key === 'Enter' && confirmSaveTemplate()}
                />
            </div>
            <div class="form-group">
                <label for="template-desc">Description (optional)</label>
                <textarea 
                    id="template-desc"
                    bind:value={templateDescription} 
                    placeholder="Enter template description"
                    rows="3"
                />
            </div>
            <div class="dialog-buttons">
                <button class="cancel-btn" on:click={cancelSaveTemplate}>Cancel</button>
                <button class="save-btn" on:click={confirmSaveTemplate}>Save Template</button>
            </div>
        </div>
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
    
    .save-template-btn {
        display: flex;
        align-items: center;
        gap: 6px;
        padding: 8px 16px;
        background: #3b82f6;
        color: white;
        border: none;
        border-radius: 6px;
        font-size: 14px;
        font-weight: 500;
        cursor: pointer;
        transition: background-color 0.2s;
    }
    
    .save-template-btn:hover {
        background: #2563eb;
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
        border-color: #3b82f6;
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
        background: #3b82f6;
        color: white;
    }
    
    .save-btn:hover {
        background: #2563eb;
    }
</style>