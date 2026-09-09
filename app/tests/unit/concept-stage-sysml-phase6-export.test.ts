import { describe, it, expect } from 'vitest';
import { ModelRepository } from '$lib/concept-stage/sysml/repo';
import { createDocument, type AnySysmlElement, type SysmlDocument } from '$lib/concept-stage/sysml/model';
import { nextModelId } from '$lib/concept-stage/sysml/projection';
import {
  exportDocumentToKpar,
  zipKparArchive,
  emitDocumentTexts,
  escapeName,
  featureReferencePath,
  buildProjectJson,
  buildMetaJson,
  METAMODEL_URI,
  PROJECT_FILE,
  META_FILE
} from '$lib/concept-stage/sysml/export';
import { buildSemanticLibraryTemplate } from '$lib/concept-stage/sysml/session';
import { commercialVesselPowertrain } from '$lib/concept-stage/data/simpleComponentLibrary';
import JSZip from 'jszip';

/**
 * Phase 6 — `.kpar` interchange (plan §5 Phase 6).
 *
 * The textual emitter produces one `.sysml` file per top-level namespace in
 * the SysML v2 textual notation, and the exporter assembles the exact KerML
 * Clause 10 archive layout confirmed from the official `Systems-Library.kpar`
 * (project folder, `.sysml` files, `.project.json`, `.meta.json` with the
 * normative metamodel URI). Output is deterministic, presentation-only data
 * never reaches the semantic files, and invalid models cannot be exported.
 */

const FIXED_CREATED = '2026-09-09T00:00:00.000Z';

/* ── Kitchen-sink document builder (every metaclass the emitter supports) ── */

function createKitchenSinkDocument(): SysmlDocument {
  const repository = new ModelRepository(createDocument('Kitchen Sink'));
  const create = (element: AnySysmlElement): string => {
    const result = repository.create(element);
    if (!result.ok || !result.value) {
      throw new Error(`cannot create ${element.metaclass} ${element.name}: ${result.diagnostics.map((d) => d.message).join('; ')}`);
    }
    return result.value.id;
  };

  const definitions = create({
    id: nextModelId(repository, 'package'),
    metaclass: 'package',
    name: 'Definitions',
    ownerId: null,
    memberIds: []
  } as AnySysmlElement);

  const motor = create({
    id: nextModelId(repository, 'partDefinition'),
    metaclass: 'partDefinition',
    category: 'definition',
    name: 'Motor',
    ownerId: definitions,
    ownedUsageIds: [],
    attributeIds: []
  } as AnySysmlElement);
  const fuel = create({
    id: nextModelId(repository, 'itemDefinition'),
    metaclass: 'itemDefinition',
    category: 'definition',
    name: 'Fuel',
    ownerId: definitions,
    ownedUsageIds: [],
    attributeIds: []
  } as AnySysmlElement);
  const signal = create({
    id: nextModelId(repository, 'portDefinition'),
    metaclass: 'portDefinition',
    category: 'definition',
    name: 'Signal',
    ownerId: definitions,
    flowFeatureIds: []
  } as AnySysmlElement);
  const mass = create({
    id: nextModelId(repository, 'attributeDefinition'),
    metaclass: 'attributeDefinition',
    category: 'definition',
    name: 'mass',
    ownerId: definitions
  } as AnySysmlElement);

  const engineBlock = create({
    id: nextModelId(repository, 'partUsage'),
    metaclass: 'partUsage',
    category: 'usage',
    name: 'Engine Block',
    ownerId: null,
    definitionId: motor,
    ownedUsageIds: [],
    attributeIds: [],
    documentation: 'The main power plant.'
  } as AnySysmlElement);
  const shaftPort = create({
    id: nextModelId(repository, 'portUsage'),
    metaclass: 'portUsage',
    category: 'usage',
    name: 'shaft',
    ownerId: engineBlock,
    definitionId: signal,
    direction: 'out'
  } as AnySysmlElement);
  const fuelInPort = create({
    id: nextModelId(repository, 'portUsage'),
    metaclass: 'portUsage',
    category: 'usage',
    name: 'fuelIn',
    ownerId: engineBlock,
    definitionId: null,
    direction: 'in'
  } as AnySysmlElement);
  create({
    id: nextModelId(repository, 'attributeUsage'),
    metaclass: 'attributeUsage',
    category: 'usage',
    name: 'mass',
    ownerId: engineBlock,
    definitionId: mass,
    literal: 1200
  } as AnySysmlElement);
  create({
    id: nextModelId(repository, 'partUsage'),
    metaclass: 'partUsage',
    category: 'usage',
    name: 'Piston',
    ownerId: engineBlock,
    definitionId: motor,
    ownedUsageIds: [],
    attributeIds: []
  } as AnySysmlElement);

  const fuelTank = create({
    id: nextModelId(repository, 'itemUsage'),
    metaclass: 'itemUsage',
    category: 'usage',
    name: 'Fuel Tank',
    ownerId: null,
    definitionId: fuel,
    ownedUsageIds: []
  } as AnySysmlElement);
  const outPort = create({
    id: nextModelId(repository, 'portUsage'),
    metaclass: 'portUsage',
    category: 'usage',
    name: 'out',
    ownerId: fuelTank,
    definitionId: signal,
    direction: 'out'
  } as AnySysmlElement);
  const fillPort = create({
    id: nextModelId(repository, 'portUsage'),
    metaclass: 'portUsage',
    category: 'usage',
    name: 'fill',
    ownerId: fuelTank,
    definitionId: null,
    direction: 'in'
  } as AnySysmlElement);

  create({
    id: nextModelId(repository, 'connectionDefinition'),
    metaclass: 'connectionDefinition',
    category: 'definition',
    name: 'Shaft',
    ownerId: definitions,
    endIds: [shaftPort, fillPort],
    isSufficient: true
  } as AnySysmlElement);

  create({
    id: nextModelId(repository, 'flowUsage'),
    metaclass: 'flowUsage',
    category: 'relationship',
    name: 'fuelFlow',
    ownerId: null,
    sourceEnd: outPort,
    targetEnd: fuelInPort,
    flowDefinitionId: null
  } as AnySysmlElement);

  create({
    id: nextModelId(repository, 'connectionUsage'),
    metaclass: 'connectionUsage',
    category: 'relationship',
    name: 'driveShaft',
    ownerId: null,
    endA: shaftPort,
    endB: fillPort,
    connectionDefinitionId: null
  } as AnySysmlElement);

  create({
    id: nextModelId(repository, 'bindingConnectorAsUsage'),
    metaclass: 'bindingConnectorAsUsage',
    category: 'relationship',
    name: 'shaftBinding',
    ownerId: null,
    endA: shaftPort,
    endB: outPort
  } as AnySysmlElement);

  create({
    id: nextModelId(repository, 'comment'),
    metaclass: 'comment',
    category: 'relationship',
    name: 'engineNote',
    ownerId: null,
    body: 'A comment about the engine.',
    aboutIds: [engineBlock]
  } as AnySysmlElement);

  // Nested package inside Definitions — emitted inline in its owner's file.
  create({
    id: nextModelId(repository, 'package'),
    metaclass: 'package',
    name: 'Hidden',
    ownerId: definitions,
    memberIds: []
  } as AnySysmlElement);

  // Root-owned package — becomes its own .sysml file. It owns a usage so
  // cross-namespace feature references are exercised.
  const packages = create({
    id: nextModelId(repository, 'package'),
    metaclass: 'package',
    name: 'Packages',
    ownerId: null,
    memberIds: []
  } as AnySysmlElement);
  const pump = create({
    id: nextModelId(repository, 'partUsage'),
    metaclass: 'partUsage',
    category: 'usage',
    name: 'Pump',
    ownerId: packages,
    definitionId: null,
    ownedUsageIds: [],
    attributeIds: []
  } as AnySysmlElement);
  create({
    id: nextModelId(repository, 'portUsage'),
    metaclass: 'portUsage',
    category: 'usage',
    name: 'inlet',
    ownerId: pump,
    definitionId: null,
    direction: 'in'
  } as AnySysmlElement);

  return repository.read();
}

describe('textualEmitter', () => {
  it('escapes non-basic names and KerML keywords as restricted names', () => {
    expect(escapeName('motor')).toBe('motor');
    expect(escapeName('Engine Block')).toBe("'Engine Block'");
    expect(escapeName('it\'s')).toBe("'it\\'s'");
    expect(escapeName('part')).toBe("'part'"); // keyword
    expect(escapeName('_x1')).toBe('_x1');
  });

  it('emits one file per top-level namespace (root + root-owned packages)', () => {
    const document = createKitchenSinkDocument();
    const files = emitDocumentTexts(document);
    const names = files.map((file) => file.namespaceName).sort();
    expect(names).toEqual(['Definitions', 'Kitchen Sink', 'Packages']);
  });

  it('emits the golden kitchen-sink text', () => {
    const document = createKitchenSinkDocument();
    const files = emitDocumentTexts(document);
    const root = files.find((file) => file.namespaceName === 'Kitchen Sink');
    expect(root).toBeDefined();
    expect(root!.fileName).toBe('Kitchen Sink.sysml');
    expect(root!.text).toBe(`package 'Kitchen Sink' {
    doc
    /*
     * The main power plant.
     * A comment about the engine.
     */
    part 'Engine Block' : Definitions::Motor {
        port shaft : Definitions::Signal;
        port fuelIn;
        attribute mass : Definitions::mass = 1200;
        part Piston : Definitions::Motor;
    }
    item 'Fuel Tank' : Definitions::Fuel {
        port 'out' : Definitions::Signal;
        port fill;
    }
    flow fuelFlow from 'Fuel Tank'.'out' to 'Engine Block'.fuelIn;
    connection driveShaft connect 'Engine Block'.shaft to 'Fuel Tank'.fill;
    bind 'Engine Block'.shaft = 'Fuel Tank'.'out';
}
`);
  });

  it('emits the Definitions package file with definitions and inline nested package', () => {
    const document = createKitchenSinkDocument();
    const files = emitDocumentTexts(document);
    const definitions = files.find((file) => file.namespaceName === 'Definitions');
    expect(definitions).toBeDefined();
    expect(definitions!.fileName).toBe('Definitions.sysml');
    expect(definitions!.text).toBe(`package Definitions {
    part def Motor;
    item def Fuel;
    port def Signal;
    attribute def mass;
    connection def Shaft {
        end shaft : Definitions::Signal;
        end fill;
    }
    package Hidden;
}
`);
  });

  it('qualifies cross-namespace feature ends with `::` (KerML qualified names)', () => {
    const document = createKitchenSinkDocument();
    const ids = (name: string) =>
      Object.values(document.elements).find((element) => element.name === name)!.id;
    const shaftPortId = ids('shaft');
    const inletPortId = ids('inlet');
    const packagesNamespaceId = ids('Packages');
    const definitionsNamespaceId = ids('Definitions');

    // Root members are globally visible: no qualifier from any namespace.
    expect(featureReferencePath(document, shaftPortId, packagesNamespaceId)).toBe("'Engine Block'.shaft");
    // Same-namespace members need no qualifier either.
    expect(featureReferencePath(document, inletPortId, packagesNamespaceId)).toBe('Pump.inlet');
    // A sibling-package member needs the `::`-qualified reference.
    expect(featureReferencePath(document, inletPortId, definitionsNamespaceId)).toBe('Packages::Pump.inlet');
    // And from the root namespace the package member is qualified too.
    expect(featureReferencePath(document, inletPortId, null)).toBe('Packages::Pump.inlet');
  });

  it('emits flows with the `from … to` form and bindings with `=`, per decision 27', () => {
    const document = createKitchenSinkDocument();
    const root = emitDocumentTexts(document).find((file) => file.namespaceName === 'Kitchen Sink');
    expect(root!.text).toContain("flow fuelFlow from 'Fuel Tank'.'out' to 'Engine Block'.fuelIn;");
    expect(root!.text).toContain("bind 'Engine Block'.shaft = 'Fuel Tank'.'out';");
    expect(root!.text).toContain("connection driveShaft connect 'Engine Block'.shaft to 'Fuel Tank'.fill;");
  });

  it('never emits presentation-only data or port UI direction', () => {
    const template = commercialVesselPowertrain;
    expect(Object.keys(template.data.presentation).length).toBeGreaterThan(0); // fixture carries presentation
    const files = emitDocumentTexts(template.data.document);
    const allText = files.map((file) => file.text).join('\n');
    expect(allText).not.toContain('position');
    expect(allText).not.toContain('interfaceType');
    expect(allText).not.toContain('metadata');
    expect(allText).not.toContain('{ x:');
    // Port direction is presentation-only (decision 21): no `in`/`out` keywords
    // follow port names in the emitted usage text.
    expect(allText).not.toMatch(/port [^;\n{]+ (in|out);/);
  });
});

describe('archiveLayout', () => {
  it('builds the exact .project.json shape (name, version, usage[])', () => {
    expect(buildProjectJson({ name: 'Demo' })).toBe('{\n  "name": "Demo",\n  "version": "1.0.0",\n  "usage": []\n}');
    expect(
      buildProjectJson({
        name: 'Demo',
        version: '2.0.0',
        usage: [{ resource: 'https://www.omg.org/spec/KerML/20250201/Semantic-Library.kpar', versionConstraint: '1.0.0' }]
      })
    ).toBe('{\n  "name": "Demo",\n  "version": "2.0.0",\n  "usage": [\n    {\n      "resource": "https://www.omg.org/spec/KerML/20250201/Semantic-Library.kpar",\n      "versionConstraint": "1.0.0"\n    }\n  ]\n}');
  });

  it('builds the exact .meta.json shape with the normative metamodel URI', () => {
    expect(buildMetaJson({ index: { A: 'A.sysml' }, created: FIXED_CREATED })).toBe(
      `{\n  "index": {\n    "A": "A.sysml"\n  },\n  "created": "${FIXED_CREATED}",\n  "metamodel": "${METAMODEL_URI}"\n}`
    );
  });
});

describe('kparExport', () => {
  it('produces the Clause 10 archive structure for the kitchen-sink document', () => {
    const result = exportDocumentToKpar(createKitchenSinkDocument(), { created: FIXED_CREATED });
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    const { archive } = result;

    expect(archive.folderName).toBe('Kitchen Sink');
    const entries = Object.keys(archive.files).sort();
    expect(entries).toEqual([
      `Kitchen Sink/${META_FILE}`,
      `Kitchen Sink/${PROJECT_FILE}`,
      'Kitchen Sink/Definitions.sysml',
      'Kitchen Sink/Kitchen Sink.sysml',
      'Kitchen Sink/Packages.sysml'
    ]);

    const project = JSON.parse(archive.files[`Kitchen Sink/${PROJECT_FILE}`]) as { name: string; version: string; usage: unknown[] };
    expect(project).toEqual({ name: 'Kitchen Sink', version: '1.0.0', usage: [] });

    const meta = JSON.parse(archive.files[`Kitchen Sink/${META_FILE}`]) as {
      index: Record<string, string>;
      created: string;
      metamodel: string;
    };
    expect(meta.index).toEqual({
      'Kitchen Sink': 'Kitchen Sink.sysml',
      Definitions: 'Definitions.sysml',
      Packages: 'Packages.sysml'
    });
    expect(meta.created).toBe(FIXED_CREATED);
    expect(meta.metamodel).toBe(METAMODEL_URI);
  });

  it('is deterministic: same document + created produce identical archives and zip bytes', async () => {
    const document = createKitchenSinkDocument();
    const first = exportDocumentToKpar(document, { created: FIXED_CREATED });
    const second = exportDocumentToKpar(document, { created: FIXED_CREATED });
    expect(first.ok && second.ok).toBe(true);
    if (!first.ok || !second.ok) return;

    expect(second.archive.files).toEqual(first.archive.files);

    const date = new Date(FIXED_CREATED);
    const blobA = await zipKparArchive(first.archive, date);
    const blobB = await zipKparArchive(second.archive, date);
    expect(await blobA.arrayBuffer()).toEqual(await blobB.arrayBuffer());
  });

  it('zips into the exact archive layout (project folder + per-package files + metadata)', async () => {
    const result = exportDocumentToKpar(createKitchenSinkDocument(), { created: FIXED_CREATED });
    expect(result.ok).toBe(true);
    if (!result.ok) return;

    const blob = await zipKparArchive(result.archive, new Date(FIXED_CREATED));
    const zip = await JSZip.loadAsync(await blob.arrayBuffer());
    const names = Object.keys(zip.files).sort();
    expect(names).toEqual([
      'Kitchen Sink/',
      'Kitchen Sink/.meta.json',
      'Kitchen Sink/.project.json',
      'Kitchen Sink/Definitions.sysml',
      'Kitchen Sink/Kitchen Sink.sysml',
      'Kitchen Sink/Packages.sysml'
    ]);

    const meta = await zip.file('Kitchen Sink/.meta.json')!.async('string');
    expect(JSON.parse(meta).metamodel).toBe(METAMODEL_URI);
    const sysml = await zip.file('Kitchen Sink/Kitchen Sink.sysml')!.async('string');
    expect(sysml).toContain("flow fuelFlow from 'Fuel Tank'.'out' to 'Engine Block'.fuelIn;");
  });

  it('blocks export of an invalid document with error diagnostics (decision: invalid exports blocked)', () => {
    const document = createKitchenSinkDocument();
    // Introduce a WF001 duplicate-name violation at the root: a second root
    // member named like the existing part usage.
    const duplicate = JSON.parse(JSON.stringify(document)) as SysmlDocument;
    const engineBlockId = Object.values(duplicate.elements).find(
      (element) => element.metaclass === 'partUsage' && element.name === 'Engine Block'
    )!.id;
    const extraId = nextModelId(new ModelRepository(duplicate), 'partUsage');
    duplicate.elements[extraId] = {
      id: extraId,
      metaclass: 'partUsage',
      category: 'usage',
      name: 'Engine Block',
      ownerId: null,
      definitionId: null,
      ownedUsageIds: [],
      attributeIds: []
    } as AnySysmlElement;
    duplicate.root.memberIds.push(extraId);

    const result = exportDocumentToKpar(duplicate, { created: FIXED_CREATED });
    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.diagnostics.some((diagnostic) => diagnostic.ruleId === 'WF001-name-uniqueness')).toBe(true);
  });

  it('exports warning-only documents (heuristic warnings never block)', () => {
    const repository = new ModelRepository(createDocument('Warn Only'));
    const created = repository.create({
      id: nextModelId(repository, 'partUsage'),
      metaclass: 'partUsage',
      category: 'usage',
      name: 'Unnamed Part',
      ownerId: null,
      definitionId: null,
      ownedUsageIds: [],
      attributeIds: []
    } as AnySysmlElement);
    expect(created.ok).toBe(true);
    const diagnostics = repository.validate();
    expect(diagnostics.some((diagnostic) => diagnostic.severity === 'warning')).toBe(true);

    const result = exportDocumentToKpar(repository.read(), { created: FIXED_CREATED });
    expect(result.ok).toBe(true);
  });
});

describe('library templates export', () => {
  it('exports every shipped library example successfully', () => {
    const templates = [
      commercialVesselPowertrain
    ];
    for (const template of templates) {
      const result = exportDocumentToKpar(template.data.document, { created: FIXED_CREATED });
      expect(result.ok, `template ${template.id} must export`).toBe(true);
      if (!result.ok) continue;
      const sysmlFiles = Object.keys(result.archive.files).filter((path) => path.endsWith('.sysml'));
      expect(sysmlFiles.length).toBeGreaterThanOrEqual(2); // root + Definitions
    }
  });

  it('emits the commercial-vessel powertrain vocabulary and flows', () => {
    const result = exportDocumentToKpar(commercialVesselPowertrain.data.document, { created: FIXED_CREATED });
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    const text = Object.values(result.archive.files).join('\n');
    expect(text).toContain('package Definitions {');
    expect(text).toContain('part def');
    expect(text).toContain('attribute def mass');
    expect(text).toMatch(/flow \S+ from /);
    expect(text).toMatch(/attribute mass : Definitions::mass = /);
    // Presentation-only data from the library template must not leak.
    expect(text).not.toContain('"position"');
    expect(text).not.toContain('interfaceType');
  });
});