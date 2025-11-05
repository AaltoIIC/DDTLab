import type { Node, Edge } from '@xyflow/svelte';
import type { ElementDataType } from '$lib/types/types';
import { generateId } from '$lib/helpers';

interface ParsedSSDResult {
    nodes: Node[];
    edges: Edge[];
    systemName: string;
}

/**
 * Parse an SSD XML file and convert it to DDTLab's internal format
 * @param xmlContent The SSD XML content as a string
 * @returns Nodes and edges for the system
 */
export function parseSSDFile(xmlContent: string): ParsedSSDResult {
    const parser = new DOMParser();
    const xmlDoc = parser.parseFromString(xmlContent, 'text/xml');

    // Check for parsing errors
    const parserError = xmlDoc.querySelector('parsererror');
    if (parserError) {
        throw new Error('Failed to parse SSD XML: ' + parserError.textContent);
    }

    // Get the system name
    const systemStructure = xmlDoc.querySelector('SystemStructureDescription');
    const systemName = systemStructure?.getAttribute('name') || 'Imported System';

    // Get the root system
    const rootSystem = xmlDoc.querySelector('System[name="Root"]');
    if (!rootSystem) {
        throw new Error('No root system found in SSD file');
    }

    const nodes: Node[] = [];
    const edges: Edge[] = [];
    const usedNodeIds = new Set<string>();

    // Always add root node
    const rootNode: Node = {
        id: 'root',
        type: 'RootSystem',
        data: {
            label: 'Node',
            name: 'Root Node'
        },
        position: { x: 0, y: 150 }
    };
    nodes.push(rootNode);
    usedNodeIds.add('root');

    // Parse components
    const components = rootSystem.querySelectorAll('Elements > Component');
    const componentMap = new Map<string, string>(); // componentName -> nodeId

    components.forEach((component, index) => {
        const componentName = component.getAttribute('name');
        if (!componentName) {
            console.warn('Component without name attribute, skipping');
            return;
        }

        // Generate unique node ID
        const nodeId = generateId([...usedNodeIds]);
        usedNodeIds.add(nodeId);
        componentMap.set(componentName, nodeId);

        // Parse connectors (skip parameters)
        const connectors: any[] = [];
        const connectorElements = component.querySelectorAll('Connectors > Connector');

        console.log(`Parsing component: ${componentName}, connectors: ${connectorElements.length}`);

        connectorElements.forEach(connector => {
            const kind = connector.getAttribute('kind');
            const connectorName = connector.getAttribute('name');

            // Skip parameters and calculatedParameters
            if (!connectorName || kind === 'parameter' || kind === 'calculatedParameter') {
                return;
            }

            // Map kind to type
            let type: 'input' | 'output';
            if (kind === 'input') {
                type = 'input';
            } else if (kind === 'output') {
                type = 'output';
            } else {
                // Default to output for unknown kinds
                type = 'output';
            }

            // Get data type from nested element
            let dataType = 'real'; // default
            const realElement = connector.querySelector('Real');
            const integerElement = connector.querySelector('Integer');
            const booleanElement = connector.querySelector('Boolean');
            const stringElement = connector.querySelector('String');

            if (integerElement) {
                dataType = 'integer';
            } else if (booleanElement) {
                dataType = 'boolean';
            } else if (stringElement) {
                dataType = 'string';
            }

            const newConnector = {
                name: connectorName,
                class: null, // SSD doesn't have VSSo classes (using 'class' property not 'VSSoClass')
                type: type,
                dataType: dataType,
                unit: '-'
            };

            connectors.push(newConnector);
            console.log(`  Added connector: ${connectorName} (${type}, ${dataType})`);
        });

        console.log(`Component ${componentName} has ${connectors.length} non-parameter connectors`);

        // Create node
        const elementData: ElementDataType = {
            type: 'component',
            VSSoClass: null,
            connectors: connectors
        };

        // Simple grid layout: arrange components in a vertical column
        // Position relative to viewport center
        const horizontalSpacing = 300;
        const verticalSpacing = 200;
        const startX = 100;
        const startY = 200;
        const columns = 3;

        const col = index % columns;
        const row = Math.floor(index / columns);

        const node: Node = {
            id: nodeId,
            type: 'Element',
            position: {
                x: startX + col * horizontalSpacing,
                y: startY + row * verticalSpacing
            },
            data: {
                name: componentName,
                element: elementData
            },
            dragHandle: '.element-node-inner',
            parentId: 'root'
        };

        nodes.push(node);
    });

    // Parse connections
    const connections = rootSystem.querySelectorAll('Connections > Connection');
    const usedEdgeIds = new Set<string>();

    connections.forEach(connection => {
        const startElement = connection.getAttribute('startElement');
        const startConnector = connection.getAttribute('startConnector');
        const endElement = connection.getAttribute('endElement');
        const endConnector = connection.getAttribute('endConnector');

        if (!startElement || !startConnector || !endElement || !endConnector) {
            return;
        }

        // Get node IDs
        const sourceNodeId = componentMap.get(startElement);
        const targetNodeId = componentMap.get(endElement);

        if (!sourceNodeId || !targetNodeId) {
            console.warn(`Connection references unknown component: ${startElement} or ${endElement}`);
            return;
        }

        // Create edge
        const edgeId = generateId([...usedEdgeIds]);
        usedEdgeIds.add(edgeId);

        const edge: Edge = {
            id: edgeId,
            source: sourceNodeId,
            sourceHandle: `${sourceNodeId}.${startConnector}`,
            target: targetNodeId,
            targetHandle: `${targetNodeId}.${endConnector}`,
            type: 'default', // Use 'default' to ensure RemovableEdge component is used
            data: {
                offsetX: 0,
                offsetY: 0
            }
        };

        edges.push(edge);
    });

    return {
        nodes,
        edges,
        systemName
    };
}

/**
 * Validate if a file is a valid SSD file
 * @param xmlContent The XML content to validate
 * @returns true if valid, false otherwise
 */
export function isValidSSD(xmlContent: string): boolean {
    try {
        const parser = new DOMParser();
        const xmlDoc = parser.parseFromString(xmlContent, 'text/xml');

        const parserError = xmlDoc.querySelector('parsererror');
        if (parserError) {
            return false;
        }

        // Check for SystemStructureDescription root element
        const systemStructure = xmlDoc.querySelector('SystemStructureDescription');
        if (!systemStructure) {
            return false;
        }

        // Check for root System
        const rootSystem = xmlDoc.querySelector('System[name="Root"]');
        if (!rootSystem) {
            return false;
        }

        return true;
    } catch (error) {
        return false;
    }
}
