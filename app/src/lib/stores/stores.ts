import type {
    NotificationType,
} from '../types/types';
import { writable } from 'svelte/store';
import { get } from 'svelte/store';
import persistentStore from './persistentStore';
import _ from 'lodash';

export const notification = writable<NotificationType | null>(null);
