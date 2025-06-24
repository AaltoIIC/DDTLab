import { get } from 'svelte/store';
import { currentNodes, currentEdges, addToHistory } from '$lib/stores/stores';
import type { Port } from '../interfaces';

export interface PortData {
    inputs?: Port[];
    outputs?: Port[];
}

// Generate stable port IDs
export function generatePortId(): string {
    return `port-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
}

// Generate user-friendly port names
export function generatePortName(type: 'input' | 'output', existingPorts: Port[]): string {
    let index = 1;
    let portName = `${type}${index}`;
    
    // Find a unique name
    while (existingPorts.some(port => port.name.includes(portName))) {
        index++;
        portName = `${type}${index}`;
    }
    
    return portName;
}

export function createPortHandlers<T extends PortData>(nodeId: string) {
    function addInput() {
        currentNodes.update(nodes => {
            return nodes.map(node => {
                if (node.id === nodeId) {
                    const nodeData = node.data as T;
                    const inputs = [...(nodeData.inputs || [])];
                    const portName = generatePortName('input', inputs);
                    const newPort: Port = {
                        id: generatePortId(),
                        name: portName,
                        interfaceType: undefined
                    };
                    inputs.push(newPort);
                    // Force node re-creation by changing the node itself
                    return {
                        ...node,
                        id: node.id, // Keep same ID
                        type: node.type,
                        position: { ...node.position }, // Clone position
                        data: {
                            ...node.data,
                            inputs,
                            _forceUpdate: Date.now() // Add timestamp to force re-render
                        }
                    };
                }
                return node;
            });
        });
        addToHistory();
    }

    function removeInput(index: number) {
        const nodes = get(currentNodes);
        const node = nodes.find(n => n.id === nodeId);
        if (node && (node.data as T).inputs) {
            currentNodes.update(nodes => {
                return nodes.map(node => {
                    if (node.id === nodeId) {
                        const nodeData = node.data as T;
                        const inputs = [...(nodeData.inputs || [])];
                        inputs.splice(index, 1);
                        return {
                            ...node,
                            data: {
                                ...node.data,
                                inputs
                            }
                        };
                    }
                    return node;
                });
            });
            // Remove any edges connected to this input
            const nodeData = node.data as T;
            const port = nodeData.inputs?.[index];
            if (port) {
                const handleId = `${nodeId}-input-${port.name}`;
                currentEdges.update(edges => edges.filter(e => e.targetHandle !== handleId));
            }
            addToHistory();
        }
    }

    function addOutput() {
        currentNodes.update(nodes => {
            return nodes.map(node => {
                if (node.id === nodeId) {
                    const nodeData = node.data as T;
                    const outputs = [...(nodeData.outputs || [])];
                    const portName = generatePortName('output', outputs);
                    const newPort: Port = {
                        id: generatePortId(),
                        name: portName,
                        interfaceType: undefined
                    };
                    outputs.push(newPort);
                    return {
                        ...node,
                        data: {
                            ...node.data,
                            outputs
                        }
                    };
                }
                return node;
            });
        });
        addToHistory();
    }

    function removeOutput(index: number) {
        const nodes = get(currentNodes);
        const node = nodes.find(n => n.id === nodeId);
        if (node && (node.data as T).outputs) {
            currentNodes.update(nodes => {
                return nodes.map(node => {
                    if (node.id === nodeId) {
                        const nodeData = node.data as T;
                        const outputs = [...(nodeData.outputs || [])];
                        outputs.splice(index, 1);
                        return {
                            ...node,
                            data: {
                                ...node.data,
                                outputs
                            }
                        };
                    }
                    return node;
                });
            });
            // Remove any edges connected to this output
            const nodeData = node.data as T;
            const port = nodeData.outputs?.[index];
            if (port) {
                const handleId = `${nodeId}-output-${port.name}`;
                currentEdges.update(edges => edges.filter(e => e.sourceHandle !== handleId));
            }
            addToHistory();
        }
    }

    function updatePortInterface(type: 'input' | 'output', index: number, interfaceType: string | undefined) {
        currentNodes.update(nodes => {
            return nodes.map(node => {
                if (node.id === nodeId) {
                    const nodeData = node.data as T;
                    const ports = type === 'input' ? [...(nodeData.inputs || [])] : [...(nodeData.outputs || [])];
                    if (ports[index]) {
                        ports[index] = {
                            ...ports[index],
                            interfaceType
                        };
                        return {
                            ...node,
                            data: {
                                ...node.data,
                                [type === 'input' ? 'inputs' : 'outputs']: ports
                            }
                        };
                    }
                }
                return node;
            });
        });
        addToHistory();
    }

    return {
        addInput,
        removeInput,
        addOutput,
        removeOutput,
        updatePortInterface
    };
}