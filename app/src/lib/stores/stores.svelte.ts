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

export const notification = writable<NotificationType | null>(null);
export const isAddingRequirement = writable<boolean>(false);

// current system
export const currentSystemMeta = persistentStore<SystemMetaType>('currentSystemMeta', {name: '', date: '', id: ''});
export const currentNodes = persistentStore<Node[]>('currentNodes', [
    {
      id: 'root',
      type: 'RootSystem',
      data: { 
        label: 'Node',
        name: 'Root Node'
        },
      position: { x: 0, y: 150 }
    } as {} as Node
]);
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
    currentNodes.set(subsystem.nodes);
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

// TODO: Add template storage logic

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