import React, { useState, useEffect, useRef } from 'react';
import type { AppManifest } from '../../types';

export const manifest: AppManifest = {
  id: 'tech-os-workflows',
  name: 'Workflows Canvas (n8n)',
  kind: 'singleton',
  description: 'Visualisation interactive n8n-style de tous les pipelines et graphes d\'exécution Python de Tech OS.',
  icon: '🔀',
  domaine: 'l0-tech',
};

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

export function TechOSWorkflowsApp() {
  const [workflows, setWorkflows] = useState<Workflow[]>([]);
  const [activeWfId, setActiveWfId] = useState<string>('wf-dark-factory');
  const [selectedNode, setSelectedNode] = useState<WfNode | null>(null);
  const [zoom, setZoom] = useState<number>(1);
  const [pan, setPan] = useState<{ x: number; y: number }>({ x: 40, y: 40 });
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
      .catch((err) => console.error('Erreur chargement workflows:', err));
  }, []);

  const activeWf = workflows.find((w) => w.id === activeWfId) || workflows[0];

  const handleMouseDownCanvas = (e: React.MouseEvent) => {
    if ((e.target as HTMLElement).closest('[data-node]')) return;
    setIsPanning(true);
    setDragStart({ x: e.clientX - pan.x, y: e.clientY - pan.y });
  };

  const handleMouseMoveCanvas = (e: React.MouseEvent) => {
    if (isPanning) {
      setPan({
        x: e.clientX - dragStart.x,
        y: e.clientY - dragStart.y,
      });
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
        return { border: 'border-emerald-500/60', bg: 'bg-emerald-950/30', header: 'bg-emerald-500/20 text-emerald-400', glow: 'shadow-[0_0_15px_rgba(16,185,129,0.15)]' };
      case 'filter':
        return { border: 'border-amber-500/60', bg: 'bg-amber-950/30', header: 'bg-amber-500/20 text-amber-400', glow: 'shadow-[0_0_15px_rgba(245,158,11,0.15)]' };
      case 'transformer':
        return { border: 'border-cyan-500/60', bg: 'bg-cyan-950/30', header: 'bg-cyan-500/20 text-cyan-400', glow: 'shadow-[0_0_15px_rgba(6,182,212,0.15)]' };
      case 'action':
        return { border: 'border-violet-500/60', bg: 'bg-violet-950/30', header: 'bg-violet-500/20 text-violet-400', glow: 'shadow-[0_0_15px_rgba(139,92,246,0.15)]' };
      case 'output':
        return { border: 'border-rose-500/60', bg: 'bg-rose-950/30', header: 'bg-rose-500/20 text-rose-400', glow: 'shadow-[0_0_15px_rgba(244,63,94,0.15)]' };
    }
  };

  return (
    <div className="flex h-full w-full bg-[#0a0c10] text-neutral-200 select-none overflow-hidden font-sans">
      {/* 1. Volet Latéral Gauche : Sélecteur de Workflows & Stats */}
      <aside className="w-64 border-r border-neutral-800/80 bg-[#0d1017] flex flex-col shrink-0 z-20">
        <div className="p-3 border-b border-neutral-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-xl">🔀</span>
            <div>
              <h2 className="text-xs font-bold uppercase tracking-wider text-emerald-400 font-mono">Tech OS Workflows</h2>
              <p className="text-[10px] text-neutral-500 font-mono">Topologie n8n • Python Runtime</p>
            </div>
          </div>
          <span className="px-1.5 py-0.5 rounded text-[9px] font-mono bg-emerald-950 border border-emerald-800/60 text-emerald-400">
            {workflows.length} flux
          </span>
        </div>

        <div className="flex-1 overflow-y-auto p-2 space-y-1">
          {workflows.map((wf) => {
            const isActive = wf.id === activeWfId;
            return (
              <button
                key={wf.id}
                onClick={() => {
                  setActiveWfId(wf.id);
                  setSelectedNode(null);
                  setExecLog(null);
                }}
                className={`w-full text-left px-2.5 py-2 rounded-lg border transition-all flex flex-col gap-1 ${
                  isActive
                    ? 'bg-neutral-800/80 border-emerald-500/50 shadow-sm text-neutral-100'
                    : 'bg-neutral-900/30 border-transparent hover:bg-neutral-800/40 hover:border-neutral-700/50 text-neutral-400'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <span className="text-sm">{wf.icon}</span>
                    <span className="text-[11px] font-semibold tracking-wide truncate max-w-[140px]">{wf.name}</span>
                  </div>
                  <span className="text-[9px] font-mono text-neutral-500">{wf.nodes.length} nœuds</span>
                </div>
                <div className="text-[10px] text-neutral-500 truncate font-mono">{wf.script}</div>
              </button>
            );
          })}
        </div>

        {/* Contrôles Canvas */}
        <div className="p-2 border-t border-neutral-800/80 bg-neutral-950/60 flex items-center justify-between text-xs font-mono">
          <span className="text-neutral-500 text-[10px]">Zoom: {Math.round(zoom * 100)}%</span>
          <div className="flex items-center gap-1">
            <button
              onClick={() => setZoom((z) => Math.max(0.4, z - 0.1))}
              className="px-2 py-0.5 rounded bg-neutral-800 hover:bg-neutral-700 text-neutral-300"
            >
              -
            </button>
            <button
              onClick={() => {
                setZoom(1);
                setPan({ x: 40, y: 40 });
              }}
              className="px-2 py-0.5 rounded bg-neutral-800 hover:bg-neutral-700 text-neutral-300"
            >
              1:1
            </button>
            <button
              onClick={() => setZoom((z) => Math.min(2.0, z + 0.1))}
              className="px-2 py-0.5 rounded bg-neutral-800 hover:bg-neutral-700 text-neutral-300"
            >
              +
            </button>
          </div>
        </div>
      </aside>

      {/* 2. Espace Central : Canvas n8n Drag-and-Drop */}
      <main
        className="flex-1 relative overflow-hidden cursor-grab active:cursor-grabbing bg-[#090b10]"
        onMouseDown={handleMouseDownCanvas}
        onMouseMove={handleMouseMoveCanvas}
        onMouseUp={handleMouseUpCanvas}
        style={{
          backgroundImage:
            'radial-gradient(circle at 1px 1px, rgba(255, 255, 255, 0.05) 1px, transparent 0)',
          backgroundSize: '24px 24px',
        }}
      >
        {/* Barre Supérieure du Workflow */}
        <header className="absolute top-3 left-4 right-4 z-10 flex items-center justify-between bg-neutral-900/80 backdrop-blur-md border border-neutral-800 px-4 py-2 rounded-xl shadow-lg">
          <div className="flex items-center gap-3">
            <span className="text-2xl">{activeWf?.icon}</span>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-sm font-bold text-neutral-100">{activeWf?.name}</h1>
                <span className="px-2 py-0.5 rounded-full text-[9px] font-mono bg-emerald-950 text-emerald-400 border border-emerald-800">
                  {activeWf?.category}
                </span>
              </div>
              <p className="text-[11px] text-neutral-400 max-w-xl truncate">{activeWf?.description}</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => executePipeline(true)}
              disabled={executing}
              className="px-3 py-1.5 rounded-lg border border-neutral-700 bg-neutral-800/80 hover:bg-neutral-700 text-xs font-mono text-neutral-300 transition-colors"
            >
              Dry Run
            </button>
            <button
              onClick={() => executePipeline(false)}
              disabled={executing}
              className="px-3.5 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-neutral-950 font-bold text-xs font-mono flex items-center gap-1.5 shadow-md shadow-emerald-900/30 transition-all disabled:opacity-50"
            >
              <span>{executing ? '⏳' : '▶'}</span>
              <span>{executing ? 'Exécution…' : 'Exécuter Pipeline'}</span>
            </button>
          </div>
        </header>

        {/* Surface Canvas Transformée (Pan & Zoom) */}
        <div
          className="absolute inset-0 origin-top-left transition-transform duration-75 ease-out"
          style={{
            transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`,
          }}
        >
          {/* Lignes de Connexions SVG (Bézier Curves n8n) */}
          <svg className="absolute inset-0 w-[3000px] h-[3000px] pointer-events-none overflow-visible">
            <defs>
              <linearGradient id="edge-grad" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="#10b981" stopOpacity="0.8" />
                <stop offset="100%" stopColor="#06b6d4" stopOpacity="0.8" />
              </linearGradient>
            </defs>
            {activeWf?.nodes.flatMap((node) => {
              const startPos = nodePositions[node.id] || { x: node.x, y: node.y };
              const startX = startPos.x + 220; // Sortie droite du nœud
              const startY = startPos.y + 45;

              return node.outputs.map((targetId) => {
                const targetNode = activeWf.nodes.find((n) => n.id === targetId);
                if (!targetNode) return null;
                const endPos = nodePositions[targetId] || { x: targetNode.x, y: targetNode.y };
                const endX = endPos.x; // Entrée gauche du nœud
                const endY = endPos.y + 45;

                const dx = Math.max(60, Math.abs(endX - startX) * 0.5);
                const pathD = `M ${startX} ${startY} C ${startX + dx} ${startY}, ${endX - dx} ${endY}, ${endX} ${endY}`;

                return (
                  <g key={`${node.id}-${targetId}`}>
                    <path
                      d={pathD}
                      fill="none"
                      stroke="#022c22"
                      strokeWidth="6"
                      opacity="0.5"
                    />
                    <path
                      d={pathD}
                      fill="none"
                      stroke="url(#edge-grad)"
                      strokeWidth="2.5"
                      strokeDasharray="6,4"
                      className="animate-pulse"
                    />
                    <circle cx={startX} cy={startY} r="3.5" fill="#10b981" />
                    <circle cx={endX} cy={endY} r="3.5" fill="#06b6d4" />
                  </g>
                );
              });
            })}
          </svg>

          {/* Nœuds Canvas n8n */}
          {activeWf?.nodes.map((node) => {
            const pos = nodePositions[node.id] || { x: node.x, y: node.y };
            const isSelected = selectedNode?.id === node.id;
            const styleTheme = getNodeColor(node.type);

            return (
              <div
                key={node.id}
                data-node={node.id}
                onMouseDown={(e) => startDragNode(e, node)}
                onClick={(e) => {
                  e.stopPropagation();
                  setSelectedNode(node);
                }}
                className={`absolute w-[220px] rounded-xl border ${styleTheme.border} ${styleTheme.bg} ${styleTheme.glow} backdrop-blur-md cursor-pointer transition-shadow select-none shadow-md ${
                  isSelected ? 'ring-2 ring-emerald-400 shadow-emerald-500/20' : ''
                }`}
                style={{
                  left: pos.x,
                  top: pos.y,
                }}
              >
                {/* En-tête du nœud */}
                <div className={`px-3 py-1.5 rounded-t-xl flex items-center justify-between border-b border-white/5 ${styleTheme.header}`}>
                  <span className="text-[10px] font-mono uppercase font-bold tracking-wider">{node.type}</span>
                  <span className="text-[9px] font-mono px-1.5 py-0.2 rounded bg-black/40 text-neutral-300">{node.badge}</span>
                </div>

                {/* Corps du nœud */}
                <div className="p-3">
                  <div className="text-xs font-bold text-neutral-100 flex items-center justify-between">
                    <span>{node.name}</span>
                    <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping opacity-75" />
                  </div>
                  <p className="text-[10px] text-neutral-400 mt-1 line-clamp-2 leading-relaxed">{node.desc}</p>
                  <div className="mt-2 text-[9px] font-mono text-neutral-500 bg-neutral-950/60 p-1 rounded truncate">
                    📁 {node.file}
                  </div>
                </div>

                {/* Connecteurs d'ancrage n8n */}
                {node.inputs.length > 0 && (
                  <div
                    className="absolute -left-2 top-1/2 -translate-y-1/2 w-4 h-4 rounded-full bg-neutral-900 border-2 border-emerald-500 flex items-center justify-center shadow"
                    title="Entrée flux"
                  >
                    <div className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                  </div>
                )}
                {node.outputs.length > 0 && (
                  <div
                    className="absolute -right-2 top-1/2 -translate-y-1/2 w-4 h-4 rounded-full bg-neutral-900 border-2 border-cyan-500 flex items-center justify-center shadow"
                    title="Sortie flux"
                  >
                    <div className="w-1.5 h-1.5 rounded-full bg-cyan-400" />
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* 3. Volet Latéral Droit : Inspecteur de Nœud & Console d'Exécution */}
        {(selectedNode || execLog) && (
          <aside className="absolute right-4 bottom-4 top-20 w-80 bg-[#0d1017]/95 backdrop-blur-xl border border-neutral-800 rounded-xl p-4 flex flex-col gap-3 shadow-2xl z-30 overflow-hidden">
            <div className="flex items-center justify-between border-b border-neutral-800 pb-2">
              <h3 className="text-xs font-bold uppercase tracking-wider text-neutral-200 font-mono">
                {selectedNode ? 'Détails du Nœud' : 'Journal d’Exécution'}
              </h3>
              <button
                onClick={() => {
                  setSelectedNode(null);
                  setExecLog(null);
                }}
                className="text-neutral-500 hover:text-neutral-300 text-xs px-1"
              >
                ✕
              </button>
            </div>

            {selectedNode && (
              <div className="flex-1 overflow-y-auto space-y-2.5 text-xs">
                <div>
                  <div className="text-[10px] font-mono text-neutral-500 uppercase">Nom du nœud</div>
                  <div className="font-bold text-neutral-100 text-sm">{selectedNode.name}</div>
                </div>

                <div>
                  <div className="text-[10px] font-mono text-neutral-500 uppercase">Rôle & Type</div>
                  <div className="text-emerald-400 font-mono">{selectedNode.type} • {selectedNode.badge}</div>
                </div>

                <div>
                  <div className="text-[10px] font-mono text-neutral-500 uppercase">Description du composant</div>
                  <div className="text-neutral-300 leading-relaxed bg-neutral-900/60 p-2 rounded border border-neutral-800 text-[11px]">
                    {selectedNode.desc}
                  </div>
                </div>

                <div>
                  <div className="text-[10px] font-mono text-neutral-500 uppercase">Fichier / Module source</div>
                  <div className="font-mono text-[10px] text-cyan-400 bg-neutral-950 p-2 rounded border border-neutral-800 break-all">
                    {selectedNode.file}
                  </div>
                </div>

                <div>
                  <div className="text-[10px] font-mono text-neutral-500 uppercase">Topologie des connexions</div>
                  <div className="text-[11px] text-neutral-400 space-y-1 mt-1">
                    <div>Entrées: {selectedNode.inputs.length ? selectedNode.inputs.join(', ') : 'Aucune (Trigger racine)'}</div>
                    <div>Sorties: {selectedNode.outputs.length ? selectedNode.outputs.join(', ') : 'Aucune (Sortie terminale)'}</div>
                  </div>
                </div>
              </div>
            )}

            {execLog && (
              <div className="flex-1 flex flex-col min-h-0 pt-2 border-t border-neutral-800">
                <div className="flex items-center justify-between text-[10px] font-mono mb-1">
                  <span className="text-neutral-400">Code de sortie:</span>
                  <span className={`font-bold ${execLog.code === 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                    RC = {execLog.code}
                  </span>
                </div>
                <pre className="flex-1 p-2 bg-black/80 rounded border border-neutral-800 text-[10px] font-mono text-neutral-300 overflow-y-auto whitespace-pre-wrap">
                  {execLog.stdout || execLog.stderr}
                </pre>
              </div>
            )}
          </aside>
        )}
      </main>
    </div>
  );
}

export const App = TechOSWorkflowsApp;
