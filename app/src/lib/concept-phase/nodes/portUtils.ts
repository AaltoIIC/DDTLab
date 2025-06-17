import { get } from 'svelte/store';
import { currentNodes, currentEdges, addToHistory } from '$lib/stores/stores';

export interface PortData {
    inputs?: string[];
    outputs?: string[];
}

export function createPortHandlers<T extends PortData>(nodeId: string) {
    function addInput() {
        currentNodes.update(nodes => {
            return nodes.map(node => {
                if (node.id === nodeId) {
                    const nodeData = node.data as T;
                    const inputs = [...(nodeData.inputs || [])];
                    inputs.push(`input${inputs.length + 1}`);
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
            const handleId = `${nodeId}-input-${index}`;
            currentEdges.update(edges => edges.filter(e => e.targetHandle !== handleId));
            addToHistory();
        }
    }

    function addOutput() {
        currentNodes.update(nodes => {
            return nodes.map(node => {
                if (node.id === nodeId) {
                    const nodeData = node.data as T;
                    const outputs = [...(nodeData.outputs || [])];
                    outputs.push(`output${outputs.length + 1}`);
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
            const handleId = `${nodeId}-output-${index}`;
            currentEdges.update(edges => edges.filter(e => e.sourceHandle !== handleId));
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