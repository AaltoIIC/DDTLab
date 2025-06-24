import type { Node, Edge } from '@xyflow/svelte';
import type { LucideIcon } from 'lucide-svelte';

// Ship powertrain types
export type ShipPowertrainType = 
  | 'diesel-mechanical'
  | 'diesel-electric'
  | 'diesel-electric-hybrid'
  | 'fully-electric'
  | 'lng-powered'
  | 'hydrogen-fuel-cell'
  | 'nuclear'
  | 'wind-assisted'
  | 'solar-assisted';

export type ShipType = 
  | 'cargo'
  | 'tanker'
  | 'container'
  | 'cruise'
  | 'ferry'
  | 'yacht'
  | 'tugboat'
  | 'research'
  | 'naval'
  | 'offshore';

// Represents a ship design template
export interface ShipDesign {
  id: string;
  name: string;
  description: string;
  shipType: ShipType;
  powertrainType: ShipPowertrainType;
  specifications: ShipSpecifications;
  thumbnail?: string;
  icon?: LucideIcon;
  tags?: string[];
  // The actual design structure (complete ship system)
  template: ShipDesignTemplate;
}

// Ship specifications
export interface ShipSpecifications {
  length?: number; // meters
  beam?: number; // meters
  draft?: number; // meters
  displacement?: number; // tons
  speed?: {
    cruise: number; // knots
    max: number; // knots
  };
  power?: {
    total: number; // kW or MW
    propulsion: number; // kW or MW
    auxiliary: number; // kW or MW
  };
  fuelCapacity?: number; // m³
  range?: number; // nautical miles
  crew?: number;
  passengers?: number;
}

// Template structure for a ship design
export interface ShipDesignTemplate {
  id: string;
  type: 'package';
  data: {
    declaredName: string;
    comment?: string;
    nodes: Node[]; // Major systems (propulsion, power generation, etc.)
    edges: Edge[]; // Connections between systems
    metadata: Array<{ key: string; value: string }>;
    inputs?: any[];
    outputs?: any[];
    [key: string]: any;
  };
}

// Design categories for organization
export interface DesignCategory {
  id: string;
  name: string;
  description?: string;
  icon?: LucideIcon;
  designs?: ShipDesign[];
  isExpanded?: boolean;
}

// Filter options for designs
export interface DesignFilter {
  searchTerm?: string;
  shipTypes?: ShipType[];
  powertrainTypes?: ShipPowertrainType[];
  tags?: string[];
  specifications?: {
    minLength?: number;
    maxLength?: number;
    minPower?: number;
    maxPower?: number;
    minSpeed?: number;
    maxSpeed?: number;
  };
}