/**
 * Storage access shim.
 *
 * The active adapter is created once on first call. V1 ships the local
 * IndexedDB adapter only; PocketBase can be wired in by setting
 * `localStorage.setItem('agent-os.pb', JSON.stringify({ url, token }))`
 * and reloading.
 */

import { LocalAdapter } from './local';
import { PocketBaseAdapter, type PocketBaseConfig } from './pocketbase';
import type { StorageAdapter } from './contract';

const PB_CONFIG_KEY = 'agent-os.pb';

let cached: StorageAdapter | null = null;

export function useStorage(): StorageAdapter {
  if (cached) return cached;
  const raw = typeof localStorage !== 'undefined' ? localStorage.getItem(PB_CONFIG_KEY) : null;
  if (raw) {
    try {
      const cfg = JSON.parse(raw) as PocketBaseConfig;
      cached = new PocketBaseAdapter(cfg);
      return cached;
    } catch {
      // fall through to local
    }
  }
  cached = new LocalAdapter();
  return cached;
}

/** For tests / future hot-swap. */
export function resetStorageCache(): void {
  cached = null;
}
