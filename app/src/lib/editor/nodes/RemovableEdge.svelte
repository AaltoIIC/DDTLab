<script lang="ts">
  import {
    getSmoothStepPath,
    BaseEdge,
    type EdgeProps,
    EdgeLabelRenderer,
    useSvelteFlow
  } from '@xyflow/svelte';
  import _ from 'lodash';
  import { currentEdges } from '$lib/stores/stores';

  type $$Props = EdgeProps;
  $$restProps

  export let sourceX: $$Props['sourceX'];
  export let sourceY: $$Props['sourceY'];
  export let sourcePosition: $$Props['sourcePosition'];
  export let targetX: $$Props['targetX'];
  export let targetY: $$Props['targetY'];
  export let targetPosition: $$Props['targetPosition'];
  export let markerEnd: $$Props['markerEnd'] = undefined;
  export let style: $$Props['style'] = undefined;
  export let id: $$Props['id'];

  $: [edgePath, labelX, labelY] = getSmoothStepPath({
    sourceX,
    sourceY,
    sourcePosition,
    targetX,
    targetY,
    targetPosition
  });

  console.log(sourceX)
  console.log(sourceY)
  console.log(sourcePosition)
  console.log(targetX)
  console.log(targetY)
  console.log(targetPosition)
  console.log("========")

  const onEdgeClick = () => {
    currentEdges.update((edges) => {
      return edges.filter((edge) => edge.id !== id);
    });
  }

  let hover = false;
  
  // Make delete button compensate for zoom level
  const { viewport } = useSvelteFlow();
  let zoomLevel = 1;
  viewport.subscribe((value) => {
      zoomLevel = value.zoom;
  });
</script>
<BaseEdge path={edgePath} {markerEnd} {style} />
<EdgeLabelRenderer>
  <!-- svelte-ignore a11y-no-static-element-interactions -->
  <!-- svelte-ignore a11y-mouse-events-have-key-events -->
  <div class="hover-helper"
      style:transform="translate(-50%, -50%) translate({labelX}px,{labelY}px)"
      style:width="{Math.abs(sourceX - targetX)}px"
      style:height="{Math.abs(sourceY - targetY)}px"
      on:mouseenter={() => {hover = true}}
      on:mouseleave={() => {hover = false}}>
  </div>
  <!-- svelte-ignore a11y-no-static-element-interactions -->
  <!-- svelte-ignore a11y-mouse-events-have-key-events -->
  <div
    class="edgeButtonContainer nodrag nopan"
    style:transform="translate(-50%, -50%) translate({labelX}px,{labelY}px) scale({1/zoomLevel})"
    on:mouseenter={() => {hover = true}}
    on:mouseleave={() => {hover = false}}
  >
    <button class="edgeButton {hover ? "hover" : ""}" on:click={onEdgeClick} aria-label="Remove Connection">
      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="size-6">
        <path stroke-linecap="round" stroke-linejoin="round" d="M6 18 18 6M6 6l12 12" />
      </svg>               
    </button>
  </div>
</EdgeLabelRenderer>
<style>
  .hover-helper {
      pointer-events: all;
      padding: 32px;
      position: absolute;
  }

  .edgeButtonContainer {
    position: absolute;
    top: 2px;
    pointer-events: all;
  }

  .edgeButton {
    width: 32px;
    height: 32px;
    background-color: rgb(30, 30, 30);
    color: rgba(255, 255, 255, 0.9);
    cursor: pointer;
    border-radius: 50%;
    line-height: 1;
    position: relative;
    transition: .2s;
    opacity: 0;
    border: solid 1px rgba(255, 255, 255, 0.1);
  }
  .edgeButton.hover {
      opacity: 1;
  }

  .edgeButton svg {
      width: 20px;
      height: 20px;
      position: absolute;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      color: rgba(255, 255, 255, 0.9);
  }
</style>