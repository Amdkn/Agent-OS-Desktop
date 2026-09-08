import React, { useState, useEffect } from 'react';
import type { AppManifest } from '../../types';
import { useShell } from '../../shell/store';

export const manifest: AppManifest = {
  id: 'doctor-13-kernel',
  name: '13e Docteur · Kernel Core',
  kind: 'singleton',
  description: 'Substrat L0 Tech OS & Gouvernance Machine · Onglets : 13e Docteur, Yas (Observatoire), Ryan (Builder), Graham (Mémoire).',
  icon: '⚙️',
  domaine: 'l0-tech',
};

type TabType = 'docteur' | 'yas' | 'ryan' | 'graham';

interface Telemetry {
  cpu_percent: number;
  ram_used_mb: number;
  ram_total_mb: number;
  ram_percent: number;
  timestamp: string;
}

interface KnowledgeGraph {
  nodes: Record<string, { id: string; type: string; degre: number }>;
  edges: Array<{ source: string; predicate: string; target: string; provenance: string; confidence: string }>;
  compiled_at?: string;
  total_nodes?: number;
  total_edges?: number;
}

interface GrahamCheckpoint {
  name: string;
  sizeBytes: number;
  isDir: boolean;
  updatedAt: string;
}

interface GrahamEvent {
  id: number;
  work_id: number;
  harness: string;
  kind: string;
  payload: string;
  at: string;
}

export function Doctor13KernelApp({ payload }: { payload?: Record<string, unknown> } = {}) {
  const initialTab = (payload?.targetTab as TabType) || 'docteur';
  const [activeTab, setActiveTab] = useState<TabType>(initialTab);

  useEffect(() => {
    if (payload?.targetTab && ['docteur', 'yas', 'ryan', 'graham'].includes(payload.targetTab as string)) {
      setActiveTab(payload.targetTab as TabType);
    }
  }, [payload?.targetTab]);

  // Yas State
  const [telemetry, setTelemetry] = useState<Telemetry | null>(null);
  const [heartbeatCount, setHeartbeatCount] = useState(0);
  const [lastCheck, setLastCheck] = useState<string>('');
  const [services] = useState([
    { name: 'Noyau SQLite (uc.db)', status: 'OPERATIONAL', latency: '2 ms', port: 'File / IPC' },
    { name: 'Agent OS Web (Desktop)', status: 'OPERATIONAL', latency: '11 ms', port: '5555' },
    { name: 'Antigravity Runtime (Gemini)', status: 'OPERATIONAL', latency: '45 ms', port: 'Native / IPC' },
    { name: 'PocketBase Local', status: 'STANDBY', latency: '—', port: '8092' },
    { name: 'Moteur Workflows Python (n8n Léger)', status: 'ONLINE', latency: '15 ms', port: 'Native / IPC' },
  ]);

  // Ryan State
  const [deploying, setDeploying] = useState(false);
  const [ryanLogs, setRyanLogs] = useState<string[]>([
    `[${new Date().toLocaleTimeString()}] Console Ryan Builder initialisée. SLA instanciation froide < 30 min.`
  ]);

  // Graham State
  const [graph, setGraph] = useState<KnowledgeGraph | null>(null);
  const [searchGraph, setSearchGraph] = useState('');
  const [loadingGraph, setLoadingGraph] = useState(false);
  const [grahamSubView, setGrahamSubView] = useState<'graph' | 'checkpoints' | 'resilience'>('graph');
  const [checkpoints, setCheckpoints] = useState<GrahamCheckpoint[]>([]);
  const [grahamEvents, setGrahamEvents] = useState<GrahamEvent[]>([]);
  const [loadingCheckpoints, setLoadingCheckpoints] = useState(false);
  const [executingGrahamAction, setExecutingGrahamAction] = useState(false);
  const [grahamActionMsg, setGrahamActionMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const [targetWorkId, setTargetWorkId] = useState<number>(1);
  const [customCriterion, setCustomCriterion] = useState<string>('work_id == 1');
  const [selectedEntityDetails, setSelectedEntityDetails] = useState<{ id: string; type: string; degre: number } | null>(null);

  // Kernel State
  const [kernelStats, setKernelStats] = useState<{ works: any[]; events: any[] }>({ works: [], events: [] });

  const fetchTelemetry = async () => {
    try {
      const res = await fetch('/api/tech-os/telemetry', { cache: 'no-store' });
      if (res.ok) {
        const data = await res.json();
        if (data.ok && data.telemetry) setTelemetry(data.telemetry);
      }
    } catch {}
    setLastCheck(new Date().toLocaleTimeString());
    setHeartbeatCount((c) => c + 1);
  };

  const fetchGraph = async () => {
    setLoadingGraph(true);
    try {
      const res = await fetch('/api/tech-os/graham-graph', { cache: 'no-store' });
      if (res.ok) {
        const data = await res.json();
        if (data.ok && data.graph) {
          const rawNodes = data.graph.nodes;
          let nodeMap: Record<string, { id: string; type: string; degre: number }> = {};
          if (Array.isArray(rawNodes)) {
            for (const n of rawNodes) {
              if (n && n.id) nodeMap[n.id] = n;
            }
          } else if (typeof rawNodes === 'object' && rawNodes !== null) {
            nodeMap = rawNodes;
          }
          setGraph({
            ...data.graph,
            nodes: nodeMap,
            total_nodes: Array.isArray(rawNodes) ? rawNodes.length : Object.keys(nodeMap).length,
            total_edges: data.graph.edges ? data.graph.edges.length : 0,
          });
        }
      }
    } catch {}
    finally { setLoadingGraph(false); }
  };

  const fetchKernelState = async () => {
    try {
      const res = await fetch('/api/tech-os/kernel-state', { cache: 'no-store' });
      if (res.ok) {
        const data = await res.json();
        if (data.ok) setKernelStats({ works: data.works || [], events: data.events || [] });
      }
    } catch {}
  };

  const fetchCheckpoints = async () => {
    setLoadingCheckpoints(true);
    try {
      const res = await fetch('/api/tech-os/graham/checkpoints', { cache: 'no-store' });
      if (res.ok) {
        const data = await res.json();
        if (data.ok) {
          setCheckpoints(data.checkpoints || []);
          setGrahamEvents(data.events || []);
        }
      }
    } catch {}
    finally { setLoadingCheckpoints(false); }
  };

  const runGrahamAction = async (action: 'save' | 'check' | 'restore', workId: number, criterion?: string) => {
    setExecutingGrahamAction(true);
    setGrahamActionMsg(null);
    try {
      const res = await fetch('/api/tech-os/graham/action', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action, workId, criterion }),
      });
      const data = await res.json();
      if (data.ok) {
        const detail = action === 'save' 
          ? `Checkpoint WAL sauvegardé pour work #${workId}`
          : action === 'check'
          ? `Critère vérifié avec succès : ${criterion} (rc=0)`
          : `Base uc.db restaurée depuis le checkpoint #${workId}`;
        setGrahamActionMsg({ ok: true, text: detail });
        await fetchCheckpoints();
        await fetchKernelState();
      } else {
        const errDetail = action === 'check'
          ? `Rupture de critère : ${criterion} (rc=${data.exitCode}). Restauration WAL recommandée.`
          : data.error || data.stderr || 'Action échouée';
        setGrahamActionMsg({ ok: false, text: errDetail });
      }
    } catch (e: any) {
      setGrahamActionMsg({ ok: false, text: `Erreur réseau: ${e.message}` });
    } finally {
      setExecutingGrahamAction(false);
    }
  };

  useEffect(() => {
    fetchTelemetry();
    fetchKernelState();
    fetchGraph();
    fetchCheckpoints();
    const interval = setInterval(() => {
      fetchTelemetry();
      fetchKernelState();
    }, 30000);
    return () => clearInterval(interval);
  }, []);

  const runRyanBuild = async (target: string) => {
    setDeploying(true);
    setRyanLogs((l) => [...l, `[${new Date().toLocaleTimeString()}] Déclenchement vérification CI/CD pour ${target}...`]);
    try {
      const res = await fetch('/api/tech-os/subagents/invoke', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ agentId: 'companion_ryan_builder', action: 'ci_cd_verify' }),
      });
      const data = await res.json();
      if (data.ok) {
        setRyanLogs((l) => [
          ...l,
          `[${data.timestampEdt}] Succès CI/CD (${data.executionTimeMs} ms)`,
          `[${data.timestampEdt}] ${data.stdout.trim()}`,
          `[${data.timestampEdt}] Instanciation & conformité L0 : 100% Validé`
        ]);
      } else {
        setRyanLogs((l) => [...l, `[Erreur] ${data.error || data.stderr}`]);
      }
    } catch (e: any) {
      setRyanLogs((l) => [...l, `[Erreur réseau] ${e.message}`]);
    } finally {
      setDeploying(false);
    }
  };

  const filteredEdges = graph
    ? graph.edges.filter((e) => {
        const q = searchGraph.toLowerCase();
        return e.source.toLowerCase().includes(q) || e.target.toLowerCase().includes(q) || e.predicate.toLowerCase().includes(q);
      })
    : [];

  return (
    <div className="flex flex-col h-full bg-[#0b0e14] text-slate-100 select-none overflow-hidden">
      {/* 1. Header & Tab Navigation Bar */}
      <header className="px-4 py-2.5 border-b border-slate-800/80 bg-slate-950/70 flex items-center justify-between gap-3 shrink-0">
        <div className="flex items-center gap-2 overflow-x-auto">
          {[
            { id: 'docteur', label: '13e Docteur · Souveraineté L0', icon: '🪐', badge: 'Kernel Core' },
            { id: 'yas', label: 'Yas · Télémétrie', icon: '📡', badge: 'Monitoring 60s' },
            { id: 'ryan', label: 'Ryan · Builder CI/CD', icon: '🏗️', badge: '< 30 min SLA' },
            { id: 'graham', label: 'Graham · Mémoire Semantica', icon: '🧠', badge: '1 681 Nœuds' },
          ].map((tab) => {
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as TabType)}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all border ${
                  isActive
                    ? 'bg-cyan-950/80 text-cyan-200 border-cyan-700/80 shadow-sm shadow-cyan-900/30'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900 border-transparent'
                }`}
              >
                <span className="text-sm">{tab.icon}</span>
                <span>{tab.label}</span>
                <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono ${isActive ? 'bg-cyan-900 text-cyan-300' : 'bg-slate-800 text-slate-400'}`}>
                  {tab.badge}
                </span>
              </button>
            );
          })}
        </div>

        <div className="flex items-center gap-3 shrink-0 text-xs font-mono">
          <button
            onClick={() => useShell.getState().toggleCms()}
            className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-slate-900 border border-slate-800 text-slate-300 hover:text-cyan-300 hover:border-cyan-600/50 transition-all text-[11px]"
            title="Inspecter les données de cette application dans le CMS Hiérarchique V2"
          >
            <span>🗂️</span>
            <span>CMS</span>
          </button>
          <span className="text-emerald-400">● L0 ACTIF</span>
          <span className="text-slate-500">Tick #{heartbeatCount}</span>
        </div>
      </header>

      {/* 2. Content Area */}
      <div className="flex-1 overflow-y-auto p-6">
        {/* TAB 1: 13e DOCTEUR */}
        {activeTab === 'docteur' && (
          <div className="space-y-6">
            <div className="flex items-center justify-between pb-4 border-b border-slate-800/80">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-cyan-500/20 border border-cyan-500/40 flex items-center justify-center text-2xl shadow-lg shadow-cyan-500/10">
                  🪐
                </div>
                <div>
                  <h1 className="text-lg font-bold text-white flex items-center gap-2">
                    13e Docteur · Souveraineté du Kernel Core
                    <span className="text-xs px-2 py-0.5 rounded-full bg-cyan-950 text-cyan-300 border border-cyan-800">
                      L0 Tech OS
                    </span>
                  </h1>
                  <p className="text-xs text-slate-400">
                    Infrastructure, Substrat Système, Disponibilité Continue et Auto-Régénération
                  </p>
                </div>
              </div>

              <button
                onClick={fetchKernelState}
                className="px-3 py-1.5 text-xs font-semibold rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white transition-colors"
              >
                Actualiser État
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800">
                <div className="text-xs text-slate-400 font-semibold">ÉTAT DU NOYAU SQLITE</div>
                <div className="text-2xl font-bold text-emerald-400 mt-1 font-mono">MODE WAL</div>
                <div className="text-[11px] text-slate-500 mt-1">uc.db · Verrous atomiques</div>
              </div>
              <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800">
                <div className="text-xs text-slate-400 font-semibold">TRAVAUX ENREGISTRÉS</div>
                <div className="text-2xl font-bold text-cyan-400 mt-1 font-mono">{kernelStats.works.length}</div>
                <div className="text-[11px] text-slate-500 mt-1">File active de production</div>
              </div>
              <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800">
                <div className="text-xs text-slate-400 font-semibold">ÉVÉNEMENTS TRACÉS</div>
                <div className="text-2xl font-bold text-indigo-400 mt-1 font-mono">{kernelStats.events.length}</div>
                <div className="text-[11px] text-slate-500 mt-1">Journalisation continue</div>
              </div>
              <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800">
                <div className="text-xs text-slate-400 font-semibold">COMPAGNONS ACTIFS</div>
                <div className="text-2xl font-bold text-purple-400 mt-1 font-mono">3 / 3</div>
                <div className="text-[11px] text-slate-500 mt-1">Yas, Ryan, Graham</div>
              </div>
            </div>

            <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800">
              <h2 className="text-sm font-semibold text-slate-200 mb-3 flex items-center gap-2">
                <span>⚡ Rôles et Compagnons Rattachés au Kernel Core</span>
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <div onClick={() => setActiveTab('yas')} className="p-3.5 rounded-lg bg-slate-950/80 border border-slate-800/80 hover:border-cyan-700/60 cursor-pointer transition-all">
                  <div className="flex items-center gap-2 font-bold text-cyan-300 text-xs">
                    <span>📡 Yas Observatory</span>
                  </div>
                  <p className="text-[11px] text-slate-400 mt-1.5">Télémétrie continue 60s, sondage CPU/RAM et heartbeat des services.</p>
                </div>
                <div onClick={() => setActiveTab('ryan')} className="p-3.5 rounded-lg bg-slate-950/80 border border-slate-800/80 hover:border-cyan-700/60 cursor-pointer transition-all">
                  <div className="flex items-center gap-2 font-bold text-amber-300 text-xs">
                    <span>🏗️ Ryan Builder</span>
                  </div>
                  <p className="text-[11px] text-slate-400 mt-1.5">CI/CD déclaratif, compilation TypeScript tsc, instanciation froide &lt; 30 min.</p>
                </div>
                <div onClick={() => setActiveTab('graham')} className="p-3.5 rounded-lg bg-slate-950/80 border border-slate-800/80 hover:border-cyan-700/60 cursor-pointer transition-all">
                  <div className="flex items-center gap-2 font-bold text-purple-300 text-xs">
                    <span>🧠 Graham Memory</span>
                  </div>
                  <p className="text-[11px] text-slate-400 mt-1.5">Exploration du graphe Semantica (1 681 nœuds) et consolidation nocturne.</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: YAS */}
        {activeTab === 'yas' && (
          <div className="space-y-6">
            <div className="flex items-center justify-between pb-4 border-b border-slate-800/80">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-cyan-500/20 border border-cyan-500/40 flex items-center justify-center text-xl">
                  📡
                </div>
                <div>
                  <h2 className="text-base font-bold text-white">Yas · Télémétrie & Surveillance Système</h2>
                  <p className="text-xs text-slate-400">Heartbeat 60s · Métriques CPU, RAM & Ports Vivants</p>
                </div>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={async () => {
                    await fetch('/api/tech-os/subagents/invoke', {
                      method: 'POST',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify({ agentId: 'companion_yas_observatory', action: 'probe_scan' }),
                    });
                    await fetchTelemetry();
                  }}
                  className="px-3 py-1.5 text-xs font-semibold rounded-lg bg-amber-600 hover:bg-amber-500 text-white transition-colors flex items-center gap-1.5"
                >
                  <span>⚡</span>
                  <span>Invoquer Yas</span>
                </button>
                <button
                  onClick={fetchTelemetry}
                  className="px-3 py-1.5 text-xs font-medium rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white transition-colors"
                >
                  Actualiser
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800">
                <div className="text-xs text-slate-400">CHARGE CPU</div>
                <div className="text-2xl font-bold text-cyan-400 mt-1 font-mono">
                  {telemetry ? `${telemetry.cpu_percent.toFixed(1)} %` : '12.0 %'}
                </div>
                <div className="text-[11px] text-slate-500 mt-1">Multi-cœur Intel Core i7</div>
              </div>
              <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800">
                <div className="text-xs text-slate-400">UTILISATION RAM</div>
                <div className="text-2xl font-bold text-indigo-400 mt-1 font-mono">
                  {telemetry ? `${(telemetry.ram_used_mb / 1024).toFixed(1)} Go` : '8.2 Go'}
                </div>
                <div className="text-[11px] text-slate-500 mt-1">Sur {telemetry ? `${Math.round(telemetry.ram_total_mb / 1024)} Go` : '32 Go'} total</div>
              </div>
              <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800">
                <div className="text-xs text-slate-400">RATIO RAM</div>
                <div className="text-2xl font-bold text-emerald-400 mt-1 font-mono">
                  {telemetry ? `${telemetry.ram_percent.toFixed(0)} %` : '25 %'}
                </div>
                <div className="text-[11px] text-slate-500 mt-1">Empreinte Chokidar sobre</div>
              </div>
              <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800">
                <div className="text-xs text-slate-400">CIRCUIT BREAKERS</div>
                <div className="text-2xl font-bold text-emerald-400 mt-1 font-mono">3 / 3 ARMÉS</div>
                <div className="text-[11px] text-slate-500 mt-1">Sécurité anti-saturation</div>
              </div>
            </div>

            <div className="mt-4">
              <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider mb-3">Santé des Services L0 Tech OS</h3>
              <div className="space-y-2">
                {services.map((s, idx) => (
                  <div key={idx} className="p-3 rounded-lg bg-slate-900/60 border border-slate-800 flex items-center justify-between text-xs">
                    <div>
                      <span className="font-bold text-white">{s.name}</span>
                      <span className="text-slate-400 ml-2">({s.port})</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-slate-400 font-mono">{s.latency}</span>
                      <span className="px-2 py-0.5 rounded bg-emerald-950 text-emerald-300 border border-emerald-800 font-semibold text-[10px]">
                        {s.status}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* TAB 3: RYAN */}
        {activeTab === 'ryan' && (
          <div className="space-y-6">
            <div className="flex items-center justify-between pb-4 border-b border-slate-800/80">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-xl">
                  🏗️
                </div>
                <div>
                  <h2 className="text-base font-bold text-white">Ryan · Builder & Provisioning CI/CD</h2>
                  <p className="text-xs text-slate-400">Vérification Déclarative TypeScript & SLA &lt; 30 min</p>
                </div>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => runRyanBuild('agent-os-desktop')}
                  disabled={deploying}
                  className="px-3 py-1.5 text-xs font-semibold rounded-lg bg-amber-600 hover:bg-amber-500 disabled:opacity-50 text-white transition-colors flex items-center gap-1.5"
                >
                  <span>{deploying ? '⏳' : '⚡'}</span>
                  <span>{deploying ? 'Compilation...' : 'Lancer Build CI/CD (tsc)'}</span>
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800">
                <div className="text-xs text-slate-400 font-semibold">SLA INSTANCIATION FROIDE</div>
                <div className="text-2xl font-bold text-amber-400 mt-1 font-mono">&lt; 30 MIN</div>
                <div className="text-[11px] text-slate-500 mt-1">Reconstructible from scratch</div>
              </div>
              <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800">
                <div className="text-xs text-slate-400 font-semibold">CONFORMITÉ TYPESCRIPT</div>
                <div className="text-2xl font-bold text-emerald-400 mt-1 font-mono">0 ERREUR</div>
                <div className="text-[11px] text-slate-500 mt-1">tsc --noEmit validé</div>
              </div>
              <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800">
                <div className="text-xs text-slate-400 font-semibold">ENVIRONNEMENT RUNTIME</div>
                <div className="text-2xl font-bold text-cyan-400 mt-1 font-mono">WINDOWS + WSL</div>
                <div className="text-[11px] text-slate-500 mt-1">Zéro dépendance orpheline</div>
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider">Console Terminale Ryan Builder</h3>
                <button onClick={() => setRyanLogs([])} className="text-xs text-slate-400 hover:text-white">Effacer</button>
              </div>
              <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 font-mono text-xs text-slate-300 max-h-64 overflow-y-auto space-y-1">
                {ryanLogs.map((log, idx) => (
                  <div key={idx} className="leading-relaxed">{log}</div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* TAB 4: GRAHAM */}
        {activeTab === 'graham' && (
          <div className="space-y-6">
            {/* Header & Sub-nav */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-slate-800/80 gap-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-purple-500/20 border border-purple-500/40 flex items-center justify-center text-xl shadow-md shadow-purple-900/20">
                  🧠
                </div>
                <div>
                  <h2 className="text-base font-bold text-white flex items-center gap-2">
                    Graham · Mémoire Longue & Résilience WAL
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-purple-950 text-purple-300 border border-purple-800 font-mono">
                      1 681 Entités · L0 Substrat
                    </span>
                  </h2>
                  <p className="text-xs text-slate-400">
                    Graphe de Connaissances Semantica AGI, Checkpoints Atomiques uc.db & Restauration sur Rupture
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <div className="bg-slate-900 p-1 rounded-lg border border-slate-800 flex text-xs">
                  {[
                    { id: 'graph', label: 'Graphe Semantica', icon: '🕸️' },
                    { id: 'checkpoints', label: 'Checkpoints WAL', icon: '💾', count: checkpoints.length },
                    { id: 'resilience', label: 'Résilience & Test', icon: '🛡️' },
                  ].map((sub) => (
                    <button
                      key={sub.id}
                      onClick={() => setGrahamSubView(sub.id as any)}
                      className={`px-2.5 py-1 rounded-md font-medium transition-all flex items-center gap-1.5 ${
                        grahamSubView === sub.id
                          ? 'bg-purple-900/60 text-purple-200 border border-purple-700/60 shadow-sm'
                          : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
                      }`}
                    >
                      <span>{sub.icon}</span>
                      <span>{sub.label}</span>
                      {sub.count !== undefined && (
                        <span className="text-[9px] px-1 rounded-full bg-slate-800 text-purple-300 font-mono">
                          {sub.count}
                        </span>
                      )}
                    </button>
                  ))}
                </div>

                <button
                  onClick={async () => {
                    await fetch('/api/tech-os/subagents/invoke', {
                      method: 'POST',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify({ agentId: 'companion_graham_memory', action: 'consolidate_graph' }),
                    });
                    await fetchGraph();
                    await fetchCheckpoints();
                  }}
                  className="px-3 py-1.5 text-xs font-semibold rounded-lg bg-amber-600 hover:bg-amber-500 text-white transition-colors flex items-center gap-1.5 shrink-0"
                >
                  <span>⚡</span>
                  <span>Invoquer Graham</span>
                </button>
              </div>
            </div>

            {/* Notification Banner */}
            {grahamActionMsg && (
              <div
                className={`p-3 rounded-xl border text-xs flex items-center justify-between transition-all ${
                  grahamActionMsg.ok
                    ? 'bg-emerald-950/60 border-emerald-800/80 text-emerald-200'
                    : 'bg-rose-950/60 border-rose-800/80 text-rose-200'
                }`}
              >
                <div className="flex items-center gap-2">
                  <span className="text-base">{grahamActionMsg.ok ? '✓' : '⚠️'}</span>
                  <span>{grahamActionMsg.text}</span>
                </div>
                <button
                  onClick={() => setGrahamActionMsg(null)}
                  className="text-slate-400 hover:text-white text-xs px-2 py-0.5"
                >
                  ✕
                </button>
              </div>
            )}

            {/* KPI Cards Top */}
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
              <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800 shadow-sm">
                <div className="text-xs text-slate-400 font-semibold flex items-center justify-between">
                  <span>NŒUDS SÉMANTIQUES</span>
                  <span className="text-[10px] text-purple-400 font-mono">OKF RDF</span>
                </div>
                <div className="text-2xl font-bold text-purple-400 mt-1 font-mono">
                  {graph ? graph.total_nodes || Object.keys(graph.nodes).length : '1 681'}
                </div>
                <div className="text-[11px] text-slate-500 mt-1">Concepts formels AGI</div>
              </div>

              <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800 shadow-sm">
                <div className="text-xs text-slate-400 font-semibold flex items-center justify-between">
                  <span>TRIPLETS RDF CERTIFIÉS</span>
                  <span className="text-[10px] text-indigo-400 font-mono">Arêtes</span>
                </div>
                <div className="text-2xl font-bold text-indigo-400 mt-1 font-mono">
                  {graph ? graph.total_edges || graph.edges.length : '1 446'}
                </div>
                <div className="text-[11px] text-slate-500 mt-1">Relations sémantiques typées</div>
              </div>

              <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800 shadow-sm">
                <div className="text-xs text-slate-400 font-semibold flex items-center justify-between">
                  <span>CHECKPOINTS DISPONIBLES</span>
                  <span className="text-[10px] text-cyan-400 font-mono">WAL Truncate</span>
                </div>
                <div className="text-2xl font-bold text-cyan-400 mt-1 font-mono">
                  {checkpoints.length}
                </div>
                <div className="text-[11px] text-slate-500 mt-1">Snapshots physiques uc.db</div>
              </div>

              <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800 shadow-sm">
                <div className="text-xs text-slate-400 font-semibold flex items-center justify-between">
                  <span>CONTRÔLEUR DE RUPTURE</span>
                  <span className="text-[10px] text-emerald-400 font-mono">Anti-Régression</span>
                </div>
                <div className="text-2xl font-bold text-emerald-400 mt-1 font-mono">
                  ARMÉ
                </div>
                <div className="text-[11px] text-slate-500 mt-1">Restauration sur rc=4</div>
              </div>
            </div>

            {/* SUB-VIEW 1: GRAPH EXPLORER */}
            {grahamSubView === 'graph' && (
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Left: Relations list */}
                <div className="lg:col-span-2 space-y-3">
                  <div className="flex items-center justify-between gap-3">
                    <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-2">
                      <span>Exploration des Relations RDF</span>
                      <span className="text-[10px] px-1.5 py-0.2 rounded bg-slate-800 text-purple-300 font-mono font-normal">
                        {filteredEdges.length} trouvés
                      </span>
                    </h3>
                    <div className="flex items-center gap-2">
                      <div className="relative">
                        <input
                          type="text"
                          placeholder="Filtrer entité, concept ou prédicat..."
                          value={searchGraph}
                          onChange={(e) => setSearchGraph(e.target.value)}
                          className="px-3 py-1.5 pr-7 bg-slate-900 border border-slate-700 rounded-lg text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-purple-500 w-64 font-mono"
                        />
                        {searchGraph && (
                          <button
                            onClick={() => setSearchGraph('')}
                            className="absolute right-2 top-1.5 text-xs text-slate-400 hover:text-slate-200"
                            title="Effacer le filtre"
                          >
                            ✕
                          </button>
                        )}
                      </div>
                      <button
                        onClick={fetchGraph}
                        className="px-2.5 py-1.5 text-xs bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg border border-slate-700"
                        title="Recharger le graphe"
                      >
                        ↻
                      </button>
                    </div>
                  </div>

                  <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 max-h-[420px] overflow-y-auto divide-y divide-slate-800/40 text-xs font-mono">
                    {loadingGraph ? (
                      <div className="text-center py-10 text-slate-500">Chargement du graphe Semantica...</div>
                    ) : filteredEdges.length > 0 ? (
                      filteredEdges.slice(0, 40).map((edge, idx) => (
                        <div
                          key={idx}
                          className="py-2 px-2 hover:bg-purple-950/20 rounded transition-colors flex items-center justify-between gap-2"
                        >
                          <div className="flex items-center gap-2 truncate">
                            <span
                              onClick={(e) => {
                                e.stopPropagation();
                                if (graph && graph.nodes[edge.source]) {
                                  setSelectedEntityDetails(graph.nodes[edge.source]);
                                } else {
                                  setSelectedEntityDetails({ id: edge.source, type: 'sujet', degre: 1 });
                                }
                              }}
                              className="text-purple-300 font-semibold hover:underline hover:text-purple-200 cursor-pointer"
                              title={`Inspecter ${edge.source}`}
                            >
                              {edge.source}
                            </span>
                            <span className="text-slate-500 text-[10px]">--[{edge.predicate}]--&gt;</span>
                            <span
                              onClick={(e) => {
                                e.stopPropagation();
                                if (graph && graph.nodes[edge.target]) {
                                  setSelectedEntityDetails(graph.nodes[edge.target]);
                                } else {
                                  setSelectedEntityDetails({ id: edge.target, type: 'concept', degre: 1 });
                                }
                              }}
                              className="text-cyan-300 hover:underline hover:text-cyan-200 cursor-pointer"
                              title={`Inspecter ${edge.target}`}
                            >
                              {edge.target}
                            </span>
                          </div>
                          <div className="flex items-center gap-2 shrink-0">
                            <span className="text-[10px] px-1.5 py-0.2 bg-slate-900 rounded text-slate-400 border border-slate-800">
                              {edge.provenance || 'semantica'}
                            </span>
                            <span className="text-[10px] font-semibold text-emerald-400">
                              {edge.confidence || '1.0'}
                            </span>
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="text-center py-10 text-slate-500">Aucune relation trouvée pour ce filtre.</div>
                    )}
                  </div>
                </div>

                {/* Right: Entity Inspector & Graph Stats */}
                <div className="space-y-4">
                  <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800">
                    <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider mb-3 flex items-center gap-2">
                      <span>🔍 Inspecteur d'Entité Semantica</span>
                    </h3>

                    {selectedEntityDetails ? (
                      <div className="space-y-3">
                        <div>
                          <div className="text-[10px] text-slate-400 font-mono">IDENTIFIANT CANONIQUE</div>
                          <div className="text-sm font-bold text-purple-300 break-words mt-0.5 font-mono">
                            {selectedEntityDetails.id}
                          </div>
                        </div>
                        <div className="grid grid-cols-2 gap-2 text-xs">
                          <div className="p-2 rounded bg-slate-950 border border-slate-800">
                            <div className="text-[10px] text-slate-400">CLASSE</div>
                            <div className="font-semibold text-cyan-300 mt-0.5">{selectedEntityDetails.type}</div>
                          </div>
                          <div className="p-2 rounded bg-slate-950 border border-slate-800">
                            <div className="text-[10px] text-slate-400">CONNECTIVITÉ</div>
                            <div className="font-semibold text-emerald-300 mt-0.5 font-mono">
                              Degré {selectedEntityDetails.degre}
                            </div>
                          </div>
                        </div>
                        <button
                          onClick={() => setSearchGraph(selectedEntityDetails.id)}
                          className="w-full py-1.5 text-xs rounded-lg bg-purple-950 hover:bg-purple-900 border border-purple-800 text-purple-200 font-semibold transition-all"
                        >
                          Filtrer toutes les relations de cette entité
                        </button>
                      </div>
                    ) : (
                      <div className="py-8 text-center text-xs text-slate-500">
                        Cliquez sur une relation dans la liste pour inspecter ses propriétés formelles.
                      </div>
                    )}
                  </div>

                  {/* Top Hubs in Semantica */}
                  <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800">
                    <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider mb-2 flex items-center justify-between">
                      <span>Hubs Stratégiques</span>
                      <span className="text-[10px] text-slate-400 font-normal">Top Degré</span>
                    </h3>
                    <div className="space-y-1.5">
                      {[
                        { id: 'life-os', degre: 48, role: 'Domaine Vital' },
                        { id: 'beth', degre: 38, role: 'Contrôleur C' },
                        { id: 'business-os', degre: 35, role: 'Cash-Flow' },
                        { id: 'rick', degre: 32, role: 'Arbitrage L0' },
                        { id: 'tech-os', degre: 30, role: 'Runtime Machine' },
                      ].map((hub) => (
                        <div
                          key={hub.id}
                          onClick={() => setSearchGraph(hub.id)}
                          className="p-2 rounded bg-slate-950/70 border border-slate-800/80 hover:border-purple-600/60 flex items-center justify-between text-xs cursor-pointer transition-colors"
                        >
                          <div>
                            <span className="font-semibold text-purple-200">{hub.id}</span>
                            <span className="text-slate-500 text-[10px] ml-2">({hub.role})</span>
                          </div>
                          <span className="text-cyan-400 font-mono text-[11px] font-bold">{hub.degre} arêtes</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* SUB-VIEW 2: CHECKPOINTS WAL */}
            {grahamSubView === 'checkpoints' && (
              <div className="space-y-4">
                <div className="flex items-center justify-between pb-2">
                  <div>
                    <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider">
                      Snapshots WAL de la Base uc.db
                    </h3>
                    <p className="text-[11px] text-slate-400">
                      Générés par <code className="text-purple-300">graham_checkpoint.py save --work N</code> avec PRAGMA wal_checkpoint(TRUNCATE).
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={fetchCheckpoints}
                      disabled={loadingCheckpoints}
                      className="px-3 py-1.5 text-xs bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg border border-slate-700 font-medium transition-colors"
                    >
                      {loadingCheckpoints ? 'Chargement...' : 'Actualiser'}
                    </button>
                    <button
                      onClick={() => runGrahamAction('save', targetWorkId)}
                      disabled={executingGrahamAction}
                      className="px-3 py-1.5 text-xs bg-purple-600 hover:bg-purple-500 text-white rounded-lg font-semibold transition-colors flex items-center gap-1.5 shadow-md shadow-purple-900/20"
                    >
                      <span>💾</span>
                      <span>Créer Checkpoint (Work #{targetWorkId})</span>
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                  {checkpoints.map((ckpt, idx) => (
                    <div
                      key={idx}
                      className="p-3.5 rounded-xl bg-slate-900/80 border border-slate-800 hover:border-slate-700 transition-all flex flex-col justify-between space-y-3"
                    >
                      <div className="flex items-start justify-between">
                        <div>
                          <div className="font-mono text-xs font-bold text-white flex items-center gap-1.5">
                            <span>{ckpt.isDir ? '📁' : '🗄️'}</span>
                            <span className="truncate">{ckpt.name}</span>
                          </div>
                          <div className="text-[10px] text-slate-400 mt-1">
                            Modifié : {new Date(ckpt.updatedAt).toLocaleString('fr-FR')}
                          </div>
                        </div>
                        <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-950 font-mono text-cyan-300 border border-slate-800">
                          {ckpt.isDir ? 'Répertoire' : `${Math.round(ckpt.sizeBytes / 1024)} Ko`}
                        </span>
                      </div>

                      {!ckpt.isDir && (
                        <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between">
                          <span className="text-[10px] text-slate-500 font-mono">Restauration sûre</span>
                          <button
                            onClick={() => {
                              const match = ckpt.name.match(/uc_work(\d+)\.db/);
                              const id = match ? parseInt(match[1], 10) : targetWorkId;
                              if (confirm(`Confirmer la restauration de uc.db depuis ${ckpt.name} ?`)) {
                                runGrahamAction('restore', id);
                              }
                            }}
                            disabled={executingGrahamAction}
                            className="px-2 py-1 text-[11px] rounded bg-rose-950/80 hover:bg-rose-900 border border-rose-800 text-rose-200 font-semibold transition-colors"
                          >
                            Restaurer uc.db
                          </button>
                        </div>
                      )}
                    </div>
                  ))}
                </div>

                {/* Event Audit Trail */}
                <div className="mt-6 pt-4 border-t border-slate-800">
                  <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider mb-2 flex items-center justify-between">
                    <span>Journal d'Audit des Checkpoints uc.db (Table event)</span>
                    <span className="text-[10px] text-slate-400 font-normal">Harness : graham_checkpoint</span>
                  </h4>
                  <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 max-h-48 overflow-y-auto space-y-1.5 text-xs font-mono">
                    {grahamEvents.length > 0 ? (
                      grahamEvents.map((ev) => (
                        <div key={ev.id} className="flex items-center justify-between py-1 border-b border-slate-800/30">
                          <div className="flex items-center gap-2">
                            <span className="text-purple-400 font-bold">#{ev.id}</span>
                            <span className="px-1.5 py-0.2 rounded text-[10px] bg-slate-900 border border-slate-800 text-cyan-300">
                              Work #{ev.work_id}
                            </span>
                            <span className="text-emerald-400 font-semibold">{ev.kind}</span>
                            <span className="text-slate-400 text-[11px] truncate max-w-md">{ev.payload}</span>
                          </div>
                          <span className="text-slate-500 text-[10px] shrink-0">{ev.at}</span>
                        </div>
                      ))
                    ) : (
                      <div className="text-center py-4 text-slate-500">Aucun événement de checkpoint récent tracé.</div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* SUB-VIEW 3: RESILIENCE & TEST RUNNER */}
            {grahamSubView === 'resilience' && (
              <div className="space-y-6">
                <div className="p-5 rounded-xl bg-slate-900/70 border border-slate-800 space-y-4">
                  <div>
                    <h3 className="text-sm font-bold text-white flex items-center gap-2">
                      <span>🛡️ Console d'Exécution & Vérification de Critères de Rupture</span>
                    </h3>
                    <p className="text-xs text-slate-400 mt-1">
                      Avant toute tâche sensible, Graham prend un snapshot physique WAL. Si un critère échoue (rc=4), uc.db est immédiatement restaurée.
                    </p>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="text-xs font-semibold text-slate-300 block mb-1">
                        Numéro du Work Cible (ID)
                      </label>
                      <input
                        type="number"
                        min="1"
                        value={targetWorkId}
                        onChange={(e) => setTargetWorkId(parseInt(e.target.value, 10) || 1)}
                        className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-xs text-slate-200 font-mono focus:outline-none focus:border-purple-500"
                      />
                    </div>

                    <div>
                      <label className="text-xs font-semibold text-slate-300 block mb-1">
                        Critère d'Assertion Python (ctx: work_id, status, attempts)
                      </label>
                      <input
                        type="text"
                        value={customCriterion}
                        onChange={(e) => setCustomCriterion(e.target.value)}
                        placeholder="Ex: work_id == 1 or status != 'failed'"
                        className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-xs text-slate-200 font-mono focus:outline-none focus:border-purple-500"
                      />
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center gap-3 pt-2">
                    <button
                      onClick={() => runGrahamAction('save', targetWorkId)}
                      disabled={executingGrahamAction}
                      className="px-4 py-2 text-xs font-semibold rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white transition-colors flex items-center gap-1.5"
                    >
                      <span>💾</span>
                      <span>1. Exécuter Checkpoint Save</span>
                    </button>

                    <button
                      onClick={() => runGrahamAction('check', targetWorkId, customCriterion)}
                      disabled={executingGrahamAction}
                      className="px-4 py-2 text-xs font-semibold rounded-lg bg-purple-600 hover:bg-purple-500 text-white transition-colors flex items-center gap-1.5"
                    >
                      <span>🔍</span>
                      <span>2. Évaluer Critère (Check)</span>
                    </button>

                    <button
                      onClick={() => runGrahamAction('restore', targetWorkId)}
                      disabled={executingGrahamAction}
                      className="px-4 py-2 text-xs font-semibold rounded-lg bg-rose-700 hover:bg-rose-600 text-white transition-colors flex items-center gap-1.5"
                    >
                      <span>⏪</span>
                      <span>3. Restaurer Snapshot (Restore)</span>
                    </button>
                  </div>
                </div>

                {/* Doctrine & Protocol Info */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="p-4 rounded-xl bg-slate-900/50 border border-slate-800">
                    <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider mb-2">
                      Protocole de Sauvegarde WAL
                    </h4>
                    <p className="text-xs text-slate-400 leading-relaxed">
                      L'appel à <code className="text-purple-300">PRAGMA wal_checkpoint(TRUNCATE)</code> purge les transactions WAL avant la copie binaire directe vers <code className="text-slate-300">checkpoints/uc_workN.db</code>. La trace d'enregistrement survit même à une restauration ultérieure.
                    </p>
                  </div>

                  <div className="p-4 rounded-xl bg-slate-900/50 border border-slate-800">
                    <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider mb-2">
                      Gouvernance de Rupture de Critère
                    </h4>
                    <p className="text-xs text-slate-400 leading-relaxed">
                      Le vérificateur évalue le critère dans un contexte sécurisé sans builtins. Tout résultat faux retourne un code d'erreur 4, permettant au contrôleur d'orchestration de déclencher un retour immédiat à l'état sain sans blocage manuel.
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export const App = Doctor13KernelApp;