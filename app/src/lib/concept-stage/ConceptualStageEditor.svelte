<script lang="ts">
    import { SvelteFlow, Background, Controls, MiniMap, BackgroundVariant, useSvelteFlow } from '@xyflow/svelte';
    import type { Node, Edge, NodeTypes, EdgeTypes, Connection } from '@xyflow/svelte';
    import '@xyflow/svelte/dist/style.css';
    import PackageNode from './nodes/PackageNode.svelte';
    import ConceptNode from './nodes/ConceptNode.svelte';
    import InternalPortNode from './nodes/InternalPortNode.svelte';
    import RemovableEdge from './edges/RemovableEdge.svelte';
    import ConnectionTypeDropdown from './ConnectionTypeDropdown.svelte';
    import { get } from 'svelte/store';
    import { currentNodes, currentEdges, addToHistory, packageEntryForCanvasNode, upsertPackageEntryForCanvasNode } from '$lib/stores/stores.svelte';
    import { generateName } from '$lib/helpers';
    import { currentNodeView, navigationStack } from './nodeViewStore';
    import { mirrorConnectToScope, seedNodesIntoScope, seedRootCanvasToModel } from './sysml/session';
    import { checkCompatibility } from './interfaces';
    import type { Port } from './interfaces';
    import { instantiateSimpleComponent } from './utils/simpleInstantiation';
    import { instantiateTemplate } from './utils/templateInstantiation';
    import { onMount, untrack } from 'svelte';
    import { zoom } from 'd3-zoom';
    import { findPort } from './nodes/portUtils';
    import { activeViewpoint, activeViewpointDetails } from './viewpoints/viewpointStore';
    import ViewportFitter from '$lib/design-stage/ViewportFitter.svelte';
    

    const nodeTypes = {
        package: PackageNode,
        part: ConceptNode,
        item: ConceptNode,
        internalPort: InternalPortNode,
    } as {} as NodeTypes;
    
    const edgeTypes = {
        default: RemovableEdge,
    } as {} as EdgeTypes;


    let flowContainer: HTMLDivElement | undefined = $state();
    const { viewport, getViewport } = useSvelteFlow();
    let zoomLevel = $state(1);
    let x = $state(0);
    let y = $state(0);
    viewport.subscribe((value) => {
        zoomLevel = value.zoom;
        x = value.x;
        y = value.y;
    });
    
    // Global drag over prevention
    onMount(() => {
        function preventDefaultDragOver(e: DragEvent) {
            e.preventDefault();
            e.dataTransfer!.dropEffect = 'copy';
        }
        
        document.addEventListener('dragover', preventDefaultDragOver);
        
        return () => {
            document.removeEventListener('dragover', preventDefaultDragOver);
        };
    });
    
    function handleDragOver(event: DragEvent) {
        event.preventDefault();
        event.dataTransfer!.dropEffect = 'copy';
    }
    
    function handleDrop(event: DragEvent) {
        event.preventDefault();
        event.stopPropagation();

        const jsonData = event.dataTransfer?.getData('application/json');
        if (!jsonData) return;

        try {
            const data = JSON.parse(jsonData);
            // console.log('Dropping data:', data);

            // Get drop position - use the event target if flowContainer is not available
            const target = document.getElementById('conceptual-editor');
            if (!target) {
                console.error('Could not find drop target');
                return;
            }

            const rect = target.getBoundingClientRect();
            const currentViewport = getViewport();

            // Calculate position accounting for viewport pan and zoom
            const position = {
                x: (event.clientX - rect.left - currentViewport.x) / currentViewport.zoom,
                y: (event.clientY - rect.top - currentViewport.y) / currentViewport.zoom
            };

            // console.log('Drop position:', position);

            // Reject drops that land inside a bound package — bound packages
            // are closed to new content.
            const allNodes = get(currentNodes);
            const overBoundPkg = allNodes.find(
                n => n.type === 'package' &&
                     n.data?.bound === true &&
                     n.width != null && n.height != null &&
                     position.x >= n.position.x &&
                     position.y >= n.position.y &&
                     position.x <= n.position.x + n.width &&
                     position.y <= n.position.y + n.height
            );
            if (overBoundPkg) return;

            let newNodes: Node[] = [];
            let newEdges: Edge[] = [];

            // Check if it's a template or a simple component
            if (data.type === 'template' && data.template) {
                // Instantiate template
                const result = instantiateTemplate(data.template, position);
                newNodes = result.nodes;
                newEdges = result.edges;
            } else if (data.type === 'package') {
                // Instantiate simple component (from library) - data is already the complete component
                const result = instantiateSimpleComponent(data, position);
                newNodes = result.nodes;
                newEdges = result.edges;
            } else {
                console.error('Unknown component type:', data.type);
                return;
            }

            // Uniquify node names to prevent clashes with existing nodes
            const existingNames = get(currentNodes)
                .map(n => n.data?.declaredName)
                .filter((name): name is string => typeof name === 'string');

            for (const node of newNodes) {
                if (node.data?.declaredName) {
                    node.data.declaredName = generateName(String(node.data.declaredName), existingNames);
                    existingNames.push(String(node.data.declaredName));
                }
            }

            // Add to current view
            currentNodes.update(nodes => [...nodes, ...newNodes]);
            if (newEdges.length > 0) {
                currentEdges.update(edges => [...edges, ...newEdges]);
            }

            addToHistory();

            // Mirror the dropped content into the semantic session so the new
            // nodes have model elements (usages, ports, relationships). At the
            // root level the whole canvas is re-seeded (add-only, idempotent);
            // inside a model-backed drill-down the drop is seeded under the
            // view's scope usage. Content dropped inside a legacy nested view
            // is skipped — those nodes have no model representation.
            const view = get(currentNodeView);
            if (view?.semantic?.scopeId) {
                seedNodesIntoScope(view.semantic.scopeId, newNodes, newEdges);
            } else if (!view) {
                seedRootCanvasToModel(get(currentNodes), get(currentEdges));
            }
        } catch (error) {
            console.error('Failed to instantiate:', error);
        }
    }
    
    // State for connection type dropdown
    let showConnectionDropdown = $state(false);
    let pendingConnection: Connection | null = $state(null);
    let dropdownX = $state(0);
    let dropdownY = $state(0);
    
    function onConnect(params: Connection) {
        // console.log('Connection params:', params);

        const nodes = get(currentNodes);
        const sourceNode = nodes.find(n => n.id === params.source);
        const targetNode = nodes.find(n => n.id === params.target);

        // Check if source or target is a package node
        if (sourceNode?.type === 'package' || targetNode?.type === 'package') {
            // console.log('Cannot connect to/from package nodes');
            return; // Prevent connection
        }

        // Validate internal port connections
        // Internal input ports can only have outgoing connections
        // Internal output ports can only have incoming connections
        if (sourceNode?.type === 'internalPort' && sourceNode.data.portType === 'output') {
            // console.log('Internal output ports can only receive connections, not send them');
            return;
        }
        if (targetNode?.type === 'internalPort' && targetNode.data.portType === 'input') {
            // console.log('Internal input ports can only send connections, not receive them');
            return;
        }
        
        // Store the pending connection and show dropdown at midpoint of connection
        pendingConnection = params;
        
        // Calculate position for dropdown (midpoint of the connection)
        const sourceElement = document.querySelector(`[data-id="${params.source}"]`);
        const targetElement = document.querySelector(`[data-id="${params.target}"]`);
        
        if (sourceElement && targetElement) {
            const sourceRect = sourceElement.getBoundingClientRect();
            const targetRect = targetElement.getBoundingClientRect();
            
            dropdownX = (sourceRect.left + targetRect.left) / 2;
            dropdownY = (sourceRect.top + targetRect.top) / 2;
        } else {
            // Fallback to center of viewport
            dropdownX = window.innerWidth / 2;
            dropdownY = window.innerHeight / 2;
        }
        
        // Skip connection type dropdown for internal port connections
        if (sourceNode?.type === 'internalPort' || targetNode?.type === 'internalPort') {
            // Directly create the connection without asking for type
            handleConnectionTypeSelect('flow'); // Default to flow for internal connections
        } else {
            showConnectionDropdown = true;
        }
    }
    
    function handleConnectionTypeSelect(connectionType: 'binding' | 'flow') {
        if (!pendingConnection) return;
        
        const nodes = get(currentNodes);
        const sourceNode = nodes.find(n => n.id === pendingConnection?.source);
        const targetNode = nodes.find(n => n.id === pendingConnection?.target);
        
        const sourcePort = findPort(sourceNode, pendingConnection?.sourceHandle);
        const targetPort = findPort(targetNode, pendingConnection?.targetHandle);
        
        // console.log('Source port:', sourcePort, 'Target port:', targetPort);
        
        let edgeData: any = { 
            compatibility: 'direct',
            connectionType: connectionType // Store the connection type
        };
        
        if (sourcePort && targetPort) {
            const compatibility = checkCompatibility(sourcePort, targetPort);
            // console.log('Compatibility check:', compatibility);
            
            edgeData = {
                ...edgeData,
                compatibility: compatibility.status,
                adapterRequired: compatibility.adapterType,
                message: compatibility.message
            };
        }
        
        // Check if an edge already exists between these nodes with these handles
        const existingEdges = get(currentEdges);
        const duplicateEdgeIndex = existingEdges.findIndex(edge => 
            edge.source === pendingConnection?.source &&
            edge.target === pendingConnection.target &&
            edge.sourceHandle === pendingConnection.sourceHandle &&
            edge.targetHandle === pendingConnection.targetHandle
        );

        // The canvas edge created below (if any) — mirrored into the model for
        // a model-backed drill-down connection.
        let createdCanvasEdge: Edge | undefined;
        
        if (duplicateEdgeIndex !== -1) {
            // console.log('Updating existing edge with compatibility data');
            // Update the existing edge with compatibility data
            currentEdges.update(edges => {
                const updatedEdges = [...edges];
                updatedEdges[duplicateEdgeIndex] = {
                    ...updatedEdges[duplicateEdgeIndex],
                    data: edgeData
                };
                return updatedEdges;
            });
        } else {
            // Create new edge with compatibility metadata
            const newEdge: Edge = {
                id: `${pendingConnection.source}-${pendingConnection.target}-${Date.now()}`,
                source: pendingConnection.source!,
                target: pendingConnection.target!,
                sourceHandle: pendingConnection.sourceHandle,
                targetHandle: pendingConnection.targetHandle,
                type: 'default',
                data: edgeData
            };
            createdCanvasEdge = newEdge;
            
            currentEdges.update(edges => [...edges, newEdge]);
        }
        
        addToHistory();

        // Mirror the connection into the semantic session. At the root the whole
        // canvas is re-seeded (handles the duplicate-update branch too); inside
        // a model-backed drill-down the freshly created canvas edge is mirrored
        // to a relationship owned by the view's scope usage.
        const view = get(currentNodeView);
        if (view?.semantic?.scopeId) {
            if (createdCanvasEdge) {
                mirrorConnectToScope(view.semantic.scopeId, createdCanvasEdge, get(currentNodes));
            }
        } else if (!view) {
            seedRootCanvasToModel(get(currentNodes), get(currentEdges));
        }

        showConnectionDropdown = false;
        pendingConnection = null;
    }

    function handleConnectionCancel() {
        showConnectionDropdown = false;
        pendingConnection = null;
    } 

    function nodeColor(node: Node) {
        return node.type === 'package' ? 'transparent' : 'x';
    }
    function nodeStrokeColor(node: Node) {
        return node.type === 'package' ? 'gray' : '';
    }

    // The sidebar sync below only needs to run when the node/edge id set
    // changes (elements added/removed). Derived from the stores so drags,
    // moves, renames, and selections — which change positions/names but not
    // ids — never re-trigger the per-package scan; they cost only this cheap
    // string join per store emit.
    let packageMembershipSignature = $derived(
        $currentNodes.map(n => n.id).join('|') + '~' + $currentEdges.map(e => e.id).join('|')
    );
    let lastSyncedSignature = '';

    // Keep sidebar entries for bound packages in sync with the canvas:
    // whenever the membership of a bound package changes (an element inside
    // is deleted, undo/redo alters the contents, etc.) the saved entry's
    // snapshot is refreshed so the sidebar shows the current contents —
    // mirroring how renames sync the entry name.
    $effect(() => {
        // Reactive dependency: re-runs only when the id set actually changed.
        const signature = packageMembershipSignature;
        untrack(() => {
            if (signature === lastSyncedSignature) return;
            lastSyncedSignature = signature;

            const nodes = get(currentNodes);
            const edges = get(currentEdges);
            for (const pkg of nodes) {
            if (pkg.type !== 'package' || pkg.data?.bound !== true) continue;
            const pkgW = pkg.width;
            const pkgH = pkg.height;
            if (pkgW == null || pkgH == null) continue;
            const pkgX = pkg.position.x;
            const pkgY = pkg.position.y;

            const inNodes = nodes.filter(n =>
                n.id !== pkg.id &&
                n.position.x > pkgX &&
                n.position.y > pkgY &&
                n.position.x + (n.width ?? 0) < pkgX + pkgW &&
                n.position.y + (n.height ?? 0) < pkgY + pkgH
            );
            const inIds = new Set(inNodes.map(n => n.id));
            const inEdges = edges.filter(e => inIds.has(e.source) && inIds.has(e.target));

            // Only rewrite the entry when its contents actually changed
            // (fingerprint by node/edge ids), so unrelated node moves and
            // the effect's own writes stay quiet.
            const entry = packageEntryForCanvasNode(pkg.id);
            const prevFp = [
                ...(entry?.data?.nodes ?? []).map(n => n.id).sort(),
                ...(entry?.data?.edges ?? []).map(e => e.id).sort()
            ].join('|');
            const nextFp = [
                ...inNodes.map(n => n.id).sort(),
                ...inEdges.map(e => e.id).sort()
            ].join('|');

            if (prevFp !== nextFp) {
                upsertPackageEntryForCanvasNode(pkg.id, {
                    name: String(pkg.data?.declaredName ?? 'Unnamed'),
                    type: 'package',
                    description: (pkg.data?.comment as string | undefined) ?? '',
                    data: { nodes: inNodes, edges: inEdges }
                });
            }
            }
        });
    });

    // Lock nodes inside bound packages: set draggable=false so individual
    // nodes cannot be dragged independently. Only the package itself can be
    // moved, which carries its contents along. Reads $currentNodes (reactive)
    // so the lock applies the moment a package becomes bound and follows
    // package moves/resizes.
    $effect(() => {
        const nodes = $currentNodes;
        let changed = false;
        const updated = nodes.map(node => {
            if (node.type === 'package') return node;
            const parentPkg = nodes.find(
                n => n.type === 'package' &&
                     n.data?.bound === true &&
                     n.width != null && n.height != null &&
                     node.position.x >= n.position.x &&
                     node.position.y >= n.position.y &&
                     node.position.x + (node.width ?? 0) <= n.position.x + n.width &&
                     node.position.y + (node.height ?? 0) <= n.position.y + n.height
            );
            const shouldBeDraggable = !parentPkg;
            if (node.draggable !== shouldBeDraggable) {
                changed = true;
                return { ...node, draggable: shouldBeDraggable };
            }
            return node;
        });
        if (changed) currentNodes.set(updated);
    });

    // When a bound package is dragged, its inner nodes must follow it so they
    // stay inside the package bounds (and keep their lock). Track the drag
    // start geometry and apply the same delta to every node inside the
    // package's rectangle.
    let boundPackageDrag: {
        packageId: string;
        startX: number;
        startY: number;
        inner: { id: string; x: number; y: number }[];
    } | null = $state(null);

    function nodesInside(node: Node, candidates: Node[]) {
        const nw = node.width;
        const nh = node.height;
        if (nw == null || nh == null) return [];
        return candidates.filter(c =>
            c.id !== node.id &&
            c.position.x >= node.position.x &&
            c.position.y >= node.position.y &&
            c.position.x + (c.width ?? 0) <= node.position.x + nw &&
            c.position.y + (c.height ?? 0) <= node.position.y + nh
        );
    }

    function handleNodeDragStart(event: CustomEvent<{ targetNode: Node | null; nodes: Node[] }>) {
        const target = event.detail.targetNode;
        if (!target || target.type !== 'package' || target.data?.bound !== true) return;
        const all = get(currentNodes);
        const pkg = all.find(n => n.id === target.id);
        if (!pkg) return;
        const inner = nodesInside(pkg, all);
        if (inner.length === 0) return;
        boundPackageDrag = {
            packageId: pkg.id,
            startX: pkg.position.x,
            startY: pkg.position.y,
            inner: inner.map(n => ({ id: n.id, x: n.position.x, y: n.position.y }))
        };
    }

    function handleNodeDrag(event: CustomEvent<{ targetNode: Node | null; nodes: Node[] }>) {
        const drag = boundPackageDrag;
        if (!drag) return;
        const target = event.detail.targetNode;
        if (!target || target.id !== drag.packageId) return;
        const dx = target.position.x - drag.startX;
        const dy = target.position.y - drag.startY;
        if (dx === 0 && dy === 0) return;
        currentNodes.update(nodes =>
            nodes.map(n => {
                const innerNode = drag.inner.find(i => i.id === n.id);
                if (!innerNode) return n;
                return { ...n, position: { x: innerNode.x + dx, y: innerNode.y + dy } };
            })
        );
    }

    function handleNodeDragStop() {
        boundPackageDrag = null;
    }

    // No need for effect anymore - nodes handle their own visibility
</script>



  <div id="conceptual-editor" class="viewpoint-{$activeViewpoint}" ondragover={handleDragOver} ondrop={handleDrop} role="application" aria-label="Conceptual stage editor">
      <div class="flow-container" bind:this={flowContainer}>
          <SvelteFlow
              nodes={currentNodes}
              edges={currentEdges}
              {nodeTypes}
              {edgeTypes}
              defaultEdgeOptions={{
                  type: 'default',
              }}
              onconnect={onConnect}
              on:nodedragstart={handleNodeDragStart}
              on:nodedrag={handleNodeDrag}
              on:nodedragstop={handleNodeDragStop}
              fitView
              minZoom={0.1}
          >
              <!-- The blueprint grid lives in xyflow's <Background> so it pans/zooms
                   with the viewport; the container keeps the static tint + glow. The
                   Lines variant uses dimensions = [gap, gap], which tiles into a
                   continuous grid (Cross would draw only tiny 1px crosses). -->
              <Background variant={BackgroundVariant.Lines} gap={100} lineWidth={2} patternColor="rgba(30, 64, 175, 0.035)" bgColor="transparent" />
              <Controls position="top-right"/>
              <MiniMap {nodeColor} {nodeStrokeColor} nodeStrokeWidth={5}/>
              <ViewportFitter signal={$currentNodeView?.nodeId ?? null} />
          </SvelteFlow>
      </div>
  </div>
  
  {#if showConnectionDropdown}
      <ConnectionTypeDropdown 
          x={dropdownX}
          y={dropdownY}
          onSelect={handleConnectionTypeSelect}
          onCancel={handleConnectionCancel}
      />
  {/if}
  <style>
      #conceptual-editor {
          display: flex;
          flex-direction: column;
          height: 100%;
          width: 100%;
          /* Blueprint look: light blue tint + a soft white glow from the top. The
             gridlines themselves are drawn by the <Background> component so they
             pan/zoom with the viewport. Kept as background-color + translucent
             image so the viewpoint overrides below (which recolor background-color)
             still show through. */
          background-color: #f2f6fd;
          background-image:
              radial-gradient(120% 85% at 50% 0%, rgba(255, 255, 255, 0.75) 0%, rgba(255, 255, 255, 0) 55%);
          background-size: 100% 100%;
      }

      /* Keep the flow itself transparent so the blueprint theme shows through, and
         make it a stacking context (isolation: isolate) so xyflow's pattern layer
         (z-index: -1) paints above the container instead of behind it. */
      #conceptual-editor :global(.svelte-flow) {
          background-color: transparent;
          isolation: isolate;
      }

      .flow-container {
          flex: 1;
          width: 100%;
          height: 100%;
      }

      /* Simple viewpoint indicator - just changes background color for now */
      .viewpoint-electrical {
          background-color: #fef3c7 !important; /* Light yellow */
      }

      .viewpoint-mechanical {
          background-color: #e0e7ff !important; /* Light blue */
      }

      .viewpoint-fluid {
          background-color: #dbeafe !important; /* Light blue */
      }

      .viewpoint-data {
          background-color: #d1fae5 !important; /* Light green */
      }

  </style>