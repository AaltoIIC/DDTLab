// XML generation functions for creating valid SSD files

import type {
    SSDDocument,
    SSDSystem,
    SSDComponent,
    SSDConnector,
    SSDConnection,
    SSDUnit,
    SSDElementGeometry,
    SSDAnnotation,
    SSDParameter
} from './types';
import { UNIT_DEFINITIONS } from './mappings';

// XML namespaces for SSP 2.0
const NAMESPACES = {
    ssd: 'http://ssp-standard.org/SSP1/SystemStructureDescription',
    ssc: 'http://ssp-standard.org/SSP1/SystemStructureCommon',
    ssv: 'http://ssp-standard.org/SSP1/SystemStructureSignalDictionary',
    ssm: 'http://ssp-standard.org/SSP1/SystemStructureMapping'
};

// Helper to escape XML special characters
function escapeXML(str: string): string {
    return str
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&apos;');
}

// Generate indentation for formatting
function indent(level: number): string {
    return '  '.repeat(level);
}

// Generate XML for units section
function generateUnits(units: Set<string>, level: number = 1): string {
    if (units.size === 0) return '';

    const lines: string[] = [];
    lines.push(`${indent(level)}<ssc:Units>`);

    for (const unit of units) {
        const definition = UNIT_DEFINITIONS[unit];
        if (definition) {
            lines.push(`${indent(level + 1)}<ssc:Unit name="${escapeXML(unit)}">`);

            const baseUnits: string[] = [];
            for (const [base, power] of Object.entries(definition)) {
                if (base !== 'scale' && base !== 'offset') {
                    baseUnits.push(`${base}="${power}"`);
                }
            }

            if (baseUnits.length > 0) {
                lines.push(`${indent(level + 2)}<ssc:BaseUnit ${baseUnits.join(' ')}/>`);
            }

            lines.push(`${indent(level + 1)}</ssc:Unit>`);
        }
    }

    lines.push(`${indent(level)}</ssc:Units>`);
    return lines.join('\n');
}

// Generate XML for geometry
function generateGeometry(geometry: SSDElementGeometry | undefined, tagName: string, level: number): string {
    if (!geometry) return '';

    return `${indent(level)}<${tagName} x1="${geometry.x1}" y1="${geometry.y1}" x2="${geometry.x2}" y2="${geometry.y2}"/>`;
}

// Generate XML for annotations
function generateAnnotations(annotations: SSDAnnotation[] | undefined, level: number): string {
    if (!annotations || annotations.length === 0) return '';

    const lines: string[] = [];
    lines.push(`${indent(level)}<ssc:Annotations>`);

    for (const annotation of annotations) {
        lines.push(`${indent(level + 1)}<ssc:Annotation type="${escapeXML(annotation.type)}">`);

        // Use CDATA for complex content
        if (annotation.content.includes('<') || annotation.content.includes('{')) {
            lines.push(`${indent(level + 2)}<![CDATA[${annotation.content}]]>`);
        } else {
            lines.push(`${indent(level + 2)}${escapeXML(annotation.content)}`);
        }

        lines.push(`${indent(level + 1)}</ssc:Annotation>`);
    }

    lines.push(`${indent(level)}</ssc:Annotations>`);
    return lines.join('\n');
}

// Generate XML for a connector
function generateConnector(connector: SSDConnector, level: number): string {
    const lines: string[] = [];

    const attrs = [
        `name="${escapeXML(connector.name)}"`,
        `kind="${connector.kind}"`
    ];

    if (connector.dataType) {
        lines.push(`${indent(level)}<ssd:Connector ${attrs.join(' ')}>`);

        // Add data type element
        const dataTypeTag = `ssc:${connector.dataType.type}`;
        const unitAttr = connector.dataType.unit ? ` unit="${escapeXML(connector.dataType.unit)}"` : '';
        lines.push(`${indent(level + 1)}<${dataTypeTag}${unitAttr}/>`);

        // Add annotations if present
        const annotationsXML = generateAnnotations(connector.annotations, level + 1);
        if (annotationsXML) {
            lines.push(annotationsXML);
        }

        lines.push(`${indent(level)}</ssd:Connector>`);
    } else {
        // No data type - simple self-closing tag
        lines.push(`${indent(level)}<ssd:Connector ${attrs.join(' ')}/>`);
    }

    return lines.join('\n');
}

// Generate XML for connectors section
function generateConnectors(connectors: SSDConnector[], level: number): string {
    if (connectors.length === 0) return '';

    const lines: string[] = [];
    lines.push(`${indent(level)}<ssd:Connectors>`);

    for (const connector of connectors) {
        lines.push(generateConnector(connector, level + 1));
    }

    lines.push(`${indent(level)}</ssd:Connectors>`);
    return lines.join('\n');
}

// Generate XML for a connection
function generateConnection(connection: SSDConnection, level: number): string {
    const attrs: string[] = [];

    if (connection.startElement) {
        attrs.push(`startElement="${escapeXML(connection.startElement)}"`);
    }
    attrs.push(`startConnector="${escapeXML(connection.startConnector)}"`);

    if (connection.endElement) {
        attrs.push(`endElement="${escapeXML(connection.endElement)}"`);
    }
    attrs.push(`endConnector="${escapeXML(connection.endConnector)}"`);

    return `${indent(level)}<ssd:Connection ${attrs.join(' ')}/>`;
}

// Generate XML for connections section
function generateConnections(connections: SSDConnection[], level: number): string {
    if (connections.length === 0) return '';

    const lines: string[] = [];
    lines.push(`${indent(level)}<ssd:Connections>`);

    for (const connection of connections) {
        lines.push(generateConnection(connection, level + 1));
    }

    lines.push(`${indent(level)}</ssd:Connections>`);
    return lines.join('\n');
}

// Generate XML for a component
function generateComponent(component: SSDComponent, level: number): string {
    const lines: string[] = [];

    const attrs = [`name="${escapeXML(component.name)}"`];

    if (component.source) {
        attrs.push(`source="${escapeXML(component.source)}"`);
    }

    if (component.type) {
        attrs.push(`type="${escapeXML(component.type)}"`);
    }

    lines.push(`${indent(level)}<ssd:Component ${attrs.join(' ')}>`);

    // Add geometry if present
    const geometryXML = generateGeometry(component.geometry, 'ssd:ElementGeometry', level + 1);
    if (geometryXML) {
        lines.push(geometryXML);
    }

    // Add connectors
    const connectorsXML = generateConnectors(component.connectors, level + 1);
    if (connectorsXML) {
        lines.push(connectorsXML);
    }

    // Add annotations
    const annotationsXML = generateAnnotations(component.annotations, level + 1);
    if (annotationsXML) {
        lines.push(annotationsXML);
    }

    lines.push(`${indent(level)}</ssd:Component>`);
    return lines.join('\n');
}

// Check if an element is a system
function isSystem(element: SSDComponent | SSDSystem): element is SSDSystem {
    return 'elements' in element;
}

// Generate XML for a system (recursive for subsystems)
function generateSystem(system: SSDSystem, level: number): string {
    const lines: string[] = [];

    lines.push(`${indent(level)}<ssd:System name="${escapeXML(system.name)}">`);

    // Add geometry if present
    const geometryXML = generateGeometry(system.geometry, 'ssd:ElementGeometry', level + 1);
    if (geometryXML) {
        lines.push(geometryXML);
    }

    // Add system-level connectors (for subsystems)
    if (system.connectors && system.connectors.length > 0) {
        lines.push(generateConnectors(system.connectors, level + 1));
    }

    // Add elements section
    if (system.elements.length > 0) {
        lines.push(`${indent(level + 1)}<ssd:Elements>`);

        for (const element of system.elements) {
            if (isSystem(element)) {
                // Recursive call for subsystems
                lines.push(generateSystem(element, level + 2));
            } else {
                // Generate component
                lines.push(generateComponent(element, level + 2));
            }
        }

        lines.push(`${indent(level + 1)}</ssd:Elements>`);
    }

    // Add connections
    const connectionsXML = generateConnections(system.connections, level + 1);
    if (connectionsXML) {
        lines.push(connectionsXML);
    }

    // Add annotations
    const annotationsXML = generateAnnotations(system.annotations, level + 1);
    if (annotationsXML) {
        lines.push(annotationsXML);
    }

    lines.push(`${indent(level)}</ssd:System>`);
    return lines.join('\n');
}

// Main function to generate complete SSD XML
export function generateSSDXML(document: SSDDocument): string {
    const lines: string[] = [];

    // XML declaration
    lines.push('<?xml version="1.0" encoding="UTF-8"?>');

    // Add comment header
    lines.push('<!--');
    lines.push('  System Structure Description (SSD) file');
    lines.push(`  Generated by DDTLab on ${new Date().toISOString()}`);
    lines.push('  SSP Standard Version 2.0');
    lines.push('-->');
    lines.push('');

    // Root element with namespaces
    const rootAttrs = [
        `xmlns:ssd="${NAMESPACES.ssd}"`,
        `xmlns:ssc="${NAMESPACES.ssc}"`,
        `version="${document.version}"`,
        `name="${escapeXML(document.name)}"`
    ];

    lines.push(`<ssd:SystemStructureDescription ${rootAttrs.join('\n  ')}>`);
    lines.push('');

    // Generate units section
    if (document.units && document.units.length > 0) {
        const unitsSet = new Set(document.units.map(u => u.name));
        const unitsXML = generateUnits(unitsSet, 1);
        if (unitsXML) {
            lines.push(unitsXML);
            lines.push('');
        }
    }

    // Generate root system
    lines.push(generateSystem(document.rootSystem, 1));
    lines.push('');

    // Close root element
    lines.push('</ssd:SystemStructureDescription>');

    return lines.join('\n');
}