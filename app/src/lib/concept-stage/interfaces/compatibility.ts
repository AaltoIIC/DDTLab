import type { Port, CompatibilityResult } from './types';
import { standardInterfaces } from './definitions';

export function checkCompatibility(port1: Port, port2: Port): CompatibilityResult {
  // If either port has no interface type, assume compatible
  if (!port1.interfaceType || !port2.interfaceType) {
    return { status: 'direct', message: 'Untyped connection' };
  }
  
  const intf1 = standardInterfaces[port1.interfaceType];
  const intf2 = standardInterfaces[port2.interfaceType];
  
  if (!intf1 || !intf2) {
    return { status: 'direct', message: 'Unknown interface type' };
  }
  
  // Different categories are always incompatible
  if (intf1.category !== intf2.category) {
    return { 
      status: 'incompatible', 
      message: `Cannot connect ${intf1.category} to ${intf2.category}`
    };
  }
  
  // Same interface type
  if (intf1.id === intf2.id) {
    return { status: 'direct', message: 'Direct connection' };
  }
  
  // Check if compatible via adapter
  if (intf1.compatibleWith?.includes(intf2.id) || intf2.compatibleWith?.includes(intf1.id)) {
    const adapterType = getAdapterType(intf1, intf2);
    return { 
      status: 'adapter', 
      message: `Requires ${adapterType}`,
      adapterType
    };
  }
  
  // Generate specific incompatibility message
  const message = generateIncompatibilityMessage(intf1, intf2);
  return { 
    status: 'incompatible', 
    message
  };
}

function getAdapterType(intf1: any, intf2: any): string {
  if (intf1.category === 'electrical') {
    if (intf1.specifications.voltageNominal !== intf2.specifications.voltageNominal) {
      return 'transformer';
    }
  } else if (intf1.category === 'mechanical') {
    if (intf1.specifications.flangeType === intf2.specifications.flangeType) {
      return 'adapter plate';
    }
  }
  return 'adapter';
}

function generateIncompatibilityMessage(intf1: any, intf2: any): string {
  if (intf1.category === 'electrical') {
    const v1 = intf1.specifications.voltageNominal;
    const v2 = intf2.specifications.voltageNominal;
    if (v1 && v2 && v1 !== v2) {
      return `Voltage mismatch: ${v1}V vs ${v2}V`;
    }
    const f1 = intf1.specifications.frequency;
    const f2 = intf2.specifications.frequency;
    if (f1 && f2 && f1 !== f2) {
      return `Frequency mismatch: ${f1}Hz vs ${f2}Hz`;
    }
  } else if (intf1.category === 'mechanical') {
    return `Incompatible mechanical interfaces: ${intf1.name} vs ${intf2.name}`;
  } else if (intf1.category === 'fluid') {
    const p1 = intf1.specifications.pressure?.[1];
    const p2 = intf2.specifications.pressure?.[1];
    if (p1 && p2) {
      return `Pressure mismatch: ${p1} PSI vs ${p2} PSI`;
    }
  }
  
  return `Incompatible ${intf1.category} interfaces`;
}