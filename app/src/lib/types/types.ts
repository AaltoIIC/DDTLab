import {
    type Node,
    type Edge
} from '@xyflow/svelte';
import type { Connect } from 'vite';

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

export interface ConnectorType {
    name: string;
    type: 'input' | 'output';
    dataType: string;
    unit: string;
}

export interface ElementDataType {
    connectors: ConnectorType[];
}