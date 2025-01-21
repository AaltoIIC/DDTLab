<script lang="ts">
    import type {SystemType} from "$lib/types/types";

    export let system: SystemType;

    // get node dimensions
    let highestX = 0,
        highestY = 0,
        lowestX = Infinity,
        lowestY = Infinity;
    system.nodes.filter(n => n.type !== 'RootSystem').forEach(node => {
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


</script>
<div class="main-illustration-outer">
    <div class="main-illustration-inner">
        {#each system.nodes.filter(n => n.type !== 'RootSystem') as element}
            <div class="elem"
                style:top={(element.position.y - lowestY + addToY) / pxToPercent + '%'}
                style:left={(element.position.x - lowestX + addToX) / pxToPercent + '%'}>
            </div>
        {/each}
    </div>
</div>
<style>
    .main-illustration-outer {
        width: 100%;
        height: auto;
        aspect-ratio: 1 / 1;
        position: relative;
        box-sizing: border-box;
        padding: 32px;
    }
    .main-illustration-inner {
        width: 100%;
        height: 100%;
        position: relative;
    }
    .elem {
        width: 32px;
        height: 32px;
        background-color: white;
        border-radius: 5px;
        border: var(--main-border);
        position: absolute;
        transform: translate(-50%, -50%);
    }
</style>
