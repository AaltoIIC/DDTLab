<script lang="ts">
    import { Handle, Position, useUpdateNodeInternals } from '@xyflow/svelte';
    import { ArrowRight, ArrowLeft, Circle } from '@lucide/svelte';
    import type { Port } from '../interfaces/types';

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
</script>

<div class="internal-port-node" class:selected class:input={data.portType === 'input'} class:output={data.portType === 'output'}>
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