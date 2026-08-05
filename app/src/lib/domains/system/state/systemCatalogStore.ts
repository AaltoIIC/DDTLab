import type { SystemStage, SystemType } from '$lib/types/types';
import persistentStore from '$lib/stores/persistentStore';
import { get } from 'svelte/store';
import { generateId } from '$lib/shared/identifiers';
import { generateName } from '$lib/shared/validation/nameValidation';
import { cloneSystemName, normalizeSystemRecord } from '$lib/domains/system/services/systemRecordNormalization';
import _ from 'lodash';

export const systems = persistentStore<SystemType[]>('systems', []);

type PersistedSystem = Omit<SystemType, 'stage'> & { stage?: SystemStage };

// Legacy records are normalized when read or written. Avoid eagerly rewriting
// the catalog so merely opening the app does not alter older serialized records.

export function getSystem(id: string): SystemType | null {
    const system = get(systems).find((candidate) => candidate.id === id);
    return system ? _.cloneDeep(normalizeSystemRecord(system as PersistedSystem) as SystemType) : null;
}

export function createSystem(): SystemType {
    return {
        name: generateName('New System', get(systems).map((system) => system.name)),
        date: new Date().toISOString(),
        id: generateId(get(systems).map((system) => system.id)),
        nodes: [],
        edges: [],
        requirements: [],
        partDefinitions: [],
        itemDefinitions: [],
        packages: [],
        stage: 'design'
    };
}

export function saveSystem(system: SystemType): void {
    systems.update((storedSystems) => {
        const index = storedSystems.findIndex((storedSystem) => storedSystem.id === system.id);
        // Preserve the historical serialized shape exactly. Legacy records are
        // normalized only by getSystem when they enter domain logic.
        const nextSystem = _.cloneDeep(system);

        if (index === -1) {
            return [...storedSystems, nextSystem];
        }

        const nextSystems = [...storedSystems];
        nextSystems[index] = nextSystem;
        return nextSystems;
    });
}

export function removeSystem(id: string): void {
    function removeRecursively(targetId: string, storedSystems: SystemType[]): SystemType[] {
        const childIds = storedSystems
            .filter((system) => system.parentSystemId === targetId)
            .map((system) => system.id);
        const withoutChildren = childIds.reduce(
            (systemsAfterChild, childId) => removeRecursively(childId, systemsAfterChild),
            storedSystems
        );
        return withoutChildren.filter((system) => system.id !== targetId);
    }

    systems.update((storedSystems) => removeRecursively(id, storedSystems));
}

export function cloneSystem(id: string, namesInCurrentSession: string[] = []): SystemType | null {
    const system = getSystem(id);
    if (!system) return null;

    const clone = _.cloneDeep(system);
    clone.id = generateId(get(systems).map((storedSystem) => storedSystem.id));
    clone.name = cloneSystemName(
        clone.name,
        namesInCurrentSession,
        get(systems).map((storedSystem) => storedSystem.name)
    );
    saveSystem(clone);
    return clone;
}
