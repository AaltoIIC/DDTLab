import { get } from 'svelte/store';
import { currentNodes, currentEdges, currentItemDefinitions, currentPackages, currentPartDefinitions, currentReqs, currentSystemMeta } from '$lib/domains/editor-core/state/activeEditorSessionStore';
import { systems, getSystem, saveSystem } from '$lib/domains/system/state/systemCatalogStore';
import { generateElementName } from '$lib/shared/validation/nameValidation';

export function nameElement(type: 'component' | 'subsystem'): string {
    return generateElementName(
        type,
        get(currentNodes).map((element) => String(element.data.name ?? '')),
        get(systems).map((system) => system.name)
    );
}

export function selectNode(nodeId: string): void {
    currentNodes.update((nodes) =>
        nodes.map((node) => ({
            ...node,
            selected: node.id === nodeId
        }))
    );
}

export function saveCurrentSystem(): void {
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
        sourceConceptSystemId: currentSystem?.sourceConceptSystemId || null,
        sourceConceptSystemName: currentSystem?.sourceConceptSystemName || null,
        sourceAnalysisRequestIds: currentSystem?.sourceAnalysisRequestIds || [],
        stage: currentSystem?.stage || 'design'
    });
}
