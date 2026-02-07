import type { ComponentCategory } from '../types/componentLibrary';
import {
    Ship, Package
} from '@lucide/svelte';

// Import the commercial vessel component
import {
    commercialVesselPowertrain
} from './simpleComponentLibrary';

export const componentCategories: ComponentCategory[] = [
    {
        id: 'vessel-systems',
        name: 'Vessel Systems',
        description: 'Complete vessel system packages',
        icon: Ship,
        subcategories: [
            {
                id: 'commercial-vessels',
                name: 'Commercial Vessels',
                components: [
                    {
                        id: 'commercial-vessel-powertrain',
                        name: 'Commercial Vessel Powertrain',
                        description: 'Complete powertrain system including engine, gearbox, shaft, and propeller',
                        categoryId: 'vessel-systems',
                        subcategoryId: 'commercial-vessels',
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