import type { ElementId } from '../model';

export interface PresentationEntry {
  position?: { x: number; y: number };
  width?: number;
  height?: number;
  color?: string;
  /**
   * Display-only label for a port chip (e.g. the legacy interface name). Not
   * semantic data — never emitted to interchange. Recomputed from the port
   * definition once the interface-catalog mapping (plan §9) is decided.
   */
  interfaceType?: string;
}

export type PresentationMap = Record<ElementId, PresentationEntry>;

export function createPresentationMap(): PresentationMap {
  return {};
}

export function getPresentation(map: PresentationMap, elementId: ElementId): PresentationEntry {
  return map[elementId] ?? {};
}

export function setPresentation(
  map: PresentationMap,
  elementId: ElementId,
  entry: PresentationEntry
): PresentationMap {
  return { ...map, [elementId]: { ...map[elementId], ...entry } };
}
