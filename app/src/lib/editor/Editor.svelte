<script lang="ts">
    import {
      SvelteFlow,
      SvelteFlowProvider,
      Controls,
      Background,
      BackgroundVariant,
      type NodeTypes,
      type EdgeTypes,
      ConnectionLineType,
      type Node
    } from '@xyflow/svelte';
    import '@xyflow/svelte/dist/style.css';
    import {
      currentNodes,
      currentEdges
    } from '../stores/stores';
    import RootSystemNode from './nodes/RootSystemNode.svelte';
    import ElementNode from './nodes/ElementNode.svelte';
    import RemovableEdge from './nodes/RemovableEdge.svelte';
    import './editor.css';

    const nodeTypes = {
      'RootSystem': RootSystemNode,
      'Element': ElementNode
    } as {} as NodeTypes;

    const edgeTypes: EdgeTypes = {
      'default': RemovableEdge
    } as {} as EdgeTypes;

</script>
<SvelteFlowProvider>
  <SvelteFlow
    nodes={currentNodes}
    edges={currentEdges}
    nodeTypes={nodeTypes}
    edgeTypes={edgeTypes}
    defaultEdgeOptions={{
      animated: true,
      deletable: true,
    }}
    connectionLineType={ConnectionLineType.SmoothStep}
    deleteKey={null}
    minZoom={0.48}
    maxZoom={1}
  >
    <Controls position="bottom-right" />
    <Background bgColor="rgb(245,245,245)" variant={BackgroundVariant.Dots} gap={36} />
  </SvelteFlow>
</SvelteFlowProvider>