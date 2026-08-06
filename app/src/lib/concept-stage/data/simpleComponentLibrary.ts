// Simple component library with commercial vessel example

export interface SimpleComponent {
  id: string;
  name: string;
  type: 'package';
  data: {
    declaredName: string;
    comment: string;
    id: string;
    metadata: Array<{ key: string; value: string }>;
    nodes: any[]; // Parts
    edges: any[]; // Connections between parts
    inputs: any[];
    outputs: any[];
  };
}

// Commercial Vessel Powertrain System
export const commercialVesselPowertrain: SimpleComponent = {
  id: 'commercial-vessel-powertrain',
  name: 'Commercial Vessel Powertrain',
  type: 'package',
  data: {
    declaredName: 'Commercial Vessel Powertrain',
    comment: 'Complete powertrain system for commercial vessel',
    id: 'PKG-VESSEL-POWERTRAIN',
    metadata: [
      { key: 'vesselType', value: 'Commercial' },
      { key: 'power', value: '2500kW' }
    ],
    nodes: [
      // Main Diesel Engine
      {
        id: 'part-main-engine',
        type: 'part',
        position: { x: 100, y: 200 },
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
      // Reduction Gearbox
      {
        id: 'part-gearbox',
        type: 'part',
        position: { x: 350, y: 200 },
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
      // Propeller Shaft
      {
        id: 'part-shaft',
        type: 'part',
        position: { x: 600, y: 200 },
        data: {
          declaredName: 'Propeller Shaft',
          definition: 'Marine Shaft',
          comment: 'Main propeller shaft',
          id: 'PRT-SHAFT-001',
          mass: 450,
          metadata: [
            { key: 'length', value: '12m' },
            { key: 'diameter', value: '300mm' }
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
      // Propeller
      {
        id: 'part-propeller',
        type: 'part',
        position: { x: 850, y: 200 },
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
          outputs: [{
            id: 'port-thrust',
            name: 'thrust',
            interfaceType: 'propeller-drive-shaft'
          }]
        }
      },
      // Generator
      {
        id: 'part-generator',
        type: 'part',
        position: { x: 100, y: 400 },
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
      // Fuel Tank
      {
        id: 'item-fuel-tank',
        type: 'item',
        position: { x: 100, y: 50 },
        data: {
          declaredName: 'Main Fuel Tank',
          definition: 'Marine Fuel Tank',
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
      // Fuel tank to main engine
      {
        id: 'edge-fuel-engine',
        source: 'item-fuel-tank',
        target: 'part-main-engine',
        sourceHandle: 'item-fuel-tank-output-fuel',
        targetHandle: 'part-main-engine-input-fuel',
        type: 'default',
        data: {
          compatibility: 'direct',
          connectionType: 'flow'
        }
      },
      // Fuel tank to generator
      {
        id: 'edge-fuel-generator',
        source: 'item-fuel-tank',
        target: 'part-generator',
        sourceHandle: 'item-fuel-tank-output-fuel',
        targetHandle: 'part-generator-input-fuel',
        type: 'default',
        data: {
          compatibility: 'direct',
          connectionType: 'flow'
        }
      },
      // Engine to gearbox
      {
        id: 'edge-engine-gearbox',
        source: 'part-main-engine',
        target: 'part-gearbox',
        sourceHandle: 'part-main-engine-output-shaft',
        targetHandle: 'part-gearbox-input-shaft_in',
        type: 'default',
        data: {
          compatibility: 'direct',
          connectionType: 'flow'
        }
      },
      // Gearbox to shaft
      {
        id: 'edge-gearbox-shaft',
        source: 'part-gearbox',
        target: 'part-shaft',
        sourceHandle: 'part-gearbox-output-shaft_out',
        targetHandle: 'part-shaft-input-shaft_in',
        type: 'default',
        data: {
          compatibility: 'direct',
          connectionType: 'flow'
        }
      },
      // Shaft to propeller
      {
        id: 'edge-shaft-propeller',
        source: 'part-shaft',
        target: 'part-propeller',
        sourceHandle: 'part-shaft-output-shaft_out',
        targetHandle: 'part-propeller-input-shaft',
        type: 'default',
        data: {
          compatibility: 'direct',
          connectionType: 'flow'
        }
      }
    ],
    inputs: [],
    outputs: []
  }
};

// Compact case-study powertrain for concept-stage FMU requests
export const basicPowertrain: SimpleComponent = {
  id: 'basic-powertrain',
  name: 'Powertrain',
  type: 'package',
  data: {
    declaredName: 'Powertrain',
    comment: 'Small electric propulsion powertrain case study for torsional vibration analysis',
    id: 'PKG-BASIC-POWERTRAIN',
    metadata: [
      { key: 'caseStudy', value: 'Basic Powertrain' },
      { key: 'analysisType', value: 'torsional_vibration' },
      { key: 'ratedPower', value: '1200kW' }
    ],
    nodes: [
      {
        id: 'item-battery-pack',
        type: 'item',
        position: { x: 80, y: 70 },
        data: {
          declaredName: 'Battery Pack',
          comment: 'DC energy source for propulsion drive',
          id: 'ITM-BATTERY-001',
          mass: 6200,
          metadata: [
            { key: 'capacity', value: '1800kWh' },
            { key: 'nominalVoltage', value: '900V' }
          ],
          inputs: [],
          outputs: [{
            id: 'port-dc-power-out',
            name: 'dc_power',
            interfaceType: 'dc-950v'
          }]
        }
      },
      {
        id: 'part-power-converter',
        type: 'part',
        position: { x: 330, y: 70 },
        data: {
          declaredName: 'Power Converter',
          definition: 'Marine Propulsion Converter',
          comment: 'Variable frequency drive for the propulsion motor',
          id: 'PRT-CONVERTER-001',
          mass: 850,
          metadata: [
            { key: 'ratedPower', value: '1200kW' },
            { key: 'switchingFrequency', value: '2kHz' }
          ],
          inputs: [{
            id: 'port-dc-power-in',
            name: 'dc_power',
            interfaceType: 'dc-950v'
          }],
          outputs: [{
            id: 'port-ac-power-out',
            name: 'ac_power',
            interfaceType: 'iec-690v-60hz'
          }]
        }
      },
      {
        id: 'part-electric-motor',
        type: 'part',
        position: { x: 580, y: 70 },
        data: {
          declaredName: 'Electric Motor',
          definition: 'Permanent Magnet Motor',
          comment: 'Main propulsion motor',
          id: 'PRT-MOTOR-001',
          mass: 2400,
          metadata: [
            { key: 'ratedPower', value: '1200kW' },
            { key: 'ratedSpeed', value: '900rpm' },
            { key: 'rotorInertia', value: '18kgm2' },
            { key: 'damping', value: '120Nms/rad' }
          ],
          inputs: [{
            id: 'port-ac-power-in',
            name: 'ac_power',
            interfaceType: 'iec-690v-60hz'
          }],
          outputs: [{
            id: 'port-shaft-out',
            name: 'shaft',
            interfaceType: 'propeller-drive-shaft'
          }]
        }
      },
      {
        id: 'part-propeller-shaft',
        type: 'part',
        position: { x: 830, y: 70 },
        data: {
          declaredName: 'Propeller Shaft',
          definition: 'Marine Shaft',
          comment: 'Intermediate shaft between motor and propeller',
          id: 'PRT-SHAFT-CASE-001',
          mass: 720,
          metadata: [
            { key: 'length', value: '8.5m' },
            { key: 'diameter', value: '220mm' },
            { key: 'torsionalStiffness', value: '6.5e6Nm/rad' },
            { key: 'damping', value: '45Nms/rad' }
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
        id: 'part-fixed-pitch-propeller',
        type: 'part',
        position: { x: 1080, y: 70 },
        data: {
          declaredName: 'Fixed Pitch Propeller',
          definition: 'Marine Propeller',
          comment: 'Open-water fixed pitch propeller load',
          id: 'PRT-PROP-CASE-001',
          mass: 1800,
          metadata: [
            { key: 'diameter', value: '3.2m' },
            { key: 'blades', value: '4' },
            { key: 'propellerInertia', value: '34kgm2' },
            { key: 'hydrodynamicDamping', value: '260Nms/rad' }
          ],
          inputs: [{
            id: 'port-shaft-in',
            name: 'shaft',
            interfaceType: 'propeller-drive-shaft'
          }],
          outputs: [{
            id: 'port-thrust-out',
            name: 'thrust',
            interfaceType: 'propeller-drive-shaft'
          }]
        }
      }
    ],
    edges: [
      {
        id: 'edge-battery-converter',
        source: 'item-battery-pack',
        target: 'part-power-converter',
        sourceHandle: 'item-battery-pack-output-dc_power',
        targetHandle: 'part-power-converter-input-dc_power',
        type: 'default',
        data: {
          compatibility: 'direct',
          connectionType: 'flow'
        }
      },
      {
        id: 'edge-converter-motor',
        source: 'part-power-converter',
        target: 'part-electric-motor',
        sourceHandle: 'part-power-converter-output-ac_power',
        targetHandle: 'part-electric-motor-input-ac_power',
        type: 'default',
        data: {
          compatibility: 'direct',
          connectionType: 'flow'
        }
      },
      {
        id: 'edge-motor-shaft',
        source: 'part-electric-motor',
        target: 'part-propeller-shaft',
        sourceHandle: 'part-electric-motor-output-shaft',
        targetHandle: 'part-propeller-shaft-input-shaft_in',
        type: 'default',
        data: {
          compatibility: 'direct',
          connectionType: 'flow'
        }
      },
      {
        id: 'edge-shaft-propeller-case',
        source: 'part-propeller-shaft',
        target: 'part-fixed-pitch-propeller',
        sourceHandle: 'part-propeller-shaft-output-shaft_out',
        targetHandle: 'part-fixed-pitch-propeller-input-shaft',
        type: 'default',
        data: {
          compatibility: 'direct',
          connectionType: 'flow'
        }
      }
    ],
    inputs: [],
    outputs: []
  }
};

// Minimal drive, motor, shaft, and propeller drivetrain for the OpenTorsion demo
export const motorShaftPropellerDemo: SimpleComponent = {
  id: 'motor-shaft-propeller-demo',
  name: 'Simple Electric Propulsion Train',
  type: 'package',
  data: {
    declaredName: 'Simple Electric Propulsion Train',
    comment: 'Drive, motor, shaft, and propeller model for torsional vibration analysis',
    id: 'PKG-MOTOR-SHAFT-PROP-DEMO',
    metadata: [
      { key: 'caseStudy', value: 'Drive Motor Shaft Propeller Demo' },
      { key: 'analysisType', value: 'torsional_vibration' },
      { key: 'modelForm', value: 'drive_converter-motor_inertia-shaft_stiffness-propeller_inertia' }
    ],
    nodes: [
      {
        id: 'part-propulsion-drive-demo',
        type: 'part',
        position: { x: 360, y: 520 },
        measured: { width: 760, height: 420 },
        data: {
          declaredName: 'Propulsion Drive',
          definition: 'Variable Frequency Drive',
          comment: 'Power electronics driver and inverter feeding the permanent magnet motor',
          id: 'PRT-PROPULSION-DRIVE-DEMO-001',
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
          outputs: [{
            id: 'port-ac-power-out',
            name: 'ac_power',
            interfaceType: 'iec-690v-60hz'
          }]
        }
      },
      {
        id: 'part-permanent-magnet-motor',
        type: 'part',
        position: { x: 1260, y: 520 },
        measured: { width: 760, height: 420 },
        data: {
          declaredName: 'Permanent Magnet Motor',
          definition: 'Permanent Magnet Motor',
          comment: 'Main electric propulsion motor; intended OEM request target: ABB',
          id: 'PRT-PM-MOTOR-DEMO-001',
          mass: 2400,
          metadata: [
            { key: 'preferredOEM', value: 'ABB' },
            { key: 'ratedPower', value: '1000kW' },
            { key: 'ratedSpeed', value: '600rpm' },
            { key: 'nominalTorque', value: '15915Nm' },
            { key: 'rotorInertia', value: '18kgm2' },
            { key: 'damping', value: '120Nms/rad' }
          ],
          inputs: [{
            id: 'port-ac-power-in',
            name: 'ac_power',
            interfaceType: 'iec-690v-60hz'
          }],
          outputs: [{
            id: 'port-shaft-out',
            name: 'shaft',
            interfaceType: 'propeller-drive-shaft'
          }]
        }
      },
      {
        id: 'part-propeller-shaft-demo',
        type: 'part',
        position: { x: 2120, y: 520 },
        measured: { width: 760, height: 420 },
        data: {
          declaredName: 'Propeller Shaft',
          definition: 'Marine Propeller Shaft',
          comment: 'Single shaft coupling the motor and propeller inertias',
          id: 'PRT-SHAFT-DEMO-001',
          mass: 520,
          metadata: [
            { key: 'length', value: '6m' },
            { key: 'diameter', value: '180mm' },
            { key: 'shaftInertia', value: '2kgm2' },
            { key: 'torsionalStiffness', value: '6.5e6Nm/rad' },
            { key: 'shaftDamping', value: '45Nms/rad' }
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
        id: 'part-fixed-pitch-propeller-demo',
        type: 'part',
        position: { x: 2980, y: 520 },
        measured: { width: 760, height: 420 },
        data: {
          declaredName: 'Fixed Pitch Propeller',
          definition: 'Fixed Pitch Propeller',
          comment: 'Propeller load; intended OEM request target: Kongsberg',
          id: 'PRT-PROP-DEMO-001',
          mass: 1800,
          metadata: [
            { key: 'preferredOEM', value: 'Kongsberg' },
            { key: 'diameter', value: '2.2m' },
            { key: 'nominalSpeed', value: '600rpm' },
            { key: 'propellerInertia', value: '34kgm2' },
            { key: 'hydrodynamicDamping', value: '260Nms/rad' }
          ],
          inputs: [{
            id: 'port-shaft-in',
            name: 'shaft',
            interfaceType: 'propeller-drive-shaft'
          }],
          outputs: [{
            id: 'port-thrust-out',
            name: 'thrust',
            interfaceType: 'propeller-drive-shaft'
          }]
        }
      }
    ],
    edges: [
      {
        id: 'edge-demo-drive-motor',
        source: 'part-propulsion-drive-demo',
        target: 'part-permanent-magnet-motor',
        sourceHandle: 'part-propulsion-drive-demo-output-ac_power',
        targetHandle: 'part-permanent-magnet-motor-input-ac_power',
        type: 'default',
        data: {
          compatibility: 'direct',
          connectionType: 'flow'
        }
      },
      {
        id: 'edge-demo-motor-shaft',
        source: 'part-permanent-magnet-motor',
        target: 'part-propeller-shaft-demo',
        sourceHandle: 'part-permanent-magnet-motor-output-shaft',
        targetHandle: 'part-propeller-shaft-demo-input-shaft_in',
        type: 'default',
        data: {
          compatibility: 'direct',
          connectionType: 'flow'
        }
      },
      {
        id: 'edge-demo-shaft-propeller',
        source: 'part-propeller-shaft-demo',
        target: 'part-fixed-pitch-propeller-demo',
        sourceHandle: 'part-propeller-shaft-demo-output-shaft_out',
        targetHandle: 'part-fixed-pitch-propeller-demo-input-shaft',
        type: 'default',
        data: {
          compatibility: 'direct',
          connectionType: 'flow'
        }
      }
    ],
    inputs: [],
    outputs: []
  }
};

// Exact concept-stage representation of python-client/templates/model.ssp.
// The design-stage cloud runner uses the templateSimulation metadata to run the repo SSP.
export const simanticsSspCloudTemplate: SimpleComponent = {
  id: 'simantics-ssp-cloud-template',
  name: 'Motor System',
  type: 'package',
  data: {
    declaredName: 'Motor System',
    comment: 'Motor system example mapped to python-client/templates/model.ssp and test.scl',
    id: 'PKG-SIMANTICS-SSP-CLOUD-TEMPLATE',
    metadata: [
      { key: 'templateSimulation', value: 'simantics-ssp-cloud-template' },
      { key: 'sspTemplateModel', value: 'python-client/templates/model.ssp' },
      { key: 'sspTemplateScript', value: 'python-client/templates/test.scl' },
      { key: 'sspSystemStructure', value: 'Demo/Root' },
      { key: 'analysisType', value: 'cloud_ssp_simulation' },
      { key: 'productName', value: 'Simantics SSP Studio' },
      { key: 'productVersion', value: '0.0.7' }
    ],
    nodes: [
      {
        id: 'ssp-trapezoid-command',
        type: 'part',
        position: { x: 80, y: 160 },
        measured: { width: 600, height: 360 },
        data: {
          declaredName: 'Modelica_Blocks_Sources_Trapezoid',
          definition: 'Modelica Trapezoid Source FMU',
          comment: 'Speed command source from the template SSP',
          id: 'PRT-SSP-TRAPEZOID-001',
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
          outputs: [{ id: 'port-y', name: 'y', interfaceType: 'nmea-0183' }]
        }
      },
      {
        id: 'ssp-vf-controller',
        type: 'part',
        position: { x: 600, y: 160 },
        measured: { width: 600, height: 360 },
        data: {
          declaredName: 'Codes_VfController',
          definition: 'V/f Controller FMU',
          comment: 'Controller FMU receiving the trapezoid command',
          id: 'PRT-SSP-VF-CONTROLLER-001',
          mass: 0,
          metadata: [
            { key: 'sspComponentName', value: 'Codes_VfController' },
            { key: 'fmuSource', value: 'resources/0002_replaceCodes_VfController.fmu' },
            { key: 'VNominal', value: '4000V' },
            { key: 'fNominal', value: '60Hz' }
          ],
          inputs: [{ id: 'port-u', name: 'u', interfaceType: 'nmea-0183' }],
          outputs: [
            { id: 'port-y1', name: 'y[1]', interfaceType: 'iec-690v-60hz' },
            { id: 'port-y2', name: 'y[2]', interfaceType: 'iec-690v-60hz' }
          ]
        }
      },
      {
        id: 'ssp-motor-flexible-shaft',
        type: 'part',
        position: { x: 1120, y: 160 },
        measured: { width: 600, height: 360 },
        data: {
          declaredName: 'Codes_MotorWithFlexibleShaft2_FMU',
          definition: 'Motor With Flexible Shaft FMU',
          comment: 'Motor FMU from the template SSP',
          id: 'PRT-SSP-MOTOR-FLEX-SHAFT-001',
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
            { id: 'port-us1', name: 'us[1]', interfaceType: 'iec-690v-60hz' },
            { id: 'port-us2', name: 'us[2]', interfaceType: 'iec-690v-60hz' },
            { id: 'port-w', name: 'w', interfaceType: 'propeller-drive-shaft' },
            { id: 'port-a', name: 'a', interfaceType: 'propeller-drive-shaft' }
          ],
          outputs: [{ id: 'port-tau', name: 'tau', interfaceType: 'propeller-drive-shaft' }]
        }
      },
      {
        id: 'ssp-drivetrain',
        type: 'part',
        position: { x: 1640, y: 160 },
        measured: { width: 600, height: 360 },
        data: {
          declaredName: 'Codes_Drivetrain2_FMU',
          definition: 'Drivetrain FMU',
          comment: 'Compressor, coupling, and flywheel drivetrain FMU',
          id: 'PRT-SSP-DRIVETRAIN-001',
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
            { id: 'port-tau-in', name: 'tau_in', interfaceType: 'propeller-drive-shaft' },
            { id: 'port-w-out-in', name: 'w_out', interfaceType: 'propeller-drive-shaft' },
            { id: 'port-a-out-in', name: 'a_out', interfaceType: 'propeller-drive-shaft' }
          ],
          outputs: [
            { id: 'port-w-in-out', name: 'w_in', interfaceType: 'propeller-drive-shaft' },
            { id: 'port-tau-out', name: 'tau_out', interfaceType: 'propeller-drive-shaft' },
            { id: 'port-a-in-out', name: 'a_in', interfaceType: 'propeller-drive-shaft' }
          ]
        }
      },
      {
        id: 'ssp-load',
        type: 'part',
        position: { x: 2160, y: 160 },
        measured: { width: 600, height: 360 },
        data: {
          declaredName: 'Codes_Load2_FMU',
          definition: 'Load FMU',
          comment: 'Template load FMU',
          id: 'PRT-SSP-LOAD-001',
          mass: 0,
          metadata: [
            { key: 'sspComponentName', value: 'Codes_Load2_FMU' },
            { key: 'fmuSource', value: 'resources/0005_replaceCodes_Load2_FMU.fmu' },
            { key: 'load.J', value: '40' },
            { key: 'load.K1', value: '0' },
            { key: 'load.K2', value: '200' },
            { key: 'load.T', value: '0' }
          ],
          inputs: [{ id: 'port-tau', name: 'tau', interfaceType: 'propeller-drive-shaft' }],
          outputs: [
            { id: 'port-w', name: 'w', interfaceType: 'propeller-drive-shaft' },
            { id: 'port-a', name: 'a', interfaceType: 'propeller-drive-shaft' }
          ]
        }
      }
    ],
    edges: [
      {
        id: 'edge-ssp-trapezoid-controller',
        source: 'ssp-trapezoid-command',
        target: 'ssp-vf-controller',
        sourceHandle: 'ssp-trapezoid-command-output-y',
        targetHandle: 'ssp-vf-controller-input-u',
        type: 'default',
        data: { compatibility: 'direct', connectionType: 'flow' }
      },
      {
        id: 'edge-ssp-controller-motor-us1',
        source: 'ssp-vf-controller',
        target: 'ssp-motor-flexible-shaft',
        sourceHandle: 'ssp-vf-controller-output-y[1]',
        targetHandle: 'ssp-motor-flexible-shaft-input-us[1]',
        type: 'default',
        data: { compatibility: 'direct', connectionType: 'flow' }
      },
      {
        id: 'edge-ssp-controller-motor-us2',
        source: 'ssp-vf-controller',
        target: 'ssp-motor-flexible-shaft',
        sourceHandle: 'ssp-vf-controller-output-y[2]',
        targetHandle: 'ssp-motor-flexible-shaft-input-us[2]',
        type: 'default',
        data: { compatibility: 'direct', connectionType: 'flow' }
      },
      {
        id: 'edge-ssp-motor-drivetrain-tau',
        source: 'ssp-motor-flexible-shaft',
        target: 'ssp-drivetrain',
        sourceHandle: 'ssp-motor-flexible-shaft-output-tau',
        targetHandle: 'ssp-drivetrain-input-tau_in',
        type: 'default',
        data: { compatibility: 'direct', connectionType: 'flow' }
      },
      {
        id: 'edge-ssp-drivetrain-motor-w',
        source: 'ssp-drivetrain',
        target: 'ssp-motor-flexible-shaft',
        sourceHandle: 'ssp-drivetrain-output-w_in',
        targetHandle: 'ssp-motor-flexible-shaft-input-w',
        type: 'default',
        data: { compatibility: 'direct', connectionType: 'flow' }
      },
      {
        id: 'edge-ssp-drivetrain-motor-a',
        source: 'ssp-drivetrain',
        target: 'ssp-motor-flexible-shaft',
        sourceHandle: 'ssp-drivetrain-output-a_in',
        targetHandle: 'ssp-motor-flexible-shaft-input-a',
        type: 'default',
        data: { compatibility: 'direct', connectionType: 'flow' }
      },
      {
        id: 'edge-ssp-drivetrain-load-tau',
        source: 'ssp-drivetrain',
        target: 'ssp-load',
        sourceHandle: 'ssp-drivetrain-output-tau_out',
        targetHandle: 'ssp-load-input-tau',
        type: 'default',
        data: { compatibility: 'direct', connectionType: 'flow' }
      },
      {
        id: 'edge-ssp-load-drivetrain-w',
        source: 'ssp-load',
        target: 'ssp-drivetrain',
        sourceHandle: 'ssp-load-output-w',
        targetHandle: 'ssp-drivetrain-input-w_out',
        type: 'default',
        data: { compatibility: 'direct', connectionType: 'flow' }
      },
      {
        id: 'edge-ssp-load-drivetrain-a',
        source: 'ssp-load',
        target: 'ssp-drivetrain',
        sourceHandle: 'ssp-load-output-a',
        targetHandle: 'ssp-drivetrain-input-a_out',
        type: 'default',
        data: { compatibility: 'direct', connectionType: 'flow' }
      }
    ],
    inputs: [],
    outputs: []
  }
};// ── Maritime Cooling System (HT/LT fresh water + sea water circuits) ──
export const maritimeCoolingSystem: SimpleComponent = {
  id: 'maritime-cooling-system',
  name: 'Maritime Cooling System',
  type: 'package',
  data: {
    declaredName: 'Maritime Cooling System',
    comment: 'HT/LT fresh water cooling circuits with central sea water heat exchanger',
    id: 'PKG-MARITIME-COOLING',
    metadata: [
      { key: 'systemType', value: 'Cooling' },
      { key: 'htCircuitTemp', value: '90°C' },
      { key: 'ltCircuitTemp', value: '38°C' },
      { key: 'coolingCapacity', value: '4500kW' }
    ],
    nodes: [
      {
        id: 'part-ht-pump',
        type: 'part',
        position: { x: 200, y: 250 },
        data: {
          declaredName: 'HT Fresh Water Pump',
          definition: 'Centrifugal Pump',
          comment: 'High-temperature circuit pump for main engine jacket water cooling',
          id: 'PRT-HT-PUMP-001',
          mass: 380,
          metadata: [
            { key: 'flowRate', value: '120m³/h' },
            { key: 'head', value: '35m' },
            { key: 'motorPower', value: '22kW' }
          ],
          inputs: [{ id: 'port-ht-water-in', name: 'ht_water_in', interfaceType: 'ht-water' }],
          outputs: [{ id: 'port-ht-water-out', name: 'ht_water_out', interfaceType: 'ht-water' }]
        }
      },
      {
        id: 'part-lt-pump',
        type: 'part',
        position: { x: 200, y: 700 },
        data: {
          declaredName: 'LT Fresh Water Pump',
          definition: 'Centrifugal Pump',
          comment: 'Low-temperature circuit pump for charge air coolers and lubricating oil',
          id: 'PRT-LT-PUMP-001',
          mass: 420,
          metadata: [
            { key: 'flowRate', value: '180m³/h' },
            { key: 'head', value: '30m' },
            { key: 'motorPower', value: '30kW' }
          ],
          inputs: [{ id: 'port-lt-water-in', name: 'lt_water_in', interfaceType: 'lt-water' }],
          outputs: [{ id: 'port-lt-water-out', name: 'lt_water_out', interfaceType: 'lt-water' }]
        }
      },
      {
        id: 'part-central-cooler',
        type: 'part',
        position: { x: 850, y: 475 },
        data: {
          declaredName: 'Central Cooler',
          definition: 'Plate Heat Exchanger',
          comment: 'Titanium plate heat exchanger — HT/LT fresh water cooled by sea water',
          id: 'PRT-CENTRAL-COOLER-001',
          mass: 2800,
          metadata: [
            { key: 'type', value: 'Plate' },
            { key: 'material', value: 'Titanium' },
            { key: 'capacity', value: '4500kW' },
            { key: 'plates', value: '340' }
          ],
          inputs: [
            { id: 'port-fw-ht-in', name: 'fw_ht_in', interfaceType: 'ht-water' },
            { id: 'port-fw-lt-in', name: 'fw_lt_in', interfaceType: 'lt-water' },
            { id: 'port-sw-in', name: 'sw_in', interfaceType: 'sw-water' }
          ],
          outputs: [
            { id: 'port-fw-ht-out', name: 'fw_ht_out', interfaceType: 'ht-water' },
            { id: 'port-fw-lt-out', name: 'fw_lt_out', interfaceType: 'lt-water' }
          ]
        }
      },
      {
        id: 'part-sw-pump',
        type: 'part',
        position: { x: 1500, y: 475 },
        data: {
          declaredName: 'Sea Water Pump',
          definition: 'Centrifugal Pump',
          comment: 'Main sea water circulation pump feeding the central cooler',
          id: 'PRT-SW-PUMP-001',
          mass: 650,
          metadata: [
            { key: 'flowRate', value: '320m³/h' },
            { key: 'head', value: '25m' },
            { key: 'motorPower', value: '45kW' },
            { key: 'material', value: 'Bronze' }
          ],
          inputs: [{ id: 'port-sw-in', name: 'sw_in', interfaceType: 'sw-water' }],
          outputs: [{ id: 'port-sw-out', name: 'sw_out', interfaceType: 'sw-water' }]
        }
      },
      {
        id: 'part-expansion-tank',
        type: 'part',
        position: { x: 200, y: 1150 },
        data: {
          declaredName: 'FW Expansion Tank',
          definition: 'Expansion Tank',
          comment: 'Pressurised expansion tank for the fresh water circuits',
          id: 'PRT-EXP-TANK-001',
          mass: 180,
          metadata: [
            { key: 'volume', value: '800L' },
            { key: 'preChargePressure', value: '1.5bar' }
          ],
          inputs: [{ id: 'port-exp-in', name: 'fw_return', interfaceType: 'ht-water' }],
          outputs: [{ id: 'port-exp-out', name: 'fw_supply', interfaceType: 'ht-water' }]
        }
      },
      {
        id: 'item-sea-water',
        type: 'item',
        position: { x: 1500, y: 150 },
        data: {
          declaredName: 'Sea Water Inlet',
          comment: 'Sea water intake from sea chest via strainer',
          id: 'ITM-SW-INLET-001',
          mass: 0,
          metadata: [{ key: 'source', value: 'Sea Chest' }],
          inputs: [],
          outputs: [{ id: 'port-sw-supply', name: 'sea_water', interfaceType: 'sw-water' }]
        }
      }
    ],
    edges: [
      { id: 'edge-sw-inlet-pump', source: 'item-sea-water', target: 'part-sw-pump', sourceHandle: 'item-sea-water-output-sea_water', targetHandle: 'part-sw-pump-input-sw_in', type: 'default', data: { compatibility: 'direct', connectionType: 'flow' } },
      { id: 'edge-sw-pump-cooler', source: 'part-sw-pump', target: 'part-central-cooler', sourceHandle: 'part-sw-pump-output-sw_out', targetHandle: 'part-central-cooler-input-sw_in', type: 'default', data: { compatibility: 'direct', connectionType: 'flow' } },
      { id: 'edge-ht-pump-cooler', source: 'part-ht-pump', target: 'part-central-cooler', sourceHandle: 'part-ht-pump-output-ht_water_out', targetHandle: 'part-central-cooler-input-fw_ht_in', type: 'default', data: { compatibility: 'direct', connectionType: 'flow' } },
      { id: 'edge-lt-pump-cooler', source: 'part-lt-pump', target: 'part-central-cooler', sourceHandle: 'part-lt-pump-output-lt_water_out', targetHandle: 'part-central-cooler-input-fw_lt_in', type: 'default', data: { compatibility: 'direct', connectionType: 'flow' } },
      { id: 'edge-cooler-expansion', source: 'part-central-cooler', target: 'part-expansion-tank', sourceHandle: 'part-central-cooler-output-fw_ht_out', targetHandle: 'part-expansion-tank-input-fw_return', type: 'default', data: { compatibility: 'direct', connectionType: 'flow' } }
    ],
    inputs: [],
    outputs: []
  }
};

// ── Ballast Water System ──
export const ballastWaterSystem: SimpleComponent = {
  id: 'ballast-water-system',
  name: 'Ballast Water System',
  type: 'package',
  data: {
    declaredName: 'Ballast Water System',
    comment: 'IMO D-2 compliant ballast water management with treatment and tank control',
    id: 'PKG-BALLAST-WATER',
    metadata: [
      { key: 'systemType', value: 'Ballast' },
      { key: 'compliance', value: 'IMO D-2' },
      { key: 'totalCapacity', value: '3200m³' },
      { key: 'treatmentType', value: 'UV + Filtration' }
    ],
    nodes: [
      {
        id: 'part-ballast-pump',
        type: 'part',
        position: { x: 200, y: 300 },
        data: {
          declaredName: 'Ballast Water Pump',
          definition: 'Centrifugal Pump',
          comment: 'Main ballast pump for filling and stripping ballast tanks',
          id: 'PRT-BALLAST-PUMP-001',
          mass: 1200,
          metadata: [
            { key: 'flowRate', value: '500m³/h' },
            { key: 'head', value: '25m' },
            { key: 'motorPower', value: '75kW' }
          ],
          inputs: [{ id: 'port-bw-in', name: 'bw_in', interfaceType: 'sw-water' }],
          outputs: [{ id: 'port-bw-out', name: 'bw_out', interfaceType: 'sw-water' }]
        }
      },
      {
        id: 'part-bwts',
        type: 'part',
        position: { x: 850, y: 300 },
        data: {
          declaredName: 'Ballast Water Treatment System',
          definition: 'UV BWTS',
          comment: 'UV-based ballast water treatment — 50 µm filtration + medium-pressure UV',
          id: 'PRT-BWTS-001',
          mass: 3400,
          metadata: [
            { key: 'type', value: 'UV' },
            { key: 'filterMesh', value: '50µm' },
            { key: 'uvDose', value: '300mJ/cm²' },
            { key: 'treatmentCapacity', value: '500m³/h' }
          ],
          inputs: [{ id: 'port-bwts-in', name: 'untreated', interfaceType: 'sw-water' }],
          outputs: [{ id: 'port-bwts-out', name: 'treated', interfaceType: 'sw-water' }]
        }
      },
      {
        id: 'part-valve-manifold',
        type: 'part',
        position: { x: 1500, y: 300 },
        data: {
          declaredName: 'Ballast Valve Manifold',
          definition: 'Hydraulic Valve Manifold',
          comment: 'Remote-operated manifold distributing ballast water to individual tanks',
          id: 'PRT-VALVE-MANIFOLD-001',
          mass: 850,
          metadata: [
            { key: 'valves', value: '12' },
            { key: 'actuation', value: 'Hydraulic' },
            { key: 'remoteControl', value: 'IAS integrated' }
          ],
          inputs: [{ id: 'port-vm-in', name: 'manifold_in', interfaceType: 'sw-water' }],
          outputs: [{ id: 'port-vm-out', name: 'manifold_out', interfaceType: 'sw-water' }]
        }
      },
      {
        id: 'item-ballast-tank-group',
        type: 'item',
        position: { x: 2150, y: 300 },
        data: {
          declaredName: 'Ballast Tank Group',
          comment: 'Set of segregated ballast tanks (fore peak, aft peak, double bottom, wing tanks)',
          id: 'ITM-BALLAST-TANKS-001',
          mass: 0,
          metadata: [
            { key: 'tankCount', value: '8' },
            { key: 'totalVolume', value: '3200m³' }
          ],
          inputs: [{ id: 'port-tank-in', name: 'tank_fill', interfaceType: 'sw-water' }],
          outputs: [{ id: 'port-tank-out', name: 'tank_strip', interfaceType: 'sw-water' }]
        }
      }
    ],
    edges: [
      { id: 'edge-pump-bwts', source: 'part-ballast-pump', target: 'part-bwts', sourceHandle: 'part-ballast-pump-output-bw_out', targetHandle: 'part-bwts-input-untreated', type: 'default', data: { compatibility: 'direct', connectionType: 'flow' } },
      { id: 'edge-bwts-manifold', source: 'part-bwts', target: 'part-valve-manifold', sourceHandle: 'part-bwts-output-treated', targetHandle: 'part-valve-manifold-input-manifold_in', type: 'default', data: { compatibility: 'direct', connectionType: 'flow' } },
      { id: 'edge-manifold-tank', source: 'part-valve-manifold', target: 'item-ballast-tank-group', sourceHandle: 'part-valve-manifold-output-manifold_out', targetHandle: 'item-ballast-tank-group-input-tank_fill', type: 'default', data: { compatibility: 'direct', connectionType: 'flow' } }
    ],
    inputs: [],
    outputs: []
  }
};

// ── Ship HVAC & Ventilation System ──
export const shipHvacSystem: SimpleComponent = {
  id: 'ship-hvac-system',
  name: 'Ship HVAC System',
  type: 'package',
  data: {
    declaredName: 'Ship HVAC System',
    comment: 'Accommodation and machinery space HVAC with chiller, air handlers, and fire dampers',
    id: 'PKG-SHIP-HVAC',
    metadata: [
      { key: 'systemType', value: 'HVAC' },
      { key: 'coolingCapacity', value: '850kW' },
      { key: 'airFlow', value: '45000m³/h' },
      { key: 'zones', value: '6' }
    ],
    nodes: [
      {
        id: 'part-chiller',
        type: 'part',
        position: { x: 200, y: 300 },
        data: {
          declaredName: 'Screw Chiller Unit',
          definition: 'Marine Water Chiller',
          comment: 'Twin-screw compressor chiller supplying chilled water to air handling units',
          id: 'PRT-CHILLER-001',
          mass: 2200,
          metadata: [
            { key: 'type', value: 'Screw' },
            { key: 'capacity', value: '850kW' },
            { key: 'refrigerant', value: 'R-513A' },
            { key: 'chilledWaterTemp', value: '7/12°C' }
          ],
          inputs: [{ id: 'port-chw-return', name: 'chw_return', interfaceType: 'lt-water' }],
          outputs: [{ id: 'port-chw-supply', name: 'chw_supply', interfaceType: 'lt-water' }]
        }
      },
      {
        id: 'part-ahu-bridge',
        type: 'part',
        position: { x: 850, y: 150 },
        data: {
          declaredName: 'Bridge AHU',
          definition: 'Air Handling Unit',
          comment: 'Bridge deck air handling unit — cooling, heating, and fresh air intake',
          id: 'PRT-AHU-BRIDGE-001',
          mass: 480,
          metadata: [
            { key: 'airFlow', value: '8000m³/h' },
            { key: 'coolingCoil', value: 'Chilled Water' },
            { key: 'filterClass', value: 'F7' }
          ],
          inputs: [
            { id: 'port-ahu-b-chw', name: 'chw_in', interfaceType: 'lt-water' },
            { id: 'port-ahu-b-fresh', name: 'fresh_air', interfaceType: 'work-air' }
          ],
          outputs: [{ id: 'port-ahu-b-supply', name: 'supply_air', interfaceType: 'work-air' }]
        }
      },
      {
        id: 'part-ahu-accommodation',
        type: 'part',
        position: { x: 850, y: 600 },
        data: {
          declaredName: 'Accommodation AHU',
          definition: 'Air Handling Unit',
          comment: 'Main accommodation air handling unit serving cabins and public spaces',
          id: 'PRT-AHU-ACCOM-001',
          mass: 720,
          metadata: [
            { key: 'airFlow', value: '22000m³/h' },
            { key: 'coolingCoil', value: 'Chilled Water' },
            { key: 'heatRecovery', value: 'Rotary Wheel 78%' }
          ],
          inputs: [
            { id: 'port-ahu-a-chw', name: 'chw_in', interfaceType: 'lt-water' },
            { id: 'port-ahu-a-fresh', name: 'fresh_air', interfaceType: 'work-air' }
          ],
          outputs: [{ id: 'port-ahu-a-supply', name: 'supply_air', interfaceType: 'work-air' }]
        }
      },
      {
        id: 'part-vent-fan',
        type: 'part',
        position: { x: 850, y: 1050 },
        data: {
          declaredName: 'Engine Room Vent Fan',
          definition: 'Axial Ventilation Fan',
          comment: 'Engine room supply and extraction fan set with fire dampers',
          id: 'PRT-VENT-FAN-001',
          mass: 350,
          metadata: [
            { key: 'airFlow', value: '15000m³/h' },
            { key: 'motorPower', value: '11kW' },
            { key: 'fireRated', value: 'A-60' }
          ],
          inputs: [{ id: 'port-vent-fresh', name: 'fresh_air', interfaceType: 'work-air' }],
          outputs: [{ id: 'port-vent-supply', name: 'vent_air', interfaceType: 'work-air' }]
        }
      },
      {
        id: 'item-fresh-air',
        type: 'item',
        position: { x: 200, y: 800 },
        data: {
          declaredName: 'Fresh Air Intake',
          comment: 'Weather-tight fresh air intake with mist eliminator and bird screen',
          id: 'ITM-FRESH-AIR-001',
          mass: 0,
          metadata: [{ key: 'intakeType', value: 'Weather-Tight Louvre' }],
          inputs: [],
          outputs: [{ id: 'port-air-supply', name: 'fresh_air', interfaceType: 'work-air' }]
        }
      }
    ],
    edges: [
      { id: 'edge-chiller-ahu-b', source: 'part-chiller', target: 'part-ahu-bridge', sourceHandle: 'part-chiller-output-chw_supply', targetHandle: 'part-ahu-bridge-input-chw_in', type: 'default', data: { compatibility: 'direct', connectionType: 'flow' } },
      { id: 'edge-chiller-ahu-a', source: 'part-chiller', target: 'part-ahu-accommodation', sourceHandle: 'part-chiller-output-chw_supply', targetHandle: 'part-ahu-accommodation-input-chw_in', type: 'default', data: { compatibility: 'direct', connectionType: 'flow' } },
      { id: 'edge-fresh-ahu-b', source: 'item-fresh-air', target: 'part-ahu-bridge', sourceHandle: 'item-fresh-air-output-fresh_air', targetHandle: 'part-ahu-bridge-input-fresh_air', type: 'default', data: { compatibility: 'direct', connectionType: 'flow' } },
      { id: 'edge-fresh-ahu-a', source: 'item-fresh-air', target: 'part-ahu-accommodation', sourceHandle: 'item-fresh-air-output-fresh_air', targetHandle: 'part-ahu-accommodation-input-fresh_air', type: 'default', data: { compatibility: 'direct', connectionType: 'flow' } },
      { id: 'edge-fresh-vent', source: 'item-fresh-air', target: 'part-vent-fan', sourceHandle: 'item-fresh-air-output-fresh_air', targetHandle: 'part-vent-fan-input-fresh_air', type: 'default', data: { compatibility: 'direct', connectionType: 'flow' } }
    ],
    inputs: [],
    outputs: []
  }
};

// ── Navigation & Bridge System ──
export const navigationBridgeSystem: SimpleComponent = {
  id: 'navigation-bridge-system',
  name: 'Navigation & Bridge System',
  type: 'package',
  data: {
    declaredName: 'Navigation & Bridge System',
    comment: 'Integrated bridge system with X/S-band radars, ECDIS, GPS, gyrocompass, and autopilot',
    id: 'PKG-NAV-BRIDGE',
    metadata: [
      { key: 'systemType', value: 'Navigation' },
      { key: 'compliance', value: 'SOLAS Ch.V' },
      { key: 'bridgeClass', value: 'IBS (Integrated Bridge System)' }
    ],
    nodes: [
      {
        id: 'part-xband-radar',
        type: 'part',
        position: { x: 200, y: 150 },
        data: {
          declaredName: 'X-Band Radar',
          definition: 'Marine Radar',
          comment: '9.4 GHz X-band radar for high-resolution short-range navigation and collision avoidance',
          id: 'PRT-XBAND-RADAR-001',
          mass: 65,
          metadata: [
            { key: 'frequency', value: '9.4GHz (X-band)' },
            { key: 'range', value: '24NM' },
            { key: 'antennaType', value: '6ft Open Array' }
          ],
          inputs: [{ id: 'port-radar-pps', name: 'trigger_sync', interfaceType: 'nmea-0183' }],
          outputs: [{ id: 'port-radar-video', name: 'radar_video', interfaceType: 'nmea-0183' }]
        }
      },
      {
        id: 'part-sband-radar',
        type: 'part',
        position: { x: 200, y: 600 },
        data: {
          declaredName: 'S-Band Radar',
          definition: 'Marine Radar',
          comment: '3.0 GHz S-band radar for long-range detection in heavy sea clutter',
          id: 'PRT-SBAND-RADAR-001',
          mass: 85,
          metadata: [
            { key: 'frequency', value: '3.0GHz (S-band)' },
            { key: 'range', value: '72NM' },
            { key: 'antennaType', value: '12ft Open Array' }
          ],
          inputs: [{ id: 'port-sradar-pps', name: 'trigger_sync', interfaceType: 'nmea-0183' }],
          outputs: [{ id: 'port-sradar-video', name: 'radar_video', interfaceType: 'nmea-0183' }]
        }
      },
      {
        id: 'part-gps-receiver',
        type: 'part',
        position: { x: 850, y: 150 },
        data: {
          declaredName: 'Dual GPS/GNSS Receiver',
          definition: 'GNSS Receiver',
          comment: 'Dual-antenna multi-constellation GNSS receiver (GPS + GLONASS + Galileo + BeiDou)',
          id: 'PRT-GPS-001',
          mass: 8,
          metadata: [
            { key: 'constellations', value: 'GPS + GLONASS + Galileo + BeiDou' },
            { key: 'accuracy', value: '<1m (DGNSS)' },
            { key: 'updateRate', value: '10Hz' }
          ],
          inputs: [],
          outputs: [{ id: 'port-gps-nmea', name: 'nmea_position', interfaceType: 'nmea-0183' }]
        }
      },
      {
        id: 'part-gyrocompass',
        type: 'part',
        position: { x: 850, y: 600 },
        data: {
          declaredName: 'Gyrocompass',
          definition: 'Fibre-Optic Gyrocompass',
          comment: 'IMO type-approved fibre-optic gyrocompass with heading and rate-of-turn output',
          id: 'PRT-GYRO-001',
          mass: 22,
          metadata: [
            { key: 'technology', value: 'FOG (Fibre-Optic Gyro)' },
            { key: 'accuracy', value: '0.1° secant latitude' },
            { key: 'settlingTime', value: '<3min' }
          ],
          inputs: [],
          outputs: [{ id: 'port-gyro-hdt', name: 'heading_nmea', interfaceType: 'nmea-0183' }]
        }
      },
      {
        id: 'part-ecdis-console',
        type: 'part',
        position: { x: 1500, y: 375 },
        data: {
          declaredName: 'ECDIS Console',
          definition: 'Electronic Chart Display',
          comment: 'Dual ECDIS workstation with S-100 compliant electronic chart display',
          id: 'PRT-ECDIS-001',
          mass: 45,
          metadata: [
            { key: 'displays', value: '2 × 27"' },
            { key: 'chartStandard', value: 'S-57 / S-100' },
            { key: 'trackControl', value: 'CAT II' }
          ],
          inputs: [
            { id: 'port-ecdis-gps', name: 'position_in', interfaceType: 'nmea-0183' },
            { id: 'port-ecdis-gyro', name: 'heading_in', interfaceType: 'nmea-0183' },
            { id: 'port-ecdis-radar', name: 'radar_overlay', interfaceType: 'nmea-0183' }
          ],
          outputs: [{ id: 'port-ecdis-route', name: 'route_data', interfaceType: 'nmea-0183' }]
        }
      },
      {
        id: 'part-autopilot',
        type: 'part',
        position: { x: 2150, y: 375 },
        data: {
          declaredName: 'Adaptive Autopilot',
          definition: 'Heading Control System',
          comment: 'Adaptive track-keeping autopilot with weather compensation and rate-of-turn control',
          id: 'PRT-AUTOPILOT-001',
          mass: 18,
          metadata: [
            { key: 'controlMode', value: 'Heading / Track / Rate-of-Turn' },
            { key: 'weatherCompensation', value: 'Adaptive' },
            { key: 'interface', value: 'NMEA 0183 / Modbus TCP' }
          ],
          inputs: [
            { id: 'port-ap-heading', name: 'heading_in', interfaceType: 'nmea-0183' },
            { id: 'port-ap-route', name: 'route_in', interfaceType: 'nmea-0183' }
          ],
          outputs: [{ id: 'port-ap-rudder', name: 'rudder_cmd', interfaceType: 'nmea-0183' }]
        }
      }
    ],
    edges: [
      { id: 'edge-gps-ecdis', source: 'part-gps-receiver', target: 'part-ecdis-console', sourceHandle: 'part-gps-receiver-output-nmea_position', targetHandle: 'part-ecdis-console-input-position_in', type: 'default', data: { compatibility: 'direct', connectionType: 'flow' } },
      { id: 'edge-gyro-ecdis', source: 'part-gyrocompass', target: 'part-ecdis-console', sourceHandle: 'part-gyrocompass-output-heading_nmea', targetHandle: 'part-ecdis-console-input-heading_in', type: 'default', data: { compatibility: 'direct', connectionType: 'flow' } },
      { id: 'edge-xradar-ecdis', source: 'part-xband-radar', target: 'part-ecdis-console', sourceHandle: 'part-xband-radar-output-radar_video', targetHandle: 'part-ecdis-console-input-radar_overlay', type: 'default', data: { compatibility: 'direct', connectionType: 'flow' } },
      { id: 'edge-gyro-ap', source: 'part-gyrocompass', target: 'part-autopilot', sourceHandle: 'part-gyrocompass-output-heading_nmea', targetHandle: 'part-autopilot-input-heading_in', type: 'default', data: { compatibility: 'direct', connectionType: 'flow' } },
      { id: 'edge-ecdis-ap', source: 'part-ecdis-console', target: 'part-autopilot', sourceHandle: 'part-ecdis-console-output-route_data', targetHandle: 'part-autopilot-input-route_in', type: 'default', data: { compatibility: 'direct', connectionType: 'flow' } }
    ],
    inputs: [],
    outputs: []
  }
};

// Keep these for backward compatibility — all point to the commercial vessel powertrain
export const engineComponent = commercialVesselPowertrain;
export const generatorComponent = commercialVesselPowertrain;
export const pumpComponent = commercialVesselPowertrain;
export const electricMotorComponent = commercialVesselPowertrain;
export const propellerComponent = commercialVesselPowertrain;
export const pmsComponent = commercialVesselPowertrain;
export const automationControllerComponent = commercialVesselPowertrain;
export const switchboardComponent = commercialVesselPowertrain;
export const transformerComponent = commercialVesselPowertrain;
export const circuitBreakerComponent = commercialVesselPowertrain;
