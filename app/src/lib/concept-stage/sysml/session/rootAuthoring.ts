import type { Edge, Node } from '@xyflow/svelte';
import { namesInNamespace } from '../model';
import type {
  AnySysmlElement,
  ElementId,
  ItemUsageElement,
  PartUsageElement,
  SysmlDocument
} from '../model';
import type { MetaclassKey } from '../model/metaclassRegistry';
import { cascadeDelete, connectInView, nextModelId } from '../projection';
import { getSemanticSession, type ConceptStageSemanticSession } from './conceptStageSemanticSession';

/**
 * Canvas-authoring bridge (Phase 3, complete write path).
 *
 * The concept canvas is legacy-authored (`currentNodes`/`currentEdges`); this
 * module mirrors each structural action into the bound semantic session so
 * that model elements exist for every user flow the plan lists: add node
 * (library drop, duplicate), connect, rename, delete edge/node, and port
 * editing — at the root level and inside model-backed drill-down views.
 *
 * All functions are no-ops when no session is bound, so unmapped systems keep
 * today's behavior exactly. The canvas remains the immediate render source;
 * the model is authoritative for re-entry, drill-down projection, and future
 * interchange.
 */

interface LegacyPortRecord {
    id?: string;
    name?: string;
    interfaceType?: string;
    description?: string;
}

type PortDirection = 'in' | 'out';

const isPartOrItem = (element: AnySysmlElement | undefined): element is PartUsageElement | ItemUsageElement =>
    element !== undefined && (element.metaclass === 'partUsage' || element.metaclass === 'itemUsage');

/* ── Public entry points ─────────────────────────────────────────────────── */

/** Mirror dropped/duplicated content at the root level (owner = model root). */
export function seedRootCanvasToModel(nodes: Node[], edges: Edge[]): void {
    seedNodesIntoScope(null, nodes, edges);
}

/** Mirror content dropped into a model-backed drill-down (owner = the scope usage). */
export function seedNodesIntoScope(scopeId: ElementId | null, nodes: Node[], edges: Edge[]): void {
    const session = getSemanticSession();
    if (!session) return;
    for (const node of nodes) {
        if (node.type !== 'part' && node.type !== 'item') continue;
        seedUsageNode(session, node, scopeId);
    }
    for (const edge of edges) {
        seedRelationshipEdge(session, edge, nodes, scopeId);
    }
}

/**
 * Stable endpoint-resolution table (plan §3): map a canvas (node, handle) to a
 * semantic PortUsage id. Boundary artifacts (`internal-port-…`) resolve to the
 * port usage they render; usage nodes resolve through their handle id.
 */
export function resolveSemanticEndpoint(
    node: Pick<Node, 'id' | 'type' | 'data'>,
    handle: string | null | undefined
): ElementId | undefined {
    const session = getSemanticSession();
    if (!session) return undefined;
    if (node.type === 'internalPort') {
        const modelId = (node.data as { modelId?: string }).modelId;
        return modelId || undefined;
    }
    const usageId = usageIdForCanvasNode(node.id, session);
    if (!usageId || !handle) return undefined;
    const prefix = `${node.id}-`;
    if (!handle.startsWith(prefix)) return undefined;
    const match = /^(input|output)-(.+)$/.exec(handle.slice(prefix.length));
    if (!match) return undefined;
    return findPortByName(session, usageId, match[2]);
}

/** Rename the mapped model element for a legacy (or `n_`) canvas node id. */
export function renameModelElementForLegacyNode(nodeId: string, name: string): void {
    const session = getSemanticSession();
    if (!session) return;
    const modelId = usageIdForCanvasNode(nodeId, session);
    if (!modelId) return;
    session.repository.update(modelId, { name });
}

/** Cascade-delete the model content behind a deleted canvas node. */
export function deleteModelContentForLegacyNode(nodeId: string): void {
    const session = getSemanticSession();
    if (!session) return;
    const modelId = usageIdForCanvasNode(nodeId, session);
    if (!modelId) return;
    const result = cascadeDelete(session.repository, modelId);
    if (!result.ok) return; // e.g. definition still referenced elsewhere
    session.legacyToModel.delete(nodeId);
}

/** Delete the model relationship behind a deleted canvas edge. */
export function deleteModelRelationshipForLegacyEdge(edgeId: string): void {
    const session = getSemanticSession();
    if (!session) return;
    let modelId = session.legacyEdgeToModel.get(edgeId);
    if (!modelId && edgeId.startsWith('e_')) modelId = edgeId.slice(2);
    if (!modelId) return;
    const result = session.repository.delete(modelId);
    if (!result.ok) return;
    session.legacyEdgeToModel.delete(edgeId);
}

/**
 * Create the relationship for a canvas connection made inside a model-backed
 * view. Resolves both endpoints semantically (boundary artifact or child port
 * handle) and records the canvas edge id so later deletion mirrors.
 */
export function mirrorConnectToScope(scopeId: ElementId, edge: Edge, nodes: Node[]): void {
    const session = getSemanticSession();
    if (!session) return;
    if (session.legacyEdgeToModel.has(edge.id)) return;

    const sourceNode = nodes.find((node) => node.id === edge.source);
    const targetNode = nodes.find((node) => node.id === edge.target);
    const sourcePort = sourceNode ? resolveSemanticEndpoint(sourceNode, edge.sourceHandle) : undefined;
    const targetPort = targetNode ? resolveSemanticEndpoint(targetNode, edge.targetHandle) : undefined;
    if (!sourcePort || !targetPort) return;

    const type: 'flow' | 'binding' = (edge.data as { connectionType?: string }).connectionType === 'binding' ? 'binding' : 'flow';
    const metaclass: MetaclassKey = type === 'flow' ? 'flowUsage' : 'bindingConnectorAsUsage';
    if (findRelationship(session, metaclass, sourcePort, targetPort, scopeId)) return; // no duplicate connections

    const document = session.repository.read();
    const sourceName = document.elements[sourcePort]?.name ?? 'source';
    const targetName = document.elements[targetPort]?.name ?? 'target';
    const used = new Set(namesInNamespace(document, scopeId));
    const base = `${sourceName}_to_${targetName}`;
    const name = used.has(base) ? `${base}_${used.size + 1}` : base;

    const result = connectInView(session.repository, { scopeId, type, sourcePortId: sourcePort, targetPortId: targetPort, name });
    if (!result.ok || !result.value) return;
    session.legacyEdgeToModel.set(edge.id, result.value.id);
    session.modelToLegacyEdge.set(result.value.id, edge.id);
}

/** Add a port usage under the usage behind a canvas node (add-port intent). */
export function addModelPort(
    nodeRefId: string,
    port: { name: string; direction: PortDirection; interfaceType?: string }
): ElementId | undefined {
    const session = getSemanticSession();
    if (!session) return undefined;
    const usageId = usageIdForCanvasNode(nodeRefId, session);
    if (!usageId) return undefined;
    if (findPortByName(session, usageId, port.name)) return undefined; // idempotent
    const created = session.repository.create({
        id: nextModelId(session.repository, 'portUsage'),
        metaclass: 'portUsage',
        category: 'usage',
        name: port.name,
        ownerId: usageId,
        definitionId: null,
        direction: port.direction
    } as AnySysmlElement);
    if (!created.ok || !created.value) return undefined;
    if (port.interfaceType) {
        setPortPresentation(session, created.value.id, { interfaceType: port.interfaceType });
    }
    return created.value.id;
}

/** Remove a port usage (and relationships referencing it) behind a canvas node. */
export function removeModelPort(nodeRefId: string, portName: string): void {
    const session = getSemanticSession();
    if (!session) return;
    const usageId = usageIdForCanvasNode(nodeRefId, session);
    if (!usageId) return;
    const portId = findPortByName(session, usageId, portName);
    if (!portId) return;

    const document = session.repository.read();
    const referencing = Object.values(document.elements)
        .filter((element) => {
            if (element.metaclass === 'flowUsage') return [element.sourceEnd, element.targetEnd].includes(portId as ElementId);
            if (element.metaclass === 'connectionUsage' || element.metaclass === 'bindingConnectorAsUsage') {
                return [element.endA, element.endB].includes(portId as ElementId);
            }
            return false;
        })
        .map((element) => element.id);
    const transaction = session.repository.transaction((tx) => {
        for (const id of referencing) tx.delete(id);
        tx.delete(portId);
    });
    if (!transaction.ok) return;
}

/** Rename a port usage behind a canvas node (port-rename intent). */
export function renameModelPort(nodeRefId: string, oldName: string, newName: string): void {
    const session = getSemanticSession();
    if (!session) return;
    const usageId = usageIdForCanvasNode(nodeRefId, session);
    if (!usageId) return;
    const portId = findPortByName(session, usageId, oldName);
    if (portId) session.repository.update(portId, { name: newName });
}

/** Update the display-only interface label of a port usage. */
export function setModelPortInterface(nodeRefId: string, portName: string, interfaceType: string | undefined): void {
    const session = getSemanticSession();
    if (!session) return;
    const usageId = usageIdForCanvasNode(nodeRefId, session);
    if (!usageId) return;
    const portId = findPortByName(session, usageId, portName);
    if (!portId) return;
    if (interfaceType === undefined) return;
    setPortPresentation(session, portId, { interfaceType });
}

/* ── Shared internals ────────────────────────────────────────────────────── */

function usageIdForCanvasNode(nodeId: string, session: ConceptStageSemanticSession): ElementId | undefined {
    const mapped = session.legacyToModel.get(nodeId);
    if (mapped) return mapped;
    if (nodeId.startsWith('n_')) return nodeId.slice(2);
    return undefined;
}

function seedUsageNode(session: ConceptStageSemanticSession, node: Node, ownerScopeId: ElementId | null): void {
    const existingModelId = session.legacyToModel.get(node.id);
    if (existingModelId && session.repository.getElement(existingModelId)) {
        seedPorts(session, existingModelId, node);
        return;
    }

    const data = (node.data ?? {}) as {
        declaredName?: string;
        definition?: string;
        definitionId?: string;
        inputs?: LegacyPortRecord[];
        outputs?: LegacyPortRecord[];
    };
    const name = data.declaredName || String(node.id);
    const usageMetaclass: 'partUsage' | 'itemUsage' = node.type === 'item' ? 'itemUsage' : 'partUsage';
    const definitionMetaclass: 'partDefinition' | 'itemDefinition' = node.type === 'item' ? 'itemDefinition' : 'partDefinition';
    const definitionName = data.definition;

    let definitionId: ElementId | null = null;
    if (definitionName) {
        definitionId = ensureDefinition(session, definitionMetaclass, definitionName) ?? null;
        if (definitionId === null) return; // name conflict in the model: keep node unmapped
    } else {
        // Duplicates of model-backed nodes carry the original usage's
        // `definitionId` — reuse the referenced definition when it exists so the
        // copy stays typed instead of degrading to an untyped usage.
        const referenced = typeof data.definitionId === 'string'
            ? session.repository.getElement(data.definitionId)
            : undefined;
        if (referenced && referenced.metaclass === definitionMetaclass) definitionId = referenced.id;
    }

    const created = session.repository.create(usageElement(session, usageMetaclass, name, definitionId, ownerScopeId));
    if (!created.ok || !created.value) return;
    const usageId = created.value.id;
    session.legacyToModel.set(node.id, usageId);
    session.modelToLegacy.set(usageId, node.id);

    // Record drop coordinates so the model-backed view restores the layout.
    if (node.position) {
        session.presentation = {
            ...session.presentation,
            [usageId]: {
                ...session.presentation[usageId],
                position: { ...node.position },
                ...(node.width === undefined ? {} : { width: node.width }),
                ...(node.height === undefined ? {} : { height: node.height })
            }
        };
    }
    seedPorts(session, usageId, node);
}

function seedPorts(session: ConceptStageSemanticSession, usageId: ElementId, node: Node): void {
    const data = (node.data ?? {}) as { inputs?: LegacyPortRecord[]; outputs?: LegacyPortRecord[] };
    seedPortSide(session, usageId, data.inputs ?? [], 'in');
    seedPortSide(session, usageId, data.outputs ?? [], 'out');
}

function seedPortSide(
    session: ConceptStageSemanticSession,
    usageId: ElementId,
    records: LegacyPortRecord[],
    direction: PortDirection
): void {
    for (const record of records) {
        const name = record.name || 'port';
        if (findPortByName(session, usageId, name)) continue; // idempotent
        const created = session.repository.create({
            id: nextModelId(session.repository, 'portUsage'),
            metaclass: 'portUsage',
            category: 'usage',
            name,
            ownerId: usageId,
            definitionId: null,
            direction
        } as AnySysmlElement);
        if (!created.ok || !created.value) continue;
        if (record.interfaceType) {
            setPortPresentation(session, created.value.id, { interfaceType: record.interfaceType });
        }
    }
}

function setPortPresentation(
    session: ConceptStageSemanticSession,
    portId: ElementId,
    entry: { interfaceType: string }
): void {
    session.presentation = {
        ...session.presentation,
        [portId]: { ...session.presentation[portId], interfaceType: entry.interfaceType }
    };
}

/**
 * Synthesized definitions live in their own root-owned package so the
 * definition vocabulary never collides with usage names (WF001).
 */
function ensureDefinition(
    session: ConceptStageSemanticSession,
    metaclass: 'partDefinition' | 'itemDefinition',
    name: string
): ElementId | undefined {
    const definitionsPackageId = ensureDefinitionsPackage(session);
    if (!definitionsPackageId) return undefined;
    const document = session.repository.read();
    const existing = Object.values(document.elements).find(
        (element) =>
            element.metaclass === metaclass && element.name === name && element.ownerId === definitionsPackageId
    );
    if (existing) return existing.id;

    const id = nextModelId(session.repository, metaclass);
    const created = session.repository.create({
        id,
        metaclass,
        category: 'definition',
        name,
        ownerId: definitionsPackageId,
        ownedUsageIds: [],
        attributeIds: []
    } as AnySysmlElement);
    return created.ok && created.value ? created.value.id : undefined;
}

function ensureDefinitionsPackage(session: ConceptStageSemanticSession): ElementId | undefined {
    const document = session.repository.read();
    const existing = Object.values(document.elements).find(
        (element) => element.metaclass === 'package' && element.name === 'Definitions' && element.ownerId === null
    );
    if (existing) return existing.id;

    const id = nextModelId(session.repository, 'package');
    const created = session.repository.create({
        id,
        metaclass: 'package',
        name: 'Definitions',
        ownerId: null,
        memberIds: []
    } as AnySysmlElement);
    return created.ok && created.value ? created.value.id : undefined;
}

function seedRelationshipEdge(
    session: ConceptStageSemanticSession,
    edge: Edge,
    nodes: Node[],
    ownerScopeId: ElementId | null
): void {
    const mapped = session.legacyEdgeToModel.get(edge.id);
    if (mapped && session.repository.getElement(mapped)) return; // already mirrored

    const connectionType: string = (edge.data as { connectionType?: string } | undefined)?.connectionType ?? 'flow';
    const relationshipMetaclass: MetaclassKey =
        connectionType === 'binding' ? 'bindingConnectorAsUsage' : connectionType === 'connection' ? 'connectionUsage' : 'flowUsage';

    const sourceNode = nodes.find((node) => node.id === edge.source);
    const targetNode = nodes.find((node) => node.id === edge.target);
    const sourcePort = sourceNode
        ? resolveCanvasSidePort(session, sourceNode, edge.sourceHandle, 'output')
        : undefined;
    const targetPort = targetNode
        ? resolveCanvasSidePort(session, targetNode, edge.targetHandle, 'input')
        : undefined;
    if (!sourcePort || !targetPort) return;

    if (findRelationship(session, relationshipMetaclass, sourcePort, targetPort, ownerScopeId)) return;

    const name = nextRelationshipName(session, sourcePort, targetPort, ownerScopeId);
    const element: AnySysmlElement = relationshipMetaclass === 'flowUsage'
        ? {
            id: nextModelId(session.repository, 'flowUsage'),
            metaclass: 'flowUsage',
            category: 'relationship',
            name,
            ownerId: ownerScopeId,
            sourceEnd: sourcePort,
            targetEnd: targetPort,
            flowDefinitionId: null
        }
        : relationshipMetaclass === 'connectionUsage'
            ? {
                id: nextModelId(session.repository, 'connectionUsage'),
                metaclass: 'connectionUsage',
                category: 'relationship',
                name,
                ownerId: ownerScopeId,
                endA: sourcePort,
                endB: targetPort,
                connectionDefinitionId: null
            }
            : {
                id: nextModelId(session.repository, 'bindingConnectorAsUsage'),
                metaclass: 'bindingConnectorAsUsage',
                category: 'relationship',
                name,
                ownerId: ownerScopeId,
                endA: sourcePort,
                endB: targetPort
            };

    const created = session.repository.create(element);
    if (!created.ok || !created.value) return;
    session.legacyEdgeToModel.set(edge.id, created.value.id);
    session.modelToLegacyEdge.set(created.value.id, edge.id);
}

/**
 * Resolve a legacy handle on a usage node to a port, checking the expected
 * side. Boundary artifacts (`internal-port-…`) carry the port usage id on the
 * node itself and are resolved by `resolveSemanticEndpoint`/this function's
 * artifact branch for scoped connects.
 */
function resolveCanvasSidePort(
    session: ConceptStageSemanticSession,
    node: Node,
    handle: string | null | undefined,
    side: 'input' | 'output'
): ElementId | undefined {
    if (node.type === 'internalPort') {
        const portId = resolveSemanticEndpoint(node, handle);
        return portId;
    }
    if (!handle) return undefined;
    const usageId = usageIdForCanvasNode(node.id, session);
    if (!usageId) return undefined;
    const prefix = `${node.id}-`;
    if (!handle.startsWith(prefix)) return undefined;
    const remainder = handle.slice(prefix.length);
    const match = /^(input|output)-(.+)$/.exec(remainder);
    if (!match || match[1] !== side) return undefined;
    return findPortByName(session, usageId, match[2]);
}

function findPortByName(session: ConceptStageSemanticSession, usageId: ElementId, name: string): ElementId | undefined {
    const usage = session.repository.getElement(usageId);
    if (!isPartOrItem(usage)) return undefined;
    for (const ownedId of usage.ownedUsageIds) {
        const owned = session.repository.getElement(ownedId);
        if (owned?.metaclass === 'portUsage' && owned.name === name) return owned.id;
    }
    return undefined;
}

function findRelationship(
    session: ConceptStageSemanticSession,
    metaclass: MetaclassKey,
    sourcePort: ElementId,
    targetPort: ElementId,
    ownerScopeId: ElementId | null
): boolean {
    const document = session.repository.read();
    for (const element of Object.values(document.elements)) {
        if (element.ownerId !== ownerScopeId) continue;
        if (metaclass === 'flowUsage' && element.metaclass === 'flowUsage' && element.sourceEnd === sourcePort && element.targetEnd === targetPort) return true;
        if (metaclass === 'bindingConnectorAsUsage' && element.metaclass === 'bindingConnectorAsUsage' && element.endA === sourcePort && element.endB === targetPort) return true;
        if (metaclass === 'connectionUsage' && element.metaclass === 'connectionUsage' && element.endA === sourcePort && element.endB === targetPort) return true;
    }
    return false;
}

function nextRelationshipName(
    session: ConceptStageSemanticSession,
    sourcePort: ElementId,
    targetPort: ElementId,
    ownerScopeId: ElementId | null
): string {
    const document: SysmlDocument = session.repository.read();
    const sourceName = document.elements[sourcePort]?.name ?? 'source';
    const targetName = document.elements[targetPort]?.name ?? 'target';
    const used = new Set(namesInNamespace(document, ownerScopeId));
    const base = `${sourceName}_to_${targetName}`;
    if (!used.has(base)) return base;
    let index = 2;
    while (used.has(`${base}_${index}`)) index += 1;
    return `${base}_${index}`;
}

function usageElement(
    session: ConceptStageSemanticSession,
    metaclass: 'partUsage' | 'itemUsage',
    name: string,
    definitionId: ElementId | null,
    ownerScopeId: ElementId | null
): AnySysmlElement {
    const id = nextModelId(session.repository, metaclass);
    return metaclass === 'partUsage'
        ? {
            id,
            metaclass: 'partUsage',
            category: 'usage',
            name,
            ownerId: ownerScopeId,
            definitionId,
            ownedUsageIds: [],
            attributeIds: []
        }
        : {
            id,
            metaclass: 'itemUsage',
            category: 'usage',
            name,
            ownerId: ownerScopeId,
            definitionId,
            ownedUsageIds: []
        };
}
