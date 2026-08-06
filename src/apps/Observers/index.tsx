/**
 * Observers app — lists the 11 entries from the Observers REGISTRY.
 *
 * The data is bundled (public/observers.json) so the app boots offline.
 * Each row shows: status (present / to-clone / hosted), local path or URL,
 * and a short description where present.
 *
 * No filesystem calls — the registry is the source of truth, and V1 does not
 * write back to it. Cloning is left to the user via the displayed URL.
 */

import type { ObserverEntry } from '../../types';
import data from '../../observers.json';

const entries = data.entrees as ObserverEntry[];

const STATUS_LABEL: Record<ObserverEntry['status'], string> = {
  presente: 'installé',
  a_cloner: 'à cloner',
  service_heberge: 'hébergé',
};

const STATUS_COLOR: Record<ObserverEntry['status'], string> = {
  presente: 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30',
  a_cloner: 'bg-amber-500/15 text-amber-300 border-amber-500/30',
  service_heberge: 'bg-sky-500/15 text-sky-300 border-sky-500/30',
};

export function ObserversApp() {
  return (
    <div className="flex flex-col h-full text-sm">
      <header className="px-4 py-3 border-b border-white/10 flex items-center justify-between">
        <div>
          <h2 className="font-semibold">Observateurs</h2>
          <p className="text-xs text-[var(--color-text-dim)]">
            {entries.length} entrées — registre du 2026-08-06
          </p>
        </div>
        <div className="text-xs text-[var(--color-text-dim)] font-mono">
          REGISTRY.json
        </div>
      </header>
      <ul className="flex-1 overflow-auto scrollbar">
        {entries.map((e) => (
          <li
            key={e.id}
            className="px-4 py-3 border-b border-white/5 hover:bg-white/[0.03] transition-colors"
          >
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-3 min-w-0">
                <span className="text-lg">◉</span>
                <div className="min-w-0">
                  <div className="font-medium">{e.name}</div>
                  {e.description && (
                    <div className="text-xs text-[var(--color-text-dim)] truncate">
                      {e.description}
                    </div>
                  )}
                </div>
              </div>
              <span
                className={`text-[10px] uppercase tracking-wide px-2 py-1 rounded-full border whitespace-nowrap ${STATUS_COLOR[e.status]}`}
              >
                {STATUS_LABEL[e.status]}
              </span>
            </div>
            <div className="mt-2 grid grid-cols-1 gap-1 text-xs text-[var(--color-text-dim)] font-mono">
              {e.chemin && (
                <div className="truncate">
                  <span className="opacity-60">chemin · </span>
                  {e.chemin}
                </div>
              )}
              {e.depot && (
                <div className="truncate">
                  <span className="opacity-60">dépôt · </span>
                  {e.depot}
                </div>
              )}
              {e.url && (
                <div className="truncate">
                  <span className="opacity-60">url · </span>
                  {e.url}
                </div>
              )}
            </div>
          </li>
        ))}
      </ul>
      <footer className="px-4 py-2 border-t border-white/10 text-xs text-[var(--color-text-dim)]">
        Source : {data.source}
      </footer>
    </div>
  );
}

export const manifest = {
  id: 'observers',
  name: 'Observateurs',
  kind: 'multi' as const,
  description: 'Liste des onze observateurs.',
  icon: '◉',
};
