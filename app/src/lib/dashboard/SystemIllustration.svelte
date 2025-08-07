<script lang="ts">
    import type {SystemType} from "$lib/types/types";
    import {
        getSmoothStepPath,
        Position
    } from '@xyflow/svelte';

    interface Props {
        system: SystemType;
    }

    let { system }: Props = $props();

    // TODO: Maybe change this in the future so that packages are included somehow in the illustration
    let filteredNodes = $derived(system.nodes.filter(n => n.type !== 'RootSystem' && n.type !== 'package'));

    // get node dimensions
    let highestX = 0,
        highestY = 0,
        lowestX = Infinity,
        lowestY = Infinity;
    // svelte-ignore state_referenced_locally
    filteredNodes.forEach(node => {
        if (node.position.x > highestX) {
            highestX = node.position.x;
        }
        if (node.position.y > highestY) {
            highestY = node.position.y;
        }

        if (node.position.x < lowestX) {
            lowestX = node.position.x;
        }
        if (node.position.y < lowestY) {
            lowestY = node.position.y;
        }
    });

    // get px to percent ratio
    const [width, height] = [highestX - lowestX, highestY - lowestY];
    const pxToPercent = Math.max(width, height) / 100;

    const [addToX, addToY] = (width > height) ? [0, (width - height) / 2] : [(height - width) / 2, 0];

    const elemPositions: Record<string, {x: number, y: number}> = $state({}); // node positions in percentages
    // svelte-ignore state_referenced_locally
    filteredNodes.forEach(node => {
        elemPositions[node.id] = {
            x: (node.position.x - lowestX + addToX),
            y: (node.position.y - lowestY + addToY)
        };
    });

    const elementWidthPercent = 22;
    const edgePaths = system.edges.map(edge => {
        const source = elemPositions[edge.source];
        const target = elemPositions[edge.target];
        return getSmoothStepPath({
            sourceX: source.x + elementWidthPercent*pxToPercent / 2,
            sourceY: source.y,
            sourcePosition: Position.Right,
            targetX: target.x - elementWidthPercent*pxToPercent / 2,
            targetY: target.y,
            targetPosition: Position.Left
        })[0]
    });
</script>
<div class="main-illustration-outer">
    {#if filteredNodes.length}
        <div class="main-illustration-inner">
            {#each Object.values(elemPositions) as {x, y}, i}
                <div class="elem"
                    style={`
                        left: ${x/pxToPercent}%;
                        top: ${y/pxToPercent}%;
                        width: ${elementWidthPercent}%;
                        height: ${elementWidthPercent}%;
                    `}>
                    <div class="elem-type-dot">
                    </div>
                    <div class="elem-class-line">
                    </div>
                </div>
            {/each}
            <svg class="main-connections"
                viewBox="{-32.5*pxToPercent} {-32.5*pxToPercent} {165*pxToPercent} {165*pxToPercent}"
                stroke-width="{1.2*pxToPercent}"
                stroke="currentColor"
                >
                {#each edgePaths as edgePath}
                    <path d={edgePath} fill="none" />
                {/each}
            </svg>
        </div>
    {:else}
        <p class="empty-system-txt">System is empty</p>
    {/if}
</div>
<style>
    .empty-system-txt {
        font-size: 14px;
        opacity: 0.7;
        width: 100%;
        text-align: center;
        position: absolute;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
    }
    .main-connections {
        position: absolute;
        top: -32.5%;
        left: -32.5%;
        width: 165%;
        height: 165%;
        z-index: 2;
        color: var(--main-color);
    }
    .main-illustration-outer {
        width: 100%;
        height: auto;
        aspect-ratio: 1 / 1;
        position: relative;
        box-sizing: border-box;
        padding: 20%;
        background-image: radial-gradient(rgba(10, 10, 10, 0.2) 1px, transparent 0);
        background-size: 30px 30px;
        background-position: -3px -3px;
    }
    .main-illustration-inner {
        width: 100%;
        height: 100%;
        position: relative;
    }
    .elem {
        background-color: white;
        border-radius: 20%;
        border: var(--main-border);
        position: absolute;
        transform: translate(-50%, -50%);
        z-index: 3;
    }
    .elem-class-line {
        position: absolute;
        bottom: 10%;
        left: 10%;
        width: 80%;
        height: 16%;
        border-radius: 50px;
        background-color: rgba(0, 0, 0, 0.15);
    }
    .elem-type-dot {
        position: absolute;
        top: 10%;
        right: 10%;
        width: 16%;
        height: 16%;
        border-radius: 50px;
        background-color: rgba(0, 0, 0, 0.6);
    }
</style>
