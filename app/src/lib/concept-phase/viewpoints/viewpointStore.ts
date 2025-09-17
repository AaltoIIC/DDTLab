// Simple viewpoint store
import { writable, derived, get } from 'svelte/store';

export interface Viewpoint {
  id: string;
  name: string;
  icon: string;
  type: 'system' | 'custom';
  nodeIds?: string[]; // For custom viewpoints - which nodes to show
}

// Active viewpoint
export const activeViewpoint = writable<string>('all');

// System viewpoints (predefined)
const SYSTEM_VIEWPOINTS: Viewpoint[] = [
  { id: 'all', name: 'All Systems', icon: '🔍', type: 'system' },
  { id: 'electrical', name: 'Electrical', icon: '⚡', type: 'system' },
  { id: 'mechanical', name: 'Mechanical', icon: '⚙️', type: 'system' },
  { id: 'fluid', name: 'Fluid', icon: '💧', type: 'system' },
  { id: 'data', name: 'Data', icon: '📊', type: 'system' },
];

// Custom viewpoints store
function createViewpointsStore() {
  // Load saved custom viewpoints from localStorage
  const saved = typeof window !== 'undefined'
    ? localStorage.getItem('customViewpoints')
    : null;
  const customViewpoints = saved ? JSON.parse(saved) : [];

  const { subscribe, set, update } = writable<Viewpoint[]>([
    ...SYSTEM_VIEWPOINTS,
    ...customViewpoints
  ]);

  return {
    subscribe,
    addCustom: (viewpoint: Omit<Viewpoint, 'id' | 'type'>) => {
      const newViewpoint: Viewpoint = {
        ...viewpoint,
        id: `custom-${Date.now()}`,
        type: 'custom'
      };
      update(vps => {
        const updated = [...vps, newViewpoint];
        saveCustomViewpoints(updated);
        return updated;
      });
      return newViewpoint.id;
    },
    updateCustom: (id: string, updates: Partial<Viewpoint>) => {
      update(vps => {
        const updated = vps.map(vp =>
          vp.id === id ? { ...vp, ...updates } : vp
        );
        saveCustomViewpoints(updated);
        return updated;
      });
    },
    deleteCustom: (id: string) => {
      update(vps => {
        const updated = vps.filter(vp => vp.id !== id);
        saveCustomViewpoints(updated);
        return updated;
      });
    }
  };
}

function saveCustomViewpoints(allViewpoints: Viewpoint[]) {
  const custom = allViewpoints.filter(vp => vp.type === 'custom');
  localStorage.setItem('customViewpoints', JSON.stringify(custom));
}

export const viewpoints = createViewpointsStore();

// Helper to get active viewpoint details
export const activeViewpointDetails = derived(
  [activeViewpoint, viewpoints],
  ([$active, $viewpoints]) => $viewpoints.find(v => v.id === $active)
);