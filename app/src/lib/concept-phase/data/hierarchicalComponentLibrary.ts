import type { ComponentCategory } from '../types/componentLibrary';
import { 
    Zap, Anchor, Cpu, Settings, 
    Power, Plug, Battery, Cable,
    Activity, Gauge, ToggleLeft, AlertCircle
} from 'lucide-svelte';

// Import existing components to maintain compatibility
import { 
    engineComponent, 
    generatorComponent, 
    pumpComponent,
    electricMotorComponent,
    propellerComponent,
    pmsComponent,
    automationControllerComponent,
    switchboardComponent,
    transformerComponent,
    circuitBreakerComponent
} from './simpleComponentLibrary';

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
                components: [
                    {
                        id: 'main-switchboard',
                        name: 'Main Switchboard',
                        description: '440V main distribution switchboard',
                        categoryId: 'power-distribution',
                        subcategoryId: 'switchboards',
                        template: switchboardComponent
                    }
                ]
            },
            {
                id: 'transformers',
                name: 'Transformers',
                components: [
                    {
                        id: 'step-down-transformer',
                        name: 'Step-down Transformer',
                        description: '440V to 220V transformer',
                        categoryId: 'power-distribution',
                        subcategoryId: 'transformers',
                        template: transformerComponent
                    }
                ]
            },
            {
                id: 'circuit-breakers',
                name: 'Circuit Breakers',
                components: [
                    {
                        id: 'acb-1000a',
                        name: 'ACB 1000A',
                        description: 'Air circuit breaker 1000A',
                        categoryId: 'power-distribution',
                        subcategoryId: 'circuit-breakers',
                        template: circuitBreakerComponent
                    }
                ]
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
                components: [
                    {
                        id: 'propulsion-motor-2mw',
                        name: 'Propulsion Motor 2MW',
                        description: 'Electric propulsion motor',
                        categoryId: 'propulsion',
                        subcategoryId: 'electric-motors',
                        template: electricMotorComponent
                    }
                ]
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
                components: [
                    {
                        id: 'fixed-pitch-propeller',
                        name: 'Fixed Pitch Propeller',
                        description: '4-blade fixed pitch propeller',
                        categoryId: 'propulsion',
                        subcategoryId: 'propellers',
                        template: propellerComponent
                    }
                ]
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
                components: [
                    {
                        id: 'integrated-pms',
                        name: 'Integrated PMS',
                        description: 'Power management and control system',
                        categoryId: 'control-systems',
                        subcategoryId: 'power-management',
                        template: pmsComponent
                    }
                ]
            },
            {
                id: 'automation',
                name: 'Automation Systems',
                components: [
                    {
                        id: 'plc-controller',
                        name: 'PLC Controller',
                        description: 'Programmable logic controller for automation',
                        categoryId: 'control-systems',
                        subcategoryId: 'automation',
                        template: automationControllerComponent
                    }
                ]
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