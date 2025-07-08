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

    function nodeVisibility(node: Node) {
      return node.type === 'RootSystem' ? 'transparent' : 'x';
    }
</script>
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
  onconnect={() => {addToHistory()}}
  fitView
>
  <Controls position="bottom-right" />
  <Background bgColor="rgb(245,245,245)" variant={BackgroundVariant.Dots} gap={36} />
  <MiniMap nodeColor={nodeVisibility}/>
</SvelteFlow>