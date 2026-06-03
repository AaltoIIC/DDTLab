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
            interfaceType: 'fluid'
          }],
          outputs: [{
            id: 'port-shaft-out',
            name: 'shaft',
            interfaceType: 'mechanical'
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
            interfaceType: 'mechanical'
          }],
          outputs: [{
            id: 'port-shaft-out',
            name: 'shaft_out',
            interfaceType: 'mechanical'
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
            interfaceType: 'mechanical'
          }],
          outputs: [{
            id: 'port-shaft-out',
            name: 'shaft_out',
            interfaceType: 'mechanical'
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
            interfaceType: 'mechanical'
          }],
          outputs: [{
            id: 'port-thrust',
            name: 'thrust',
            interfaceType: 'mechanical'
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
            interfaceType: 'fluid'
          }],
          outputs: [{
            id: 'port-power-out',
            name: 'power',
            interfaceType: 'electrical'
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
            interfaceType: 'fluid'
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
            interfaceType: 'electrical'
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
            interfaceType: 'electrical'
          }],
          outputs: [{
            id: 'port-ac-power-out',
            name: 'ac_power',
            interfaceType: 'electrical'
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
            interfaceType: 'electrical'
          }],
          outputs: [{
            id: 'port-shaft-out',
            name: 'shaft',
            interfaceType: 'mechanical'
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
            interfaceType: 'mechanical'
          }],
          outputs: [{
            id: 'port-shaft-out',
            name: 'shaft_out',
            interfaceType: 'mechanical'
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
            interfaceType: 'mechanical'
          }],
          outputs: [{
            id: 'port-thrust-out',
            name: 'thrust',
            interfaceType: 'mechanical'
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
            interfaceType: 'electrical'
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
            interfaceType: 'electrical'
          }],
          outputs: [{
            id: 'port-shaft-out',
            name: 'shaft',
            interfaceType: 'mechanical'
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
            interfaceType: 'mechanical'
          }],
          outputs: [{
            id: 'port-shaft-out',
            name: 'shaft_out',
            interfaceType: 'mechanical'
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
            interfaceType: 'mechanical'
          }],
          outputs: [{
            id: 'port-thrust-out',
            name: 'thrust',
            interfaceType: 'mechanical'
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
          outputs: [{ id: 'port-y', name: 'y', interfaceType: 'signal' }]
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
          inputs: [{ id: 'port-u', name: 'u', interfaceType: 'signal' }],
          outputs: [
            { id: 'port-y1', name: 'y[1]', interfaceType: 'electrical' },
            { id: 'port-y2', name: 'y[2]', interfaceType: 'electrical' }
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
            { id: 'port-us1', name: 'us[1]', interfaceType: 'electrical' },
            { id: 'port-us2', name: 'us[2]', interfaceType: 'electrical' },
            { id: 'port-w', name: 'w', interfaceType: 'mechanical' },
            { id: 'port-a', name: 'a', interfaceType: 'mechanical' }
          ],
          outputs: [{ id: 'port-tau', name: 'tau', interfaceType: 'mechanical' }]
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
            { id: 'port-tau-in', name: 'tau_in', interfaceType: 'mechanical' },
            { id: 'port-w-out-in', name: 'w_out', interfaceType: 'mechanical' },
            { id: 'port-a-out-in', name: 'a_out', interfaceType: 'mechanical' }
          ],
          outputs: [
            { id: 'port-w-in-out', name: 'w_in', interfaceType: 'mechanical' },
            { id: 'port-tau-out', name: 'tau_out', interfaceType: 'mechanical' },
            { id: 'port-a-in-out', name: 'a_in', interfaceType: 'mechanical' }
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
          inputs: [{ id: 'port-tau', name: 'tau', interfaceType: 'mechanical' }],
          outputs: [
            { id: 'port-w', name: 'w', interfaceType: 'mechanical' },
            { id: 'port-a', name: 'a', interfaceType: 'mechanical' }
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
};

// Keep these for backward compatibility but simplified
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
