import type { ShipDesign, ShipDesignTemplate } from '../types/shipDesign';

// Simple Commercial Vessel Design
const commercialVesselDesign: ShipDesignTemplate = {
  id: 'commercial-vessel-template',
  type: 'package',
  data: {
    declaredName: 'Commercial Vessel',
    comment: 'Standard commercial vessel with diesel propulsion',
    metadata: [
      { key: 'vesselType', value: 'Commercial' },
      { key: 'propulsion', value: 'Diesel-Mechanical' }
    ],
    nodes: [
      // Main Engine - shifted right
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
            interfaceType: 'fluid'
          }],
          outputs: [{
            id: 'port-shaft-out',
            name: 'shaft',
            interfaceType: 'mechanical'
          }]
        }
      },
      // Gearbox - shifted right
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
            interfaceType: 'mechanical'
          }],
          outputs: [{
            id: 'port-shaft-out',
            name: 'shaft_out',
            interfaceType: 'mechanical'
          }]
        }
      },
      // Propeller - shifted right
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
            interfaceType: 'mechanical'
          }],
          outputs: []
        }
      },
      // Generator - shifted right and down
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
            interfaceType: 'fluid'
          }],
          outputs: [{
            id: 'port-power-out',
            name: 'power',
            interfaceType: 'electrical'
          }]
        }
      },
      // Fuel Tank - moved far left
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
      // Gearbox to propeller
      {
        id: 'edge-gearbox-propeller',
        source: 'part-gearbox',
        target: 'part-propeller',
        sourceHandle: 'part-gearbox-output-shaft_out',
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
    speed: {
      cruise: 14,
      max: 16
    },
    power: {
      total: 3000,
      propulsion: 2500,
      auxiliary: 500
    },
    fuelCapacity: 50000,
    range: 5000,
    crew: 20
  },
  tags: ['commercial', 'diesel', 'cargo', 'standard'],
  template: commercialVesselDesign
};

// Export all ship designs (just one for now)
export const shipDesigns: ShipDesign[] = [
  commercialVessel
];

// Export categorized designs
export const shipDesignCategories = [
  {
    id: 'commercial',
    name: 'Commercial Vessels',
    designs: [commercialVessel]
  }
];