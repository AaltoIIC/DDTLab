import { describe, expect, it, vi } from 'vitest';

// The catalog metadata functions are pure, but their current compatibility
// module also imports the legacy catalog store. Mock that boundary so unit
// tests do not initialize the browser-facing store graph.
vi.mock('$lib/stores/stores.svelte', () => ({
  ckanSites: { subscribe: () => () => {} }
}));
import { appendHistoryCursor, redoHistoryIndex, undoHistoryIndex } from '$lib/editor-core/history/historyTransitions';
import { cloneSystemName, normalizeSystemRecord } from '$lib/domains/system/services/systemRecordNormalization';
import { generateElementName, generateName, isNameValid, validateName, MAX_NAME_LENGTH, truncateName } from '$lib/shared/validation/nameValidation';
import { generateId } from '$lib/shared/identifiers';
import { checkCompatibility } from '$lib/concept-stage/interfaces/compatibility';
import { ensureUniqueName, sanitizeXMLName } from '$lib/exporters/ssd/mappings';
import { createValidationReport, validateConnectorCompatibility, validateXMLName } from '$lib/exporters/ssd/validator';
import { parseDcatTitle, buildDcatOpenTorsionMetadata } from '$lib/fmi/dcatCatalogApi';

describe('editor history transitions', () => {
  it('retains the newest-entry sentinel while appending and navigating', () => {
    expect(appendHistoryCursor({ currentIndex: -1, dataLength: 2 })).toEqual({ currentIndex: -1, dataLength: 3 });
    expect(undoHistoryIndex({ currentIndex: -1, dataLength: 3 })).toBe(1);
    expect(undoHistoryIndex({ currentIndex: 1, dataLength: 3 })).toBe(0);
    expect(redoHistoryIndex({ currentIndex: 0, dataLength: 3 })).toBe(1);
    expect(redoHistoryIndex({ currentIndex: 1, dataLength: 3 })).toBe(2);
    expect(redoHistoryIndex({ currentIndex: -1, dataLength: 3 })).toBeNull();
  });
});

describe('system compatibility contracts', () => {
  it('normalizes legacy records without mutating the input', () => {
    const legacy = { stage: undefined, requirements: undefined, partDefinitions: undefined, itemDefinitions: undefined, packages: undefined };
    const normalized = normalizeSystemRecord(legacy);
    expect(normalized).toMatchObject({ stage: 'design', requirements: [], partDefinitions: [], itemDefinitions: [], packages: [] });
    expect(legacy).toEqual({ stage: undefined, requirements: undefined, partDefinitions: undefined, itemDefinitions: undefined, packages: undefined });
  });

  it('keeps clone names unique across the active session and catalog', () => {
    expect(cloneSystemName('Ship', ['Copy of Ship'], ['Ship'])).toBe('Copy of Ship (2)');
    expect(cloneSystemName('Ship', [], ['Ship'])).toBe('Copy of Ship');
  });
});

describe('shared naming and identifier contracts', () => {
  it('preserves validation and collision semantics', () => {
    expect(isNameValid('Valid Name')).toBe(true);
    expect(isNameValid('invalid/name')).toBe(false);
    expect(validateName('Old', 'New', ['new'])).toBe(true);
    expect(validateName('Old', 'New', ['Other'])).toBe(false);
    expect(generateName('New System', ['New System', 'New System (2)'])).toBe('New System (3)');
    expect(generateElementName('subsystem', ['New Subsystem'], [])).toBe('New Subsystem (2)');
  });

  it('caps names at MAX_NAME_LENGTH characters', () => {
    expect(MAX_NAME_LENGTH).toBe(40);
    expect(truncateName('short')).toBe('short');
    expect(truncateName('x'.repeat(60))).toBe('x'.repeat(40));
    expect(truncateName('x'.repeat(40))).toBe('x'.repeat(40));
  });

  it('generates a six-character id not present in the supplied ids', () => {
    const id = generateId(['aaaaaa']);
    expect(id).toMatch(/^[a-z0-9]{6}$/);
    expect(id).not.toBe('aaaaaa');
  });
});

describe('concept connection compatibility', () => {
  it('handles untyped, same-category, and incompatible ports', () => {
    expect(checkCompatibility({ id: 'a', name: 'a' }, { id: 'b', name: 'b' }).status).toBe('direct');
    expect(checkCompatibility({ id: 'a', name: 'a', interfaceType: 'hydraulic-3000psi' }, { id: 'b', name: 'b', interfaceType: 'hydraulic-3000psi' }).status).toBe('direct');
    expect(checkCompatibility({ id: 'a', name: 'a', interfaceType: 'hydraulic-3000psi' }, { id: 'b', name: 'b', interfaceType: 'ac-230v-50hz' }).status).toBe('incompatible');
  });
});

describe('SSD contracts', () => {
  it('sanitizes and uniquifies XML names', () => {
    expect(sanitizeXMLName('Main Pump')).toBe('Main_Pump');
    expect(validateXMLName('Main_Pump')).toBe(true);
    expect(validateXMLName('xmlModel')).toBe(false);
    const names = new Set<string>();
    expect(ensureUniqueName('Main Pump', names)).toBe('Main_Pump');
    expect(ensureUniqueName('Main Pump', names)).toBe('Main_Pump_1');
  });

  it('reports invalid connections and compatible connector direction', () => {
    const context = { errors: [], warnings: [], usedUnits: new Set<string>(), componentMap: new Map(), systemMap: new Map() } as any;
    expect(validateConnectorCompatibility({ name: 'out', type: 'output' } as any, { name: 'in', type: 'input' } as any, context)).toBe(true);
    expect(validateConnectorCompatibility({ name: 'in', type: 'input' } as any, { name: 'out', type: 'output' } as any, context)).toBe(false);
    expect(createValidationReport(context)).toContain('error(s) found');
  });
});

describe('catalog metadata contracts', () => {
  it('parses physical metadata and generates OpenTorsion fields', () => {
    const metadata = parseDcatTitle('Wind Turbine 250kW 3.75e+07');
    expect(metadata.componentType).toBe('turbine');
    expect(metadata.powerRating).toBe(250);
    expect(metadata.parameterValue).toBe(3.75e7);
    expect(buildDcatOpenTorsionMetadata(metadata)).toEqual([
      { key: 'rotorInertia', value: '37500000' },
      { key: 'ratedPower', value: '250' }
    ]);
  });
});
