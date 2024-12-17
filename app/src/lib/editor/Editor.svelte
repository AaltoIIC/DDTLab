<script lang="ts">
    import {
      SvelteFlow,
      SvelteFlowProvider,
      Controls,
      Background,
      BackgroundVariant,
      type NodeTypes,
      type Node
    } from '@xyflow/svelte';
    import '@xyflow/svelte/dist/style.css';
    import {
      currentNodes,
      currentEdges
    } from '../stores/stores';
    import RootSystemNode from './nodes/RootSystemNode.svelte';
    import ElementNode from './nodes/ElementNode.svelte';

    const nodeTypes = {
      'RootSystem': RootSystemNode,
      'Element': ElementNode
    } as {} as NodeTypes; 

</script>
<SvelteFlowProvider>
  <SvelteFlow
    nodes={currentNodes}
    edges={currentEdges}
    nodeTypes={nodeTypes}
    deleteKey={null}
    minZoom={0.9}
  >
    <Controls position="bottom-right" />
    <Background bgColor="rgb(245,245,245)" variant={BackgroundVariant.Dots} gap={36} />
  </SvelteFlow>
</SvelteFlowProvider>