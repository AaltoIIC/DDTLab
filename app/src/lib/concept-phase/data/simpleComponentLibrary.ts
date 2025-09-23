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