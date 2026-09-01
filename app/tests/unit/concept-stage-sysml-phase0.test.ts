import { describe, expect, it } from 'vitest';
import {
  METACLASS_KEYS,
  METACLASS_REGISTRY,
  UNVERIFIED_METACLASSES,
  assertUniquePrefixes,
  isSupportedMetaclass
} from '$lib/concept-stage/sysml/model';

describe('metaclass registry (Phase 0)', () => {
  it('gates supported vs unsupported metaclasses', () => {
    expect(isSupportedMetaclass('partUsage')).toBe(true);
    expect(isSupportedMetaclass('requirementUsage')).toBe(false);
    expect(isSupportedMetaclass('generalization')).toBe(false);
    expect(isSupportedMetaclass('')).toBe(false);
  });

  it('contains the documented concept-stage subset', () => {
    for (const key of [
      'package',
      'partDefinition',
      'partUsage',
      'itemDefinition',
      'itemUsage',
      'portDefinition',
      'portUsage',
      'attributeDefinition',
      'attributeUsage',
      'connectionUsage',
      'flowConnectionUsage',
      'bindingConnectorAsUsage',
      'comment'
    ] as const) {
      expect(METACLASS_KEYS).toContain(key);
    }
  });

  it('has unique id prefixes', () => {
    expect(() => assertUniquePrefixes()).not.toThrow();
  });

  it('reports unresolved normative mappings explicitly', () => {
    // FlowConnectionUsage is referenced by XMI comments but has no JSON @type.
    expect(UNVERIFIED_METACLASSES).toEqual(['flowConnectionUsage']);
    for (const key of UNVERIFIED_METACLASSES) {
      expect(METACLASS_REGISTRY[key].verified).toBe(false);
      expect(METACLASS_REGISTRY[key].xmiId).toBeNull();
    }
  });

  it('pins the serialized form of unresolvable metaclasses as data', () => {
    expect(METACLASS_REGISTRY.flowConnectionUsage.serializesAs).toBe('flowUsage');
    expect(METACLASS_REGISTRY.flowUsage.xmiId).toBe('Systems-Flows-FlowUsage');
  });

  it('verifies Comment against KerML.xmi', () => {
    expect(METACLASS_REGISTRY.comment.xmiId).toBe('Root-Annotations-Comment');
    expect(METACLASS_REGISTRY.comment.source).toBe('KerML.xmi');
    expect(METACLASS_REGISTRY.comment.attributes).toContain('body');
    expect(METACLASS_REGISTRY.comment.verified).toBe(true);
  });

  it('records normative ids and constraint names', () => {
    expect(METACLASS_REGISTRY.partUsage.xmiId).toBe('Systems-Parts-PartUsage');
    expect(METACLASS_REGISTRY.partUsage.constraints).toContain('validatePartUsagePartDefinition');
    expect(METACLASS_REGISTRY.portUsage.libraryBases.checkPortUsageSpecialization).toBe('Ports::ports');
  });
});
