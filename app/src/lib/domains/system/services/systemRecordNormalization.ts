export type SystemStage = 'concept' | 'design';

export interface SystemRecordLike {
    stage?: SystemStage;
    requirements?: unknown[];
    partDefinitions?: unknown[];
    itemDefinitions?: unknown[];
    packages?: unknown[];
}

export function cloneSystemName(
    originalName: string,
    namesInCurrentSession: string[],
    existingSystemNames: string[]
): string {
    const allNames = [...namesInCurrentSession, ...existingSystemNames];
    let name = `Copy of ${originalName}`;
    let suffix = 2;
    while (allNames.includes(name)) {
        name = `Copy of ${originalName} (${suffix})`;
        suffix += 1;
    }
    return name;
}

export function normalizeSystemRecord<T extends SystemRecordLike>(system: T): T {
    return {
        ...system,
        stage: system.stage || 'design',
        requirements: system.requirements || [],
        partDefinitions: system.partDefinitions || [],
        itemDefinitions: system.itemDefinitions || [],
        packages: system.packages || []
    } as T;
}
