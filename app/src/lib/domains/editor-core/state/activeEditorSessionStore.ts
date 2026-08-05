import type { Node, Edge } from '@xyflow/svelte';
import { writable } from 'svelte/store';
import type {
    ItemDefinition,
    PackageTemplate,
    PartDefinition,
    RequirementType,
    SystemMetaType
} from '$lib/types/types';
import persistentStore from '$lib/stores/persistentStore';

export const notification = writable<import('$lib/types/types').NotificationType | null>(null);
export const isAddingRequirement = writable<boolean>(false);

export const currentSystemMeta = persistentStore<SystemMetaType>(
    'currentSystemMeta',
    { name: '', date: '', id: '' }
);
export const currentNodes = persistentStore<Node[]>('currentNodes', []);
export const currentEdges = persistentStore<Edge[]>('currentEdges', []);
export const currentReqs = persistentStore<RequirementType[]>('currentReqs', []);

export const customDataTypes = persistentStore<string[]>('customDataTypes', []);
export const customVSSoVariables = persistentStore<string[]>('customVSSoVariables', []);

export const currentPartDefinitions = persistentStore<PartDefinition[]>('partDefinitions', []);
export const currentItemDefinitions = persistentStore<ItemDefinition[]>('itemDefinitions', []);
export const currentPackages = persistentStore<PackageTemplate[]>('packages', []);
