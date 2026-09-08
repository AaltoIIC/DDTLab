import { cloneDocument } from '../model/immutable';
import { getQualifiedName } from '../model/namespaces';
import { registerOwnedElement } from '../model/ownership';
import type { AnySysmlElement, ElementId, SysmlDocument } from '../model/elements';
import { errorDiagnostic, type Diagnostic, type MutationResult } from './diagnostics';

export interface RepositoryChange {
  type: 'create' | 'update' | 'delete' | 'transaction';
  elementId?: ElementId;
  document: SysmlDocument;
}

export type RepositoryListener = (change: RepositoryChange) => void;

export interface CreateOptions {
  /** Optional owner id; null means the document root. */
  ownerId?: ElementId | null;
}

export type ElementUpdate = Partial<Omit<AnySysmlElement, 'id' | 'metaclass'>>;

/**
 * Repository-owned semantic model boundary. Mutations are performed on a
 * cloned candidate, validated, and committed only on success. Subscribers
 * receive a cloned read-only snapshot and cannot mutate repository state.
 */
export class ModelRepository {
  private document: SysmlDocument;
  private readonly listeners = new Set<RepositoryListener>();

  public constructor(initialDocument: SysmlDocument) {
    const candidate = cloneDocument(initialDocument);
    const diagnostics = this.validateDocument(candidate);
    if (diagnostics.some((diagnostic) => diagnostic.severity === 'error')) {
      throw new Error(diagnostics.map((diagnostic) => diagnostic.message).join('; '));
    }
    this.document = candidate;
  }

  public read(): SysmlDocument {
    return cloneDocument(this.document);
  }

  public getElement(id: ElementId): AnySysmlElement | undefined {
    const element = this.document.elements[id];
    return element ? cloneDocument({ ...this.document, elements: { [id]: element } }).elements[id] : undefined;
  }

  public getByQualifiedName(qualifiedName: string): AnySysmlElement | undefined {
    const element = Object.values(this.document.elements).find(
      (candidate) => getQualifiedName(this.document, candidate.id) === qualifiedName
    );
    return element ? cloneDocument({ ...this.document, elements: { [element.id]: element } }).elements[element.id] : undefined;
  }

  public list(ownerId: ElementId | null = null): AnySysmlElement[] {
    const ids = ownerId === null
      ? this.document.root.memberIds
      : this.ownedIds(ownerId);
    return ids.map((id) => this.getElement(id)).filter((element): element is AnySysmlElement => element !== undefined);
  }

  public subscribe(listener: RepositoryListener): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  public create(element: AnySysmlElement): MutationResult<AnySysmlElement> {
    const candidate = cloneDocument(this.document);
    const diagnostics = this.validateCreate(candidate, element);
    if (diagnostics.length > 0) return { ok: false, diagnostics };

    candidate.elements[element.id] = cloneDocument({ ...candidate, elements: { [element.id]: element } }).elements[element.id];
    registerOwnedElement(candidate, element.id, element.ownerId);
    this.commit(candidate, { type: 'create', elementId: element.id, document: candidate });
    return { ok: true, value: this.getElement(element.id), diagnostics: [] };
  }

  public update(id: ElementId, patch: ElementUpdate): MutationResult<AnySysmlElement> {
    const existing = this.document.elements[id];
    if (!existing) return { ok: false, diagnostics: [errorDiagnostic('WF006-no-dangling-refs', `Element ${id} does not exist`, id)] };
    if ('ownerId' in patch && patch.ownerId !== existing.ownerId) {
      return { ok: false, diagnostics: [errorDiagnostic('REPO005-owner-immutable', 'Changing ownership requires a dedicated move operation', id)] };
    }
    const candidate = cloneDocument(this.document);
    candidate.elements[id] = { ...candidate.elements[id], ...patch } as AnySysmlElement;
    const diagnostics = this.validateDocument(candidate);
    if (diagnostics.length > 0) return { ok: false, diagnostics };
    this.commit(candidate, { type: 'update', elementId: id, document: candidate });
    return { ok: true, value: this.getElement(id), diagnostics: [] };
  }

  public delete(id: ElementId): MutationResult<void> {
    if (!this.document.elements[id]) {
      return { ok: false, diagnostics: [errorDiagnostic('WF006-no-dangling-refs', `Element ${id} does not exist`, id)] };
    }
    const references = this.findReferences(this.document, id);
    if (references.length > 0) {
      return {
        ok: false,
        diagnostics: [errorDiagnostic('REPO002-referential-integrity', `Cannot delete ${id}; referenced by ${references.join(', ')}`, id)]
      };
    }

    const candidate = cloneDocument(this.document);
    const ownerId = candidate.elements[id].ownerId;
    delete candidate.elements[id];
    removeOwnership(candidate, id, ownerId);
    this.commit(candidate, { type: 'delete', elementId: id, document: candidate });
    return { ok: true, diagnostics: [] };
  }

  /**
   * Re-own `id` under `newOwnerId` (null = the document root) — the dedicated
   * ownership-changing operation (plain `update` rejects `ownerId` patches,
   * REPO005). Used by the package wrap/unwrap flow: wrapping moves canvas
   * usages under a saved Package; unwrapping moves them back to the package's
   * owner before the Package element itself is deleted.
   *
   * The move is atomic and convergent: the element leaves its current owner's
   * membership list and is appended to the new owner's list; name uniqueness
   * in the destination namespace (WF001) is enforced by the full-document
   * validation, so a conflicting move is rejected and rolled back.
   */
  public move(id: ElementId, newOwnerId: ElementId | null): MutationResult<void> {
    const existing = this.document.elements[id];
    if (!existing) {
      return { ok: false, diagnostics: [errorDiagnostic('WF006-no-dangling-refs', `Element ${id} does not exist`, id)] };
    }
    if (newOwnerId === id) {
      return { ok: false, diagnostics: [errorDiagnostic('REPO006-invalid-move', 'An element cannot own itself', id)] };
    }
    if (newOwnerId !== null) {
      const owner = this.document.elements[newOwnerId];
      if (!owner) {
        return { ok: false, diagnostics: [errorDiagnostic('WF003-ownership', `Owner ${newOwnerId} does not exist`, id)] };
      }
      if (!['package', 'partDefinition', 'itemDefinition', 'partUsage', 'itemUsage'].includes(owner.metaclass)) {
        return { ok: false, diagnostics: [errorDiagnostic('WF003-ownership', `${owner.metaclass} cannot own members`, id)] };
      }
    }

    // A move both removes the element from its current owner's list and
    // registers it under the new one, so it must be atomic. The transaction
    // path validates the final document (name uniqueness, dangling refs) and
    // rolls back on any conflict.
    return this.transaction((transaction) => {
      transaction.reown(id, newOwnerId);
    });
  }


  public transaction<T>(operation: (repository: TransactionRepository) => T): MutationResult<T> {
    const candidate = cloneDocument(this.document);
    const working = new TransactionRepository(candidate);
    try {
      const value = operation(working);
      const diagnostics = this.validateDocument(candidate);
      if (diagnostics.length > 0) return { ok: false, diagnostics };
      this.commit(candidate, { type: 'transaction', document: candidate });
      return { ok: true, value, diagnostics: [] };
    } catch (error) {
      return {
        ok: false,
        diagnostics: [errorDiagnostic('REPO003-transaction-rollback', error instanceof Error ? error.message : String(error))]
      };
    }
  }

  /** Serialize and read back the exact committed document. */
  public serializeReadBack(): SysmlDocument {
    return JSON.parse(JSON.stringify(this.document)) as SysmlDocument;
  }

  private commit(document: SysmlDocument, change: RepositoryChange): void {
    this.document = cloneDocument(document);
    const snapshot = this.read();
    for (const listener of this.listeners) listener({ ...change, document: snapshot });
  }

  private ownedIds(ownerId: ElementId): ElementId[] {
    const owner = this.document.elements[ownerId];
    if (!owner) return [];
    if (owner.metaclass === 'package') return owner.memberIds;
    if (owner.metaclass === 'partDefinition' || owner.metaclass === 'itemDefinition') return owner.ownedUsageIds;
    if (owner.metaclass === 'partUsage' || owner.metaclass === 'itemUsage') return owner.ownedUsageIds;
    return [];
  }

  private validateCreate(document: SysmlDocument, element: AnySysmlElement): Diagnostic[] {
    if (document.elements[element.id]) return [errorDiagnostic('REPO004-duplicate-id', `Element id ${element.id} already exists`, element.id)];
    if (element.ownerId !== null) {
      const owner = document.elements[element.ownerId];
      if (!owner) return [errorDiagnostic('WF003-ownership', `Owner ${element.ownerId} does not exist`, element.id)];
      if (!['package', 'partDefinition', 'itemDefinition', 'partUsage', 'itemUsage'].includes(owner.metaclass)) {
        return [errorDiagnostic('WF003-ownership', `${owner.metaclass} cannot own members`, element.id)];
      }
    }
    return this.validateElementReferences(document, element);
  }

  private validateDocument(document: SysmlDocument): Diagnostic[] {
    const diagnostics: Diagnostic[] = [];
    const names = new Map<string, ElementId>();
    for (const element of Object.values(document.elements)) {
      const key = `${element.ownerId ?? document.root.id}::${element.name}`;
      const previous = names.get(key);
      if (previous) diagnostics.push(errorDiagnostic('WF001-name-uniqueness', `Duplicate member name ${element.name}`, element.id));
      names.set(key, element.id);
      diagnostics.push(...this.validateElementReferences(document, element));
    }
    return diagnostics;
  }

  private validateElementReferences(document: SysmlDocument, element: AnySysmlElement): Diagnostic[] {
    const refs: ElementId[] = [];
    if ('definitionId' in element && element.definitionId !== null) refs.push(element.definitionId);
    if ('connectionDefinitionId' in element && element.connectionDefinitionId !== null) refs.push(element.connectionDefinitionId);
    if ('flowDefinitionId' in element && element.flowDefinitionId !== null) refs.push(element.flowDefinitionId);
    if ('endA' in element) refs.push(element.endA);
    if ('endB' in element) refs.push(element.endB);
    if ('sourceEnd' in element) refs.push(element.sourceEnd);
    if ('targetEnd' in element) refs.push(element.targetEnd);
    if ('endIds' in element) refs.push(...element.endIds);
    if ('memberElementId' in element) refs.push(element.memberElementId);
    for (const ref of refs) {
      if (!document.elements[ref]) return [errorDiagnostic('WF006-no-dangling-refs', `Reference ${ref} from ${element.id} does not resolve`, element.id)];
    }
    if (element.ownerId !== null && !document.elements[element.ownerId]) {
      return [errorDiagnostic('WF003-ownership', `Owner ${element.ownerId} from ${element.id} does not resolve`, element.id)];
    }
    return [];
  }

  private findReferences(document: SysmlDocument, targetId: ElementId): ElementId[] {
    return Object.values(document.elements)
      .filter((element) => this.references(element).includes(targetId))
      .map((element) => element.id);
  }

  private references(element: AnySysmlElement): ElementId[] {
    return referenceIds(element);
  }
}

function ownedIdsFrom(document: SysmlDocument, ownerId: ElementId): ElementId[] {
  const owner = document.elements[ownerId];
  if (!owner) return [];
  if (owner.metaclass === 'package') return owner.memberIds;
  if (
    owner.metaclass === 'partDefinition' ||
    owner.metaclass === 'itemDefinition' ||
    owner.metaclass === 'partUsage' ||
    owner.metaclass === 'itemUsage'
  ) return owner.ownedUsageIds;
  return [];
}

function removeOwnership(document: SysmlDocument, id: ElementId, ownerId: ElementId | null): void {
  const ids = ownerId === null ? document.root.memberIds : ownedIdsFrom(document, ownerId);
  const index = ids.indexOf(id);
  if (index >= 0) ids.splice(index, 1);
}

function referenceIds(element: AnySysmlElement): ElementId[] {
  const refs: ElementId[] = [];
    if ('definitionId' in element && element.definitionId !== null) refs.push(element.definitionId);
    if ('connectionDefinitionId' in element && element.connectionDefinitionId !== null) refs.push(element.connectionDefinitionId);
    if ('flowDefinitionId' in element && element.flowDefinitionId !== null) refs.push(element.flowDefinitionId);
    if ('endA' in element) refs.push(element.endA);
    if ('endB' in element) refs.push(element.endB);
    if ('sourceEnd' in element) refs.push(element.sourceEnd);
    if ('targetEnd' in element) refs.push(element.targetEnd);
    if ('endIds' in element) refs.push(...element.endIds);
    if ('memberElementId' in element) refs.push(element.memberElementId);
    return refs;
  }

export class TransactionRepository {
  public constructor(private readonly document: SysmlDocument) {}

  public create(element: AnySysmlElement): void {
    if (this.document.elements[element.id]) throw new Error(`Element id ${element.id} already exists`);
    if (element.ownerId !== null && !this.document.elements[element.ownerId]) throw new Error(`Owner ${element.ownerId} does not exist`);
    const refs = referenceIds(element);
    for (const ref of refs) {
      if (!this.document.elements[ref]) throw new Error(`Reference ${ref} from ${element.id} does not resolve`);
    }
    this.document.elements[element.id] = element;
    if (element.ownerId === null) this.document.root.memberIds.push(element.id);
    else {
      const owner = this.document.elements[element.ownerId];
      if (!owner) throw new Error(`Owner ${element.ownerId} does not exist`);
      if (owner.metaclass === 'package') owner.memberIds.push(element.id);
      else if (
        owner.metaclass === 'partDefinition' ||
        owner.metaclass === 'itemDefinition' ||
        owner.metaclass === 'partUsage' ||
        owner.metaclass === 'itemUsage'
      ) owner.ownedUsageIds.push(element.id);
      else throw new Error(`${owner.metaclass} cannot own members`);
    }
  }

  /** Shallow delete mirroring `ModelRepository.delete`, without emitting. */
  public delete(id: ElementId): void {
    if (!this.document.elements[id]) throw new Error(`Element ${id} does not exist`);
    const ownerId = this.document.elements[id].ownerId;
    delete this.document.elements[id];
    removeOwnership(this.document, id, ownerId);
  }

  /**
   * Re-own `id` under `newOwnerId` inside the active transaction (the
   * non-emitting counterpart of `ModelRepository.move`). Name uniqueness and
   * reference integrity are enforced by the final transaction validation.
   */
  public reown(id: ElementId, newOwnerId: ElementId | null): void {
    const element = this.document.elements[id];
    if (!element) throw new Error(`Element ${id} does not exist`);
    if (newOwnerId === id) throw new Error('An element cannot own itself');
    if (newOwnerId !== null) {
      const owner = this.document.elements[newOwnerId];
      if (!owner) throw new Error(`Owner ${newOwnerId} does not exist`);
      if (!['package', 'partDefinition', 'itemDefinition', 'partUsage', 'itemUsage'].includes(owner.metaclass)) {
        throw new Error(`${owner.metaclass} cannot own members`);
      }
    }
    if (element.ownerId === newOwnerId) return;
    const oldOwnerId = element.ownerId;
    removeOwnership(this.document, id, oldOwnerId);
    element.ownerId = newOwnerId;
    if (newOwnerId === null) this.document.root.memberIds.push(id);
    else {
      const owner = this.document.elements[newOwnerId];
      if (owner.metaclass === 'package') owner.memberIds.push(id);
      else if (
        owner.metaclass === 'partDefinition' ||
        owner.metaclass === 'itemDefinition' ||
        owner.metaclass === 'partUsage' ||
        owner.metaclass === 'itemUsage'
      ) owner.ownedUsageIds.push(id);
      else throw new Error(`${owner.metaclass} cannot own members`);
    }
  }
}
