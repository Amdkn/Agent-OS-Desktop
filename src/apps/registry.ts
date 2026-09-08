/**
 * Open app registry.
 *
 * Apps are registered by:
 *   1. A static builtin list below (the three apps V1 ships with).
 *   2. import.meta.glob discovery of any apps folder index file that
 *      exports a manifest (the extensibility hook).
 *
 * Both end up in the same apps field on the shell store. The Dock and
 * the New-Window menu iterate over it. Adding a new app therefore means
 * dropping a folder under src/apps with an index.tsx that exports
 * manifest and App - no edits to the shell.
 */

import type { AppManifest } from '../types';
import { ObserversApp } from './Observers';
import { MemoriesApp } from './Memories';

interface AppModule {
  manifest?: AppManifest;
  default?: unknown;
  App?: unknown;
}

const modules = import.meta.glob<AppModule>('./*/index.tsx', { eager: true }) as Record<string, AppModule>;

const builtins: Array<{ id: string; component: unknown; manifest: AppManifest }> = [
  {
    id: 'observers',
    component: ObserversApp,
    manifest: {
      id: 'observers',
      name: 'Observateurs',
      kind: 'multi',
      description: 'Les onze observateurs — installés, à cloner, hébergés.',
      icon: '◉',
    },
  },
  {
    id: 'memories',
    component: MemoriesApp,
    manifest: {
      id: 'memories',
      name: 'Mémoires',
      kind: 'multi',
      description: 'Notes durables. Backup en un clic.',
      icon: '✎',
    },
  },
];

const byId = new Map<string, { manifest: AppManifest; component: unknown }>();

// Builtins first — they already have validated manifests.
for (const b of builtins) byId.set(b.id, b);

// Dynamic discovery — anything exposing a manifest wins.
for (const [path, mod] of Object.entries(modules)) {
  if (!mod?.manifest) continue;
  const m = mod.manifest;
  if (byId.has(m.id)) continue; // builtin wins
  const component = (mod.App ?? mod.default) as unknown;
  byId.set(m.id, { manifest: m, component });
  // eslint-disable-next-line no-console
  console.info(`[agent-os] app discovered: ${m.id} (${path})`);
}

export const apps: Array<{ manifest: AppManifest; component: unknown }> = Array.from(
  byId.values(),
);

export function getApp(id: string): { manifest: AppManifest; component: unknown } | undefined {
  return byId.get(id);
}
