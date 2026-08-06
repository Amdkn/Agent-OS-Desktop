/**
 * Domain types shared by the shell, apps, and storage.
 * Persistence layer is contract-typed — every collection row fits one of these.
 */

export type WindowId = string;
export type AppId = string;

/** A registry entry for an app discoverable in the disk-based apps folder. */
export interface AppManifest {
  id: AppId;
  name: string;
  /** Singletons launch one instance; multi apps launch N. */
  kind: 'singleton' | 'multi';
  description: string;
  icon: string;
}

/** A live window on the desktop. */
export interface WindowState {
  id: WindowId;
  appId: AppId;
  title: string;
  /** Display state — minimized apps are kept in the store but not rendered. */
  minimized: boolean;
  /** Stacking — higher z renders on top. */
  z: number;
  x: number;
  y: number;
  w: number;
  h: number;
  /** Saved per-instance — apps that remember their view. */
  payload?: Record<string, unknown>;
}

/* -------------------------- Storage contracts -------------------------- */

/**
 * The durable layer is a small set of named collections. Apps declare
 * which collections they read and write; the storage adapter doesn't care
 * about schemas beyond what each collection entry already provides.
 */
export type Collection =
  | 'memories'      // Markdown-ish notes, the "durable" surface
  | 'snapshots'     // Metadata about backups (we export the rows themselves)
  | 'app_state';    // Per-app, per-instance persisted UI state

export interface Memory {
  id: string;
  title: string;
  body: string;
  tags: string[];
  createdAt: number;
  updatedAt: number;
}

export interface AppStateEntry {
  /** Composite key `${appId}/${windowId}` lets windows restore their view. */
  key: string;
  appId: AppId;
  windowId: WindowId;
  state: Record<string, unknown>;
  updatedAt: number;
}

export interface Snapshot {
  id: string;
  createdAt: number;
  appVersion: string;
  counts: Record<string, number>;
  /** The actual payload — zipped JSON on disk. */
  payload: SnapshotPayload;
}

export interface SnapshotPayload {
  memories: Memory[];
  app_state: AppStateEntry[];
}

/* -------------------------- Observers mirror -------------------------- */

/**
 * A subset of the Observers REGISTRY.json — just the fields the agents app
 * needs to render. We don't depend on the file at runtime; the data is
 * bundled as a static JSON so the app boots offline.
 */
export interface ObserverEntry {
  id: string;
  name: string;
  status: 'presente' | 'a_cloner' | 'service_heberge';
  chemin?: string;
  depot?: string;
  url?: string;
  description?: string;
}
