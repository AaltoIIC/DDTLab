<script lang="ts">
    export let text: string = '';
    export let position: 'right' | 'left' | 'top' | 'bottom' = 'right';
    export let disabled: boolean = false;
    
    let showTooltip = false;
    let tooltipElement: HTMLDivElement;
</script>

<!-- svelte-ignore a11y-no-static-element-interactions -->
<div class="tooltip-wrapper"
    on:mouseenter={() => showTooltip = true}
    on:mouseleave={() => showTooltip = false}>
    <slot />
    {#if showTooltip && text && !disabled}
        <div class="tooltip {position}" bind:this={tooltipElement}>
            {text}
        </div>
    {/if}
</div>

<style>
    .tooltip-wrapper {
        position: relative;
        display: inline-flex;
        align-items: center;
        justify-content: center;
    }
    
    .tooltip {
        position: absolute;
        background-color: rgba(0, 0, 0, 0.9);
        color: white;
        padding: 6px 12px;
        border-radius: 6px;
        font-size: 13px;
        white-space: nowrap;
        pointer-events: none;
        z-index: 1000000;
        animation: fadeIn 0.2s ease-in-out;
    }
    
    .tooltip.right {
        left: calc(100% + 10px);
        top: 50%;
        transform: translateY(-50%);
    }
    
    .tooltip.left {
        right: calc(100% + 10px);
        top: 50%;
        transform: translateY(-50%);
    }
    
    .tooltip.top {
        bottom: calc(100% + 10px);
        left: 50%;
        transform: translateX(-50%);
    }
    
    .tooltip.bottom {
        top: calc(100% + 10px);
        left: 50%;
        transform: translateX(-50%);
    }
    
    @keyframes fadeIn {
        from {
            opacity: 0;
            transform: translateY(-50%) translateX(5px);
        }
        to {
            opacity: 1;
            transform: translateY(-50%) translateX(0);
        }
    }
    
    .tooltip.right {
        animation: fadeInRight 0.2s ease-in-out;
    }
    
    @keyframes fadeInRight {
        from {
            opacity: 0;
            transform: translateY(-50%) translateX(5px);
        }
        to {
            opacity: 1;
            transform: translateY(-50%) translateX(0);
        }
    }
</style>