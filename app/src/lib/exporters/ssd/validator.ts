// Validation functions for SSD conversion

import type { Node, Edge } from '@xyflow/svelte';
import type { SystemType, ConnectorType } from '$lib/types/types';
import type { ConversionContext, ValidationError } from './types';

// Validate system before conversion
export function validateSystem(
    system: SystemType,
    context: ConversionContext
): boolean {
    // Check for empty system
    if (!system.nodes || system.nodes.length === 0) {
        context.warnings.push({
            path: 'System',
            message: 'System has no components',
            severity: 'warning'
        });
    }

    // Check for orphaned connections
    validateConnections(system.nodes, system.edges, context);

    // Check for duplicate names
    validateUniqueNames(system.nodes, context);

    // Check for circular dependencies in subsystems
    validateNoCircularDependencies(system, context);

    return context.errors.length === 0;
}

// Validate that all connections reference existing nodes
function validateConnections(
    nodes: Node[],
    edges: Edge[],
    context: ConversionContext
): void {
    const nodeIds = new Set(nodes.map(n => n.id));

    for (const edge of edges) {
        if (!nodeIds.has(edge.source)) {
            context.errors.push({
                path: 'Connections',
                message: `Connection references non-existent source node: ${edge.source}`,
                severity: 'error'
            });
        }

        if (!nodeIds.has(edge.target)) {
            context.errors.push({
                path: 'Connections',
                message: `Connection references non-existent target node: ${edge.target}`,
                severity: 'error'
            });
        }

        // Validate connector references
        if (!edge.sourceHandle || !edge.targetHandle) {
            context.warnings.push({
                path: 'Connections',
                message: `Connection missing handle information: ${edge.id}`,
                severity: 'warning'
            });
        }
    }
}

// Validate unique component names within a system
function validateUniqueNames(
    nodes: Node[],
    context: ConversionContext
): void {
    const names = new Map<string, number>();

    for (const node of nodes) {
        if (node.type === 'RootSystem') continue;

        const name = node.data.name || node.id;
        const count = names.get(name) || 0;
        names.set(name, count + 1);

        if (count > 0) {
            context.errors.push({
                path: `Component/${name}`,
                message: `Duplicate component name: ${name}`,
                severity: 'error'
            });
        }
    }
}

// Check for circular dependencies in subsystems
function validateNoCircularDependencies(
    system: SystemType,
    context: ConversionContext
): void {
    // This would require access to all systems - simplified version
    // In a full implementation, you'd traverse the subsystem hierarchy
    // and check for cycles
}

// Validate connector compatibility for a connection
export function validateConnectorCompatibility(
    sourceConnector: ConnectorType,
    targetConnector: ConnectorType,
    context: ConversionContext
): boolean {
    // Check input/output compatibility
    if (sourceConnector.type !== 'output' || targetConnector.type !== 'input') {
        context.errors.push({
            path: 'Connections',
            message: `Invalid connection: ${sourceConnector.name} (${sourceConnector.type}) -> ${targetConnector.name} (${targetConnector.type})`,
            severity: 'error'
        });
        return false;
    }

    // Check data type compatibility if both are specified
    if (sourceConnector.dataType && targetConnector.dataType &&
        sourceConnector.dataType !== 'no-dt' && targetConnector.dataType !== 'no-dt') {
        if (sourceConnector.dataType !== targetConnector.dataType) {
            context.warnings.push({
                path: 'Connections',
                message: `Data type mismatch: ${sourceConnector.name} (${sourceConnector.dataType}) -> ${targetConnector.name} (${targetConnector.dataType})`,
                severity: 'warning'
            });
        }
    }

    // Check unit compatibility if both are specified
    if (sourceConnector.unit && targetConnector.unit &&
        sourceConnector.unit !== '-' && targetConnector.unit !== '-') {
        if (sourceConnector.unit !== targetConnector.unit) {
            context.warnings.push({
                path: 'Connections',
                message: `Unit mismatch: ${sourceConnector.name} (${sourceConnector.unit}) -> ${targetConnector.name} (${targetConnector.unit})`,
                severity: 'warning'
            });
        }
    }

    return true;
}

// Validate XML name compliance
export function validateXMLName(name: string): boolean {
    // XML name rules:
    // - Must start with letter or underscore
    // - Can contain letters, digits, hyphens, underscores, and periods
    // - Cannot start with "xml" (case-insensitive)
    const xmlNamePattern = /^[a-zA-Z_][a-zA-Z0-9_\-\.]*$/;
    return xmlNamePattern.test(name) && !name.toLowerCase().startsWith('xml');
}

// Create validation report
export function createValidationReport(context: ConversionContext): string {
    const lines: string[] = [];

    if (context.errors.length === 0 && context.warnings.length === 0) {
        lines.push('✓ Validation successful - no issues found');
        return lines.join('\n');
    }

    if (context.errors.length > 0) {
        lines.push(`❌ ${context.errors.length} error(s) found:`);
        for (const error of context.errors) {
            lines.push(`  - [${error.path}] ${error.message}`);
        }
    }

    if (context.warnings.length > 0) {
        lines.push(`⚠️ ${context.warnings.length} warning(s) found:`);
        for (const warning of context.warnings) {
            lines.push(`  - [${warning.path}] ${warning.message}`);
        }
    }

    return lines.join('\n');
}