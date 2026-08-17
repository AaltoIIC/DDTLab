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
      currentViewSystemId,
      addToHistory
    } from '../stores/stores.svelte';
    import ElementNode from './nodes/ElementNode.svelte';
    import InternalPortNode from '$lib/concept-stage/nodes/InternalPortNode.svelte';
    import RemovableEdge from './nodes/RemovableEdge.svelte';
    import ViewportFitter from './ViewportFitter.svelte';
    import './designStageEditor.css';

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
<!-- Design stage canvas: blueprint-style tile grid + a soft top glow, in the
     design stage's warm orange theme. -->
<div id="design-editor" class="design-canvas">
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
    minZoom={0.1}
    maxZoom={1}
    onconnect={() => {addToHistory()}}
    fitView
  >
    <Controls position="bottom-right" />
    <!-- The grid lines live in xyflow's <Background> so they pan/zoom with the
         viewport; the wrapper carries the static tint + glow. The Lines variant
         tiles into a continuous grid, matching the concept stage. -->
    <Background variant={BackgroundVariant.Lines} gap={60} lineWidth={2} patternColor="rgba(253, 82, 0, 0.05)" bgColor="transparent" />
    <MiniMap nodeColor={minimapNodeColor}/>
    <ViewportFitter signal={$currentViewSystemId} />
  </SvelteFlow>
</div>
<style>
    .design-canvas {
        width: 100%;
        height: 100%;
        /* Blueprint-style tile look (mirrors the concept stage) but in the
           design stage's orange theme: light warm base + a soft white glow from
           the top. The gridlines are drawn by <Background> and pan/zoom with
           the viewport. */
        background-color: #fdf4ec;
        background-image:
            radial-gradient(120% 85% at 50% 0%, rgba(255, 255, 255, 0.75) 0%, rgba(255, 255, 255, 0) 55%);
        background-size: 100% 100%;
    }
    /* Keep the flow itself transparent so the themed wrapper shows through, and
       make it a stacking context (isolation: isolate) so xyflow's pattern layer
       (z-index: -1) paints above the wrapper instead of behind it. */
    .design-canvas :global(.svelte-flow) {
        background-color: transparent;
        isolation: isolate;
    }
</style>