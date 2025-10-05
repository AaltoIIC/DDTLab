<script lang="ts">
    import { Handle, Position, useUpdateNodeInternals } from '@xyflow/svelte';
    import { ArrowRight, ArrowLeft, Circle } from '@lucide/svelte';
    import type { Port } from '../interfaces/types';
    import { get } from 'svelte/store';
    import { currentNodes } from '$lib/stores/stores.svelte';
    import { activeViewpointDetails, activeViewpoint } from '../viewpoints/viewpointStore';

    interface InternalPortData extends Port {
        portType: 'input' | 'output';
        parentNodeId: string;
        parentNodeName: string;
        isInternal: true;
    }

    interface Props {
        id: string;
        data: InternalPortData;
        selected?: boolean;
    }

    let { id, data, selected = false }: Props = $props();

    const updateNodeInternals = useUpdateNodeInternals();

    $effect(() => {
        if (data) {
            updateNodeInternals(id);
        }
    });

    // Helper function to check if this node is inside a package
    function isNodeInsidePackage(nodeId: string): string | null {
        const nodes = get(currentNodes);
        const thisNode = nodes.find(n => n.id === nodeId);
        if (!thisNode) return null;

        // Find all package nodes
        const packageNodes = nodes.filter(n => n.type === 'package');

        for (const pkg of packageNodes) {
            if (!pkg.width || !pkg.height) continue;

            // Check if this node is within the bounds of the package
            if (thisNode.position.x >= pkg.position.x &&
                thisNode.position.y >= pkg.position.y &&
                thisNode.position.x + (thisNode.width || 0) <= pkg.position.x + pkg.width &&
                thisNode.position.y + (thisNode.height || 0) <= pkg.position.y + pkg.height) {
                return pkg.id;
            }
        }

        return null;
    }

    // Check if node should be hidden by viewpoint
    let isHiddenByViewpoint = $derived.by(() => {
        // Skip viewpoint filtering if 'all' is selected
        if ($activeViewpoint === 'all') return false;

        // Check if node is manually included in the viewpoint
        const manuallyIncluded = $activeViewpointDetails?.nodeIds?.includes(id) || false;

        // Check if node's parent package is included in the viewpoint
        const parentPackageId = isNodeInsidePackage(id);
        const parentPackageIncluded = parentPackageId ?
            ($activeViewpointDetails?.nodeIds?.includes(parentPackageId) || false) : false;

        // Show node if either condition is true
        return !(manuallyIncluded || parentPackageIncluded);
    });
</script>

<div class="internal-port-node" class:selected class:input={data.portType === 'input'} class:output={data.portType === 'output'} class:hidden-by-viewpoint={isHiddenByViewpoint}>
    {#if data.portType === 'input'}
        <Handle
            type="source"
            position={Position.Right}
            id={`${id}-source`}
            style="right: -8px;"
        />
        <div class="port-content">
            <ArrowRight size={16} class="port-icon" />
            <div class="port-info">
                <span class="port-name">{data.name}</span>
                {#if data.interfaceType}
                    <span class="port-interface">{data.interfaceType}</span>
                {/if}
            </div>
        </div>
    {:else}
        <Handle
            type="target"
            position={Position.Left}
            id={`${id}-target`}
            style="left: -8px;"
        />
        <div class="port-content">
            <div class="port-info">
                <span class="port-name">{data.name}</span>
                {#if data.interfaceType}
                    <span class="port-interface">{data.interfaceType}</span>
                {/if}
            </div>
            <ArrowLeft size={16} class="port-icon" />
        </div>
    {/if}
</div>

<style>
    .internal-port-node {
        background: linear-gradient(135deg, #f3f4f6, #e5e7eb);
        border: 2px dashed #9ca3af;
        border-radius: 8px;
        padding: 8px 12px;
        min-width: 120px;
        font-size: 12px;
        transition: all 0.2s ease;
        cursor: move;
    }

    .internal-port-node.input {
        border-left: 4px solid #10b981;
        background: linear-gradient(135deg, #ecfdf5, #d1fae5);
    }

    .internal-port-node.output {
        border-right: 4px solid #3b82f6;
        background: linear-gradient(135deg, #eff6ff, #dbeafe);
    }

    .internal-port-node.selected {
        box-shadow: 0 0 0 2px #3b82f6;
    }

    .port-content {
        display: flex;
        align-items: center;
        gap: 8px;
    }

    .port-icon {
        color: #6b7280;
    }

    /* Hide nodes not in viewpoint */
    .internal-port-node.hidden-by-viewpoint {
        opacity: 0.2;
        pointer-events: none;
    }

    .port-info {
        display: flex;
        flex-direction: column;
    }

    .port-name {
        font-weight: 600;
        color: #1f2937;
    }

    .port-interface {
        font-size: 10px;
        color: #6b7280;
        font-style: italic;
    }

    :global(.react-flow__handle) {
        background: #6b7280;
        width: 12px;
        height: 12px;
    }

    .internal-port-node.input :global(.react-flow__handle) {
        background: #10b981;
    }

    .internal-port-node.output :global(.react-flow__handle) {
        background: #3b82f6;
    }
</style>