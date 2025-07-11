<script lang="ts">
    import { stopPropagation } from 'svelte/legacy';

    import { ChevronRight, X, FileText, Trash2, Download, Upload, Copy } from 'lucide-svelte';
    import { slide } from 'svelte/transition';
    import { templates, deleteTemplate, duplicateTemplate, exportTemplate, importTemplate } from './utils/templateStorage';
    import type { ConceptTemplate } from './types/template';
    
    interface Props {
        isOpen?: boolean;
        onClose: () => void;
    }

    let { isOpen = false, onClose }: Props = $props();
    
    let expandedCategories: Record<string, boolean> = $state({
        all: true
    });
    
    let isDragging = $state(false);
    let selectedTemplate: ConceptTemplate | null = $state(null);
    
    function toggleCategory(category: string) {
        expandedCategories[category] = !expandedCategories[category];
    }
    
    function handleDragStart(event: DragEvent, template: ConceptTemplate) {
        isDragging = true;
        event.dataTransfer!.effectAllowed = 'copy';
        event.dataTransfer!.setData('application/json', JSON.stringify({
            type: 'template',
            template: template
        }));
    }
    
    function handleDragEnd() {
        isDragging = false;
    }
    
    function handleDelete(template: ConceptTemplate) {
        if (confirm(`Are you sure you want to delete "${template.name}"?`)) {
            deleteTemplate(template.id);
        }
    }
    
    function handleDuplicate(template: ConceptTemplate) {
        duplicateTemplate(template.id);
    }
    
    function handleExport(template: ConceptTemplate) {
        const json = exportTemplate(template.id);
        if (json) {
            const blob = new Blob([json], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `${template.name.replace(/\s+/g, '-')}.json`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
        }
    }
    
    function handleImport() {
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = '.json';
        input.onchange = async (e) => {
            const file = (e.target as HTMLInputElement).files?.[0];
            if (file) {
                const text = await file.text();
                const imported = importTemplate(text);
                if (imported) {
                    alert('Template imported successfully!');
                } else {
                    alert('Failed to import template. Please check the file format.');
                }
            }
        };
        input.click();
    }
    
    function formatDate(timestamp: number) {
        return new Date(timestamp).toLocaleDateString();
    }
    
    function getNodeCount(template: ConceptTemplate) {
        const packageCount = template.data.nodes.filter(n => n.type === 'package').length;
        const partCount = template.data.nodes.filter(n => n.type === 'part').length;
        const itemCount = template.data.nodes.filter(n => n.type === 'item').length;
        return `${packageCount} packages, ${partCount} parts, ${itemCount} items`;
    }
</script>

<!-- svelte-ignore a11y_click_events_have_key_events -->
<!-- svelte-ignore a11y_no_static_element_interactions -->
{#if isOpen}
    <div 
        class="slider-overlay {isDragging ? 'dragging' : ''}" 
        onclick={onClose} 
        transition:slide={{ duration: 300, axis: 'x' }}
    ></div>
    <div class="slider-panel" transition:slide={{ duration: 300, axis: 'x' }}>
        <div class="slider-header">
            <h2 class="slider-title">Saved Templates</h2>
            <div class="header-actions">
                <button class="icon-button" onclick={handleImport} title="Import template">
                    <Upload size={18} />
                </button>
                <button class="close-button" onclick={onClose}>
                    <X size={20} />
                </button>
            </div>
        </div>
        
        <div class="slider-content">
            <div class="library-section">
                <button class="library-header" onclick={() => toggleCategory('all')}>
                    <ChevronRight 
                        size={16} 
                        class="chevron {expandedCategories.all ? 'expanded' : ''}"
                    />
                    <span>All Templates ({$templates.length})</span>
                </button>
                {#if expandedCategories.all}
                    <div class="library-content" transition:slide={{ duration: 200 }}>
                        {#if $templates.length === 0}
                            <p class="placeholder-text">No saved templates yet. Create a design and click "Save as Template" to get started.</p>
                        {:else}
                            {#each $templates as template}
                                <div 
                                    class="template-card"
                                    draggable="true"
                                    ondragstart={(e) => handleDragStart(e, template)}
                                    ondragend={handleDragEnd}
                                    onclick={() => selectedTemplate = template}
                                    class:selected={selectedTemplate?.id === template.id}
                                >
                                    <div class="template-header">
                                        <FileText size={16} />
                                        <span class="template-name">{template.name}</span>
                                    </div>
                                    {#if template.description}
                                        <p class="template-description">{template.description}</p>
                                    {/if}
                                    <div class="template-meta">
                                        <span class="node-count">{getNodeCount(template)}</span>
                                        <span class="date">{formatDate(template.createdAt)}</span>
                                    </div>
                                    <div class="template-actions">
                                        <button 
                                            class="action-button" 
                                            onclick={stopPropagation(() => handleDuplicate(template))}
                                            title="Duplicate"
                                        >
                                            <Copy size={14} />
                                        </button>
                                        <button 
                                            class="action-button" 
                                            onclick={stopPropagation(() => handleExport(template))}
                                            title="Export"
                                        >
                                            <Download size={14} />
                                        </button>
                                        <button 
                                            class="action-button delete" 
                                            onclick={stopPropagation(() => handleDelete(template))}
                                            title="Delete"
                                        >
                                            <Trash2 size={14} />
                                        </button>
                                    </div>
                                </div>
                            {/each}
                        {/if}
                    </div>
                {/if}
            </div>
        </div>
    </div>
{/if}

<style>
    .slider-overlay {
        position: fixed;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        background-color: rgba(0, 0, 0, 0.1);
        z-index: 200;
    }
    
    .slider-overlay.dragging {
        pointer-events: none;
    }
    
    .slider-panel {
        position: fixed;
        top: 0;
        left: 88px;
        width: 320px;
        height: 100vh;
        background-color: white;
        border-right: 1px solid #e5e7eb;
        box-shadow: 2px 0 8px rgba(0, 0, 0, 0.1);
        z-index: 201;
        display: flex;
        flex-direction: column;
    }
    
    .slider-header {
        display: flex;
        align-items: center;
        justify-content: space-between;
        padding: 20px;
        border-bottom: 1px solid #e5e7eb;
    }
    
    .slider-title {
        font-size: 18px;
        font-weight: 600;
        color: #1f2937;
        margin: 0;
    }
    
    .header-actions {
        display: flex;
        align-items: center;
        gap: 8px;
    }
    
    .icon-button,
    .close-button {
        background: none;
        border: none;
        padding: 4px;
        cursor: pointer;
        color: #6b7280;
        border-radius: 4px;
        transition: all 0.2s;
        display: flex;
        align-items: center;
        justify-content: center;
    }
    
    .icon-button:hover,
    .close-button:hover {
        background-color: #f3f4f6;
        color: #1f2937;
    }
    
    .slider-content {
        flex: 1;
        overflow-y: auto;
        padding: 16px;
    }
    
    .library-section {
        margin-bottom: 16px;
    }
    
    .library-header {
        width: 100%;
        display: flex;
        align-items: center;
        gap: 8px;
        padding: 12px;
        background: #f9fafb;
        border: 1px solid #e5e7eb;
        border-radius: 6px;
        cursor: pointer;
        transition: all 0.2s;
        font-size: 14px;
        font-weight: 500;
        color: #374151;
        text-align: left;
    }
    
    .library-header:hover {
        background: #f3f4f6;
        border-color: #d1d5db;
    }
    
    .chevron {
        transition: transform 0.2s;
        color: #6b7280;
    }
    
    .chevron.expanded {
        transform: rotate(90deg);
    }
    
    .library-content {
        padding: 12px;
        margin-top: 8px;
        background: #fafbfc;
        border: 1px solid #e5e7eb;
        border-radius: 6px;
    }
    
    .placeholder-text {
        color: #9ca3af;
        font-size: 13px;
        text-align: center;
        padding: 20px;
        margin: 0;
    }
    
    .template-card {
        background: white;
        border: 1px solid #e5e7eb;
        border-radius: 6px;
        padding: 12px;
        margin-bottom: 8px;
        cursor: move;
        transition: all 0.2s;
        user-select: none;
    }
    
    .template-card:hover {
        border-color: #d1d5db;
        box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
        transform: translateY(-1px);
    }
    
    .template-card.selected {
        border-color: #3b82f6;
        background-color: #eff6ff;
    }
    
    .template-card:active {
        opacity: 0.5;
    }
    
    .template-header {
        display: flex;
        align-items: center;
        gap: 8px;
        margin-bottom: 8px;
    }
    
    .template-name {
        font-weight: 500;
        color: #1f2937;
        font-size: 14px;
    }
    
    .template-description {
        font-size: 12px;
        color: #6b7280;
        margin: 0 0 8px 0;
        line-height: 1.4;
    }
    
    .template-meta {
        display: flex;
        justify-content: space-between;
        align-items: center;
        font-size: 11px;
        color: #9ca3af;
        margin-bottom: 8px;
    }
    
    .template-actions {
        display: flex;
        gap: 4px;
        justify-content: flex-end;
    }
    
    .action-button {
        background: none;
        border: none;
        padding: 4px 8px;
        cursor: pointer;
        color: #6b7280;
        border-radius: 4px;
        transition: all 0.2s;
        display: flex;
        align-items: center;
        justify-content: center;
    }
    
    .action-button:hover {
        background-color: #f3f4f6;
        color: #1f2937;
    }
    
    .action-button.delete:hover {
        background-color: #fee2e2;
        color: #dc2626;
    }
</style>