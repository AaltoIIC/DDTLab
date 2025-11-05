<script lang="ts">
  import {
    getSmoothStepPath,
    BaseEdge,
    type EdgeProps,
    EdgeLabelRenderer,
    useSvelteFlow
  } from '@xyflow/svelte';
  import _ from 'lodash';
  import { currentEdges, addToHistory } from '$lib/stores/stores.svelte';

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
    data,
    ...rest
  }: Props = $props();

  // Get offset from edge data or default to 0
  let offsetX = $derived(data?.offsetX || 0);
  let offsetY = $derived(data?.offsetY || 0);

  // Calculate path with offset applied to the center point
  let [edgePath, labelX, labelY] = $derived((() => {
    // Get the normal path first
    const [path, lx, ly] = getSmoothStepPath({
      sourceX,
      sourceY,
      sourcePosition,
      targetX,
      targetY,
      targetPosition,
      centerX: (sourceX + targetX) / 2 + offsetX,
      centerY: (sourceY + targetY) / 2 + offsetY
    });

    return [path, lx + offsetX, ly + offsetY];
  })());

  const onEdgeClick = () => {
    currentEdges.update((edges) => {
      return edges.filter((edge) => edge.id !== id);
    });
    addToHistory();
  }

  const offsetStep = 20; // pixels to move per click

  const nudgeEdge = (direction: 'up' | 'down' | 'left' | 'right') => {
    currentEdges.update((edges) => {
      return edges.map((edge) => {
        if (edge.id === id) {
          const currentOffsetX = edge.data?.offsetX || 0;
          const currentOffsetY = edge.data?.offsetY || 0;

          let newOffsetX = currentOffsetX;
          let newOffsetY = currentOffsetY;

          switch(direction) {
            case 'up':
              newOffsetY = currentOffsetY - offsetStep;
              break;
            case 'down':
              newOffsetY = currentOffsetY + offsetStep;
              break;
            case 'left':
              newOffsetX = currentOffsetX - offsetStep;
              break;
            case 'right':
              newOffsetX = currentOffsetX + offsetStep;
              break;
          }

          return {
            ...edge,
            data: {
              ...edge.data,
              offsetX: newOffsetX,
              offsetY: newOffsetY
            }
          };
        }
        return edge;
      });
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
    <!-- Arrow buttons for nudging -->
    <button class="arrowButton arrowUp {hover ? 'hover' : ''}" onclick={() => nudgeEdge('up')} aria-label="Move Up">
      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor">
        <path stroke-linecap="round" stroke-linejoin="round" d="M4.5 15.75l7.5-7.5 7.5 7.5" />
      </svg>
    </button>
    <button class="arrowButton arrowDown {hover ? 'hover' : ''}" onclick={() => nudgeEdge('down')} aria-label="Move Down">
      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor">
        <path stroke-linecap="round" stroke-linejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
      </svg>
    </button>
    <button class="arrowButton arrowLeft {hover ? 'hover' : ''}" onclick={() => nudgeEdge('left')} aria-label="Move Left">
      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor">
        <path stroke-linecap="round" stroke-linejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
      </svg>
    </button>
    <button class="arrowButton arrowRight {hover ? 'hover' : ''}" onclick={() => nudgeEdge('right')} aria-label="Move Right">
      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor">
        <path stroke-linecap="round" stroke-linejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
      </svg>
    </button>

    <!-- Delete button in center -->
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

  /* Arrow buttons for nudging edges */
  .arrowButton {
    width: 24px;
    height: 24px;
    background-color: rgb(30, 30, 30);
    color: rgba(255, 255, 255, 0.8);
    cursor: pointer;
    border-radius: 4px;
    line-height: 1;
    position: absolute;
    transition: .2s;
    opacity: 0;
    border: solid 1px rgba(255, 255, 255, 0.1);
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .arrowButton.hover {
    opacity: 1;
  }

  .arrowButton:hover {
    background-color: rgb(50, 50, 50);
  }

  .arrowButton svg {
    width: 16px;
    height: 16px;
    color: rgba(255, 255, 255, 0.8);
  }

  /* Position arrows around the delete button */
  .arrowUp {
    top: -38px;
    left: 50%;
    transform: translateX(-50%);
  }

  .arrowDown {
    bottom: -38px;
    left: 50%;
    transform: translateX(-50%);
  }

  .arrowLeft {
    left: -38px;
    top: 50%;
    transform: translateY(-50%);
  }

  .arrowRight {
    right: -38px;
    top: 50%;
    transform: translateY(-50%);
  }
</style>