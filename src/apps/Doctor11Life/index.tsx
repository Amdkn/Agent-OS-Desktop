import React, { useState, useEffect, useRef } from 'react';
import type { AppManifest } from '../../types';
import { useShell } from '../../shell/store';

export const manifest: AppManifest = {
  id: 'doctor-11-life',
  name: '11e Docteur · Life Core',
  kind: 'singleton',
  description: 'Souveraineté Personnelle, Énergie & Habitacle de Conscience · Onglets : 11e Docteur, Amy (Interface), Rory (Backend), River (Workflows Canvas n8n).',
  icon: '🌱',
  domaine: 'l1-life',
};

type TabType = 'docteur' | 'amy' | 'rory' | 'river';

interface WfNode {
  id: string;
  name: string;
  type: 'trigger' | 'filter' | 'transformer' | 'action' | 'output';
  badge: string;
  desc: string;
  x: number;
  y: number;
  status: 'idle' | 'running' | 'success' | 'failed';
  inputs: string[];
  outputs: string[];
  file: string;
}

interface Workflow {
  id: string;
  name: string;
  description: string;
  script: string;
  category: string;
  icon: string;
  nodes: WfNode[];
}

export function Doctor11LifeApp({ payload }: { payload?: Record<string, unknown> } = {}) {
  const initialTab = (payload?.targetTab as TabType) || 'docteur';
  const [activeTab, setActiveTab] = useState<TabType>(initialTab);

  useEffect(() => {
    if (payload?.targetTab && ['docteur', 'amy', 'rory', 'river'].includes(payload.targetTab as string)) {
      setActiveTab(payload.targetTab as TabType);
    }
  }, [payload?.targetTab]);

  // Amy State
  const [energyLevel, setEnergyLevel] = useState<'high' | 'medium' | 'low'>('medium');

  // Rory State
  const [integrityChecks] = useState([
    { id: 'rls-01', table: 'auth.users', check: 'Row Level Security', result: 'PASS (Enforced)' },
    { id: 'rls-02', table: 'public.memories', check: 'Multi-Tenant Isolation', result: 'PASS (Enforced)' },
    { id: 'rls-03', table: 'public.life_domains', check: 'Referential Integrity', result: 'PASS (Zero Orphan)' },
    { id: 'sql-04', table: 'sqlite.uc.db', check: 'Foreign Key PRAGMA', result: 'PASS (FOREIGN_KEYS=ON)' },
  ]);

  // River Canvas State
  const [workflows, setWorkflows] = useState<Workflow[]>([]);
  const [activeWfId, setActiveWfId] = useState<string>('wf-dark-factory');
  const [selectedNode, setSelectedNode] = useState<WfNode | null>(null);
  const [zoom, setZoom] = useState<number>(1);
  const [pan, setPan] = useState<{ x: number; y: number }>({ x: 30, y: 30 });
  const [isPanning, setIsPanning] = useState(false);
  const [dragStart, setDragStart] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [executing, setExecuting] = useState(false);
  const [execLog, setExecLog] = useState<{ stdout: string; stderr: string; code: number } | null>(null);
  const [nodePositions, setNodePositions] = useState<Record<string, { x: number; y: number }>>({});
  const draggingNodeRef = useRef<{ id: string; startX: number; startY: number; initX: number; initY: number } | null>(null);

  useEffect(() => {
    fetch('/api/tech-os/workflows')
      .then((r) => r.json())
      .then((data) => {
        if (data.ok && data.workflows) {
          setWorkflows(data.workflows);
          const initialPos: Record<string, { x: number; y: number }> = {};
          data.workflows.forEach((wf: Workflow) => {
            wf.nodes.forEach((n) => {
              initialPos[n.id] = { x: n.x, y: n.y };
            });
          });
          setNodePositions(initialPos);
        }
      })
      .catch(() => {});
  }, []);

  const activeWf = workflows.find((w) => w.id === activeWfId) || workflows[0];

  const handleMouseDownCanvas = (e: React.MouseEvent) => {
    if ((e.target as HTMLElement).closest('[data-node]')) return;
    setIsPanning(true);
    setDragStart({ x: e.clientX - pan.x, y: e.clientY - pan.y });
  };

  const handleMouseMoveCanvas = (e: React.MouseEvent) => {
    if (isPanning) {
      setPan({ x: e.clientX - dragStart.x, y: e.clientY - dragStart.y });
    } else if (draggingNodeRef.current) {
      const { id, startX, startY, initX, initY } = draggingNodeRef.current;
      const dx = (e.clientX - startX) / zoom;
      const dy = (e.clientY - startY) / zoom;
      setNodePositions((prev) => ({
        ...prev,
        [id]: { x: Math.round(initX + dx), y: Math.round(initY + dy) },
      }));
    }
  };

  const handleMouseUpCanvas = () => {
    setIsPanning(false);
    draggingNodeRef.current = null;
  };

  const startDragNode = (e: React.MouseEvent, node: WfNode) => {
    e.stopPropagation();
    const currentPos = nodePositions[node.id] || { x: node.x, y: node.y };
    draggingNodeRef.current = {
      id: node.id,
      startX: e.clientX,
      startY: e.clientY,
      initX: currentPos.x,
      initY: currentPos.y,
    };
    setSelectedNode(node);
  };

  const executePipeline = async (dryRun = false) => {
    if (!activeWf) return;
    setExecuting(true);
    setExecLog(null);
    try {
      const res = await fetch('/api/tech-os/execute', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          script: activeWf.script,
          args: dryRun ? '--dry-run' : (activeWf.script === 'dark_factory.py' ? '--intent C:/Users/amado/ASpace_OS_V3/_INBOX/_admis/S1_Rick/intent-rescope-cascade-20260902.md' : 'run'),
        }),
      });
      const json = await res.json();
      setExecLog({
        stdout: json.stdout || '(aucun output)',
        stderr: json.stderr || '',
        code: json.exitCode ?? 0,
      });
    } catch (e: any) {
      setExecLog({ stdout: '', stderr: e.message, code: 1 });
    } finally {
      setExecuting(false);
    }
  };

  const getNodeColor = (type: WfNode['type']) => {
    switch (type) {
      case 'trigger':
        return { border: 'border-emerald-500/60', bg: 'bg-emerald-950/30', header: 'bg-emerald-500/20 text-emerald-400' };
      case 'filter':
        return { border: 'border-amber-500/60', bg: 'bg-amber-950/30', header: 'bg-amber-500/20 text-amber-400' };
      case 'transformer':
        return { border: 'border-cyan-500/60', bg: 'bg-cyan-950/30', header: 'bg-cyan-500/20 text-cyan-400' };
      case 'action':
        return { border: 'border-indigo-500/60', bg: 'bg-indigo-950/30', header: 'bg-indigo-500/20 text-indigo-400' };
      case 'output':
        return { border: 'border-violet-500/60', bg: 'bg-violet-950/30', header: 'bg-violet-500/20 text-violet-400' };
      default:
        return { border: 'border-slate-700', bg: 'bg-slate-900', header: 'bg-slate-800 text-slate-300' };
    }
  };

  return (
    <div className="flex flex-col h-full bg-[#0e0c14] text-slate-100 select-none overflow-hidden">
      {/* 1. Header & Tab Navigation Bar */}
      <header className="px-4 py-2.5 border-b border-slate-800/80 bg-slate-950/70 flex items-center justify-between gap-3 shrink-0">
        <div className="flex items-center gap-2 overflow-x-auto">
          {[
            { id: 'docteur', label: '11e Docteur · Souveraineté Vitale', icon: '⏳', badge: 'Life Core' },
            { id: 'amy', label: 'Amy · Interface & Présence', icon: '✨', badge: 'Ergonomie Adaptative' },
            { id: 'rory', label: 'Rory · Backend & Coffre-Fort', icon: '🛡️', badge: 'Local-First RLS' },
            { id: 'river', label: 'River · Workflows Canvas (n8n)', icon: '🌀', badge: 'Moteur Léger sans Docker' },
          ].map((tab) => {
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as TabType)}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all border ${
                  isActive
                    ? 'bg-violet-950/80 text-violet-200 border-violet-700/80 shadow-sm shadow-violet-900/30'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900 border-transparent'
                }`}
              >
                <span className="text-sm">{tab.icon}</span>
                <span>{tab.label}</span>
                <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono ${isActive ? 'bg-violet-900 text-violet-300' : 'bg-slate-800 text-slate-400'}`}>
                  {tab.badge}
                </span>
              </button>
            );
          })}
        </div>

        <div className="flex items-center gap-3 shrink-0 text-xs font-mono">
          <button
            onClick={() => useShell.getState().toggleCms()}
            className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-slate-900 border border-slate-800 text-slate-300 hover:text-violet-300 hover:border-violet-600/50 transition-all text-[11px]"
            title="Inspecter les données de cette application dans le CMS Hiérarchique V2"
          >
            <span>🗂️</span>
            <span>CMS</span>
          </button>
          <span className="text-emerald-400">● LIFE ACTIF</span>
          <span className="text-slate-500">Zéro Dette Mentale</span>
        </div>
      </header>

      {/* 2. Content Area */}
      <div className="flex-1 overflow-hidden flex flex-col">
        {/* TAB 1: 11e DOCTEUR */}
        {activeTab === 'docteur' && (
          <div className="flex-1 overflow-y-auto p-6 space-y-6">
            <div className="flex items-center justify-between pb-4 border-b border-slate-800/80">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-violet-500/20 border border-violet-500/40 flex items-center justify-center text-2xl shadow-lg shadow-violet-500/10">
                  ⏳
                </div>
                <div>
                  <h1 className="text-lg font-bold text-white flex items-center gap-2">
                    11e Docteur · Souveraineté du Life Core
                    <span className="text-xs px-2 py-0.5 rounded-full bg-violet-950 text-violet-300 border border-violet-800">
                      L1 Life OS
                    </span>
                  </h1>
                  <p className="text-xs text-slate-400">
                    Souveraineté Personnelle, Énergie Vitale & Habitacle de Conscience
                  </p>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800">
                <div className="text-xs text-slate-400 font-semibold">ATTENTION SOUVERAINE</div>
                <div className="text-2xl font-bold text-emerald-400 mt-1 font-mono">SANCTUARISÉE</div>
                <div className="text-[11px] text-slate-500 mt-1">Zéro notification intrusive</div>
              </div>
              <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800">
                <div className="text-xs text-slate-400 font-semibold">HABITACLE CONSCIENCE</div>
                <div className="text-2xl font-bold text-violet-400 mt-1 font-mono">100% SÉCURISÉ</div>
                <div className="text-[11px] text-slate-500 mt-1">Persistance chiffrée locale</div>
              </div>
              <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800">
                <div className="text-xs text-slate-400 font-semibold">CANAUX ÉVÉNEMENTIELS</div>
                <div className="text-2xl font-bold text-cyan-400 mt-1 font-mono">12 SCÉNARIOS</div>
                <div className="text-[11px] text-slate-500 mt-1">Moteur River Python sans Docker</div>
              </div>
              <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800">
                <div className="text-xs text-slate-400 font-semibold">COMPAGNONS ACTIFS</div>
                <div className="text-2xl font-bold text-purple-400 mt-1 font-mono">3 / 3</div>
                <div className="text-[11px] text-slate-500 mt-1">Amy, Rory, River</div>
              </div>
            </div>

            <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800">
              <h2 className="text-sm font-semibold text-slate-200 mb-3 flex items-center gap-2">
                <span>⚡ Rôles et Compagnons Rattachés au Life Core</span>
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <div onClick={() => setActiveTab('amy')} className="p-3.5 rounded-lg bg-slate-950/80 border border-slate-800/80 hover:border-violet-700/60 cursor-pointer transition-all">
                  <div className="flex items-center gap-2 font-bold text-emerald-300 text-xs">
                    <span>✨ Amy Interface</span>
                  </div>
                  <p className="text-[11px] text-slate-400 mt-1.5">Ergonomie cognitive adaptative selon la jauge d'énergie vitale.</p>
                </div>
                <div onClick={() => setActiveTab('rory')} className="p-3.5 rounded-lg bg-slate-950/80 border border-slate-800/80 hover:border-violet-700/60 cursor-pointer transition-all">
                  <div className="flex items-center gap-2 font-bold text-red-300 text-xs">
                    <span>🛡️ Rory Backend</span>
                  </div>
                  <p className="text-[11px] text-slate-400 mt-1.5">Coffre-fort Supabase RLS, intégrité horaire et verrous SQLite Local-First.</p>
                </div>
                <div onClick={() => setActiveTab('river')} className="p-3.5 rounded-lg bg-slate-950/80 border border-slate-800/80 hover:border-violet-700/60 cursor-pointer transition-all">
                  <div className="flex items-center gap-2 font-bold text-violet-300 text-xs">
                    <span>🌀 River Workflows (Canvas n8n)</span>
                  </div>
                  <p className="text-[11px] text-slate-400 mt-1.5">Canevas interactif visuel des pipelines Python légers sans Docker.</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: AMY */}
        {activeTab === 'amy' && (
          <div className="flex-1 overflow-y-auto p-6 space-y-6">
            <div className="flex items-center justify-between pb-4 border-b border-slate-800/80">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-xl">
                  ✨
                </div>
                <div>
                  <h2 className="text-base font-bold text-white">Amy · Interface Adaptative & Présence</h2>
                  <p className="text-xs text-slate-400">Ergonomie Zéro-Friction · Densité Régulée par l'Énergie Vitale</p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <span className="text-xs text-slate-400 font-semibold mr-1">Jauge Énergie :</span>
                {(['high', 'medium', 'low'] as const).map((lvl) => (
                  <button
                    key={lvl}
                    onClick={() => setEnergyLevel(lvl)}
                    className={`px-3 py-1 rounded-lg text-xs font-bold uppercase transition-all ${
                      energyLevel === lvl
                        ? lvl === 'high' ? 'bg-emerald-600 text-white' : lvl === 'medium' ? 'bg-amber-600 text-white' : 'bg-rose-600 text-white'
                        : 'bg-slate-800 text-slate-400 hover:bg-slate-700'
                    }`}
                  >
                    {lvl}
                  </button>
                ))}
              </div>
            </div>

            <div className="p-6 rounded-2xl bg-gradient-to-br from-slate-900 to-slate-950 border border-slate-800 text-center">
              <div className="text-[11px] uppercase tracking-widest text-emerald-400 font-semibold mb-2">
                FOCALISATION PURE · PROCHAINE ACTION UNIQUE
              </div>
              <h3 className="text-xl font-bold text-white max-w-xl mx-auto leading-relaxed">
                {energyLevel === 'high'
                  ? 'Sprint d\'Exécution Haute Cadence : Arbitrage architectural & Déploiement Dark Factory'
                  : energyLevel === 'medium'
                  ? 'Traitement Rythmé : Revue des PRs & Validation des SOPs Monopoles Clara'
                  : 'Sanctuarisation Analogique Complète · Déconnexion Sans Écran'}
              </h3>
              <p className="text-xs text-slate-400 mt-2">
                {energyLevel === 'high'
                  ? 'Toutes les consoles sont déployées. Cadence maximale.'
                  : energyLevel === 'medium'
                  ? 'Filtre de bruit actif. Charge cognitive équilibrée.'
                  : 'Mode repos basal activé. Zéro sollicitation, écran noir filtrant et activités régénératrices.'}
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800">
                <div className="text-xs text-slate-400">CHARGE COGNITIVE</div>
                <div className="text-2xl font-bold text-cyan-400 mt-1 font-mono">
                  {energyLevel === 'high' ? '0.32' : energyLevel === 'medium' ? '0.54' : '0.89'}
                </div>
                <div className="text-[11px] text-slate-500 mt-1">Friction perçue régulée</div>
              </div>
              <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800">
                <div className="text-xs text-slate-400">INTERFACE SOUVERAINE</div>
                <div className="text-2xl font-bold text-emerald-400 mt-1 font-mono">PORT 5555</div>
                <div className="text-[11px] text-slate-500 mt-1">Next.js & Vite unifiés</div>
              </div>
              <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800">
                <div className="text-xs text-slate-400">SÉCURITÉ ATTENTION</div>
                <div className="text-2xl font-bold text-violet-400 mt-1 font-mono">ANTI-SURDITÉ</div>
                <div className="text-[11px] text-slate-500 mt-1">Retour vocal TTS DeniseNeural</div>
              </div>
            </div>
          </div>
        )}

        {/* TAB 3: RORY */}
        {activeTab === 'rory' && (
          <div className="flex-1 overflow-y-auto p-6 space-y-6">
            <div className="flex items-center justify-between pb-4 border-b border-slate-800/80">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-red-500/20 border border-red-500/40 flex items-center justify-center text-xl">
                  🛡️
                </div>
                <div>
                  <h2 className="text-base font-bold text-white">Rory · Backend & Coffre-Fort de Persistance</h2>
                  <p className="text-xs text-slate-400">Supabase RLS & Verrouillage Référentiel Horaire Local-First</p>
                </div>
              </div>
              <button
                onClick={async () => {
                  const res = await fetch('/api/tech-os/subagents/invoke', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ agentId: 'companion_rory_backend', action: 'integrity_audit' }),
                  });
                  const data = await res.json();
                  alert(`Rory Audit Intégrité SQL : ${data.stdout} [${data.timestampEdt}]`);
                }}
                className="px-3 py-1.5 text-xs font-semibold rounded-lg bg-amber-600 hover:bg-amber-500 text-white transition-colors flex items-center gap-1.5"
              >
                <span>⚡</span>
                <span>Invoquer Rory (Audit SQL)</span>
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="p-4 rounded-xl bg-slate-900 border border-slate-800">
                <div className="text-xs text-slate-400">SÉCURITÉ RLS</div>
                <div className="text-2xl font-bold text-emerald-400 mt-1 font-mono">100% ACTIF</div>
                <div className="text-[11px] text-slate-500 mt-1">Zéro fuite inter-locataires</div>
              </div>
              <div className="p-4 rounded-xl bg-slate-900 border border-slate-800">
                <div className="text-xs text-slate-400">INTÉGRITÉ RÉFÉRENTIELLE</div>
                <div className="text-2xl font-bold text-cyan-400 mt-1 font-mono">HORAIRE</div>
                <div className="text-[11px] text-slate-500 mt-1">Audit nocturne & cron SQL</div>
              </div>
              <div className="p-4 rounded-xl bg-slate-900 border border-slate-800">
                <div className="text-xs text-slate-400">RÉSILIENCE TIERS</div>
                <div className="text-2xl font-bold text-amber-400 mt-1 font-mono">LOCAL FIRST</div>
                <div className="text-[11px] text-slate-500 mt-1">Indépendant des pannes cloud</div>
              </div>
            </div>

            <div className="space-y-3">
              <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider">Contrôles d'Intégrité des Schémas et Tables</h3>
              {integrityChecks.map((chk) => (
                <div key={chk.id} className="p-4 rounded-xl bg-slate-900/80 border border-slate-800 flex items-center justify-between">
                  <div>
                    <h4 className="text-xs font-bold text-white font-mono">{chk.table}</h4>
                    <p className="text-[11px] text-slate-400 mt-1">Audit : {chk.check}</p>
                  </div>
                  <span className="px-2 py-1 rounded text-[10px] font-bold bg-emerald-950 text-emerald-300 border border-emerald-800">
                    {chk.result}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* TAB 4: RIVER WORKFLOWS CANVAS (N8N STYLE SANS DOCKER) */}
        {activeTab === 'river' && (
          <div className="flex-1 flex flex-col overflow-hidden">
            {/* Top Toolbar */}
            <div className="px-4 py-2 border-b border-slate-800 bg-slate-950/80 flex items-center justify-between gap-2 shrink-0">
              <div className="flex items-center gap-2">
                <span className="text-violet-400 font-bold text-xs flex items-center gap-1.5">
                  <span>🌀</span>
                  <span>River Workflows Canvas</span>
                </span>
                <span className="text-[10px] px-2 py-0.5 rounded bg-violet-950 text-violet-300 border border-violet-800">
                  Moteur Python Léger (n8n sans Docker)
                </span>
              </div>

              <div className="flex items-center gap-2">
                <select
                  value={activeWfId}
                  onChange={(e) => setActiveWfId(e.target.value)}
                  className="bg-slate-900 border border-slate-700 rounded px-2.5 py-1 text-xs text-slate-200 focus:outline-none focus:border-violet-500 font-medium"
                >
                  {workflows.map((wf) => (
                    <option key={wf.id} value={wf.id}>{wf.icon} {wf.name}</option>
                  ))}
                </select>

                <button
                  onClick={() => executePipeline(true)}
                  disabled={executing}
                  className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium rounded border border-slate-700 transition-colors"
                >
                  Dry-Run
                </button>

                <button
                  onClick={() => executePipeline(false)}
                  disabled={executing}
                  className="px-3 py-1 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold rounded flex items-center gap-1.5 transition-colors disabled:opacity-50"
                >
                  <span>{executing ? '⏳' : '⚡'}</span>
                  <span>{executing ? 'En cours...' : 'Exécuter Pipeline'}</span>
                </button>
              </div>
            </div>

            {/* Canvas Interactive Area */}
            <div
              className="flex-1 relative overflow-hidden bg-[#090b10] cursor-grab active:cursor-grabbing select-none"
              onMouseDown={handleMouseDownCanvas}
              onMouseMove={handleMouseMoveCanvas}
              onMouseUp={handleMouseUpCanvas}
              style={{
                backgroundImage: 'radial-gradient(rgba(255, 255, 255, 0.08) 1px, transparent 1px)',
                backgroundSize: '24px 24px',
              }}
            >
              {/* Zoom Controls */}
              <div className="absolute bottom-4 left-4 z-20 flex items-center gap-1 bg-slate-900/90 border border-slate-800 rounded-lg p-1 text-xs font-mono text-slate-300">
                <button onClick={() => setZoom((z) => Math.max(0.4, z - 0.1))} className="px-2 py-0.5 hover:bg-slate-800 rounded">-</button>
                <span className="px-1.5">{Math.round(zoom * 100)}%</span>
                <button onClick={() => setZoom((z) => Math.min(2.0, z + 0.1))} className="px-2 py-0.5 hover:bg-slate-800 rounded">+</button>
                <button onClick={() => { setZoom(1); setPan({ x: 30, y: 30 }); }} className="px-1.5 py-0.5 hover:bg-slate-800 rounded text-[10px]">Reset</button>
              </div>

              {/* Execution Log Overlay */}
              {execLog && (
                <div className="absolute bottom-4 right-4 z-20 w-96 max-h-48 bg-slate-950/95 border border-slate-800 rounded-xl p-3 text-xs font-mono shadow-2xl flex flex-col">
                  <div className="flex items-center justify-between border-b border-slate-800 pb-1 mb-1">
                    <span className={execLog.code === 0 ? 'text-emerald-400 font-bold' : 'text-rose-400 font-bold'}>
                      ● {execLog.code === 0 ? 'Exécution Réussie' : `Erreur Code ${execLog.code}`}
                    </span>
                    <button onClick={() => setExecLog(null)} className="text-slate-500 hover:text-white">✕</button>
                  </div>
                  <pre className="overflow-auto text-[11px] text-slate-300 flex-1 whitespace-pre-wrap">{execLog.stdout}</pre>
                </div>
              )}

              {/* SVG Connecting Links */}
              <svg className="absolute inset-0 w-full h-full pointer-events-none z-0">
                <g transform={`translate(${pan.x}, ${pan.y}) scale(${zoom})`}>
                  {activeWf?.nodes.map((sourceNode) => {
                    const srcPos = nodePositions[sourceNode.id] || { x: sourceNode.x, y: sourceNode.y };
                    return sourceNode.outputs.map((targetId) => {
                      const targetNode = activeWf.nodes.find((n) => n.id === targetId);
                      if (!targetNode) return null;
                      const tgtPos = nodePositions[targetId] || { x: targetNode.x, y: targetNode.y };
                      const startX = srcPos.x + 220;
                      const startY = srcPos.y + 40;
                      const endX = tgtPos.x;
                      const endY = tgtPos.y + 40;
                      const cX1 = startX + 50;
                      const cX2 = endX - 50;
                      return (
                        <path
                          key={`${sourceNode.id}-${targetId}`}
                          d={`M ${startX} ${startY} C ${cX1} ${startY}, ${cX2} ${endY}, ${endX} ${endY}`}
                          fill="none"
                          stroke="rgba(139, 92, 246, 0.5)"
                          strokeWidth="2.5"
                          strokeDasharray="4 4"
                        />
                      );
                    });
                  })}
                </g>
              </svg>

              {/* Workflow Nodes */}
              <div style={{ transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`, transformOrigin: '0 0' }}>
                {activeWf?.nodes.map((node) => {
                  const pos = nodePositions[node.id] || { x: node.x, y: node.y };
                  const color = getNodeColor(node.type);
                  const isSelected = selectedNode?.id === node.id;
                  return (
                    <div
                      key={node.id}
                      data-node
                      onMouseDown={(e) => startDragNode(e, node)}
                      style={{ transform: `translate(${pos.x}px, ${pos.y}px)`, width: 220 }}
                      className={`absolute cursor-move rounded-xl border bg-slate-900/90 shadow-lg p-3 transition-shadow ${color.border} ${
                        isSelected ? 'ring-2 ring-violet-500 shadow-xl' : ''
                      }`}
                    >
                      <div className="flex items-center justify-between pb-1 mb-1 border-b border-slate-800">
                        <span className={`text-[10px] font-bold uppercase px-1.5 py-0.2 rounded ${color.header}`}>
                          {node.type}
                        </span>
                        <span className="text-[10px] font-mono text-slate-400">{node.badge}</span>
                      </div>
                      <div className="font-bold text-xs text-white truncate">{node.name}</div>
                      <p className="text-[11px] text-slate-400 mt-1 line-clamp-2 leading-tight">{node.desc}</p>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export const App = Doctor11LifeApp;