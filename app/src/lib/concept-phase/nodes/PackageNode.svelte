<script lang="ts">
    import { run } from 'svelte/legacy';

        import { Package, X, MoveDiagonal2, Info, Save, FolderPlus } from '@lucide/svelte';
        import { useUpdateNodeInternals, NodeResizeControl, type Node } from '@xyflow/svelte';
        import { currentNodes, currentEdges, addToHistory, currentPackages } from '$lib/stores/stores.svelte';
    import type { PackageTemplate } from '$lib/types/types';
    import { generateName } from '$lib/helpers';
    import { activeViewpointDetails, viewpoints } from '../viewpoints/viewpointStore';
    import ContextMenu from '../ContextMenu.svelte';
    import { get } from 'svelte/store';
    import Portal from 'svelte-portal';

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

    // Get list of viewpoints this package belongs to
    let assignedViewpoints = $derived.by(() => {
        // Include both system and custom viewpoints that contain this package
        return $viewpoints.filter(v => v.nodeIds?.includes(id) || false);
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

    // Context menu state
    let showContextMenu = $state(false);
    let contextMenuX = $state(0);
    let contextMenuY = $state(0);
    let showAddToViewDialog = $state(false);
    let selectedViewpointIds = $state<Set<string>>(new Set());

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

    function handleContextMenu(event: MouseEvent) {
        event.preventDefault();
        event.stopPropagation();

        // Use client coordinates since context menu is position: fixed
        contextMenuX = event.clientX;
        contextMenuY = event.clientY;

        showContextMenu = true;
    }

    function handleAddToView() {
        // Initialize with currently assigned viewpoints
        const currentAssigned = $viewpoints.filter(v => v.nodeIds?.includes(id));
        selectedViewpointIds = new Set(currentAssigned.map(v => v.id));
        showAddToViewDialog = true;
        showContextMenu = false;
    }

    function updatePackageViewpoints() {
        const { inNodes } = getInsideData();
        const nodeIds = inNodes.map(n => n.id);
        nodeIds.push(id); // Add the package itself

        const allViewpoints = get(viewpoints);

        // Process each viewpoint
        allViewpoints.forEach(viewpoint => {
            const wasSelected = viewpoint.nodeIds?.includes(id) || false;
            const isSelected = selectedViewpointIds.has(viewpoint.id);

            if (wasSelected !== isSelected) {
                // State changed for this viewpoint
                if (isSelected) {
                    // Add to viewpoint
                    const existingNodeIds = viewpoint.nodeIds || [];
                    const uniqueNodeIds = [...new Set([...existingNodeIds, ...nodeIds])];

                    if (viewpoint.type === 'custom') {
                        viewpoints.updateCustom(viewpoint.id, {
                            ...viewpoint,
                            nodeIds: uniqueNodeIds
                        });
                    } else if (viewpoint.type === 'system') {
                        viewpoints.updateSystem(viewpoint.id, {
                            ...viewpoint,
                            nodeIds: uniqueNodeIds
                        });
                    }
                } else {
                    // Remove from viewpoint
                    const filteredNodeIds = (viewpoint.nodeIds || []).filter(nId => !nodeIds.includes(nId));

                    if (viewpoint.type === 'custom') {
                        viewpoints.updateCustom(viewpoint.id, {
                            ...viewpoint,
                            nodeIds: filteredNodeIds
                        });
                    } else if (viewpoint.type === 'system') {
                        viewpoints.updateSystem(viewpoint.id, {
                            ...viewpoint,
                            nodeIds: filteredNodeIds
                        });
                    }
                }
            }
        });

        showAddToViewDialog = false;
        selectedViewpointIds = new Set();
    }
</script>

<!-- svelte-ignore a11y_no_static_element_interactions -->
<!-- svelte-ignore a11y_click_events_have_key_events -->
<div
    class="package-node"
    class:selected={selected}
    class:hidden-by-viewpoint={isHiddenByViewpoint}
>
    <div class="drag-handle top" onpointerdown={() => selectInsideNodes()} oncontextmenu={handleContextMenu}></div>
    <div class="drag-handle bottom" onpointerdown={() => selectInsideNodes()} oncontextmenu={handleContextMenu}></div>
    <div class="drag-handle right" onpointerdown={() => selectInsideNodes()} oncontextmenu={handleContextMenu}></div>
    <div class="drag-handle left" onpointerdown={() => selectInsideNodes()} oncontextmenu={handleContextMenu}></div>
    <div class="package-header" oncontextmenu={handleContextMenu}>
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

            {#if assignedViewpoints.length > 0}
                <div class="viewpoint-badges">
                    {#each assignedViewpoints as viewpoint}
                        <span
                            class="viewpoint-badge {viewpoint.type}"
                            title="Assigned to: {viewpoint.name} ({viewpoint.type} view)"
                        >
                            {viewpoint.icon} {viewpoint.name}
                        </span>
                    {/each}
                </div>
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

    <!-- Context Menu -->
    <Portal>
        <ContextMenu
            bind:visible={showContextMenu}
            x={contextMenuX}
            y={contextMenuY}
            showAddToView={true}
            on:addToView={handleAddToView}
        />
    </Portal>

    <!-- Add to View Dialog -->
    {#if showAddToViewDialog}
        <Portal>
            {@const systemViewpoints = $viewpoints.filter(v => v.type === 'system')}
            {@const customViewpoints = $viewpoints.filter(v => v.type === 'custom')}
            {@const allViewpoints = [...systemViewpoints, ...customViewpoints]}
            <div class="dialog-overlay" onclick={() => showAddToViewDialog = false}>
                <div class="dialog" onclick={(e) => e.stopPropagation()}>
                    <h3>Manage Package Views</h3>

                    {#if allViewpoints.length > 0}
                        <p class="dialog-description">
                            Select which views should include this package and all its contents:
                        </p>
                        <div class="viewpoint-list">
                            {#if systemViewpoints.length > 0}
                                <div class="viewpoint-category">System Views</div>
                                {#each systemViewpoints as viewpoint}
                                    <label class="viewpoint-option" class:checked={selectedViewpointIds.has(viewpoint.id)}>
                                        <input
                                            type="checkbox"
                                            checked={selectedViewpointIds.has(viewpoint.id)}
                                            onchange={(e) => {
                                                const checked = e.currentTarget.checked;
                                                if (checked) {
                                                    selectedViewpointIds.add(viewpoint.id);
                                                } else {
                                                    selectedViewpointIds.delete(viewpoint.id);
                                                }
                                                selectedViewpointIds = new Set(selectedViewpointIds);
                                            }}
                                        />
                                        <span>{viewpoint.icon} {viewpoint.name}</span>
                                        {#if viewpoint.nodeIds?.includes(id)}
                                            <span class="assigned-badge">Currently assigned</span>
                                        {/if}
                                    </label>
                                {/each}
                            {/if}

                            {#if customViewpoints.length > 0}
                                <div class="viewpoint-category">Custom Views</div>
                                {#each customViewpoints as viewpoint}
                                    <label class="viewpoint-option" class:checked={selectedViewpointIds.has(viewpoint.id)}>
                                        <input
                                            type="checkbox"
                                            checked={selectedViewpointIds.has(viewpoint.id)}
                                            onchange={(e) => {
                                                const checked = e.currentTarget.checked;
                                                if (checked) {
                                                    selectedViewpointIds.add(viewpoint.id);
                                                } else {
                                                    selectedViewpointIds.delete(viewpoint.id);
                                                }
                                                selectedViewpointIds = new Set(selectedViewpointIds);
                                            }}
                                        />
                                        <span>{viewpoint.icon} {viewpoint.name}</span>
                                        {#if viewpoint.nodeIds?.includes(id)}
                                            <span class="assigned-badge">Currently assigned</span>
                                        {/if}
                                    </label>
                                {/each}
                            {/if}
                        </div>
                    {:else}
                        <p class="no-viewpoints">
                            No views available.
                        </p>
                    {/if}

                    <div class="dialog-buttons">
                        <button onclick={() => showAddToViewDialog = false}>Cancel</button>
                        {#if allViewpoints.length > 0}
                            <button
                                onclick={updatePackageViewpoints}
                                class="primary"
                            >
                                Update Views
                            </button>
                        {/if}
                    </div>
                </div>
            </div>
        </Portal>
    {/if}
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
        flex: 1;
        flex-wrap: wrap;
    }

    .viewpoint-badges {
        display: flex;
        gap: 6px;
        align-items: center;
        margin-left: auto;
    }

    .viewpoint-badge {
        display: inline-flex;
        align-items: center;
        gap: 4px;
        padding: 3px 8px;
        color: white;
        border-radius: 4px;
        font-size: 11px;
        font-weight: 500;
        white-space: nowrap;
        opacity: 0.9;
        transition: opacity 0.2s;
    }

    .viewpoint-badge.custom {
        background: #8b5cf6; /* Purple for custom */
    }

    .viewpoint-badge.system {
        background: #3b82f6; /* Blue for system */
    }

    .viewpoint-badge:hover {
        opacity: 1;
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

    /* Dialog styles */
    .dialog-overlay {
        position: fixed;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        background: rgba(0, 0, 0, 0.3);
        display: flex;
        align-items: center;
        justify-content: center;
        z-index: 1002;
    }

    .dialog {
        background: white;
        border-radius: 8px;
        padding: 20px;
        max-width: 400px;
        width: 90%;
        box-shadow: 0 4px 20px rgba(0, 0, 0, 0.15);
    }

    .dialog h3 {
        margin: 0 0 16px 0;
        font-size: 18px;
        font-weight: 600;
        color: #111827;
    }

    .dialog-description {
        font-size: 14px;
        color: #6b7280;
        margin-bottom: 16px;
    }

    .viewpoint-list {
        display: flex;
        flex-direction: column;
        gap: 8px;
        margin-bottom: 20px;
        max-height: 200px;
        overflow-y: auto;
    }

    .viewpoint-category {
        font-size: 12px;
        font-weight: 600;
        color: #6b7280;
        text-transform: uppercase;
        letter-spacing: 0.5px;
        margin-top: 8px;
        margin-bottom: 4px;
        padding-bottom: 4px;
        border-bottom: 1px solid #e5e7eb;
    }

    .viewpoint-category:first-child {
        margin-top: 0;
    }

    .viewpoint-option {
        display: flex;
        align-items: center;
        gap: 8px;
        padding: 8px 12px;
        border: 1px solid #e5e7eb;
        border-radius: 6px;
        cursor: pointer;
        transition: all 0.2s;
    }

    .viewpoint-option:hover {
        background: #f9fafb;
        border-color: #d1d5db;
    }

    .viewpoint-option.checked {
        background: #eff6ff;
        border-color: #3b82f6;
    }

    .viewpoint-option input[type="checkbox"],
    .viewpoint-option input[type="radio"] {
        cursor: pointer;
    }

    .assigned-badge {
        margin-left: auto;
        font-size: 10px;
        padding: 2px 6px;
        background: #dbeafe;
        color: #2563eb;
        border-radius: 3px;
        font-weight: 500;
    }

    .no-viewpoints {
        font-size: 14px;
        color: #6b7280;
        text-align: center;
        padding: 20px 0;
    }

    .dialog-buttons {
        display: flex;
        gap: 8px;
        justify-content: flex-end;
    }

    .dialog-buttons button {
        padding: 6px 16px;
        border: 1px solid #d1d5db;
        border-radius: 6px;
        font-size: 14px;
        cursor: pointer;
        background: white;
        transition: all 0.2s;
    }

    .dialog-buttons button:hover {
        background: #f9fafb;
    }

    .dialog-buttons button.primary {
        background: #3b82f6;
        color: white;
        border-color: #3b82f6;
    }

    .dialog-buttons button.primary:hover {
        background: #2563eb;
    }

    .dialog-buttons button:disabled {
        opacity: 0.5;
        cursor: not-allowed;
    }
</style>