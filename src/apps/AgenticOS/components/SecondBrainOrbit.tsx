import React, { useState, useMemo } from 'react';
import type { BrainNode } from '../types';

interface Props {
  onBack: () => void;
  onOpenApp?: (appId: string) => void;
  onSelectNodeDetail?: (node: any) => void;
}

const DEPARTMENTS = [
  { id: 'CONTENT', label: 'CONTENT', color: '#ec4899', angle: 30 },
  { id: 'COMMUNITY', label: 'COMMUNITY', color: '#06b6d4', angle: 90 },
  { id: 'PRODUCT', label: 'PRODUCT', color: '#3b82f6', angle: 150 },
  { id: 'PERSONAL', label: 'PERSONAL', color: '#eab308', angle: 210 },
  { id: 'BUSINESS', label: 'BUSINESS', color: '#a855f7', angle: 270 },
  { id: 'OPERATIONS', label: 'OPERATIONS', color: '#10b981', angle: 330 },
];

const SOUL_NODES = [
  { id: 'claude-md', label: 'CLAUDE.md', icon: '🤖', angle: 15, color: '#f97316' },
  { id: 'gemini-md', label: 'GEMINI.md', icon: '✨', angle: 75, color: '#38bdf8' },
  { id: 'soul-md', label: 'SOUL.md', icon: '👻', angle: 135, color: '#a855f7' },
  { id: 'identity-md', label: 'IDENTITY.md', icon: '🆔', angle: 195, color: '#ec4899' },
  { id: 'ikigai-md', label: 'IKIGAI.md', icon: '🎯', angle: 255, color: '#eab308' },
  { id: 'agents-local', label: 'AGENTS.md (Local)', icon: '📜', angle: 315, color: '#10b981' },
];

const GUARD_NODES = [
  { id: 'guard-dlp', label: 'Pre-Tool Guard (DLP)', icon: '🛡️', angle: 30, status: 'PASSED' },
  { id: 'guard-rot', label: 'Rot-Rate Check (>7d)', icon: '⏳', angle: 150, status: 'FRESH' },
  { id: 'guard-sssf', label: 'Post-Build SSSF Gate', icon: '⚡', angle: 270, status: 'CLEAN' },
];

const CADENCE_NODES = [
  { id: 'cad-12wy', label: '12WY Scorecard (92%)', icon: '📊', angle: 45 },
  { id: 'cad-deepwork', label: 'Strategic Block (3h)', icon: '🔒', angle: 165 },
  { id: 'cad-hermes', label: 'Hermes 24/7 Heartbeat', icon: '🕒', angle: 285 },
];

const SKILLS_NODES = [
  { id: 'sk-omnibar', label: 'Amy Omnibar (Cmd+K)', icon: '⌘', angle: 10 },
  { id: 'sk-sprint', label: '/sprint-planning', icon: '📅', angle: 70 },
  { id: 'sk-newsletter', label: '/newsletter', icon: '✉️', angle: 130 },
  { id: 'sk-adr', label: '/adr-architecture', icon: '🏛️', angle: 190 },
  { id: 'sk-youtube', label: '/youtube-ingest', icon: '▶️', angle: 250 },
  { id: 'sk-clean', label: '/clean-up', icon: '🧹', angle: 310 },
];

const RIVER_APPS = [
  { id: 'generations', label: 'Generations', icon: '🖼️', angle: 0 },
  { id: 'teleprompter', label: 'Teleprompter', icon: '📜', angle: 60 },
  { id: 'second-brain', label: 'Second Brain', icon: '🧠', angle: 120 },
  { id: 'excalidraw', label: 'Excalidraw', icon: '📐', angle: 180 },
  { id: 'passerelles', label: 'Passerelles', icon: '⇄', angle: 240 },
  { id: 'river-stream', label: 'River Webhooks (n8n)', icon: '🌊', angle: 300 },
];

const PANTRY_NODES = [
  { id: 'wal-uc', label: 'uc.db (WAL Active)', icon: '🗄️', angle: 90 },
  { id: 'wal-sssf', label: 'sssf.db (WAL Connected)', icon: '🏭', angle: 210 },
  { id: 'supabase-remote', label: 'Supabase Sync', icon: '☁️', angle: 330 },
];

export const SecondBrainOrbit: React.FC<Props> = ({ onBack, onOpenApp, onSelectNodeDetail }) => {
  const [search, setSearch] = useState('');
  const [selectedNode, setSelectedNode] = useState<BrainNode | null>(null);

  const cx = 450;
  const cy = 400;
  const rNucleus = 50;   // Nucleus: AGENTS.md
  const r6D = 100;       // 6D: Soul & Identity (CLAUDE.md, GEMINI.md, SOUL.md, etc.)
  const r5D = 160;       // 5D: Deterministic Guards
  const r4D = 220;       // 4D: Cadence & Routines
  const r3D = 280;       // 3D: Skills Deck & Omnibar
  const r2D = 340;       // 2D: River Stream & Micro Apps
  const r1D = 395;       // 1D: Silver Platter / WAL Pantry

  const handleNodeClick = (nodeInfo: any) => {
    setSelectedNode({
      id: nodeInfo.id,
      label: nodeInfo.label,
      type: 'core',
      layer: nodeInfo.layer || 1,
      connections: ['AGENTS.md', 'A\'Space V3'],
    });
    if (onSelectNodeDetail) {
      onSelectNodeDetail(nodeInfo);
    }
  };

  return (
    <div className="flex flex-col h-full bg-[#070709] text-neutral-200 select-none overflow-hidden font-sans">
      {/* Header Bar */}
      <header className="px-6 py-3 border-b border-neutral-800/80 bg-black/40 backdrop-blur-md flex items-center justify-between z-20 shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-7 h-7 rounded-lg bg-orange-600/20 border border-orange-500/40 flex items-center justify-center text-orange-400 font-bold text-sm shadow-[0_0_12px_rgba(249,115,22,0.3)]">
            7D
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-sm font-bold tracking-wide text-neutral-100 uppercase font-mono">7D CONCENTRIC ORBITAL GALAXY</h1>
              <span className="px-1.5 py-0.5 rounded bg-orange-950/60 border border-orange-800 text-[10px] text-orange-400 font-mono">
                AGENTS.MD NUCLEUS CORE
              </span>
            </div>
            <p className="text-[11px] text-neutral-500">11e Docteur • Pyramide Déterministe à 7 Niveaux (1D à 7D)</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={onBack}
            className="flex items-center gap-2 px-4 py-1.5 rounded-xl bg-neutral-900 hover:bg-neutral-800 border border-neutral-700 text-xs font-semibold text-neutral-200 transition-all hover:border-orange-500/50"
          >
            <span>←</span>
            <span>RETOUR COMMAND CENTER</span>
          </button>
        </div>
      </header>

      {/* Main View Area */}
      <div className="flex-1 min-h-0 relative flex">
        <div className="flex-1 h-full relative overflow-hidden bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-neutral-950 via-[#070709] to-black flex items-center justify-center">
          <svg
            viewBox="0 0 900 800"
            className="w-full h-full max-h-[88vh] cursor-grab active:cursor-grabbing"
            style={{ filter: 'drop-shadow(0 0 40px rgba(0,0,0,0.9))' }}
          >
            <defs>
              <radialGradient id="agentsNucleusGlow" cx="50%" cy="50%" r="50%">
                <stop offset="0%" stopColor="#10b981" stopOpacity="0.6" />
                <stop offset="60%" stopColor="#f97316" stopOpacity="0.2" />
                <stop offset="100%" stopColor="#000000" stopOpacity="0" />
              </radialGradient>
            </defs>

            {/* Concentric Dimension Orbital Circles (1D - 6D) */}
            {[r6D, r5D, r4D, r3D, r2D, r1D].map((r, idx) => {
              const labels = ['6D SOUL', '5D GUARDS', '4D CADENCE', '3D SKILLS', '2D RIVER', '1D PANTRY'];
              const colors = ['#10b981', '#ef4444', '#f59e0b', '#38bdf8', '#a855f7', '#ec4899'];
              return (
                <g key={idx}>
                  <circle
                    cx={cx}
                    cy={cy}
                    r={r}
                    fill="none"
                    stroke={colors[idx]}
                    strokeWidth="1.2"
                    strokeOpacity="0.35"
                    strokeDasharray={idx % 2 === 0 ? '4 4' : 'none'}
                  />
                  <text
                    x={cx}
                    y={cy - r - 4}
                    textAnchor="middle"
                    className="font-mono text-[9px] font-bold tracking-[0.2em] uppercase"
                    fill={colors[idx]}
                    opacity="0.8"
                  >
                    {labels[idx]}
                  </text>
                </g>
              );
            })}

            {/* LAYER 6D: SOUL & IDENTITY (CLAUDE.md, GEMINI.md, SOUL.md, IDENTITY.md, etc.) */}
            {SOUL_NODES.map((node) => {
              const rad = (node.angle * Math.PI) / 180;
              const nx = cx + r6D * Math.cos(rad);
              const ny = cy + r6D * Math.sin(rad);
              return (
                <g key={node.id} className="cursor-pointer group" onClick={() => handleNodeClick({ ...node, layer: 6, dimension: '6D' })}>
                  <line x1={cx} y1={cy} x2={nx} y2={ny} stroke="#10b981" strokeWidth="0.8" strokeOpacity="0.4" />
                  <circle cx={nx} cy={ny} r="10" fill="#064e3b" stroke="#10b981" strokeWidth="1.5" className="group-hover:scale-125 transition-transform" />
                  <text x={nx} y={ny + 3} textAnchor="middle" className="text-[10px] pointer-events-none">{node.icon}</text>
                  <text x={nx} y={ny + 18} textAnchor="middle" className="fill-emerald-300 font-mono text-[8px] font-bold">{node.label}</text>
                </g>
              );
            })}

            {/* LAYER 5D: DETERMINISTIC GUARDS */}
            {GUARD_NODES.map((node) => {
              const rad = (node.angle * Math.PI) / 180;
              const nx = cx + r5D * Math.cos(rad);
              const ny = cy + r5D * Math.sin(rad);
              return (
                <g key={node.id} className="cursor-pointer group" onClick={() => handleNodeClick({ ...node, layer: 5, dimension: '5D' })}>
                  <circle cx={nx} cy={ny} r="11" fill="#450a0a" stroke="#ef4444" strokeWidth="1.5" className="group-hover:scale-125 transition-transform" />
                  <text x={nx} y={ny + 3} textAnchor="middle" className="text-[10px] pointer-events-none">{node.icon}</text>
                  <text x={nx} y={ny + 18} textAnchor="middle" className="fill-red-300 font-mono text-[8px] font-bold">{node.label}</text>
                </g>
              );
            })}

            {/* LAYER 4D: CADENCE & ROUTINES */}
            {CADENCE_NODES.map((node) => {
              const rad = (node.angle * Math.PI) / 180;
              const nx = cx + r4D * Math.cos(rad);
              const ny = cy + r4D * Math.sin(rad);
              return (
                <g key={node.id} className="cursor-pointer group" onClick={() => handleNodeClick({ ...node, layer: 4, dimension: '4D' })}>
                  <circle cx={nx} cy={ny} r="12" fill="#451a03" stroke="#f59e0b" strokeWidth="1.5" className="group-hover:scale-125 transition-transform" />
                  <text x={nx} y={ny + 3} textAnchor="middle" className="text-[10px] pointer-events-none">{node.icon}</text>
                  <text x={nx} y={ny + 18} textAnchor="middle" className="fill-amber-300 font-mono text-[8px] font-bold">{node.label}</text>
                </g>
              );
            })}

            {/* LAYER 3D: SKILLS DECK & OMNIBAR */}
            {SKILLS_NODES.map((node) => {
              const rad = (node.angle * Math.PI) / 180;
              const nx = cx + r3D * Math.cos(rad);
              const ny = cy + r3D * Math.sin(rad);
              return (
                <g key={node.id} className="cursor-pointer group" onClick={() => handleNodeClick({ ...node, layer: 3, dimension: '3D' })}>
                  <circle cx={nx} cy={ny} r="12" fill="#082f49" stroke="#38bdf8" strokeWidth="1.5" className="group-hover:scale-125 transition-transform" />
                  <text x={nx} y={ny + 3} textAnchor="middle" className="text-[10px] pointer-events-none">{node.icon}</text>
                  <text x={nx} y={ny + 18} textAnchor="middle" className="fill-sky-300 font-mono text-[8px] font-bold">{node.label}</text>
                </g>
              );
            })}

            {/* LAYER 2D: RIVER EVENT STREAM & MICRO APPS */}
            {RIVER_APPS.map((node) => {
              const rad = (node.angle * Math.PI) / 180;
              const nx = cx + r2D * Math.cos(rad);
              const ny = cy + r2D * Math.sin(rad);
              return (
                <g key={node.id} className="cursor-pointer group" onClick={() => {
                  if (onOpenApp && node.id !== 'river-stream') onOpenApp(node.id);
                  handleNodeClick({ ...node, layer: 2, dimension: '2D' });
                }}>
                  <circle cx={nx} cy={ny} r="13" fill="#3b0764" stroke="#a855f7" strokeWidth="1.5" className="group-hover:scale-125 transition-transform" />
                  <text x={nx} y={ny + 4} textAnchor="middle" className="text-[11px] pointer-events-none">{node.icon}</text>
                  <text x={nx} y={ny + 20} textAnchor="middle" className="fill-purple-300 font-mono text-[8px] font-bold">{node.label}</text>
                </g>
              );
            })}

            {/* LAYER 1D: SILVER PLATTER / WAL PANTRY */}
            {PANTRY_NODES.map((node) => {
              const rad = (node.angle * Math.PI) / 180;
              const nx = cx + r1D * Math.cos(rad);
              const ny = cy + r1D * Math.sin(rad);
              return (
                <g key={node.id} className="cursor-pointer group" onClick={() => handleNodeClick({ ...node, layer: 1, dimension: '1D' })}>
                  <circle cx={nx} cy={ny} r="12" fill="#500724" stroke="#ec4899" strokeWidth="1.5" className="group-hover:scale-125 transition-transform" />
                  <text x={nx} y={ny + 3} textAnchor="middle" className="text-[10px] pointer-events-none">{node.icon}</text>
                  <text x={nx} y={ny + 18} textAnchor="middle" className="fill-pink-300 font-mono text-[8px] font-bold">{node.label}</text>
                </g>
              );
            })}

            {/* NUCLEUS CENTER: 7D AGENTS.MD CORE */}
            <g
              className="cursor-pointer group"
              onClick={() => handleNodeClick({ id: 'agents-md-nucleus', label: 'AGENTS.md Nucleus Core', icon: '📜', layer: 7, dimension: '7D HIVEMIND' })}
            >
              <circle cx={cx} cy={cy} r={rNucleus + 20} fill="url(#agentsNucleusGlow)" />
              <circle
                cx={cx}
                cy={cy}
                r={rNucleus}
                fill="#022c22"
                stroke="#10b981"
                strokeWidth="2.5"
                className="group-hover:scale-110 transition-transform shadow-[0_0_25px_rgba(16,185,129,0.8)]"
              />
              <circle cx={cx} cy={cy} r={rNucleus - 10} fill="#064e3b" stroke="#34d399" strokeWidth="1" strokeDasharray="3 3" />
              <text x={cx} y={cy - 10} textAnchor="middle" className="fill-emerald-400 font-mono text-[9px] font-bold uppercase tracking-wider">
                NUCLEUS 7D
              </text>
              <text x={cx} y={cy + 6} textAnchor="middle" className="fill-white font-mono text-[11px] font-extrabold">
                AGENTS.MD
              </text>
              <text x={cx} y={cy + 18} textAnchor="middle" className="fill-emerald-300 font-mono text-[8px]">
                Doctrine Center
              </text>
            </g>
          </svg>
        </div>

        {/* Right Detail Sidebar Panel */}
        <aside className="w-80 border-l border-neutral-800/80 bg-neutral-950/90 backdrop-blur-md p-5 flex flex-col justify-between overflow-y-auto shrink-0 z-10 space-y-5 text-xs font-mono">
          <div className="space-y-4">
            <div className="relative">
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Rechercher dans les 7 dimensions..."
                className="w-full bg-neutral-900 border border-neutral-800 rounded-xl px-3.5 py-2 text-xs font-mono text-neutral-200 placeholder-neutral-500 focus:outline-none focus:border-orange-500"
              />
            </div>

            <div className="p-3 rounded-xl bg-neutral-900/80 border border-neutral-800 space-y-2">
              <span className="text-[10px] text-orange-400 font-bold uppercase">7D DIMENSIONS LEGEND</span>
              <div className="space-y-1.5 text-[10px]">
                <div className="flex items-center gap-2 text-emerald-400"><span>● 7D/6D:</span><span>AGENTS.md & Soul/Identity</span></div>
                <div className="flex items-center gap-2 text-red-400"><span>● 5D:</span><span>Pre-Tool Guard & SSSF Gates</span></div>
                <div className="flex items-center gap-2 text-amber-400"><span>● 4D:</span><span>12WY & Cadence Circadienne</span></div>
                <div className="flex items-center gap-2 text-sky-400"><span>● 3D:</span><span>Amy Omnibar & Skills Deck</span></div>
                <div className="flex items-center gap-2 text-purple-400"><span>● 2D:</span><span>River Webhooks & Micro-Apps</span></div>
                <div className="flex items-center gap-2 text-pink-400"><span>● 1D:</span><span>Silver Platter Grid & WAL</span></div>
              </div>
            </div>

            {selectedNode && (
              <div className="p-4 bg-neutral-900 rounded-xl border border-orange-500/50 space-y-3 animate-fade-in">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] text-orange-400 font-bold uppercase">INSPECTEUR DE NOEUD</span>
                  <button onClick={() => setSelectedNode(null)} className="text-neutral-500 hover:text-white">✕</button>
                </div>
                <h3 className="font-bold text-neutral-100 text-xs">{selectedNode.label}</h3>
                <p className="text-[11px] text-neutral-400">Dimension : Layer {selectedNode.layer}</p>
                <div className="p-2 rounded bg-black/50 text-[10px] text-neutral-300">
                  Contrat Zod validé • Connexions : {selectedNode.connections.join(', ')}
                </div>
              </div>
            )}
          </div>
        </aside>
      </div>
    </div>
  );
};
