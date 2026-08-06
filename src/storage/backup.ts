/**
 * Backup / restore helpers.
 *
 * The whole snapshot is serialised to JSON and offered as a file download.
 * That gives the user a portable, git-trackable artefact of their durable
 * state — the whole point of the persistent layer.
 */

import type { Snapshot } from '../types';
import type { StorageAdapter } from './contract';

export const SNAPSHOT_FORMAT = 'agent-os/snapshot.v1';

export async function downloadSnapshot(adapter: StorageAdapter): Promise<Snapshot> {
  const snap = await adapter.exportSnapshot();
  const blob = new Blob([JSON.stringify(snap, null, 2)], {
    type: 'application/json',
  });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  const stamp = new Date(snap.createdAt).toISOString().replace(/[:.]/g, '-');
  a.download = `agent-os-snapshot-${stamp}.json`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 0);
  return snap;
}

export async function readSnapshotFile(file: File): Promise<Snapshot> {
  const text = await file.text();
  const parsed = JSON.parse(text) as Snapshot;
  if (parsed.appVersion === undefined || parsed.payload === undefined) {
    throw new Error('Snapshot invalide — il manque appVersion ou payload');
  }
  return parsed;
}

export async function importSnapshotFromFile(
  adapter: StorageAdapter,
  file: File,
): Promise<void> {
  const snapshot = await readSnapshotFile(file);
  await adapter.importSnapshot(snapshot);
}
