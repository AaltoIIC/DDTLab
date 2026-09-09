import type { ComponentTemplate } from '../../types/componentLibrary';
import type { AnySysmlElement, ElementId, SysmlDocument } from '../model';
import { createDocument } from '../model';
import { setPresentation, type PresentationMap } from '../presentation/presentationMap';
import { nextModelId } from '../projection';
import { ModelRepository } from '../repo/ModelRepository';

/**
 * Library authoring DSL (plan §5 Phase 5).
 *
 * The shipped example libraries (`data/simpleComponentLibrary.ts`,
 * `data/shipDesignLibrary.ts`) are no longer raw `{ nodes, edges }` payloads:
 * each example is declared as a compact table of definitions, usages, ports,
 * attributes and flows, and this module builds the canonical `SysmlDocument`
 * behind it — the same definitions/usages structure the concept stage authors
 * at runtime. The canvas payload is projected from the result at drag time
 * (`utils/simpleInstantiation.ts`), so the drop path stays pixel-identical.
 *
 * The document is built through the `ModelRepository`, so every create is
 * checked by the WF001–WF008 rule engine: an example that would violate a
 * well-formedness rule fails at module load (and in the phase-5 test suite)
 * instead of shipping a broken template.
 */

export interface LibraryPortSpec {
  name: string;
  /** Display-only interface label (presentation map, decisions 13/21). */
  interfaceType?: string;
}

export interface LibraryUsageSpec {
  kind: 'part' | 'item';
  /** Usage name == canvas declaredName; unique within the template (WF001). */
  name: string;
  /** Definition name; resolved (or created) in the template's Definitions package. */
  definition?: string;
  position: { x: number; y: number };
  measured?: { width: number; height: number };
  comment?: string;
  mass?: number;
  metadata?: Array<{ key: string; value: string }>;
  inputs?: LibraryPortSpec[];
  outputs?: LibraryPortSpec[];
}

export interface LibraryFlowSpec {
  /** Referenced by usage name; must resolve to a declared usage. */
  source: string;
  /** Output port name on the source usage. */
  sourcePort: string;
  target: string;
  /** Input port name on the target usage. */
  targetPort: string;
}

export interface LibraryTemplateSpec {
  /** Library entry id (e.g. `basic-powertrain`). */
  id: string;
  name: string;
  declaredName: string;
  comment?: string;
  /** Legacy data id carried on the dropped package node (e.g. `PKG-BASIC-POWERTRAIN`). */
  templateId: string;
  metadata?: Array<{ key: string; value: string }>;
  usages: LibraryUsageSpec[];
  flows?: LibraryFlowSpec[];
}

/**
 * Build a semantic `ComponentTemplate` from the DSL table. Each call creates
 * a fresh repository, so templates are independent and immutable (callers
 * must not mutate the returned document).
 */
export function buildSemanticLibraryTemplate(spec: LibraryTemplateSpec): ComponentTemplate {
  const repository = new ModelRepository(createDocument(spec.name));
  let presentation: PresentationMap = {};

  const definitionsPackageId = ensureDefinitionsPackage(repository);
  const usageIds = new Map<string, ElementId>();
  const rootNames = new Set<string>([spec.name, 'Definitions']);

  for (const usage of spec.usages) {
    const built = addUsage(repository, usage, definitionsPackageId, rootNames);
    usageIds.set(usage.name, built.usageId);
    presentation = { ...presentation, ...built.presentation };
  }

  for (const flow of spec.flows ?? []) {
    addFlow(repository, flow, usageIds, rootNames);
  }

  return {
    id: spec.id,
    type: 'package',
    data: {
      declaredName: spec.declaredName,
      ...(spec.comment === undefined ? {} : { comment: spec.comment }),
      id: spec.templateId,
      metadata: spec.metadata ?? [],
      document: repository.read(),
      presentation
    }
  };
}

/* ── Internals ───────────────────────────────────────────────────────────── */

/** Root-owned `Definitions` package keeps definition names out of the usage namespace (WF001). */
function ensureDefinitionsPackage(repository: ModelRepository): ElementId {
  const id = nextModelId(repository, 'package');
  const created = repository.create({
    id,
    metaclass: 'package',
    name: 'Definitions',
    ownerId: null,
    memberIds: []
  } as AnySysmlElement);
  if (!created.ok || !created.value) {
    throw new Error(`libraryAuthoring: cannot create Definitions package: ${created.diagnostics.map((d) => d.message).join('; ')}`);
  }
  return created.value.id;
}

/**
 * Find (or create) a definition by name inside the Definitions package. One
 * shared definition per name — usages of the same type reference the same
 * definition element (decision 10: references by id, not by name).
 */
function ensureDefinition(
  repository: ModelRepository,
  packageId: ElementId,
  metaclass: 'partDefinition' | 'itemDefinition' | 'attributeDefinition',
  name: string
): ElementId {
  const document = repository.read();
  const existing = Object.values(document.elements).find(
    (element) => element.metaclass === metaclass && element.name === name && element.ownerId === packageId
  );
  if (existing) return existing.id;

  const id = nextModelId(repository, metaclass);
  const element: AnySysmlElement = metaclass === 'attributeDefinition'
    ? { id, metaclass, category: 'definition', name, ownerId: packageId }
    : {
        id,
        metaclass,
        category: 'definition',
        name,
        ownerId: packageId,
        ownedUsageIds: [],
        attributeIds: []
      };
  const created = repository.create(element);
  if (!created.ok || !created.value) {
    throw new Error(`libraryAuthoring: cannot create ${metaclass} '${name}': ${created.diagnostics.map((d) => d.message).join('; ')}`);
  }
  return created.value.id;
}

interface BuiltUsage {
  usageId: ElementId;
  /** Presentation entries for this usage: position/size + port interface labels. */
  presentation: PresentationMap;
}

function addUsage(
  repository: ModelRepository,
  spec: LibraryUsageSpec,
  definitionsPackageId: ElementId,
  rootNames: Set<string>
): BuiltUsage {
  const definitionId = spec.definition
    ? ensureDefinition(repository, definitionsPackageId, spec.kind === 'part' ? 'partDefinition' : 'itemDefinition', spec.definition)
    : null;

  const metaclass = spec.kind === 'part' ? 'partUsage' : 'itemUsage';
  const id = nextModelId(repository, metaclass);
  const element: AnySysmlElement = metaclass === 'partUsage'
    ? {
        id,
        metaclass: 'partUsage',
        category: 'usage',
        name: spec.name,
        ownerId: null,
        definitionId,
        ownedUsageIds: [],
        attributeIds: []
      }
    : {
        id,
        metaclass: 'itemUsage',
        category: 'usage',
        name: spec.name,
        ownerId: null,
        definitionId,
        ownedUsageIds: []
      };
  const created = repository.create(element);
  if (!created.ok || !created.value) {
    throw new Error(`libraryAuthoring: cannot create usage '${spec.name}': ${created.diagnostics.map((d) => d.message).join('; ')}`);
  }
  rootNames.add(spec.name);

  let presentation: PresentationMap = setPresentation({}, id, {
    position: { ...spec.position },
    ...(spec.measured === undefined ? {} : { width: spec.measured.width, height: spec.measured.height }),
    // Tool metadata pairs stay in the presentation/tool layer (plan §3): they
    // are not SysML members, so they can never collide with port names in the
    // usage namespace (WF001) and are excluded from interchange. Mass is the
    // exception — it is a literal attribute value (decision 4).
    ...(spec.metadata === undefined || spec.metadata.length === 0 ? {} : { metadata: spec.metadata })
  });

  if (spec.comment !== undefined) {
    repository.update(id, { documentation: spec.comment });
  }
  if (spec.mass !== undefined && Number.isFinite(spec.mass)) {
    addAttribute(repository, id, definitionsPackageId, 'mass', spec.mass);
  }

  presentation = addPorts(repository, id, spec.inputs ?? [], 'in', presentation);
  presentation = addPorts(repository, id, spec.outputs ?? [], 'out', presentation);
  return { usageId: id, presentation };
}

/** Attribute usage (literal value) owned by a usage — mass/metadata survive as model data (decision 4). */
function addAttribute(
  repository: ModelRepository,
  ownerId: ElementId,
  definitionsPackageId: ElementId,
  name: string,
  literal: string | number
): void {
  const definitionId = ensureDefinition(repository, definitionsPackageId, 'attributeDefinition', name);
  const id = nextModelId(repository, 'attributeUsage');
  const created = repository.create({
    id,
    metaclass: 'attributeUsage',
    category: 'usage',
    name,
    ownerId,
    definitionId,
    literal
  } as AnySysmlElement);
  if (!created.ok) {
    throw new Error(`libraryAuthoring: cannot create attribute '${name}': ${created.diagnostics.map((d) => d.message).join('; ')}`);
  }
}

function addPorts(
  repository: ModelRepository,
  ownerId: ElementId,
  ports: LibraryPortSpec[],
  direction: 'in' | 'out',
  presentation: PresentationMap
): PresentationMap {
  for (const port of ports) {
    const id = nextModelId(repository, 'portUsage');
    const created = repository.create({
      id,
      metaclass: 'portUsage',
      category: 'usage',
      name: port.name,
      ownerId,
      definitionId: null,
      direction
    } as AnySysmlElement);
    if (!created.ok || !created.value) {
      throw new Error(`libraryAuthoring: cannot create port '${port.name}': ${created.diagnostics.map((d) => d.message).join('; ')}`);
    }
    if (port.interfaceType !== undefined) {
      presentation = setPresentation(presentation, id, { interfaceType: port.interfaceType });
    }
  }
  return presentation;
}

function addFlow(
  repository: ModelRepository,
  flow: LibraryFlowSpec,
  usageIds: Map<string, ElementId>,
  rootNames: Set<string>
): void {
  const document = repository.read();
  const sourceUsageId = usageIds.get(flow.source);
  const targetUsageId = usageIds.get(flow.target);
  if (!sourceUsageId || !targetUsageId) {
    throw new Error(`libraryAuthoring: flow references unknown usage '${sourceUsageId ? flow.target : flow.source}'`);
  }
  const sourcePort = findPort(repository, sourceUsageId, flow.sourcePort, 'out', flow.source);
  const targetPort = findPort(repository, targetUsageId, flow.targetPort, 'in', flow.target);

  const base = `${document.elements[sourcePort].name}_to_${document.elements[targetPort].name}`;
  let name = base;
  let index = 2;
  while (rootNames.has(name)) name = `${base}_${index++}`;
  rootNames.add(name);

  const id = nextModelId(repository, 'flowUsage');
  const created = repository.create({
    id,
    metaclass: 'flowUsage',
    category: 'relationship',
    name,
    ownerId: null,
    sourceEnd: sourcePort,
    targetEnd: targetPort,
    flowDefinitionId: null
  } as AnySysmlElement);
  if (!created.ok) {
    throw new Error(`libraryAuthoring: cannot create flow '${name}': ${created.diagnostics.map((d) => d.message).join('; ')}`);
  }
}

function findPort(
  repository: ModelRepository,
  usageId: ElementId,
  name: string,
  direction: 'in' | 'out',
  usageName: string
): ElementId {
  const document: SysmlDocument = repository.read();
  const usage = document.elements[usageId];
  const owned = (usage && 'ownedUsageIds' in usage ? usage.ownedUsageIds : []) as ElementId[];
  for (const ownedId of owned) {
    const element = document.elements[ownedId];
    if (element?.metaclass === 'portUsage' && element.name === name && (element.direction ?? 'inout') === direction) {
      return ownedId;
    }
  }
  throw new Error(`libraryAuthoring: port '${usageName}.${name}' (${direction}) does not exist`);
}