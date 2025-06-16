<script lang="ts">
    import { SvelteFlow, Background, Controls } from '@xyflow/svelte';
    import type { Node, Edge } from '@xyflow/svelte';
    import '@xyflow/svelte/dist/style.css';
    
    // Local state for conceptual stage - completely separate from design stage
    let nodes: Node[] = [];
    let edges: Edge[] = [];
</script>

<div class="conceptual-editor">
    <div class="conceptual-header">
        <h2>Conceptual Stage</h2>
    </div>
    
    <div class="flow-container">
        <SvelteFlow
            {nodes}
            {edges}
            on:nodechange={(e) => nodes = e.detail}
            on:edgechange={(e) => edges = e.detail}
            fitView
        >
            <Background />
            <Controls />
        </SvelteFlow>
    </div>
</div>

<style>
    .conceptual-editor {
        width: 100%;
        height: 100%;
        display: flex;
        flex-direction: column;
        background: #1a1a1a;
    }
    
    .conceptual-header {
        padding: 20px;
        background: white;
        border-bottom: 1px solid #e5e7eb;
        box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
    }
    
    .conceptual-header h2 {
        margin: 0;
        font-size: 24px;
        font-weight: 600;
        color: #111827;
    }
    
    .conceptual-header p {
        margin: 4px 0 0 0;
        color: #6b7280;
        font-size: 14px;
    }
    
    .flow-container {
        flex: 1;
        width: 100%;
        height: 100%;
    }
</style>