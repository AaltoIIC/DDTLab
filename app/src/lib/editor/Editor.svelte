<script lang="ts">
    import {
      SvelteFlow,
      Controls,
      Background,
      BackgroundVariant,
      type NodeTypes,
      type EdgeTypes,
      ConnectionLineType,
      MiniMap,
      type Node
    } from '@xyflow/svelte';
    import '@xyflow/svelte/dist/style.css';
    import {
      currentNodes,
      currentEdges,
      addToHistory
    } from '../stores/stores.svelte';
    import ElementNode from './nodes/ElementNode.svelte';
    import InternalPortNode from '$lib/concept-phase/nodes/InternalPortNode.svelte';
    import RemovableEdge from './nodes/RemovableEdge.svelte';
    import './editor.css';

    const nodeTypes = {
      'Element': ElementNode,
      'Internal': InternalPortNode
    } as {} as NodeTypes;

    const edgeTypes: EdgeTypes = {
      'default': RemovableEdge
    } as {} as EdgeTypes;

    function minimapNodeColor(_node: Node) {
      return 'x';
    }
</script>
<!-- Design stage canvas: warm orange tint + the dot pattern used on the dashboard
     illustrations, over a subtle vertical gradient. -->
<div class="design-canvas">
  <SvelteFlow
    nodes={currentNodes}
    edges={currentEdges}
    nodeTypes={nodeTypes}
    edgeTypes={edgeTypes}
    defaultEdgeOptions={{
      animated: false,
      deletable: true,
    }}
    connectionLineType={ConnectionLineType.SmoothStep}
    deleteKey={null}
    minZoom={0.48}
    maxZoom={1}
    onconnect={() => {addToHistory()}}
    fitView
  >
    <Controls position="bottom-right" />
    <!-- The dot pattern lives in xyflow's <Background> so it pans/zooms with the
         viewport; the wrapper only carries the static gradient tint. -->
    <Background variant={BackgroundVariant.Dots} gap={30} size={2.2} patternColor="rgba(253, 82, 0, 0.22)" bgColor="transparent" />
    <MiniMap nodeColor={minimapNodeColor}/>
  </SvelteFlow>
</div>
<style>
    .design-canvas {
        width: 100%;
        height: 100%;
        background: linear-gradient(180deg, rgba(255, 255, 255, 0.9) 0%, rgba(253, 82, 0, 0.028) 100%);
    }
    /* Keep the flow itself transparent so the themed wrapper shows through, and
       make it a stacking context (isolation: isolate) so xyflow's pattern layer
       (z-index: -1) paints above the wrapper instead of behind it. */
    .design-canvas :global(.svelte-flow) {
        background-color: transparent;
        isolation: isolate;
    }
</style>