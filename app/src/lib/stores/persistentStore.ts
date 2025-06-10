import { browser } from '$app/environment';
import type { Writable } from 'svelte/store';
import { writable, get } from 'svelte/store'

// persistent store that syncs its value to localStorage
const persistentStore = <T>(key: string, initValue: T): Writable<T> => {
    const store = writable(initValue);
    if (!browser) return store;

    const storedValueStr = localStorage.getItem(key);
    if (storedValueStr != null) {
        try {
            const parsedValue = JSON.parse(storedValueStr);
            if ( initValue instanceof Map && Array.isArray(parsedValue)) {
                store.set(new Map(parsedValue) as unknown as T);
            } else if (Array.isArray(initValue) && !Array.isArray(parsedValue)) {
                console.warn(`Expected array for ${key}, got ${typeof parsedValue}. Using default value.`);
                store.set(initValue);
            } else {
                store.set(parsedValue);
            }
        } catch (e) {
            console.error(`Failed to parse stored value for ${key}:`, e);
            store.set(initValue);
        }
    }
    store.subscribe((val) => {
        if (val === null || val === undefined) {
            localStorage.removeItem(key)
        } else {
            if (initValue instanceof Map && val instanceof Map) {
                localStorage.setItem(key, JSON.stringify(Array.from(val.entries())));
            } else {
                localStorage.setItem(key, JSON.stringify(val));
            }
        }
    })

    window.addEventListener('storage', () => {
        const storedValueStr = localStorage.getItem(key);
        if (storedValueStr == null) return;

        const localValue: T = JSON.parse(storedValueStr)
        if (localValue !== get(store)) store.set(localValue);
    });

    return store;
}

export default persistentStore