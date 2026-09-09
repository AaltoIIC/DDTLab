import type { IconProps } from 'lucide-svelte';
import type { Component } from 'svelte';
import type { SysmlDocument } from '../sysml/model';
import type { PresentationMap } from '../sysml/presentation';

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
    // The actual component data structure — a semantic SysML model definition
    // (Phase 5: libraries are authored with the definitions/usages DSL instead
    // of raw `{ nodes, edges }` payloads; the canvas payload is projected from
    // `document` + `presentation` at drag time).
    template: ComponentTemplate;
}

/**
 * Template structure for a library component (Phase 5 rework).
 *
 * `data.document` is a canonical, WF-valid `SysmlDocument` (definitions,
 * usages, ports, attributes, flow relationships) and `data.presentation`
 * holds the tool presentation (positions/sizes per element, interface labels
 * per port — decision 13). The drag payload is this whole object; the
 * instantiation path projects it to the legacy canvas `{ nodes, edges }`
 * shape, so the drop behavior stays pixel-identical.
 */
export interface ComponentTemplate {
    id: string;
    type: 'package';
    data: {
        declaredName: string;
        comment?: string;
        id: string;
        metadata: Array<{ key: string; value: string }>;
        document: SysmlDocument;
        presentation: PresentationMap;
    };
}

// Search/filter options
export interface ComponentFilter {
    searchTerm?: string;
    categoryIds?: string[];
    tags?: string[];
}