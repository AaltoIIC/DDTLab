import {
    type NotificationType,
    type SystemMetaType,
    type SystemType,
    type RequirementType,
    type HistoryEntryType,
    type NavigationContextType,
    type SubsystemDataType,
    type NodeDataType,
    type FMIComponentType,
    type ConceptTemplate,
    type PartDefinition,
    type ItemDefinition,
    type PackageTemplate,
    type ConnectorType,
} from '../types/types';
import {    
    type Node,
    type Edge
} from '@xyflow/svelte';
import {
    generateId,
    generateName
} from '$lib/helpers';
import { writable, get, derived } from 'svelte/store';
import persistentStore from './persistentStore';
import _ from 'lodash';
import ConceptTemplateSlider from '$lib/concept-phase/ConceptTemplateSlider.svelte';
import { packageViewStack, type PackageView } from '$lib/concept-phase/packageStore';


// Helper variable for root node
export const rootNode = {
      id: 'root',
      type: 'RootSystem',
      data: { 
        label: 'Node',
        name: 'Root Node'
        },
      position: { x: 0, y: 150 }
    } as {} as Node

export const notification = writable<NotificationType | null>(null);
export const isAddingRequirement = writable<boolean>(false);

// current system
export const currentSystemMeta = persistentStore<SystemMetaType>('currentSystemMeta', {name: '', date: '', id: ''});
export const currentNodes = persistentStore<Node[]>('currentNodes', [rootNode]);
export const currentEdges = persistentStore<Edge[]>('currentEdges', []);
export const currentReqs = persistentStore<RequirementType[]>('currentReqs', []);

// Custom connector data types defined by users
export const customDataTypes = persistentStore<string[]>('customDataTypes', []);

// Custom VSSo variables defined by users
export const customVSSoVariables = persistentStore<string[]>('customVSSoVariables', []);

export const systems = persistentStore<SystemType[]>('systems', []);

export const templates = persistentStore<ConceptTemplate[]>('conceptTemplates', []);

export const currentPartDefinitions = persistentStore<PartDefinition[]>('partDefinitions', []);
export const currentItemDefinitions = persistentStore<ItemDefinition[]>('itemDefinitions', []);
export const currentPackages = persistentStore<PackageTemplate[]>('packages', []);

export const saveSystem = (system: SystemType) => {
    systems.update((systems) => {
        const sysIndex = systems.findIndex(s => s.id === system.id);
        if (sysIndex !== -1) {
            systems[sysIndex] = _.cloneDeep(system);
        } else {
            systems.push(_.cloneDeep(system));
        }

        return systems;
    });
}

export const saveCurrentSystem = () => {
    const currentSystem = getSystem(get(currentSystemMeta).id);
    saveSystem({
        id: get(currentSystemMeta).id,
        name: get(currentSystemMeta).name,
        date: new Date().toISOString(),
        nodes: get(currentNodes),
        edges: get(currentEdges),
        requirements: get(currentReqs),
        partDefinitions: get(currentPartDefinitions),
        itemDefinitions: get(currentItemDefinitions),
        packages: get(currentPackages),
        parentSystemId: currentSystem?.parentSystemId || null,
        stage: currentSystem?.stage || 'design',
    });
}

export const getSystem = (id: string): SystemType | null => {
    return _.cloneDeep(get(systems).find(s => s.id === id)) || null;
}

export const createSystem = () => ({
        name: generateName("New System", get(systems).map(s => s.name)),
        date: new Date().toISOString(),
        id: generateId(get(systems).map(s => s.id))
    } as SystemType)

export const setCurrentSystem = (id: string) => {
    const sysIndex = get(systems).findIndex(s => s.id === id);

    if (sysIndex !== -1) {
        const system = get(systems)[sysIndex];

        currentSystemMeta.set({
            id: id,
            name: system.name,
            date: system.date
        });
        currentNodes.set(system.nodes);
        currentEdges.set(system.edges);
        currentReqs.set(system.requirements || []);
        currentPartDefinitions.set(system.partDefinitions);
        currentItemDefinitions.set(system.itemDefinitions);
        currentPackages.set(system.packages);
    }
}

export const convertToDesign = () => {

    // Get the root context
    const stack = get(packageViewStack);
    const rootLevel = stack.length > 0 ? stack[0] : null;
    const rootNodes = rootLevel ? rootLevel.nodes : get(currentNodes);
    const rootEdges = rootLevel ? rootLevel.edges : get(currentEdges);
    const newRootId = generateId(get(systems).map(s => s.id));
    const newRootName = generateName(`${get(currentSystemMeta).name, get(systems).map(s => s.name)} (Design Stage)`, get(systems).map(s => s.name));

    // Deep recursive conversion
    const converted = recursiveSystemBuilder(rootNodes, rootEdges, newRootId);

    // Create the root system for the design stage
    const designRootSystem: SystemType = {
        id: newRootId,
        name: newRootName,
        date: new Date().toISOString(), 
        nodes: [rootNode, ...converted.nodes],
        edges: converted.edges,
        requirements: [],
        partDefinitions: [],
        itemDefinitions: [],
        packages: [],
        stage: 'design'
    }

    saveSystem(designRootSystem);
};

const recursiveSystemBuilder = (nodes: Node[], edges: Edge[], parentSystemId: string): { nodes: Node[], edges: Edge[] } => {
    // Helper function for extracting handle names in the cocnept stage
    const extractHandleName = (handleId: string, type: '-input-' | '-output-') => {
        const num = handleId.indexOf(type) + type.length;
        return handleId.substring(num);
    };
    
    
    // Do not count nodes that are in packages twice
    var nodesInPackages: any = [];
    var edgesInPackages: any = [];
    nodes.forEach(node => {
        if (node.type === 'package') {
        const internalNodes = (node.data.insideData as any)?.nodes || [];
        nodesInPackages.push(internalNodes.map((n: Node) => n.id));

        const internalEdges = (node.data.insideData as any)?.inEdges || [];
        edgesInPackages.push(internalEdges.map((e: Edge) => e.id));
        }
    })

    const filteredNodes = nodes.filter(node => !nodesInPackages.flat().includes(node.id));
    const filteredEdges = edges.filter(edge => !edgesInPackages.flat().includes(edge.id));

    const convertedNodes = filteredNodes.map(node => {
        // Convert the input/output ports to connectors
        var connectors: ConnectorType[] = [];
        var ioedges: Edge[] = [];
        if (node.type !== 'package') {
            ((node.data.inputs as any[]) || []).forEach(input => {
                connectors.push({
                    name: input.name,
                    VSSoClass: 'None',
                    type: 'input',
                    dataType: 'no-dt',
                    unit: '-'
                });
            });
            ((node.data.outputs as any[]) || []).forEach(output => {
                connectors.push({
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
            const inData = node.data?.insideData as any
            const inNodeIds = (inData.nodes as Node[]).map(n => n.id);
            (inData?.boundaryEdges as Edge[] || []).forEach(edge => {
                if (inNodeIds.includes(edge.target)) {
                    connectors.push({
                        name: `p-Connector (${counter})`,
                        VSSoClass: 'None',
                        type: 'input',
                        dataType: 'no-dt',
                        unit: '-',
                        metadata: edge.target
                    });
                    ioedges.push({
                        source: `internal-port-input-p-Connector (${counter})`,
                        sourceHandle: `internal-port-input-p-Connector (${counter})-source`,
                        target: `d-${edge.target}`,
                        targetHandle: `d-${edge.target}.${extractHandleName(edge.targetHandle ?? "", '-input-')}`,
                        id: `d-internal-${edge.id}`
                    })
                }
                else {
                    connectors.push({
                        name: `p-Connector (${counter})`,
                        VSSoClass: 'None',
                        type: 'output',
                        dataType: 'no-dt',
                        unit: '-',
                        metadata: edge.source
                    });
                    ioedges.push({
                        source: `d-${edge.source}`,
                        sourceHandle: `d-${edge.source}.${extractHandleName(edge.sourceHandle ?? "", '-output-')}`,
                        target: `internal-port-output-p-Connector (${counter})`,
                        targetHandle: `internal-port-output-p-Connector (${counter})-target`,
                        id: `d-internal-${edge.id}`
                    })
                }
                counter++;
            });
        }


        if (node.type === 'package' || (node.data.nodes as any).length) {
            const newSubsystemId = generateId(get(systems).map(s => s.id));
            
            // Convert children recursively
            const internal = node.type === 'package' 
            ? recursiveSystemBuilder(
                (node.data?.insideData as any)?.nodes || [],
                (node.data?.insideData as any)?.inEdges || [],
                newSubsystemId
            )
            : recursiveSystemBuilder(
                (node.data?.nodes as any) || [], 
                (node.data?.edges as any) || [], 
                newSubsystemId
            );

            // Create the new System entry
            const subsystemRootNode = {...rootNode,
                data: {
                    parentSystemId: parentSystemId,
                    parentNodeId: node.id,
                }
            }
            const newSystem: SystemType = {
                id: newSubsystemId,
                name: node.data.declaredName as string,
                parentSystemId: parentSystemId,
                nodes: [subsystemRootNode, ...internal.nodes],
                edges: [...ioedges, ...internal.edges],
                date: new Date().toISOString(),
                requirements: [],
                partDefinitions: [],
                itemDefinitions: [],
                packages: [],
            };
            saveSystem(newSystem);

            // Return the node to the parent level
            return {
                ...node,
                id: `d-${node.id}`,
                type: 'Element', 
                data: { 
                    name: node.data.declaredName as string,
                    element: {
                        type: 'system',
                        VSSoClass: null,
                        connectors: connectors,
                        subsystemId: newSubsystemId,
                        hasSubsystems: true,
                    }
                },
                dragHandle: '.element-node-inner',
                parentId: 'root'
            };
        }
        return {
            ...node,
            id: `d-${node.id}`,
            type: 'Element', 
            data: { 
                name: node.data.declaredName as string,
                element: {
                    type: 'component',
                    VSSoClass: null,
                    connectors: connectors,
                }
            },
            dragHandle: '.element-node-inner',
            parentId: 'root'
        };
    });

    const convertedEdges = filteredEdges.map(edge => {

        const newBaseEdge: Edge = {
            source: `d-${edge.source}`,
            sourceHandle: `d-${edge.source}.${extractHandleName(edge.sourceHandle ?? "", '-output-')}`,
            target: `d-${edge.target}`,
            targetHandle: `d-${edge.target}.${extractHandleName(edge.targetHandle ?? "", '-input-')}`,
            id: `d-${edge.id}`
        }

        console.log(convertedNodes);
        if (nodesInPackages.flat().includes(edge.source)) {
            const newSourceNode = convertedNodes.find(n => 
                n.data.element.connectors.map(c => c.metadata).includes(edge.source));
            console.log("WILL I MAKE IT?");
            const newConnector = newSourceNode?.data.element.connectors.find(c => c.metadata === edge.source);
            console.log(newConnector);
            return {...newBaseEdge,
                source: newSourceNode!.id,
                sourceHandle: `${newSourceNode!.id}.${newConnector!.name}`
            }
        }
        if (nodesInPackages.flat().includes(edge.target)) {
            const newTargetNode = convertedNodes.find(n => 
                n.data.element.connectors.map(c => c.metadata).includes(edge.target));
            console.log(newTargetNode);
            const newConnector = newTargetNode?.data.element.connectors.find(c => c.metadata === edge.target);
            console.log(newConnector);
            return {...newBaseEdge,
                target: newTargetNode!.id,
                targetHandle: `${newTargetNode!.id}.${newConnector!.name}`
            }
        }
        return newBaseEdge;
    });

    return { nodes: convertedNodes, edges: convertedEdges };
};

export const removeSystem = (id: string) => {
    function inner(id: string, allSystems: SystemType[]): SystemType[] {
        const children = allSystems.filter((sys) => sys.parentSystemId === id);
        children.forEach((child) => {
            allSystems = inner(child.id, allSystems);
        });

        return allSystems.filter((sys) => sys.id !== id);
    }

    systems.update((systems) => {
        systems = inner(id, systems);
        return systems;
    });
}

export const cloneSystem = (id: string) => {
    const system = getSystem(id);
    const allNames = (get(currentNodes).map(n => n.data.name) as string[]).concat(get(systems).map(s => s.name));
    if (system) {
        const newSystem = _.cloneDeep(system);
        newSystem.id = generateId(get(systems).map(s => s.id));
        newSystem.name = generateName(`Copy of ${newSystem.name}`, allNames);
        systems.update((systems) => {
            systems.push(newSystem);
            return systems;
        });
        return newSystem;
    }
    return null;
}

// history
export const history = writable<{currentIndex: number, data: HistoryEntryType[]}>({currentIndex: -1, data: []});

export const addToHistory = () => {
    history.update(h => {
        if (h.currentIndex !== -1) {
            h.data = h.data.slice(0, h.currentIndex + 1);
        }

        const entry = _.cloneDeep({
            systemMeta: get(currentSystemMeta),
            nodes: get(currentNodes),
            edges: get(currentEdges),
            requirements: get(currentReqs),
            partDefinitions: get(currentPartDefinitions),
            itemDefinitions: get(currentItemDefinitions),
            packages: get(currentPackages)
        });
        h.data.push(entry);
        h.currentIndex = -1;
        if (h.data.length > 10) {
            h.data.shift();
        }
        return h;
    });
}

const setHistoryEntry = (entry: HistoryEntryType) => {
    currentSystemMeta.set(entry.systemMeta);
    currentNodes.set(entry.nodes);
    currentEdges.set(entry.edges);
    currentReqs.set(entry.requirements);
    currentPartDefinitions.set(entry.partDefinitions);
    currentItemDefinitions.set(entry.itemDefinitions);
    currentPackages.set(entry.packages);
}

export const handleUndo = () => {
    let currentIndex = get(history).currentIndex === -1 ? get(history).data.length - 1 : get(history).currentIndex;
    currentIndex -= 1;
    if (currentIndex >= 0) {
        history.update(h => {
            h.currentIndex = currentIndex;
            return h;
        });

        const entry = get(history).data[currentIndex];
        setHistoryEntry(entry);
    }
}
export const handleRedo = () => {
    if (get(history).currentIndex !== -1 && get(history).currentIndex < get(history).data.length - 1) {
        let currentIndex = get(history).currentIndex;
        currentIndex += 1;
        if (currentIndex === get(history).data.length - 1) currentIndex = -1;

        history.update(h => {
            h.currentIndex = currentIndex;
            return h;
        });

        const entry = get(history).data.at(get(history).currentIndex);
        if (entry) {
            setHistoryEntry(entry);
        }
    }
}

export const navigationContext = writable<NavigationContextType>({
    path: [],
    currentSystemId: '',
    parentSystemId: '',
    rootSystemId: ''
});

export const currentViewSystemId = writable<string>('');

export const createSubsystem = (parentSystemId: string, parentNodeId: string, name: string): SystemType => {
    const subsystem = createSystem();
    subsystem.name = name;

    const subsystemRootNode = {
        id: 'root',
        type: 'RootSystem',
        data: { 
            label: subsystem.name,
            parentSystemId: parentSystemId,
            parentNodeId: parentNodeId,
         },
        position: { x: 0, y: 150 }
    } as Node;

    saveSystem({
        ...subsystem,
        nodes: [subsystemRootNode],
        edges: [],
        requirements: [],
        parentSystemId: parentSystemId,
    });

    return subsystem;
}

export const isSubsystemNode = (nodeData: any): boolean => {
    return nodeData?.element?.type === 'system' && nodeData?.element?.hasSubsystems === true;
};

export const navigateToSubsystem = (subsystemId: string, parentNodeId: string) => {
    const subsystem = getSystem(subsystemId);
    if (!subsystem) {
        console.error('Subsystem not found:', subsystemId);
        return;
    }
    
    // Create internal port nodes
    const parentNodeData = get(currentNodes).find( n => n.id === parentNodeId)?.data
    const parentNodeElement = parentNodeData?.element as SubsystemDataType;
    const inputs = parentNodeElement.connectors.filter(c => c.type === 'input');
    const outputs = parentNodeElement.connectors.filter(c => c.type === 'output');
    
    let internalPortNodes: Node[] = [];

    inputs.forEach((connector, index) => {
        internalPortNodes.push({
            id: `internal-port-input-${connector.name}`,
            type: 'Internal',
            position: { x: 20, y: 150 + index * 100 },  // More spread out vertically
            data: {
                ...connector,
                portType: 'input',
                parentNodeId,
                parentNodeName: parentNodeData?.name as string,
                isInternal: true
            },
            draggable: true,  // Allow users to position ports where needed
            deletable: false
        });
    })

    outputs.forEach((connector, index) => {
        internalPortNodes.push({
            id: `internal-port-output-${connector.name}`,
            type: 'Internal',
            position: { x: 800, y: 150 + index * 100 },  // Further right and more spread
            data: {
                ...connector,
                portType: 'output',
                parentNodeId,
                parentNodeName: parentNodeData?.name as string,
                isInternal: true
            },
            draggable: true,  // Allow users to position ports where needed
            deletable: false
        });
    });

    const subNodes = [...subsystem.nodes.filter(n => n.type !== 'Internal'), ...internalPortNodes]
    // TODO: This way is scuffed, fix later for both concept and design so its more robust
    // subsystem.nodes.push(...internalPortNodes);

    navigationContext.update(ctx => ({
        ...ctx,
        path: [...ctx.path, get(currentSystemMeta)],
        currentSystemId: subsystem.id,
    }));

    currentSystemMeta.set({
        id: subsystem.id,
        name: subsystem.name,
        date: subsystem.date
    });
    currentNodes.set(subNodes);
    currentEdges.set(subsystem.edges);
    currentReqs.set(subsystem.requirements);

    currentViewSystemId.set(subsystem.id);
    history.set({currentIndex: -1, data: []});
    addToHistory();
}

export const navigateToParent = () => {
    const ctx = get(navigationContext);
    if (ctx.path.length === 0) return;

    const parentMeta = ctx.path[ctx.path.length - 1];
    const parentSystem = getSystem(parentMeta.id);

    if (!parentSystem) {
        console.error('Parent system not found:', parentMeta.id);
        return;
    }

    navigationContext.update(ctx => ({
        ...ctx,
        path: ctx.path.slice(0, -1),
        currentSystemId: parentMeta.id,
        parentSystemId: ctx.path.length > 1 ? ctx.path[ctx.path.length - 2].id : '',
    }));

    currentSystemMeta.set(parentMeta);
    currentNodes.set(parentSystem.nodes);
    currentEdges.set(parentSystem.edges);
    currentReqs.set(parentSystem.requirements);

    currentViewSystemId.set(parentMeta.id);
    history.set({currentIndex: -1, data: []});
    addToHistory();
}

// root system
export const resetNavigation = () => {
    navigationContext.set({
        path: [],
        currentSystemId: get(currentSystemMeta).id,
        parentSystemId: '',
        rootSystemId: get(currentSystemMeta).id
    });
    currentViewSystemId.set(get(currentSystemMeta).id);
}

export const fmiComponents = persistentStore<FMIComponentType[]>('fmiComponents', []);
export const componentLinks = persistentStore<Record<string, string>>('componentLinks', {});

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
    console.log(template.type)
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
    name: `${original.name} (Copy)`,
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