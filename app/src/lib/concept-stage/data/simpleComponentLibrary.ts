// Simple component library with commercial vessel example
//
// Phase 5 rework: the example systems are no longer raw `{ nodes, edges }`
// payloads. Each entry is declared with the library authoring DSL
// (`sysml/session/libraryAuthoring.ts`) and built into a canonical semantic
// SysML document (definitions, usages, ports, attributes, flow relationships)
// plus a presentation map. The canvas payload is projected from the document
// at drag time (`utils/simpleInstantiation.ts`), so the drop path and the
// rendered preview stay pixel-identical.

import { buildSemanticLibraryTemplate } from '../sysml/session/libraryAuthoring';
import type { ComponentTemplate } from '../types/componentLibrary';

// Commercial Vessel Powertrain System
export const commercialVesselPowertrain: ComponentTemplate = buildSemanticLibraryTemplate({
  id: 'commercial-vessel-powertrain',
  name: 'Commercial Vessel Powertrain',
  declaredName: 'Commercial Vessel Powertrain',
  comment: 'Complete powertrain system for commercial vessel',
  templateId: 'PKG-VESSEL-POWERTRAIN',
  metadata: [
    { key: 'vesselType', value: 'Commercial' },
    { key: 'power', value: '2500kW' }
  ],
  usages: [
    {
      kind: 'part',
      name: 'Main Diesel Engine',
      definition: 'Marine Diesel Engine',
      position: { x: 100, y: 200 },
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
      position: { x: 350, y: 200 },
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
      name: 'Propeller Shaft',
      definition: 'Marine Shaft',
      position: { x: 600, y: 200 },
      comment: 'Main propeller shaft',
      mass: 450,
      metadata: [
        { key: 'length', value: '12m' },
        { key: 'diameter', value: '300mm' }
      ],
      inputs: [{ name: 'shaft_in', interfaceType: 'propeller-drive-shaft' }],
      outputs: [{ name: 'shaft_out', interfaceType: 'propeller-drive-shaft' }]
    },
    {
      kind: 'part',
      name: 'Fixed Pitch Propeller',
      definition: 'Marine Propeller',
      position: { x: 850, y: 200 },
      comment: '4-blade fixed pitch propeller',
      mass: 2800,
      metadata: [
        { key: 'diameter', value: '4.5m' },
        { key: 'blades', value: '4' }
      ],
      inputs: [{ name: 'shaft', interfaceType: 'propeller-drive-shaft' }],
      outputs: [{ name: 'thrust', interfaceType: 'propeller-drive-shaft' }]
    },
    {
      kind: 'part',
      name: 'Auxiliary Generator',
      definition: 'Marine Generator',
      position: { x: 100, y: 400 },
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
      position: { x: 100, y: 50 },
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
    { source: 'Reduction Gearbox', sourcePort: 'shaft_out', target: 'Propeller Shaft', targetPort: 'shaft_in' },
    { source: 'Propeller Shaft', sourcePort: 'shaft_out', target: 'Fixed Pitch Propeller', targetPort: 'shaft' }
  ]
});

// Compact case-study powertrain for concept-stage FMU requests
export const basicPowertrain: ComponentTemplate = buildSemanticLibraryTemplate({
  id: 'basic-powertrain',
  name: 'Powertrain',
  declaredName: 'Powertrain',
  comment: 'Small electric propulsion powertrain case study for torsional vibration analysis',
  templateId: 'PKG-BASIC-POWERTRAIN',
  metadata: [
    { key: 'caseStudy', value: 'Basic Powertrain' },
    { key: 'analysisType', value: 'torsional_vibration' },
    { key: 'ratedPower', value: '1200kW' }
  ],
  usages: [
    {
      kind: 'item',
      name: 'Battery Pack',
      position: { x: 80, y: 70 },
      comment: 'DC energy source for propulsion drive',
      mass: 6200,
      metadata: [
        { key: 'capacity', value: '1800kWh' },
        { key: 'nominalVoltage', value: '900V' }
      ],
      inputs: [],
      outputs: [{ name: 'dc_power', interfaceType: 'dc-950v' }]
    },
    {
      kind: 'part',
      name: 'Power Converter',
      definition: 'Marine Propulsion Converter',
      position: { x: 330, y: 70 },
      comment: 'Variable frequency drive for the propulsion motor',
      mass: 850,
      metadata: [
        { key: 'ratedPower', value: '1200kW' },
        { key: 'switchingFrequency', value: '2kHz' }
      ],
      inputs: [{ name: 'dc_power', interfaceType: 'dc-950v' }],
      outputs: [{ name: 'ac_power', interfaceType: 'iec-690v-60hz' }]
    },
    {
      kind: 'part',
      name: 'Electric Motor',
      definition: 'Permanent Magnet Motor',
      position: { x: 580, y: 70 },
      comment: 'Main propulsion motor',
      mass: 2400,
      metadata: [
        { key: 'ratedPower', value: '1200kW' },
        { key: 'ratedSpeed', value: '900rpm' },
        { key: 'rotorInertia', value: '18kgm2' },
        { key: 'damping', value: '120Nms/rad' }
      ],
      inputs: [{ name: 'ac_power', interfaceType: 'iec-690v-60hz' }],
      outputs: [{ name: 'shaft', interfaceType: 'propeller-drive-shaft' }]
    },
    {
      kind: 'part',
      name: 'Propeller Shaft',
      definition: 'Marine Shaft',
      position: { x: 830, y: 70 },
      comment: 'Intermediate shaft between motor and propeller',
      mass: 720,
      metadata: [
        { key: 'length', value: '8.5m' },
        { key: 'diameter', value: '220mm' },
        { key: 'torsionalStiffness', value: '6.5e6Nm/rad' },
        { key: 'damping', value: '45Nms/rad' }
      ],
      inputs: [{ name: 'shaft_in', interfaceType: 'propeller-drive-shaft' }],
      outputs: [{ name: 'shaft_out', interfaceType: 'propeller-drive-shaft' }]
    },
    {
      kind: 'part',
      name: 'Fixed Pitch Propeller',
      definition: 'Marine Propeller',
      position: { x: 1080, y: 70 },
      comment: 'Open-water fixed pitch propeller load',
      mass: 1800,
      metadata: [
        { key: 'diameter', value: '3.2m' },
        { key: 'blades', value: '4' },
        { key: 'propellerInertia', value: '34kgm2' },
        { key: 'hydrodynamicDamping', value: '260Nms/rad' }
      ],
      inputs: [{ name: 'shaft', interfaceType: 'propeller-drive-shaft' }],
      outputs: [{ name: 'thrust', interfaceType: 'propeller-drive-shaft' }]
    }
  ],
  flows: [
    { source: 'Battery Pack', sourcePort: 'dc_power', target: 'Power Converter', targetPort: 'dc_power' },
    { source: 'Power Converter', sourcePort: 'ac_power', target: 'Electric Motor', targetPort: 'ac_power' },
    { source: 'Electric Motor', sourcePort: 'shaft', target: 'Propeller Shaft', targetPort: 'shaft_in' },
    { source: 'Propeller Shaft', sourcePort: 'shaft_out', target: 'Fixed Pitch Propeller', targetPort: 'shaft' }
  ]
});

// Minimal drive, motor, shaft, and propeller drivetrain for the OpenTorsion demo
export const motorShaftPropellerDemo: ComponentTemplate = buildSemanticLibraryTemplate({
  id: 'motor-shaft-propeller-demo',
  name: 'Simple Electric Propulsion Train',
  declaredName: 'Simple Electric Propulsion Train',
  comment: 'Drive, motor, shaft, and propeller model for torsional vibration analysis',
  templateId: 'PKG-MOTOR-SHAFT-PROP-DEMO',
  metadata: [
    { key: 'caseStudy', value: 'Drive Motor Shaft Propeller Demo' },
    { key: 'analysisType', value: 'torsional_vibration' },
    { key: 'modelForm', value: 'drive_converter-motor_inertia-shaft_stiffness-propeller_inertia' }
  ],
  usages: [
    {
      kind: 'part',
      name: 'Propulsion Drive',
      definition: 'Variable Frequency Drive',
      position: { x: 360, y: 520 },
      measured: { width: 760, height: 420 },
      comment: 'Power electronics driver and inverter feeding the permanent magnet motor',
      mass: 900,
      metadata: [
        { key: 'preferredOEM', value: 'ABB' },
        { key: 'ratedPower', value: '1000kW' },
        { key: 'dcLinkVoltage', value: '900V' },
        { key: 'outputVoltage', value: '690VAC' },
        { key: 'outputFrequencyRange', value: '0-80Hz' },
        { key: 'controlMode', value: 'vector_control' },
        { key: 'efficiency', value: '98%' }
      ],
      inputs: [],
      outputs: [{ name: 'ac_power', interfaceType: 'iec-690v-60hz' }]
    },
    {
      kind: 'part',
      name: 'Permanent Magnet Motor',
      definition: 'Permanent Magnet Motor',
      position: { x: 1260, y: 520 },
      measured: { width: 760, height: 420 },
      comment: 'Main electric propulsion motor; intended OEM request target: ABB',
      mass: 2400,
      metadata: [
        { key: 'preferredOEM', value: 'ABB' },
        { key: 'ratedPower', value: '1000kW' },
        { key: 'ratedSpeed', value: '600rpm' },
        { key: 'nominalTorque', value: '15915Nm' },
        { key: 'rotorInertia', value: '18kgm2' },
        { key: 'damping', value: '120Nms/rad' }
      ],
      inputs: [{ name: 'ac_power', interfaceType: 'iec-690v-60hz' }],
      outputs: [{ name: 'shaft', interfaceType: 'propeller-drive-shaft' }]
    },
    {
      kind: 'part',
      name: 'Propeller Shaft',
      definition: 'Marine Propeller Shaft',
      position: { x: 2120, y: 520 },
      measured: { width: 760, height: 420 },
      comment: 'Single shaft coupling the motor and propeller inertias',
      mass: 520,
      metadata: [
        { key: 'length', value: '6m' },
        { key: 'diameter', value: '180mm' },
        { key: 'shaftInertia', value: '2kgm2' },
        { key: 'torsionalStiffness', value: '6.5e6Nm/rad' },
        { key: 'shaftDamping', value: '45Nms/rad' }
      ],
      inputs: [{ name: 'shaft_in', interfaceType: 'propeller-drive-shaft' }],
      outputs: [{ name: 'shaft_out', interfaceType: 'propeller-drive-shaft' }]
    },
    {
      kind: 'part',
      name: 'Fixed Pitch Propeller',
      definition: 'Fixed Pitch Propeller',
      position: { x: 2980, y: 520 },
      measured: { width: 760, height: 420 },
      comment: 'Propeller load; intended OEM request target: Kongsberg',
      mass: 1800,
      metadata: [
        { key: 'preferredOEM', value: 'Kongsberg' },
        { key: 'diameter', value: '2.2m' },
        { key: 'nominalSpeed', value: '600rpm' },
        { key: 'propellerInertia', value: '34kgm2' },
        { key: 'hydrodynamicDamping', value: '260Nms/rad' }
      ],
      inputs: [{ name: 'shaft', interfaceType: 'propeller-drive-shaft' }],
      outputs: [{ name: 'thrust', interfaceType: 'propeller-drive-shaft' }]
    }
  ],
  flows: [
    { source: 'Propulsion Drive', sourcePort: 'ac_power', target: 'Permanent Magnet Motor', targetPort: 'ac_power' },
    { source: 'Permanent Magnet Motor', sourcePort: 'shaft', target: 'Propeller Shaft', targetPort: 'shaft_in' },
    { source: 'Propeller Shaft', sourcePort: 'shaft_out', target: 'Fixed Pitch Propeller', targetPort: 'shaft' }
  ]
});

// Exact concept-stage representation of python-client/templates/model.ssp.
// The design-stage cloud runner uses the templateSimulation metadata to run the repo SSP.
export const simanticsSspCloudTemplate: ComponentTemplate = buildSemanticLibraryTemplate({
  id: 'simantics-ssp-cloud-template',
  name: 'Motor System',
  declaredName: 'Motor System',
  comment: 'Motor system example mapped to python-client/templates/model.ssp and test.scl',
  templateId: 'PKG-SIMANTICS-SSP-CLOUD-TEMPLATE',
  metadata: [
    { key: 'templateSimulation', value: 'simantics-ssp-cloud-template' },
    { key: 'sspTemplateModel', value: 'python-client/templates/model.ssp' },
    { key: 'sspTemplateScript', value: 'python-client/templates/test.scl' },
    { key: 'sspSystemStructure', value: 'Demo/Root' },
    { key: 'analysisType', value: 'cloud_ssp_simulation' },
    { key: 'productName', value: 'Simantics SSP Studio' },
    { key: 'productVersion', value: '0.0.7' }
  ],
  usages: [
    {
      kind: 'part',
      name: 'Modelica_Blocks_Sources_Trapezoid',
      definition: 'Modelica Trapezoid Source FMU',
      position: { x: 80, y: 160 },
      measured: { width: 600, height: 360 },
      comment: 'Speed command source from the template SSP',
      mass: 0,
      metadata: [
        { key: 'sspComponentName', value: 'Modelica_Blocks_Sources_Trapezoid' },
        { key: 'fmuSource', value: 'resources/0001_replaceModelica_Blocks_Sources_Trapezoid.fmu' },
        { key: 'amplitude', value: '60' },
        { key: 'period', value: '120s' },
        { key: 'rising', value: '10s' },
        { key: 'width', value: '30s' },
        { key: 'startTime', value: '0s' }
      ],
      inputs: [],
      outputs: [{ name: 'y', interfaceType: 'nmea-0183' }]
    },
    {
      kind: 'part',
      name: 'Codes_VfController',
      definition: 'V/f Controller FMU',
      position: { x: 600, y: 160 },
      measured: { width: 600, height: 360 },
      comment: 'Controller FMU receiving the trapezoid command',
      mass: 0,
      metadata: [
        { key: 'sspComponentName', value: 'Codes_VfController' },
        { key: 'fmuSource', value: 'resources/0002_replaceCodes_VfController.fmu' },
        { key: 'VNominal', value: '4000V' },
        { key: 'fNominal', value: '60Hz' }
      ],
      inputs: [{ name: 'u', interfaceType: 'nmea-0183' }],
      outputs: [
        { name: 'y[1]', interfaceType: 'iec-690v-60hz' },
        { name: 'y[2]', interfaceType: 'iec-690v-60hz' }
      ]
    },
    {
      kind: 'part',
      name: 'Codes_MotorWithFlexibleShaft2_FMU',
      definition: 'Motor With Flexible Shaft FMU',
      position: { x: 1120, y: 160 },
      measured: { width: 600, height: 360 },
      comment: 'Motor FMU from the template SSP',
      mass: 0,
      metadata: [
        { key: 'sspComponentName', value: 'Codes_MotorWithFlexibleShaft2_FMU' },
        { key: 'fmuSource', value: 'resources/0003_replaceCodes_MotorWithFlexibleShaft2_FMU.fmu' },
        { key: 'motor.J1', value: '52.5kg.m2' },
        { key: 'motor.J2', value: '1.5kg.m2' },
        { key: 'motor.k12', value: '3400000N.m/rad' },
        { key: 'motor.Rs', value: '0.24141V/A' },
        { key: 'motor.Rr', value: '0.28808V/A' }
      ],
      inputs: [
        { name: 'us[1]', interfaceType: 'iec-690v-60hz' },
        { name: 'us[2]', interfaceType: 'iec-690v-60hz' },
        { name: 'w', interfaceType: 'propeller-drive-shaft' },
        { name: 'a', interfaceType: 'propeller-drive-shaft' }
      ],
      outputs: [{ name: 'tau', interfaceType: 'propeller-drive-shaft' }]
    },
    {
      kind: 'part',
      name: 'Codes_Drivetrain2_FMU',
      definition: 'Drivetrain FMU',
      position: { x: 1640, y: 160 },
      measured: { width: 600, height: 360 },
      comment: 'Compressor, coupling, and flywheel drivetrain FMU',
      mass: 0,
      metadata: [
        { key: 'sspComponentName', value: 'Codes_Drivetrain2_FMU' },
        { key: 'fmuSource', value: 'resources/0004_replaceCodes_Drivetrain2_FMU.fmu' },
        { key: 'Compressor.k', value: '8400000' },
        { key: 'Coupling.k', value: '47000' },
        { key: 'Coupling.c', value: '11000' },
        { key: 'Flywheel.k', value: '7600000' }
      ],
      inputs: [
        { name: 'tau_in', interfaceType: 'propeller-drive-shaft' },
        { name: 'w_out', interfaceType: 'propeller-drive-shaft' },
        { name: 'a_out', interfaceType: 'propeller-drive-shaft' }
      ],
      outputs: [
        { name: 'w_in', interfaceType: 'propeller-drive-shaft' },
        { name: 'tau_out', interfaceType: 'propeller-drive-shaft' },
        { name: 'a_in', interfaceType: 'propeller-drive-shaft' }
      ]
    },
    {
      kind: 'part',
      name: 'Codes_Load2_FMU',
      definition: 'Load FMU',
      position: { x: 2160, y: 160 },
      measured: { width: 600, height: 360 },
      comment: 'Template load FMU',
      mass: 0,
      metadata: [
        { key: 'sspComponentName', value: 'Codes_Load2_FMU' },
        { key: 'fmuSource', value: 'resources/0005_replaceCodes_Load2_FMU.fmu' },
        { key: 'load.J', value: '40' },
        { key: 'load.K1', value: '0' },
        { key: 'load.K2', value: '200' },
        { key: 'load.T', value: '0' }
      ],
      inputs: [{ name: 'tau', interfaceType: 'propeller-drive-shaft' }],
      outputs: [
        { name: 'w', interfaceType: 'propeller-drive-shaft' },
        { name: 'a', interfaceType: 'propeller-drive-shaft' }
      ]
    }
  ],
  flows: [
    { source: 'Modelica_Blocks_Sources_Trapezoid', sourcePort: 'y', target: 'Codes_VfController', targetPort: 'u' },
    { source: 'Codes_VfController', sourcePort: 'y[1]', target: 'Codes_MotorWithFlexibleShaft2_FMU', targetPort: 'us[1]' },
    { source: 'Codes_VfController', sourcePort: 'y[2]', target: 'Codes_MotorWithFlexibleShaft2_FMU', targetPort: 'us[2]' },
    { source: 'Codes_MotorWithFlexibleShaft2_FMU', sourcePort: 'tau', target: 'Codes_Drivetrain2_FMU', targetPort: 'tau_in' },
    { source: 'Codes_Drivetrain2_FMU', sourcePort: 'w_in', target: 'Codes_MotorWithFlexibleShaft2_FMU', targetPort: 'w' },
    { source: 'Codes_Drivetrain2_FMU', sourcePort: 'a_in', target: 'Codes_MotorWithFlexibleShaft2_FMU', targetPort: 'a' },
    { source: 'Codes_Drivetrain2_FMU', sourcePort: 'tau_out', target: 'Codes_Load2_FMU', targetPort: 'tau' },
    { source: 'Codes_Load2_FMU', sourcePort: 'w', target: 'Codes_Drivetrain2_FMU', targetPort: 'w_out' },
    { source: 'Codes_Load2_FMU', sourcePort: 'a', target: 'Codes_Drivetrain2_FMU', targetPort: 'a_out' }
  ]
});

// ── Maritime Cooling System (HT/LT fresh water + sea water circuits) ──
export const maritimeCoolingSystem: ComponentTemplate = buildSemanticLibraryTemplate({
  id: 'maritime-cooling-system',
  name: 'Maritime Cooling System',
  declaredName: 'Maritime Cooling System',
  comment: 'HT/LT fresh water cooling circuits with central sea water heat exchanger',
  templateId: 'PKG-MARITIME-COOLING',
  metadata: [
    { key: 'systemType', value: 'Cooling' },
    { key: 'htCircuitTemp', value: '90°C' },
    { key: 'ltCircuitTemp', value: '38°C' },
    { key: 'coolingCapacity', value: '4500kW' }
  ],
  usages: [
    {
      kind: 'part',
      name: 'HT Fresh Water Pump',
      definition: 'Centrifugal Pump',
      position: { x: 200, y: 250 },
      comment: 'High-temperature circuit pump for main engine jacket water cooling',
      mass: 380,
      metadata: [
        { key: 'flowRate', value: '120m³/h' },
        { key: 'head', value: '35m' },
        { key: 'motorPower', value: '22kW' }
      ],
      inputs: [{ name: 'ht_water_in', interfaceType: 'ht-water' }],
      outputs: [{ name: 'ht_water_out', interfaceType: 'ht-water' }]
    },
    {
      kind: 'part',
      name: 'LT Fresh Water Pump',
      definition: 'Centrifugal Pump',
      position: { x: 200, y: 700 },
      comment: 'Low-temperature circuit pump for charge air coolers and lubricating oil',
      mass: 420,
      metadata: [
        { key: 'flowRate', value: '180m³/h' },
        { key: 'head', value: '30m' },
        { key: 'motorPower', value: '30kW' }
      ],
      inputs: [{ name: 'lt_water_in', interfaceType: 'lt-water' }],
      outputs: [{ name: 'lt_water_out', interfaceType: 'lt-water' }]
    },
    {
      kind: 'part',
      name: 'Central Cooler',
      definition: 'Plate Heat Exchanger',
      position: { x: 850, y: 475 },
      comment: 'Titanium plate heat exchanger — HT/LT fresh water cooled by sea water',
      mass: 2800,
      metadata: [
        { key: 'type', value: 'Plate' },
        { key: 'material', value: 'Titanium' },
        { key: 'capacity', value: '4500kW' },
        { key: 'plates', value: '340' }
      ],
      inputs: [
        { name: 'fw_ht_in', interfaceType: 'ht-water' },
        { name: 'fw_lt_in', interfaceType: 'lt-water' },
        { name: 'sw_in', interfaceType: 'sw-water' }
      ],
      outputs: [
        { name: 'fw_ht_out', interfaceType: 'ht-water' },
        { name: 'fw_lt_out', interfaceType: 'lt-water' }
      ]
    },
    {
      kind: 'part',
      name: 'Sea Water Pump',
      definition: 'Centrifugal Pump',
      position: { x: 1500, y: 475 },
      comment: 'Main sea water circulation pump feeding the central cooler',
      mass: 650,
      metadata: [
        { key: 'flowRate', value: '320m³/h' },
        { key: 'head', value: '25m' },
        { key: 'motorPower', value: '45kW' },
        { key: 'material', value: 'Bronze' }
      ],
      inputs: [{ name: 'sw_in', interfaceType: 'sw-water' }],
      outputs: [{ name: 'sw_out', interfaceType: 'sw-water' }]
    },
    {
      kind: 'part',
      name: 'FW Expansion Tank',
      definition: 'Expansion Tank',
      position: { x: 200, y: 1150 },
      comment: 'Pressurised expansion tank for the fresh water circuits',
      mass: 180,
      metadata: [
        { key: 'volume', value: '800L' },
        { key: 'preChargePressure', value: '1.5bar' }
      ],
      inputs: [{ name: 'fw_return', interfaceType: 'ht-water' }],
      outputs: [{ name: 'fw_supply', interfaceType: 'ht-water' }]
    },
    {
      kind: 'item',
      name: 'Sea Water Inlet',
      position: { x: 1500, y: 150 },
      comment: 'Sea water intake from sea chest via strainer',
      mass: 0,
      metadata: [{ key: 'source', value: 'Sea Chest' }],
      inputs: [],
      outputs: [{ name: 'sea_water', interfaceType: 'sw-water' }]
    }
  ],
  flows: [
    { source: 'Sea Water Inlet', sourcePort: 'sea_water', target: 'Sea Water Pump', targetPort: 'sw_in' },
    { source: 'Sea Water Pump', sourcePort: 'sw_out', target: 'Central Cooler', targetPort: 'sw_in' },
    { source: 'HT Fresh Water Pump', sourcePort: 'ht_water_out', target: 'Central Cooler', targetPort: 'fw_ht_in' },
    { source: 'LT Fresh Water Pump', sourcePort: 'lt_water_out', target: 'Central Cooler', targetPort: 'fw_lt_in' },
    { source: 'Central Cooler', sourcePort: 'fw_ht_out', target: 'FW Expansion Tank', targetPort: 'fw_return' }
  ]
});

// ── Ballast Water System ──
export const ballastWaterSystem: ComponentTemplate = buildSemanticLibraryTemplate({
  id: 'ballast-water-system',
  name: 'Ballast Water System',
  declaredName: 'Ballast Water System',
  comment: 'IMO D-2 compliant ballast water management with treatment and tank control',
  templateId: 'PKG-BALLAST-WATER',
  metadata: [
    { key: 'systemType', value: 'Ballast' },
    { key: 'compliance', value: 'IMO D-2' },
    { key: 'totalCapacity', value: '3200m³' },
    { key: 'treatmentType', value: 'UV + Filtration' }
  ],
  usages: [
    {
      kind: 'part',
      name: 'Ballast Water Pump',
      definition: 'Centrifugal Pump',
      position: { x: 200, y: 300 },
      comment: 'Main ballast pump for filling and stripping ballast tanks',
      mass: 1200,
      metadata: [
        { key: 'flowRate', value: '500m³/h' },
        { key: 'head', value: '25m' },
        { key: 'motorPower', value: '75kW' }
      ],
      inputs: [{ name: 'bw_in', interfaceType: 'sw-water' }],
      outputs: [{ name: 'bw_out', interfaceType: 'sw-water' }]
    },
    {
      kind: 'part',
      name: 'Ballast Water Treatment System',
      definition: 'UV BWTS',
      position: { x: 850, y: 300 },
      comment: 'UV-based ballast water treatment — 50 µm filtration + medium-pressure UV',
      mass: 3400,
      metadata: [
        { key: 'type', value: 'UV' },
        { key: 'filterMesh', value: '50µm' },
        { key: 'uvDose', value: '300mJ/cm²' },
        { key: 'treatmentCapacity', value: '500m³/h' }
      ],
      inputs: [{ name: 'untreated', interfaceType: 'sw-water' }],
      outputs: [{ name: 'treated', interfaceType: 'sw-water' }]
    },
    {
      kind: 'part',
      name: 'Ballast Valve Manifold',
      definition: 'Hydraulic Valve Manifold',
      position: { x: 1500, y: 300 },
      comment: 'Remote-operated manifold distributing ballast water to individual tanks',
      mass: 850,
      metadata: [
        { key: 'valves', value: '12' },
        { key: 'actuation', value: 'Hydraulic' },
        { key: 'remoteControl', value: 'IAS integrated' }
      ],
      inputs: [{ name: 'manifold_in', interfaceType: 'sw-water' }],
      outputs: [{ name: 'manifold_out', interfaceType: 'sw-water' }]
    },
    {
      kind: 'item',
      name: 'Ballast Tank Group',
      position: { x: 2150, y: 300 },
      comment: 'Set of segregated ballast tanks (fore peak, aft peak, double bottom, wing tanks)',
      mass: 0,
      metadata: [
        { key: 'tankCount', value: '8' },
        { key: 'totalVolume', value: '3200m³' }
      ],
      inputs: [{ name: 'tank_fill', interfaceType: 'sw-water' }],
      outputs: [{ name: 'tank_strip', interfaceType: 'sw-water' }]
    }
  ],
  flows: [
    { source: 'Ballast Water Pump', sourcePort: 'bw_out', target: 'Ballast Water Treatment System', targetPort: 'untreated' },
    { source: 'Ballast Water Treatment System', sourcePort: 'treated', target: 'Ballast Valve Manifold', targetPort: 'manifold_in' },
    { source: 'Ballast Valve Manifold', sourcePort: 'manifold_out', target: 'Ballast Tank Group', targetPort: 'tank_fill' }
  ]
});

// ── Ship HVAC & Ventilation System ──
export const shipHvacSystem: ComponentTemplate = buildSemanticLibraryTemplate({
  id: 'ship-hvac-system',
  name: 'Ship HVAC System',
  declaredName: 'Ship HVAC System',
  comment: 'Accommodation and machinery space HVAC with chiller, air handlers, and fire dampers',
  templateId: 'PKG-SHIP-HVAC',
  metadata: [
    { key: 'systemType', value: 'HVAC' },
    { key: 'coolingCapacity', value: '850kW' },
    { key: 'airFlow', value: '45000m³/h' },
    { key: 'zones', value: '6' }
  ],
  usages: [
    {
      kind: 'part',
      name: 'Screw Chiller Unit',
      definition: 'Marine Water Chiller',
      position: { x: 200, y: 300 },
      comment: 'Twin-screw compressor chiller supplying chilled water to air handling units',
      mass: 2200,
      metadata: [
        { key: 'type', value: 'Screw' },
        { key: 'capacity', value: '850kW' },
        { key: 'refrigerant', value: 'R-513A' },
        { key: 'chilledWaterTemp', value: '7/12°C' }
      ],
      inputs: [{ name: 'chw_return', interfaceType: 'lt-water' }],
      outputs: [{ name: 'chw_supply', interfaceType: 'lt-water' }]
    },
    {
      kind: 'part',
      name: 'Bridge AHU',
      definition: 'Air Handling Unit',
      position: { x: 850, y: 150 },
      comment: 'Bridge deck air handling unit — cooling, heating, and fresh air intake',
      mass: 480,
      metadata: [
        { key: 'airFlow', value: '8000m³/h' },
        { key: 'coolingCoil', value: 'Chilled Water' },
        { key: 'filterClass', value: 'F7' }
      ],
      inputs: [
        { name: 'chw_in', interfaceType: 'lt-water' },
        { name: 'fresh_air', interfaceType: 'work-air' }
      ],
      outputs: [{ name: 'supply_air', interfaceType: 'work-air' }]
    },
    {
      kind: 'part',
      name: 'Accommodation AHU',
      definition: 'Air Handling Unit',
      position: { x: 850, y: 600 },
      comment: 'Main accommodation air handling unit serving cabins and public spaces',
      mass: 720,
      metadata: [
        { key: 'airFlow', value: '22000m³/h' },
        { key: 'coolingCoil', value: 'Chilled Water' },
        { key: 'heatRecovery', value: 'Rotary Wheel 78%' }
      ],
      inputs: [
        { name: 'chw_in', interfaceType: 'lt-water' },
        { name: 'fresh_air', interfaceType: 'work-air' }
      ],
      outputs: [{ name: 'supply_air', interfaceType: 'work-air' }]
    },
    {
      kind: 'part',
      name: 'Engine Room Vent Fan',
      definition: 'Axial Ventilation Fan',
      position: { x: 850, y: 1050 },
      comment: 'Engine room supply and extraction fan set with fire dampers',
      mass: 350,
      metadata: [
        { key: 'airFlow', value: '15000m³/h' },
        { key: 'motorPower', value: '11kW' },
        { key: 'fireRated', value: 'A-60' }
      ],
      inputs: [{ name: 'fresh_air', interfaceType: 'work-air' }],
      outputs: [{ name: 'vent_air', interfaceType: 'work-air' }]
    },
    {
      kind: 'item',
      name: 'Fresh Air Intake',
      position: { x: 200, y: 800 },
      comment: 'Weather-tight fresh air intake with mist eliminator and bird screen',
      mass: 0,
      metadata: [{ key: 'intakeType', value: 'Weather-Tight Louvre' }],
      inputs: [],
      outputs: [{ name: 'fresh_air', interfaceType: 'work-air' }]
    }
  ],
  flows: [
    { source: 'Screw Chiller Unit', sourcePort: 'chw_supply', target: 'Bridge AHU', targetPort: 'chw_in' },
    { source: 'Screw Chiller Unit', sourcePort: 'chw_supply', target: 'Accommodation AHU', targetPort: 'chw_in' },
    { source: 'Fresh Air Intake', sourcePort: 'fresh_air', target: 'Bridge AHU', targetPort: 'fresh_air' },
    { source: 'Fresh Air Intake', sourcePort: 'fresh_air', target: 'Accommodation AHU', targetPort: 'fresh_air' },
    { source: 'Fresh Air Intake', sourcePort: 'fresh_air', target: 'Engine Room Vent Fan', targetPort: 'fresh_air' }
  ]
});

// ── Navigation & Bridge System ──
export const navigationBridgeSystem: ComponentTemplate = buildSemanticLibraryTemplate({
  id: 'navigation-bridge-system',
  name: 'Navigation & Bridge System',
  declaredName: 'Navigation & Bridge System',
  comment: 'Integrated bridge system with X/S-band radars, ECDIS, GPS, gyrocompass, and autopilot',
  templateId: 'PKG-NAV-BRIDGE',
  metadata: [
    { key: 'systemType', value: 'Navigation' },
    { key: 'compliance', value: 'SOLAS Ch.V' },
    { key: 'bridgeClass', value: 'IBS (Integrated Bridge System)' }
  ],
  usages: [
    {
      kind: 'part',
      name: 'X-Band Radar',
      definition: 'Marine Radar',
      position: { x: 200, y: 150 },
      comment: '9.4 GHz X-band radar for high-resolution short-range navigation and collision avoidance',
      mass: 65,
      metadata: [
        { key: 'frequency', value: '9.4GHz (X-band)' },
        { key: 'range', value: '24NM' },
        { key: 'antennaType', value: '6ft Open Array' }
      ],
      inputs: [{ name: 'trigger_sync', interfaceType: 'nmea-0183' }],
      outputs: [{ name: 'radar_video', interfaceType: 'nmea-0183' }]
    },
    {
      kind: 'part',
      name: 'S-Band Radar',
      definition: 'Marine Radar',
      position: { x: 200, y: 600 },
      comment: '3.0 GHz S-band radar for long-range detection in heavy sea clutter',
      mass: 85,
      metadata: [
        { key: 'frequency', value: '3.0GHz (S-band)' },
        { key: 'range', value: '72NM' },
        { key: 'antennaType', value: '12ft Open Array' }
      ],
      inputs: [{ name: 'trigger_sync', interfaceType: 'nmea-0183' }],
      outputs: [{ name: 'radar_video', interfaceType: 'nmea-0183' }]
    },
    {
      kind: 'part',
      name: 'Dual GPS/GNSS Receiver',
      definition: 'GNSS Receiver',
      position: { x: 850, y: 150 },
      comment: 'Dual-antenna multi-constellation GNSS receiver (GPS + GLONASS + Galileo + BeiDou)',
      mass: 8,
      metadata: [
        { key: 'constellations', value: 'GPS + GLONASS + Galileo + BeiDou' },
        { key: 'accuracy', value: '<1m (DGNSS)' },
        { key: 'updateRate', value: '10Hz' }
      ],
      inputs: [],
      outputs: [{ name: 'nmea_position', interfaceType: 'nmea-0183' }]
    },
    {
      kind: 'part',
      name: 'Gyrocompass',
      definition: 'Fibre-Optic Gyrocompass',
      position: { x: 850, y: 600 },
      comment: 'IMO type-approved fibre-optic gyrocompass with heading and rate-of-turn output',
      mass: 22,
      metadata: [
        { key: 'technology', value: 'FOG (Fibre-Optic Gyro)' },
        { key: 'accuracy', value: '0.1° secant latitude' },
        { key: 'settlingTime', value: '<3min' }
      ],
      inputs: [],
      outputs: [{ name: 'heading_nmea', interfaceType: 'nmea-0183' }]
    },
    {
      kind: 'part',
      name: 'ECDIS Console',
      definition: 'Electronic Chart Display',
      position: { x: 1500, y: 375 },
      comment: 'Dual ECDIS workstation with S-100 compliant electronic chart display',
      mass: 45,
      metadata: [
        { key: 'displays', value: '2 × 27"' },
        { key: 'chartStandard', value: 'S-57 / S-100' },
        { key: 'trackControl', value: 'CAT II' }
      ],
      inputs: [
        { name: 'position_in', interfaceType: 'nmea-0183' },
        { name: 'heading_in', interfaceType: 'nmea-0183' },
        { name: 'radar_overlay', interfaceType: 'nmea-0183' }
      ],
      outputs: [{ name: 'route_data', interfaceType: 'nmea-0183' }]
    },
    {
      kind: 'part',
      name: 'Adaptive Autopilot',
      definition: 'Heading Control System',
      position: { x: 2150, y: 375 },
      comment: 'Adaptive track-keeping autopilot with weather compensation and rate-of-turn control',
      mass: 18,
      metadata: [
        { key: 'controlMode', value: 'Heading / Track / Rate-of-Turn' },
        { key: 'weatherCompensation', value: 'Adaptive' },
        { key: 'interface', value: 'NMEA 0183 / Modbus TCP' }
      ],
      inputs: [
        { name: 'heading_in', interfaceType: 'nmea-0183' },
        { name: 'route_in', interfaceType: 'nmea-0183' }
      ],
      outputs: [{ name: 'rudder_cmd', interfaceType: 'nmea-0183' }]
    }
  ],
  flows: [
    { source: 'Dual GPS/GNSS Receiver', sourcePort: 'nmea_position', target: 'ECDIS Console', targetPort: 'position_in' },
    { source: 'Gyrocompass', sourcePort: 'heading_nmea', target: 'ECDIS Console', targetPort: 'heading_in' },
    { source: 'X-Band Radar', sourcePort: 'radar_video', target: 'ECDIS Console', targetPort: 'radar_overlay' },
    { source: 'Gyrocompass', sourcePort: 'heading_nmea', target: 'Adaptive Autopilot', targetPort: 'heading_in' },
    { source: 'ECDIS Console', sourcePort: 'route_data', target: 'Adaptive Autopilot', targetPort: 'route_in' }
  ]
});

// Keep these for backward compatibility — all point to the commercial vessel powertrain
export const engineComponent: ComponentTemplate = commercialVesselPowertrain;
export const generatorComponent: ComponentTemplate = commercialVesselPowertrain;
export const pumpComponent: ComponentTemplate = commercialVesselPowertrain;
export const electricMotorComponent: ComponentTemplate = commercialVesselPowertrain;
export const propellerComponent: ComponentTemplate = commercialVesselPowertrain;
export const pmsComponent: ComponentTemplate = commercialVesselPowertrain;
export const automationControllerComponent: ComponentTemplate = commercialVesselPowertrain;
export const switchboardComponent: ComponentTemplate = commercialVesselPowertrain;
export const transformerComponent: ComponentTemplate = commercialVesselPowertrain;
export const circuitBreakerComponent: ComponentTemplate = commercialVesselPowertrain;