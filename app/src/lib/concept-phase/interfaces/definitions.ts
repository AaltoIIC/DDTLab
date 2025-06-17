import type { InterfaceDefinition } from './types';

export const standardInterfaces: Record<string, InterfaceDefinition> = {
  // Electrical interfaces
  'iec-440v-60hz': {
    id: 'iec-440v-60hz',
    name: 'IEC 440V 60Hz 3-Phase',
    category: 'electrical',
    specifications: {
      voltageNominal: 440,
      voltageRange: [418, 462], // ±5%
      frequency: 60,
      phaseCount: 3
    }
  },
  
  'iec-690v-60hz': {
    id: 'iec-690v-60hz',
    name: 'IEC 690V 60Hz 3-Phase',
    category: 'electrical',
    specifications: {
      voltageNominal: 690,
      voltageRange: [655, 725],
      frequency: 60,
      phaseCount: 3
    },
    compatibleWith: ['iec-440v-60hz'] // via transformer
  },
  
  'dc-24v': {
    id: 'dc-24v',
    name: 'DC 24V Control',
    category: 'electrical',
    specifications: {
      voltageNominal: 24,
      voltageRange: [22, 26]
    }
  },
  
  // Mechanical interfaces
  'sae-j620-14': {
    id: 'sae-j620-14',
    name: 'SAE J620 Size 14',
    category: 'mechanical',
    specifications: {
      flangeType: 'SAE J620',
      boltPattern: '14'
    }
  },
  
  'sae-j620-10': {
    id: 'sae-j620-10',
    name: 'SAE J620 Size 10',
    category: 'mechanical',
    specifications: {
      flangeType: 'SAE J620',
      boltPattern: '10'
    },
    compatibleWith: ['sae-j620-14'] // via adapter plate
  },
  
  'shaft-50mm': {
    id: 'shaft-50mm',
    name: '50mm Shaft',
    category: 'mechanical',
    specifications: {
      shaftDiameter: 50
    }
  },
  
  // Fluid interfaces
  'hydraulic-3000psi': {
    id: 'hydraulic-3000psi',
    name: 'Hydraulic 3000 PSI',
    category: 'fluid',
    specifications: {
      pressure: [0, 3000],
      fluidType: ['hydraulic-oil']
    }
  },
  
  'pneumatic-150psi': {
    id: 'pneumatic-150psi',
    name: 'Pneumatic 150 PSI',
    category: 'fluid',
    specifications: {
      pressure: [0, 150],
      fluidType: ['compressed-air']
    }
  },
  
  // Data interfaces
  'ethernet-1g': {
    id: 'ethernet-1g',
    name: 'Ethernet 1Gbps',
    category: 'data',
    specifications: {
      protocol: 'Ethernet',
      dataRate: 1000,
      connectorType: 'RJ45'
    }
  },
  
  'modbus-tcp': {
    id: 'modbus-tcp',
    name: 'Modbus TCP',
    category: 'data',
    specifications: {
      protocol: 'Modbus TCP',
      connectorType: 'RJ45'
    },
    compatibleWith: ['ethernet-1g'] // runs over ethernet
  }
};

export function getInterfacesByCategory(category: InterfaceCategory): InterfaceDefinition[] {
  return Object.values(standardInterfaces).filter(intf => intf.category === category);
}