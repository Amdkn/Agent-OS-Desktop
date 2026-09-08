import React, { useState, useMemo } from 'react';
import type { BrainNode } from '../types';

interface Props {
  onBack: () => void;
  onOpenApp?: (appId: string) => void;
}

const DEPARTMENTS = [
  { id: 'CONTENT', label: 'CONTENT', color: '#ec4899', angle: 30, filesCount: 1420 },
  { id: 'COMMUNITY', label: 'COMMUNITY', color: '#06b6d4', angle: 90, filesCount: 3342 },
  { id: 'PRODUCT', label: 'PRODUCT', color: '#3b82f6', angle: 150, filesCount: 8910 },
  { id: 'PERSONAL', label: 'PERSONAL', color: '#eab308', angle: 210, filesCount: 1250 },
  { id: 'BUSINESS', label: 'BUSINESS', color: '#a855f7', angle: 270, filesCount: 4520 },
  { id: 'OPERATIONS', label: 'OPERATIONS', color: '#10b981', angle: 330, filesCount: 2180 },
];

const MOCK_APPS = [
  { id: 'slack', label: 'Slack', icon: '💬', angle: 15 },
  { id: 'github', label: 'GitHub', icon: '🐙', angle: 50 },
  { id: 'drive', label: 'Google Drive', icon: '📁', angle: 85 },
  { id: 'mail', label: 'Email', icon: '✉️', angle: 120 },
  { id: 'youtube', label: 'YouTube', icon: '▶️', angle: 155 },
  { id: 'stripe', label: 'Stripe', icon: '💳', angle: 190 },
  { id: 'hubspot', label: 'HubSpot', icon: '🟠', angle: 230 },
  { id: 'figma', label: 'Figma', icon: '🎨', angle: 275 },
  { id: 'bifrost', label: 'Bifrost', icon: '⚡', angle: 310 },
  { id: 'omniroute', label: 'OmniRoute', icon: '🌐', angle: 345 },
];

const MOCK_ROUTINES = [
  { id: 'r1', label: 'client health scan [HERMES]', angle: 25 },
  { id: 'r2', label: 'youtube to substack [DESKTOP]', angle: 70 },
  { id: 'r3', label: 'inbox digest [DESKTOP]', angle: 115 },
  { id: 'r4', label: 'deliverables sweep [HERMES]', angle: 160 },
  { id: 'r5', label: 'community pulse [HERMES]', angle: 210 },
  { id: 'r6', label: 'content check [HERMES]', angle: 260 },
  { id: 'r7', label: 'router guardian [HERMES]', angle: 320 },
];

export const SecondBrainOrbit: React.FC<Props> = ({ onBack, onOpenApp }) => {
  const [search, setSearch] = useState('');
  const [layout, setLayout] = useState<'Rings' | 'Force' | 'Circle' | 'Hex'>('Rings');
  const [viewMode, setViewMode] = useState<'Departments' | 'Folders'>('Departments');
  const [selectedNode, setSelectedNode] = useState<BrainNode | null>(null);
  const [showFileNames, setShowFileNames] = useState(false);
  const [ringSpin, setRingSpin] = useState(0.4);
  const [linkSprings, setLinkSprings] = useState(0.02);
  const [nodeScale, setNodeScale] = useState(0.59);
  const [showLegend, setShowLegend] = useState(false);

  const cx = 450;
  const cy = 400;
  const rCore = 65;
  const rMemory = 160;
  const rRoutines = 245;
  const rApps = 325;

  // Generate radial points for memory department fan petals
  const memoryPetals = useMemo(() => {
    const points: Array<{ id: string; x: number; y: number; color: string; label: string; dept: string }> = [];
    DEPARTMENTS.forEach((dept) => {
      const baseAngle = (dept.angle * Math.PI) / 180;
      const spread = (45 * Math.PI) / 180;
      const count = 40;
      for (let i = 0; i < count; i++) {
        const rad = rCore + 15 + ((rMemory - rCore - 10) * (i % 5)) / 4;
        const ang = baseAngle - spread / 2 + (spread * Math.floor(i / 5)) / 8;
        points.push({
          id: `${dept.id}-${i}`,
          x: cx + rad * Math.cos(ang),
          y: cy + rad * Math.sin(ang),
          color: dept.color,
          label: `${dept.id.toLowerCase()}_doc_${i + 1}.md`,
          dept: dept.label,
        });
      }
    });
    return points;
  }, [cx, cy, rCore, rMemory]);

  const filteredPetals = useMemo(() => {
    if (!search.trim()) return memoryPetals;
    const q = search.toLowerCase();
    return memoryPetals.filter((p) => p.label.toLowerCase().includes(q) || p.dept.toLowerCase().includes(q));
  }, [memoryPetals, search]);

  return (
    <div className="flex flex-col h-full bg-[#070709] text-neutral-200 select-none overflow-hidden font-sans">
      {/* Top Bar Header */}
      <header className="px-6 py-3 border-b border-neutral-800/80 bg-black/40 backdrop-blur-md flex items-center justify-between z-20 shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-7 h-7 rounded-lg bg-orange-600/20 border border-orange-500/40 flex items-center justify-center text-orange-400 font-bold text-sm shadow-[0_0_12px_rgba(249,115,22,0.3)]">
            ⬡
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-sm font-bold tracking-wide text-neutral-100 uppercase font-mono">RUBRIC SECOND BRAIN</h1>
              <span className="px-1.5 py-0.5 rounded bg-orange-950/60 border border-orange-800 text-[10px] text-orange-400 font-mono">
                ARMS LIVING MAP
              </span>
            </div>
            <p className="text-[11px] text-neutral-500">by Jay E | RoboNuggets • Visualizing 60,596 workspace files</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={onBack}
            className="flex items-center gap-2 px-4 py-1.5 rounded-xl bg-neutral-900 hover:bg-neutral-800 border border-neutral-700 text-xs font-semibold text-neutral-200 transition-all hover:border-orange-500/50"
          >
            <span>←</span>
            <span>BACK TO THE OS</span>
          </button>
        </div>
      </header>

      {/* Main View Area */}
      <div className="flex-1 min-h-0 relative flex">
        {/* SVG Living Map */}
        <div className="flex-1 h-full relative overflow-hidden bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-neutral-950 via-[#070709] to-black flex items-center justify-center">
          <svg
            viewBox="0 0 900 800"
            className="w-full h-full max-h-[85vh] cursor-grab active:cursor-grabbing"
            style={{ filter: 'drop-shadow(0 0 40px rgba(0,0,0,0.9))' }}
          >
            <defs>
              <radialGradient id="coreGlow" cx="50%" cy="50%" r="50%">
                <stop offset="0%" stopColor="#f97316" stopOpacity="0.4" />
                <stop offset="60%" stopColor="#f97316" stopOpacity="0.1" />
                <stop offset="100%" stopColor="#f97316" stopOpacity="0" />
              </radialGradient>
              <radialGradient id="nodeGlow" cx="50%" cy="50%" r="50%">
                <stop offset="0%" stopColor="#38bdf8" stopOpacity="0.5" />
                <stop offset="100%" stopColor="#38bdf8" stopOpacity="0" />
              </radialGradient>
            </defs>

            {/* Background Radial Grid */}
            <g opacity="0.15" stroke="#3f3f46" strokeWidth="0.5" strokeDasharray="3 3">
              {[rCore, rMemory, rRoutines, rApps].map((r, idx) => (
                <circle key={idx} cx={cx} cy={cy} r={r} fill="none" />
              ))}
              {[0, 45, 90, 135, 180, 225, 270, 315].map((deg) => {
                const a = (deg * Math.PI) / 180;
                return (
                  <line
                    key={deg}
                    x1={cx}
                    y1={cy}
                    x2={cx + (rApps + 40) * Math.cos(a)}
                    y2={cy + (rApps + 40) * Math.sin(a)}
                  />
                );
              })}
            </g>

            {/* 1. Outer Ring 4: APPLICATIONS */}
            <g>
              <circle
                cx={cx}
                cy={cy}
                r={rApps}
                fill="none"
                stroke="#0284c7"
                strokeWidth="1.5"
                strokeOpacity="0.4"
                strokeDasharray="6 4"
              />
              <text
                x={cx}
                y={cy - rApps - 12}
                textAnchor="middle"
                className="fill-sky-400 font-mono text-[11px] font-bold tracking-[0.25em] uppercase drop-shadow-[0_0_8px_rgba(56,189,248,0.5)]"
              >
                APPLICATIONS
              </text>
              {MOCK_APPS.map((app) => {
                const a = (app.angle * Math.PI) / 180;
                const ax = cx + rApps * Math.cos(a);
                const ay = cy + rApps * Math.sin(a);
                return (
                  <g
                    key={app.id}
                    className="cursor-pointer group"
                    onClick={() => {
                      if (onOpenApp) onOpenApp(app.id);
                    }}
                  >
                    <line x1={cx} y1={cy} x2={ax} y2={ay} stroke="#0284c7" strokeWidth="0.5" strokeOpacity="0.2" />
                    <polygon
                      points={`${ax},${ay - 12} ${ax + 10},${ay - 6} ${ax + 10},${ay + 6} ${ax},${ay + 12} ${ax - 10},${ay + 6} ${ax - 10},${ay - 6}`}
                      fill="#082f49"
                      stroke="#38bdf8"
                      strokeWidth="1.2"
                      className="group-hover:fill-sky-900 transition-colors"
                    />
                    <text x={ax} y={ay + 3} textAnchor="middle" className="text-[9px] fill-white pointer-events-none">
                      {app.icon}
                    </text>
                    <text
                      x={ax}
                      y={ay + 20}
                      textAnchor="middle"
                      className="fill-sky-300 font-mono text-[9px] opacity-80 group-hover:opacity-100"
                    >
                      {app.label}
                    </text>
                  </g>
                );
              })}
            </g>

            {/* 2. Middle Ring 3: ROUTINES */}
            <g>
              <circle
                cx={cx}
                cy={cy}
                r={rRoutines}
                fill="none"
                stroke="#eab308"
                strokeWidth="1.5"
                strokeOpacity="0.4"
                strokeDasharray="4 4"
              />
              <text
                x={cx}
                y={cy - rRoutines - 10}
                textAnchor="middle"
                className="fill-amber-400 font-mono text-[10px] font-bold tracking-[0.25em] uppercase drop-shadow-[0_0_8px_rgba(234,179,8,0.5)]"
              >
                ROUTINES
              </text>
              {MOCK_ROUTINES.map((rt) => {
                const a = (rt.angle * Math.PI) / 180;
                const rx = cx + rRoutines * Math.cos(a);
                const ry = cy + rRoutines * Math.sin(a);
                return (
                  <g key={rt.id} className="cursor-pointer group">
                    <circle
                      cx={rx}
                      cy={ry}
                      r="6"
                      fill="#451a03"
                      stroke="#f59e0b"
                      strokeWidth="1.2"
                      className="group-hover:fill-amber-700 transition-colors"
                    />
                    <circle cx={rx} cy={ry} r="2" fill="#fbbf24" />
                    {showFileNames && (
                      <text x={rx} y={ry - 9} textAnchor="middle" className="fill-amber-300 text-[8px] font-mono">
                        {rt.label}
                      </text>
                    )}
                  </g>
                );
              })}
            </g>

            {/* 3. Inner Ring 2: MEMORY Departments & Petals */}
            <g>
              <circle
                cx={cx}
                cy={cy}
                r={rMemory}
                fill="none"
                stroke="#a855f7"
                strokeWidth="1.2"
                strokeOpacity="0.3"
              />
              <text
                x={cx}
                y={cy - rMemory - 8}
                textAnchor="middle"
                className="fill-purple-400 font-mono text-[10px] font-bold tracking-[0.25em] uppercase drop-shadow-[0_0_8px_rgba(168,85,247,0.5)]"
              >
                MEMORY
              </text>

              {/* Department Spokes & Hubs */}
              {DEPARTMENTS.map((dept) => {
                const a = (dept.angle * Math.PI) / 180;
                const dx = cx + (rMemory - 15) * Math.cos(a);
                const dy = cy + (rMemory - 15) * Math.sin(a);
                return (
                  <g key={dept.id}>
                    <line x1={cx} y1={cy} x2={dx} y2={dy} stroke={dept.color} strokeWidth="1" strokeOpacity="0.4" />
                    <circle cx={dx} cy={dy} r="8" fill="#18181b" stroke={dept.color} strokeWidth="2" />
                    <text
                      x={dx}
                      y={dy + 3}
                      textAnchor="middle"
                      className="fill-white font-mono text-[8px] font-bold tracking-tight"
                    >
                      {dept.id.slice(0, 3)}
                    </text>
                    <text
                      x={dx + 14 * Math.cos(a)}
                      y={dy + 14 * Math.sin(a)}
                      textAnchor={dx > cx ? 'start' : 'end'}
                      className="fill-neutral-300 font-mono text-[9px] font-semibold"
                    >
                      {dept.label}
                    </text>
                  </g>
                );
              })}

              {/* Memory Petal Points */}
              {filteredPetals.map((pt) => (
                <circle
                  key={pt.id}
                  cx={pt.x}
                  cy={pt.y}
                  r={2.2 * nodeScale}
                  fill={pt.color}
                  opacity="0.85"
                  className="hover:scale-150 hover:opacity-100 transition-all cursor-pointer"
                  onClick={() =>
                    setSelectedNode({
                      id: pt.id,
                      label: pt.label,
                      type: 'memory_file',
                      layer: 2,
                      department: pt.dept as any,
                      connections: ['CLAUDE.md', `${pt.dept}.md`],
                    })
                  }
                />
              ))}
            </g>

            {/* 4. Nucleus Core: SKILLS & CLAUDE.MD Router */}
            <g className="cursor-pointer" onClick={() => setSelectedNode({ id: 'core', label: 'CLAUDE.md Router Hub', type: 'core', layer: 1, connections: DEPARTMENTS.map(d => d.id) })}>
              {/* Outer Core Glow */}
              <circle cx={cx} cy={cy} r={rCore + 25} fill="url(#coreGlow)" />
              {/* Core Border Circle */}
              <circle
                cx={cx}
                cy={cy}
                r={rCore}
                fill="#1c1008"
                stroke="#ea580c"
                strokeWidth="2"
                className="shadow-[0_0_20px_rgba(234,88,12,0.6)]"
              />
              <circle cx={cx} cy={cy} r={rCore - 12} fill="#27130a" stroke="#f97316" strokeWidth="1" strokeDasharray="3 3" />
              {/* Icon & Label */}
              <text x={cx} y={cy - 10} textAnchor="middle" className="fill-orange-400 font-mono text-[10px] font-bold tracking-[0.2em] uppercase">
                SKILLS
              </text>
              <text x={cx} y={cy + 8} textAnchor="middle" className="fill-white font-mono text-[11px] font-bold">
                CLAUDE.MD
              </text>
              <text x={cx} y={cy + 22} textAnchor="middle" className="fill-orange-300 font-mono text-[8px] opacity-75">
                Nucleus Router
              </text>
            </g>
          </svg>

          {/* Bottom Left Legend Button */}
          <div className="absolute bottom-6 left-6 z-10">
            <button
              onClick={() => setShowLegend(!showLegend)}
              className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-neutral-900/90 hover:bg-neutral-800 border border-neutral-700 text-xs font-mono text-neutral-300 shadow-xl"
            >
              <span>◆</span>
              <span>LEGEND</span>
            </button>
            {showLegend && (
              <div className="mt-2 p-3 bg-neutral-900/95 border border-neutral-800 rounded-xl shadow-2xl space-y-1.5 text-[11px] font-mono text-neutral-300">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-sky-400" />
                  <span>Layer 4: Applications & MCPs</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-amber-400" />
                  <span>Layer 3: Routines & Hermes Cron</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-purple-400" />
                  <span>Layer 2: Memory & Router Departments</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-orange-500" />
                  <span>Layer 1: Core Skills & CLAUDE.md</span>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Right Floating Control Deck (Matching Screenshot 3) */}
        <aside className="w-80 border-l border-neutral-800/80 bg-neutral-950/90 backdrop-blur-md p-5 flex flex-col justify-between overflow-y-auto shrink-0 z-10 space-y-5 text-xs">
          <div className="space-y-4">
            {/* Search Input */}
            <div>
              <div className="relative">
                <input
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search 60,596 files... (/)"
                  className="w-full bg-neutral-900 border border-neutral-800 rounded-xl px-3.5 py-2 text-xs font-mono text-neutral-200 placeholder-neutral-500 focus:outline-none focus:border-orange-500 transition-colors"
                />
                <span className="absolute right-3 top-2.5 text-neutral-500 font-mono text-[10px]">/</span>
              </div>
            </div>

            {/* Layout Mode Selector */}
            <div>
              <label className="text-[10px] uppercase font-mono text-neutral-500 tracking-wider font-semibold block mb-2">
                LAYOUT
              </label>
              <div className="grid grid-cols-4 gap-1 p-1 bg-neutral-900 rounded-xl border border-neutral-800 text-[11px] font-mono">
                {(['Force', 'Circle', 'Hex', 'Rings'] as const).map((l) => (
                  <button
                    key={l}
                    onClick={() => setLayout(l)}
                    className={`py-1 rounded-lg font-medium transition-all ${
                      layout === l
                        ? 'bg-neutral-800 text-orange-400 shadow-sm border border-neutral-700 font-semibold'
                        : 'text-neutral-400 hover:text-neutral-200'
                    }`}
                  >
                    {l}
                  </button>
                ))}
              </div>
            </div>

            {/* View Mode Selector */}
            <div>
              <label className="text-[10px] uppercase font-mono text-neutral-500 tracking-wider font-semibold block mb-2">
                VIEW
              </label>
              <div className="grid grid-cols-2 gap-1 p-1 bg-neutral-900 rounded-xl border border-neutral-800 text-[11px] font-mono">
                {(['Departments', 'Folders'] as const).map((v) => (
                  <button
                    key={v}
                    onClick={() => setViewMode(v)}
                    className={`py-1 rounded-lg font-medium transition-all ${
                      viewMode === v
                        ? 'bg-neutral-800 text-orange-400 shadow-sm border border-neutral-700 font-semibold'
                        : 'text-neutral-400 hover:text-neutral-200'
                    }`}
                  >
                    {v}
                  </button>
                ))}
              </div>
            </div>

            {/* Sliders & Toggles */}
            <div className="space-y-3 pt-2 border-t border-neutral-900">
              <div>
                <div className="flex justify-between text-[11px] font-mono text-neutral-400 mb-1">
                  <span>Ring Spin (Rings + Hermes)</span>
                  <span className="text-orange-400">{ringSpin}</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.05"
                  value={ringSpin}
                  onChange={(e) => setRingSpin(parseFloat(e.target.value))}
                  className="w-full accent-orange-500 h-1 bg-neutral-800 rounded-lg cursor-pointer"
                />
              </div>

              <div className="flex items-center justify-between py-1">
                <span className="text-[11px] font-mono text-neutral-400">File names</span>
                <input
                  type="checkbox"
                  checked={showFileNames}
                  onChange={(e) => setShowFileNames(e.target.checked)}
                  className="w-4 h-4 rounded accent-orange-500 bg-neutral-800 border-neutral-700 cursor-pointer"
                />
              </div>

              <div>
                <div className="flex justify-between text-[11px] font-mono text-neutral-400 mb-1">
                  <span>Link springs</span>
                  <span className="text-orange-400">{linkSprings}</span>
                </div>
                <input
                  type="range"
                  min="0.01"
                  max="0.1"
                  step="0.01"
                  value={linkSprings}
                  onChange={(e) => setLinkSprings(parseFloat(e.target.value))}
                  className="w-full accent-orange-500 h-1 bg-neutral-800 rounded-lg cursor-pointer"
                />
              </div>

              <div>
                <div className="flex justify-between text-[11px] font-mono text-neutral-400 mb-1">
                  <span>Circle / Hex size</span>
                  <span className="text-orange-400">{nodeScale}</span>
                </div>
                <input
                  type="range"
                  min="0.2"
                  max="1.5"
                  step="0.05"
                  value={nodeScale}
                  onChange={(e) => setNodeScale(parseFloat(e.target.value))}
                  className="w-full accent-orange-500 h-1 bg-neutral-800 rounded-lg cursor-pointer"
                />
              </div>
            </div>

            {/* Quick Actions */}
            <div className="grid grid-cols-2 gap-2 pt-2">
              <button
                onClick={() => setShowFileNames(true)}
                className="py-1.5 rounded-lg bg-neutral-900 hover:bg-neutral-800 border border-neutral-800 text-[11px] font-mono text-neutral-300"
              >
                Expand all
              </button>
              <button
                onClick={() => setShowFileNames(false)}
                className="py-1.5 rounded-lg bg-neutral-900 hover:bg-neutral-800 border border-neutral-800 text-[11px] font-mono text-neutral-300"
              >
                Collapse all
              </button>
            </div>
          </div>

          {/* Selected Node Details Box */}
          {selectedNode ? (
            <div className="p-3.5 bg-neutral-900/90 rounded-xl border border-orange-500/40 shadow-lg space-y-2 animate-fade-in">
              <div className="flex items-center justify-between">
                <span className="text-[10px] uppercase font-mono text-orange-400 font-bold tracking-wider">
                  NODE DETAILS
                </span>
                <button onClick={() => setSelectedNode(null)} className="text-neutral-500 hover:text-white text-xs">
                  ✕
                </button>
              </div>
              <h4 className="text-xs font-bold text-white font-mono">{selectedNode.label}</h4>
              <p className="text-[11px] text-neutral-400 font-mono">Type: {selectedNode.type} (Layer {selectedNode.layer})</p>
              {selectedNode.department && (
                <p className="text-[11px] text-neutral-400 font-mono">Department: {selectedNode.department}</p>
              )}
              <div className="pt-1 border-t border-neutral-800 text-[10px] text-neutral-500 font-mono">
                Connections: {selectedNode.connections.join(', ')}
              </div>
            </div>
          ) : (
            <button className="w-full py-2 rounded-xl bg-orange-600/20 hover:bg-orange-600/30 border border-orange-500/40 text-orange-400 font-mono text-xs font-semibold transition-colors">
              Bake settings
            </button>
          )}
        </aside>
      </div>
    </div>
  );
};
