<script lang="ts">
    import { run } from 'svelte/legacy';

        import { Package, X, MoveDiagonal2, Info, Save } from '@lucide/svelte';
        import { useUpdateNodeInternals, NodeResizeControl, type Node } from '@xyflow/svelte';
        import { currentNodes, currentEdges, addToHistory, currentPackages } from '$lib/stores/stores.svelte';
    import type { PackageTemplate } from '$lib/types/types';
    import { generateName } from '$lib/helpers';
    import { activeViewpointDetails } from '../viewpoints/viewpointStore';

        type PackageData = {
            declaredName: string;
            comment: string;
            id: string;
        };



    interface Props {
        data: PackageData;
        selected: boolean;
        id: string;

    }

    let {
        data = $bindable(),
        selected,
        id,
    }: Props = $props();

    // Check if node should be hidden by viewpoint
    let isHiddenByViewpoint = $derived.by(() => {
        if ($activeViewpointDetails?.type === 'custom' && $activeViewpointDetails.nodeIds) {
            return !$activeViewpointDetails.nodeIds.includes(id);
        }
        return false;
    });

    // Update React Flow internals when data changes
    const updateNodeInternals = useUpdateNodeInternals();
    run(() => {
        if (data) {
                updateNodeInternals(id);
            }
    });

    let editingName = $state(false);
    let editingComment = $state(false);
    let tempName = $state(data.declaredName);
    let tempComment = $state(data.comment);
    let showComment = $state(false);
    let infoClicked = $state(false);

    // Returns an array of nodes and edges connecting those nodes together contained within the bounds of this package node
    function getInsideData() {
        const allNodes = $currentNodes;
        const thisNode = allNodes.find( n => n.id === id );
        if (!thisNode) return {inNodes: [], inEdges: []};
        const {position, width, height} = thisNode;
        if (!width || !height) return {inNodes: [], inEdges: []};

        const inNodes = allNodes.filter( node => {
            const {position: childPos, width: childW, height: childH} = node;
            return  childPos.x >= position.x && 
                    childPos.y >= position.y &&
                    childPos.x + (childW ?? 0) <= position.x + width &&
                    childPos.y + (childH ?? 0) <= position.y + height;
        });

        const inNodeIds = new Set(inNodes.map(n => n.id));

        const inEdges = $currentEdges.filter(edge => 
            inNodeIds.has(edge.source) && inNodeIds.has(edge.target)
        );

        return {inNodes, inEdges};
    }

    function selectInsideNodes() {
        const { inNodes } = getInsideData();

        currentNodes.update(nodes => {
            let changed = false;
            const updated = nodes.map( n => {
                const inside = inNodes.includes(n);
                if (n.selected !== inside) {
                    changed = true;
                    return {...n, selected: inside};
                }
                return n;
            });

            return changed ? updated : nodes;
        });
    }

    function updateNodeData(field: string, value: any) {
        currentNodes.update(nodes => {
            return nodes.map(node => {
                if (node.id === id) {
                    return {
                        ...node,
                        data: {
                            ...node.data,
                            [field]: value
                        }
                    };
                }
                return node;
            });
        });
        addToHistory();
    }

    function handleSavePackage() {
        const {inNodes: nodes, inEdges: edges} = getInsideData();

        const savedPackage: PackageTemplate = {
            id: `${id}-${Math.random().toString(36).substring(2, 9)}`,
            name: generateName(data.declaredName, $currentPackages.map( p => p.name )),
            type: 'package',
            description: data.comment,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            data: { nodes, edges }
        }


        console.log(JSON.stringify(savedPackage, null, 2));
        currentPackages.update(pkgs => [...pkgs, savedPackage]);
        addToHistory();
    }

    function handleNameEdit() {
        if (tempName.trim()) {
            updateNodeData('declaredName', tempName.trim());
        } else {
            tempName = data.declaredName;
        }
        editingName = false;
    }

    function handleMouseLeave() {
        if (!infoClicked) {
            showComment = false;
        }
    }

    function handleCommentEdit() {
        updateNodeData('comment', tempComment.trim());
        editingComment = false;
        showComment = false;
        infoClicked = false;

    }

    function handleDelete() {
        // Remove this node and any connected edges
        currentNodes.update(nodes => nodes.filter(n => n.id !== id));
        currentEdges.update(edges => edges.filter(e => e.source !== id && e.target !== id));
        addToHistory();
    }

    function getUnderlyingElement(e: PointerEvent, current: HTMLElement) {
        current.style.pointerEvents = "none";
        const element = document.elementFromPoint(e.clientX, e.clientY);
        current.style.pointerEvents = "auto";
        return element;
    }
</script>

<!-- svelte-ignore a11y_no_static_element_interactions -->
<!-- svelte-ignore a11y_click_events_have_key_events -->
<div
    class="package-node"
    class:selected={selected}
    class:hidden-by-viewpoint={isHiddenByViewpoint}
    onpointerdown={() => selectInsideNodes()}
>
    <div class="drag-handle top"></div>
    <div class="drag-handle bottom"></div>
    <div class="drag-handle right"></div>
    <div class="drag-handle left"></div>
    <div class="package-header">
        <div class="package-header-left">
            <Package size={22} />
            {#if editingName}
                <input
                    class="package-title"
                    type="text"
                    bind:value={tempName}
                    onblur={handleNameEdit}
                    onkeydown={(e) => {
                        if (e.key === 'Enter') handleNameEdit();
                        if (e.key === 'Escape') {
                            tempName = data.declaredName;
                            editingName = false;
                        }
                    }}
                    autofocus
                />
            {:else}
                <span
                    class="package-title editable"
                    onclick={() => {
                        editingName = true;
                        tempName = data.declaredName;
                    }}
                >
                    {`${data.declaredName} (Package)`|| 'Unnamed'}
                </span>
            {/if}
        </div>
        <div class="package-header-right">
            <button
                class="package-button save-color"
                onclick={handleSavePackage}
                title="Save package"
            >
                <Save size={18} strokeWidth={2.5}/>
            </button>
            <button
                class="package-button delete-color"
                onclick={handleDelete}
                title="Delete package"
            >
                <X size={20} />
            </button>
        </div>
    </div>

    <div class="package-footer">
        <div
            class="package-info"
            onmouseenter={() => showComment = true}
            onmouseleave={handleMouseLeave}
        >
            <Info
                size={22}
                onclick={() => {infoClicked = !infoClicked}}
            />
            {#if showComment}
                {#if infoClicked}
                    <input
                        class="package-comment"
                        type="text"
                        bind:value={tempComment}
                        onblur={handleCommentEdit}
                        onkeydown={(e) => {
                            if (e.key === 'Enter') handleCommentEdit();
                            if (e.key === 'Escape') {
                                tempComment = data.comment;
                                editingComment = false;
                                showComment = false;
                            }
                        }}
                        autofocus

                    />
                {:else}
                    <span class="package-comment">{data.comment || 'Click to add comment'}</span>
                {/if}
            {/if}
        </div>
        <span class="resize-control">
            <NodeResizeControl minWidth={350} minHeight={150} style="background: transparent; border: none;">
                <MoveDiagonal2 size={22} />
            </NodeResizeControl>
        </span>
    </div>
</div>

<style>
    :global(.svelte-flow__node:has(.package-node)) {
        pointer-events: none;
    }

    :global(.svelte-flow__node:has(.package-node) .drag-handle),
    :global(.svelte-flow__node:has(.package-node) .package-header-left),
    :global(.svelte-flow__node:has(.package-node) .package-header-right),
    :global(.svelte-flow__node:has(.package-node) .package-info),
    :global(.svelte-flow__node:has(.package-node) .resize-control) {
        pointer-events: auto;
    }

    .package-node {
        display: flex;
        flex-direction: column;
        position: relative;
        width: 100%;
        height: 100%;
        justify-content: space-between;
        border: 4px dashed #c6c7c9;
        background-color: transparent;
        color: #8e8f91;
        border-radius: 10px;
        padding: 10px;
    }

    .package-node:hover {
        border-color: #8e8f91;
        cursor: pointer;
    }

    .package-node.selected {
        border-color: #0055ff; 
    }

    .drag-handle {
        position: absolute;
        background: transparent;
        z-index: 10;
        cursor: pointer;
    }

    .drag-handle.top {top: -7px; left: -4px; height: 10px; width: calc(100% + 8px);}
    .drag-handle.bottom {bottom: -7px; left: -4px; height: 10px; width: calc(100% + 8px);}
    .drag-handle.right {top: 0; right: -7px; width: 10px; height: 100%;}
    .drag-handle.left {top: 0; left: -7px; width: 10px; height: 100%;}

    .package-header {
        display: flex;
        align-items: center;
        justify-content: space-between;
        margin-bottom: 12px;
        padding-bottom: 8px;
    }

    .package-header-left {
        display: flex;
        align-items: center;
        gap: 8px;
    }

    .package-header-right {
        display: flex;
        align-items: center;
    }

    .package-title {
        font-weight: 600;
        font-size: 18px;
    }

    .package-title.editable {
        cursor: text;
        padding: 1px 3px;
        border-radius: 3px;
        transition: background-color 0.2s;
    }

    .package-title.editable:hover {
        background-color: #eceef0;
    }

    .package-footer {
        position: relative;
        display: flex;
        justify-content: space-between;
    }

    .package-info {
        position: relative;
        display: flex;
        align-items: center;
    }

    .package-comment {
        position: absolute;
        left: calc(100% + 5px);
        white-space: nowrap;
    }

    .resize-control {
        position: relative;
        bottom: 19px;
        right: 19px;
    }

    .package-button {
        background: none;
        width: 30px;
        height: 30px;
        border: none;
        padding: 4px;
        cursor: pointer;
        color: #9ca3af;
        border-radius: 4px;
        transition: all 0.2s;
        display: flex;
        align-items: center;
        justify-content: center;
    }

    .save-color:hover {
        background-color: #e2e9fe;
        color: #2675dc;
    }

    .delete-color:hover {
        background-color: #fee2e2;
        color: #dc2626;
    }

    /* Hide nodes not in viewpoint */
    .package-node.hidden-by-viewpoint {
        opacity: 0.2;
        pointer-events: none;
    }
</style>