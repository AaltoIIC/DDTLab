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

// Minimal three-component drivetrain for the OpenTorsion demo
export const motorShaftPropellerDemo: SimpleComponent = {
  id: 'motor-shaft-propeller-demo',
  name: 'Simple Electric Propulsion Train',
  type: 'package',
  data: {
    declaredName: 'Simple Electric Propulsion Train',
    comment: 'Three-component motor, shaft, and propeller model for torsional vibration analysis',
    id: 'PKG-MOTOR-SHAFT-PROP-DEMO',
    metadata: [
      { key: 'caseStudy', value: 'Motor Shaft Propeller Demo' },
      { key: 'analysisType', value: 'torsional_vibration' },
      { key: 'modelForm', value: 'motor_inertia-shaft_stiffness-propeller_inertia' }
    ],
    nodes: [
      {
        id: 'part-permanent-magnet-motor',
        type: 'part',
        position: { x: 100, y: 120 },
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
        position: { x: 380, y: 120 },
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
        position: { x: 660, y: 120 },
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
