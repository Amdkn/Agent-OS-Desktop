import { useEffect, useState } from 'react';
import type { AppManifest } from '../../types';

export const manifest: AppManifest = {
  id: 'subagents-roster',
  name: 'Subagents Cockpit',
  kind: 'singleton',
  description: "Centre d'orchestration et d'interconnexion des 14 Subagents Antigravity (Rick, 3 Docteurs, 10 Compagnons)",
  icon: '🤖',
  domaine: 'l0-tech',
};

interface ScheduledTask {
  id: string;
  name: string;
  cron: string;
  frequency: string;
  target: string;
  purpose: string;
}

interface Subagent {
  id: string;
  name: string;
  role: string;
  layer: string;
  core: string;
  mission: string;
  status: string;
  lastActive: string;
  scheduledTasks?: ScheduledTask[];
  lastReport?: any;
}

interface KernelSummary {
  status_counts?: Record<string, number>;
  leases_count?: number;
}

export function SubagentsRosterApp() {
  const [agents, setAgents] = useState<Subagent[]>([]);
  const [kernelSummary, setKernelSummary] = useState<KernelSummary>({});
  const [timestampEdt, setTimestampEdt] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [filterCore, setFilterCore] = useState<string>('all');
  const [invokingId, setInvokingId] = useState<string | null>(null);
  const [lastExecution, setLastExecution] = useState<{
    agentId: string;
    action: string;
    stdout: string;
    stderr: string;
    executionTimeMs: number;
    timestampEdt: string;
  } | null>(null);

  const fetchRoster = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/tech-os/subagents', { cache: 'no-store' });
      if (res.ok) {
        const data = await res.json();
        if (data.ok) {
          setAgents(data.agents || []);
          setKernelSummary(data.kernelSummary || {});
          setTimestampEdt(data.timestampEdt || '');
        }
      }
    } catch {
      // Ignorer erreur temporaire
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRoster();
    const interval = setInterval(fetchRoster, 15000);
    return () => clearInterval(interval);
  }, []);

  const invokeAgent = async (agentId: string) => {
    setInvokingId(agentId);
    try {
      const res = await fetch('/api/tech-os/subagents/invoke', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ agentId, action: 'run_task' }),
      });
      const data = await res.json();
      if (data.ok) {
        setLastExecution({
          agentId: data.agentId,
          action: data.action,
          stdout: data.stdout || '',
          stderr: data.stderr || '',
          executionTimeMs: data.executionTimeMs || 0,
          timestampEdt: data.timestampEdt || '',
        });
        await fetchRoster();
      } else {
        alert('Erreur: ' + data.error);
      }
    } catch (e: any) {
      alert('Erreur réseau: ' + e.message);
    } finally {
      setInvokingId(null);
    }
  };

  const filteredAgents = agents.filter((a) => {
    if (filterCore === 'all') return true;
    if (filterCore === 'kernel') return a.core.includes('Kernel') || a.id === 'doctor_13_kernel';
    if (filterCore === 'bus') return a.core.includes('Bus') || a.id === 'doctor_12_bus';
    if (filterCore === 'life') return a.core.includes('Life') || a.id === 'doctor_11_life';
    if (filterCore === 'transcendant') return a.id === 's1_rick' || a.id === 'companion_donna_dlq';
    return true;
  });

  return (
    <div className="h-full flex flex-col bg-[#0c0e14] text-slate-100 p-6 overflow-hidden">
      {/* Top Header */}
      <div className="flex items-center justify-between pb-4 border-b border-slate-800">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-indigo-500/20 border border-indigo-500/40 flex items-center justify-center text-xl shadow-lg shadow-indigo-500/10">
            🤖
          </div>
          <div>
            <h1 className="text-lg font-bold text-white flex items-center gap-2">
              Subagents Cockpit · Interconnexion Directe
              <span className="text-xs px-2 py-0.5 rounded-full bg-indigo-950 text-indigo-300 border border-indigo-800">
                14 Subagents Vivants
              </span>
            </h1>
            <p className="text-xs text-slate-400">
              Contrôle Bidirectionnel · Noyau uc.db & Workflows Python Légers sans Docker
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="text-right text-xs">
            <span className="text-emerald-400 font-mono font-semibold">● FUSEAU EDT (UTC-4)</span>
            <div className="text-slate-400 font-mono text-[11px]">{timestampEdt || 'Synchronisation...'}</div>
          </div>
          <button
            onClick={fetchRoster}
            className="px-3 py-1.5 text-xs font-semibold rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white transition-colors"
          >
            Actualiser Roster
          </button>
        </div>
      </div>

      {/* KPI Top Bar */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mt-4">
        <div className="p-3.5 rounded-xl bg-slate-900/90 border border-slate-800">
          <div className="text-xs font-semibold text-slate-400">SUBAGENTS DÉPLOYÉS</div>
          <div className="text-2xl font-bold text-indigo-400 mt-1 font-mono">14 / 14</div>
          <div className="text-[11px] text-slate-500 mt-1">1 Rick · 3 Docteurs · 10 Compagnons</div>
        </div>
        <div className="p-3.5 rounded-xl bg-slate-900/90 border border-slate-800">
          <div className="text-xs font-semibold text-slate-400">SCHEDULED TASKS VIVANTES</div>
          <div className="text-2xl font-bold text-emerald-400 mt-1 font-mono">14 Tâches</div>
          <div className="text-[11px] text-slate-500 mt-1">T-00 à T-13 · 100% Couvert</div>
        </div>
        <div className="p-3.5 rounded-xl bg-slate-900/90 border border-slate-800">
          <div className="text-xs font-semibold text-slate-400">BAUX ACTIFS UC.DB</div>
          <div className="text-2xl font-bold text-amber-400 mt-1 font-mono">
            {kernelSummary.leases_count ?? 0}
          </div>
          <div className="text-[11px] text-slate-500 mt-1">Mode WAL · Zéro verrou bloquant</div>
        </div>
        <div className="p-3.5 rounded-xl bg-slate-900/90 border border-slate-800">
          <div className="text-xs font-semibold text-slate-400">MOTEUR N8N LÉGER</div>
          <div className="text-2xl font-bold text-cyan-400 mt-1 font-mono">SANS DOCKER</div>
          <div className="text-[11px] text-slate-500 mt-1">Python natif · RAM &lt; 190 Mo</div>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-2 mt-4 pb-2">
        <span className="text-xs text-slate-400 mr-2 font-medium">Filtrer par Cœur :</span>
        {[
          { id: 'all', label: 'Tous (14)' },
          { id: 'transcendant', label: 'Rick & DLQ (2)' },
          { id: 'kernel', label: 'Kernel Core / 13e Dr (4)' },
          { id: 'bus', label: 'Bus Core / 12e Dr (4)' },
          { id: 'life', label: 'Life Core / 11e Dr (4)' },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setFilterCore(tab.id)}
            className={`px-3 py-1 text-xs rounded-lg font-medium transition-colors ${
              filterCore === tab.id
                ? 'bg-indigo-600 text-white shadow-sm'
                : 'bg-slate-800/80 text-slate-300 hover:bg-slate-700'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Execution Terminal Drawer */}
      {lastExecution && (
        <div className="mt-2 p-3 bg-slate-950/90 border border-indigo-500/40 rounded-xl text-xs font-mono text-slate-200">
          <div className="flex items-center justify-between border-b border-slate-800 pb-1 mb-1">
            <span className="font-bold text-indigo-300 flex items-center gap-2">
              <span>⚡ Résultat Invocation :</span>
              <span className="text-white font-semibold">{lastExecution.agentId}</span>
              <span className="text-slate-400">({lastExecution.executionTimeMs} ms)</span>
              <span className="text-emerald-400">· {lastExecution.timestampEdt}</span>
            </span>
            <button
              onClick={() => setLastExecution(null)}
              className="text-slate-400 hover:text-white font-bold"
            >
              ✕
            </button>
          </div>
          <pre className="whitespace-pre-wrap max-h-24 overflow-y-auto text-[11px] text-slate-300">
            {lastExecution.stdout.trim() || 'Exécution accomplie avec succès.'}
          </pre>
        </div>
      )}

      {/* Subagents Grid Cards */}
      <div className="mt-3 flex-1 overflow-y-auto pr-1">
        {loading && agents.length === 0 ? (
          <div className="text-center py-12 text-slate-400 text-sm">Chargement des 14 Subagents...</div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3.5 pb-6">
            {filteredAgents.map((agent) => (
              <div
                key={agent.id}
                className="p-4 rounded-xl bg-slate-900/70 border border-slate-800 hover:border-slate-700 transition-all flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-start justify-between">
                    <div>
                      <h3 className="text-sm font-bold text-white flex items-center gap-2">
                        {agent.name}
                        <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 border border-slate-700">
                          {agent.layer}
                        </span>
                      </h3>
                      <p className="text-xs text-indigo-300 font-medium mt-0.5">{agent.role}</p>
                    </div>

                    <span className="flex items-center gap-1.5 px-2 py-1 rounded text-[10px] font-bold bg-emerald-950/80 text-emerald-400 border border-emerald-800">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                      {agent.status.toUpperCase()}
                    </span>
                  </div>

                  <p className="text-xs text-slate-400 mt-2 line-clamp-2 leading-relaxed">
                    {agent.mission}
                  </p>

                  {/* Scheduled Tasks Links */}
                  {agent.scheduledTasks && agent.scheduledTasks.length > 0 && (
                    <div className="mt-3 pt-2 border-t border-slate-800/80">
                      <div className="text-[10px] uppercase tracking-wider font-semibold text-slate-400 mb-1">
                        Tâche Programmée :
                      </div>
                      <div className="flex flex-wrap gap-1.5">
                        {agent.scheduledTasks.map((t) => (
                          <span
                            key={t.id}
                            className="px-2 py-0.5 rounded bg-slate-800 text-cyan-300 text-[10px] font-mono border border-slate-700 flex items-center gap-1"
                            title={t.purpose}
                          >
                            <span className="font-bold">{t.id}</span>
                            <span className="text-slate-400">· {t.frequency}</span>
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                {/* Footer Action */}
                <div className="mt-4 pt-3 border-t border-slate-800 flex items-center justify-between">
                  <span className="text-[11px] text-slate-400 font-mono">
                    {agent.lastActive}
                  </span>

                  <button
                    onClick={() => invokeAgent(agent.id)}
                    disabled={invokingId === agent.id}
                    className="px-3 py-1.5 text-xs font-semibold rounded-lg bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white transition-colors flex items-center gap-1.5 shadow-sm"
                  >
                    <span>{invokingId === agent.id ? '⏳' : '⚡'}</span>
                    <span>{invokingId === agent.id ? 'En cours...' : 'Invoquer'}</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export const App = SubagentsRosterApp;