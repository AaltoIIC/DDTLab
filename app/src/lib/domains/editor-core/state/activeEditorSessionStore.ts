import type { Node, Edge } from '@xyflow/svelte';
import { get, writable } from 'svelte/store';
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

/**
 * Saved-package list ↔ canvas-node binding helpers (Phase 3). Each canvas
 * package node may own at most one saved entry: saving a package upserts the
 * entry keyed by the canvas node id (`canvasNodeId`), so re-saving never
 * duplicates and the entry is discoverable from either side.
 */

/** Find the saved package entry bound to a canvas package node, if any. */
export function packageEntryForCanvasNode(canvasNodeId: string): PackageTemplate | undefined {
    return get(currentPackages).find(
        (entry) => entry.canvasNodeId === canvasNodeId || entry.id === canvasNodeId
    );
}

/** Whether a canvas package node currently has a saved entry (saved state). */
export function isCanvasNodeSaved(canvasNodeId: string): boolean {
    return packageEntryForCanvasNode(canvasNodeId) !== undefined;
}

/**
 * Save = upsert the entry bound to `canvasNodeId`: create it when missing,
 * otherwise refresh it in place (name, description, snapshot, timestamps).
 * The entry id is deterministic from the canvas node (`pkg-<canvasNodeId>`)
 * so the binding survives system save/reload without extra state. Never
 * duplicates — the single saved entry for this canvas package node.
 */
export function upsertPackageEntryForCanvasNode(
    canvasNodeId: string,
    entry: Omit<PackageTemplate, 'id' | 'createdAt' | 'updatedAt'>
): PackageTemplate {
    const existing = packageEntryForCanvasNode(canvasNodeId);
    const now = new Date().toISOString();
    const entryId = existing?.id ?? `pkg-${canvasNodeId}`;
    const next: PackageTemplate = {
        ...entry,
        id: entryId,
        canvasNodeId,
        createdAt: existing?.createdAt ?? now,
        updatedAt: now
    };
    currentPackages.update((entries) => {
        const withoutExisting = entries.filter(
            (candidate) => candidate.id !== entryId && candidate.canvasNodeId !== canvasNodeId
        );
        return [...withoutExisting, next];
    });
    return next;
}

/** Remove the saved entry(ies) bound to a canvas package node (if any). */
export function removePackageEntryForCanvasNode(canvasNodeId: string): void {
    currentPackages.update((entries) =>
        entries.filter(
            (entry) => entry.canvasNodeId !== canvasNodeId && entry.id !== canvasNodeId
        )
    );
}

/** Find the canvas package node bound to a saved entry (by its id). */
export function canvasNodeIdForPackageEntry(entryId: string): string | undefined {
    return get(currentPackages).find((entry) => entry.id === entryId)?.canvasNodeId;
}

/** Rename the saved entry bound to a canvas node (canvas rename sync). */
export function renamePackageEntryForCanvasNode(canvasNodeId: string, name: string): void {
    currentPackages.update((entries) =>
        entries.map((entry) =>
            entry.canvasNodeId === canvasNodeId || entry.id === canvasNodeId
                ? { ...entry, name, updatedAt: new Date().toISOString() }
                : entry
        )
    );
}
