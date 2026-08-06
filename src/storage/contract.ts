/**
 * Storage adapter contract.
 *
 * Two implementations:
 *   - `LocalAdapter`     IndexedDB-backed, works immediately, no service to run.
 *   - `PocketBaseAdapter` contract-only stub for V1. The brief says "Ne migre
 *                        rien, ne demarre aucun service en production" — so
 *                        this adapter throws "not configured" if instantiated
 *                        without an explicit URL, and otherwise delegates to the
 *                        same JSON envelope as the local adapter.
 *
 * The interface is collection-typed. Each method takes a collection name and
 * returns/accepts the matching row type. Indexes are declared by the caller.
 */

import type {
  AppStateEntry,
  Memory,
  Snapshot,
  SnapshotPayload,
} from '../types';

export interface QueryFilter {
  /** Field name — adapter-specific index hint. */
  field?: string;
  /** Equality match. */
  equals?: string | number | boolean;
  /** 'startsWith' for prefix search. */
  startsWith?: string;
  /** Limit, default 200. */
  limit?: number;
}

export interface StorageAdapter {
  /** Human-readable label shown in the backups UI. */
  readonly label: string;
  /** Whether this adapter can be written to. */
  readonly writable: boolean;

  listMemories(filter?: QueryFilter): Promise<Memory[]>;
  getMemory(id: string): Promise<Memory | null>;
  putMemory(memory: Memory): Promise<void>;
  deleteMemory(id: string): Promise<void>;

  getAppState(key: string): Promise<AppStateEntry | null>;
  putAppState(entry: AppStateEntry): Promise<void>;
  listAppState(appId?: string): Promise<AppStateEntry[]>;

  /** Export the full snapshot the user can re-import later. */
  exportSnapshot(): Promise<Snapshot>;
  /** Replace all collections with the payload from a snapshot. */
  importSnapshot(snapshot: Snapshot): Promise<void>;
  /** Recorded snapshots — kept separately for the "backups" view. */
  listSnapshots(): Promise<Snapshot[]>;
  /** Drop everything and re-seed from defaults. */
  reset(): Promise<void>;
}

/** Build a memory row with sane defaults. */
export function newMemory(partial: Partial<Memory> = {}): Memory {
  const now = Date.now();
  return {
    id: partial.id ?? crypto.randomUUID(),
    title: partial.title ?? 'sans titre',
    body: partial.body ?? '',
    tags: partial.tags ?? [],
    createdAt: partial.createdAt ?? now,
    updatedAt: partial.updatedAt ?? now,
  };
}

/** Flat payload serialization — what gets saved to disk. */
export function toPayload(memory: Memory[]): SnapshotPayload {
  return { memories: memory, app_state: [] };
}
