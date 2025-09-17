// Simple viewpoint store
import { writable, derived, get } from 'svelte/store';
import { currentSystemMeta } from '$lib/stores/stores.svelte';

export interface Viewpoint {
  id: string;
  name: string;
  icon: string;
  type: 'system' | 'custom';
  nodeIds?: string[]; // For custom viewpoints - which nodes to show
  systemId?: string; // System this viewpoint belongs to (for custom viewpoints)
}

// Active viewpoint - reset to 'all' when system changes
export const activeViewpoint = writable<string>('all');

// System viewpoints (predefined)
const SYSTEM_VIEWPOINTS: Viewpoint[] = [
  { id: 'all', name: 'All Systems', icon: '🔍', type: 'system' },
  { id: 'electrical', name: 'Electrical', icon: '⚡', type: 'system' },
  { id: 'mechanical', name: 'Mechanical', icon: '⚙️', type: 'system' },
  { id: 'fluid', name: 'Fluid', icon: '💧', type: 'system' },
  { id: 'data', name: 'Data', icon: '📊', type: 'system' },
];

// Get localStorage key for system-specific viewpoints
function getStorageKey(systemId: string): string {
  return `customViewpoints_${systemId}`;
}

// Custom viewpoints store
function createViewpointsStore() {
  // Get current system ID
  const getCurrentSystemId = () => get(currentSystemMeta).id;

  // Load saved custom viewpoints for current system from localStorage
  const loadCustomViewpoints = () => {
    const systemId = getCurrentSystemId();
    if (!systemId || typeof window === 'undefined') return [];

    const saved = localStorage.getItem(getStorageKey(systemId));
    return saved ? JSON.parse(saved) : [];
  };

  const customViewpoints = loadCustomViewpoints();

  const { subscribe, set, update } = writable<Viewpoint[]>([
    ...SYSTEM_VIEWPOINTS,
    ...customViewpoints
  ]);

  return {
    subscribe,
    addCustom: (viewpoint: Omit<Viewpoint, 'id' | 'type' | 'systemId'>) => {
      const systemId = getCurrentSystemId();
      if (!systemId) {
        console.error('Cannot add viewpoint: no system ID found');
        return null;
      }

      const newViewpoint: Viewpoint = {
        ...viewpoint,
        id: `custom-${Date.now()}`,
        type: 'custom',
        systemId
      };
      update(vps => {
        const updated = [...vps, newViewpoint];
        saveCustomViewpoints(updated, systemId);
        return updated;
      });
      return newViewpoint.id;
    },
    updateCustom: (id: string, updates: Partial<Viewpoint>) => {
      const systemId = getCurrentSystemId();
      if (!systemId) {
        console.error('Cannot update viewpoint: no system ID found');
        return;
      }

      update(vps => {
        const updated = vps.map(vp =>
          vp.id === id ? { ...vp, ...updates } : vp
        );
        saveCustomViewpoints(updated, systemId);
        return updated;
      });
    },
    deleteCustom: (id: string) => {
      const systemId = getCurrentSystemId();
      if (!systemId) {
        console.error('Cannot delete viewpoint: no system ID found');
        return;
      }

      update(vps => {
        const updated = vps.filter(vp => vp.id !== id);
        saveCustomViewpoints(updated, systemId);
        return updated;
      });
    },
    // Reload viewpoints when system changes
    reloadForSystem: () => {
      const systemId = getCurrentSystemId();
      if (!systemId) {
        set([...SYSTEM_VIEWPOINTS]);
        return;
      }

      const customViewpoints = loadCustomViewpoints();
      set([...SYSTEM_VIEWPOINTS, ...customViewpoints]);

      // Reset to 'all' viewpoint when switching systems
      activeViewpoint.set('all');
    }
  };
}

function saveCustomViewpoints(allViewpoints: Viewpoint[], systemId: string) {
  const custom = allViewpoints.filter(vp => vp.type === 'custom' && vp.systemId === systemId);
  localStorage.setItem(getStorageKey(systemId), JSON.stringify(custom));
}

export const viewpoints = createViewpointsStore();

// Helper to get active viewpoint details
export const activeViewpointDetails = derived(
  [activeViewpoint, viewpoints],
  ([$active, $viewpoints]) => $viewpoints.find(v => v.id === $active)
);