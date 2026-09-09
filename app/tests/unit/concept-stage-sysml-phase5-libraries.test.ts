import { describe, it, expect } from 'vitest';
import { ModelRepository } from '$lib/concept-stage/sysml/repo';
import type { PartUsageElement } from '$lib/concept-stage/sysml/model';
import { buildSemanticLibraryTemplate } from '$lib/concept-stage/sysml/session';
import type { ComponentTemplate } from '$lib/concept-stage/types/componentLibrary';
import {
  commercialVesselPowertrain,
  basicPowertrain,
  motorShaftPropellerDemo,
  simanticsSspCloudTemplate,
  maritimeCoolingSystem,
  ballastWaterSystem,
  shipHvacSystem,
  navigationBridgeSystem
} from '$lib/concept-stage/data/simpleComponentLibrary';
import {
  commercialVessel,
  lngFerry,
  hybridResearchVessel,
  electricHarborTug
} from '$lib/concept-stage/data/shipDesignLibrary';
import {
  instantiateSimpleComponent,
  projectSemanticTemplateToCanvas
} from '$lib/concept-stage/utils/simpleInstantiation';
import type { Edge, Node } from '@xyflow/svelte';

/**
 * Phase 5 — hardcoded libraries reworked to the semantic structure.
 *
 * Every shipped example is now a semantic `ComponentTemplate` (a WF-valid
 * `SysmlDocument` + presentation map) built with the library authoring DSL.
 * These tests lock the acceptance criterion: the examples are emitted from,
 * and round-trip through, the semantic model, and the canvas payload they
 * project is identical to the legacy preview data.
 */

const allSimpleComponents: Array<[string, ComponentTemplate]> = [
  ['commercialVesselPowertrain', commercialVesselPowertrain],
  ['basicPowertrain', basicPowertrain],
  ['motorShaftPropellerDemo', motorShaftPropellerDemo],
  ['simanticsSspCloudTemplate', simanticsSspCloudTemplate],
  ['maritimeCoolingSystem', maritimeCoolingSystem],
  ['ballastWaterSystem', ballastWaterSystem],
  ['shipHvacSystem', shipHvacSystem],
  ['navigationBridgeSystem', navigationBridgeSystem]
];

const allShipDesigns: Array<[string, ComponentTemplate]> = [
  ['commercialVessel', commercialVessel.template],
  ['lngFerry', lngFerry.template],
  ['hybridResearchVessel', hybridResearchVessel.template],
  ['electricHarborTug', electricHarborTug.template]
];

interface SnapshotUsage {
  name: string;
  kind: 'part' | 'item';
  definition: string;
  comment: string;
  mass: number;
  metadata: Array<{ key: string; value: string }>;
  inputs: Array<{ name: string; interfaceType?: string }>;
  outputs: Array<{ name: string; interfaceType?: string }>;
  position: { x: number; y: number };
}

interface SnapshotFlow {
  source: string;
  sourcePort: string;
  target: string;
  targetPort: string;
}

interface TemplateSnapshot {
  usages: SnapshotUsage[];
  flows: SnapshotFlow[];
}

function modelIdFromProjectedId(id: string): string {
  return id.startsWith('n_') || id.startsWith('e_') ? id.slice(2) : id;
}

function portNameFromHandle(handle: string | null | undefined, nodeId: string): string {
  if (!handle) return '';
  const prefix = `${nodeId}-input-`;
  const outputPrefix = `${nodeId}-output-`;
  return handle.startsWith(prefix) ? handle.slice(prefix.length) : handle.slice(outputPrefix.length);
}

/** Normalized canvas projection of a semantic template (ids stripped). */
function canvasSnapshot(template: ComponentTemplate): TemplateSnapshot {
  const document = template.data.document;
  const { nodes, edges } = projectSemanticTemplateToCanvas(template);

  const usages: SnapshotUsage[] = nodes.map((node: Node) => {
    const data = node.data as Record<string, unknown>;
    const element = document.elements[String(data.modelId)];
    const inputs = (data.inputs ?? []) as Array<{ name: string; interfaceType?: string }>;
    const outputs = (data.outputs ?? []) as Array<{ name: string; interfaceType?: string }>;
    return {
      name: String(data.declaredName),
      kind: node.type as 'part' | 'item',
      definition: String(data.definition ?? ''),
      comment: String(data.comment ?? ''),
      mass: Number(data.mass ?? 0),
      metadata: (data.metadata ?? []) as Array<{ key: string; value: string }>,
      inputs: inputs.map((port) => ({ name: port.name, ...(port.interfaceType === undefined ? {} : { interfaceType: port.interfaceType }) })),
      outputs: outputs.map((port) => ({ name: port.name, ...(port.interfaceType === undefined ? {} : { interfaceType: port.interfaceType }) })),
      position: { ...node.position }
    };
  });

  const flows: SnapshotFlow[] = edges.map((edge: Edge) => {
    const sourceModelId = modelIdFromProjectedId(edge.source);
    const targetModelId = modelIdFromProjectedId(edge.target);
    const sourceElement = document.elements[sourceModelId];
    const targetElement = document.elements[targetModelId];
    return {
      source: sourceElement?.name ?? edge.source,
      sourcePort: portNameFromHandle(edge.sourceHandle, edge.source),
      target: targetElement?.name ?? edge.target,
      targetPort: portNameFromHandle(edge.targetHandle, edge.target)
    };
  });

  return { usages, flows };
}

function usageNames(snapshot: TemplateSnapshot): string[] {
  return snapshot.usages.map((usage) => usage.name);
}

function flowEndpoints(snapshot: TemplateSnapshot): Array<[string, string, string, string]> {
  return snapshot.flows.map((flow) => [flow.source, flow.sourcePort, flow.target, flow.targetPort]);
}

/* ── Well-formedness of the semantic library documents ───────────────────── */

describe('Phase 5 library documents are WF-valid', () => {
  it.each([...allSimpleComponents, ...allShipDesigns])('%s loads into the repository with zero error diagnostics', (_name, template) => {
    const repository = new ModelRepository(template.data.document);
    const errors = repository.validate().filter((diagnostic) => diagnostic.severity === 'error');
    expect(errors).toEqual([]);
  });

  it.each(allSimpleComponents)('%s document is a canonical definitions/usages model', (_name, template) => {
    const document = template.data.document;
    const definitionsPackage = Object.values(document.elements).find(
      (element) => element.metaclass === 'package' && element.name === 'Definitions' && element.ownerId === null
    );
    expect(definitionsPackage).toBeDefined();
    expect(document.root.memberIds).toContain(definitionsPackage!.id);

    for (const usage of Object.values(document.elements)) {
      if (usage.metaclass !== 'partUsage' && usage.metaclass !== 'itemUsage') continue;
      expect(usage.ownerId).toBeNull();
      if (usage.definitionId === null) continue;
      const definition = document.elements[usage.definitionId];
      expect(definition).toBeDefined();
      expect(definition!.ownerId).toBe(definitionsPackage!.id);
      expect(definition!.metaclass).toBe(usage.metaclass === 'partUsage' ? 'partDefinition' : 'itemDefinition');
      // Ports and attributes are owned features of the usage.
      for (const ownedId of usage.ownedUsageIds) {
        const owned = document.elements[ownedId];
        expect(['portUsage', 'attributeUsage']).toContain(owned?.metaclass);
        expect(owned!.ownerId).toBe(usage.id);
      }
    }
  });

  it('untyped items keep definitionId null (matching the legacy data)', () => {
    const document = basicPowertrain.data.document;
    const battery = Object.values(document.elements).find((element) => element.metaclass === 'itemUsage' && element.name === 'Battery Pack');
    expect(battery).toBeDefined();
    expect((battery as { definitionId: string | null }).definitionId).toBeNull();
  });

  it('mass is a literal attribute usage (decision 4); metadata pairs are presentation tool metadata (WF001-safe)', () => {
    const document = basicPowertrain.data.document;
    const motor = Object.values(document.elements).find((element) => element.metaclass === 'partUsage' && element.name === 'Electric Motor') as PartUsageElement;
    const attributes = motor.ownedUsageIds
      .map((id) => document.elements[id])
      .filter((element) => element?.metaclass === 'attributeUsage');
    // Only mass is modeled as an attribute; the key/value pairs would collide
    // with port names in the usage namespace (WF001), so they stay in the
    // presentation map as tool metadata.
    expect(attributes.map((attribute) => attribute.name)).toEqual(['mass']);
    expect((attributes[0] as { literal?: unknown }).literal).toBe(2400);
    expect(basicPowertrain.data.presentation[motor.id].metadata).toEqual([
      { key: 'ratedPower', value: '1200kW' },
      { key: 'ratedSpeed', value: '900rpm' },
      { key: 'rotorInertia', value: '18kgm2' },
      { key: 'damping', value: '120Nms/rad' }
    ]);
    // Comments survive as element documentation.
    expect((motor as { documentation?: string }).documentation).toBe('Main propulsion motor');
  });

  it('flow names are unique at the root even when ports repeat (WF001)', () => {
    const document = navigationBridgeSystem.data.document;
    const flowNames = Object.values(document.elements)
      .filter((element) => element.metaclass === 'flowUsage')
      .map((element) => element.name);
    expect(flowNames).toContain('heading_nmea_to_heading_in');
    expect(flowNames).toContain('heading_nmea_to_heading_in_2');
    expect(new Set(flowNames).size).toBe(flowNames.length);
  });

  it('templates are independent: rebuilding yields a fresh, non-shared document', () => {
    const rebuilt = buildSemanticLibraryTemplate({
      id: 'basic-powertrain',
      name: 'Powertrain',
      declaredName: 'Powertrain',
      templateId: 'PKG-BASIC-POWERTRAIN',
      usages: basicPowertrain.data.document.root.memberIds
        .map((id) => basicPowertrain.data.document.elements[id])
        .filter((element) => element?.metaclass === 'partUsage' || element?.metaclass === 'itemUsage')
        .map((element) => ({
          kind: element.metaclass === 'partUsage' ? 'part' as const : 'item' as const,
          name: element.name,
          position: { x: 0, y: 0 }
        }))
    });
    expect(rebuilt.data.document.elements).not.toBe(basicPowertrain.data.document.elements);
    expect(rebuilt.data.document).not.toBe(basicPowertrain.data.document);
  });
});

/* ── Projection snapshots: identical to the legacy preview data ──────────── */

describe('Phase 5 library projection matches the legacy preview data', () => {
  it('basicPowertrain projects the full legacy payload', () => {
    const snapshot = canvasSnapshot(basicPowertrain);
    expect(usageNames(snapshot)).toEqual([
      'Battery Pack',
      'Power Converter',
      'Electric Motor',
      'Propeller Shaft',
      'Fixed Pitch Propeller'
    ]);
    expect(snapshot.usages[0]).toEqual({
      name: 'Battery Pack',
      kind: 'item',
      definition: '',
      comment: 'DC energy source for propulsion drive',
      mass: 6200,
      metadata: [
        { key: 'capacity', value: '1800kWh' },
        { key: 'nominalVoltage', value: '900V' }
      ],
      inputs: [],
      outputs: [{ name: 'dc_power', interfaceType: 'dc-950v' }],
      position: { x: 80, y: 70 }
    });
    expect(snapshot.usages[1]).toEqual({
      name: 'Power Converter',
      kind: 'part',
      definition: 'Marine Propulsion Converter',
      comment: 'Variable frequency drive for the propulsion motor',
      mass: 850,
      metadata: [
        { key: 'ratedPower', value: '1200kW' },
        { key: 'switchingFrequency', value: '2kHz' }
      ],
      inputs: [{ name: 'dc_power', interfaceType: 'dc-950v' }],
      outputs: [{ name: 'ac_power', interfaceType: 'iec-690v-60hz' }],
      position: { x: 330, y: 70 }
    });
    expect(snapshot.usages[2].mass).toBe(2400);
    expect(snapshot.usages[2].definition).toBe('Permanent Magnet Motor');
    expect(snapshot.usages[3].position).toEqual({ x: 830, y: 70 });
    expect(snapshot.usages[4].position).toEqual({ x: 1080, y: 70 });
    expect(flowEndpoints(snapshot)).toEqual([
      ['Battery Pack', 'dc_power', 'Power Converter', 'dc_power'],
      ['Power Converter', 'ac_power', 'Electric Motor', 'ac_power'],
      ['Electric Motor', 'shaft', 'Propeller Shaft', 'shaft_in'],
      ['Propeller Shaft', 'shaft_out', 'Fixed Pitch Propeller', 'shaft']
    ]);
  });

  it('simanticsSspCloudTemplate keeps measured sizes, bracketed port names and loop-back flows', () => {
    const snapshot = canvasSnapshot(simanticsSspCloudTemplate);
    expect(usageNames(snapshot)).toEqual([
      'Modelica_Blocks_Sources_Trapezoid',
      'Codes_VfController',
      'Codes_MotorWithFlexibleShaft2_FMU',
      'Codes_Drivetrain2_FMU',
      'Codes_Load2_FMU'
    ]);
    // measured -> presentation width/height ride on the projected node
    expect(snapshot.usages[0].position).toEqual({ x: 80, y: 160 });
    expect(snapshot.usages[1].inputs).toEqual([{ name: 'u', interfaceType: 'nmea-0183' }]);
    expect(snapshot.usages[1].outputs).toEqual([
      { name: 'y[1]', interfaceType: 'iec-690v-60hz' },
      { name: 'y[2]', interfaceType: 'iec-690v-60hz' }
    ]);
    expect(snapshot.usages[2].metadata).toContainEqual({ key: 'motor.J1', value: '52.5kg.m2' });
    expect(snapshot.usages[3].inputs).toEqual([
      { name: 'tau_in', interfaceType: 'propeller-drive-shaft' },
      { name: 'w_out', interfaceType: 'propeller-drive-shaft' },
      { name: 'a_out', interfaceType: 'propeller-drive-shaft' }
    ]);
    expect(snapshot.usages[3].outputs).toEqual([
      { name: 'w_in', interfaceType: 'propeller-drive-shaft' },
      { name: 'tau_out', interfaceType: 'propeller-drive-shaft' },
      { name: 'a_in', interfaceType: 'propeller-drive-shaft' }
    ]);
    expect(flowEndpoints(snapshot)).toEqual([
      ['Modelica_Blocks_Sources_Trapezoid', 'y', 'Codes_VfController', 'u'],
      ['Codes_VfController', 'y[1]', 'Codes_MotorWithFlexibleShaft2_FMU', 'us[1]'],
      ['Codes_VfController', 'y[2]', 'Codes_MotorWithFlexibleShaft2_FMU', 'us[2]'],
      ['Codes_MotorWithFlexibleShaft2_FMU', 'tau', 'Codes_Drivetrain2_FMU', 'tau_in'],
      ['Codes_Drivetrain2_FMU', 'w_in', 'Codes_MotorWithFlexibleShaft2_FMU', 'w'],
      ['Codes_Drivetrain2_FMU', 'a_in', 'Codes_MotorWithFlexibleShaft2_FMU', 'a'],
      ['Codes_Drivetrain2_FMU', 'tau_out', 'Codes_Load2_FMU', 'tau'],
      ['Codes_Load2_FMU', 'w', 'Codes_Drivetrain2_FMU', 'w_out'],
      ['Codes_Load2_FMU', 'a', 'Codes_Drivetrain2_FMU', 'a_out']
    ]);
  });

  it('navigationBridgeSystem projects the full payload (radars, GPS, gyro, ECDIS, autopilot)', () => {
    const snapshot = canvasSnapshot(navigationBridgeSystem);
    expect(usageNames(snapshot)).toEqual([
      'X-Band Radar',
      'S-Band Radar',
      'Dual GPS/GNSS Receiver',
      'Gyrocompass',
      'ECDIS Console',
      'Adaptive Autopilot'
    ]);
    expect(snapshot.usages[0]).toMatchObject({
      definition: 'Marine Radar',
      mass: 65,
      inputs: [{ name: 'trigger_sync', interfaceType: 'nmea-0183' }],
      outputs: [{ name: 'radar_video', interfaceType: 'nmea-0183' }]
    });
    expect(snapshot.usages[4].inputs).toEqual([
      { name: 'position_in', interfaceType: 'nmea-0183' },
      { name: 'heading_in', interfaceType: 'nmea-0183' },
      { name: 'radar_overlay', interfaceType: 'nmea-0183' }
    ]);
    expect(flowEndpoints(snapshot)).toEqual([
      ['Dual GPS/GNSS Receiver', 'nmea_position', 'ECDIS Console', 'position_in'],
      ['Gyrocompass', 'heading_nmea', 'ECDIS Console', 'heading_in'],
      ['X-Band Radar', 'radar_video', 'ECDIS Console', 'radar_overlay'],
      ['Gyrocompass', 'heading_nmea', 'Adaptive Autopilot', 'heading_in'],
      ['ECDIS Console', 'route_data', 'Adaptive Autopilot', 'route_in']
    ]);
  });

  it('electricHarborTug projects the full payload (9 systems, twin drives, charge loop-back)', () => {
    const snapshot = canvasSnapshot(electricHarborTug.template);
    expect(usageNames(snapshot)).toEqual([
      'Battery Room',
      'Shore Charging Connection',
      'DC Main Switchboard',
      'Port Propulsion Drive',
      'Starboard Propulsion Drive',
      'Port Electric Motor',
      'Starboard Electric Motor',
      'Port Azimuth Thruster',
      'Starboard Azimuth Thruster'
    ]);
    expect(snapshot.usages[0]).toMatchObject({
      definition: 'Marine Battery System',
      mass: 28000,
      inputs: [{ name: 'charge', interfaceType: 'dc-950v' }],
      outputs: [{ name: 'dc_out', interfaceType: 'dc-950v' }]
    });
    expect(flowEndpoints(snapshot)).toEqual([
      ['Shore Charging Connection', 'dc_charge', 'DC Main Switchboard', 'shore_in'],
      ['Battery Room', 'dc_out', 'DC Main Switchboard', 'battery_in'],
      ['DC Main Switchboard', 'dc_dist', 'Port Propulsion Drive', 'dc_in'],
      ['DC Main Switchboard', 'dc_dist', 'Starboard Propulsion Drive', 'dc_in'],
      ['Port Propulsion Drive', 'ac_out', 'Port Electric Motor', 'ac_in'],
      ['Starboard Propulsion Drive', 'ac_out', 'Starboard Electric Motor', 'ac_in'],
      ['Port Electric Motor', 'shaft', 'Port Azimuth Thruster', 'shaft_in'],
      ['Starboard Electric Motor', 'shaft', 'Starboard Azimuth Thruster', 'shaft_in'],
      ['DC Main Switchboard', 'dc_dist', 'Battery Room', 'charge']
    ]);
  });

  it.each([
    ['commercialVesselPowertrain', commercialVesselPowertrain, ['Main Diesel Engine', 'Reduction Gearbox', 'Propeller Shaft', 'Fixed Pitch Propeller', 'Auxiliary Generator', 'Main Fuel Tank'], 5],
    ['motorShaftPropellerDemo', motorShaftPropellerDemo, ['Propulsion Drive', 'Permanent Magnet Motor', 'Propeller Shaft', 'Fixed Pitch Propeller'], 3],
    ['maritimeCoolingSystem', maritimeCoolingSystem, ['HT Fresh Water Pump', 'LT Fresh Water Pump', 'Central Cooler', 'Sea Water Pump', 'FW Expansion Tank', 'Sea Water Inlet'], 5],
    ['ballastWaterSystem', ballastWaterSystem, ['Ballast Water Pump', 'Ballast Water Treatment System', 'Ballast Valve Manifold', 'Ballast Tank Group'], 3],
    ['shipHvacSystem', shipHvacSystem, ['Screw Chiller Unit', 'Bridge AHU', 'Accommodation AHU', 'Engine Room Vent Fan', 'Fresh Air Intake'], 5],
    ['commercialVessel', commercialVessel.template, ['Main Diesel Engine', 'Reduction Gearbox', 'Fixed Pitch Propeller', 'Auxiliary Generator', 'Main Fuel Tank'], 4],
    ['lngFerry', lngFerry.template, ['Type-C LNG Tank', 'LNG Gas Handling Unit', 'Port Dual-Fuel Engine', 'Starboard Dual-Fuel Engine', 'Port Azimuth Thruster', 'Starboard Azimuth Thruster', 'MGO Pilot Fuel Tank'], 7],
    ['hybridResearchVessel', hybridResearchVessel.template, ['Port Diesel Genset', 'Starboard Diesel Genset', 'Li-Ion Battery Bank', 'Main Switchboard', 'Main Propulsion Motor', 'Controllable Pitch Propeller', 'MDO Fuel Tank'], 7]
  ])('%s keeps its usage vocabulary and flow count', (_name, template, expectedUsageNames, expectedFlowCount) => {
    const snapshot = canvasSnapshot(template);
    expect(usageNames(snapshot)).toEqual(expectedUsageNames);
    expect(snapshot.flows.length).toBe(expectedFlowCount);
  });

  it('every library example keeps its template-level metadata (incl. the SSP binding keys)', () => {
    expect(simanticsSspCloudTemplate.data.metadata).toContainEqual({ key: 'templateSimulation', value: 'simantics-ssp-cloud-template' });
    expect(simanticsSspCloudTemplate.data.metadata).toContainEqual({ key: 'sspTemplateModel', value: 'python-client/templates/model.ssp' });
    expect(basicPowertrain.data.metadata).toContainEqual({ key: 'analysisType', value: 'torsional_vibration' });
    expect(electricHarborTug.template.data.metadata).toContainEqual({ key: 'bollardPull', value: '70t' });
  });
});

/* ── Round-trip: emitted from, and through, the semantic model ───────────── */

describe('Phase 5 templates round-trip through the semantic model and the drag payload', () => {
  it.each([...allSimpleComponents, ...allShipDesigns])('%s survives a repository read-back with an identical projection', (_name, template) => {
    const repository = new ModelRepository(template.data.document);
    const roundTripped = { ...template, data: { ...template.data, document: repository.read() } } as ComponentTemplate;
    expect(canvasSnapshot(roundTripped)).toEqual(canvasSnapshot(template));
  });

  it.each([...allSimpleComponents, ...allShipDesigns])('%s survives the JSON drag payload with an identical projection', (_name, template) => {
    // The drag payload is JSON-serialized through dataTransfer (no Dates, no Maps).
    const cloned = JSON.parse(JSON.stringify(template)) as ComponentTemplate;
    expect(canvasSnapshot(cloned)).toEqual(canvasSnapshot(template));
    const atDrop = instantiateSimpleComponent(cloned, { x: 0, y: 0 });
    const fresh = instantiateSimpleComponent(template, { x: 0, y: 0 });
    expect(normalizedInstantiation(atDrop)).toEqual(normalizedInstantiation(fresh));
  });

  it('instantiating does not mutate the template', () => {
    const before = JSON.stringify(basicPowertrain);
    instantiateSimpleComponent(basicPowertrain, { x: 500, y: 300 });
    instantiateSimpleComponent(basicPowertrain, { x: 500, y: 300 });
    expect(JSON.stringify(basicPowertrain)).toBe(before);
  });
});

/* ── Instantiation behavior (drop path) ─────────────────────────────────── */

interface NormalizedInstantiation {
  package: { declaredName: string; metadata: Array<{ key: string; value: string }>; width: number; height: number };
  children: Array<{ kind: string; declaredName: string; definition: string; mass: number; position: { x: number; y: number }; inputs: Array<{ name: string }>; outputs: Array<{ name: string }> }>;
  edges: Array<{ sourceName: string; sourceHandlePort: string; targetName: string; targetHandlePort: string }>;
}

/** Instantiation result with fresh ids stripped — structural equality only. */
function normalizedInstantiation(result: { nodes: Node[]; edges: Edge[] }): NormalizedInstantiation {
  const packageNode = result.nodes.find((node) => node.type === 'package')!;
  const children = result.nodes.filter((node) => node.type === 'part' || node.type === 'item');
  const childById = new Map(children.map((node) => [node.id, node]));
  const packageData = packageNode.data as Record<string, unknown>;

  return {
    package: {
      declaredName: String(packageData.declaredName),
      metadata: (packageData.metadata ?? []) as Array<{ key: string; value: string }>,
      width: packageNode.width ?? 0,
      height: packageNode.height ?? 0
    },
    children: children.map((node) => {
      const data = node.data as Record<string, unknown>;
      return {
        kind: node.type as string,
        declaredName: String(data.declaredName),
        definition: String(data.definition ?? ''),
        mass: Number(data.mass ?? 0),
        position: { ...node.position },
        inputs: ((data.inputs ?? []) as Array<{ name: string }>).map((port) => ({ name: port.name })),
        outputs: ((data.outputs ?? []) as Array<{ name: string }>).map((port) => ({ name: port.name }))
      };
    }),
    edges: result.edges.map((edge) => {
      const sourceNode = childById.get(edge.source)!;
      const targetNode = childById.get(edge.target)!;
      const sourceData = sourceNode.data as Record<string, unknown>;
      const targetData = targetNode.data as Record<string, unknown>;
      return {
        sourceName: String(sourceData.declaredName),
        sourceHandlePort: String(edge.sourceHandle ?? '').split('-output-')[1] ?? '',
        targetName: String(targetData.declaredName),
        targetHandlePort: String(edge.targetHandle ?? '').split('-input-')[1] ?? ''
      };
    })
  };
}

describe('Phase 5 drop instantiation keeps the legacy behavior', () => {
  it('drops a package node with children at the offset positions and correct package sizing', () => {
    const result = instantiateSimpleComponent(basicPowertrain, { x: 500, y: 300 });
    const normalized = normalizedInstantiation(result);

    // 1 package + 5 children + 4 edges
    expect(result.nodes).toHaveLength(6);
    expect(result.edges).toHaveLength(4);

    // Package wraps the children with the legacy padding (120) and default node size (300x250).
    expect(normalized.package.width).toBe(1540);
    expect(normalized.package.height).toBe(490);
    expect(normalized.package.declaredName).toBe('Powertrain');
    expect(normalized.package.metadata).toEqual([
      { key: 'caseStudy', value: 'Basic Powertrain' },
      { key: 'analysisType', value: 'torsional_vibration' },
      { key: 'ratedPower', value: '1200kW' }
    ]);

    // Children land at position + (node.position - (min - padding)).
    // min = (80, 70), padding 120 -> offset = (-40, -50).
    expect(normalized.children[0]).toMatchObject({
      kind: 'item',
      declaredName: 'Battery Pack',
      mass: 6200,
      position: { x: 620, y: 420 }
    });
    expect(normalized.children[1]).toMatchObject({
      kind: 'part',
      declaredName: 'Power Converter',
      definition: 'Marine Propulsion Converter',
      position: { x: 870, y: 420 }
    });
    expect(normalized.children[4]).toMatchObject({
      declaredName: 'Fixed Pitch Propeller',
      position: { x: 1620, y: 420 }
    });
  });

  it('rewrites edge handles to the fresh child node ids', () => {
    const result = instantiateSimpleComponent(basicPowertrain, { x: 0, y: 0 });
    const children = result.nodes.filter((node) => node.type === 'part' || node.type === 'item');
    const battery = children.find((node) => (node.data as { declaredName?: string }).declaredName === 'Battery Pack')!;
    const converter = children.find((node) => (node.data as { declaredName?: string }).declaredName === 'Power Converter')!;
    const batteryEdge = result.edges.find((edge) => edge.source === battery.id)!;

    expect(batteryEdge.sourceHandle).toBe(`${battery.id}-output-dc_power`);
    expect(batteryEdge.targetHandle).toBe(`${converter.id}-input-dc_power`);
    expect(result.edges.every((edge) => edge.source !== edge.target)).toBe(true);
  });

  it('gives every dropped node/edge/port a fresh id (repeated drops do not collide)', () => {
    const first = instantiateSimpleComponent(basicPowertrain, { x: 0, y: 0 });
    const second = instantiateSimpleComponent(basicPowertrain, { x: 0, y: 0 });
    const firstIds = new Set(first.nodes.map((node) => node.id));
    const secondIds = new Set(second.nodes.map((node) => node.id));
    expect(firstIds.size).toBe(first.nodes.length);
    expect(secondIds.size).toBe(second.nodes.length);
    for (const id of firstIds) expect(secondIds.has(id)).toBe(false);

    const firstPortIds = first.nodes
      .flatMap((node) => [...((node.data as { inputs?: Array<{ id: string }> }).inputs ?? []), ...((node.data as { outputs?: Array<{ id: string }> }).outputs ?? [])])
      .map((port) => port.id);
    const secondPortIds = second.nodes
      .flatMap((node) => [...((node.data as { inputs?: Array<{ id: string }> }).inputs ?? []), ...((node.data as { outputs?: Array<{ id: string }> }).outputs ?? [])])
      .map((port) => port.id);
    expect(new Set(firstPortIds).size).toBe(firstPortIds.length);
    for (const id of firstPortIds) expect(secondPortIds.includes(id)).toBe(false);
  });

  it('drops the simantics SSP template with its simulation-binding package metadata', () => {
    const result = instantiateSimpleComponent(simanticsSspCloudTemplate, { x: 100, y: 100 });
    const packageNode = result.nodes.find((node) => node.type === 'package')!;
    const packageData = packageNode.data as Record<string, unknown>;
    expect(packageData.metadata).toContainEqual({ key: 'templateSimulation', value: 'simantics-ssp-cloud-template' });
    expect(result.nodes).toHaveLength(6);
    expect(result.edges).toHaveLength(9);
    // measured sizes flow into the package bounding box (600x360 nodes at x 80..2160, padding 120)
    expect(packageNode.width).toBe(2920);
    expect(packageNode.height).toBe(600);
  });
});