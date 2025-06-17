export type InterfaceCategory = 'electrical' | 'mechanical' | 'fluid' | 'data';

export interface InterfaceSpecifications {
  // Electrical
  voltageNominal?: number;
  voltageRange?: [number, number];
  frequency?: number;
  phaseCount?: number;
  
  // Mechanical
  shaftDiameter?: number;
  flangeType?: string;
  rpmRange?: [number, number];
  boltPattern?: string;
  
  // Fluid
  pressure?: [number, number];
  flowRate?: [number, number];
  fluidType?: string[];
  
  // Data
  protocol?: string;
  dataRate?: number;
  connectorType?: string;
}

export interface InterfaceDefinition {
  id: string;
  name: string;
  category: InterfaceCategory;
  specifications: InterfaceSpecifications;
  compatibleWith?: string[];
}

export interface Port {
  id: string;
  name: string;
  interfaceType?: string; // Reference to interface definition ID
}

export type CompatibilityStatus = 'direct' | 'adapter' | 'incompatible';

export interface CompatibilityResult {
  status: CompatibilityStatus;
  message: string;
  adapterType?: string;
}

export interface ConnectionData {
  compatibility?: CompatibilityStatus;
  adapterRequired?: string;
}