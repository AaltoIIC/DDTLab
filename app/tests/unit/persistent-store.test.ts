import { beforeEach, describe, expect, it, vi } from 'vitest';

const storage = new Map<string, string>();
const listeners = new Map<string, Set<(event: Event) => void>>();

const localStorageMock = {
  getItem: (key: string) => storage.get(key) ?? null,
  setItem: (key: string, value: string) => storage.set(key, value),
  removeItem: (key: string) => storage.delete(key),
  clear: () => storage.clear()
};

vi.mock('$app/environment', () => ({ browser: true }));

beforeEach(() => {
  storage.clear();
  listeners.clear();
  vi.stubGlobal('localStorage', localStorageMock);
  vi.stubGlobal('window', {
    addEventListener: (type: string, listener: (event: Event) => void) => {
      const bucket = listeners.get(type) ?? new Set();
      bucket.add(listener);
      listeners.set(type, bucket);
    }
  });
});

describe('persistentStore browser contract', () => {
  it('loads and persists JSON values under the existing key', async () => {
    storage.set('systems', JSON.stringify([{ id: 'legacy', name: 'Legacy' }]));
    const { default: persistentStore } = await import('$lib/stores/persistentStore');
    const store = persistentStore('systems', [] as Array<{ id: string; name: string }>);
    let value: Array<{ id: string; name: string }> = [];
    store.subscribe((next) => { value = next; });

    expect(value).toEqual([{ id: 'legacy', name: 'Legacy' }]);
    store.set([{ id: 'new', name: 'New' }]);
    expect(JSON.parse(storage.get('systems')!)).toEqual([{ id: 'new', name: 'New' }]);
  });

  it('serializes Maps as entry arrays and restores them as Maps', async () => {
    storage.set('links', JSON.stringify([['node-1', 'fmu-1']]));
    const { default: persistentStore } = await import('$lib/stores/persistentStore');
    const store = persistentStore('links', new Map<string, string>());
    let value: Map<string, string> = new Map();
    store.subscribe((next) => { value = next; });

    expect(value).toEqual(new Map([['node-1', 'fmu-1']]));
    value.set('node-2', 'fmu-2');
    store.set(value);
    expect(JSON.parse(storage.get('links')!)).toEqual([['node-1', 'fmu-1'], ['node-2', 'fmu-2']]);
  });

  it('falls back to the supplied value for malformed JSON and syncs storage events', async () => {
    storage.set('settings', '{not-json');
    const { default: persistentStore } = await import('$lib/stores/persistentStore');
    const store = persistentStore('settings', { enabled: false });
    let value = { enabled: false };
    store.subscribe((next) => { value = next; });

    expect(value).toEqual({ enabled: false });
    storage.set('settings', JSON.stringify({ enabled: true }));
    for (const listener of listeners.get('storage') ?? []) listener(new Event('storage'));
    expect(value).toEqual({ enabled: true });
  });
});
