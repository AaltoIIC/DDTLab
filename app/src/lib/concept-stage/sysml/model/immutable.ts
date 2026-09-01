import type { AnySysmlElement, ElementId, SysmlDocument } from './elements';

/** Clone the plain semantic model without retaining mutable nested references. */
export function cloneDocument(document: SysmlDocument): SysmlDocument {
  return JSON.parse(JSON.stringify(document)) as SysmlDocument;
}

/**
 * Apply a pure update to a cloned document. The original document is never
 * mutated, which keeps persistence, undo/redo, and repository transactions
 * straightforward for later phases.
 */
export function updateDocument(
  document: SysmlDocument,
  update: (draft: SysmlDocument) => void
): SysmlDocument {
  const draft = cloneDocument(document);
  update(draft);
  return draft;
}

export function updateElement<T extends AnySysmlElement>(
  document: SysmlDocument,
  id: ElementId,
  update: (element: T) => void
): SysmlDocument {
  return updateDocument(document, (draft) => {
    const element = draft.elements[id];
    if (!element) throw new Error(`Element ${id} does not exist`);
    update(element as T);
  });
}
