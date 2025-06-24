import type { ShipDesign, ShipDesignTemplate } from '../types/shipDesign';

// Helper function to generate unique IDs
const generateId = (prefix: string) => `${prefix}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

// Design 1: Diesel-Electric Cargo Ship
const dieselElectricCargoDesign: ShipDesignTemplate = {
  id: 'diesel-electric-cargo-template',
  type: 'package',
  data: {
    declaredName: 'Diesel-Electric Cargo Ship',
    comment: 'Medium-sized cargo vessel with diesel-electric propulsion',
    metadata: [
      { key: 'IMO_Type', value: 'General Cargo' },
      { key: 'Propulsion', value: 'Diesel-Electric' },
      { key: 'Power_Rating', value: '6MW' }
    ],
    nodes: [
      // Main Engine Package
      {
        id: 'pkg-main-engines',
        type: 'package',
        position: { x: 100, y: 100 },
        data: {
          declaredName: 'Main Engines',
          comment: 'Diesel generator sets',
          id: 'PKG-MAIN-ENG',
          metadata: [],
          nodes: [
            {
              id: 'part-genset-1',
              type: 'part',
              position: { x: 50, y: 50 },
              data: {
                declaredName: 'GenSet 1',
                comment: '2MW Diesel Generator',
                id: 'PRT-GS1',
                metadata: [{ key: 'power', value: '2MW' }],
                nodes: [],
                edges: [],
                inputs: [],
                outputs: [{
                  id: 'port-power-1',
                  name: 'power',
                  interfaceType: 'electrical'
                }]
              }
            },
            {
              id: 'part-genset-2',
              type: 'part',
              position: { x: 200, y: 50 },
              data: {
                declaredName: 'GenSet 2',
                comment: '2MW Diesel Generator',
                id: 'PRT-GS2',
                metadata: [{ key: 'power', value: '2MW' }],
                nodes: [],
                edges: [],
                inputs: [],
                outputs: [{
                  id: 'port-power-2',
                  name: 'power',
                  interfaceType: 'electrical'
                }]
              }
            },
            {
              id: 'part-genset-3',
              type: 'part',
              position: { x: 350, y: 50 },
              data: {
                declaredName: 'GenSet 3',
                comment: '2MW Diesel Generator',
                id: 'PRT-GS3',
                metadata: [{ key: 'power', value: '2MW' }],
                nodes: [],
                edges: [],
                inputs: [],
                outputs: [{
                  id: 'port-power-3',
                  name: 'power',
                  interfaceType: 'electrical'
                }]
              }
            }
          ],
          edges: [],
          inputs: [],
          outputs: [
            {
              id: 'pkg-power-out',
              name: 'power',
              interfaceType: 'electrical'
            }
          ]
        }
      },
      // Power Distribution
      {
        id: 'pkg-power-dist',
        type: 'package',
        position: { x: 100, y: 300 },
        data: {
          declaredName: 'Power Distribution',
          comment: 'Main switchboard and distribution',
          id: 'PKG-PWR-DIST',
          metadata: [],
          nodes: [
            {
              id: 'part-main-swbd',
              type: 'part',
              position: { x: 150, y: 50 },
              data: {
                declaredName: 'Main Switchboard',
                comment: '6.6kV Main Bus',
                id: 'PRT-SWBD',
                metadata: [{ key: 'voltage', value: '6.6kV' }],
                nodes: [],
                edges: [],
                inputs: [{
                  id: 'port-power-in',
                  name: 'power',
                  interfaceType: 'electrical'
                }],
                outputs: [
                  {
                    id: 'port-propulsion-out',
                    name: 'propulsion',
                    interfaceType: 'electrical'
                  },
                  {
                    id: 'port-auxiliary-out',
                    name: 'auxiliary',
                    interfaceType: 'electrical'
                  }
                ]
              }
            }
          ],
          edges: [],
          inputs: [{
            id: 'pkg-power-in',
            name: 'power',
            interfaceType: 'electrical'
          }],
          outputs: [
            {
              id: 'pkg-prop-power',
              name: 'propulsion',
              interfaceType: 'electrical'
            },
            {
              id: 'pkg-aux-power',
              name: 'auxiliary',
              interfaceType: 'electrical'
            }
          ]
        }
      },
      // Propulsion System
      {
        id: 'pkg-propulsion',
        type: 'package',
        position: { x: 400, y: 200 },
        data: {
          declaredName: 'Propulsion System',
          comment: 'Electric propulsion motors and drives',
          id: 'PKG-PROP',
          metadata: [],
          nodes: [
            {
              id: 'part-prop-motor',
              type: 'part',
              position: { x: 100, y: 50 },
              data: {
                declaredName: 'Propulsion Motor',
                comment: '4MW Electric Motor',
                id: 'PRT-PROP-MTR',
                metadata: [{ key: 'power', value: '4MW' }],
                nodes: [],
                edges: [],
                inputs: [{
                  id: 'port-elec-in',
                  name: 'power',
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
              id: 'part-propeller',
              type: 'part',
              position: { x: 300, y: 50 },
              data: {
                declaredName: 'Propeller',
                comment: 'Fixed Pitch Propeller',
                id: 'PRT-PROP',
                metadata: [{ key: 'diameter', value: '5m' }],
                nodes: [],
                edges: [],
                inputs: [{
                  id: 'port-shaft-in',
                  name: 'shaft',
                  interfaceType: 'mechanical'
                }],
                outputs: []
              }
            }
          ],
          edges: [
            {
              id: 'edge-motor-to-prop',
              source: 'part-prop-motor',
              target: 'part-propeller',
              sourceHandle: 'part-prop-motor-output-shaft',
              targetHandle: 'part-propeller-input-shaft',
              type: 'default',
              data: { compatibility: 'direct' }
            }
          ],
          inputs: [{
            id: 'pkg-prop-power-in',
            name: 'power',
            interfaceType: 'electrical'
          }],
          outputs: []
        }
      },
      // Auxiliary Systems
      {
        id: 'pkg-auxiliary',
        type: 'package',
        position: { x: 100, y: 500 },
        data: {
          declaredName: 'Auxiliary Systems',
          comment: 'Ship service systems',
          id: 'PKG-AUX',
          metadata: [],
          nodes: [
            {
              id: 'part-hvac',
              type: 'part',
              position: { x: 50, y: 50 },
              data: {
                declaredName: 'HVAC System',
                comment: 'Heating, Ventilation, AC',
                id: 'PRT-HVAC',
                metadata: [],
                nodes: [],
                edges: [],
                inputs: [{
                  id: 'port-hvac-power',
                  name: 'power',
                  interfaceType: 'electrical'
                }],
                outputs: []
              }
            },
            {
              id: 'part-lighting',
              type: 'part',
              position: { x: 200, y: 50 },
              data: {
                declaredName: 'Lighting System',
                comment: 'Ship lighting',
                id: 'PRT-LIGHT',
                metadata: [],
                nodes: [],
                edges: [],
                inputs: [{
                  id: 'port-light-power',
                  name: 'power',
                  interfaceType: 'electrical'
                }],
                outputs: []
              }
            }
          ],
          edges: [],
          inputs: [{
            id: 'pkg-aux-power-in',
            name: 'power',
            interfaceType: 'electrical'
          }],
          outputs: []
        }
      }
    ],
    edges: [
      // Connect generators to main switchboard
      {
        id: 'edge-gen-to-swbd',
        source: 'pkg-main-engines',
        target: 'pkg-power-dist',
        sourceHandle: 'pkg-main-engines-output-power',
        targetHandle: 'pkg-power-dist-input-power',
        type: 'default',
        data: { compatibility: 'direct' }
      },
      // Connect switchboard to propulsion
      {
        id: 'edge-swbd-to-prop',
        source: 'pkg-power-dist',
        target: 'pkg-propulsion',
        sourceHandle: 'pkg-power-dist-output-propulsion',
        targetHandle: 'pkg-propulsion-input-power',
        type: 'default',
        data: { compatibility: 'direct' }
      },
      // Connect switchboard to auxiliary
      {
        id: 'edge-swbd-to-aux',
        source: 'pkg-power-dist',
        target: 'pkg-auxiliary',
        sourceHandle: 'pkg-power-dist-output-auxiliary',
        targetHandle: 'pkg-auxiliary-input-power',
        type: 'default',
        data: { compatibility: 'direct' }
      }
    ]
  }
};

export const dieselElectricCargo: ShipDesign = {
  id: 'diesel-electric-cargo',
  name: 'Diesel-Electric Cargo Ship',
  description: 'Efficient medium-sized cargo vessel with diesel-electric propulsion system',
  shipType: 'cargo',
  powertrainType: 'diesel-electric',
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
      total: 6000,
      propulsion: 4000,
      auxiliary: 2000
    },
    fuelCapacity: 800,
    range: 5000,
    crew: 20
  },
  tags: ['cargo', 'diesel-electric', 'medium-size', 'efficient'],
  template: dieselElectricCargoDesign
};

// Design 2: Electric Ferry
const electricFerryDesign: ShipDesignTemplate = {
  id: 'electric-ferry-template',
  type: 'package',
  data: {
    declaredName: 'Full Electric Ferry',
    comment: 'Battery-powered passenger ferry for short routes',
    metadata: [
      { key: 'IMO_Type', value: 'Passenger Ferry' },
      { key: 'Propulsion', value: 'Full Electric' },
      { key: 'Power_Source', value: 'Battery' }
    ],
    nodes: [
      // Battery System
      {
        id: 'pkg-battery',
        type: 'package',
        position: { x: 100, y: 200 },
        data: {
          declaredName: 'Battery System',
          comment: 'Main battery banks',
          id: 'PKG-BATT',
          metadata: [{ key: 'capacity', value: '2MWh' }],
          nodes: [
            {
              id: 'part-battery-1',
              type: 'part',
              position: { x: 50, y: 50 },
              data: {
                declaredName: 'Battery Bank 1',
                comment: '1MWh Li-ion',
                id: 'PRT-BATT1',
                metadata: [],
                nodes: [],
                edges: [],
                inputs: [{
                  id: 'port-charge-1',
                  name: 'charge',
                  interfaceType: 'electrical'
                }],
                outputs: [{
                  id: 'port-dc-out-1',
                  name: 'dc_power',
                  interfaceType: 'electrical'
                }]
              }
            },
            {
              id: 'part-battery-2',
              type: 'part',
              position: { x: 200, y: 50 },
              data: {
                declaredName: 'Battery Bank 2',
                comment: '1MWh Li-ion',
                id: 'PRT-BATT2',
                metadata: [],
                nodes: [],
                edges: [],
                inputs: [{
                  id: 'port-charge-2',
                  name: 'charge',
                  interfaceType: 'electrical'
                }],
                outputs: [{
                  id: 'port-dc-out-2',
                  name: 'dc_power',
                  interfaceType: 'electrical'
                }]
              }
            }
          ],
          edges: [],
          inputs: [{
            id: 'pkg-charge-in',
            name: 'shore_power',
            interfaceType: 'electrical'
          }],
          outputs: [{
            id: 'pkg-dc-power',
            name: 'dc_power',
            interfaceType: 'electrical'
          }]
        }
      },
      // Power Conversion
      {
        id: 'pkg-power-conv',
        type: 'package',
        position: { x: 100, y: 400 },
        data: {
          declaredName: 'Power Conversion',
          comment: 'DC/AC converters',
          id: 'PKG-CONV',
          metadata: [],
          nodes: [
            {
              id: 'part-inverter',
              type: 'part',
              position: { x: 100, y: 50 },
              data: {
                declaredName: 'Main Inverter',
                comment: 'DC to AC conversion',
                id: 'PRT-INV',
                metadata: [],
                nodes: [],
                edges: [],
                inputs: [{
                  id: 'port-dc-in',
                  name: 'dc_power',
                  interfaceType: 'electrical'
                }],
                outputs: [{
                  id: 'port-ac-out',
                  name: 'ac_power',
                  interfaceType: 'electrical'
                }]
              }
            }
          ],
          edges: [],
          inputs: [{
            id: 'pkg-dc-in',
            name: 'dc_power',
            interfaceType: 'electrical'
          }],
          outputs: [{
            id: 'pkg-ac-out',
            name: 'ac_power',
            interfaceType: 'electrical'
          }]
        }
      },
      // Propulsion
      {
        id: 'pkg-e-propulsion',
        type: 'package',
        position: { x: 400, y: 300 },
        data: {
          declaredName: 'Electric Propulsion',
          comment: 'Azimuth thrusters',
          id: 'PKG-E-PROP',
          metadata: [],
          nodes: [
            {
              id: 'part-azimuth-1',
              type: 'part',
              position: { x: 50, y: 50 },
              data: {
                declaredName: 'Azimuth Thruster 1',
                comment: '800kW Azimuth',
                id: 'PRT-AZI1',
                metadata: [],
                nodes: [],
                edges: [],
                inputs: [{
                  id: 'port-power-azi1',
                  name: 'power',
                  interfaceType: 'electrical'
                }],
                outputs: []
              }
            },
            {
              id: 'part-azimuth-2',
              type: 'part',
              position: { x: 200, y: 50 },
              data: {
                declaredName: 'Azimuth Thruster 2',
                comment: '800kW Azimuth',
                id: 'PRT-AZI2',
                metadata: [],
                nodes: [],
                edges: [],
                inputs: [{
                  id: 'port-power-azi2',
                  name: 'power',
                  interfaceType: 'electrical'
                }],
                outputs: []
              }
            }
          ],
          edges: [],
          inputs: [{
            id: 'pkg-prop-in',
            name: 'power',
            interfaceType: 'electrical'
          }],
          outputs: []
        }
      }
    ],
    edges: [
      {
        id: 'edge-batt-to-conv',
        source: 'pkg-battery',
        target: 'pkg-power-conv',
        sourceHandle: 'pkg-battery-output-dc_power',
        targetHandle: 'pkg-power-conv-input-dc_power',
        type: 'default',
        data: { compatibility: 'direct' }
      },
      {
        id: 'edge-conv-to-prop',
        source: 'pkg-power-conv',
        target: 'pkg-e-propulsion',
        sourceHandle: 'pkg-power-conv-output-ac_power',
        targetHandle: 'pkg-e-propulsion-input-power',
        type: 'default',
        data: { compatibility: 'direct' }
      }
    ]
  }
};

export const electricFerry: ShipDesign = {
  id: 'electric-ferry',
  name: 'Full Electric Ferry',
  description: 'Zero-emission battery-powered ferry for urban waterways',
  shipType: 'ferry',
  powertrainType: 'fully-electric',
  specifications: {
    length: 40,
    beam: 12,
    draft: 2.5,
    displacement: 200,
    speed: {
      cruise: 10,
      max: 12
    },
    power: {
      total: 1600,
      propulsion: 1600,
      auxiliary: 200
    },
    range: 50,
    crew: 4,
    passengers: 200
  },
  tags: ['ferry', 'electric', 'zero-emission', 'urban', 'passenger'],
  template: electricFerryDesign
};

// Design 3: LNG-Powered Container Ship
const lngContainerDesign: ShipDesignTemplate = {
  id: 'lng-container-template',
  type: 'package',
  data: {
    declaredName: 'LNG-Powered Container Ship',
    comment: 'Large container vessel with dual-fuel LNG propulsion',
    metadata: [
      { key: 'IMO_Type', value: 'Container Ship' },
      { key: 'Propulsion', value: 'LNG Dual-Fuel' },
      { key: 'TEU_Capacity', value: '8000' }
    ],
    nodes: [
      // Main Engine
      {
        id: 'pkg-main-engine',
        type: 'package',
        position: { x: 200, y: 200 },
        data: {
          declaredName: 'Main Engine',
          comment: 'Dual-fuel main engine',
          id: 'PKG-ME',
          metadata: [{ key: 'type', value: 'MAN B&W ME-GI' }],
          nodes: [
            {
              id: 'part-dual-fuel-engine',
              type: 'part',
              position: { x: 100, y: 50 },
              data: {
                declaredName: 'Dual-Fuel Engine',
                comment: '25MW 2-stroke',
                id: 'PRT-DF-ENG',
                metadata: [],
                nodes: [],
                edges: [],
                inputs: [
                  {
                    id: 'port-lng-in',
                    name: 'lng_fuel',
                    interfaceType: 'fluid'
                  },
                  {
                    id: 'port-mdo-in',
                    name: 'mdo_fuel',
                    interfaceType: 'fluid'
                  }
                ],
                outputs: [{
                  id: 'port-mech-out',
                  name: 'mechanical',
                  interfaceType: 'mechanical'
                }]
              }
            }
          ],
          edges: [],
          inputs: [
            {
              id: 'pkg-lng-fuel',
              name: 'lng',
              interfaceType: 'fluid'
            },
            {
              id: 'pkg-mdo-fuel',
              name: 'mdo',
              interfaceType: 'fluid'
            }
          ],
          outputs: [{
            id: 'pkg-mech-power',
            name: 'mechanical',
            interfaceType: 'mechanical'
          }]
        }
      },
      // LNG Fuel System
      {
        id: 'pkg-lng-system',
        type: 'package',
        position: { x: 100, y: 50 },
        data: {
          declaredName: 'LNG Fuel System',
          comment: 'LNG storage and supply',
          id: 'PKG-LNG',
          metadata: [],
          nodes: [
            {
              id: 'part-lng-tank',
              type: 'part',
              position: { x: 50, y: 50 },
              data: {
                declaredName: 'LNG Tank',
                comment: 'Type C tank 1000m³',
                id: 'PRT-LNG-TNK',
                metadata: [],
                nodes: [],
                edges: [],
                inputs: [],
                outputs: [{
                  id: 'port-lng-out',
                  name: 'lng',
                  interfaceType: 'fluid'
                }]
              }
            },
            {
              id: 'part-gas-supply',
              type: 'part',
              position: { x: 200, y: 50 },
              data: {
                declaredName: 'Gas Supply Unit',
                comment: 'Vaporizer and heater',
                id: 'PRT-GSU',
                metadata: [],
                nodes: [],
                edges: [],
                inputs: [{
                  id: 'port-lng-liquid',
                  name: 'lng_liquid',
                  interfaceType: 'fluid'
                }],
                outputs: [{
                  id: 'port-lng-gas',
                  name: 'lng_gas',
                  interfaceType: 'fluid'
                }]
              }
            }
          ],
          edges: [
            {
              id: 'edge-tank-to-gsu',
              source: 'part-lng-tank',
              target: 'part-gas-supply',
              sourceHandle: 'part-lng-tank-output-lng',
              targetHandle: 'part-gas-supply-input-lng_liquid',
              type: 'default',
              data: { compatibility: 'direct' }
            }
          ],
          inputs: [],
          outputs: [{
            id: 'pkg-lng-out',
            name: 'lng_fuel',
            interfaceType: 'fluid'
          }]
        }
      },
      // Propulsion Train
      {
        id: 'pkg-prop-train',
        type: 'package',
        position: { x: 400, y: 200 },
        data: {
          declaredName: 'Propulsion Train',
          comment: 'Shafting and propeller',
          id: 'PKG-PROP-TRN',
          metadata: [],
          nodes: [
            {
              id: 'part-shafting',
              type: 'part',
              position: { x: 50, y: 50 },
              data: {
                declaredName: 'Shafting',
                comment: 'Main propeller shaft',
                id: 'PRT-SHAFT',
                metadata: [],
                nodes: [],
                edges: [],
                inputs: [{
                  id: 'port-shaft-in',
                  name: 'mechanical',
                  interfaceType: 'mechanical'
                }],
                outputs: [{
                  id: 'port-shaft-out',
                  name: 'rotation',
                  interfaceType: 'mechanical'
                }]
              }
            },
            {
              id: 'part-cpp',
              type: 'part',
              position: { x: 200, y: 50 },
              data: {
                declaredName: 'CPP',
                comment: 'Controllable Pitch Propeller',
                id: 'PRT-CPP',
                metadata: [{ key: 'diameter', value: '8m' }],
                nodes: [],
                edges: [],
                inputs: [{
                  id: 'port-cpp-in',
                  name: 'rotation',
                  interfaceType: 'mechanical'
                }],
                outputs: []
              }
            }
          ],
          edges: [
            {
              id: 'edge-shaft-to-cpp',
              source: 'part-shafting',
              target: 'part-cpp',
              sourceHandle: 'part-shafting-output-rotation',
              targetHandle: 'part-cpp-input-rotation',
              type: 'default',
              data: { compatibility: 'direct' }
            }
          ],
          inputs: [{
            id: 'pkg-mech-in',
            name: 'mechanical',
            interfaceType: 'mechanical'
          }],
          outputs: []
        }
      },
      // Auxiliary Generators
      {
        id: 'pkg-aux-gen',
        type: 'package',
        position: { x: 100, y: 400 },
        data: {
          declaredName: 'Auxiliary Generators',
          comment: 'Ship service power',
          id: 'PKG-AUX-GEN',
          metadata: [],
          nodes: [
            {
              id: 'part-aux-gen-1',
              type: 'part',
              position: { x: 50, y: 50 },
              data: {
                declaredName: 'Aux Gen 1',
                comment: '3MW Dual-fuel',
                id: 'PRT-AUX1',
                metadata: [],
                nodes: [],
                edges: [],
                inputs: [{
                  id: 'port-fuel-aux1',
                  name: 'fuel',
                  interfaceType: 'fluid'
                }],
                outputs: [{
                  id: 'port-power-aux1',
                  name: 'power',
                  interfaceType: 'electrical'
                }]
              }
            },
            {
              id: 'part-aux-gen-2',
              type: 'part',
              position: { x: 200, y: 50 },
              data: {
                declaredName: 'Aux Gen 2',
                comment: '3MW Dual-fuel',
                id: 'PRT-AUX2',
                metadata: [],
                nodes: [],
                edges: [],
                inputs: [{
                  id: 'port-fuel-aux2',
                  name: 'fuel',
                  interfaceType: 'fluid'
                }],
                outputs: [{
                  id: 'port-power-aux2',
                  name: 'power',
                  interfaceType: 'electrical'
                }]
              }
            }
          ],
          edges: [],
          inputs: [{
            id: 'pkg-fuel-aux',
            name: 'fuel',
            interfaceType: 'fluid'
          }],
          outputs: [{
            id: 'pkg-aux-power',
            name: 'power',
            interfaceType: 'electrical'
          }]
        }
      }
    ],
    edges: [
      {
        id: 'edge-lng-to-main',
        source: 'pkg-lng-system',
        target: 'pkg-main-engine',
        sourceHandle: 'pkg-lng-system-output-lng_fuel',
        targetHandle: 'pkg-main-engine-input-lng',
        type: 'default',
        data: { compatibility: 'direct' }
      },
      {
        id: 'edge-main-to-prop',
        source: 'pkg-main-engine',
        target: 'pkg-prop-train',
        sourceHandle: 'pkg-main-engine-output-mechanical',
        targetHandle: 'pkg-prop-train-input-mechanical',
        type: 'default',
        data: { compatibility: 'direct' }
      },
      {
        id: 'edge-lng-to-aux',
        source: 'pkg-lng-system',
        target: 'pkg-aux-gen',
        sourceHandle: 'pkg-lng-system-output-lng_fuel',
        targetHandle: 'pkg-aux-gen-input-fuel',
        type: 'default',
        data: { compatibility: 'direct' }
      }
    ]
  }
};

export const lngContainer: ShipDesign = {
  id: 'lng-container',
  name: 'LNG-Powered Container Ship',
  description: 'Large container vessel with environmentally friendly LNG propulsion',
  shipType: 'container',
  powertrainType: 'lng-powered',
  specifications: {
    length: 300,
    beam: 48,
    draft: 14.5,
    displacement: 80000,
    speed: {
      cruise: 19,
      max: 23
    },
    power: {
      total: 31000,
      propulsion: 25000,
      auxiliary: 6000
    },
    fuelCapacity: 3000,
    range: 14000,
    crew: 25
  },
  tags: ['container', 'lng', 'large', 'eco-friendly', 'dual-fuel'],
  template: lngContainerDesign
};

// Design 4: Luxury Cruise Ship (Diesel-Electric)
const cruiseShipDesign: ShipDesignTemplate = {
  id: 'cruise-ship-template',
  type: 'package',
  data: {
    declaredName: 'Luxury Cruise Ship',
    comment: 'Large passenger cruise ship with diesel-electric propulsion',
    metadata: [
      { key: 'IMO_Type', value: 'Passenger Ship' },
      { key: 'Propulsion', value: 'Diesel-Electric' },
      { key: 'Passenger_Capacity', value: '3000' }
    ],
    nodes: [
      // Power Generation
      {
        id: 'pkg-power-gen',
        type: 'package',
        position: { x: 100, y: 100 },
        data: {
          declaredName: 'Power Generation',
          comment: 'Main diesel generators',
          id: 'PKG-PWR-GEN',
          metadata: [],
          nodes: [
            {
              id: 'part-dg-1',
              type: 'part',
              position: { x: 50, y: 50 },
              data: {
                declaredName: 'DG 1',
                comment: '16MW Diesel Generator',
                id: 'PRT-DG1',
                metadata: [],
                nodes: [],
                edges: [],
                inputs: [],
                outputs: [{
                  id: 'port-dg1-out',
                  name: 'power',
                  interfaceType: 'electrical'
                }]
              }
            },
            {
              id: 'part-dg-2',
              type: 'part',
              position: { x: 150, y: 50 },
              data: {
                declaredName: 'DG 2',
                comment: '16MW Diesel Generator',
                id: 'PRT-DG2',
                metadata: [],
                nodes: [],
                edges: [],
                inputs: [],
                outputs: [{
                  id: 'port-dg2-out',
                  name: 'power',
                  interfaceType: 'electrical'
                }]
              }
            },
            {
              id: 'part-dg-3',
              type: 'part',
              position: { x: 250, y: 50 },
              data: {
                declaredName: 'DG 3',
                comment: '16MW Diesel Generator',
                id: 'PRT-DG3',
                metadata: [],
                nodes: [],
                edges: [],
                inputs: [],
                outputs: [{
                  id: 'port-dg3-out',
                  name: 'power',
                  interfaceType: 'electrical'
                }]
              }
            },
            {
              id: 'part-dg-4',
              type: 'part',
              position: { x: 350, y: 50 },
              data: {
                declaredName: 'DG 4',
                comment: '16MW Diesel Generator',
                id: 'PRT-DG4',
                metadata: [],
                nodes: [],
                edges: [],
                inputs: [],
                outputs: [{
                  id: 'port-dg4-out',
                  name: 'power',
                  interfaceType: 'electrical'
                }]
              }
            }
          ],
          edges: [],
          inputs: [],
          outputs: [{
            id: 'pkg-total-power',
            name: 'power',
            interfaceType: 'electrical'
          }]
        }
      },
      // Pod Propulsion
      {
        id: 'pkg-pods',
        type: 'package',
        position: { x: 400, y: 200 },
        data: {
          declaredName: 'Azipod Propulsion',
          comment: 'Electric pod drives',
          id: 'PKG-PODS',
          metadata: [],
          nodes: [
            {
              id: 'part-pod-1',
              type: 'part',
              position: { x: 50, y: 50 },
              data: {
                declaredName: 'Azipod 1',
                comment: '20MW Pod Drive',
                id: 'PRT-POD1',
                metadata: [],
                nodes: [],
                edges: [],
                inputs: [{
                  id: 'port-pod1-power',
                  name: 'power',
                  interfaceType: 'electrical'
                }],
                outputs: []
              }
            },
            {
              id: 'part-pod-2',
              type: 'part',
              position: { x: 200, y: 50 },
              data: {
                declaredName: 'Azipod 2',
                comment: '20MW Pod Drive',
                id: 'PRT-POD2',
                metadata: [],
                nodes: [],
                edges: [],
                inputs: [{
                  id: 'port-pod2-power',
                  name: 'power',
                  interfaceType: 'electrical'
                }],
                outputs: []
              }
            }
          ],
          edges: [],
          inputs: [{
            id: 'pkg-pod-power',
            name: 'power',
            interfaceType: 'electrical'
          }],
          outputs: []
        }
      },
      // Hotel Load
      {
        id: 'pkg-hotel',
        type: 'package',
        position: { x: 100, y: 400 },
        data: {
          declaredName: 'Hotel Systems',
          comment: 'Passenger accommodation systems',
          id: 'PKG-HOTEL',
          metadata: [],
          nodes: [
            {
              id: 'part-hvac-hotel',
              type: 'part',
              position: { x: 50, y: 50 },
              data: {
                declaredName: 'HVAC',
                comment: 'Air conditioning system',
                id: 'PRT-HVAC-H',
                metadata: [],
                nodes: [],
                edges: [],
                inputs: [{
                  id: 'port-hvac-power',
                  name: 'power',
                  interfaceType: 'electrical'
                }],
                outputs: []
              }
            },
            {
              id: 'part-galley',
              type: 'part',
              position: { x: 150, y: 50 },
              data: {
                declaredName: 'Galley',
                comment: 'Kitchen equipment',
                id: 'PRT-GALLEY',
                metadata: [],
                nodes: [],
                edges: [],
                inputs: [{
                  id: 'port-galley-power',
                  name: 'power',
                  interfaceType: 'electrical'
                }],
                outputs: []
              }
            },
            {
              id: 'part-entertainment',
              type: 'part',
              position: { x: 250, y: 50 },
              data: {
                declaredName: 'Entertainment',
                comment: 'Theater, casino, etc',
                id: 'PRT-ENT',
                metadata: [],
                nodes: [],
                edges: [],
                inputs: [{
                  id: 'port-ent-power',
                  name: 'power',
                  interfaceType: 'electrical'
                }],
                outputs: []
              }
            }
          ],
          edges: [],
          inputs: [{
            id: 'pkg-hotel-power',
            name: 'power',
            interfaceType: 'electrical'
          }],
          outputs: []
        }
      },
      // Power Management
      {
        id: 'pkg-pms',
        type: 'package',
        position: { x: 250, y: 250 },
        data: {
          declaredName: 'Power Management',
          comment: 'Integrated PMS',
          id: 'PKG-PMS',
          metadata: [],
          nodes: [
            {
              id: 'part-main-bus',
              type: 'part',
              position: { x: 100, y: 50 },
              data: {
                declaredName: 'Main Bus',
                comment: '11kV distribution',
                id: 'PRT-BUS',
                metadata: [],
                nodes: [],
                edges: [],
                inputs: [{
                  id: 'port-bus-in',
                  name: 'power',
                  interfaceType: 'electrical'
                }],
                outputs: [
                  {
                    id: 'port-prop-out',
                    name: 'propulsion',
                    interfaceType: 'electrical'
                  },
                  {
                    id: 'port-hotel-out',
                    name: 'hotel',
                    interfaceType: 'electrical'
                  }
                ]
              }
            }
          ],
          edges: [],
          inputs: [{
            id: 'pkg-pms-in',
            name: 'power',
            interfaceType: 'electrical'
          }],
          outputs: [
            {
              id: 'pkg-pms-prop',
              name: 'propulsion',
              interfaceType: 'electrical'
            },
            {
              id: 'pkg-pms-hotel',
              name: 'hotel',
              interfaceType: 'electrical'
            }
          ]
        }
      }
    ],
    edges: [
      {
        id: 'edge-gen-to-pms',
        source: 'pkg-power-gen',
        target: 'pkg-pms',
        sourceHandle: 'pkg-power-gen-output-power',
        targetHandle: 'pkg-pms-input-power',
        type: 'default',
        data: { compatibility: 'direct' }
      },
      {
        id: 'edge-pms-to-pods',
        source: 'pkg-pms',
        target: 'pkg-pods',
        sourceHandle: 'pkg-pms-output-propulsion',
        targetHandle: 'pkg-pods-input-power',
        type: 'default',
        data: { compatibility: 'direct' }
      },
      {
        id: 'edge-pms-to-hotel',
        source: 'pkg-pms',
        target: 'pkg-hotel',
        sourceHandle: 'pkg-pms-output-hotel',
        targetHandle: 'pkg-hotel-input-power',
        type: 'default',
        data: { compatibility: 'direct' }
      }
    ]
  }
};

export const cruiseShip: ShipDesign = {
  id: 'cruise-ship',
  name: 'Luxury Cruise Ship',
  description: 'Large passenger vessel with advanced diesel-electric propulsion and hotel systems',
  shipType: 'cruise',
  powertrainType: 'diesel-electric',
  specifications: {
    length: 330,
    beam: 40,
    draft: 8.5,
    displacement: 120000,
    speed: {
      cruise: 21,
      max: 24
    },
    power: {
      total: 64000,
      propulsion: 40000,
      auxiliary: 24000
    },
    fuelCapacity: 3500,
    range: 6000,
    crew: 1200,
    passengers: 3000
  },
  tags: ['cruise', 'passenger', 'luxury', 'diesel-electric', 'large'],
  template: cruiseShipDesign
};

// Design 5: Hydrogen Fuel Cell Research Vessel
const hydrogenResearchDesign: ShipDesignTemplate = {
  id: 'hydrogen-research-template',
  type: 'package',
  data: {
    declaredName: 'Hydrogen Research Vessel',
    comment: 'Zero-emission research vessel with fuel cell propulsion',
    metadata: [
      { key: 'IMO_Type', value: 'Research Vessel' },
      { key: 'Propulsion', value: 'Hydrogen Fuel Cell' },
      { key: 'Emission', value: 'Zero' }
    ],
    nodes: [
      // Hydrogen Storage
      {
        id: 'pkg-h2-storage',
        type: 'package',
        position: { x: 100, y: 100 },
        data: {
          declaredName: 'Hydrogen Storage',
          comment: 'Compressed H2 tanks',
          id: 'PKG-H2',
          metadata: [],
          nodes: [
            {
              id: 'part-h2-tank-1',
              type: 'part',
              position: { x: 50, y: 50 },
              data: {
                declaredName: 'H2 Tank 1',
                comment: '350 bar storage',
                id: 'PRT-H2-1',
                metadata: [],
                nodes: [],
                edges: [],
                inputs: [],
                outputs: [{
                  id: 'port-h2-out-1',
                  name: 'hydrogen',
                  interfaceType: 'fluid'
                }]
              }
            },
            {
              id: 'part-h2-tank-2',
              type: 'part',
              position: { x: 200, y: 50 },
              data: {
                declaredName: 'H2 Tank 2',
                comment: '350 bar storage',
                id: 'PRT-H2-2',
                metadata: [],
                nodes: [],
                edges: [],
                inputs: [],
                outputs: [{
                  id: 'port-h2-out-2',
                  name: 'hydrogen',
                  interfaceType: 'fluid'
                }]
              }
            }
          ],
          edges: [],
          inputs: [],
          outputs: [{
            id: 'pkg-h2-supply',
            name: 'hydrogen',
            interfaceType: 'fluid'
          }]
        }
      },
      // Fuel Cell System
      {
        id: 'pkg-fuel-cells',
        type: 'package',
        position: { x: 250, y: 200 },
        data: {
          declaredName: 'Fuel Cell System',
          comment: 'PEM fuel cells',
          id: 'PKG-FC',
          metadata: [],
          nodes: [
            {
              id: 'part-fc-stack-1',
              type: 'part',
              position: { x: 50, y: 50 },
              data: {
                declaredName: 'FC Stack 1',
                comment: '500kW PEM',
                id: 'PRT-FC1',
                metadata: [],
                nodes: [],
                edges: [],
                inputs: [{
                  id: 'port-h2-fc1',
                  name: 'hydrogen',
                  interfaceType: 'fluid'
                }],
                outputs: [{
                  id: 'port-dc-fc1',
                  name: 'dc_power',
                  interfaceType: 'electrical'
                }]
              }
            },
            {
              id: 'part-fc-stack-2',
              type: 'part',
              position: { x: 200, y: 50 },
              data: {
                declaredName: 'FC Stack 2',
                comment: '500kW PEM',
                id: 'PRT-FC2',
                metadata: [],
                nodes: [],
                edges: [],
                inputs: [{
                  id: 'port-h2-fc2',
                  name: 'hydrogen',
                  interfaceType: 'fluid'
                }],
                outputs: [{
                  id: 'port-dc-fc2',
                  name: 'dc_power',
                  interfaceType: 'electrical'
                }]
              }
            }
          ],
          edges: [],
          inputs: [{
            id: 'pkg-fc-h2',
            name: 'hydrogen',
            interfaceType: 'fluid'
          }],
          outputs: [{
            id: 'pkg-fc-power',
            name: 'dc_power',
            interfaceType: 'electrical'
          }]
        }
      },
      // Electric Propulsion
      {
        id: 'pkg-e-drive',
        type: 'package',
        position: { x: 400, y: 300 },
        data: {
          declaredName: 'Electric Drive',
          comment: 'Propulsion motors',
          id: 'PKG-E-DRV',
          metadata: [],
          nodes: [
            {
              id: 'part-prop-motor',
              type: 'part',
              position: { x: 100, y: 50 },
              data: {
                declaredName: 'Propulsion Motor',
                comment: '800kW PM motor',
                id: 'PRT-PMTR',
                metadata: [],
                nodes: [],
                edges: [],
                inputs: [{
                  id: 'port-motor-power',
                  name: 'power',
                  interfaceType: 'electrical'
                }],
                outputs: [{
                  id: 'port-shaft-out',
                  name: 'shaft',
                  interfaceType: 'mechanical'
                }]
              }
            }
          ],
          edges: [],
          inputs: [{
            id: 'pkg-drive-power',
            name: 'power',
            interfaceType: 'electrical'
          }],
          outputs: []
        }
      },
      // Research Equipment
      {
        id: 'pkg-research',
        type: 'package',
        position: { x: 100, y: 400 },
        data: {
          declaredName: 'Research Equipment',
          comment: 'Scientific instruments',
          id: 'PKG-RES',
          metadata: [],
          nodes: [
            {
              id: 'part-lab',
              type: 'part',
              position: { x: 100, y: 50 },
              data: {
                declaredName: 'Laboratory',
                comment: 'Research lab systems',
                id: 'PRT-LAB',
                metadata: [],
                nodes: [],
                edges: [],
                inputs: [{
                  id: 'port-lab-power',
                  name: 'power',
                  interfaceType: 'electrical'
                }],
                outputs: []
              }
            }
          ],
          edges: [],
          inputs: [{
            id: 'pkg-res-power',
            name: 'power',
            interfaceType: 'electrical'
          }],
          outputs: []
        }
      }
    ],
    edges: [
      {
        id: 'edge-h2-to-fc',
        source: 'pkg-h2-storage',
        target: 'pkg-fuel-cells',
        sourceHandle: 'pkg-h2-storage-output-hydrogen',
        targetHandle: 'pkg-fuel-cells-input-hydrogen',
        type: 'default',
        data: { compatibility: 'direct' }
      },
      {
        id: 'edge-fc-to-drive',
        source: 'pkg-fuel-cells',
        target: 'pkg-e-drive',
        sourceHandle: 'pkg-fuel-cells-output-dc_power',
        targetHandle: 'pkg-e-drive-input-power',
        type: 'default',
        data: { compatibility: 'converter', converterType: 'DC/AC' }
      },
      {
        id: 'edge-fc-to-res',
        source: 'pkg-fuel-cells',
        target: 'pkg-research',
        sourceHandle: 'pkg-fuel-cells-output-dc_power',
        targetHandle: 'pkg-research-input-power',
        type: 'default',
        data: { compatibility: 'converter', converterType: 'DC/AC' }
      }
    ]
  }
};

export const hydrogenResearch: ShipDesign = {
  id: 'hydrogen-research',
  name: 'Hydrogen Fuel Cell Research Vessel',
  description: 'Zero-emission research vessel powered by hydrogen fuel cells',
  shipType: 'research',
  powertrainType: 'hydrogen-fuel-cell',
  specifications: {
    length: 60,
    beam: 14,
    draft: 4.5,
    displacement: 1500,
    speed: {
      cruise: 12,
      max: 14
    },
    power: {
      total: 1200,
      propulsion: 800,
      auxiliary: 400
    },
    range: 500,
    crew: 15
  },
  tags: ['research', 'hydrogen', 'fuel-cell', 'zero-emission', 'innovative'],
  template: hydrogenResearchDesign
};

// Export all ship designs
export const shipDesigns: ShipDesign[] = [
  dieselElectricCargo,
  electricFerry,
  lngContainer,
  cruiseShip,
  hydrogenResearch
];

// Export categorized designs
export const shipDesignCategories = [
  {
    id: 'commercial',
    name: 'Commercial Vessels',
    designs: [dieselElectricCargo, lngContainer]
  },
  {
    id: 'passenger',
    name: 'Passenger Vessels',
    designs: [electricFerry, cruiseShip]
  },
  {
    id: 'specialized',
    name: 'Specialized Vessels',
    designs: [hydrogenResearch]
  }
];