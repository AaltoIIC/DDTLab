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

// Component 4: Electric Motor for propulsion
export const electricMotorComponent: SimpleComponent = {
  id: 'electric-motor-component',
  name: 'Electric Motor',
  type: 'package',
  data: {
    declaredName: 'Electric Motor',
    comment: 'Electric propulsion motor',
    id: 'PKG-EMOTOR',
    metadata: [
      { key: 'power', value: '2MW' },
      { key: 'voltage', value: '690V' }
    ],
    nodes: [
      {
        id: 'part-motor-unit',
        type: 'part',
        position: { x: 100, y: 100 },
        data: {
          declaredName: 'Motor Unit',
          comment: 'Main motor assembly',
          id: 'PRT-MOTOR',
          metadata: [],
          nodes: [
            {
              id: 'item-power-input',
              type: 'item',
              position: { x: 50, y: 100 },
              data: {
                declaredName: 'Power Input',
                comment: '',
                id: 'ITM-PWR-IN',
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
            },
            {
              id: 'item-motor-core',
              type: 'item',
              position: { x: 200, y: 100 },
              data: {
                declaredName: 'Motor Core',
                comment: '',
                id: 'ITM-MOTOR-CORE',
                metadata: [],
                inputs: [{
                  id: 'port-elec-motor',
                  name: 'electrical',
                  interfaceType: 'electrical'
                }],
                outputs: [{
                  id: 'port-mech-out',
                  name: 'mechanical',
                  interfaceType: 'mechanical'
                }]
              }
            },
            {
              id: 'item-shaft-output',
              type: 'item',
              position: { x: 350, y: 100 },
              data: {
                declaredName: 'Shaft Output',
                comment: '',
                id: 'ITM-SHAFT',
                metadata: [],
                inputs: [{
                  id: 'port-mech-in',
                  name: 'mechanical',
                  interfaceType: 'mechanical'
                }],
                outputs: [{
                  id: 'port-shaft-out',
                  name: 'shaft',
                  interfaceType: 'mechanical'
                }]
              }
            }
          ],
          edges: [
            {
              id: 'edge-power-to-motor',
              source: 'item-power-input',
              target: 'item-motor-core',
              sourceHandle: 'item-power-input-output-electrical',
              targetHandle: 'item-motor-core-input-electrical',
              type: 'default',
              data: { compatibility: 'direct' }
            },
            {
              id: 'edge-motor-to-shaft',
              source: 'item-motor-core',
              target: 'item-shaft-output',
              sourceHandle: 'item-motor-core-output-mechanical',
              targetHandle: 'item-shaft-output-input-mechanical',
              type: 'default',
              data: { compatibility: 'direct' }
            }
          ],
          inputs: [],
          outputs: [{
            id: 'part-shaft-out',
            name: 'shaft',
            interfaceType: 'mechanical'
          }]
        }
      }
    ],
    edges: [],
    inputs: [],
    outputs: []
  }
};

// Component 5: Propeller
export const propellerComponent: SimpleComponent = {
  id: 'propeller-component',
  name: 'Propeller',
  type: 'package',
  data: {
    declaredName: 'Propeller',
    comment: 'Fixed pitch propeller',
    id: 'PKG-PROP',
    metadata: [
      { key: 'diameter', value: '4.5m' },
      { key: 'blades', value: '4' }
    ],
    nodes: [
      {
        id: 'part-propeller',
        type: 'part',
        position: { x: 100, y: 100 },
        data: {
          declaredName: 'Propeller Assembly',
          comment: '',
          id: 'PRT-PROP',
          metadata: [],
          nodes: [
            {
              id: 'item-shaft-input',
              type: 'item',
              position: { x: 50, y: 100 },
              data: {
                declaredName: 'Shaft Input',
                comment: '',
                id: 'ITM-SHAFT-IN',
                metadata: [],
                inputs: [{
                  id: 'port-shaft-in',
                  name: 'shaft',
                  interfaceType: 'mechanical'
                }],
                outputs: [{
                  id: 'port-rotation',
                  name: 'rotation',
                  interfaceType: 'mechanical'
                }]
              }
            },
            {
              id: 'item-blade-assembly',
              type: 'item',
              position: { x: 200, y: 100 },
              data: {
                declaredName: 'Blade Assembly',
                comment: '',
                id: 'ITM-BLADES',
                metadata: [],
                inputs: [{
                  id: 'port-rotation-in',
                  name: 'rotation',
                  interfaceType: 'mechanical'
                }],
                outputs: [{
                  id: 'port-thrust',
                  name: 'thrust',
                  interfaceType: 'mechanical'
                }]
              }
            }
          ],
          edges: [
            {
              id: 'edge-shaft-to-blades',
              source: 'item-shaft-input',
              target: 'item-blade-assembly',
              sourceHandle: 'item-shaft-input-output-rotation',
              targetHandle: 'item-blade-assembly-input-rotation',
              type: 'default',
              data: { compatibility: 'direct' }
            }
          ],
          inputs: [{
            id: 'part-shaft-in',
            name: 'shaft',
            interfaceType: 'mechanical'
          }],
          outputs: []
        }
      }
    ],
    edges: [],
    inputs: [],
    outputs: []
  }
};

// Component 6: Power Management System (PMS)
export const pmsComponent: SimpleComponent = {
  id: 'pms-component',
  name: 'Power Management System',
  type: 'package',
  data: {
    declaredName: 'Power Management System',
    comment: 'Automated power management and control',
    id: 'PKG-PMS',
    metadata: [
      { key: 'type', value: 'Integrated PMS' },
      { key: 'vendor', value: 'Generic' }
    ],
    nodes: [
      {
        id: 'part-pms-controller',
        type: 'part',
        position: { x: 100, y: 100 },
        data: {
          declaredName: 'PMS Controller',
          comment: 'Main control unit',
          id: 'PRT-PMS-CTRL',
          metadata: [],
          nodes: [
            {
              id: 'item-data-acquisition',
              type: 'item',
              position: { x: 50, y: 100 },
              data: {
                declaredName: 'Data Acquisition',
                comment: '',
                id: 'ITM-DAQ',
                metadata: [],
                inputs: [{
                  id: 'port-sensor-data',
                  name: 'sensors',
                  interfaceType: 'data'
                }],
                outputs: [{
                  id: 'port-processed-data',
                  name: 'data',
                  interfaceType: 'data'
                }]
              }
            },
            {
              id: 'item-logic-processor',
              type: 'item',
              position: { x: 200, y: 100 },
              data: {
                declaredName: 'Logic Processor',
                comment: '',
                id: 'ITM-LOGIC',
                metadata: [],
                inputs: [{
                  id: 'port-data-in',
                  name: 'data',
                  interfaceType: 'data'
                }],
                outputs: [{
                  id: 'port-commands',
                  name: 'commands',
                  interfaceType: 'data'
                }]
              }
            },
            {
              id: 'item-control-output',
              type: 'item',
              position: { x: 350, y: 100 },
              data: {
                declaredName: 'Control Output',
                comment: '',
                id: 'ITM-CTRL-OUT',
                metadata: [],
                inputs: [{
                  id: 'port-commands-in',
                  name: 'commands',
                  interfaceType: 'data'
                }],
                outputs: [{
                  id: 'port-control-signals',
                  name: 'control',
                  interfaceType: 'data'
                }]
              }
            }
          ],
          edges: [
            {
              id: 'edge-daq-to-logic',
              source: 'item-data-acquisition',
              target: 'item-logic-processor',
              sourceHandle: 'item-data-acquisition-output-data',
              targetHandle: 'item-logic-processor-input-data',
              type: 'default',
              data: { compatibility: 'direct' }
            },
            {
              id: 'edge-logic-to-output',
              source: 'item-logic-processor',
              target: 'item-control-output',
              sourceHandle: 'item-logic-processor-output-commands',
              targetHandle: 'item-control-output-input-commands',
              type: 'default',
              data: { compatibility: 'direct' }
            }
          ],
          inputs: [{
            id: 'part-sensor-in',
            name: 'sensors',
            interfaceType: 'data'
          }],
          outputs: [{
            id: 'part-control-out',
            name: 'control',
            interfaceType: 'data'
          }]
        }
      }
    ],
    edges: [],
    inputs: [],
    outputs: []
  }
};

// Component 7: Automation Controller
export const automationControllerComponent: SimpleComponent = {
  id: 'automation-controller-component',
  name: 'Automation Controller',
  type: 'package',
  data: {
    declaredName: 'Automation Controller',
    comment: 'Process automation and control',
    id: 'PKG-AUTO-CTRL',
    metadata: [
      { key: 'type', value: 'PLC-based' },
      { key: 'io-points', value: '256' }
    ],
    nodes: [
      {
        id: 'part-plc-unit',
        type: 'part',
        position: { x: 100, y: 100 },
        data: {
          declaredName: 'PLC Unit',
          comment: 'Programmable logic controller',
          id: 'PRT-PLC',
          metadata: [],
          nodes: [
            {
              id: 'item-input-module',
              type: 'item',
              position: { x: 50, y: 100 },
              data: {
                declaredName: 'Input Module',
                comment: '',
                id: 'ITM-INPUT-MOD',
                metadata: [],
                inputs: [{
                  id: 'port-field-signals',
                  name: 'field',
                  interfaceType: 'data'
                }],
                outputs: [{
                  id: 'port-digital-data',
                  name: 'digital',
                  interfaceType: 'data'
                }]
              }
            },
            {
              id: 'item-cpu',
              type: 'item',
              position: { x: 200, y: 100 },
              data: {
                declaredName: 'CPU Module',
                comment: '',
                id: 'ITM-CPU',
                metadata: [],
                inputs: [{
                  id: 'port-input-data',
                  name: 'inputs',
                  interfaceType: 'data'
                }],
                outputs: [{
                  id: 'port-output-data',
                  name: 'outputs',
                  interfaceType: 'data'
                }]
              }
            },
            {
              id: 'item-output-module',
              type: 'item',
              position: { x: 350, y: 100 },
              data: {
                declaredName: 'Output Module',
                comment: '',
                id: 'ITM-OUTPUT-MOD',
                metadata: [],
                inputs: [{
                  id: 'port-digital-commands',
                  name: 'commands',
                  interfaceType: 'data'
                }],
                outputs: [{
                  id: 'port-field-control',
                  name: 'control',
                  interfaceType: 'data'
                }]
              }
            }
          ],
          edges: [
            {
              id: 'edge-input-to-cpu',
              source: 'item-input-module',
              target: 'item-cpu',
              sourceHandle: 'item-input-module-output-digital',
              targetHandle: 'item-cpu-input-inputs',
              type: 'default',
              data: { compatibility: 'direct' }
            },
            {
              id: 'edge-cpu-to-output',
              source: 'item-cpu',
              target: 'item-output-module',
              sourceHandle: 'item-cpu-output-outputs',
              targetHandle: 'item-output-module-input-commands',
              type: 'default',
              data: { compatibility: 'direct' }
            }
          ],
          inputs: [],
          outputs: [{
            id: 'part-plc-control',
            name: 'control',
            interfaceType: 'data'
          }]
        }
      }
    ],
    edges: [],
    inputs: [],
    outputs: []
  }
};

// Component 8: Switchboard
export const switchboardComponent: SimpleComponent = {
  id: 'switchboard-component',
  name: 'Main Switchboard',
  type: 'package',
  data: {
    declaredName: 'Main Switchboard',
    comment: 'Main electrical distribution switchboard',
    id: 'PKG-SWBD',
    metadata: [
      { key: 'voltage', value: '440V' },
      { key: 'busbar', value: '3-phase' }
    ],
    nodes: [
      {
        id: 'part-switchboard',
        type: 'part',
        position: { x: 100, y: 100 },
        data: {
          declaredName: 'Switchboard Assembly',
          comment: 'Main busbar and breakers',
          id: 'PRT-SWBD',
          metadata: [],
          nodes: [
            {
              id: 'item-main-breaker',
              type: 'item',
              position: { x: 50, y: 100 },
              data: {
                declaredName: 'Main Breaker',
                comment: '',
                id: 'ITM-MAIN-BKR',
                metadata: [],
                inputs: [{
                  id: 'port-power-in',
                  name: 'power',
                  interfaceType: 'electrical'
                }],
                outputs: [{
                  id: 'port-power-protected',
                  name: 'protected',
                  interfaceType: 'electrical'
                }]
              }
            },
            {
              id: 'item-busbar',
              type: 'item',
              position: { x: 200, y: 100 },
              data: {
                declaredName: 'Busbar',
                comment: '',
                id: 'ITM-BUSBAR',
                metadata: [],
                inputs: [{
                  id: 'port-bus-in',
                  name: 'input',
                  interfaceType: 'electrical'
                }],
                outputs: [
                  {
                    id: 'port-bus-out1',
                    name: 'feeder1',
                    interfaceType: 'electrical'
                  },
                  {
                    id: 'port-bus-out2',
                    name: 'feeder2',
                    interfaceType: 'electrical'
                  }
                ]
              }
            },
            {
              id: 'item-feeder-breaker',
              type: 'item',
              position: { x: 350, y: 100 },
              data: {
                declaredName: 'Feeder Breaker',
                comment: '',
                id: 'ITM-FEEDER-BKR',
                metadata: [],
                inputs: [{
                  id: 'port-feeder-in',
                  name: 'input',
                  interfaceType: 'electrical'
                }],
                outputs: [{
                  id: 'port-feeder-out',
                  name: 'output',
                  interfaceType: 'electrical'
                }]
              }
            }
          ],
          edges: [
            {
              id: 'edge-main-to-bus',
              source: 'item-main-breaker',
              target: 'item-busbar',
              sourceHandle: 'item-main-breaker-output-protected',
              targetHandle: 'item-busbar-input-input',
              type: 'default',
              data: { compatibility: 'direct' }
            },
            {
              id: 'edge-bus-to-feeder',
              source: 'item-busbar',
              target: 'item-feeder-breaker',
              sourceHandle: 'item-busbar-output-feeder1',
              targetHandle: 'item-feeder-breaker-input-input',
              type: 'default',
              data: { compatibility: 'direct' }
            }
          ],
          inputs: [{
            id: 'part-power-in',
            name: 'power',
            interfaceType: 'electrical'
          }],
          outputs: [
            {
              id: 'part-feeder-out',
              name: 'distribution',
              interfaceType: 'electrical'
            }
          ]
        }
      }
    ],
    edges: [],
    inputs: [],
    outputs: []
  }
};

// Component 9: Transformer
export const transformerComponent: SimpleComponent = {
  id: 'transformer-component',
  name: 'Transformer',
  type: 'package',
  data: {
    declaredName: 'Transformer',
    comment: 'Step-down transformer',
    id: 'PKG-XFMR',
    metadata: [
      { key: 'primary', value: '440V' },
      { key: 'secondary', value: '220V' },
      { key: 'power', value: '500kVA' }
    ],
    nodes: [
      {
        id: 'part-transformer',
        type: 'part',
        position: { x: 100, y: 100 },
        data: {
          declaredName: 'Transformer Unit',
          comment: '',
          id: 'PRT-XFMR',
          metadata: [],
          nodes: [
            {
              id: 'item-primary-winding',
              type: 'item',
              position: { x: 50, y: 100 },
              data: {
                declaredName: 'Primary Winding',
                comment: '',
                id: 'ITM-PRIMARY',
                metadata: [],
                inputs: [{
                  id: 'port-hv-in',
                  name: 'hv',
                  interfaceType: 'electrical'
                }],
                outputs: [{
                  id: 'port-magnetic',
                  name: 'flux',
                  interfaceType: 'magnetic'
                }]
              }
            },
            {
              id: 'item-core',
              type: 'item',
              position: { x: 200, y: 100 },
              data: {
                declaredName: 'Magnetic Core',
                comment: '',
                id: 'ITM-CORE',
                metadata: [],
                inputs: [{
                  id: 'port-flux-in',
                  name: 'flux',
                  interfaceType: 'magnetic'
                }],
                outputs: [{
                  id: 'port-flux-out',
                  name: 'flux',
                  interfaceType: 'magnetic'
                }]
              }
            },
            {
              id: 'item-secondary-winding',
              type: 'item',
              position: { x: 350, y: 100 },
              data: {
                declaredName: 'Secondary Winding',
                comment: '',
                id: 'ITM-SECONDARY',
                metadata: [],
                inputs: [{
                  id: 'port-flux-sec',
                  name: 'flux',
                  interfaceType: 'magnetic'
                }],
                outputs: [{
                  id: 'port-lv-out',
                  name: 'lv',
                  interfaceType: 'electrical'
                }]
              }
            }
          ],
          edges: [
            {
              id: 'edge-primary-to-core',
              source: 'item-primary-winding',
              target: 'item-core',
              sourceHandle: 'item-primary-winding-output-flux',
              targetHandle: 'item-core-input-flux',
              type: 'default',
              data: { compatibility: 'direct' }
            },
            {
              id: 'edge-core-to-secondary',
              source: 'item-core',
              target: 'item-secondary-winding',
              sourceHandle: 'item-core-output-flux',
              targetHandle: 'item-secondary-winding-input-flux',
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

// Component 10: Circuit Breaker
export const circuitBreakerComponent: SimpleComponent = {
  id: 'circuit-breaker-component',
  name: 'Circuit Breaker',
  type: 'package',
  data: {
    declaredName: 'Circuit Breaker',
    comment: 'Automatic circuit protection',
    id: 'PKG-CB',
    metadata: [
      { key: 'rating', value: '1000A' },
      { key: 'type', value: 'ACB' }
    ],
    nodes: [
      {
        id: 'part-breaker',
        type: 'part',
        position: { x: 100, y: 100 },
        data: {
          declaredName: 'Breaker Assembly',
          comment: '',
          id: 'PRT-BKR',
          metadata: [],
          nodes: [
            {
              id: 'item-contacts',
              type: 'item',
              position: { x: 50, y: 100 },
              data: {
                declaredName: 'Main Contacts',
                comment: '',
                id: 'ITM-CONTACTS',
                metadata: [],
                inputs: [{
                  id: 'port-line-in',
                  name: 'line',
                  interfaceType: 'electrical'
                }],
                outputs: [{
                  id: 'port-load-out',
                  name: 'load',
                  interfaceType: 'electrical'
                }]
              }
            },
            {
              id: 'item-trip-unit',
              type: 'item',
              position: { x: 200, y: 50 },
              data: {
                declaredName: 'Trip Unit',
                comment: '',
                id: 'ITM-TRIP',
                metadata: [],
                inputs: [{
                  id: 'port-current-sense',
                  name: 'current',
                  interfaceType: 'data'
                }],
                outputs: [{
                  id: 'port-trip-signal',
                  name: 'trip',
                  interfaceType: 'data'
                }]
              }
            }
          ],
          edges: [],
          inputs: [{
            id: 'part-line-in',
            name: 'line',
            interfaceType: 'electrical'
          }],
          outputs: [{
            id: 'part-load-out',
            name: 'load',
            interfaceType: 'electrical'
          }]
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
  pumpComponent,
  electricMotorComponent,
  propellerComponent,
  pmsComponent,
  automationControllerComponent,
  switchboardComponent,
  transformerComponent,
  circuitBreakerComponent
];