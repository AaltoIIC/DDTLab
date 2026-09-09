import type { Node, Edge } from '@xyflow/svelte';
import type { ComponentTemplate } from '../types/componentLibrary';
import type { ItemUsageElement, PartUsageElement, SysmlDocument } from '../sysml/model';
import { projectModelToCanvas, type ProjectedPort } from '../sysml/projection';
import { getPresentation, type PresentationMap } from '../sysml/presentation';

// Deep clone with new IDs
function generateUniqueId(prefix: string): string {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
}

/**
 * Legacy canvas data shape a dropped library node must carry (declaredName,
 * definition name, comment, mass, metadata, ports) so the existing node
 * components, the name-uniquification pass and the semantic seeding path
 * behave exactly as before.
 */
export interface TemplateNodeData {
    declaredName: string;
    definition: string;
    comment: string;
    id: string;
    mass: number;
    metadata: Array<{ key: string; value: string }>;
    inputs: Array<{ id: string; name: string; interfaceType?: string }>;
    outputs: Array<{ id: string; name: string; interfaceType?: string }>;
}

function modelIdFromProjectedId(id: string): string {
    return id.startsWith('n_') || id.startsWith('e_') ? id.slice(2) : id;
}

/**
 * Phase 5: the library drag payload is a semantic `ComponentTemplate`
 * (document + presentation map). This projects it into the legacy canvas
 * `{ nodes, edges }` payload the rest of the drop path expects — the exact
 * data the raw library files used to carry, now emitted from the semantic
 * model. Package elements (the Definitions container) are filtered out: the
 * instantiation wraps the children in one package node, as before.
 */
export function projectSemanticTemplateToCanvas(template: ComponentTemplate): { nodes: Node[]; edges: Edge[] } {
    const { document, presentation } = template.data;
    const { nodes, edges } = projectModelToCanvas(document, presentation);

    const usageNodes = nodes.filter((node) => node.type === 'part' || node.type === 'item');
    const usageModelIds = new Set(
        usageNodes.map((node) => String((node.data as { modelId?: string }).modelId ?? ''))
    );

    const reshaped = usageNodes.map((node) => reshapeUsageNode(node, document, presentation));
    const keptEdges = edges.filter(
        (edge) =>
            usageModelIds.has(modelIdFromProjectedId(edge.source)) &&
            usageModelIds.has(modelIdFromProjectedId(edge.target))
    );
    return { nodes: reshaped, edges: keptEdges };
}

/** Rebuild the legacy node data fields from the semantic element + presentation. */
function reshapeUsageNode(
    node: Node,
    document: SysmlDocument,
    presentation: PresentationMap
): Node {
    const projectedData = node.data as { modelId?: string; inputs?: ProjectedPort[]; outputs?: ProjectedPort[] };
    const modelId = String(projectedData.modelId ?? '');
    const element = document.elements[modelId] as PartUsageElement | ItemUsageElement | undefined;
    if (!element) return node;

    const definition = element.definitionId ? document.elements[element.definitionId] : undefined;
    // Mass is a literal attribute usage (decision 4); the metadata key/value
    // pairs are tool metadata carried in the presentation map (plan §3) and
    // are read back from there.
    const attributes = (element.ownedUsageIds ?? [])
        .map((id) => document.elements[id])
        .filter((candidate) => candidate?.metaclass === 'attributeUsage');
    const mass = attributes.find((attribute) => attribute.name === 'mass')?.literal;
    const presentationEntry = getPresentation(presentation, modelId);
    const metadata = presentationEntry.metadata ?? [];

    const toLegacyPort = (port: ProjectedPort) => {
        const entry = getPresentation(presentation, port.id);
        return {
            id: port.id,
            name: port.name,
            ...(entry.interfaceType === undefined ? {} : { interfaceType: entry.interfaceType })
        };
    };

    return {
        ...node,
        data: {
            ...node.data,
            declaredName: element.name,
            definition: definition?.name ?? '',
            comment: element.documentation ?? '',
            id: modelId,
            mass: typeof mass === 'number' ? mass : 0,
            metadata,
            inputs: (projectedData.inputs ?? []).map(toLegacyPort),
            outputs: (projectedData.outputs ?? []).map(toLegacyPort)
        }
    };
}

export function instantiateSimpleComponent(
    component: ComponentTemplate,
    position: { x: number; y: number }
): { nodes: Node[]; edges: Edge[] } {
    // The template is semantic; project it to the legacy canvas payload first.
    const projected = projectSemanticTemplateToCanvas(component);
    const componentNodes = projected.nodes;
    const componentEdges = projected.edges;

    // Generate new ID for the package
    const packageId = generateUniqueId(component.id);

    // Calculate bounding box for all child nodes to size the package appropriately
    let minX = Infinity, minY = Infinity;
    let maxX = -Infinity, maxY = -Infinity;

    componentNodes.forEach((node: Node) => {
        minX = Math.min(minX, node.position.x);
        minY = Math.min(minY, node.position.y);
        // Assume a default node size if not specified — concept nodes with metadata can be much larger
        const nodeWidth = node.width ?? (node as { measured?: { width: number } }).measured?.width ?? 300;
        const nodeHeight = node.height ?? (node as { measured?: { height: number } }).measured?.height ?? 250;
        maxX = Math.max(maxX, node.position.x + nodeWidth);
        maxY = Math.max(maxY, node.position.y + nodeHeight);
    });

    // Set package size with generous padding for large tiles
    const padding = 120;
    let packageWidth = 800;
    let packageHeight = 600;

    if (minX !== Infinity) {
        packageWidth = maxX - minX + padding * 2;
        packageHeight = maxY - minY + padding * 2;
    }

    // Create the package node — the template's own data (declaredName,
    // comment, id, metadata) is carried over; the semantic document and
    // presentation map stay internal to the template and are not copied into
    // the canvas payload.
    const instantiatedPackage: Node = {
        id: packageId,
        type: component.type,
        position,
        width: packageWidth,
        height: packageHeight,
        style: `width: ${packageWidth}px; height: ${packageHeight}px;`,
        data: {
            declaredName: component.data.declaredName,
            ...(component.data.comment === undefined ? {} : { comment: component.data.comment }),
            id: component.data.id ? generateUniqueId(component.data.id) : generateUniqueId(packageId),
            insideData: {
                nodes: [],
                inEdges: [],
                boundaryEdges: []
            },
            nodes: [],
            edges: [],
            metadata: [...(component.data.metadata || [])],
            inputs: [],
            outputs: []
        }
    };

    // Prepare all nodes including package
    const allNodes: Node[] = [instantiatedPackage];
    const allEdges: Edge[] = [];

    // Process child nodes and create ID mapping for edges
    const idMapping = new Map<string, string>();

    // Offset for translating template-internal coordinates to absolute canvas positions
    const offsetX = minX !== Infinity ? minX - padding : 0;
    const offsetY = minY !== Infinity ? minY - padding : 0;

    componentNodes.forEach((node: Node) => {
        const newNodeId = generateUniqueId(node.id);
        idMapping.set(node.id, newNodeId);

        const data = node.data as Partial<TemplateNodeData>;

        // Children are independent nodes at absolute world positions (not parent-relative).
        // This avoids React Flow "parent node not found" warnings on delete.
        const childNode: Node = {
            id: newNodeId,
            type: node.type,
            position: {
                x: position.x + node.position.x - offsetX,
                y: position.y + node.position.y - offsetY
            },
            data: {
                ...node.data,
                id: generateUniqueId(data.id || node.id),
                mass: data.mass || 0,
                metadata: [...(data.metadata || [])],
                inputs: (data.inputs || []).map((port) => ({
                    ...port,
                    id: generateUniqueId(port.id)
                })),
                outputs: (data.outputs || []).map((port) => ({
                    ...port,
                    id: generateUniqueId(port.id)
                }))
            }
        };

        allNodes.push(childNode);
    });

    // Process edges with updated IDs
    componentEdges.forEach((edge: Edge) => {
        const newSourceId = idMapping.get(edge.source);
        const newTargetId = idMapping.get(edge.target);

        if (newSourceId && newTargetId) {
            // Update handle IDs with new node IDs
            let sourceHandle = edge.sourceHandle;
            let targetHandle = edge.targetHandle;

            // Replace old node IDs in handles with new ones
            if (sourceHandle) {
                for (const [oldId, newId] of idMapping.entries()) {
                    if (sourceHandle.includes(oldId)) {
                        sourceHandle = sourceHandle.replace(oldId, newId);
                        break;
                    }
                }
            }
            if (targetHandle) {
                for (const [oldId, newId] of idMapping.entries()) {
                    if (targetHandle.includes(oldId)) {
                        targetHandle = targetHandle.replace(oldId, newId);
                        break;
                    }
                }
            }

            const newEdge: Edge = {
                id: generateUniqueId(edge.id),
                source: newSourceId,
                target: newTargetId,
                sourceHandle,
                targetHandle,
                type: edge.type || 'default',
                data: { ...edge.data }
            };

            allEdges.push(newEdge);
        }
    });

    return {
        nodes: allNodes,
        edges: allEdges
    };
}