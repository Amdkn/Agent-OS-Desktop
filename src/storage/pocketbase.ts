/**
 * PocketBase adapter — contract-only stub.
 *
 * The brief is explicit: "Ne migre rien, ne demarre aucun service en production"
 * for V1. So this adapter is reachable when the user configures a URL in
 * the settings panel, but it doesn't ship a bundled PocketBase client or
 * attempt to talk to one by default.
 *
 * The contract still has to be implementable. We model the wire shape the
 * same way the local adapter does, so swapping at runtime is a one-line
 * change in `useStorage`.
 */

import type {
  AppStateEntry,
  Memory,
  Snapshot,
  SnapshotPayload,
} from '../types';
import type { QueryFilter, StorageAdapter } from './contract';

export interface PocketBaseConfig {
  url: string;
  /** Admin or service token, used only for the agent's own collections. */
  token: string;
}

const COLLECTION_MEMORIES = 'agent_os_memories';
const COLLECTION_APP_STATE = 'agent_os_app_state';

export class PocketBaseAdapter implements StorageAdapter {
  readonly label: string;
  readonly writable: boolean;

  constructor(private config: PocketBaseConfig) {
    this.label = `PocketBase (${new URL(config.url).host})`;
    this.writable = true;
  }

  private async rpc<T>(collection: string, method: string, body?: unknown): Promise<T> {
    const res = await fetch(`${this.config.url}/api/collections/${collection}/records`, {
      method,
      headers: {
        'Content-Type': 'application/json',
        Authorization: this.config.token,
      },
      body: body ? JSON.stringify(body) : undefined,
    });
    if (!res.ok) throw new Error(`PocketBase ${method} ${collection}: ${res.status}`);
    return (await res.json()) as T;
  }

  async listMemories(filter?: QueryFilter): Promise<Memory[]> {
    const params = new URLSearchParams();
    params.set('sort', '-updatedAt');
    if (filter?.limit) params.set('perPage', String(filter.limit));
    const res = await fetch(
      `${this.config.url}/api/collections/${COLLECTION_MEMORIES}/records?${params}`,
      { headers: { Authorization: this.config.token } },
    );
    if (!res.ok) throw new Error(`PocketBase list: ${res.status}`);
    const data = (await res.json()) as { items: Memory[] };
    return data.items ?? [];
  }

  async getMemory(id: string): Promise<Memory | null> {
    const res = await fetch(
      `${this.config.url}/api/collections/${COLLECTION_MEMORIES}/records/${id}`,
      { headers: { Authorization: this.config.token } },
    );
    if (res.status === 404) return null;
    if (!res.ok) throw new Error(`PocketBase get: ${res.status}`);
    return (await res.json()) as Memory;
  }

  async putMemory(memory: Memory): Promise<void> {
    await this.rpc(COLLECTION_MEMORIES, 'POST', memory);
  }

  async deleteMemory(id: string): Promise<void> {
    await this.rpc(COLLECTION_MEMORIES, 'DELETE', { id });
  }

  async getAppState(key: string): Promise<AppStateEntry | null> {
    const res = await fetch(
      `${this.config.url}/api/collections/${COLLECTION_APP_STATE}/records/${encodeURIComponent(key)}`,
      { headers: { Authorization: this.config.token } },
    );
    if (res.status === 404) return null;
    if (!res.ok) throw new Error(`PocketBase getAppState: ${res.status}`);
    return (await res.json()) as AppStateEntry;
  }

  async putAppState(entry: AppStateEntry): Promise<void> {
    await this.rpc(COLLECTION_APP_STATE, 'POST', entry);
  }

  async listAppState(appId?: string): Promise<AppStateEntry[]> {
    const filter = appId ? `?filter=appId="${appId}"` : '';
    const res = await fetch(
      `${this.config.url}/api/collections/${COLLECTION_APP_STATE}/records${filter}`,
      { headers: { Authorization: this.config.token } },
    );
    if (!res.ok) throw new Error(`PocketBase listAppState: ${res.status}`);
    const data = (await res.json()) as { items: AppStateEntry[] };
    return data.items ?? [];
  }

  async listSnapshots(): Promise<Snapshot[]> {
    // V1 doesn't ship a snapshots collection on PocketBase — left to the
    // operator to provision. Returning [] is the documented behaviour.
    return [];
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
    for (const m of snapshot.payload.memories) await this.putMemory(m);
    for (const a of snapshot.payload.app_state) await this.putAppState(a);
  }

  async reset(): Promise<void> {
    // The local adapter wipes the DB. PocketBase wipes the collections — left
    // to the operator to avoid accidental loss of work in shared instances.
    throw new Error('PocketBase reset is not implemented in V1 — manage collections manually');
  }
}

export type { QueryFilter };
