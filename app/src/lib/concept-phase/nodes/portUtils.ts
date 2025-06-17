import { get } from 'svelte/store';
import { currentNodes, currentEdges, addToHistory } from '$lib/stores/stores';

export interface PortData {
    inputs?: string[];
    outputs?: string[];
}

// Generate stable port IDs
export function generatePortId(): string {
    return `port-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
}

// Generate user-friendly port names
export function generatePortName(type: 'input' | 'output', existingPorts: string[]): string {
    let index = 1;
    let portName = `${type}${index}`;
    
    // Find a unique name
    while (existingPorts.some(port => port.includes(portName))) {
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
                    inputs.push(portName);
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
            const portId = nodeData.inputs?.[index];
            if (portId) {
                const handleId = `${nodeId}-input-${portId}`;
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
                    outputs.push(portName);
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
            const portId = nodeData.outputs?.[index];
            if (portId) {
                const handleId = `${nodeId}-output-${portId}`;
                currentEdges.update(edges => edges.filter(e => e.sourceHandle !== handleId));
            }
            addToHistory();
        }
    }

    return {
        addInput,
        removeInput,
        addOutput,
        removeOutput
    };
}