<script lang="ts">
    import ConceptualStageEditor from './ConceptualStageEditor.svelte';
    import ConceptualStageSidebar from './ConceptualStageSidebar.svelte';
    import { currentSystemMeta } from '$lib/stores/stores';
</script>

<div class="conceptual-layout">
    <ConceptualStageSidebar />
    
    <div class="main-content">
        <div class="top-bar">
            <div class="left-section">
                <span class="system-name">{$currentSystemMeta.name}</span>
            </div>
            <div class="stage-indicator">
                Conceptual Stage
            </div>
        </div>
        
        <ConceptualStageEditor />
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
        margin-left: 110px;
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