import type { ShipDesign, ShipDesignTemplate } from '../types/shipDesign';

// ── Commercial Vessel Design (Diesel-Mechanical) ──
const commercialVesselDesign: ShipDesignTemplate = {
  id: 'commercial-vessel-template',
  type: 'package',
  data: {
    declaredName: 'Commercial Vessel',
    comment: 'Standard commercial vessel with diesel propulsion',
    id: 'PKG-COMMERCIAL-VESSEL',
    metadata: [
      { key: 'vesselType', value: 'Commercial' },
      { key: 'propulsion', value: 'Diesel-Mechanical' }
    ],
    nodes: [
      {
        id: 'part-main-engine',
        type: 'part',
        position: { x: 500, y: 300 },
        data: {
          declaredName: 'Main Diesel Engine',
          definition: 'Marine Diesel Engine',
          comment: '4-stroke marine diesel engine',
          id: 'PRT-ENGINE-001',
          mass: 8500,
          metadata: [
            { key: 'power', value: '2500kW' },
            { key: 'rpm', value: '750' }
          ],
          inputs: [{
            id: 'port-fuel-in',
            name: 'fuel',
            interfaceType: 'mdo'
          }],
          outputs: [{
            id: 'port-shaft-out',
            name: 'shaft',
            interfaceType: 'propeller-drive-shaft'
          }]
        }
      },
      {
        id: 'part-gearbox',
        type: 'part',
        position: { x: 850, y: 300 },
        data: {
          declaredName: 'Reduction Gearbox',
          definition: 'Marine Gearbox',
          comment: 'Reduces engine RPM for propeller',
          id: 'PRT-GEARBOX-001',
          mass: 1200,
          metadata: [
            { key: 'ratio', value: '5:1' }
          ],
          inputs: [{
            id: 'port-shaft-in',
            name: 'shaft_in',
            interfaceType: 'propeller-drive-shaft'
          }],
          outputs: [{
            id: 'port-shaft-out',
            name: 'shaft_out',
            interfaceType: 'propeller-drive-shaft'
          }]
        }
      },
      {
        id: 'part-propeller',
        type: 'part',
        position: { x: 1200, y: 300 },
        data: {
          declaredName: 'Fixed Pitch Propeller',
          definition: 'Marine Propeller',
          comment: '4-blade fixed pitch propeller',
          id: 'PRT-PROP-001',
          mass: 2800,
          metadata: [
            { key: 'diameter', value: '4.5m' },
            { key: 'blades', value: '4' }
          ],
          inputs: [{
            id: 'port-shaft-in',
            name: 'shaft',
            interfaceType: 'propeller-drive-shaft'
          }],
          outputs: []
        }
      },
      {
        id: 'part-generator',
        type: 'part',
        position: { x: 500, y: 550 },
        data: {
          declaredName: 'Auxiliary Generator',
          definition: 'Marine Generator',
          comment: 'Diesel generator for auxiliary power',
          id: 'PRT-GEN-001',
          mass: 3200,
          metadata: [
            { key: 'power', value: '500kW' },
            { key: 'voltage', value: '440V' }
          ],
          inputs: [{
            id: 'port-fuel-in',
            name: 'fuel',
            interfaceType: 'mdo'
          }],
          outputs: [{
            id: 'port-power-out',
            name: 'power',
            interfaceType: 'iec-440v-60hz'
          }]
        }
      },
      {
        id: 'item-fuel-tank',
        type: 'item',
        position: { x: 100, y: 250 },
        data: {
          declaredName: 'Main Fuel Tank',
          comment: 'Heavy fuel oil tank',
          id: 'ITM-FUEL-001',
          mass: 45000,
          metadata: [
            { key: 'capacity', value: '50000L' }
          ],
          inputs: [],
          outputs: [{
            id: 'port-fuel-out',
            name: 'fuel',
            interfaceType: 'mdo'
          }]
        }
      }
    ],
    edges: [
      {
        id: 'edge-fuel-engine',
        source: 'item-fuel-tank',
        target: 'part-main-engine',
        sourceHandle: 'item-fuel-tank-output-fuel',
        targetHandle: 'part-main-engine-input-fuel',
        type: 'default',
        data: { compatibility: 'direct', connectionType: 'flow' }
      },
      {
        id: 'edge-fuel-generator',
        source: 'item-fuel-tank',
        target: 'part-generator',
        sourceHandle: 'item-fuel-tank-output-fuel',
        targetHandle: 'part-generator-input-fuel',
        type: 'default',
        data: { compatibility: 'direct', connectionType: 'flow' }
      },
      {
        id: 'edge-engine-gearbox',
        source: 'part-main-engine',
        target: 'part-gearbox',
        sourceHandle: 'part-main-engine-output-shaft',
        targetHandle: 'part-gearbox-input-shaft_in',
        type: 'default',
        data: { compatibility: 'direct', connectionType: 'flow' }
      },
      {
        id: 'edge-gearbox-propeller',
        source: 'part-gearbox',
        target: 'part-propeller',
        sourceHandle: 'part-gearbox-output-shaft_out',
        targetHandle: 'part-propeller-input-shaft',
        type: 'default',
        data: { compatibility: 'direct', connectionType: 'flow' }
      }
    ],
    inputs: [],
    outputs: []
  }
};

// ── LNG-Powered RoPax Ferry ──
const lngFerryDesign: ShipDesignTemplate = {
  id: 'lng-ferry-template',
  type: 'package',
  data: {
    declaredName: 'LNG-Powered RoPax Ferry',
    comment: 'Dual-fuel LNG ferry with azimuth thrusters for short-sea passenger and vehicle transport',
    id: 'PKG-LNG-FERRY',
    metadata: [
      { key: 'vesselType', value: 'RoPax Ferry' },
      { key: 'propulsion', value: 'LNG Dual-Fuel' },
      { key: 'fuelType', value: 'LNG + MGO pilot' }
    ],
    nodes: [
      {
        id: 'part-lng-tank',
        type: 'part',
        position: { x: 200, y: 300 },
        data: {
          declaredName: 'Type-C LNG Tank',
          definition: 'Cryogenic Fuel Tank',
          comment: 'Vacuum-insulated Type-C cylindrical LNG tank, 200 m³ at -162°C',
          id: 'PRT-LNG-TANK-001',
          mass: 18000,
          metadata: [
            { key: 'volume', value: '200m³' },
            { key: 'designPressure', value: '10bar' },
            { key: 'boilOffRate', value: '0.25%/day' }
          ],
          inputs: [],
          outputs: [{
            id: 'port-lng-out',
            name: 'lng_fuel',
            interfaceType: 'lng'
          }]
        }
      },
      {
        id: 'part-gas-handling',
        type: 'part',
        position: { x: 850, y: 300 },
        data: {
          declaredName: 'LNG Gas Handling Unit',
          definition: 'Fuel Gas Supply System',
          comment: 'Vaporiser, gas valve unit, and BOG compressor feeding dual-fuel engines',
          id: 'PRT-GAS-HANDLING-001',
          mass: 4200,
          metadata: [
            { key: 'vaporiserType', value: 'Glycol-Water' },
            { key: 'supplyPressure', value: '6bar' },
            { key: 'capacity', value: '1800kg/h' }
          ],
          inputs: [{
            id: 'port-gh-lng-in',
            name: 'lng_in',
            interfaceType: 'lng'
          }],
          outputs: [{
            id: 'port-gh-gas-out',
            name: 'gas_fuel',
            interfaceType: 'lng'
          }]
        }
      },
      {
        id: 'part-df-engine-port',
        type: 'part',
        position: { x: 1500, y: 150 },
        data: {
          declaredName: 'Port Dual-Fuel Engine',
          definition: 'LNG Dual-Fuel Marine Engine',
          comment: 'Port-side dual-fuel main engine — LNG with MGO pilot injection',
          id: 'PRT-DF-ENGINE-PORT-001',
          mass: 12500,
          metadata: [
            { key: 'power', value: '4200kW' },
            { key: 'rpm', value: '600' },
            { key: 'fuelMode', value: 'Gas (LNG) + MGO pilot' }
          ],
          inputs: [
            { id: 'port-df-p-gas', name: 'gas_in', interfaceType: 'lng' },
            { id: 'port-df-p-pilot', name: 'pilot_fuel', interfaceType: 'mdo' }
          ],
          outputs: [{
            id: 'port-df-p-shaft',
            name: 'shaft',
            interfaceType: 'propeller-drive-shaft'
          }]
        }
      },
      {
        id: 'part-df-engine-stbd',
        type: 'part',
        position: { x: 1500, y: 650 },
        data: {
          declaredName: 'Starboard Dual-Fuel Engine',
          definition: 'LNG Dual-Fuel Marine Engine',
          comment: 'Starboard-side dual-fuel main engine — LNG with MGO pilot injection',
          id: 'PRT-DF-ENGINE-STBD-001',
          mass: 12500,
          metadata: [
            { key: 'power', value: '4200kW' },
            { key: 'rpm', value: '600' },
            { key: 'fuelMode', value: 'Gas (LNG) + MGO pilot' }
          ],
          inputs: [
            { id: 'port-df-s-gas', name: 'gas_in', interfaceType: 'lng' },
            { id: 'port-df-s-pilot', name: 'pilot_fuel', interfaceType: 'mdo' }
          ],
          outputs: [{
            id: 'port-df-s-shaft',
            name: 'shaft',
            interfaceType: 'propeller-drive-shaft'
          }]
        }
      },
      {
        id: 'part-azimuth-port',
        type: 'part',
        position: { x: 2150, y: 150 },
        data: {
          declaredName: 'Port Azimuth Thruster',
          definition: 'Azimuth Thruster',
          comment: 'Port-side 360° steerable azimuth thruster with controllable-pitch propeller',
          id: 'PRT-AZIMUTH-PORT-001',
          mass: 5600,
          metadata: [
            { key: 'power', value: '4200kW' },
            { key: 'propellerDiameter', value: '3.8m' },
            { key: 'steeringAngle', value: '360°' }
          ],
          inputs: [{
            id: 'port-az-p-shaft',
            name: 'shaft_in',
            interfaceType: 'propeller-drive-shaft'
          }],
          outputs: []
        }
      },
      {
        id: 'part-azimuth-stbd',
        type: 'part',
        position: { x: 2150, y: 650 },
        data: {
          declaredName: 'Starboard Azimuth Thruster',
          definition: 'Azimuth Thruster',
          comment: 'Starboard-side 360° steerable azimuth thruster with controllable-pitch propeller',
          id: 'PRT-AZIMUTH-STBD-001',
          mass: 5600,
          metadata: [
            { key: 'power', value: '4200kW' },
            { key: 'propellerDiameter', value: '3.8m' },
            { key: 'steeringAngle', value: '360°' }
          ],
          inputs: [{
            id: 'port-az-s-shaft',
            name: 'shaft_in',
            interfaceType: 'propeller-drive-shaft'
          }],
          outputs: []
        }
      },
      {
        id: 'item-mgo-tank',
        type: 'item',
        position: { x: 850, y: 900 },
        data: {
          declaredName: 'MGO Pilot Fuel Tank',
          comment: 'Marine gas oil tank for pilot injection and backup operation',
          id: 'ITM-MGO-TANK-001',
          mass: 8000,
          metadata: [
            { key: 'capacity', value: '15000L' }
          ],
          inputs: [],
          outputs: [{
            id: 'port-mgo-out',
            name: 'mgo_fuel',
            interfaceType: 'mdo'
          }]
        }
      }
    ],
    edges: [
      { id: 'edge-lng-tank-gh', source: 'part-lng-tank', target: 'part-gas-handling', sourceHandle: 'part-lng-tank-output-lng_fuel', targetHandle: 'part-gas-handling-input-lng_in', type: 'default', data: { compatibility: 'direct', connectionType: 'flow' } },
      { id: 'edge-gh-df-port', source: 'part-gas-handling', target: 'part-df-engine-port', sourceHandle: 'part-gas-handling-output-gas_fuel', targetHandle: 'part-df-engine-port-input-gas_in', type: 'default', data: { compatibility: 'direct', connectionType: 'flow' } },
      { id: 'edge-gh-df-stbd', source: 'part-gas-handling', target: 'part-df-engine-stbd', sourceHandle: 'part-gas-handling-output-gas_fuel', targetHandle: 'part-df-engine-stbd-input-gas_in', type: 'default', data: { compatibility: 'direct', connectionType: 'flow' } },
      { id: 'edge-mgo-df-port', source: 'item-mgo-tank', target: 'part-df-engine-port', sourceHandle: 'item-mgo-tank-output-mgo_fuel', targetHandle: 'part-df-engine-port-input-pilot_fuel', type: 'default', data: { compatibility: 'direct', connectionType: 'flow' } },
      { id: 'edge-mgo-df-stbd', source: 'item-mgo-tank', target: 'part-df-engine-stbd', sourceHandle: 'item-mgo-tank-output-mgo_fuel', targetHandle: 'part-df-engine-stbd-input-pilot_fuel', type: 'default', data: { compatibility: 'direct', connectionType: 'flow' } },
      { id: 'edge-df-port-azimuth', source: 'part-df-engine-port', target: 'part-azimuth-port', sourceHandle: 'part-df-engine-port-output-shaft', targetHandle: 'part-azimuth-port-input-shaft_in', type: 'default', data: { compatibility: 'direct', connectionType: 'flow' } },
      { id: 'edge-df-stbd-azimuth', source: 'part-df-engine-stbd', target: 'part-azimuth-stbd', sourceHandle: 'part-df-engine-stbd-output-shaft', targetHandle: 'part-azimuth-stbd-input-shaft_in', type: 'default', data: { compatibility: 'direct', connectionType: 'flow' } }
    ],
    inputs: [],
    outputs: []
  }
};

// ── Diesel-Electric Hybrid Research Vessel ──
const hybridResearchDesign: ShipDesignTemplate = {
  id: 'hybrid-research-template',
  type: 'package',
  data: {
    declaredName: 'Hybrid Research Vessel',
    comment: 'Diesel-electric hybrid research vessel with dynamic positioning and silent running capability',
    id: 'PKG-HYBRID-RESEARCH',
    metadata: [
      { key: 'vesselType', value: 'Research Vessel' },
      { key: 'propulsion', value: 'Diesel-Electric Hybrid' },
      { key: 'dpClass', value: 'DP-2' }
    ],
    nodes: [
      {
        id: 'part-diesel-genset-port',
        type: 'part',
        position: { x: 200, y: 600 },
        data: {
          declaredName: 'Port Diesel Genset',
          definition: 'Marine Diesel Generator',
          comment: 'Port-side diesel generator set for propulsion and hotel load',
          id: 'PRT-GENSET-PORT-001',
          mass: 5800,
          metadata: [
            { key: 'electricalPower', value: '1800kWe' },
            { key: 'voltage', value: '690VAC' },
            { key: 'rpm', value: '1200' }
          ],
          inputs: [{ id: 'port-gs-p-fuel', name: 'fuel_in', interfaceType: 'mdo' }],
          outputs: [{ id: 'port-gs-p-power', name: 'ac_power', interfaceType: 'iec-690v-60hz' }]
        }
      },
      {
        id: 'part-diesel-genset-stbd',
        type: 'part',
        position: { x: 200, y: 1050 },
        data: {
          declaredName: 'Starboard Diesel Genset',
          definition: 'Marine Diesel Generator',
          comment: 'Starboard-side diesel generator set for propulsion and hotel load',
          id: 'PRT-GENSET-STBD-001',
          mass: 5800,
          metadata: [
            { key: 'electricalPower', value: '1800kWe' },
            { key: 'voltage', value: '690VAC' },
            { key: 'rpm', value: '1200' }
          ],
          inputs: [{ id: 'port-gs-s-fuel', name: 'fuel_in', interfaceType: 'mdo' }],
          outputs: [{ id: 'port-gs-s-power', name: 'ac_power', interfaceType: 'iec-690v-60hz' }]
        }
      },
      {
        id: 'part-battery-bank',
        type: 'part',
        position: { x: 200, y: 1500 },
        data: {
          declaredName: 'Li-Ion Battery Bank',
          definition: 'Marine Battery System',
          comment: 'Lithium-ion battery bank for peak shaving, spinning reserve, and silent DP operation',
          id: 'PRT-BATTERY-BANK-001',
          mass: 12000,
          metadata: [
            { key: 'capacity', value: '3000kWh' },
            { key: 'chemistry', value: 'LFP (LiFePO₄)' },
            { key: 'nominalVoltage', value: '1000VDC' },
            { key: 'cRate', value: '2C continuous' }
          ],
          inputs: [{ id: 'port-bat-charge', name: 'charge_in', interfaceType: 'dc-950v' }],
          outputs: [{ id: 'port-bat-discharge', name: 'dc_out', interfaceType: 'dc-950v' }]
        }
      },
      {
        id: 'part-switchboard',
        type: 'part',
        position: { x: 850, y: 825 },
        data: {
          declaredName: 'Main Switchboard',
          definition: 'Marine Switchboard',
          comment: '690V main switchboard with bus-tie, shore connection, and power management',
          id: 'PRT-SWBD-001',
          mass: 2200,
          metadata: [
            { key: 'voltage', value: '690VAC' },
            { key: 'busConfiguration', value: 'Split bus with tie breaker' },
            { key: 'pms', value: 'Integrated PMS' }
          ],
          inputs: [
            { id: 'port-swbd-genset-p', name: 'genset_p_in', interfaceType: 'iec-690v-60hz' },
            { id: 'port-swbd-genset-s', name: 'genset_s_in', interfaceType: 'iec-690v-60hz' },
            { id: 'port-swbd-battery', name: 'battery_in', interfaceType: 'dc-950v' }
          ],
          outputs: [{ id: 'port-swbd-dist', name: 'power_dist', interfaceType: 'iec-690v-60hz' }]
        }
      },
      {
        id: 'part-propulsion-motor',
        type: 'part',
        position: { x: 1500, y: 825 },
        data: {
          declaredName: 'Main Propulsion Motor',
          definition: 'Permanent Magnet Motor',
          comment: 'Direct-drive permanent magnet propulsion motor with variable speed drive',
          id: 'PRT-PROP-MOTOR-001',
          mass: 4800,
          metadata: [
            { key: 'ratedPower', value: '2500kW' },
            { key: 'ratedSpeed', value: '0-180rpm' },
            { key: 'efficiency', value: '97.5%' }
          ],
          inputs: [{ id: 'port-motor-power', name: 'power_in', interfaceType: 'iec-690v-60hz' }],
          outputs: [{ id: 'port-motor-shaft', name: 'shaft', interfaceType: 'propeller-drive-shaft' }]
        }
      },
      {
        id: 'part-cpp',
        type: 'part',
        position: { x: 2150, y: 825 },
        data: {
          declaredName: 'Controllable Pitch Propeller',
          definition: 'CPP System',
          comment: 'Hydraulic controllable-pitch propeller with low-noise blade design for research operations',
          id: 'PRT-CPP-001',
          mass: 3500,
          metadata: [
            { key: 'diameter', value: '4.2m' },
            { key: 'blades', value: '5' },
            { key: 'noiseClass', value: 'DNV Silent-R' }
          ],
          inputs: [{ id: 'port-cpp-shaft', name: 'shaft_in', interfaceType: 'propeller-drive-shaft' }],
          outputs: []
        }
      },
      {
        id: 'item-fuel-tank-research',
        type: 'item',
        position: { x: 200, y: 150 },
        data: {
          declaredName: 'MDO Fuel Tank',
          comment: 'Marine diesel oil storage tank for gensets',
          id: 'ITM-MDO-RESEARCH-001',
          mass: 28000,
          metadata: [
            { key: 'capacity', value: '80000L' },
            { key: 'fuelType', value: 'MDO (DMA)' }
          ],
          inputs: [],
          outputs: [{ id: 'port-mdo-out', name: 'mdo_fuel', interfaceType: 'mdo' }]
        }
      }
    ],
    edges: [
      { id: 'edge-fuel-genset-p', source: 'item-fuel-tank-research', target: 'part-diesel-genset-port', sourceHandle: 'item-fuel-tank-research-output-mdo_fuel', targetHandle: 'part-diesel-genset-port-input-fuel_in', type: 'default', data: { compatibility: 'direct', connectionType: 'flow' } },
      { id: 'edge-fuel-genset-s', source: 'item-fuel-tank-research', target: 'part-diesel-genset-stbd', sourceHandle: 'item-fuel-tank-research-output-mdo_fuel', targetHandle: 'part-diesel-genset-stbd-input-fuel_in', type: 'default', data: { compatibility: 'direct', connectionType: 'flow' } },
      { id: 'edge-genset-p-swbd', source: 'part-diesel-genset-port', target: 'part-switchboard', sourceHandle: 'part-diesel-genset-port-output-ac_power', targetHandle: 'part-switchboard-input-genset_p_in', type: 'default', data: { compatibility: 'direct', connectionType: 'flow' } },
      { id: 'edge-genset-s-swbd', source: 'part-diesel-genset-stbd', target: 'part-switchboard', sourceHandle: 'part-diesel-genset-stbd-output-ac_power', targetHandle: 'part-switchboard-input-genset_s_in', type: 'default', data: { compatibility: 'direct', connectionType: 'flow' } },
      { id: 'edge-battery-swbd', source: 'part-battery-bank', target: 'part-switchboard', sourceHandle: 'part-battery-bank-output-dc_out', targetHandle: 'part-switchboard-input-battery_in', type: 'default', data: { compatibility: 'direct', connectionType: 'flow' } },
      { id: 'edge-swbd-motor', source: 'part-switchboard', target: 'part-propulsion-motor', sourceHandle: 'part-switchboard-output-power_dist', targetHandle: 'part-propulsion-motor-input-power_in', type: 'default', data: { compatibility: 'direct', connectionType: 'flow' } },
      { id: 'edge-motor-cpp', source: 'part-propulsion-motor', target: 'part-cpp', sourceHandle: 'part-propulsion-motor-output-shaft', targetHandle: 'part-cpp-input-shaft_in', type: 'default', data: { compatibility: 'direct', connectionType: 'flow' } }
    ],
    inputs: [],
    outputs: []
  }
};

// ── Fully-Electric Harbor Tug ──
const electricTugDesign: ShipDesignTemplate = {
  id: 'electric-tug-template',
  type: 'package',
  data: {
    declaredName: 'Fully-Electric Harbor Tug',
    comment: 'Zero-emission battery-electric harbor tug with twin azimuth thrusters and shore charging',
    id: 'PKG-ELECTRIC-TUG',
    metadata: [
      { key: 'vesselType', value: 'Harbor Tug' },
      { key: 'propulsion', value: 'Fully Electric' },
      { key: 'bollardPull', value: '70t' },
      { key: 'emissions', value: 'Zero emission (harbor)' }
    ],
    nodes: [
      {
        id: 'part-battery-room',
        type: 'part',
        position: { x: 200, y: 650 },
        data: {
          declaredName: 'Battery Room',
          definition: 'Marine Battery System',
          comment: 'Modular LFP battery banks — 6 MWh total with liquid cooling and fire suppression',
          id: 'PRT-BATTERY-ROOM-001',
          mass: 28000,
          metadata: [
            { key: 'capacity', value: '6000kWh' },
            { key: 'chemistry', value: 'LFP' },
            { key: 'voltage', value: '1000VDC' },
            { key: 'cooling', value: 'Liquid (glycol)' },
            { key: 'fireSuppression', value: 'NOVEC 1230' }
          ],
          inputs: [{ id: 'port-bat-charge', name: 'charge', interfaceType: 'dc-950v' }],
          outputs: [{ id: 'port-bat-dc', name: 'dc_out', interfaceType: 'dc-950v' }]
        }
      },
      {
        id: 'part-shore-charger',
        type: 'part',
        position: { x: 200, y: 150 },
        data: {
          declaredName: 'Shore Charging Connection',
          definition: 'Shore Power Interface',
          comment: 'Automated shore charging station — 2 MW DC fast charge, CCS Combo-2 connector',
          id: 'PRT-SHORE-CHARGER-001',
          mass: 350,
          metadata: [
            { key: 'chargingPower', value: '2000kW' },
            { key: 'connector', value: 'CCS Combo-2' },
            { key: 'chargeTime', value: '<3h (0-100%)' }
          ],
          inputs: [],
          outputs: [{ id: 'port-shore-dc', name: 'dc_charge', interfaceType: 'dc-950v' }]
        }
      },
      {
        id: 'part-dc-switchboard',
        type: 'part',
        position: { x: 850, y: 400 },
        data: {
          declaredName: 'DC Main Switchboard',
          definition: 'DC Distribution Panel',
          comment: '1000 VDC main switchboard with solid-state bus-tie and protection relays',
          id: 'PRT-DC-SWBD-001',
          mass: 1100,
          metadata: [
            { key: 'voltage', value: '1000VDC' },
            { key: 'protection', value: 'Solid-state circuit breakers' },
            { key: 'redundancy', value: 'Dual bus' }
          ],
          inputs: [
            { id: 'port-dcswbd-bat', name: 'battery_in', interfaceType: 'dc-950v' },
            { id: 'port-dcswbd-shore', name: 'shore_in', interfaceType: 'dc-950v' }
          ],
          outputs: [{ id: 'port-dcswbd-dist', name: 'dc_dist', interfaceType: 'dc-950v' }]
        }
      },
      {
        id: 'part-drive-port',
        type: 'part',
        position: { x: 1500, y: 150 },
        data: {
          declaredName: 'Port Propulsion Drive',
          definition: 'Variable Frequency Drive',
          comment: 'Port-side DC-AC inverter and motor drive for azimuth thruster',
          id: 'PRT-DRIVE-PORT-001',
          mass: 1800,
          metadata: [
            { key: 'ratedPower', value: '2500kW' },
            { key: 'inputVoltage', value: '1000VDC' },
            { key: 'outputVoltage', value: '690VAC' }
          ],
          inputs: [{ id: 'port-drive-p-dc', name: 'dc_in', interfaceType: 'dc-950v' }],
          outputs: [{ id: 'port-drive-p-ac', name: 'ac_out', interfaceType: 'iec-690v-60hz' }]
        }
      },
      {
        id: 'part-drive-stbd',
        type: 'part',
        position: { x: 1500, y: 650 },
        data: {
          declaredName: 'Starboard Propulsion Drive',
          definition: 'Variable Frequency Drive',
          comment: 'Starboard-side DC-AC inverter and motor drive for azimuth thruster',
          id: 'PRT-DRIVE-STBD-001',
          mass: 1800,
          metadata: [
            { key: 'ratedPower', value: '2500kW' },
            { key: 'inputVoltage', value: '1000VDC' },
            { key: 'outputVoltage', value: '690VAC' }
          ],
          inputs: [{ id: 'port-drive-s-dc', name: 'dc_in', interfaceType: 'dc-950v' }],
          outputs: [{ id: 'port-drive-s-ac', name: 'ac_out', interfaceType: 'iec-690v-60hz' }]
        }
      },
      {
        id: 'part-motor-port',
        type: 'part',
        position: { x: 2150, y: 150 },
        data: {
          declaredName: 'Port Electric Motor',
          definition: 'Permanent Magnet Motor',
          comment: 'Port-side direct-drive PM motor integrated with azimuth thruster',
          id: 'PRT-MOTOR-PORT-001',
          mass: 3200,
          metadata: [
            { key: 'ratedPower', value: '2500kW' },
            { key: 'ratedSpeed', value: '0-750rpm' },
            { key: 'efficiency', value: '97%' }
          ],
          inputs: [{ id: 'port-motor-p-ac', name: 'ac_in', interfaceType: 'iec-690v-60hz' }],
          outputs: [{ id: 'port-motor-p-shaft', name: 'shaft', interfaceType: 'propeller-drive-shaft' }]
        }
      },
      {
        id: 'part-motor-stbd',
        type: 'part',
        position: { x: 2150, y: 650 },
        data: {
          declaredName: 'Starboard Electric Motor',
          definition: 'Permanent Magnet Motor',
          comment: 'Starboard-side direct-drive PM motor integrated with azimuth thruster',
          id: 'PRT-MOTOR-STBD-001',
          mass: 3200,
          metadata: [
            { key: 'ratedPower', value: '2500kW' },
            { key: 'ratedSpeed', value: '0-750rpm' },
            { key: 'efficiency', value: '97%' }
          ],
          inputs: [{ id: 'port-motor-s-ac', name: 'ac_in', interfaceType: 'iec-690v-60hz' }],
          outputs: [{ id: 'port-motor-s-shaft', name: 'shaft', interfaceType: 'propeller-drive-shaft' }]
        }
      },
      {
        id: 'part-azimuth-port-tug',
        type: 'part',
        position: { x: 2800, y: 150 },
        data: {
          declaredName: 'Port Azimuth Thruster',
          definition: 'Azimuth Thruster',
          comment: 'Port-side 360° azimuth thruster, nozzle optimised for bollard pull',
          id: 'PRT-AZIMUTH-PORT-TUG-001',
          mass: 4200,
          metadata: [
            { key: 'ratedPower', value: '2500kW' },
            { key: 'propellerDiameter', value: '3.2m' },
            { key: 'nozzle', value: 'High-efficiency 19A' }
          ],
          inputs: [{ id: 'port-az-p-tug-shaft', name: 'shaft_in', interfaceType: 'propeller-drive-shaft' }],
          outputs: []
        }
      },
      {
        id: 'part-azimuth-stbd-tug',
        type: 'part',
        position: { x: 2800, y: 650 },
        data: {
          declaredName: 'Starboard Azimuth Thruster',
          definition: 'Azimuth Thruster',
          comment: 'Starboard-side 360° azimuth thruster, nozzle optimised for bollard pull',
          id: 'PRT-AZIMUTH-STBD-TUG-001',
          mass: 4200,
          metadata: [
            { key: 'ratedPower', value: '2500kW' },
            { key: 'propellerDiameter', value: '3.2m' },
            { key: 'nozzle', value: 'High-efficiency 19A' }
          ],
          inputs: [{ id: 'port-az-s-tug-shaft', name: 'shaft_in', interfaceType: 'propeller-drive-shaft' }],
          outputs: []
        }
      }
    ],
    edges: [
      { id: 'edge-shore-swbd', source: 'part-shore-charger', target: 'part-dc-switchboard', sourceHandle: 'part-shore-charger-output-dc_charge', targetHandle: 'part-dc-switchboard-input-shore_in', type: 'default', data: { compatibility: 'direct', connectionType: 'flow' } },
      { id: 'edge-battery-swbd', source: 'part-battery-room', target: 'part-dc-switchboard', sourceHandle: 'part-battery-room-output-dc_out', targetHandle: 'part-dc-switchboard-input-battery_in', type: 'default', data: { compatibility: 'direct', connectionType: 'flow' } },
      { id: 'edge-swbd-drive-p', source: 'part-dc-switchboard', target: 'part-drive-port', sourceHandle: 'part-dc-switchboard-output-dc_dist', targetHandle: 'part-drive-port-input-dc_in', type: 'default', data: { compatibility: 'direct', connectionType: 'flow' } },
      { id: 'edge-swbd-drive-s', source: 'part-dc-switchboard', target: 'part-drive-stbd', sourceHandle: 'part-dc-switchboard-output-dc_dist', targetHandle: 'part-drive-stbd-input-dc_in', type: 'default', data: { compatibility: 'direct', connectionType: 'flow' } },
      { id: 'edge-drive-p-motor-p', source: 'part-drive-port', target: 'part-motor-port', sourceHandle: 'part-drive-port-output-ac_out', targetHandle: 'part-motor-port-input-ac_in', type: 'default', data: { compatibility: 'direct', connectionType: 'flow' } },
      { id: 'edge-drive-s-motor-s', source: 'part-drive-stbd', target: 'part-motor-stbd', sourceHandle: 'part-drive-stbd-output-ac_out', targetHandle: 'part-motor-stbd-input-ac_in', type: 'default', data: { compatibility: 'direct', connectionType: 'flow' } },
      { id: 'edge-motor-p-az-p', source: 'part-motor-port', target: 'part-azimuth-port-tug', sourceHandle: 'part-motor-port-output-shaft', targetHandle: 'part-azimuth-port-tug-input-shaft_in', type: 'default', data: { compatibility: 'direct', connectionType: 'flow' } },
      { id: 'edge-motor-s-az-s', source: 'part-motor-stbd', target: 'part-azimuth-stbd-tug', sourceHandle: 'part-motor-stbd-output-shaft', targetHandle: 'part-azimuth-stbd-tug-input-shaft_in', type: 'default', data: { compatibility: 'direct', connectionType: 'flow' } },
      { id: 'edge-swbd-charge-battery', source: 'part-dc-switchboard', target: 'part-battery-room', sourceHandle: 'part-dc-switchboard-output-dc_dist', targetHandle: 'part-battery-room-input-charge', type: 'default', data: { compatibility: 'direct', connectionType: 'flow' } }
    ],
    inputs: [],
    outputs: []
  }
};

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
