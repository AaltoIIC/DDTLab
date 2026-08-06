<script lang="ts">
    import Portal from 'svelte-portal';

    interface Props {
        text?: string;
        position?: 'right' | 'left' | 'top' | 'bottom';
        disabled?: boolean;
        children?: import('svelte').Snippet;
    }

    let {
        text = '',
        position = 'right',
        disabled = false,
        children
    }: Props = $props();

    let showTooltip = $state(false);
    let wrapperElement: HTMLDivElement | undefined = $state();
    let anchor = $state<{ x: number; y: number } | null>(null);

    // The tooltip can never be
    // clipped by an ancestor's overflow (e.g. the concept sidebar's scrollable
    // container).
    function computeAnchor() {
        if (!wrapperElement) return;
        const r = wrapperElement.getBoundingClientRect();
        switch (position) {
            case 'left':
                anchor = { x: r.left - 10, y: r.top + r.height / 2 };
                break;
            case 'top':
                anchor = { x: r.left + r.width / 2, y: r.top - 10 };
                break;
            case 'bottom':
                anchor = { x: r.left + r.width / 2, y: r.bottom + 10 };
                break;
            default: // 'right'
                anchor = { x: r.right + 10, y: r.top + r.height / 2 };
        }
    }

    // Position on show, and keep the tooltip glued to its button while any
    // scrollable ancestor (e.g. the concept sidebar) scrolls under the cursor.
    $effect(() => {
        if (showTooltip && text && !disabled) {
            computeAnchor();
            window.addEventListener('scroll', computeAnchor, { capture: true, passive: true });
            window.addEventListener('resize', computeAnchor);
            return () => {
                window.removeEventListener('scroll', computeAnchor, { capture: true });
                window.removeEventListener('resize', computeAnchor);
            };
        }
    });
</script>

<!-- svelte-ignore a11y_no_static_element_interactions -->
<div class="tooltip-wrapper"
    bind:this={wrapperElement}
    onmouseenter={() => showTooltip = true}
    onmouseleave={() => showTooltip = false}>
    {@render children?.()}
</div>

{#if showTooltip && text && !disabled && anchor}
    <Portal target="body">
        <div class="tooltip-anchor {position}" style="left: {anchor.x}px; top: {anchor.y}px">
            <div class="tooltip">{text}</div>
        </div>
    </Portal>
{/if}

<style>
    .tooltip-wrapper {
        position: relative;
        display: inline-flex;
        align-items: center;
        justify-content: center;
    }

    .tooltip-anchor {
        position: fixed;
        pointer-events: none;
        z-index: 1000000;
    }

    .tooltip-anchor.right {
        transform: translateY(-50%);
    }

    .tooltip-anchor.left {
        transform: translate(-100%, -50%);
    }

    .tooltip-anchor.top {
        transform: translate(-50%, -100%);
    }

    .tooltip-anchor.bottom {
        transform: translateX(-50%);
    }

    .tooltip {
        background-color: rgba(0, 0, 0, 0.9);
        color: white;
        padding: 6px 12px;
        border-radius: 6px;
        font-size: 13px;
        white-space: nowrap;
        animation: fadeIn 0.2s ease-in-out;
    }

    @keyframes fadeIn {
        from {
            opacity: 0;
            transform: translateX(5px);
        }
        to {
            opacity: 1;
            transform: translateX(0);
        }
    }
</style>
