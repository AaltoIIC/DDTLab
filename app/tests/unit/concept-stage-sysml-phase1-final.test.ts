import { describe, expect, it } from 'vitest';
import {
  addItemDefinition,
  addItemUsage,
  addPackage,
  addPartDefinition,
  addPartUsage,
  addPortDefinition,
  addPortUsage,
  cloneDocument,
  createDocument,
  updateElement
} from '$lib/concept-stage/sysml/model';

describe('SysML model finalization (Phase 1)', () => {
  it('updates a cloned document without mutating the source', () => {
    const document = createDocument('Vehicle');
    const definition = addPartDefinition(document, 'Motor');
    const updated = updateElement(document, definition.id, (element) => {
      element.name = 'ElectricMotor';
    });

    expect(document.elements[definition.id].name).toBe('Motor');
    expect(updated.elements[definition.id].name).toBe('ElectricMotor');
    expect(updated.elements[definition.id]).not.toBe(document.elements[definition.id]);
  });

  it('deep-clones nested ownership arrays', () => {
    const document = createDocument('Vehicle');
    const definition = addPartDefinition(document, 'Motor');
    const clone = cloneDocument(document);
    clone.root.memberIds.push('synthetic-id');
    (clone.elements[definition.id] as typeof definition).ownedUsageIds.push('another-id');

    expect(document.root.memberIds).not.toContain('synthetic-id');
    expect(document.elements[definition.id]).not.toHaveProperty('ownedUsageIds', ['another-id']);
  });

  it('rejects missing or mismatched definition references', () => {
    const document = createDocument('Vehicle');
    expect(() => addPartUsage(document, 'motorA', 'missing-definition')).toThrow(/does not exist/);

    const portDefinition = addPortDefinition(document, 'PowerPort');
    expect(() => addPartUsage(document, 'motorA', portDefinition.id)).toThrow(/is not a partDefinition/);
  });

  it('generates unique prefixed ids for many same-metaclass elements', () => {
    const document = createDocument('Vehicle');
    const definition = addPartDefinition(document, 'Motor');
    const ids = new Set<string>();
    for (let i = 0; i < 100; i += 1) {
      const usage = addPartUsage(document, `motor${i}`, definition.id);
      ids.add(usage.id);
    }
    expect(ids.size).toBe(100);
    for (const id of ids) expect(id.startsWith('pu-')).toBe(true);
  });

  it('rejects missing owners and unsupported port ownership', () => {
    const document = createDocument('Vehicle');
    const portDefinition = addPortDefinition(document, 'PowerPort');
    expect(() => addPortUsage(document, 'power', portDefinition.id, 'missing-owner')).toThrow(/does not exist/);

    // Ports are features of part/item types: part definitions and item
    // usages (tanks, inlets) may own them; plain packages may not.
    const partDefinition = addPartDefinition(document, 'Motor');
    const typed = addPortUsage(document, 'power', portDefinition.id, partDefinition.id, 'in');
    expect(typed.ownerId).toBe(partDefinition.id);

    const itemUsage = addItemUsage(document, 'tank', addItemDefinition(document, 'Tank').id);
    const onItem = addPortUsage(document, 'fuel', portDefinition.id, itemUsage.id, 'out');
    expect(onItem.ownerId).toBe(itemUsage.id);

    const library = addPackage(document, 'Library');
    expect(() => addPortUsage(document, 'loose', portDefinition.id, library.id)).toThrow(/cannot own port/);
  });

  it('leaves the document untouched when construction fails', () => {
    const document = createDocument('Vehicle');
    const count = Object.keys(document.elements).length;

    expect(() => addPartUsage(document, 'motorA', 'missing-definition')).toThrow();
    expect(Object.keys(document.elements).length).toBe(count);

    const definition = addPartDefinition(document, 'Motor');
    const countAfter = Object.keys(document.elements).length;
    expect(() => addPartUsage(document, 'motorA', definition.id, 'missing-owner')).toThrow();
    expect(Object.keys(document.elements).length).toBe(countAfter);
  });

  it('derives id prefixes from the metaclass registry', () => {
    const document = createDocument('Vehicle');
    const definition = addPartDefinition(document, 'Motor');
    const usage = addPartUsage(document, 'motorA', definition.id);

    expect(definition.id.startsWith('pd-')).toBe(true);
    expect(usage.id.startsWith('pu-')).toBe(true);
  });
});
