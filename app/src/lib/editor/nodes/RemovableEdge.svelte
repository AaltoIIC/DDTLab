<script lang="ts">
  import {
    getSmoothStepPath,
    BaseEdge,
    type EdgeProps,
    EdgeLabelRenderer,
    useSvelteFlow
  } from '@xyflow/svelte';
  import _ from 'lodash';
  import { currentEdges, addToHistory } from '$lib/stores/stores';

  type $$Props = EdgeProps;

  interface Props {
    sourceX: $$Props['sourceX'];
    sourceY: $$Props['sourceY'];
    sourcePosition: $$Props['sourcePosition'];
    targetX: $$Props['targetX'];
    targetY: $$Props['targetY'];
    targetPosition: $$Props['targetPosition'];
    markerEnd?: $$Props['markerEnd'];
    style?: $$Props['style'];
    id: $$Props['id'];
    [key: string]: any
  }

  let {
    sourceX,
    sourceY,
    sourcePosition,
    targetX,
    targetY,
    targetPosition,
    markerEnd = undefined,
    style = undefined,
    id,
    ...rest
  }: Props = $props();

  let [edgePath, labelX, labelY] = $derived(getSmoothStepPath({
    sourceX,
    sourceY,
    sourcePosition,
    targetX,
    targetY,
    targetPosition
  }));

  const onEdgeClick = () => {
    currentEdges.update((edges) => {
      return edges.filter((edge) => edge.id !== id);
    });
    addToHistory();
  }

  let hover = $state(false);
  
  // Make delete button compensate for zoom level
  const { viewport } = useSvelteFlow();
  let zoomLevel = $state(1);
  viewport.subscribe((value) => {
      zoomLevel = value.zoom;
  });
</script>
<BaseEdge path={edgePath} {markerEnd} {style} />
<EdgeLabelRenderer>
  <!-- svelte-ignore a11y_no_static_element_interactions -->
  <!-- svelte-ignore a11y_mouse_events_have_key_events -->
  <div class="hover-helper"
      style:transform="translate(-50%, -50%) translate({labelX}px,{labelY}px)"
      style:width="{Math.abs(sourceX - targetX)}px"
      style:height="{Math.abs(sourceY - targetY)}px"
      onmouseenter={() => {hover = true}}
      onmouseleave={() => {hover = false}}>
  </div>
  <!-- svelte-ignore a11y_no_static_element_interactions -->
  <!-- svelte-ignore a11y_mouse_events_have_key_events -->
  <div
    class="edgeButtonContainer nodrag nopan"
    style:transform="translate(-50%, -50%) translate({labelX}px,{labelY}px) scale({1/zoomLevel})"
    onmouseenter={() => {hover = true}}
    onmouseleave={() => {hover = false}}
  >
    <button class="edgeButton {hover ? "hover" : ""}" onclick={onEdgeClick} aria-label="Remove Connection">
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