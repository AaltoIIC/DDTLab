import type {
    NotificationType,
    SystemMetaType,
    SystemType
} from '../types/types';
import {    
    type Node,
    type Edge
} from '@xyflow/svelte';
import { writable } from 'svelte/store';
import persistentStore from './persistentStore';
import _ from 'lodash';

export const notification = writable<NotificationType | null>(null);

// current system
export const currentSystemMeta = persistentStore<SystemMetaType>('currentSystemMeta', {name: '', date: ''});
export const currentNodes = persistentStore<Node[]>('currentNodes', [
    {
      id: 'root',
      type: 'RootSystem',
      data: { label: 'Node' },
      position: { x: 0, y: 150 }
    } as {} as Node
]);
export const currentEdges = persistentStore<Edge[]>('currentEdges', []);

export const systems = persistentStore<SystemType[]>('systems', []);