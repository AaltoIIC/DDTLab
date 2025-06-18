// Simple component library with working examples

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

// Component 1: Engine with connections at part level
export const engineComponent: SimpleComponent = {
  id: 'engine-component',
  name: 'Engine System',
  type: 'package',
  data: {
    declaredName: 'Engine System',
    comment: 'Engine with internal connections between parts',
    id: 'PKG-ENGINE',
    metadata: [
      { key: 'power', value: '1000kW' },
      { key: 'manufacturer', value: 'Generic' }
    ],
    nodes: [
      // Part 1: Engine Core with internal connections
      {
        id: 'part-engine-core',
        type: 'part',
        position: { x: 100, y: 100 },
        data: {
          declaredName: 'Engine Core',
          comment: 'Main engine block with internal flow',
          id: 'PRT-CORE',
          metadata: [],
          nodes: [
            {
              id: 'item-fuel-input',
              type: 'item',
              position: { x: 50, y: 50 },
              data: {
                declaredName: 'Fuel Input',
                comment: '',
                id: 'ITM-FUEL',
                metadata: [],
                inputs: [{
                  id: 'port-fuel-in',
                  name: 'fuel',
                  interfaceType: 'fluid'
                }],
                outputs: [{
                  id: 'port-fuel-out',
                  name: 'fuel',
                  interfaceType: 'fluid'
                }]
              }
            },
            {
              id: 'item-combustion',
              type: 'item',
              position: { x: 200, y: 100 },
              data: {
                declaredName: 'Combustion Chamber',
                comment: '',
                id: 'ITM-COMBUST',
                metadata: [],
                inputs: [{
                  id: 'port-fuel-chamber',
                  name: 'fuel',
                  interfaceType: 'fluid'
                }],
                outputs: [{
                  id: 'port-power-internal',
                  name: 'power',
                  interfaceType: 'mechanical'
                }]
              }
            },
            {
              id: 'item-power-output',
              type: 'item',
              position: { x: 350, y: 50 },
              data: {
                declaredName: 'Power Output',
                comment: '',
                id: 'ITM-POWER',
                metadata: [],
                inputs: [{
                  id: 'port-power-in',
                  name: 'power',
                  interfaceType: 'mechanical'
                }],
                outputs: [{
                  id: 'port-power-out',
                  name: 'power',
                  interfaceType: 'mechanical'
                }]
              }
            }
          ],
          // Connections within Engine Core part
          edges: [
            {
              id: 'edge-fuel-to-combustion',
              source: 'item-fuel-input',
              target: 'item-combustion',
              sourceHandle: 'item-fuel-input-output-fuel',
              targetHandle: 'item-combustion-input-fuel',
              type: 'default',
              data: { compatibility: 'direct' }
            },
            {
              id: 'edge-combustion-to-power',
              source: 'item-combustion',
              target: 'item-power-output',
              sourceHandle: 'item-combustion-output-power',
              targetHandle: 'item-power-output-input-power',
              type: 'default',
              data: { compatibility: 'direct' }
            }
          ],
          inputs: [],
          outputs: [{
            id: 'part-power-out',
            name: 'power',
            interfaceType: 'mechanical'
          }]
        }
      },
      // Part 2: Control Unit with internal routing
      {
        id: 'part-control-unit',
        type: 'part',
        position: { x: 400, y: 100 },
        data: {
          declaredName: 'Control Unit',
          comment: 'Engine control system',
          id: 'PRT-CONTROL',
          metadata: [],
          nodes: [
            {
              id: 'item-sensor-input',
              type: 'item',
              position: { x: 50, y: 50 },
              data: {
                declaredName: 'Sensor Input',
                comment: '',
                id: 'ITM-SENSOR',
                metadata: [],
                inputs: [{
                  id: 'port-sensor',
                  name: 'sensor',
                  interfaceType: 'data'
                }],
                outputs: [{
                  id: 'port-data-out',
                  name: 'data',
                  interfaceType: 'data'
                }]
              }
            },
            {
              id: 'item-processor',
              type: 'item',
              position: { x: 200, y: 100 },
              data: {
                declaredName: 'Processor',
                comment: '',
                id: 'ITM-PROC',
                metadata: [],
                inputs: [{
                  id: 'port-data-in',
                  name: 'data',
                  interfaceType: 'data'
                }],
                outputs: [{
                  id: 'port-control-out',
                  name: 'control',
                  interfaceType: 'data'
                }]
              }
            },
            {
              id: 'item-control-output',
              type: 'item',
              position: { x: 350, y: 50 },
              data: {
                declaredName: 'Control Output',
                comment: '',
                id: 'ITM-CTRL-OUT',
                metadata: [],
                inputs: [{
                  id: 'port-control-in',
                  name: 'control',
                  interfaceType: 'data'
                }],
                outputs: [{
                  id: 'port-signal-out',
                  name: 'signal',
                  interfaceType: 'data'
                }]
              }
            }
          ],
          // Connections within Control Unit
          edges: [
            {
              id: 'edge-sensor-to-proc',
              source: 'item-sensor-input',
              target: 'item-processor',
              sourceHandle: 'item-sensor-input-output-data',
              targetHandle: 'item-processor-input-data',
              type: 'default',
              data: { compatibility: 'direct' }
            },
            {
              id: 'edge-proc-to-output',
              source: 'item-processor',
              target: 'item-control-output',
              sourceHandle: 'item-processor-output-control',
              targetHandle: 'item-control-output-input-control',
              type: 'default',
              data: { compatibility: 'direct' }
            }
          ],
          inputs: [{
            id: 'part-control-in',
            name: 'control',
            interfaceType: 'data'
          }],
          outputs: []
        }
      }
    ],
    // Connection between parts at package level
    edges: [
      {
        id: 'edge-engine-to-control',
        source: 'part-engine-core',
        target: 'part-control-unit',
        sourceHandle: 'part-engine-core-output-power',
        targetHandle: 'part-control-unit-input-control',
        type: 'default',
        data: { compatibility: 'adapter', adapterRequired: 'mechanical-to-data' }
      }
    ],
    inputs: [],
    outputs: []
  }
};

// Component 2: Generator with internal connections
export const generatorComponent: SimpleComponent = {
  id: 'generator-component',
  name: 'Generator System',
  type: 'package',
  data: {
    declaredName: 'Generator System',
    comment: 'Generator with internal signal routing',
    id: 'PKG-GENERATOR',
    metadata: [
      { key: 'voltage', value: '440V' },
      { key: 'frequency', value: '60Hz' }
    ],
    nodes: [
      // Part 1: Generator Unit with internal connections
      {
        id: 'part-generator-unit',
        type: 'part',
        position: { x: 100, y: 100 },
        data: {
          declaredName: 'Generator Unit',
          comment: 'Main generator',
          id: 'PRT-GEN',
          metadata: [],
          nodes: [
            {
              id: 'item-mech-input',
              type: 'item',
              position: { x: 50, y: 100 },
              data: {
                declaredName: 'Mechanical Input',
                comment: '',
                id: 'ITM-MECH',
                metadata: [],
                inputs: [{
                  id: 'port-mech-in',
                  name: 'mechanical',
                  interfaceType: 'mechanical'
                }],
                outputs: [{
                  id: 'port-mech-out',
                  name: 'mechanical',
                  interfaceType: 'mechanical'
                }]
              }
            },
            {
              id: 'item-converter',
              type: 'item',
              position: { x: 200, y: 100 },
              data: {
                declaredName: 'Converter',
                comment: '',
                id: 'ITM-CONV',
                metadata: [],
                inputs: [{
                  id: 'port-conv-in',
                  name: 'mechanical',
                  interfaceType: 'mechanical'
                }],
                outputs: [{
                  id: 'port-conv-out',
                  name: 'electrical',
                  interfaceType: 'electrical'
                }]
              }
            },
            {
              id: 'item-elec-output',
              type: 'item',
              position: { x: 350, y: 100 },
              data: {
                declaredName: 'Electrical Output',
                comment: '',
                id: 'ITM-ELEC',
                metadata: [],
                inputs: [{
                  id: 'port-elec-in',
                  name: 'electrical',
                  interfaceType: 'electrical'
                }],
                outputs: [{
                  id: 'port-elec-out',
                  name: 'electrical',
                  interfaceType: 'electrical'
                }]
              }
            }
          ],
          // Connections within this part
          edges: [
            {
              id: 'edge-mech-to-conv',
              source: 'item-mech-input',
              target: 'item-converter',
              sourceHandle: 'item-mech-input-output-mechanical',
              targetHandle: 'item-converter-input-mechanical',
              type: 'default',
              data: {
                compatibility: 'direct'
              }
            },
            {
              id: 'edge-conv-to-elec',
              source: 'item-converter',
              target: 'item-elec-output',
              sourceHandle: 'item-converter-output-electrical',
              targetHandle: 'item-elec-output-input-electrical',
              type: 'default',
              data: {
                compatibility: 'direct'
              }
            }
          ],
          inputs: [],
          outputs: []
        }
      }
    ],
    edges: [],
    inputs: [],
    outputs: []
  }
};

// Component 3: Pump with internal flow connection
export const pumpComponent: SimpleComponent = {
  id: 'pump-component',
  name: 'Pump System',
  type: 'package',
  data: {
    declaredName: 'Pump System',
    comment: 'Pump with internal flow path',
    id: 'PKG-PUMP',
    metadata: [
      { key: 'flowRate', value: '100m³/h' }
    ],
    nodes: [
      {
        id: 'part-pump-unit',
        type: 'part',
        position: { x: 100, y: 100 },
        data: {
          declaredName: 'Pump Unit',
          comment: '',
          id: 'PRT-PUMP',
          metadata: [],
          nodes: [
            {
              id: 'item-inlet',
              type: 'item',
              position: { x: 50, y: 100 },
              data: {
                declaredName: 'Inlet',
                comment: '',
                id: 'ITM-INLET',
                metadata: [],
                inputs: [{
                  id: 'port-inlet',
                  name: 'inlet',
                  interfaceType: 'fluid'
                }],
                outputs: [{
                  id: 'port-to-impeller',
                  name: 'flow',
                  interfaceType: 'fluid'
                }]
              }
            },
            {
              id: 'item-impeller',
              type: 'item',
              position: { x: 200, y: 100 },
              data: {
                declaredName: 'Impeller',
                comment: '',
                id: 'ITM-IMPELLER',
                metadata: [],
                inputs: [{
                  id: 'port-flow-in',
                  name: 'flow',
                  interfaceType: 'fluid'
                }],
                outputs: [{
                  id: 'port-pressurized',
                  name: 'pressurized',
                  interfaceType: 'fluid'
                }]
              }
            },
            {
              id: 'item-outlet',
              type: 'item',
              position: { x: 350, y: 100 },
              data: {
                declaredName: 'Outlet',
                comment: '',
                id: 'ITM-OUTLET',
                metadata: [],
                inputs: [{
                  id: 'port-from-impeller',
                  name: 'pressurized',
                  interfaceType: 'fluid'
                }],
                outputs: [{
                  id: 'port-outlet',
                  name: 'outlet',
                  interfaceType: 'fluid'
                }]
              }
            }
          ],
          // Connections showing flow through pump
          edges: [
            {
              id: 'edge-inlet-to-impeller',
              source: 'item-inlet',
              target: 'item-impeller',
              sourceHandle: 'item-inlet-output-flow',
              targetHandle: 'item-impeller-input-flow',
              type: 'default',
              data: { compatibility: 'direct' }
            },
            {
              id: 'edge-impeller-to-outlet',
              source: 'item-impeller',
              target: 'item-outlet',
              sourceHandle: 'item-impeller-output-pressurized',
              targetHandle: 'item-outlet-input-pressurized',
              type: 'default',
              data: { compatibility: 'direct' }
            }
          ],
          inputs: [],
          outputs: []
        }
      }
    ],
    edges: [],
    inputs: [],
    outputs: []
  }
};

// Export all components
export const simpleComponents = [
  engineComponent,
  generatorComponent,
  pumpComponent
];