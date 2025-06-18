import type { ComponentCategory } from '../types/componentLibrary';
import { 
    Zap, Anchor, Cpu, Settings, 
    Power, Plug, Battery, Cable,
    Activity, Gauge, ToggleLeft, AlertCircle
} from 'lucide-svelte';

// Import existing components to maintain compatibility
import { engineComponent, generatorComponent, pumpComponent } from './simpleComponentLibrary';

export const componentCategories: ComponentCategory[] = [
    {
        id: 'power-generation',
        name: 'Power Generation',
        description: 'Components for generating electrical power',
        icon: Zap,
        subcategories: [
            {
                id: 'diesel-generators',
                name: 'Diesel Generators',
                components: [
                    {
                        id: 'diesel-gen-500kw',
                        name: 'Diesel Generator 500kW',
                        description: 'Medium capacity diesel generator',
                        categoryId: 'power-generation',
                        subcategoryId: 'diesel-generators',
                        template: generatorComponent // Using existing generator as template
                    },
                    {
                        id: 'diesel-gen-1mw',
                        name: 'Diesel Generator 1MW',
                        description: 'High capacity diesel generator',
                        categoryId: 'power-generation',
                        subcategoryId: 'diesel-generators',
                        template: generatorComponent
                    }
                ]
            },
            {
                id: 'gas-turbines',
                name: 'Gas Turbines',
                components: []
            },
            {
                id: 'shore-connections',
                name: 'Shore Connections',
                components: []
            }
        ]
    },
    {
        id: 'power-distribution',
        name: 'Power Distribution',
        description: 'Components for distributing electrical power',
        icon: Plug,
        subcategories: [
            {
                id: 'switchboards',
                name: 'Switchboards',
                components: []
            },
            {
                id: 'transformers',
                name: 'Transformers',
                components: []
            },
            {
                id: 'circuit-breakers',
                name: 'Circuit Breakers',
                components: []
            }
        ]
    },
    {
        id: 'propulsion',
        name: 'Propulsion',
        description: 'Components for vessel propulsion',
        icon: Anchor,
        subcategories: [
            {
                id: 'electric-motors',
                name: 'Electric Motors',
                components: []
            },
            {
                id: 'diesel-engines',
                name: 'Diesel Engines',
                components: [
                    {
                        id: 'marine-diesel-engine',
                        name: 'Marine Diesel Engine',
                        description: 'Main propulsion diesel engine',
                        categoryId: 'propulsion',
                        subcategoryId: 'diesel-engines',
                        template: engineComponent // Using existing engine as template
                    }
                ]
            },
            {
                id: 'propellers',
                name: 'Propellers',
                components: []
            }
        ]
    },
    {
        id: 'control-systems',
        name: 'Control Systems',
        description: 'Automation and control components',
        icon: Cpu,
        subcategories: [
            {
                id: 'power-management',
                name: 'Power Management Systems',
                components: []
            },
            {
                id: 'automation',
                name: 'Automation Systems',
                components: []
            }
        ]
    },
    {
        id: 'auxiliary-systems',
        name: 'Auxiliary Systems',
        description: 'Supporting systems and equipment',
        icon: Settings,
        subcategories: [
            {
                id: 'pumps',
                name: 'Pumps',
                components: [
                    {
                        id: 'centrifugal-pump',
                        name: 'Centrifugal Pump',
                        description: 'General purpose centrifugal pump',
                        categoryId: 'auxiliary-systems',
                        subcategoryId: 'pumps',
                        template: pumpComponent // Using existing pump as template
                    }
                ]
            },
            {
                id: 'compressors',
                name: 'Compressors',
                components: []
            },
            {
                id: 'heat-exchangers',
                name: 'Heat Exchangers',
                components: []
            }
        ]
    }
];

// Helper function to get all components flat
export function getAllComponents() {
    const components: any[] = [];
    
    componentCategories.forEach(category => {
        if (category.components) {
            components.push(...category.components);
        }
        if (category.subcategories) {
            category.subcategories.forEach(subcategory => {
                if (subcategory.components) {
                    components.push(...subcategory.components);
                }
            });
        }
    });
    
    return components;
}

// Helper function to search components
export function searchComponents(searchTerm: string) {
    const term = searchTerm.toLowerCase();
    const results: any[] = [];
    
    componentCategories.forEach(category => {
        if (category.components) {
            const filtered = category.components.filter(comp =>
                comp.name.toLowerCase().includes(term) ||
                comp.description?.toLowerCase().includes(term)
            );
            results.push(...filtered);
        }
        if (category.subcategories) {
            category.subcategories.forEach(subcategory => {
                if (subcategory.components) {
                    const filtered = subcategory.components.filter(comp =>
                        comp.name.toLowerCase().includes(term) ||
                        comp.description?.toLowerCase().includes(term)
                    );
                    results.push(...filtered);
                }
            });
        }
    });
    
    return results;
}