/**
 * Local IndexedDB adapter.
 *
 * Stores each collection in its own object store. Snapshots are kept in the
 * same DB so the "backups" view survives across sessions.
 *
 * Why IndexedDB and not localStorage? Memories can grow large; the 5MB
 * localStorage ceiling is the wrong target. We also want binary-safe storage
 * so that future formats (images, audio) plug in without changing the API.
 */

import type {
  AppStateEntry,
  Memory,
  Snapshot,
  SnapshotPayload,
} from '../types';
import type { QueryFilter, StorageAdapter } from './contract';

const DB_NAME = 'agent-os';
const DB_VERSION = 1;
const STORE_MEMORIES = 'memories';
const STORE_APP_STATE = 'app_state';
const STORE_SNAPSHOTS = 'snapshots';

function openDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION);
    req.onupgradeneeded = () => {
      const db = req.result;
      if (!db.objectStoreNames.contains(STORE_MEMORIES)) {
        const s = db.createObjectStore(STORE_MEMORIES, { keyPath: 'id' });
        s.createIndex('updatedAt', 'updatedAt');
      }
      if (!db.objectStoreNames.contains(STORE_APP_STATE)) {
        const s = db.createObjectStore(STORE_APP_STATE, { keyPath: 'key' });
        s.createIndex('appId', 'appId');
      }
      if (!db.objectStoreNames.contains(STORE_SNAPSHOTS)) {
        db.createObjectStore(STORE_SNAPSHOTS, { keyPath: 'id' });
      }
    };
    req.onerror = () => reject(req.error);
    req.onsuccess = () => resolve(req.result);
  });
}

function tx<T>(
  db: IDBDatabase,
  stores: string[],
  mode: IDBTransactionMode,
  body: (tx: IDBTransaction) => Promise<T> | T,
): Promise<T> {
  return new Promise((resolve, reject) => {
    const t = db.transaction(stores, mode);
    let result: T;
    t.oncomplete = () => resolve(result);
    t.onerror = () => reject(t.error);
    t.onabort = () => reject(t.error);
    result = (() => {
      try {
        return body(t) as T;
      } catch (err) {
        reject(err);
        throw err;
      }
    })();
  });
}

function reqAsPromise<T>(req: IDBRequest<T>): Promise<T> {
  return new Promise((resolve, reject) => {
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

export class LocalAdapter implements StorageAdapter {
  readonly label = 'Local (IndexedDB)';
  readonly writable = true;

  private dbPromise: Promise<IDBDatabase>;

  constructor() {
    this.dbPromise = openDb();
  }

  async listMemories(filter?: QueryFilter): Promise<Memory[]> {
    const db = await this.dbPromise;
    return tx(db, [STORE_MEMORIES], 'readonly', (t) => {
      const store = t.objectStore(STORE_MEMORIES);
      const req = store.getAll();
      return reqAsPromise<Memory[]>(req).then((rows) => {
        let out = rows.sort((a, b) => b.updatedAt - a.updatedAt);
        if (filter?.equals !== undefined && filter.field) {
          out = out.filter((r) => (r as unknown as Record<string, unknown>)[filter.field!] === filter.equals);
        }
        if (filter?.startsWith) {
          const q = filter.startsWith.toLowerCase();
          out = out.filter((r) => r.title.toLowerCase().startsWith(q));
        }
        if (filter?.limit) out = out.slice(0, filter.limit);
        return out;
      });
    });
  }

  async getMemory(id: string): Promise<Memory | null> {
    const db = await this.dbPromise;
    return tx(db, [STORE_MEMORIES], 'readonly', (t) => {
      const req = t.objectStore(STORE_MEMORIES).get(id);
      return reqAsPromise<Memory | undefined>(req).then((r) => r ?? null);
    });
  }

  async putMemory(memory: Memory): Promise<void> {
    const db = await this.dbPromise;
    await tx(db, [STORE_MEMORIES], 'readwrite', (t) => {
      t.objectStore(STORE_MEMORIES).put(memory);
    });
  }

  async deleteMemory(id: string): Promise<void> {
    const db = await this.dbPromise;
    await tx(db, [STORE_MEMORIES], 'readwrite', (t) => {
      t.objectStore(STORE_MEMORIES).delete(id);
    });
  }

  async getAppState(key: string): Promise<AppStateEntry | null> {
    const db = await this.dbPromise;
    return tx(db, [STORE_APP_STATE], 'readonly', (t) => {
      const req = t.objectStore(STORE_APP_STATE).get(key);
      return reqAsPromise<AppStateEntry | undefined>(req).then((r) => r ?? null);
    });
  }

  async putAppState(entry: AppStateEntry): Promise<void> {
    const db = await this.dbPromise;
    await tx(db, [STORE_APP_STATE], 'readwrite', (t) => {
      t.objectStore(STORE_APP_STATE).put(entry);
    });
  }

  async listAppState(appId?: string): Promise<AppStateEntry[]> {
    const db = await this.dbPromise;
    return tx(db, [STORE_APP_STATE], 'readonly', (t) => {
      const req = t.objectStore(STORE_APP_STATE).getAll();
      return reqAsPromise<AppStateEntry[]>(req).then((rows) =>
        appId ? rows.filter((r) => r.appId === appId) : rows,
      );
    });
  }

  async listSnapshots(): Promise<Snapshot[]> {
    const db = await this.dbPromise;
    return tx(db, [STORE_SNAPSHOTS], 'readonly', (t) => {
      const req = t.objectStore(STORE_SNAPSHOTS).getAll();
      return reqAsPromise<Snapshot[]>(req).then((rows) =>
        rows.sort((a, b) => b.createdAt - a.createdAt),
      );
    });
  }

  async exportSnapshot(): Promise<Snapshot> {
    const [memories, app_state] = await Promise.all([
      this.listMemories(),
      this.listAppState(),
    ]);
    const payload: SnapshotPayload = { memories, app_state };
    return {
      id: crypto.randomUUID(),
      createdAt: Date.now(),
      appVersion: '0.1.0',
      counts: {
        memories: memories.length,
        app_state: app_state.length,
      },
      payload,
    };
  }

  async importSnapshot(snapshot: Snapshot): Promise<void> {
    const db = await this.dbPromise;
    await tx(db, [STORE_MEMORIES, STORE_APP_STATE], 'readwrite', (t) => {
      const memStore = t.objectStore(STORE_MEMORIES);
      const appStore = t.objectStore(STORE_APP_STATE);
      memStore.clear();
      appStore.clear();
      for (const m of snapshot.payload.memories) memStore.put(m);
      for (const a of snapshot.payload.app_state) appStore.put(a);
    });
  }

  async reset(): Promise<void> {
    const db = await this.dbPromise;
    await tx(db, [STORE_MEMORIES, STORE_APP_STATE, STORE_SNAPSHOTS], 'readwrite', (t) => {
      t.objectStore(STORE_MEMORIES).clear();
      t.objectStore(STORE_APP_STATE).clear();
      t.objectStore(STORE_SNAPSHOTS).clear();
    });
  }
}
