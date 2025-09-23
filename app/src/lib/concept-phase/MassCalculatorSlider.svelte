<script lang="ts">
    import { X, Weight, Grid2X2, Squircle } from '@lucide/svelte';
    import { currentNodes } from '$lib/stores/stores.svelte';
    import { get } from 'svelte/store';

    interface Props {
        isOpen: boolean;
        onClose: () => void;
    }

    let { isOpen, onClose }: Props = $props();

    let totalMass = $state(0);
    let massBreakdown = $state<Array<{name: string, type: string, mass: number}>>([]);

    $effect(() => {
        if (isOpen) {
            calculateMass();
        }
    });

    function calculateMass() {
        const nodes = get(currentNodes);
        let total = 0;
        let breakdown: Array<{name: string, type: string, mass: number}> = [];

        nodes.forEach(node => {
            if (node.type === 'part' || node.type === 'item') {
                const mass = node.data.mass || 0;
                total += mass;

                if (mass > 0) {
                    breakdown.push({
                        name: node.data.declaredName || node.data.definition || 'Unnamed',
                        type: node.type,
                        mass: mass
                    });
                }
            }
        });

        // Sort by mass (heaviest first)
        breakdown.sort((a, b) => b.mass - a.mass);

        totalMass = total;
        massBreakdown = breakdown;
    }
</script>

<div class="slider" class:open={isOpen}>
    <div class="slider-header">
        <div class="header-title">
            <Weight size={18} />
            <h3>Mass Calculator</h3>
        </div>
        <button class="close-btn" onclick={onClose}>
            <X size={20} />
        </button>
    </div>

    <div class="slider-content">
        <div class="total-mass">
            <span class="total-label">Total Mass:</span>
            <span class="total-value">{totalMass.toFixed(1)} kg</span>
        </div>

        {#if massBreakdown.length > 0}
            <div class="breakdown-section">
                <h4>Components:</h4>
                <div class="breakdown-list">
                    {#each massBreakdown as component}
                        <div class="breakdown-item">
                            <span class="component-name">
                                {#if component.type === 'part'}
                                    <Grid2X2 size={12} />
                                {:else}
                                    <Squircle size={12} />
                                {/if}
                                {component.name}
                            </span>
                            <span class="component-mass">{component.mass.toFixed(1)} kg</span>
                        </div>
                    {/each}
                </div>
            </div>
        {:else}
            <p class="no-mass">No components have mass values set.</p>
        {/if}
    </div>
</div>

<style>
    .slider {
        position: fixed;
        top: 110px;
        left: -350px;
        width: 320px;
        height: calc(100vh - 140px);
        max-height: 600px;
        background: white;
        border: 1px solid #e5e7eb;
        border-radius: 0 8px 8px 0;
        box-shadow: 2px 0 10px rgba(0, 0, 0, 0.1);
        transition: left 0.3s ease;
        z-index: 99;
        display: flex;
        flex-direction: column;
    }

    .slider.open {
        left: 85px;
    }

    .slider-header {
        display: flex;
        align-items: center;
        justify-content: space-between;
        padding: 16px;
        border-bottom: 1px solid #e5e7eb;
    }

    .header-title {
        display: flex;
        align-items: center;
        gap: 8px;
    }

    .header-title h3 {
        margin: 0;
        font-size: 16px;
        font-weight: 600;
        color: #111827;
    }

    .close-btn {
        background: none;
        border: none;
        color: #6b7280;
        cursor: pointer;
        padding: 4px;
        display: flex;
        align-items: center;
        justify-content: center;
        border-radius: 4px;
        transition: all 0.2s;
    }

    .close-btn:hover {
        background: #f3f4f6;
        color: #111827;
    }

    .slider-content {
        flex: 1;
        overflow-y: auto;
        padding: 16px;
    }

    .total-mass {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 12px;
        background: #f3f4f6;
        border-radius: 6px;
        margin-bottom: 20px;
        border: 1px solid #e5e7eb;
    }

    .total-label {
        font-size: 14px;
        font-weight: 500;
        color: #6b7280;
    }

    .total-value {
        font-size: 20px;
        font-weight: 700;
        color: #111827;
    }

    .breakdown-section {
        margin-top: 16px;
    }

    .breakdown-section h4 {
        margin: 0 0 12px 0;
        font-size: 12px;
        font-weight: 600;
        color: #6b7280;
        text-transform: uppercase;
        letter-spacing: 0.5px;
    }

    .breakdown-list {
        display: flex;
        flex-direction: column;
        gap: 6px;
    }

    .breakdown-item {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 8px 10px;
        background: #fafafa;
        border: 1px solid #f0f0f0;
        border-radius: 4px;
        font-size: 13px;
    }

    .breakdown-item:hover {
        background: #f9fafb;
        border-color: #e5e7eb;
    }

    .component-name {
        display: flex;
        align-items: center;
        gap: 6px;
        color: #374151;
        flex: 1;
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
    }

    .component-mass {
        font-weight: 600;
        color: #111827;
        white-space: nowrap;
    }

    .no-mass {
        text-align: center;
        color: #9ca3af;
        padding: 40px 20px;
        font-size: 13px;
    }
</style>