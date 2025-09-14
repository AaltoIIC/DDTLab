// Core conversion functions for transforming DDTLab structures to SSD format

import type { Node, Edge } from '@xyflow/svelte';
import type {
    SystemType,
    ConnectorType,
    ElementDataType,
    SubsystemDataType,
    FMIComponentType
} from '$lib/types/types';
import type {
    SSDSystem,
    SSDComponent,
    SSDConnector,
    SSDConnection,
    SSDElementGeometry,
    SSDAnnotation,
    ConversionContext
} from './types';
import {
    DATA_TYPE_MAPPING,
    formatVSSoAnnotation,
    sanitizeXMLName,
    ensureUniqueName,
    mapComponentType,
    DEFAULT_FMU_TYPE,
    COMPONENT_SIZE
} from './mappings';

// Convert a connector to SSD format
export function convertConnector(
    connector: any, // Using any since the actual structure differs from type definition
    context: ConversionContext
): SSDConnector {
    // Use the class (VSSo variable) as the name if available, otherwise use the typed name
    let connectorName = connector.name;
    if (connector.class) {
        // Extract the last part of the VSSo class path as the name
        // e.g., "Vehicle.Speed" becomes "Speed"
        const parts = connector.class.split('.');
        connectorName = parts[parts.length - 1] || connector.class;
    }

    const ssdConnector: SSDConnector = {
        name: sanitizeXMLName(connectorName),
        kind: connector.type as 'input' | 'output'
    };

    // Map data type if specified
    if (connector.dataType && connector.dataType !== 'no-dt') {
        const mappedType = DATA_TYPE_MAPPING[connector.dataType.toLowerCase()];
        if (mappedType) {
            ssdConnector.dataType = {
                type: mappedType as 'Real' | 'Integer' | 'Boolean' | 'String',
                unit: connector.unit !== '-' ? connector.unit : undefined
            };

            // Track unit usage
            if (connector.unit && connector.unit !== '-') {
                context.usedUnits.add(connector.unit);
            }
        }
    }

    // Add VSSo annotation if present
    if (connector.class) {
        const annotation = formatVSSoAnnotation(connector.class);
        if (annotation) {
            ssdConnector.annotations = [{
                type: 'com.ddtlab.vsso',
                content: annotation
            }];
        }
    }

    return ssdConnector;
}

// Convert element geometry from position to bounding box
export function convertGeometry(node: Node): SSDElementGeometry {
    return {
        x1: node.position.x,
        y1: node.position.y,
        x2: node.position.x + COMPONENT_SIZE.width,
        y2: node.position.y + COMPONENT_SIZE.height
    };
}

// Convert a component node to SSD format
export function convertComponent(
    node: Node,
    fmiComponents: FMIComponentType[],
    componentLinks: Record<string, string>,
    context: ConversionContext
): SSDComponent {
    const elementData = node.data.element as ElementDataType;
    const usedNames = new Set<string>();
    const usedConnectorNames = new Set<string>();

    // Convert connectors with unique name handling
    const connectors = elementData.connectors.map(c => {
        const ssdConnector = convertConnector(c, context);

        // Ensure connector name is unique within this component
        if (usedConnectorNames.has(ssdConnector.name)) {
            let counter = 1;
            let uniqueName = `${ssdConnector.name}_${counter}`;
            while (usedConnectorNames.has(uniqueName)) {
                counter++;
                uniqueName = `${ssdConnector.name}_${counter}`;
            }
            ssdConnector.name = uniqueName;
        }
        usedConnectorNames.add(ssdConnector.name);

        return ssdConnector;
    });

    const ssdComponent: SSDComponent = {
        name: ensureUniqueName(node.data.name || node.id, usedNames),
        connectors: connectors,
        geometry: convertGeometry(node)
    };

    // Add FMI link if present
    const fmiLink = componentLinks[node.id];
    if (fmiLink) {
        const fmiComponent = fmiComponents.find(c => c.id === fmiLink);
        if (fmiComponent) {
            ssdComponent.source = `resources/${fmiComponent.name}.fmu`;
            ssdComponent.type = DEFAULT_FMU_TYPE;
        } else {
            context.warnings.push({
                path: `Component/${node.data.name}`,
                message: `FMI component with ID ${fmiLink} not found`,
                severity: 'warning'
            });
        }
    }

    // Add VSSo annotation if present
    if (elementData.VSSoClass) {
        const annotation = formatVSSoAnnotation(elementData.VSSoClass);
        if (annotation) {
            ssdComponent.annotations = [{
                type: 'com.ddtlab.vsso',
                content: annotation
            }];
        }
    }

    // Store in context for validation
    context.componentMap.set(ssdComponent.name, ssdComponent);

    return ssdComponent;
}

// Convert a subsystem node to SSD format
export function convertSubsystem(
    node: Node,
    allSystems: SystemType[],
    fmiComponents: FMIComponentType[],
    componentLinks: Record<string, string>,
    context: ConversionContext
): SSDSystem | null {
    const subsystemData = node.data.element as SubsystemDataType;

    if (!subsystemData.subsystemId) {
        context.errors.push({
            path: `Subsystem/${node.data.name}`,
            message: 'Subsystem ID is missing',
            severity: 'error'
        });
        return null;
    }

    const subsystem = allSystems.find(s => s.id === subsystemData.subsystemId);
    if (!subsystem) {
        context.errors.push({
            path: `Subsystem/${node.data.name}`,
            message: `Subsystem with ID ${subsystemData.subsystemId} not found`,
            severity: 'error'
        });
        return null;
    }

    // Recursively convert the subsystem
    const ssdSystem = convertSystem(subsystem, allSystems, fmiComponents, componentLinks, context);

    // Add geometry from the node position
    ssdSystem.geometry = convertGeometry(node);

    // Add subsystem connectors if defined
    if (subsystemData.connectors && subsystemData.connectors.length > 0) {
        ssdSystem.connectors = subsystemData.connectors.map(c => convertConnector(c, context));
    }

    // Store in context for validation
    context.systemMap.set(ssdSystem.name, ssdSystem);

    return ssdSystem;
}

// Convert edges to SSD connections
export function convertConnection(
    edge: Edge,
    nodes: Node[],
    context: ConversionContext
): SSDConnection | null {
    const sourceNode = nodes.find(n => n.id === edge.source);
    const targetNode = nodes.find(n => n.id === edge.target);

    if (!sourceNode || !targetNode) {
        context.warnings.push({
            path: 'Connections',
            message: `Connection references missing nodes: ${edge.source} -> ${edge.target}`,
            severity: 'warning'
        });
        return null;
    }

    // Parse the handle IDs to get connector names
    // Handle format is typically: "nodeId-connectorName-type"
    const sourceHandle = edge.sourceHandle || '';
    const targetHandle = edge.targetHandle || '';

    const sourceConnectorName = extractConnectorName(sourceHandle);
    const targetConnectorName = extractConnectorName(targetHandle);

    if (!sourceConnectorName || !targetConnectorName) {
        context.warnings.push({
            path: 'Connections',
            message: `Invalid connector references in connection: ${sourceHandle} -> ${targetHandle}`,
            severity: 'warning'
        });
        return null;
    }

    return {
        startElement: sanitizeXMLName(sourceNode.data.name || sourceNode.id),
        startConnector: sanitizeXMLName(sourceConnectorName),
        endElement: sanitizeXMLName(targetNode.data.name || targetNode.id),
        endConnector: sanitizeXMLName(targetConnectorName)
    };
}

// Extract connector name from handle ID
function extractConnectorName(handleId: string): string | null {
    // Handle format: "nodeId-connectorName-type"
    const parts = handleId.split('-');
    if (parts.length >= 3) {
        // Return the middle part(s) as the connector name
        return parts.slice(1, -1).join('-');
    }
    return null;
}

// Main system conversion function
export function convertSystem(
    system: SystemType,
    allSystems: SystemType[],
    fmiComponents: FMIComponentType[],
    componentLinks: Record<string, string>,
    context: ConversionContext
): SSDSystem {
    const elements: (SSDComponent | SSDSystem)[] = [];
    const connections: SSDConnection[] = [];

    // Filter out the root node
    const nonRootNodes = system.nodes.filter(n => n.type !== 'RootSystem');

    // Convert each node
    for (const node of nonRootNodes) {
        const elementData = node.data.element as ElementDataType | SubsystemDataType;

        if (elementData.type === 'component') {
            // Convert component
            const component = convertComponent(node, fmiComponents, componentLinks, context);
            elements.push(component);
        } else if (elementData.type === 'system') {
            // Convert subsystem
            const subsystem = convertSubsystem(node, allSystems, fmiComponents, componentLinks, context);
            if (subsystem) {
                elements.push(subsystem);
            }
        }
    }

    // Convert connections
    for (const edge of system.edges) {
        const connection = convertConnection(edge, system.nodes, context);
        if (connection) {
            connections.push(connection);
        }
    }

    // Calculate overall system geometry from all nodes
    const systemGeometry = calculateSystemGeometry(system.nodes);

    const ssdSystem: SSDSystem = {
        name: sanitizeXMLName(system.name),
        elements,
        connections,
        geometry: systemGeometry
    };

    // Add VSSo annotation for the system if needed
    const annotations: SSDAnnotation[] = [];
    if (annotations.length > 0) {
        ssdSystem.annotations = annotations;
    }

    return ssdSystem;
}

// Calculate bounding box for the entire system
function calculateSystemGeometry(nodes: Node[]): SSDElementGeometry | undefined {
    if (nodes.length === 0) return undefined;

    let minX = Infinity, minY = Infinity;
    let maxX = -Infinity, maxY = -Infinity;

    for (const node of nodes) {
        if (node.type === 'RootSystem') continue;

        minX = Math.min(minX, node.position.x);
        minY = Math.min(minY, node.position.y);
        maxX = Math.max(maxX, node.position.x + COMPONENT_SIZE.width);
        maxY = Math.max(maxY, node.position.y + COMPONENT_SIZE.height);
    }

    if (!isFinite(minX) || !isFinite(minY) || !isFinite(maxX) || !isFinite(maxY)) {
        return undefined;
    }

    return {
        x1: minX - 50, // Add some padding
        y1: minY - 50,
        x2: maxX + 50,
        y2: maxY + 50
    };
}