import { useState } from 'react';
import type { BlueprintAction } from './types';

interface ActionConsoleProps {
  actions: BlueprintAction[];
}

interface ActionLog {
  id: string;
  actionLabel: string;
  status: 'running' | 'success' | 'error';
  timestamp: string;
  message: string;
  durationMs?: number;
}

export function ActionConsole({ actions }: ActionConsoleProps) {
  const [logs, setLogs] = useState<ActionLog[]>([]);
  const [runningId, setRunningId] = useState<string | null>(null);

  const executeAction = async (act: BlueprintAction) => {
    if (runningId) return;
    const start = performance.now();
    const logId = crypto.randomUUID();
    const nowStr = new Date().toLocaleTimeString('fr-FR');

    setRunningId(act.id);
    setLogs((prev) => [
      {
        id: logId,
        actionLabel: act.label,
        status: 'running',
        timestamp: nowStr,
        message: `Exécution initiée : ${act.verb} ${act.endpoint ?? 'action locale'}...`,
      },
      ...prev,
    ]);

    try {
      if (act.handler) {
        const res = await act.handler();
        const duration = Math.round(performance.now() - start);
        setLogs((prev) =>
          prev.map((l) =>
            l.id === logId
              ? {
                  ...l,
                  status: res.success ? 'success' : 'error',
                  message: `${res.message} (${duration} ms)`,
                  durationMs: duration,
                }
              : l
          )
        );
      } else if (act.endpoint) {
        const resp = await fetch(act.endpoint, { method: 'GET' }).catch(() => null);
        const duration = Math.round(performance.now() - start);
        if (resp && resp.ok) {
          setLogs((prev) =>
            prev.map((l) =>
              l.id === logId
                ? {
                    ...l,
                    status: 'success',
                    message: `Succès HTTP ${resp.status} (${duration} ms)`,
                    durationMs: duration,
                  }
                : l
            )
          );
        } else {
          setLogs((prev) =>
            prev.map((l) =>
              l.id === logId
                ? {
                    ...l,
                    status: 'error',
                    message: `Erreur appel ${act.endpoint} (${duration} ms)`,
                    durationMs: duration,
                  }
                : l
            )
          );
        }
      } else {
        await new Promise((r) => setTimeout(r, 600));
        const duration = Math.round(performance.now() - start);
        setLogs((prev) =>
          prev.map((l) =>
            l.id === logId
              ? {
                  ...l,
                  status: 'success',
                  message: `Action ${act.label} complétée (${duration} ms)`,
                  durationMs: duration,
                }
              : l
          )
        );
      }
    } catch (err) {
      const duration = Math.round(performance.now() - start);
      setLogs((prev) =>
        prev.map((l) =>
          l.id === logId
            ? {
                ...l,
                status: 'error',
                message: `Exception : ${String(err)} (${duration} ms)`,
                durationMs: duration,
              }
            : l
        )
      );
    } finally {
      setRunningId(null);
    }

  };

  return (
    <div className="flex flex-col gap-4 p-4 rounded-xl border border-white/10 bg-slate-900/60 backdrop-blur-md shadow-xl">
      <div className="flex items-center justify-between">
        <h3 className="text-xs font-semibold text-[var(--color-text)] uppercase tracking-wider font-mono">
          Console d'Exécution & Actions N6
        </h3>

        <span className="text-[10px] font-mono text-[var(--color-text-dim)]">
          {actions.length} action{actions.length > 1 ? 's' : ''} disponible{actions.length > 1 ? 's' : ''}
        </span>
      </div>

      {/* Grille des actions */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
        {actions.map((act) => {
          const isRunning = runningId === act.id;
          return (
            <div
              key={act.id}
              className="p-3 rounded-lg border border-white/10 bg-black/40 flex items-center justify-between gap-3 hover:border-white/20 transition-all"
            >
              <div className="flex flex-col gap-0.5 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-medium text-slate-200 truncate">
                    {act.label}
                  </span>
                  <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-white/10 text-[var(--color-accent)] uppercase">
                    {act.verb}
                  </span>
                </div>
                <span className="text-[11px] text-[var(--color-text-dim)] truncate">
                  {act.description}
                </span>
              </div>

              <button
                onClick={() => executeAction(act)}
                disabled={runningId !== null}
                className="px-3 py-1.5 rounded bg-[var(--color-accent)] text-black font-semibold text-xs disabled:opacity-40 hover:brightness-110 transition-all shrink-0 flex items-center gap-1.5 shadow-sm"
              >
                {isRunning ? (
                  <>
                    <span className="animate-spin text-xs">↻</span>
                    <span>En cours</span>
                  </>
                ) : (
                  <>
                    <span>⚡</span>
                    <span>Lancer</span>
                  </>
                )}
              </button>
            </div>
          );
        })}
      </div>

      {/* Journal d'exécution (Terminal) */}
      <div className="rounded-lg border border-white/10 bg-black/70 p-3 flex flex-col gap-2 font-mono text-xs">
        <div className="flex items-center justify-between border-b border-white/10 pb-1.5 text-[10px] text-[var(--color-text-dim)]">
          <span>Journal d'exécution en direct</span>
          {logs.length > 0 && (
            <button
              onClick={() => setLogs([])}
              className="hover:text-white transition-colors underline"
            >
              Effacer les logs
            </button>
          )}
        </div>

        <div className="max-h-48 overflow-y-auto scrollbar flex flex-col gap-1.5 text-[11px]">
          {logs.length === 0 ? (
            <div className="text-[var(--color-text-dim)] py-4 text-center">
              En attente d'action. Cliquez sur « Lancer » ci-dessus.
            </div>

          ) : (
            logs.map((l) => (
              <div key={l.id} className="flex items-start gap-2">
                <span className="text-[var(--color-text-dim)] shrink-0">[{l.timestamp}]</span>
                <span
                  className={`font-semibold shrink-0 ${
                    l.status === 'success'
                      ? 'text-emerald-400'
                      : l.status === 'error'
                      ? 'text-rose-400'
                      : 'text-amber-400'
                  }`}
                >
                  {l.status === 'success' ? '✓ OK' : l.status === 'error' ? '✗ ERR' : '⏳ RUN'}
                </span>

                <span className="text-slate-300 break-all">{l.message}</span>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
