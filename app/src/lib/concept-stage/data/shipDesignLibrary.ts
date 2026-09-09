import type { ShipDesign, ShipDesignTemplate } from '../types/shipDesign';
import { buildSemanticLibraryTemplate } from '../sysml/session/libraryAuthoring';

// Phase 5 rework: the ship design templates are semantic SysML models built
// with the library authoring DSL (definitions/usages/ports/flows), projected
// to the canvas payload at drag time — the preview stays pixel-identical.

// ── Commercial Vessel Design (Diesel-Mechanical) ──
const commercialVesselDesign: ShipDesignTemplate = buildSemanticLibraryTemplate({
  id: 'commercial-vessel-template',
  name: 'Commercial Vessel',
  declaredName: 'Commercial Vessel',
  comment: 'Standard commercial vessel with diesel propulsion',
  templateId: 'PKG-COMMERCIAL-VESSEL',
  metadata: [
    { key: 'vesselType', value: 'Commercial' },
    { key: 'propulsion', value: 'Diesel-Mechanical' }
  ],
  usages: [
    {
      kind: 'part',
      name: 'Main Diesel Engine',
      definition: 'Marine Diesel Engine',
      position: { x: 500, y: 300 },
      comment: '4-stroke marine diesel engine',
      mass: 8500,
      metadata: [
        { key: 'power', value: '2500kW' },
        { key: 'rpm', value: '750' }
      ],
      inputs: [{ name: 'fuel', interfaceType: 'mdo' }],
      outputs: [{ name: 'shaft', interfaceType: 'propeller-drive-shaft' }]
    },
    {
      kind: 'part',
      name: 'Reduction Gearbox',
      definition: 'Marine Gearbox',
      position: { x: 850, y: 300 },
      comment: 'Reduces engine RPM for propeller',
      mass: 1200,
      metadata: [
        { key: 'ratio', value: '5:1' }
      ],
      inputs: [{ name: 'shaft_in', interfaceType: 'propeller-drive-shaft' }],
      outputs: [{ name: 'shaft_out', interfaceType: 'propeller-drive-shaft' }]
    },
    {
      kind: 'part',
      name: 'Fixed Pitch Propeller',
      definition: 'Marine Propeller',
      position: { x: 1200, y: 300 },
      comment: '4-blade fixed pitch propeller',
      mass: 2800,
      metadata: [
        { key: 'diameter', value: '4.5m' },
        { key: 'blades', value: '4' }
      ],
      inputs: [{ name: 'shaft', interfaceType: 'propeller-drive-shaft' }],
      outputs: []
    },
    {
      kind: 'part',
      name: 'Auxiliary Generator',
      definition: 'Marine Generator',
      position: { x: 500, y: 550 },
      comment: 'Diesel generator for auxiliary power',
      mass: 3200,
      metadata: [
        { key: 'power', value: '500kW' },
        { key: 'voltage', value: '440V' }
      ],
      inputs: [{ name: 'fuel', interfaceType: 'mdo' }],
      outputs: [{ name: 'power', interfaceType: 'iec-440v-60hz' }]
    },
    {
      kind: 'item',
      name: 'Main Fuel Tank',
      position: { x: 100, y: 250 },
      comment: 'Heavy fuel oil tank',
      mass: 45000,
      metadata: [
        { key: 'capacity', value: '50000L' }
      ],
      inputs: [],
      outputs: [{ name: 'fuel', interfaceType: 'mdo' }]
    }
  ],
  flows: [
    { source: 'Main Fuel Tank', sourcePort: 'fuel', target: 'Main Diesel Engine', targetPort: 'fuel' },
    { source: 'Main Fuel Tank', sourcePort: 'fuel', target: 'Auxiliary Generator', targetPort: 'fuel' },
    { source: 'Main Diesel Engine', sourcePort: 'shaft', target: 'Reduction Gearbox', targetPort: 'shaft_in' },
    { source: 'Reduction Gearbox', sourcePort: 'shaft_out', target: 'Fixed Pitch Propeller', targetPort: 'shaft' }
  ]
});

// ── LNG-Powered RoPax Ferry ──
const lngFerryDesign: ShipDesignTemplate = buildSemanticLibraryTemplate({
  id: 'lng-ferry-template',
  name: 'LNG-Powered RoPax Ferry',
  declaredName: 'LNG-Powered RoPax Ferry',
  comment: 'Dual-fuel LNG ferry with azimuth thrusters for short-sea passenger and vehicle transport',
  templateId: 'PKG-LNG-FERRY',
  metadata: [
    { key: 'vesselType', value: 'RoPax Ferry' },
    { key: 'propulsion', value: 'LNG Dual-Fuel' },
    { key: 'fuelType', value: 'LNG + MGO pilot' }
  ],
  usages: [
    {
      kind: 'part',
      name: 'Type-C LNG Tank',
      definition: 'Cryogenic Fuel Tank',
      position: { x: 200, y: 300 },
      comment: 'Vacuum-insulated Type-C cylindrical LNG tank, 200 m³ at -162°C',
      mass: 18000,
      metadata: [
        { key: 'volume', value: '200m³' },
        { key: 'designPressure', value: '10bar' },
        { key: 'boilOffRate', value: '0.25%/day' }
      ],
      inputs: [],
      outputs: [{ name: 'lng_fuel', interfaceType: 'lng' }]
    },
    {
      kind: 'part',
      name: 'LNG Gas Handling Unit',
      definition: 'Fuel Gas Supply System',
      position: { x: 850, y: 300 },
      comment: 'Vaporiser, gas valve unit, and BOG compressor feeding dual-fuel engines',
      mass: 4200,
      metadata: [
        { key: 'vaporiserType', value: 'Glycol-Water' },
        { key: 'supplyPressure', value: '6bar' },
        { key: 'capacity', value: '1800kg/h' }
      ],
      inputs: [{ name: 'lng_in', interfaceType: 'lng' }],
      outputs: [{ name: 'gas_fuel', interfaceType: 'lng' }]
    },
    {
      kind: 'part',
      name: 'Port Dual-Fuel Engine',
      definition: 'LNG Dual-Fuel Marine Engine',
      position: { x: 1500, y: 150 },
      comment: 'Port-side dual-fuel main engine — LNG with MGO pilot injection',
      mass: 12500,
      metadata: [
        { key: 'power', value: '4200kW' },
        { key: 'rpm', value: '600' },
        { key: 'fuelMode', value: 'Gas (LNG) + MGO pilot' }
      ],
      inputs: [
        { name: 'gas_in', interfaceType: 'lng' },
        { name: 'pilot_fuel', interfaceType: 'mdo' }
      ],
      outputs: [{ name: 'shaft', interfaceType: 'propeller-drive-shaft' }]
    },
    {
      kind: 'part',
      name: 'Starboard Dual-Fuel Engine',
      definition: 'LNG Dual-Fuel Marine Engine',
      position: { x: 1500, y: 650 },
      comment: 'Starboard-side dual-fuel main engine — LNG with MGO pilot injection',
      mass: 12500,
      metadata: [
        { key: 'power', value: '4200kW' },
        { key: 'rpm', value: '600' },
        { key: 'fuelMode', value: 'Gas (LNG) + MGO pilot' }
      ],
      inputs: [
        { name: 'gas_in', interfaceType: 'lng' },
        { name: 'pilot_fuel', interfaceType: 'mdo' }
      ],
      outputs: [{ name: 'shaft', interfaceType: 'propeller-drive-shaft' }]
    },
    {
      kind: 'part',
      name: 'Port Azimuth Thruster',
      definition: 'Azimuth Thruster',
      position: { x: 2150, y: 150 },
      comment: 'Port-side 360° steerable azimuth thruster with controllable-pitch propeller',
      mass: 5600,
      metadata: [
        { key: 'power', value: '4200kW' },
        { key: 'propellerDiameter', value: '3.8m' },
        { key: 'steeringAngle', value: '360°' }
      ],
      inputs: [{ name: 'shaft_in', interfaceType: 'propeller-drive-shaft' }],
      outputs: []
    },
    {
      kind: 'part',
      name: 'Starboard Azimuth Thruster',
      definition: 'Azimuth Thruster',
      position: { x: 2150, y: 650 },
      comment: 'Starboard-side 360° steerable azimuth thruster with controllable-pitch propeller',
      mass: 5600,
      metadata: [
        { key: 'power', value: '4200kW' },
        { key: 'propellerDiameter', value: '3.8m' },
        { key: 'steeringAngle', value: '360°' }
      ],
      inputs: [{ name: 'shaft_in', interfaceType: 'propeller-drive-shaft' }],
      outputs: []
    },
    {
      kind: 'item',
      name: 'MGO Pilot Fuel Tank',
      position: { x: 850, y: 900 },
      comment: 'Marine gas oil tank for pilot injection and backup operation',
      mass: 8000,
      metadata: [
        { key: 'capacity', value: '15000L' }
      ],
      inputs: [],
      outputs: [{ name: 'mgo_fuel', interfaceType: 'mdo' }]
    }
  ],
  flows: [
    { source: 'Type-C LNG Tank', sourcePort: 'lng_fuel', target: 'LNG Gas Handling Unit', targetPort: 'lng_in' },
    { source: 'LNG Gas Handling Unit', sourcePort: 'gas_fuel', target: 'Port Dual-Fuel Engine', targetPort: 'gas_in' },
    { source: 'LNG Gas Handling Unit', sourcePort: 'gas_fuel', target: 'Starboard Dual-Fuel Engine', targetPort: 'gas_in' },
    { source: 'MGO Pilot Fuel Tank', sourcePort: 'mgo_fuel', target: 'Port Dual-Fuel Engine', targetPort: 'pilot_fuel' },
    { source: 'MGO Pilot Fuel Tank', sourcePort: 'mgo_fuel', target: 'Starboard Dual-Fuel Engine', targetPort: 'pilot_fuel' },
    { source: 'Port Dual-Fuel Engine', sourcePort: 'shaft', target: 'Port Azimuth Thruster', targetPort: 'shaft_in' },
    { source: 'Starboard Dual-Fuel Engine', sourcePort: 'shaft', target: 'Starboard Azimuth Thruster', targetPort: 'shaft_in' }
  ]
});

// ── Diesel-Electric Hybrid Research Vessel ──
const hybridResearchDesign: ShipDesignTemplate = buildSemanticLibraryTemplate({
  id: 'hybrid-research-template',
  name: 'Hybrid Research Vessel',
  declaredName: 'Hybrid Research Vessel',
  comment: 'Diesel-electric hybrid research vessel with dynamic positioning and silent running capability',
  templateId: 'PKG-HYBRID-RESEARCH',
  metadata: [
    { key: 'vesselType', value: 'Research Vessel' },
    { key: 'propulsion', value: 'Diesel-Electric Hybrid' },
    { key: 'dpClass', value: 'DP-2' }
  ],
  usages: [
    {
      kind: 'part',
      name: 'Port Diesel Genset',
      definition: 'Marine Diesel Generator',
      position: { x: 200, y: 600 },
      comment: 'Port-side diesel generator set for propulsion and hotel load',
      mass: 5800,
      metadata: [
        { key: 'electricalPower', value: '1800kWe' },
        { key: 'voltage', value: '690VAC' },
        { key: 'rpm', value: '1200' }
      ],
      inputs: [{ name: 'fuel_in', interfaceType: 'mdo' }],
      outputs: [{ name: 'ac_power', interfaceType: 'iec-690v-60hz' }]
    },
    {
      kind: 'part',
      name: 'Starboard Diesel Genset',
      definition: 'Marine Diesel Generator',
      position: { x: 200, y: 1050 },
      comment: 'Starboard-side diesel generator set for propulsion and hotel load',
      mass: 5800,
      metadata: [
        { key: 'electricalPower', value: '1800kWe' },
        { key: 'voltage', value: '690VAC' },
        { key: 'rpm', value: '1200' }
      ],
      inputs: [{ name: 'fuel_in', interfaceType: 'mdo' }],
      outputs: [{ name: 'ac_power', interfaceType: 'iec-690v-60hz' }]
    },
    {
      kind: 'part',
      name: 'Li-Ion Battery Bank',
      definition: 'Marine Battery System',
      position: { x: 200, y: 1500 },
      comment: 'Lithium-ion battery bank for peak shaving, spinning reserve, and silent DP operation',
      mass: 12000,
      metadata: [
        { key: 'capacity', value: '3000kWh' },
        { key: 'chemistry', value: 'LFP (LiFePO₄)' },
        { key: 'nominalVoltage', value: '1000VDC' },
        { key: 'cRate', value: '2C continuous' }
      ],
      inputs: [{ name: 'charge_in', interfaceType: 'dc-950v' }],
      outputs: [{ name: 'dc_out', interfaceType: 'dc-950v' }]
    },
    {
      kind: 'part',
      name: 'Main Switchboard',
      definition: 'Marine Switchboard',
      position: { x: 850, y: 825 },
      comment: '690V main switchboard with bus-tie, shore connection, and power management',
      mass: 2200,
      metadata: [
        { key: 'voltage', value: '690VAC' },
        { key: 'busConfiguration', value: 'Split bus with tie breaker' },
        { key: 'pms', value: 'Integrated PMS' }
      ],
      inputs: [
        { name: 'genset_p_in', interfaceType: 'iec-690v-60hz' },
        { name: 'genset_s_in', interfaceType: 'iec-690v-60hz' },
        { name: 'battery_in', interfaceType: 'dc-950v' }
      ],
      outputs: [{ name: 'power_dist', interfaceType: 'iec-690v-60hz' }]
    },
    {
      kind: 'part',
      name: 'Main Propulsion Motor',
      definition: 'Permanent Magnet Motor',
      position: { x: 1500, y: 825 },
      comment: 'Direct-drive permanent magnet propulsion motor with variable speed drive',
      mass: 4800,
      metadata: [
        { key: 'ratedPower', value: '2500kW' },
        { key: 'ratedSpeed', value: '0-180rpm' },
        { key: 'efficiency', value: '97.5%' }
      ],
      inputs: [{ name: 'power_in', interfaceType: 'iec-690v-60hz' }],
      outputs: [{ name: 'shaft', interfaceType: 'propeller-drive-shaft' }]
    },
    {
      kind: 'part',
      name: 'Controllable Pitch Propeller',
      definition: 'CPP System',
      position: { x: 2150, y: 825 },
      comment: 'Hydraulic controllable-pitch propeller with low-noise blade design for research operations',
      mass: 3500,
      metadata: [
        { key: 'diameter', value: '4.2m' },
        { key: 'blades', value: '5' },
        { key: 'noiseClass', value: 'DNV Silent-R' }
      ],
      inputs: [{ name: 'shaft_in', interfaceType: 'propeller-drive-shaft' }],
      outputs: []
    },
    {
      kind: 'item',
      name: 'MDO Fuel Tank',
      position: { x: 200, y: 150 },
      comment: 'Marine diesel oil storage tank for gensets',
      mass: 28000,
      metadata: [
        { key: 'capacity', value: '80000L' },
        { key: 'fuelType', value: 'MDO (DMA)' }
      ],
      inputs: [],
      outputs: [{ name: 'mdo_fuel', interfaceType: 'mdo' }]
    }
  ],
  flows: [
    { source: 'MDO Fuel Tank', sourcePort: 'mdo_fuel', target: 'Port Diesel Genset', targetPort: 'fuel_in' },
    { source: 'MDO Fuel Tank', sourcePort: 'mdo_fuel', target: 'Starboard Diesel Genset', targetPort: 'fuel_in' },
    { source: 'Port Diesel Genset', sourcePort: 'ac_power', target: 'Main Switchboard', targetPort: 'genset_p_in' },
    { source: 'Starboard Diesel Genset', sourcePort: 'ac_power', target: 'Main Switchboard', targetPort: 'genset_s_in' },
    { source: 'Li-Ion Battery Bank', sourcePort: 'dc_out', target: 'Main Switchboard', targetPort: 'battery_in' },
    { source: 'Main Switchboard', sourcePort: 'power_dist', target: 'Main Propulsion Motor', targetPort: 'power_in' },
    { source: 'Main Propulsion Motor', sourcePort: 'shaft', target: 'Controllable Pitch Propeller', targetPort: 'shaft_in' }
  ]
});

// ── Fully-Electric Harbor Tug ──
const electricTugDesign: ShipDesignTemplate = buildSemanticLibraryTemplate({
  id: 'electric-tug-template',
  name: 'Fully-Electric Harbor Tug',
  declaredName: 'Fully-Electric Harbor Tug',
  comment: 'Zero-emission battery-electric harbor tug with twin azimuth thrusters and shore charging',
  templateId: 'PKG-ELECTRIC-TUG',
  metadata: [
    { key: 'vesselType', value: 'Harbor Tug' },
    { key: 'propulsion', value: 'Fully Electric' },
    { key: 'bollardPull', value: '70t' },
    { key: 'emissions', value: 'Zero emission (harbor)' }
  ],
  usages: [
    {
      kind: 'part',
      name: 'Battery Room',
      definition: 'Marine Battery System',
      position: { x: 200, y: 650 },
      comment: 'Modular LFP battery banks — 6 MWh total with liquid cooling and fire suppression',
      mass: 28000,
      metadata: [
        { key: 'capacity', value: '6000kWh' },
        { key: 'chemistry', value: 'LFP' },
        { key: 'voltage', value: '1000VDC' },
        { key: 'cooling', value: 'Liquid (glycol)' },
        { key: 'fireSuppression', value: 'NOVEC 1230' }
      ],
      inputs: [{ name: 'charge', interfaceType: 'dc-950v' }],
      outputs: [{ name: 'dc_out', interfaceType: 'dc-950v' }]
    },
    {
      kind: 'part',
      name: 'Shore Charging Connection',
      definition: 'Shore Power Interface',
      position: { x: 200, y: 150 },
      comment: 'Automated shore charging station — 2 MW DC fast charge, CCS Combo-2 connector',
      mass: 350,
      metadata: [
        { key: 'chargingPower', value: '2000kW' },
        { key: 'connector', value: 'CCS Combo-2' },
        { key: 'chargeTime', value: '<3h (0-100%)' }
      ],
      inputs: [],
      outputs: [{ name: 'dc_charge', interfaceType: 'dc-950v' }]
    },
    {
      kind: 'part',
      name: 'DC Main Switchboard',
      definition: 'DC Distribution Panel',
      position: { x: 850, y: 400 },
      comment: '1000 VDC main switchboard with solid-state bus-tie and protection relays',
      mass: 1100,
      metadata: [
        { key: 'voltage', value: '1000VDC' },
        { key: 'protection', value: 'Solid-state circuit breakers' },
        { key: 'redundancy', value: 'Dual bus' }
      ],
      inputs: [
        { name: 'battery_in', interfaceType: 'dc-950v' },
        { name: 'shore_in', interfaceType: 'dc-950v' }
      ],
      outputs: [{ name: 'dc_dist', interfaceType: 'dc-950v' }]
    },
    {
      kind: 'part',
      name: 'Port Propulsion Drive',
      definition: 'Variable Frequency Drive',
      position: { x: 1500, y: 150 },
      comment: 'Port-side DC-AC inverter and motor drive for azimuth thruster',
      mass: 1800,
      metadata: [
        { key: 'ratedPower', value: '2500kW' },
        { key: 'inputVoltage', value: '1000VDC' },
        { key: 'outputVoltage', value: '690VAC' }
      ],
      inputs: [{ name: 'dc_in', interfaceType: 'dc-950v' }],
      outputs: [{ name: 'ac_out', interfaceType: 'iec-690v-60hz' }]
    },
    {
      kind: 'part',
      name: 'Starboard Propulsion Drive',
      definition: 'Variable Frequency Drive',
      position: { x: 1500, y: 650 },
      comment: 'Starboard-side DC-AC inverter and motor drive for azimuth thruster',
      mass: 1800,
      metadata: [
        { key: 'ratedPower', value: '2500kW' },
        { key: 'inputVoltage', value: '1000VDC' },
        { key: 'outputVoltage', value: '690VAC' }
      ],
      inputs: [{ name: 'dc_in', interfaceType: 'dc-950v' }],
      outputs: [{ name: 'ac_out', interfaceType: 'iec-690v-60hz' }]
    },
    {
      kind: 'part',
      name: 'Port Electric Motor',
      definition: 'Permanent Magnet Motor',
      position: { x: 2150, y: 150 },
      comment: 'Port-side direct-drive PM motor integrated with azimuth thruster',
      mass: 3200,
      metadata: [
        { key: 'ratedPower', value: '2500kW' },
        { key: 'ratedSpeed', value: '0-750rpm' },
        { key: 'efficiency', value: '97%' }
      ],
      inputs: [{ name: 'ac_in', interfaceType: 'iec-690v-60hz' }],
      outputs: [{ name: 'shaft', interfaceType: 'propeller-drive-shaft' }]
    },
    {
      kind: 'part',
      name: 'Starboard Electric Motor',
      definition: 'Permanent Magnet Motor',
      position: { x: 2150, y: 650 },
      comment: 'Starboard-side direct-drive PM motor integrated with azimuth thruster',
      mass: 3200,
      metadata: [
        { key: 'ratedPower', value: '2500kW' },
        { key: 'ratedSpeed', value: '0-750rpm' },
        { key: 'efficiency', value: '97%' }
      ],
      inputs: [{ name: 'ac_in', interfaceType: 'iec-690v-60hz' }],
      outputs: [{ name: 'shaft', interfaceType: 'propeller-drive-shaft' }]
    },
    {
      kind: 'part',
      name: 'Port Azimuth Thruster',
      definition: 'Azimuth Thruster',
      position: { x: 2800, y: 150 },
      comment: 'Port-side 360° azimuth thruster, nozzle optimised for bollard pull',
      mass: 4200,
      metadata: [
        { key: 'ratedPower', value: '2500kW' },
        { key: 'propellerDiameter', value: '3.2m' },
        { key: 'nozzle', value: 'High-efficiency 19A' }
      ],
      inputs: [{ name: 'shaft_in', interfaceType: 'propeller-drive-shaft' }],
      outputs: []
    },
    {
      kind: 'part',
      name: 'Starboard Azimuth Thruster',
      definition: 'Azimuth Thruster',
      position: { x: 2800, y: 650 },
      comment: 'Starboard-side 360° azimuth thruster, nozzle optimised for bollard pull',
      mass: 4200,
      metadata: [
        { key: 'ratedPower', value: '2500kW' },
        { key: 'propellerDiameter', value: '3.2m' },
        { key: 'nozzle', value: 'High-efficiency 19A' }
      ],
      inputs: [{ name: 'shaft_in', interfaceType: 'propeller-drive-shaft' }],
      outputs: []
    }
  ],
  flows: [
    { source: 'Shore Charging Connection', sourcePort: 'dc_charge', target: 'DC Main Switchboard', targetPort: 'shore_in' },
    { source: 'Battery Room', sourcePort: 'dc_out', target: 'DC Main Switchboard', targetPort: 'battery_in' },
    { source: 'DC Main Switchboard', sourcePort: 'dc_dist', target: 'Port Propulsion Drive', targetPort: 'dc_in' },
    { source: 'DC Main Switchboard', sourcePort: 'dc_dist', target: 'Starboard Propulsion Drive', targetPort: 'dc_in' },
    { source: 'Port Propulsion Drive', sourcePort: 'ac_out', target: 'Port Electric Motor', targetPort: 'ac_in' },
    { source: 'Starboard Propulsion Drive', sourcePort: 'ac_out', target: 'Starboard Electric Motor', targetPort: 'ac_in' },
    { source: 'Port Electric Motor', sourcePort: 'shaft', target: 'Port Azimuth Thruster', targetPort: 'shaft_in' },
    { source: 'Starboard Electric Motor', sourcePort: 'shaft', target: 'Starboard Azimuth Thruster', targetPort: 'shaft_in' },
    { source: 'DC Main Switchboard', sourcePort: 'dc_dist', target: 'Battery Room', targetPort: 'charge' }
  ]
});

// ── Ship Design Entries ──

export const commercialVessel: ShipDesign = {
  id: 'commercial-vessel',
  name: 'Commercial Vessel',
  description: 'Standard commercial vessel with complete diesel propulsion system',
  shipType: 'cargo',
  powertrainType: 'diesel-mechanical',
  specifications: {
    length: 150,
    beam: 23,
    draft: 8.5,
    displacement: 12000,
    speed: { cruise: 14, max: 16 },
    power: { total: 3000, propulsion: 2500, auxiliary: 500 },
    fuelCapacity: 50000,
    range: 5000,
    crew: 20
  },
  tags: ['commercial', 'diesel', 'cargo', 'standard'],
  template: commercialVesselDesign
};

export const lngFerry: ShipDesign = {
  id: 'lng-ferry',
  name: 'LNG-Powered RoPax Ferry',
  description: 'Dual-fuel LNG RoPax ferry with twin azimuth thrusters for short-sea passenger and vehicle routes',
  shipType: 'ferry',
  powertrainType: 'lng-powered',
  specifications: {
    length: 135,
    beam: 22,
    draft: 5.8,
    displacement: 8500,
    speed: { cruise: 16, max: 19 },
    power: { total: 8400, propulsion: 8400, auxiliary: 0 },
    fuelCapacity: 200,
    range: 1800,
    crew: 28,
    passengers: 600
  },
  tags: ['lng', 'ferry', 'ropax', 'dual-fuel', 'zero-carbon-ready'],
  template: lngFerryDesign
};

export const hybridResearchVessel: ShipDesign = {
  id: 'hybrid-research-vessel',
  name: 'Hybrid Research Vessel',
  description: 'Diesel-electric hybrid research vessel with DP-2, silent running capability, and multi-mission flexibility',
  shipType: 'research',
  powertrainType: 'diesel-electric-hybrid',
  specifications: {
    length: 78,
    beam: 16,
    draft: 5.2,
    displacement: 3200,
    speed: { cruise: 10, max: 14 },
    power: { total: 3600, propulsion: 2500, auxiliary: 1100 },
    fuelCapacity: 80,
    range: 6000,
    crew: 22,
    passengers: 0
  },
  tags: ['hybrid', 'research', 'dp2', 'silent-running', 'battery'],
  template: hybridResearchDesign
};

export const electricHarborTug: ShipDesign = {
  id: 'electric-harbor-tug',
  name: 'Fully-Electric Harbor Tug',
  description: 'Zero-emission battery-electric harbor tug with 70t bollard pull, twin azimuth thrusters, and fast shore charging',
  shipType: 'tugboat',
  powertrainType: 'fully-electric',
  specifications: {
    length: 32,
    beam: 12.5,
    draft: 5.8,
    displacement: 680,
    speed: { cruise: 8, max: 13 },
    power: { total: 5000, propulsion: 5000, auxiliary: 0 },
    fuelCapacity: 0,
    range: 40,
    crew: 4,
    passengers: 0
  },
  tags: ['electric', 'zero-emission', 'tug', 'battery', 'harbor'],
  template: electricTugDesign
};

// Export all ship designs
export const shipDesigns: ShipDesign[] = [
  commercialVessel,
  lngFerry,
  hybridResearchVessel,
  electricHarborTug
];

// Export categorized designs
export const shipDesignCategories = [
  {
    id: 'commercial',
    name: 'Commercial Vessels',
    designs: [commercialVessel]
  },
  {
    id: 'ferries',
    name: 'Ferries & Passenger',
    designs: [lngFerry]
  },
  {
    id: 'specialized',
    name: 'Specialized Vessels',
    designs: [hybridResearchVessel, electricHarborTug]
  }
];