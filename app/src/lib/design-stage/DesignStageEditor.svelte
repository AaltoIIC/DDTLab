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
<!-- Design stage canvas: warm orange tint + the dot pattern used on the dashboard
     illustrations, over a subtle vertical gradient. -->
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
    <!-- The × pattern lives in xyflow's <Background> so it pans/zooms with the
         viewport; the wrapper only carries the static gradient tint. The Cross
         variant draws a + tile; the :global rule below rotates it 45° so the
         pattern reads as ×'s. -->
    <Background variant={BackgroundVariant.Cross} gap={140} size={100} lineWidth={2} patternColor="rgba(253, 82, 0, 0.1)" bgColor="transparent" />
    <MiniMap nodeColor={minimapNodeColor}/>
    <ViewportFitter signal={$currentViewSystemId} />
  </SvelteFlow>
</div>
<style>
    .design-canvas {
        width: 100%;
        height: 100%;
        background: linear-gradient(180deg, rgba(253, 80, 0, 0.05) 0%, rgba(253, 80, 0, 0.1) 100%);
    }
    /* Keep the flow itself transparent so the themed wrapper shows through, and
       make it a stacking context (isolation: isolate) so xyflow's pattern layer
       (z-index: -1) paints above the wrapper instead of behind it. */
    .design-canvas :global(.svelte-flow) {
        background-color: transparent;
        isolation: isolate;
    }
    /* Rotate the Cross-variant pattern so the + marks become ×'s. The path
       lives inside xyflow's SVG <pattern>, so it must be targeted globally;
       transform-box: fill-box makes the rotation spin around the cross's own
       center, keeping the tiling aligned. */
    .design-canvas :global(.svelte-flow__background-pattern.cross) {
        transform: rotate(45deg);
        transform-box: fill-box;
        transform-origin: center;
    }
</style>