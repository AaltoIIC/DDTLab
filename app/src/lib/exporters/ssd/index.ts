// Main SSD exporter module
// Provides a clean interface for converting DDTLab systems to SSD format

import { get } from 'svelte/store';
import {
    currentSystemMeta,
    currentNodes,
    currentEdges,
    systems,
    fmiComponents,
    componentLinks
} from '$lib/stores/stores.svelte';
import type { SystemType } from '$lib/types/types';
import type { SSDDocument, ConversionContext } from './types';
import { convertSystem } from './converters';
import { generateSSDXML } from './xmlGenerator';
import { validateSystem, createValidationReport } from './validator';
import { UNIT_DEFINITIONS } from './mappings';

// Main export function for SSD conversion
export function exportToSSD(): string {
    // Get current system data
    const systemMeta = get(currentSystemMeta);
    const nodes = get(currentNodes);
    const edges = get(currentEdges);
    const allSystems = get(systems);
    const fmiComps = get(fmiComponents);
    const compLinks = get(componentLinks);

    // Create the current system object
    const currentSystem: SystemType = {
        id: systemMeta.id,
        name: systemMeta.name,
        date: systemMeta.date,
        nodes: nodes,
        edges: edges,
        requirements: [], // Not used in SSD
        partDefinitions: [],
        itemDefinitions: [],
        packages: []
    };

    // Create conversion context
    const context: ConversionContext = {
        errors: [],
        warnings: [],
        usedUnits: new Set<string>(),
        componentMap: new Map(),
        systemMap: new Map()
    };

    // Validate the system
    const isValid = validateSystem(currentSystem, context);

    if (!isValid && context.errors.length > 0) {
        // Log validation errors but continue with conversion
        console.error('SSD Validation Errors:', createValidationReport(context));
    }

    // Convert the system
    const ssdSystem = convertSystem(
        currentSystem,
        allSystems,
        fmiComps,
        compLinks,
        context
    );

    // Create the SSD document
    const ssdDocument: SSDDocument = {
        version: '2.0',
        name: systemMeta.name || 'System',
        rootSystem: ssdSystem
    };

    // Add units that were used
    if (context.usedUnits.size > 0) {
        ssdDocument.units = Array.from(context.usedUnits).map(unitName => ({
            name: unitName,
            baseUnit: UNIT_DEFINITIONS[unitName] || {}
        }));
    }

    // Generate XML
    const xml = generateSSDXML(ssdDocument);

    // Log any warnings
    if (context.warnings.length > 0) {
        console.warn('SSD Conversion Warnings:', createValidationReport(context));
    }

    return xml;
}

// Export for use in other modules
export { validateSystem, createValidationReport } from './validator';
export type { SSDDocument, ConversionContext, ValidationError } from './types';