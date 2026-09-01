import { describe, expect, it } from 'vitest';
import {
  ModelRepository,
  addPartDefinition,
  addPartUsage,
  createDocument
} from '$lib/concept-stage/sysml';

describe('ModelRepository (Phase 2)', () => {
  it('reads and creates elements without exposing mutable repository state', () => {
    const document = createDocument('Vehicle');
    const repository = new ModelRepository(document);
    const definition = addPartDefinition(document, 'Motor');
    const result = repository.create(definition);

    expect(result.ok).toBe(true);
    expect(repository.getElement(definition.id)?.name).toBe('Motor');

    const snapshot = repository.read();
    snapshot.elements[definition.id].name = 'Changed outside repository';
    expect(repository.getElement(definition.id)?.name).toBe('Motor');
  });

  it('rejects duplicate ids and dangling references without mutation', () => {
    const document = createDocument('Vehicle');
    const repository = new ModelRepository(document);
    const definition = addPartDefinition(document, 'Motor');
    expect(repository.create(definition).ok).toBe(true);

    const duplicate = repository.create(definition);
    expect(duplicate.ok).toBe(false);
    expect(duplicate.diagnostics[0].ruleId).toBe('REPO004-duplicate-id');

    const usage = addPartUsage(document, 'motorA', definition.id);
    const invalid = { ...usage, definitionId: 'missing-definition' };
    const rejected = repository.create(invalid);
    expect(rejected.ok).toBe(false);
    expect(rejected.diagnostics[0].ruleId).toBe('WF006-no-dangling-refs');
    expect(repository.getElement(usage.id)).toBeUndefined();
  });

  it('rejects deletion when references exist', () => {
    const source = createDocument('Vehicle');
    const definition = addPartDefinition(source, 'Motor');
    const usage = addPartUsage(source, 'motorA', definition.id);
    const repository = new ModelRepository(createDocument('Vehicle'));
    expect(repository.create(definition).ok).toBe(true);
    expect(repository.create(usage).ok).toBe(true);

    const rejected = repository.delete(definition.id);
    expect(rejected.ok).toBe(false);
    expect(rejected.diagnostics[0].ruleId).toBe('REPO002-referential-integrity');
    expect(repository.getElement(definition.id)).toBeDefined();
  });

  it('does not allow owner changes through a plain update', () => {
    const source = createDocument('Vehicle');
    const packageElement = source.root;
    const definition = addPartDefinition(source, 'Motor');
    const repository = new ModelRepository(source);

    const result = repository.update(definition.id, { ownerId: packageElement.id });
    expect(result.ok).toBe(false);
    expect(result.diagnostics[0].ruleId).toBe('REPO005-owner-immutable');
  });

  it('notifies subscribers and supports unsubscribe', () => {
    const repository = new ModelRepository(createDocument('Vehicle'));
    const changes: string[] = [];
    const unsubscribe = repository.subscribe((change) => changes.push(change.type));
    const definition = addPartDefinition(createDocument('Vehicle'), 'Motor');

    repository.create(definition);
    unsubscribe();
    repository.update(definition.id, { name: 'ElectricMotor' });

    expect(changes).toEqual(['create']);
  });

  it('rolls back a failed transaction and commits a successful one', () => {
    const repository = new ModelRepository(createDocument('Vehicle'));
    const definition = addPartDefinition(createDocument('Vehicle'), 'Motor');

    const failed = repository.transaction((transaction) => {
      transaction.create(definition);
      throw new Error('abort');
    });
    expect(failed.ok).toBe(false);
    expect(repository.getElement(definition.id)).toBeUndefined();

    const committed = repository.transaction((transaction) => {
      transaction.create(definition);
      return definition.id;
    });
    expect(committed.ok).toBe(true);
    expect(committed.value).toBe(definition.id);
    expect(repository.serializeReadBack().elements[definition.id].name).toBe('Motor');
  });
});
