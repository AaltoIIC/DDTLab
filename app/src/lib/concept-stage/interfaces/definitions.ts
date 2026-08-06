import type { InterfaceDefinition, InterfaceCategory } from './types';

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
  },

  // Mechanical
 'flexible-coupling': {
   id: 'flexible-coupling',
   name: 'Flexible Coupling',
   category: 'mechanical',
   specifications: {
   }
 },
 
 'clutch': {
   id: 'clutch',
   name: 'Clutch',
   category: 'mechanical',
   specifications: {
   }
 },
 
 'torque-flange': {
   id: 'torque-flange',
   name: 'Torque Flange',
   category: 'mechanical',
   specifications: {
   }
 },
 
 'pto': {
   id: 'pto',
   name: 'Power Take Out (PTO)',
   category: 'mechanical',
   specifications: {
   }
 },
 
 'turning-gear': {
   id: 'turning-gear',
   name: 'Turning Gear',
   category: 'mechanical',
   specifications: {
   }
 },
 
 'exhaust-gas-bellows': {
   id: 'exhaust-gas-bellows',
   name: 'Exhaust Gas Bellows',
   category: 'mechanical',
   specifications: {
   }
 },
 
 'exhaust-gas-outlet-flange': {
   id: 'exhaust-gas-outlet-flange',
   name: 'Exhaust Gas Outlet Flange',
   category: 'mechanical',
   specifications: {
   }
 },
 
 'pipe-clamps': {
   id: 'pipe-clamps',
   name: 'Pipe Clamps',
   category: 'mechanical',
   specifications: {
   }
 },
 
 'flexible-hoses': {
   id: 'flexible-hoses',
   name: 'Flexible Hoses',
   category: 'mechanical',
   specifications: {
   }
 },
 
 'propeller-drive-shaft': {
   id: 'propeller-drive-shaft',
   name: 'Propeller Drive Shaft',
   category: 'mechanical',
   specifications: {
   }
 },
 
 'generator-drive-shaft': {
   id: 'generator-drive-shaft',
   name: 'Generator Drive Shaft',
   category: 'mechanical',
   specifications: {
   }
 },
 
 'crankcase-ventilation-piping': {
   id: 'crankcase-ventilation-piping',
   name: 'Crankcase Ventilation Piping',
   category: 'mechanical',
   specifications: {
   }
 },
 
 'flanges': {
   id: 'flanges',
   name: 'Flanges',
   category: 'mechanical',
   specifications: {
   }
 },
 
 // Electrical
 'dc-12v': {
   id: 'dc-12v',
   name: '12 VDC',
   category: 'electrical',
   specifications: {
     voltageNominal: 12,
     voltageRange: [11, 13]
   }
 },
 
 'ac-230v-50hz': {
   id: 'ac-230v-50hz',
   name: '230 VAC, 50 Hz',
   category: 'electrical',
   specifications: {
     voltageNominal: 230,
     voltageRange: [218, 242],
     frequency: 50,
     phaseCount: 1
   }
 },
 
 'ac-400v-50hz': {
   id: 'ac-400v-50hz',
   name: '400 VAC, 50 Hz',
   category: 'electrical',
   specifications: {
     voltageNominal: 400,
     voltageRange: [380, 420],
     frequency: 50,
     phaseCount: 3
   }
 },
 
 'ac-690v-50hz': {
   id: 'ac-690v-50hz',
   name: '690 VAC, 50 Hz',
   category: 'electrical',
   specifications: {
     voltageNominal: 690,
     voltageRange: [655, 725],
     frequency: 50,
     phaseCount: 3
   }
 },
 
 'dc-950v': {
   id: 'dc-950v',
   name: '950 VDC',
   category: 'electrical',
   specifications: {
     voltageNominal: 950,
     voltageRange: [900, 1000]
   }
 },
 
 'ac-6600v-50hz': {
   id: 'ac-6600v-50hz',
   name: '6600 VAC, 50 Hz',
   category: 'electrical',
   specifications: {
     voltageNominal: 6600,
     voltageRange: [6270, 6930],
     frequency: 50,
     phaseCount: 3
   }
 },
 
 'ac-11000v-50hz': {
   id: 'ac-11000v-50hz',
   name: '11000 VAC, 50 Hz',
   category: 'electrical',
   specifications: {
     voltageNominal: 11000,
     voltageRange: [10450, 11550],
     frequency: 50,
     phaseCount: 3
   }
 },
 
 // Fluids
 'ht-water': {
   id: 'ht-water',
   name: 'HT (high-temperature) water',
   category: 'fluid',
   specifications: {
     fluidType: ['ht-water']
   }
 },
 
 'lt-water': {
   id: 'lt-water',
   name: 'LT (low-temperature) water',
   category: 'fluid',
   specifications: {
     fluidType: ['lt-water']
   }
 },
 
 'sw-water': {
   id: 'sw-water',
   name: 'SW (Sea water)',
   category: 'fluid',
   specifications: {
     fluidType: ['sea-water']
   }
 },
 
 'grey-water': {
   id: 'grey-water',
   name: 'Grey water',
   category: 'fluid',
   specifications: {
     fluidType: ['grey-water']
   }
 },
 
 'black-water': {
   id: 'black-water',
   name: 'Black water',
   category: 'fluid',
   specifications: {
     fluidType: ['black-water']
   }
 },
 
 'tap-water': {
   id: 'tap-water',
   name: 'Tap water',
   category: 'fluid',
   specifications: {
     fluidType: ['tap-water']
   }
 },
 
 'work-air': {
   id: 'work-air',
   name: 'Work air',
   category: 'fluid',
   specifications: {
     fluidType: ['compressed-air']
   }
 },
 
 'service-air': {
   id: 'service-air',
   name: 'Service air',
   category: 'fluid',
   specifications: {
     fluidType: ['compressed-air']
   }
 },
 
 'starting-air': {
   id: 'starting-air',
   name: 'Starting air',
   category: 'fluid',
   specifications: {
     fluidType: ['compressed-air']
   }
 },
 
 'steam': {
   id: 'steam',
   name: 'Steam',
   category: 'fluid',
   specifications: {
     fluidType: ['steam']
   }
 },
 
 'hydraulic': {
   id: 'hydraulic',
   name: 'Hydraulic',
   category: 'fluid',
   specifications: {
     fluidType: ['hydraulic-oil']
   }
 },
 
 'lo-sae50-bn40': {
   id: 'lo-sae50-bn40',
   name: 'LO SAE50 BN40',
   category: 'fluid',
   specifications: {
     fluidType: ['lubrication-oil']
   }
 },
 
 'lo-sae50-bn70': {
   id: 'lo-sae50-bn70',
   name: 'LO SAE50 BN70',
   category: 'fluid',
   specifications: {
     fluidType: ['lubrication-oil']
   }
 },
 
 'lo-sae50-bn100': {
   id: 'lo-sae50-bn100',
   name: 'LO SAE50 BN100',
   category: 'fluid',
   specifications: {
     fluidType: ['lubrication-oil']
   }
 },
 
 'lo-sae50-bn140': {
   id: 'lo-sae50-bn140',
   name: 'LO SAE50 BN140',
   category: 'fluid',
   specifications: {
     fluidType: ['lubrication-oil']
   }
 },
 
 'lo-sae30-bn56': {
   id: 'lo-sae30-bn56',
   name: 'LO SAE30 BN5.6',
   category: 'fluid',
   specifications: {
     fluidType: ['lubrication-oil']
   }
 },
 
 'lo-sae30-bn54': {
   id: 'lo-sae30-bn54',
   name: 'LO SAE30 BN5.4',
   category: 'fluid',
   specifications: {
     fluidType: ['lubrication-oil']
   }
 },
 
 'lo-sae40-bn50': {
   id: 'lo-sae40-bn50',
   name: 'LO SAE40 BN50',
   category: 'fluid',
   specifications: {
     fluidType: ['lubrication-oil']
   }
 },
 
 'lo-sae40-bn40': {
   id: 'lo-sae40-bn40',
   name: 'LO SAE40 BN40',
   category: 'fluid',
   specifications: {
     fluidType: ['lubrication-oil']
   }
 },
 
 'lo-sae3040-bn30': {
   id: 'lo-sae3040-bn30',
   name: 'LO SAE30/40 BN30',
   category: 'fluid',
   specifications: {
     fluidType: ['lubrication-oil']
   }
 },
 
 'lo-sae3040-bn20': {
   id: 'lo-sae3040-bn20',
   name: 'LO SAE30/40 BN20',
   category: 'fluid',
   specifications: {
     fluidType: ['lubrication-oil']
   }
 },
 
 'hfo': {
   id: 'hfo',
   name: 'HFO',
   category: 'fluid',
   specifications: {
     fluidType: ['fuel']
   }
 },
 
 'lfo': {
   id: 'lfo',
   name: 'LFO',
   category: 'fluid',
   specifications: {
     fluidType: ['fuel']
   }
 },
 
 'mdo': {
   id: 'mdo',
   name: 'MDO',
   category: 'fluid',
   specifications: {
     fluidType: ['fuel']
   }
 },
 
 'lng': {
   id: 'lng',
   name: 'LNG',
   category: 'fluid',
   specifications: {
     fluidType: ['fuel']
   }
 },
 
 'lpg': {
   id: 'lpg',
   name: 'LPG',
   category: 'fluid',
   specifications: {
     fluidType: ['fuel']
   }
 },
 
 'methanol': {
   id: 'methanol',
   name: 'Methanol',
   category: 'fluid',
   specifications: {
     fluidType: ['fuel']
   }
 },
 
 'ammonia': {
   id: 'ammonia',
   name: 'Ammonia',
   category: 'fluid',
   specifications: {
     fluidType: ['fuel']
   }
 },
 
 'hydrogen': {
   id: 'hydrogen',
   name: 'Hydrogen',
   category: 'fluid',
   specifications: {
     fluidType: ['fuel']
   }
 },
 
 // Data
 'ethernet': {
   id: 'ethernet',
   name: 'Ethernet',
   category: 'data',
   specifications: {
     protocol: 'Ethernet',
     connectorType: 'RJ45'
   }
 },
 
 'opc-ua': {
   id: 'opc-ua',
   name: 'OPC UA',
   category: 'data',
   specifications: {
     protocol: 'OPC UA'
   }
 },
 
 'opc-ua-mqtt': {
   id: 'opc-ua-mqtt',
   name: 'OPC UA MQTT',
   category: 'data',
   specifications: {
     protocol: 'OPC UA MQTT'
   }
 },
 
 'modbus-tcp-ip': {
   id: 'modbus-tcp-ip',
   name: 'Modbus TCP/IP',
   category: 'data',
   specifications: {
     protocol: 'Modbus TCP/IP',
     connectorType: 'RJ45'
   }
 },
 
 'modbus-rtu': {
   id: 'modbus-rtu',
   name: 'Modbus RTU',
   category: 'data',
   specifications: {
     protocol: 'Modbus RTU'
   }
 },
 
 'modbus-ascii': {
   id: 'modbus-ascii',
   name: 'Modbus ASCII',
   category: 'data',
   specifications: {
     protocol: 'Modbus ASCII'
   }
 },
 
 'profinet-tcp-ip': {
   id: 'profinet-tcp-ip',
   name: 'Profinet TCP/IP',
   category: 'data',
   specifications: {
     protocol: 'Profinet TCP/IP'
   }
 },
 
 'profinet-rt': {
   id: 'profinet-rt',
   name: 'Profinet RT',
   category: 'data',
   specifications: {
     protocol: 'Profinet RT'
   }
 },
 
 'profinet-irt': {
   id: 'profinet-irt',
   name: 'Profinet IRT',
   category: 'data',
   specifications: {
     protocol: 'Profinet IRT'
   }
 },
 
 'can-bus': {
   id: 'can-bus',
   name: 'CAN bus',
   category: 'data',
   specifications: {
     protocol: 'CAN bus'
   }
 },
 
 'nmea-2000': {
   id: 'nmea-2000',
   name: 'NMEA 2000',
   category: 'data',
   specifications: {
     protocol: 'NMEA 2000'
   }
 },
 
 'nmea-0183': {
   id: 'nmea-0183',
   name: 'NMEA 0183',
   category: 'data',
   specifications: {
     protocol: 'NMEA 0183'
   }
 },
 
 'hard-wired': {
   id: 'hard-wired',
   name: 'Hard-wired',
   category: 'data',
   specifications: {
     protocol: 'Hard-wired'
   }
 },
 
 'bluetooth': {
   id: 'bluetooth',
   name: 'Bluetooth',
   category: 'data',
   specifications: {
     protocol: 'Bluetooth'
   }
 },
 
 'logical-conduit': {
   id: 'logical-conduit',
   name: 'Logical/Conduit',
   category: 'data',
   specifications: {
     protocol: 'Logical/Conduit'
   }
 },
};

export function getInterfacesByCategory(category: InterfaceCategory): InterfaceDefinition[] {
  return Object.values(standardInterfaces).filter(intf => intf.category === category);
}