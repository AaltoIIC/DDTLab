import type { Node, Edge } from '@xyflow/svelte';
import type { IconProps } from 'lucide-svelte';
import type { Component } from 'svelte';

// Represents a category of components in the library
export interface ComponentCategory {
    id: string;
    name: string;
    description?: string;
    icon?: Component<IconProps>;
    subcategories?: ComponentCategory[];
    components?: LibraryComponent[];
    isExpanded?: boolean;
}

// Represents a component in the library with category information
export interface LibraryComponent {
    id: string;
    name: string;
    description?: string;
    categoryId: string;
    subcategoryId?: string;
    icon?: Component<IconProps>;
    tags?: string[];
    // The actual component data structure (package with parts and items)
    template: ComponentTemplate;
}

// Template structure for a component (same as existing SimpleComponent)
export interface ComponentTemplate {
    id: string;
    type: 'package';
    data: {
        declaredName: string;
        comment?: string;
        nodes: Node[];
        edges: Edge[];
        [key: string]: any;
    };
}

// Search/filter options
export interface ComponentFilter {
    searchTerm?: string;
    categoryIds?: string[];
    tags?: string[];
}