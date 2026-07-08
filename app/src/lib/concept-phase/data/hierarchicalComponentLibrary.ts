import type { ComponentCategory } from '../types/componentLibrary';
import {
    Ship, Waves, Thermometer, Wind, Compass
} from '@lucide/svelte';
import type { Icon as LucideIcon } from '@lucide/svelte';

// Import reusable concept-stage component examples
import {
    basicPowertrain,
    commercialVesselPowertrain,
    motorShaftPropellerDemo,
    simanticsSspCloudTemplate,
    maritimeCoolingSystem,
    ballastWaterSystem,
    shipHvacSystem,
    navigationBridgeSystem
} from './simpleComponentLibrary';

export const componentCategories: ComponentCategory[] = [
    {
        id: 'propulsion-power',
        name: 'Propulsion & Power',
        description: 'Propulsion trains, power generation, and energy storage systems',
        icon: Ship,
        subcategories: [
            {
                id: 'powertrain-examples',
                name: 'Powertrain Examples',
                components: [
                    {
                        id: 'simantics-ssp-cloud-template',
                        name: 'Motor System',
                        description: 'Motor system example backed by python-client/templates/model.ssp for cloud simulation',
                        categoryId: 'propulsion-power',
                        subcategoryId: 'powertrain-examples',
                        template: simanticsSspCloudTemplate
                    },
                    {
                        id: 'motor-shaft-propeller-demo',
                        name: 'Simple Electric Propulsion Train',
                        description: 'Drive, permanent magnet motor, shaft, and propeller template for torsional vibration analysis',
                        categoryId: 'propulsion-power',
                        subcategoryId: 'powertrain-examples',
                        template: motorShaftPropellerDemo
                    },
                    {
                        id: 'basic-powertrain',
                        name: 'Powertrain',
                        description: 'Compact case study with battery, converter, motor, shaft, and propeller',
                        categoryId: 'propulsion-power',
                        subcategoryId: 'powertrain-examples',
                        template: basicPowertrain
                    },
                    {
                        id: 'commercial-vessel-powertrain',
                        name: 'Commercial Vessel Powertrain',
                        description: 'Complete powertrain system including engine, gearbox, shaft, and propeller',
                        categoryId: 'propulsion-power',
                        subcategoryId: 'powertrain-examples',
                        template: commercialVesselPowertrain
                    }
                ]
            }
        ]
    },
    {
        id: 'cooling-systems',
        name: 'Cooling Systems',
        description: 'Fresh water and sea water cooling circuits',
        icon: Waves,
        subcategories: [
            {
                id: 'cooling-examples',
                name: 'Cooling Examples',
                components: [
                    {
                        id: 'maritime-cooling-system',
                        name: 'Maritime Cooling System',
                        description: 'HT/LT fresh water cooling circuits with central sea water heat exchanger',
                        categoryId: 'cooling-systems',
                        subcategoryId: 'cooling-examples',
                        template: maritimeCoolingSystem
                    }
                ]
            }
        ]
    },
    {
        id: 'ballast-systems',
        name: 'Ballast & Tank Systems',
        description: 'Ballast water management, tank level control, and treatment',
        icon: Wind,
        subcategories: [
            {
                id: 'ballast-examples',
                name: 'Ballast Examples',
                components: [
                    {
                        id: 'ballast-water-system',
                        name: 'Ballast Water System',
                        description: 'IMO D-2 compliant ballast water management with UV treatment and tank control',
                        categoryId: 'ballast-systems',
                        subcategoryId: 'ballast-examples',
                        template: ballastWaterSystem
                    }
                ]
            }
        ]
    },
    {
        id: 'hvac-systems',
        name: 'HVAC & Ventilation',
        description: 'Heating, ventilation, and air conditioning for accommodation and machinery spaces',
        icon: Thermometer,
        subcategories: [
            {
                id: 'hvac-examples',
                name: 'HVAC Examples',
                components: [
                    {
                        id: 'ship-hvac-system',
                        name: 'Ship HVAC System',
                        description: 'Accommodation and machinery space HVAC with chiller, air handlers, and fire dampers',
                        categoryId: 'hvac-systems',
                        subcategoryId: 'hvac-examples',
                        template: shipHvacSystem
                    }
                ]
            }
        ]
    },
    {
        id: 'navigation-systems',
        name: 'Navigation & Bridge',
        description: 'Integrated bridge, radar, ECDIS, GPS, and autopilot systems',
        icon: Compass,
        subcategories: [
            {
                id: 'navigation-examples',
                name: 'Navigation Examples',
                components: [
                    {
                        id: 'navigation-bridge-system',
                        name: 'Navigation & Bridge System',
                        description: 'Integrated bridge system with X/S-band radars, ECDIS, GPS, gyrocompass, and adaptive autopilot',
                        categoryId: 'navigation-systems',
                        subcategoryId: 'navigation-examples',
                        template: navigationBridgeSystem
                    }
                ]
            }
        ]
    }
];

// Search function to filter components
export function searchComponents(query: string) {
    const lowercaseQuery = query.toLowerCase();
    const results: any[] = [];

    componentCategories.forEach(category => {
        category.subcategories?.forEach(subcategory => {
            subcategory.components?.forEach(component => {
                if (
                    component.name.toLowerCase().includes(lowercaseQuery) ||
                    component.description?.toLowerCase().includes(lowercaseQuery)
                ) {
                    results.push({
                        ...component,
                        categoryName: category.name,
                        subcategoryName: subcategory.name
                    });
                }
            });
        });
    });

    return results;
}
