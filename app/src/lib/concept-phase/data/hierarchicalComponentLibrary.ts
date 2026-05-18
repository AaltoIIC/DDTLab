import type { ComponentCategory } from '../types/componentLibrary';
import {
    Ship, Package
} from '@lucide/svelte';

// Import reusable concept-stage component examples
import {
    basicPowertrain,
    commercialVesselPowertrain,
    motorShaftPropellerDemo
} from './simpleComponentLibrary';

export const componentCategories: ComponentCategory[] = [
    {
        id: 'vessel-systems',
        name: 'Vessel Systems',
        description: 'Complete vessel system packages',
        icon: Ship,
        subcategories: [
            {
                id: 'powertrain-examples',
                name: 'Powertrain Examples',
                components: [
                    {
                        id: 'motor-shaft-propeller-demo',
                        name: 'Simple Electric Propulsion Train',
                        description: 'Three-component motor, shaft, and propeller template for torsional vibration analysis',
                        categoryId: 'vessel-systems',
                        subcategoryId: 'powertrain-examples',
                        template: motorShaftPropellerDemo
                    },
                    {
                        id: 'basic-powertrain',
                        name: 'Powertrain',
                        description: 'Compact case study with battery, converter, motor, shaft, and propeller',
                        categoryId: 'vessel-systems',
                        subcategoryId: 'powertrain-examples',
                        template: basicPowertrain
                    },
                    {
                        id: 'commercial-vessel-powertrain',
                        name: 'Commercial Vessel Powertrain',
                        description: 'Complete powertrain system including engine, gearbox, shaft, and propeller',
                        categoryId: 'vessel-systems',
                        subcategoryId: 'powertrain-examples',
                        template: commercialVesselPowertrain
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
                    component.description.toLowerCase().includes(lowercaseQuery)
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
