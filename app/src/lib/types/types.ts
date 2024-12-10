import {
    type Node,
    type Edge
} from '@xyflow/svelte';

export interface NotificationType {
    message: string;
    type: string;
    duration: number;
}

export interface SystemMetaType {
    name: string;
    date: string;
}

export interface SystemType extends SystemMetaType {
    nodes: Node[];
    edges: Edge[];
}