import {
    type NotificationType,
    type SystemMetaType,
    type SystemType,
    type RequirementType,
    type SubsystemDataType,
    type NodeDataType,
    type FMIComponentType,
    type ConceptTemplate,
    type PartDefinition,
    type ItemDefinition,
    type PackageTemplate,
    type ConnectorType,
    type AnalysisReportRecord,
    type TemplateSimulationResultRecord,
    type TemplateSimulationSeries,
    type TemplateSimulationSimpleVariable,
} from '../types/types';
import {    
    type Node,
    type Edge
} from '@xyflow/svelte';
import {
    duplicateName,
    generateId,
    generateName
} from '$lib/helpers';

import { writable, get, derived } from 'svelte/store';
import persistentStore from './persistentStore';
import {
    notification,
    isAddingRequirement,
    currentSystemMeta,
    currentNodes,
    currentEdges,
    currentReqs,
    customDataTypes,
    customVSSoVariables,
    currentPartDefinitions,
    currentItemDefinitions,
    currentPackages
} from '$lib/domains/editor-core/state/activeEditorSessionStore';
import {
    systems,
    createSystem,
    getSystem,
    saveSystem,
    removeSystem,
    cloneSystem
} from '$lib/domains/system/state/systemCatalogStore';
import {
    history,
    addToHistory,
    undoHistory,
    redoHistory,
    navigationContext,
    currentViewSystemId,
    navigateToSubsystem,
    navigateToParent,
    resetNavigation
} from '$lib/domains/editor-core/state/editorHistoryNavigationStore';
import _ from 'lodash';
import { saveCurrentSystem } from '$lib/domains/editor-core/services/activeEditorActions';import ConceptTemplateSlider from '$lib/concept-stage/ConceptTemplateSlider.svelte';
  import { navigationStack } from '$lib/concept-stage/nodeViewStore';


export type ConceptFmuBinding = {
    sourceNodeId: string;
    requestId: string;
    responseId: string;
    fmuId: string;
    fmuName: string | null;
    oemName: string | null;
    oemShortCode: string | null;
    partName?: string | null;
};

export {
    notification,
    isAddingRequirement,
    currentSystemMeta,
    currentNodes,
    currentEdges,
    currentReqs,
    customDataTypes,
    customVSSoVariables,
    currentPartDefinitions,
    currentItemDefinitions,
    currentPackages
};
export { systems };
export {
    createSystem,
    getSystem,
    saveSystem,
    removeSystem,
    cloneSystem,
    history,
    addToHistory,
    undoHistory,
    redoHistory,
    navigationContext,
    currentViewSystemId,
    navigateToSubsystem,
    navigateToParent,
    resetNavigation
};
export { saveCurrentSystem };

export const analysisReports = persistentStore<AnalysisReportRecord[]>('analysisReports', []);
export const templateSimulationResults = persistentStore<TemplateSimulationResultRecord[]>('templateSimulationResults', []);
export const templates = persistentStore<ConceptTemplate[]>('conceptTemplates', []);

export const setCurrentSystem = (id: string) => {
    const sysIndex = get(systems).findIndex(s => s.id === id);

    if (sysIndex !== -1) {
        const system = get(systems)[sysIndex];

        currentSystemMeta.set({
            id: id,
            name: system.name,
            date: system.date
        });
        currentNodes.set(system.nodes.map((node) => ({ ...node })));
        currentEdges.set(system.edges);
        currentReqs.set(system.requirements || []);
        currentPartDefinitions.set(system.partDefinitions);
        currentItemDefinitions.set(system.itemDefinitions);
        currentPackages.set(system.packages);
    }
}

export type ConvertToDesignOptions = {
    /** Re-convert into the existing design child, reusing its ID instead of creating a new one. */
    overwriteExisting?: boolean;
};

export const convertToDesign = (
    fmuBindingsBySourceNodeId: Record<string, ConceptFmuBinding> = {},
    options: ConvertToDesignOptions = {}
) => {

    // Get the root context
    const sourceConceptSystemId = get(currentSystemMeta).id;
    const sourceConceptSystemName = get(currentSystemMeta).name;
    const requestedAnalysisRequestIds = Array.from(new Set(
        Object.values(fmuBindingsBySourceNodeId)
            .map(binding => binding.requestId)
            .filter((requestId): requestId is string => Boolean(requestId))
    ));
    const stack = get(navigationStack);
    const rootLevel = stack.length > 0 ? stack[0] : null;
    const rootNodes = rootLevel ? rootLevel.nodes : get(currentNodes);
    const rootEdges = rootLevel ? rootLevel.edges : get(currentEdges);

    // Re-conversion: reuse the existing design child so its ID (and with it any analysis
    // reports / simulation results / FMU links) stays valid, and remove its old subsystems.
    const designChildren = options.overwriteExisting
        ? get(systems).filter(s => s.stage === 'design' && s.sourceConceptSystemId === sourceConceptSystemId)
        : [];
    const existingDesignChild = designChildren[0] ?? undefined;

    const newRootId = existingDesignChild?.id ?? generateId(get(systems).map(s => s.id));
    const newRootName = existingDesignChild?.name ?? generateName(`${get(currentSystemMeta).name} (Design Stage)`, get(systems).map(s => s.name));

    if (existingDesignChild) {
        // Older duplicate design children are hidden from the dashboard (and therefore
        // unreachable), so drop any extras when overwriting.
        for (const duplicate of designChildren.slice(1)) {
            removeSystem(duplicate.id);
        }
        for (const subsystemId of collectSubsystemIds(existingDesignChild)) {
            removeSystem(subsystemId);
        }
    }

    // Keep previously recorded analysis request ids when re-converting without OEM bindings.
    const sourceAnalysisRequestIds = requestedAnalysisRequestIds.length
        ? requestedAnalysisRequestIds
        : (existingDesignChild?.sourceAnalysisRequestIds ?? []);

    // Deep recursive conversion
    const converted = recursiveSystemBuilder(rootNodes, rootEdges, newRootId, fmuBindingsBySourceNodeId);

    // Create the persisted design-stage system container.
    const designRootSystem: SystemType = {
        id: newRootId,
        name: newRootName,
        date: new Date().toISOString(), 
        nodes: converted.nodes,
        edges: converted.edges,
        requirements: [],
        partDefinitions: [],
        itemDefinitions: [],
        packages: [],
        sourceConceptSystemId,
        sourceConceptSystemName,
        sourceAnalysisRequestIds,
        stage: 'design'
    }

    saveSystem(designRootSystem);
    componentLinks.update(links => {
        // componentLinks is global across all systems — only prune on overwrite, where
        // links to the old (removed) subsystems of this design tree would otherwise linger.
        if (!existingDesignChild) {
            return { ...links, ...converted.componentLinks };
        }
        const validNodeIds = collectTreeNodeNodeIds(designRootSystem);
        const survivingLinks = Object.fromEntries(
            Object.entries(links).filter(([nodeId]) => validNodeIds.has(nodeId))
        );
        return { ...survivingLinks, ...converted.componentLinks };
    });
    mergeBoundFmiComponents(fmuBindingsBySourceNodeId, converted.componentLinks);
    return newRootId;
};

// Collect every subsystem ID reachable from a system's node tree (recursively).
function collectSubsystemIds(system: SystemType): string[] {
    const subsystemIds = new Set<string>();
    const visit = (sys: SystemType) => {
        for (const node of sys.nodes) {
            const subsystemId = (node.data as unknown as SubsystemDataType | undefined)?.subsystemId;
            if (subsystemId && !subsystemIds.has(subsystemId)) {
                subsystemIds.add(subsystemId);
                const child = getSystem(subsystemId);
                if (child) visit(child);
            }
        }
    };
    visit(system);
    return Array.from(subsystemIds);
}

// Collect every node ID in a system's node tree (recursively through subsystems).
function collectTreeNodeNodeIds(system: SystemType): Set<string> {
    const nodeIds = new Set<string>();
    const visit = (sys: SystemType) => {
        for (const node of sys.nodes) {
            nodeIds.add(node.id);
            const subsystemId = (node.data as unknown as SubsystemDataType | undefined)?.subsystemId;
            if (subsystemId) {
                const child = getSystem(subsystemId);
                if (child) visit(child);
            }
        }
    };
    visit(system);
    return nodeIds;
}

export const upsertAnalysisReport = (report: AnalysisReportRecord) => {
    analysisReports.update((reports) => {
        const next = [report, ...reports.filter((item) => item.id !== report.id)];
        return next.slice(0, 20);
    });
}

export const upsertTemplateSimulationResult = (record: TemplateSimulationResultRecord) => {
    templateSimulationResults.update((results) => {
        const existing = results.find((item) => item.id === record.id || item.jobId === record.jobId);
        const merged: TemplateSimulationResultRecord = {
            ...existing,
            ...record,
            createdAt: existing?.createdAt || record.createdAt,
            series: mergeTemplateSimulationSeries(existing?.series || [], record.series || [])
        };
        const next = [merged, ...results.filter((item) => item.id !== merged.id && item.jobId !== merged.jobId)];
        return next.slice(0, 20);
    });
}

export const toTemplateSimulationResultRecord = (
    payload: Record<string, any>,
    designSystemId: string,
    designSystemName: string,
    existing?: TemplateSimulationResultRecord | null
): TemplateSimulationResultRecord => {
    const now = new Date().toISOString();
    const jobId = String(payload.jobId || existing?.jobId || '');
    const existingIds = get(templateSimulationResults).map((result) => result.id);

    return {
        id: String(payload.id || existing?.id || jobId || generateId(existingIds)),
        jobId,
        status: String(payload.status || existing?.status || 'UNKNOWN'),
        message: stringOrUndefined(payload.message) ?? existing?.message,
        launcherStatus: stringOrUndefined(payload.launcherStatus) ?? existing?.launcherStatus,
        modelId: stringOrUndefined(payload.modelId) ?? existing?.modelId,
        modelUrl: stringOrUndefined(payload.modelUrl) ?? existing?.modelUrl,
        resultFile: stringOrUndefined(payload.resultFile) ?? existing?.resultFile,
        files: normalizeStringArray(payload.files, existing?.files),
        hdf5Files: normalizeStringArray(payload.hdf5Files, existing?.hdf5Files),
        variables: normalizeStringArray(payload.variables, existing?.variables),
        simpleVariables: normalizeSimpleVariables(payload.simpleVariables, existing?.simpleVariables),
        variablesByFile: normalizeVariablesByFile(payload.variablesByFile) ?? existing?.variablesByFile,
        series: normalizeTemplateSeries(payload.series, existing?.series),
        createdAt: String(payload.createdAt || existing?.createdAt || now),
        updatedAt: String(payload.updatedAt || now),
        designSystemId,
        designSystemName
    };
}

const mergeTemplateSimulationSeries = (
    existingSeries: TemplateSimulationSeries[],
    incomingSeries: TemplateSimulationSeries[]
): TemplateSimulationSeries[] => {
    const merged = new Map<string, TemplateSimulationSeries>();
    for (const series of existingSeries) {
        merged.set(templateSeriesKey(series), series);
    }
    for (const series of incomingSeries) {
        merged.set(templateSeriesKey(series), series);
    }
    return Array.from(merged.values());
}

const templateSeriesKey = (series: TemplateSimulationSeries) => {
    return String(series.id || series.name || Math.random());
}

const normalizeStringArray = (value: unknown, fallback: string[] = []): string[] => {
    if (!Array.isArray(value)) return fallback;
    return value.map((item) => String(item));
}

const normalizeSimpleVariables = (
    value: unknown,
    fallback: TemplateSimulationSimpleVariable[] = []
): TemplateSimulationSimpleVariable[] => {
    if (!Array.isArray(value)) return fallback;
    return value
        .filter((item): item is Record<string, unknown> => Boolean(item) && typeof item === 'object')
        .map((item) => ({
            ...item,
            id: String(item.id || item.name || ''),
            name: String(item.name || item.id || ''),
            type: item.type ? String(item.type) : undefined
        }))
        .filter((item) => item.id.length > 0);
}

const normalizeVariablesByFile = (value: unknown): Record<string, string[]> | undefined => {
    if (!value || typeof value !== 'object' || Array.isArray(value)) return undefined;
    return Object.fromEntries(
        Object.entries(value as Record<string, unknown>).map(([file, variables]) => [
            file,
            normalizeStringArray(variables)
        ])
    );
}

const normalizeTemplateSeries = (
    value: unknown,
    fallback: TemplateSimulationSeries[] = []
): TemplateSimulationSeries[] => {
    if (!Array.isArray(value)) return fallback;
    return value
        .filter((item): item is Record<string, unknown> => Boolean(item) && typeof item === 'object')
        .map((item) => ({
            id: stringOrUndefined(item.id),
            name: stringOrUndefined(item.name),
            type: stringOrUndefined(item.type),
            t: normalizeNumberArray(item.t),
            value: normalizeNumberArray(item.value),
            first: numberOrNull(item.first),
            last: numberOrNull(item.last),
            min: numberOrNull(item.min),
            max: numberOrNull(item.max)
        }));
}

const normalizeNumberArray = (value: unknown): number[] => {
    if (!Array.isArray(value)) return [];
    return value
        .map((item) => Number(item))
        .filter((item) => Number.isFinite(item));
}

const stringOrUndefined = (value: unknown): string | undefined => {
    return typeof value === 'string' && value.length > 0 ? value : undefined;
}

const numberOrNull = (value: unknown): number | null => {
    const numeric = Number(value);
    return Number.isFinite(numeric) ? numeric : null;
}

export const markAnalysisReportShared = (reportId: string, requestIds: string[]) => {
    analysisReports.update((reports) => reports.map((report) => {
        if (report.id !== reportId) return report;
        const existingIds = new Set(report.sharedRequestIds ?? []);
        for (const id of requestIds) existingIds.add(id);
        return {
            ...report,
            sharedRequestIds: Array.from(existingIds),
            sharedAt: new Date().toISOString()
        };
    }));
}

const recursiveSystemBuilder = (
    nodes: Node[],
    edges: Edge[],
    parentSystemId: string,
    fmuBindingsBySourceNodeId: Record<string, ConceptFmuBinding>,
    connectorHandleMap: Map<string, string> = new Map()
): { nodes: Node[], edges: Edge[], componentLinks: Record<string, string> } => {
    // Helper function for extracting handle names in the cocnept stage
    const extractHandleName = (handleId: string, type: '-input-' | '-output-') => {
        const num = handleId.indexOf(type) + type.length;
        return handleId.substring(num);
    };

    const uniqueById = <T extends { id: string }>(items: T[]): T[] => {
        return Array.from(new Map(items.map(item => [item.id, item])).values());
    };

    const packageInside = (node: Node): { nodes: Node[], inEdges: Edge[], boundaryEdges: Edge[] } => {
        const insideData = node.data?.insideData as any;
        const insideNodes = Array.isArray(insideData?.nodes) ? insideData.nodes as Node[] : [];
        const parentedNodes = nodes.filter(candidate => candidate.parentId === node.id);
        const nestedNodes = uniqueById([...insideNodes, ...parentedNodes]);
        const nestedNodeIds = new Set(nestedNodes.map(n => n.id));

        const storedInEdges = Array.isArray(insideData?.inEdges)
            ? insideData.inEdges as Edge[]
            : Array.isArray(insideData?.edges)
                ? insideData.edges as Edge[]
                : [];
        const derivedInEdges = edges.filter(edge => nestedNodeIds.has(edge.source) && nestedNodeIds.has(edge.target));
        const storedBoundaryEdges = Array.isArray(insideData?.boundaryEdges) ? insideData.boundaryEdges as Edge[] : [];
        const derivedBoundaryEdges = edges.filter(edge => nestedNodeIds.has(edge.source) !== nestedNodeIds.has(edge.target));

        return {
            nodes: nestedNodes,
            inEdges: uniqueById([...storedInEdges, ...derivedInEdges]),
            boundaryEdges: uniqueById([...storedBoundaryEdges, ...derivedBoundaryEdges])
        };
    };
    
    
    // Do not count nodes that are in packages twice
    var nodesInPackages: any = [];
    var edgesInPackages: any = [];
    nodes.forEach(node => {
        if (node.type === 'package') {
        const internalNodes = packageInside(node).nodes;
        nodesInPackages.push(internalNodes.map((n: Node) => n.id));

        const internalEdges = packageInside(node).inEdges;
        edgesInPackages.push(internalEdges.map((e: Edge) => e.id));
        }
    })

    const filteredNodes = nodes.filter(node => !nodesInPackages.flat().includes(node.id));
    const filteredEdges = edges.filter(edge => !edgesInPackages.flat().includes(edge.id));

    // Track used names at this level to prevent duplicate node names
    // (mirrors design stage name clash prevention)
    const usedNames: string[] = [];

    const convertedNodes = filteredNodes.map(node => {
        // Ensure unique name at this breadcrumb level
        const baseName = ((node.data.declaredName as string) || 'Unnamed').trim();
        const uniqueName = generateName(baseName, usedNames);
        usedNames.push(uniqueName);

        // Convert the input/output ports to connectors
        var connectors: ConnectorType[] = [];
        var ioedges: Edge[] = [];
        const designNodeId = `d-${node.id}`;
        if (node.type !== 'package') {
            ((node.data.inputs as any[]) || []).forEach(input => {
                connectors.push({
                    handleId: generateId(connectors.map(c => c.handleId).filter(Boolean) as string[]),
                    name: input.name,
                    VSSoClass: 'None',
                    type: 'input',
                    dataType: 'no-dt',
                    unit: '-'
                });
            });
            ((node.data.outputs as any[]) || []).forEach(output => {
                connectors.push({
                    handleId: generateId(connectors.map(c => c.handleId).filter(Boolean) as string[]),
                    name: output.name,
                    VSSoClass: 'None',
                    type: 'output',
                    dataType: 'no-dt',
                    unit: '-'
                });
            });
        }
        else {
            var counter = 1;
            const inData = packageInside(node);
            const inNodeIds = inData.nodes.map(n => n.id);
            (inData.boundaryEdges || []).forEach(edge => {
                const isInput = inNodeIds.includes(edge.target);
                connectors.push({
                    handleId: generateId(connectors.map(c => c.handleId).filter(Boolean) as string[]),
                    name: `p-Connector (${counter})`,
                    VSSoClass: 'None',
                    type: isInput ? 'input' : 'output',
                    dataType: 'no-dt',
                    unit: '-',
                    metadata: isInput ? edge.target : edge.source
                });
                // Defer ioedge creation until after recursive call so inner
                // node handleIds are available in the map.
                ioedges.push({
                    source: isInput ? `internal-port-input-p-Connector (${counter})` : `d-${edge.source}`,
                    sourceHandle: '', // filled after recursive call
                    target: isInput ? `d-${edge.target}` : `internal-port-output-p-Connector (${counter})`,
                    targetHandle: '', // filled after recursive call
                    id: `d-internal-${edge.id}`,
                    // Stash data needed after the recursive call to resolve handles.
                    _input_edge: isInput ? edge : undefined,
                    _output_edge: isInput ? undefined : edge,
                    _counter: counter
                } as any);
                counter++;
            });
        }

        // Register connector handleIds so edges can reference the actual handle ids
        connectors.forEach(c => {
            if (c.handleId) {
                connectorHandleMap.set(`${designNodeId}:${c.name}`, c.handleId);
            }
        });


        const childNodes = Array.isArray(node.data?.nodes) ? node.data.nodes as Node[] : [];
        const childEdges = Array.isArray(node.data?.edges) ? node.data.edges as Edge[] : [];
        const hasNestedChildren = childNodes.length > 0;

        if (node.type === 'package' || hasNestedChildren) {
            const newSubsystemId = generateId(get(systems).map(s => s.id));
            const packageData = node.type === 'package' ? packageInside(node) : null;
            
            // Convert children recursively (populates inner node handleIds in the map)
            const internal = node.type === 'package' 
            ? recursiveSystemBuilder(
                packageData?.nodes || [],
                packageData?.inEdges || [],
                newSubsystemId,
                fmuBindingsBySourceNodeId,
                connectorHandleMap
            )
            : recursiveSystemBuilder(
                childNodes, 
                childEdges, 
                newSubsystemId,
                fmuBindingsBySourceNodeId,
                connectorHandleMap
            );

            // Now that inner nodes are processed, resolve ioedge handles.
            ioedges = (ioedges as any[]).map((ioedge: any) => {
                if (ioedge._input_edge) {
                    const e = ioedge._input_edge;
                    const portName = extractHandleName(e.targetHandle ?? '', '-input-');
                    const handleId = connectorHandleMap.get(`d-${e.target}:${portName}`) || portName;
                    return {
                        source: ioedge.source,
                        sourceHandle: `internal-port-input-p-Connector (${ioedge._counter})-source`,
                        target: `d-${e.target}`,
                        targetHandle: `d-${e.target}.${handleId}`,
                        id: ioedge.id
                    };
                } else if (ioedge._output_edge) {
                    const e = ioedge._output_edge;
                    const portName = extractHandleName(e.sourceHandle ?? '', '-output-');
                    const handleId = connectorHandleMap.get(`d-${e.source}:${portName}`) || portName;
                    return {
                        source: `d-${e.source}`,
                        sourceHandle: `d-${e.source}.${handleId}`,
                        target: `internal-port-output-p-Connector (${ioedge._counter})`,
                        targetHandle: `internal-port-output-p-Connector (${ioedge._counter})-target`,
                        id: ioedge.id
                    };
                }
                return ioedge;
            });

            // Create the new System entry
            const newSystem: SystemType = {
                id: newSubsystemId,
                name: uniqueName,
                parentSystemId: parentSystemId,
                nodes: internal.nodes,
                edges: [...ioedges, ...internal.edges],
                date: new Date().toISOString(),
                requirements: [],
                partDefinitions: [],
                itemDefinitions: [],
                packages: [],
                stage: 'design'
            };
            saveSystem(newSystem);

            // Return the node to the parent level
            return {
                id: `d-${node.id}`,
                type: 'Element', 
                data: { 
                    name: uniqueName,
                    element: {
                        type: 'system',
                        VSSoClass: null,
                        connectors: connectors,
                        metadata: Array.isArray(node.data?.metadata) ? _.cloneDeep(node.data.metadata) : [],
                        subsystemId: newSubsystemId,
                        hasSubsystems: true,
                    }
                },
                dragHandle: '.element-node-inner',
                measured: {
                    width: 200,
                    height: 200
                },
                position: node.position
            };
        }
        const fmuBinding = fmuBindingsBySourceNodeId[node.id];
        return {

            id: `d-${node.id}`,
            type: 'Element', 
                data: { 
                    name: uniqueName,
                    element: {
                        type: 'component',
                        VSSoClass: null,
                        connectors: connectors,
                        metadata: Array.isArray(node.data?.metadata) ? _.cloneDeep(node.data.metadata) : [],
                        mass: node.data?.mass,
                        fmiComponentId: fmuBinding?.fmuId,
                        fmiBinding: fmuBinding
                    }
                },
            dragHandle: '.element-node-inner',
            measured: {
                width: 200,
                height: 200
            },
            position: node.position     
        };
    });

    const convertedComponentLinks = convertedNodes.reduce((links, node) => {
        const sourceNodeId = node.id.startsWith('d-') ? node.id.slice(2) : '';
        const binding = sourceNodeId ? fmuBindingsBySourceNodeId[sourceNodeId] : undefined;
        if (binding?.fmuId) {
            links[node.id] = binding.fmuId;
        }
        return links;
    }, {} as Record<string, string>);

    const convertedEdges = filteredEdges.map(edge => {
        const sourcePortName = extractHandleName(edge.sourceHandle ?? "", '-output-');
        const targetPortName = extractHandleName(edge.targetHandle ?? "", '-input-');
        const sourceNodeId = `d-${edge.source}`;
        const targetNodeId = `d-${edge.target}`;

        var newBaseEdge: Edge = {
            source: sourceNodeId,
            sourceHandle: `${sourceNodeId}.${connectorHandleMap.get(`${sourceNodeId}:${sourcePortName}`) || sourcePortName}`,
            target: targetNodeId,
            targetHandle: `${targetNodeId}.${connectorHandleMap.get(`${targetNodeId}:${targetPortName}`) || targetPortName}`,
            id: `d-${edge.id}`
        }

        if (nodesInPackages.flat().includes(edge.source)) {
            const newSourceNode = convertedNodes.find(n => 
                n.data.element.connectors.map(c => c.metadata).includes(edge.source));
            const newConnector = newSourceNode?.data.element.connectors.find(c => c.metadata === edge.source);
            // console.log(newConnector);
            newBaseEdge = {...newBaseEdge,
                source: newSourceNode!.id,
                sourceHandle: `${newSourceNode!.id}.${newConnector?.handleId || newConnector!.name}`
            };
        }
        if (nodesInPackages.flat().includes(edge.target)) {
            const newTargetNode = convertedNodes.find(n => 
                n.data.element.connectors.map(c => c.metadata).includes(edge.target));
            // console.log(newTargetNode);
            const newConnector = newTargetNode?.data.element.connectors.find(c => c.metadata === edge.target);
            // console.log(newConnector);
            newBaseEdge = {...newBaseEdge,
                target: newTargetNode!.id,
                targetHandle: `${newTargetNode!.id}.${newConnector?.handleId || newConnector!.name}`
            };
        }

        if (edge.source.includes('internal-port-input')) {
            newBaseEdge = {...newBaseEdge,
                source: edge.source,
                sourceHandle: edge.sourceHandle
            };
        }
        if (edge.target.includes('internal-port-output')) {
            newBaseEdge = {...newBaseEdge,
                target: edge.target,
                targetHandle: edge.targetHandle
            };
        }

        return newBaseEdge;
    });

    const nestedComponentLinks = convertedNodes.reduce((links, node) => {
        const subsystemId = (node.data?.element as SubsystemDataType | undefined)?.subsystemId;
        if (!subsystemId) return links;
        const subsystem = getSystem(subsystemId);
        if (!subsystem) return links;
        for (const subsystemNode of subsystem.nodes) {
            const sourceNodeId = subsystemNode.id.startsWith('d-') ? subsystemNode.id.slice(2) : '';
            const binding = sourceNodeId ? fmuBindingsBySourceNodeId[sourceNodeId] : undefined;
            if (binding?.fmuId) {
                links[subsystemNode.id] = binding.fmuId;
            }
        }
        return links;
    }, {} as Record<string, string>);

    return { nodes: convertedNodes, edges: convertedEdges, componentLinks: { ...nestedComponentLinks, ...convertedComponentLinks } };
};

function mergeBoundFmiComponents(bindingsBySourceNodeId: Record<string, ConceptFmuBinding>, links: Record<string, string>) {
    const linkedFmuIds = new Set(Object.values(links));
    const bindings = Object.values(bindingsBySourceNodeId).filter(binding => linkedFmuIds.has(binding.fmuId));
    if (!bindings.length) return;

    fmiComponents.update(components => {
        const existingIds = new Set(components.map(component => component.id));
        const additions: FMIComponentType[] = [];
        for (const binding of bindings) {
            if (existingIds.has(binding.fmuId)) continue;
            additions.push({
                id: binding.fmuId,
                name: binding.fmuName || binding.fmuId,
                category: inferFmiCategory(binding.fmuName || binding.partName || ''),
                description: `OEM response${binding.oemName ? ` from ${binding.oemName}` : ''}`,
                modelIdentifier: binding.fmuName || binding.fmuId,
                fmiVersion: 'unknown',
                fmiType: 'FMU',
                linkedElements: Object.entries(links).filter(([, fmuId]) => fmuId === binding.fmuId).map(([nodeId]) => nodeId),
                uploadDate: new Date().toISOString(),
                isUserUploaded: false,
                oemName: binding.oemName ?? undefined,
                oemShortCode: binding.oemShortCode ?? undefined,
                catalogSource: 'api'
            });
            existingIds.add(binding.fmuId);
        }
        return additions.length ? [...components, ...additions] : components;
    });
}

function inferFmiCategory(name: string): FMIComponentType['category'] {
    const value = name.toLowerCase();
    if (value.includes('motor')) return 'motors';
    if (value.includes('propeller')) return 'propellers';
    if (value.includes('engine')) return 'engines';
    if (value.includes('sensor')) return 'sensors';
    if (value.includes('controller') || value.includes('converter')) return 'controllers';
    return 'other';
}

// For debugging purposes
export const removeOtherSystems = () => {
    systems.update(sys => sys.filter(s => s.id === get(currentSystemMeta).id));
}

export const createSubsystem = (parentSystemId: string, name: string): SystemType => {
    const subsystem = createSystem();
    subsystem.name = name;

    saveSystem({
        ...subsystem,
        nodes: [],
        edges: [],
        requirements: [],
        parentSystemId: parentSystemId,
    });

    return subsystem;
}

export const isSubsystemNode = (nodeData: any): boolean => {
    return nodeData?.element?.type === 'system' && nodeData?.element?.hasSubsystems === true;
};


export const fmiComponents = writable<FMIComponentType[]>([]);
export const componentLinks = persistentStore<Record<string, string>>('componentLinks', {});

export interface CkanSite {
	id: string;
	name: string;
	baseUrl: string;
	catalogUrl: string;
}

export const ckanSites = persistentStore<CkanSite[]>('ckanSites', [
	{
		id: 'securedigitaltwins',
		name: 'securedigitaltwins.com',
		baseUrl: 'https://securedigitaltwins.com',
		catalogUrl: 'https://securedigitaltwins.com/catalog.jsonld'
	},
	{
		id: 'trustedtwincatalog',
		name: 'trustedtwincatalog.com',
		baseUrl: 'https://trustedtwincatalog.com',
		catalogUrl: 'https://trustedtwincatalog.com/catalog.jsonld'
	}
]);

export function addCkanSite(name: string, catalogUrl: string) {
	const baseUrl = new URL(catalogUrl).origin;
	const id = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || `ckan-${Date.now()}`;
	const site: CkanSite = { id, name, baseUrl, catalogUrl };

	ckanSites.update(sites => {
		if (sites.some(s => s.id === id || s.catalogUrl === catalogUrl)) return sites;
		return [...sites, site];
	});

	return site;
}

export function removeCkanSite(siteId: string) {
	ckanSites.update(sites => sites.filter(s => s.id !== siteId));
}

export const templatesByCategory = derived(templates, $templates => {
    const grouped: Record<string, ConceptTemplate[]> = {
        uncategorized: []
    };
    
    $templates.forEach(template => {
        const category = template.category || 'uncategorized';
        if (!grouped[category]) {
        grouped[category] = [];
        }
        grouped[category].push(template);
    });
    
    return grouped;
});

export function saveTemplate(template: Omit<ConceptTemplate, 'id' | 'createdAt' | 'updatedAt'>): ConceptTemplate {
  const newTemplate: ConceptTemplate = {
    ...template,
    id: `template-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };
  
  templates.update(temps => [...temps, newTemplate]);
  return newTemplate;
}

export function updateTemplate(id: string, updates: Partial<ConceptTemplate>) {
  templates.update(temps => 
    temps.map(t => 
      t.id === id 
        ? { ...t, ...updates, updatedAt: new Date().toISOString() }
        : t
    )
  );
}

export function deleteTemplate(template: ConceptTemplate | PackageTemplate) {
    //console.log(template.type)
    if (template.type === 'package') {
        currentPackages.update(pkgs => pkgs.filter(p => p.id !== template.id));
    }
    else {
        templates.update(temps => temps.filter(t => t.id !== template.id));
    }
}

export function duplicateTemplate(id: string): ConceptTemplate | PackageTemplate | null {
  const original = get(templates).find(t => t.id === id);
  
  if (!original) return null;
  
  const duplicate = saveTemplate({
    ...original,
    name: duplicateName(original.name, get(templates).map(t => t.name)),
    description: original.description
  });
  
  return duplicate;
}

export function exportTemplate(id: string): string | null {
  const template = get(templates).find(t => t.id === id);
  
  if (!template) return null;
  
  return JSON.stringify(template, null, 2);
}

export function importTemplate(jsonString: string): ConceptTemplate | null {
  try {
    const parsed = JSON.parse(jsonString);
    if (!parsed.name || !parsed.data || !parsed.data.nodes) {
      throw new Error('Invalid template format');
    }
    
    return saveTemplate({
      name: parsed.name,
      description: parsed.description || '',
      category: parsed.category,
      tags: parsed.tags || [],
      data: parsed.data
    });
  } catch (error) {
    console.error('Failed to import template:', error);
    return null;
  }
}
