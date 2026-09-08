import { useState, useEffect } from 'react';
import type { AppManifest } from '../../types';
import { useShell } from '../../shell/store';

export const manifest: AppManifest = {
  id: 'doctor-12-bus',
  name: '12e Docteur · Bus Core',
  kind: 'singleton',
  description: 'Croissance SOB, Franchises 72h & Monopoles $100M · Onglets : 12e Docteur, Bill (Discovery), Clara (Product Forge), Nardole (Dispatch).',
  icon: '📈',
  domaine: 'l2-business',
};

type TabType = 'docteur' | 'bill' | 'clara' | 'nardole';

interface WorkItem {
  id: number;
  type: string;
  status: string;
  agent?: string;
  attempts: number;
  created_at: string;
  updated_at: string;
}

export function Doctor12BusApp({ payload }: { payload?: Record<string, unknown> } = {}) {
  const initialTab = (payload?.targetTab as TabType) || 'docteur';
  const [activeTab, setActiveTab] = useState<TabType>(initialTab);

  useEffect(() => {
    if (payload?.targetTab && ['docteur', 'bill', 'clara', 'nardole'].includes(payload.targetTab as string)) {
      setActiveTab(payload.targetTab as TabType);
    }
  }, [payload?.targetTab]);

  // Nardole State
  const [works, setWorks] = useState<WorkItem[]>([]);
  const [loadingNardole, setLoadingNardole] = useState(false);
  const [invokingNardole, setInvokingNardole] = useState(false);
  const [nardoleStatus, setNardoleStatus] = useState<string | null>(null);

  // Bill State
  const [signals] = useState([
    { id: 1, title: 'Demande accrue d\'architectures Graph-Native (Semantica)', source: 'arXiv & Trends', impact: 'Élevé', status: 'VALIDÉ' },
    { id: 2, title: 'Incompatibilité routeurs intermédiaires avec Auth native', source: 'Audit 9Router/OmniRoute', impact: 'Critique', status: 'RÉSOLU' },
    { id: 3, title: 'Compression 12WY en micro-cycles 12h pour agents nano', source: 'Sessions Amad', impact: 'Stratégique', status: 'ACTIF' },
    { id: 4, title: 'Besoins de franchisation d\'offres B2B sans temps humain', source: 'Signal SOB 2026', impact: 'Majeur', status: 'EN FORGE' },
  ]);

  // Clara State
  const [sops] = useState([
    { id: 'sop-01', title: 'Kit Franchise Coach OS en < 72h', standard: '$100M Monopole', version: 'v2.4', ready: true },
    { id: 'sop-02', title: 'Délégation Asynchrone & Vente sans Appel', standard: 'Pure SOB', version: 'v1.8', ready: true },
    { id: 'sop-03', title: 'Clonage d\'Environnement Client Automatisé', standard: 'Zero-Friction', version: 'v3.0', ready: true },
  ]);

  const fetchNardoleQueue = async () => {
    setLoadingNardole(true);
    try {
      const res = await fetch('/api/tech-os/kernel-state', { cache: 'no-store' });
      if (res.ok) {
        const data = await res.json();
        if (data.ok && data.works) setWorks(data.works);
      }
    } catch {}
    finally { setLoadingNardole(false); }
  };

  const invokeNardole = async () => {
    setInvokingNardole(true);
    setNardoleStatus('Balancement de charge Kanban en cours...');
    try {
      const res = await fetch('/api/tech-os/subagents/invoke', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ agentId: 'companion_nardole_dispatch', action: 'run_task' }),
      });
      const data = await res.json();
      if (data.ok) {
        setNardoleStatus(`Nardole exécuté avec succès (${data.executionTimeMs} ms) · ${data.timestampEdt}`);
        await fetchNardoleQueue();
      } else {
        setNardoleStatus(`Erreur : ${data.error || 'Échec d’exécution'}`);
      }
    } catch (e: any) {
      setNardoleStatus(`Erreur réseau : ${e.message}`);
    } finally {
      setInvokingNardole(false);
    }
  };

  useEffect(() => {
    fetchNardoleQueue();
    const interval = setInterval(fetchNardoleQueue, 15000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="flex flex-col h-full bg-[#110e14] text-slate-100 select-none overflow-hidden">
      {/* 1. Header & Tab Navigation Bar */}
      <header className="px-4 py-2.5 border-b border-slate-800/80 bg-slate-950/70 flex items-center justify-between gap-3 shrink-0">
        <div className="flex items-center gap-2 overflow-x-auto">
          {[
            { id: 'docteur', label: '12e Docteur · Souveraineté SOB', icon: '💼', badge: 'Bus Core' },
            { id: 'bill', label: 'Bill · Radar Signaux', icon: '🔭', badge: 'Market Signals' },
            { id: 'clara', label: 'Clara · Product Forge', icon: '⚡', badge: 'SOPs $100M' },
            { id: 'nardole', label: 'Nardole · Dispatch & Kanban', icon: '⚖️', badge: '< 5 min SLA' },
          ].map((tab) => {
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as TabType)}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all border ${
                  isActive
                    ? 'bg-amber-950/80 text-amber-200 border-amber-700/80 shadow-sm shadow-amber-900/30'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900 border-transparent'
                }`}
              >
                <span className="text-sm">{tab.icon}</span>
                <span>{tab.label}</span>
                <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono ${isActive ? 'bg-amber-900 text-amber-300' : 'bg-slate-800 text-slate-400'}`}>
                  {tab.badge}
                </span>
              </button>
            );
          })}
        </div>

        <div className="flex items-center gap-3 shrink-0 text-xs font-mono">
          <button
            onClick={() => useShell.getState().toggleCms()}
            className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-slate-900 border border-slate-800 text-slate-300 hover:text-amber-300 hover:border-amber-600/50 transition-all text-[11px]"
            title="Inspecter les données de cette application dans le CMS Hiérarchique V2"
          >
            <span>🗂️</span>
            <span>CMS</span>
          </button>
          <span className="text-emerald-400">● SOB ACTIF</span>
          <span className="text-slate-500">Franchise &lt; 72h</span>
        </div>
      </header>

      {/* 2. Content Area */}
      <div className="flex-1 overflow-y-auto p-6">
        {/* TAB 1: 12e DOCTEUR */}
        {activeTab === 'docteur' && (
          <div className="space-y-6">
            <div className="flex items-center justify-between pb-4 border-b border-slate-800/80">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-2xl shadow-lg shadow-amber-500/10">
                  💼
                </div>
                <div>
                  <h1 className="text-lg font-bold text-white flex items-center gap-2">
                    12e Docteur · Souveraineté du Bus Core
                    <span className="text-xs px-2 py-0.5 rounded-full bg-amber-950 text-amber-300 border border-amber-800">
                      L2 Business OS
                    </span>
                  </h1>
                  <p className="text-xs text-slate-400">
                    Levier SOB, Monétisation Autonome & Franchisabilité Rapide en 72 heures
                  </p>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800">
                <div className="text-xs text-slate-400 font-semibold">SEUIL 7D AUTONOME</div>
                <div className="text-2xl font-bold text-emerald-400 mt-1 font-mono">100% ASYNC</div>
                <div className="text-[11px] text-slate-500 mt-1">Zéro prospection synchrone</div>
              </div>
              <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800">
                <div className="text-xs text-slate-400 font-semibold">CATALOGUE OFFRES</div>
                <div className="text-2xl font-bold text-amber-400 mt-1 font-mono">3 MONOPOLES</div>
                <div className="text-[11px] text-slate-500 mt-1">Standardisation $100M Offers</div>
              </div>
              <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800">
                <div className="text-xs text-slate-400 font-semibold">DÉLAI DE FRANCHISE</div>
                <div className="text-2xl font-bold text-cyan-400 mt-1 font-mono">&lt; 72 HEURES</div>
                <div className="text-[11px] text-slate-500 mt-1">Clonage de structures complet</div>
              </div>
              <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800">
                <div className="text-xs text-slate-400 font-semibold">COMPAGNONS ACTIFS</div>
                <div className="text-2xl font-bold text-purple-400 mt-1 font-mono">3 / 3</div>
                <div className="text-[11px] text-slate-500 mt-1">Bill, Clara, Nardole</div>
              </div>
            </div>

            <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800">
              <h2 className="text-sm font-semibold text-slate-200 mb-3 flex items-center gap-2">
                <span>⚡ Rôles et Compagnons Rattachés au Bus Core</span>
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <div onClick={() => setActiveTab('bill')} className="p-3.5 rounded-lg bg-slate-950/80 border border-slate-800/80 hover:border-amber-700/60 cursor-pointer transition-all">
                  <div className="flex items-center gap-2 font-bold text-blue-300 text-xs">
                    <span>🔭 Bill Discovery</span>
                  </div>
                  <p className="text-[11px] text-slate-400 mt-1.5">Radar d'opportunités SOB, signaux marché et qualification asynchrone.</p>
                </div>
                <div onClick={() => setActiveTab('clara')} className="p-3.5 rounded-lg bg-slate-950/80 border border-slate-800/80 hover:border-amber-700/60 cursor-pointer transition-all">
                  <div className="flex items-center gap-2 font-bold text-amber-300 text-xs">
                    <span>⚡ Clara Product Forge</span>
                  </div>
                  <p className="text-[11px] text-slate-400 mt-1.5">Forge d'actifs numériques, standardisation d'offres $100M et franchise 72h.</p>
                </div>
                <div onClick={() => setActiveTab('nardole')} className="p-3.5 rounded-lg bg-slate-950/80 border border-slate-800/80 hover:border-amber-700/60 cursor-pointer transition-all">
                  <div className="flex items-center gap-2 font-bold text-orange-300 text-xs">
                    <span>⚖️ Nardole Dispatch</span>
                  </div>
                  <p className="text-[11px] text-slate-400 mt-1.5">Tour de contrôle Kanban, balancing de charge et zéro ticket orphelin &gt; 5 min.</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: BILL */}
        {activeTab === 'bill' && (
          <div className="space-y-6">
            <div className="flex items-center justify-between pb-4 border-b border-slate-800/80">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-blue-500/20 border border-blue-500/40 flex items-center justify-center text-xl">
                  🔭
                </div>
                <div>
                  <h2 className="text-base font-bold text-white">Bill · Market Discovery & Signals</h2>
                  <p className="text-xs text-slate-400">Radar de Marché & Détection Proactive d'Anomalies Commerciales SOB</p>
                </div>
              </div>
              <button
                onClick={async () => {
                  await fetch('/api/tech-os/subagents/invoke', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ agentId: 'companion_bill_discovery', action: 'scan_signals' }),
                  });
                  alert('Bill : Scan des signaux de marché exécuté avec succès.');
                }}
                className="px-3 py-1.5 text-xs font-semibold rounded-lg bg-amber-600 hover:bg-amber-500 text-white transition-colors flex items-center gap-1.5"
              >
                <span>⚡</span>
                <span>Invoquer Bill</span>
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800">
                <div className="text-xs text-slate-400 font-semibold">SIGNAUX MARCHÉ CAPTÉS</div>
                <div className="text-2xl font-bold text-blue-400 mt-1 font-mono">14 Actifs</div>
                <div className="text-[11px] text-slate-500 mt-1">Veille asynchrone continue</div>
              </div>
              <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800">
                <div className="text-xs text-slate-400 font-semibold">OPPORTUNITÉS QUALIFIÉES</div>
                <div className="text-2xl font-bold text-emerald-400 mt-1 font-mono">4 Validées</div>
                <div className="text-[11px] text-slate-500 mt-1">Prêtes pour la forge Clara</div>
              </div>
              <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800">
                <div className="text-xs text-slate-400 font-semibold">FRICTION COMMERCIALE</div>
                <div className="text-2xl font-bold text-cyan-400 mt-1 font-mono">0 HEURE</div>
                <div className="text-[11px] text-slate-500 mt-1">100% async sans appel synchrone</div>
              </div>
            </div>

            <div className="space-y-3">
              <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider">Signaux Captés Récents</h3>
              {signals.map((s) => (
                <div key={s.id} className="p-4 rounded-xl bg-slate-900/80 border border-slate-800 flex items-center justify-between">
                  <div>
                    <h4 className="text-xs font-bold text-white">{s.title}</h4>
                    <p className="text-[11px] text-slate-400 mt-1">Source : {s.source} · Impact : {s.impact}</p>
                  </div>
                  <span className="px-2 py-1 rounded text-[10px] font-bold bg-blue-950 text-blue-300 border border-blue-800">
                    {s.status}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* TAB 3: CLARA */}
        {activeTab === 'clara' && (
          <div className="space-y-6">
            <div className="flex items-center justify-between pb-4 border-b border-slate-800/80">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-xl">
                  ⚡
                </div>
                <div>
                  <h2 className="text-base font-bold text-white">Clara · Product Forge & SOPs</h2>
                  <p className="text-xs text-slate-400">Atelier de Standardisation des Livrables & Franchises Clonables en 72h</p>
                </div>
              </div>
              <button
                onClick={async () => {
                  await fetch('/api/tech-os/subagents/invoke', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ agentId: 'companion_clara_product_forge', action: 'compile_sops' }),
                  });
                  alert('Clara : Compilation des SOPs et validation des offres effectuée.');
                }}
                className="px-3 py-1.5 text-xs font-semibold rounded-lg bg-amber-600 hover:bg-amber-500 text-white transition-colors flex items-center gap-1.5"
              >
                <span>⚡</span>
                <span>Invoquer Clara</span>
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800">
                <div className="text-xs text-slate-400 font-semibold">OFFRES MONOPOLES FORGÉES</div>
                <div className="text-2xl font-bold text-amber-400 mt-1 font-mono">3 Actifs</div>
                <div className="text-[11px] text-slate-500 mt-1">Conformité $100M Offers</div>
              </div>
              <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800">
                <div className="text-xs text-slate-400 font-semibold">TEMPS DE CLONAGE FRANCHISE</div>
                <div className="text-2xl font-bold text-emerald-400 mt-1 font-mono">&lt; 72H</div>
                <div className="text-[11px] text-slate-500 mt-1">Déploiement clé en main</div>
              </div>
              <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800">
                <div className="text-xs text-slate-400 font-semibold">CONVERSION SUR-MESURE</div>
                <div className="text-2xl font-bold text-purple-400 mt-1 font-mono">100% SOP</div>
                <div className="text-[11px] text-slate-500 mt-1">Reproductibilité garantie sans dérive</div>
              </div>
            </div>

            <div className="space-y-3">
              <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider">Actifs & SOPs Standardisés</h3>
              {sops.map((sop) => (
                <div key={sop.id} className="p-4 rounded-xl bg-slate-900/80 border border-slate-800 flex items-center justify-between">
                  <div>
                    <h4 className="text-xs font-bold text-white">{sop.title}</h4>
                    <p className="text-[11px] text-slate-400 mt-1">Standard : {sop.standard} · Version : {sop.version}</p>
                  </div>
                  <span className="px-2 py-1 rounded text-[10px] font-bold bg-amber-950 text-amber-300 border border-amber-800">
                    FRANCHISABLE
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* TAB 4: NARDOLE */}
        {activeTab === 'nardole' && (
          <div className="space-y-6">
            <div className="flex items-center justify-between pb-4 border-b border-slate-800/80">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-orange-500/20 border border-orange-500/40 flex items-center justify-center text-xl">
                  ⚖️
                </div>
                <div>
                  <h2 className="text-base font-bold text-white">Nardole · Dispatch & Kanban</h2>
                  <p className="text-xs text-slate-400">Tour de Contrôle des Baux & Zéro Ticket Orphelin &gt; 5 min</p>
                </div>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={invokeNardole}
                  disabled={invokingNardole}
                  className="px-3 py-1.5 text-xs font-semibold rounded-lg bg-amber-600 hover:bg-amber-500 disabled:opacity-50 text-white transition-colors flex items-center gap-1.5"
                >
                  <span>{invokingNardole ? '⏳' : '⚡'}</span>
                  <span>{invokingNardole ? 'Balancement...' : 'Invoquer Nardole'}</span>
                </button>
                <button
                  onClick={fetchNardoleQueue}
                  className="px-3 py-1.5 text-xs font-medium rounded-lg bg-orange-600 hover:bg-orange-500 text-white transition-colors"
                >
                  Actualiser
                </button>
              </div>
            </div>

            {nardoleStatus && (
              <div className="px-3 py-2 bg-orange-950/40 border border-orange-800/60 rounded-lg text-xs text-orange-200 flex items-center justify-between">
                <span>{nardoleStatus}</span>
                <button onClick={() => setNardoleStatus(null)} className="text-orange-400 hover:text-white font-bold">✕</button>
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="p-4 rounded-xl bg-slate-900 border border-slate-800">
                <div className="text-xs text-slate-400">EN COURS (RUNNING)</div>
                <div className="text-2xl font-bold text-orange-400 mt-1 font-mono">
                  {works.filter((w) => w.status === 'running' || w.status === 'in_progress').length}
                </div>
                <div className="text-[11px] text-slate-500 mt-1">Baux actifs sur uc.db</div>
              </div>
              <div className="p-4 rounded-xl bg-slate-900 border border-slate-800">
                <div className="text-xs text-slate-400">COMPLÉTÉES (DONE)</div>
                <div className="text-2xl font-bold text-emerald-400 mt-1 font-mono">
                  {works.filter((w) => w.status === 'done').length}
                </div>
                <div className="text-[11px] text-slate-500 mt-1">Cycle review certifié</div>
              </div>
              <div className="p-4 rounded-xl bg-slate-900 border border-slate-800">
                <div className="text-xs text-slate-400">DÉLAI MAX D'ATTENTE</div>
                <div className="text-2xl font-bold text-cyan-400 mt-1 font-mono">&lt; 5 min</div>
                <div className="text-[11px] text-slate-500 mt-1">Auto-restitution des baux</div>
              </div>
              <div className="p-4 rounded-xl bg-slate-900 border border-slate-800">
                <div className="text-xs text-slate-400">SLA BALANCING</div>
                <div className="text-2xl font-bold text-purple-400 mt-1 font-mono">100% FLUIDE</div>
                <div className="text-[11px] text-slate-500 mt-1">Zéro goulot d'étranglement</div>
              </div>
            </div>

            <div className="bg-slate-900/60 rounded-xl border border-slate-800 overflow-hidden flex flex-col">
              <div className="p-3 bg-slate-950/80 border-b border-slate-800 flex justify-between text-xs text-slate-400 font-semibold">
                <span>File Active des Travaux uc.db</span>
                <span>Statut</span>
              </div>
              <div className="overflow-y-auto max-h-64 divide-y divide-slate-800/40 text-xs">
                {loadingNardole ? (
                  <div className="p-6 text-center text-slate-500">Chargement des baux...</div>
                ) : works.length > 0 ? (
                  works.slice(0, 10).map((w) => (
                    <div key={w.id} className="p-3 flex items-center justify-between hover:bg-slate-800/30">
                      <div>
                        <span className="font-bold text-white font-mono mr-2">#{w.id}</span>
                        <span className="text-slate-300 font-mono text-[11px]">{w.type || 'task'}</span>
                        <span className="text-slate-500 text-[10px] ml-2">Tentatives : {w.attempts}</span>
                      </div>
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                        w.status === 'done'
                          ? 'bg-emerald-950 text-emerald-300 border border-emerald-800'
                          : w.status === 'running'
                          ? 'bg-orange-950 text-orange-300 border border-orange-800'
                          : 'bg-slate-800 text-slate-400'
                      }`}>
                        {w.status.toUpperCase()}
                      </span>
                    </div>
                  ))
                ) : (
                  <div className="p-6 text-center text-slate-500 font-mono">File uc.db vide. Zéro anomalie.</div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export const App = Doctor12BusApp;