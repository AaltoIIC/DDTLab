import type { Node } from '@xyflow/svelte';
import { standardInterfaces } from '../interfaces/definitions';

export type SystemType = 'electrical' | 'mechanical' | 'fluid' | 'data' | 'mixed' | 'none';

export interface SystemTypeInfo {
  primary: SystemType;
  secondary?: SystemType[];
  isAutoDetected: boolean;
}

/**
 * Detect system type(s) based on node's interfaces
 */
export function detectSystemType(node: Node): SystemTypeInfo {
  // Combine inputs and outputs
  const inputs = node.data.inputs || [];
  const outputs = node.data.outputs || [];
  const allPorts = [...inputs, ...outputs];

  // Count interface categories
  const categoryCount: Record<string, number> = {
    electrical: 0,
    mechanical: 0,
    fluid: 0,
    data: 0
  };

  // Analyze each port's interface type
  for (const port of allPorts) {
    if (port.interfaceType && standardInterfaces[port.interfaceType]) {
      const category = standardInterfaces[port.interfaceType].category;
      categoryCount[category]++;
    }
  }

  // Determine primary and secondary types
  const categoriesWithCount = Object.entries(categoryCount)
    .filter(([_, count]) => count > 0)
    .sort((a, b) => b[1] - a[1]);

  const presentCategories = categoriesWithCount.map(([category]) => category as SystemType);

  if (presentCategories.length === 0) {
    return {
      primary: 'none',
      isAutoDetected: true
    };
  }

  if (presentCategories.length === 1) {
    return {
      primary: presentCategories[0],
      isAutoDetected: true
    };
  }

  // Multiple categories present
  // If all have equal count, treat them all as equally important
  const maxCount = categoriesWithCount[0][1];
  const equalPriorityTypes = categoriesWithCount
    .filter(([_, count]) => count === maxCount)
    .map(([category]) => category as SystemType);

  const lowerPriorityTypes = categoriesWithCount
    .filter(([_, count]) => count < maxCount)
    .map(([category]) => category as SystemType);

  if (equalPriorityTypes.length > 1) {
    // When multiple types have equal presence, pick the first alphabetically as primary
    // but include all equal ones in secondary for display
    return {
      primary: equalPriorityTypes[0],
      secondary: [...equalPriorityTypes.slice(1), ...lowerPriorityTypes],
      isAutoDetected: true
    };
  }

  return {
    primary: presentCategories[0], // Most common interface type
    secondary: presentCategories.slice(1),
    isAutoDetected: true
  };
}

/**
 * Check if a node matches a viewpoint's system type
 */
export function nodeMatchesViewpoint(node: Node, viewpointId: string): boolean {
  // Always show all nodes for 'all' viewpoint
  if (viewpointId === 'all') return true;

  // Get node's system type (either manual override or auto-detected)
  const systemTypeInfo = node.data.systemType || detectSystemType(node);

  // Map viewpoint IDs to system types
  const viewpointSystemMap: Record<string, SystemType> = {
    'electrical': 'electrical',
    'mechanical': 'mechanical',
    'fluid': 'fluid',
    'data': 'data'
  };

  const viewpointSystem = viewpointSystemMap[viewpointId];
  if (!viewpointSystem) return true; // Unknown viewpoint, show all

  // Check if primary or secondary types match
  if (systemTypeInfo.primary === viewpointSystem) return true;
  if (systemTypeInfo.secondary?.includes(viewpointSystem)) return true;

  return false;
}

/**
 * Get a color for the system type (for visual indicators)
 */
export function getSystemTypeColor(systemType: SystemType): string {
  const colors: Record<SystemType, string> = {
    electrical: '#fbbf24', // Yellow
    mechanical: '#6b7280', // Gray
    fluid: '#3b82f6', // Blue
    data: '#10b981', // Green
    mixed: '#8b5cf6', // Purple
    none: '#e5e7eb' // Light gray
  };

  return colors[systemType] || colors.none;
}

/**
 * Get a label for the system type
 */
export function getSystemTypeLabel(systemType: SystemType): string {
  const labels: Record<SystemType, string> = {
    electrical: 'Elec',
    mechanical: 'Mech',
    fluid: 'Fluid',
    data: 'Data',
    mixed: 'Mixed',
    none: 'None'
  };

  return labels[systemType] || 'None';
}