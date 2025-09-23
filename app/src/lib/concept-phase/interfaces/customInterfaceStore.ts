import { writable, derived, get } from 'svelte/store';
import type { InterfaceDefinition } from './types';

// Store for custom user-defined interfaces
export const customInterfaces = writable<Record<string, InterfaceDefinition>>({});

// Function to add a custom interface
export function addCustomInterface(name: string, description?: string): string {
  const id = `custom-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
  const newInterface: InterfaceDefinition = {
    id,
    name,
    category: 'other',
    specifications: {
      // Custom interfaces don't have predefined specifications
      // Users can add custom metadata if needed
    }
  };

  customInterfaces.update(interfaces => ({
    ...interfaces,
    [id]: newInterface
  }));

  return id;
}

// Function to update a custom interface
export function updateCustomInterface(id: string, updates: Partial<InterfaceDefinition>) {
  customInterfaces.update(interfaces => {
    if (interfaces[id]) {
      return {
        ...interfaces,
        [id]: {
          ...interfaces[id],
          ...updates
        }
      };
    }
    return interfaces;
  });
}

// Function to remove a custom interface
export function removeCustomInterface(id: string) {
  customInterfaces.update(interfaces => {
    const { [id]: _, ...rest } = interfaces;
    return rest;
  });
}

// Get all custom interfaces as an array
export function getCustomInterfaces(): InterfaceDefinition[] {
  return Object.values(get(customInterfaces));
}

// Combined store with both standard and custom interfaces
export const allInterfaces = derived(
  customInterfaces,
  ($customInterfaces) => {
    // Import standardInterfaces dynamically to avoid circular dependencies
    const { standardInterfaces } = require('./definitions');
    return {
      ...standardInterfaces,
      ...$customInterfaces
    };
  }
);