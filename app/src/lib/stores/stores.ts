import type {
    NotificationType,
    SystemMetaType,
    SystemType,
    RequirementType,
    HistoryEntryType,
    NavigationContextType,
    SubsystemDataType,
    NodeDataType,
    FMIComponentType
} from '../types/types';
import {    
    type Node,
    type Edge
} from '@xyflow/svelte';
import {
    generateId,
    generateName
} from '$lib/helpers';
import { writable, get } from 'svelte/store';
import persistentStore from './persistentStore';
import _ from 'lodash';

export const notification = writable<NotificationType | null>(null);
export const isAddingRequirement = writable<boolean>(false);

// current system
export const currentSystemMeta = persistentStore<SystemMetaType>('currentSystemMeta', {name: '', date: '', id: ''});
export const currentNodes = persistentStore<Node[]>('currentNodes', [
    {
      id: 'root',
      type: 'RootSystem',
      data: { label: 'Node' },
      position: { x: 0, y: 150 }
    } as {} as Node
]);
export const currentEdges = persistentStore<Edge[]>('currentEdges', []);
export const currentReqs = persistentStore<RequirementType[]>('currentReqs', []);

export const systems = persistentStore<SystemType[]>('systems', []);

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
        isSubsystem: currentSystem?.isSubsystem || false,
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
    }
}

export const removeSystem = (id: string) => {
    const sysIndex = get(systems).findIndex(s => s.id === id);

    if (sysIndex !== -1) {
        systems.update((systems) => {
            systems.splice(sysIndex, 1);
            return systems;
        });
    }
}

export const cloneSystem = (id: string) => {
    const system = getSystem(id);
    if (system) {
        const newSystem = _.cloneDeep(system);
        newSystem.id = generateId(get(systems).map(s => s.id));
        newSystem.name = `Copy of ${newSystem.name}`;
        systems.update((systems) => {
            systems.push(newSystem);
            return systems;
        });
    }
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
            requirements: get(currentReqs)
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

export const createSubsystem = (parentSystemId: string, parentNodeId: string): SystemType => {
    const subsystem = createSystem();
    subsystem.name = `Subsystem of ${get(currentSystemMeta).name}`;

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
        isSubsystem: true,
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