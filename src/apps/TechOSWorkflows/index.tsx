import React, { useState, useEffect, useRef, useMemo } from 'react';
import type { AppManifest } from '../../types';
import rawCatalog from '../../data/python_scripts_catalog.json';
import {
  ChevronRight,
  ChevronDown,
  Folder,
  FolderOpen,
  FileCode2,
  Play,
  CheckCircle2,
  Sparkles,
  Search,
  Workflow as WorkflowIcon,
  Terminal,
  RefreshCw,
  X
} from 'lucide-react';

export const manifest: AppManifest = {
  id: 'tech-os-workflows',
  name: 'Workflows & Python Scripts (n8n + Tree)',
  kind: 'singleton',
  description: 'Explorateur arborescent toggle des scripts Python V3 (style Antigravity) et canvas interactif n8n de pipelines opérationnels.',
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

interface ScriptItem {
  name: string;
  path: string;
  type: string;
  color: string;
  isVerifier: boolean;
  isGenerator: boolean;
}

interface SubGroup {
  label: string;
  icon: string;
  scripts: ScriptItem[];
}

interface DomainGroup {
  id: string;
  label: string;
  icon: string;
  sub: Record<string, SubGroup>;
}

type FilterType = 'all' | 'generators' | 'verifiers';

export function TechOSWorkflowsApp() {
  const [viewMode, setViewMode] = useState<'canvas' | 'script'>('canvas');
  const [workflows, setWorkflows] = useState<Workflow[]>([]);
  const [activeWfId, setActiveWfId] = useState<string>('wf-dark-factory');
  const [selectedNode, setSelectedNode] = useState<WfNode | null>(null);
  const [zoom, setZoom] = useState<number>(1);
  const [pan, setPan] = useState<{ x: number; y: number }>({ x: 40, y: 40 });
  const [isPanning, setIsPanning] = useState(false);
  const [dragStart, setDragStart] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [nodePositions, setNodePositions] = useState<Record<string, { x: number; y: number }>>({});
  const draggingNodeRef = useRef<{ id: string; startX: number; startY: number; initX: number; initY: number } | null>(null);

  const [selectedScript, setSelectedScript] = useState<ScriptItem | null>(null);
  const [executing, setExecuting] = useState(false);
  const [execLog, setExecLog] = useState<{ stdout: string; stderr: string; code: number; cmd?: string } | null>(null);

  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState<FilterType>('all');
  const [openFolders, setOpenFolders] = useState<Record<string, boolean>>({
    '10_Tech_OS': true,
    '10_Tech_OS:kernel_core': true,
    '20_Life_OS': true,
    '30_Business_OS': true,
    'Organes_Transversaux': true,
  });

  const catalog = rawCatalog as Record<string, DomainGroup>;

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

  const toggleFolder = (key: string) => {
    setOpenFolders((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const filteredCatalog = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    const result: Record<string, DomainGroup> = {};

    Object.entries(catalog).forEach(([domainKey, domain]) => {
      const filteredSubs: Record<string, SubGroup> = {};

      Object.entries(domain.sub).forEach(([subKey, subGroup]) => {
        const matchingScripts = subGroup.scripts.filter((s) => {
          if (filterType === 'generators' && !s.isGenerator) return false;
          if (filterType === 'verifiers' && !s.isVerifier) return false;
          if (!q) return true;
          return s.name.toLowerCase().includes(q) || s.path.toLowerCase().includes(q);
        });

        if (matchingScripts.length > 0) {
          filteredSubs[subKey] = {
            ...subGroup,
            scripts: matchingScripts,
          };
        }
      });

      if (Object.keys(filteredSubs).length > 0) {
        result[domainKey] = {
          ...domain,
          sub: filteredSubs,
        };
      }
    });

    return result;
  }, [catalog, searchQuery, filterType]);

  const stats = useMemo(() => {
    let total = 0;
    let generators = 0;
    let verifiers = 0;
    Object.values(catalog).forEach((d) => {
      Object.values(d.sub).forEach((s) => {
        s.scripts.forEach((item) => {
          total++;
          if (item.isGenerator) generators++;
          if (item.isVerifier) verifiers++;
        });
      });
    });
    return { total, generators, verifiers, operational: total - generators - verifiers };
  }, [catalog]);

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

  const executeTarget = async (scriptPath: string, args: string = '') => {
    setExecuting(true);
    setExecLog(null);
    try {
      const res = await fetch('/api/tech-os/execute', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          path: scriptPath,
          args,
        }),
      });
      const json = await res.json();
      setExecLog({
        stdout: json.stdout || '(aucun output)',
        stderr: json.stderr || '',
        code: json.exitCode ?? 0,
        cmd: json.cmd,
      });
    } catch (e: any) {
      setExecLog({ stdout: '', stderr: e.message, code: 1 });
    } finally {
      setExecuting(false);
    }
  };

  const executePipeline = async (dryRun = false) => {
    if (!activeWf) return;
    const path = `10_Tech_OS/kernel/${activeWf.script}`;
    const args = dryRun ? '--dry-run' : (activeWf.script === 'dark_factory.py' ? '--intent C:/Users/amado/ASpace_OS_V3/_INBOX/_admis/S1_Rick/intent-rescope-cascade-20260902.md' : 'run');
    await executeTarget(path, args);
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
    <div className="flex h-full w-full bg-[#090b10] text-neutral-200 select-none overflow-hidden font-sans">
      <aside className="w-72 border-r border-neutral-800/90 bg-[#0d1017] flex flex-col shrink-0 z-20">
        <div className="p-3 border-b border-neutral-800/80 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-lg">📁</span>
            <div>
              <h2 className="text-xs font-bold uppercase tracking-wider text-neutral-200 font-mono">
                Corpus Python .py
              </h2>
              <p className="text-[10px] text-neutral-500 font-mono">
                {stats.total} scripts répertoriés
              </p>
            </div>
          </div>
          <button
            onClick={() => {
              setSearchQuery('');
              setFilterType('all');
            }}
            className="p-1 rounded text-neutral-500 hover:text-neutral-300 hover:bg-neutral-800/60 transition-colors"
            title="Réinitialiser les filtres"
          >
            <RefreshCw className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="p-2 border-b border-neutral-800/60">
          <div className="relative flex items-center">
            <Search className="w-3.5 h-3.5 text-neutral-500 absolute left-2.5 pointer-events-none" />
            <input
              type="text"
              placeholder="Rechercher script (.py)..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-8 pr-7 py-1 bg-neutral-900/90 border border-neutral-800 rounded-md text-xs text-neutral-200 placeholder-neutral-500 focus:outline-none focus:border-emerald-500/60 font-mono"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-2 text-neutral-500 hover:text-neutral-300"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          <div className="flex items-center gap-1 mt-2">
            <button
              onClick={() => setFilterType('all')}
              className={`flex-1 py-1 rounded text-[10px] font-mono font-medium transition-colors border ${
                filterType === 'all'
                  ? 'bg-neutral-800 text-neutral-100 border-neutral-700'
                  : 'bg-transparent text-neutral-500 hover:text-neutral-300 border-transparent'
              }`}
            >
              Tous ({stats.total})
            </button>
            <button
              onClick={() => setFilterType('generators')}
              className={`flex-1 py-1 rounded text-[10px] font-mono font-medium transition-colors border flex items-center justify-center gap-1 ${
                filterType === 'generators'
                  ? 'bg-emerald-950/80 text-emerald-300 border-emerald-700/80'
                  : 'bg-transparent text-neutral-500 hover:text-emerald-400 border-transparent'
              }`}
              title="Systèmes générateurs, moteurs d'action et builders"
            >
              <Sparkles className="w-2.5 h-2.5" />
              <span>Moteurs ({stats.generators})</span>
            </button>
            <button
              onClick={() => setFilterType('verifiers')}
              className={`flex-1 py-1 rounded text-[10px] font-mono font-medium transition-colors border flex items-center justify-center gap-1 ${
                filterType === 'verifiers'
                  ? 'bg-amber-950/80 text-amber-300 border-amber-700/80'
                  : 'bg-transparent text-neutral-500 hover:text-amber-400 border-transparent'
              }`}
              title="Scripts de vérification passive et assertions"
            >
              <CheckCircle2 className="w-2.5 h-2.5" />
              <span>Vérif ({stats.verifiers})</span>
            </button>
          </div>
        </div>

        <div className="border-b border-neutral-800/80 p-2 bg-neutral-950/40">
          <div className="flex items-center justify-between text-[11px] font-mono text-neutral-400 px-1 mb-1.5 font-bold uppercase tracking-wider">
            <span className="flex items-center gap-1.5">
              <WorkflowIcon className="w-3.5 h-3.5 text-emerald-400" />
              <span>Pipelines n8n Canvas</span>
            </span>
            <span className="text-[10px] text-neutral-500 font-normal">{workflows.length} flux</span>
          </div>

          <div className="space-y-0.5">
            {workflows.map((wf) => {
              const isSelected = viewMode === 'canvas' && wf.id === activeWfId;
              return (
                <button
                  key={wf.id}
                  onClick={() => {
                    setActiveWfId(wf.id);
                    setViewMode('canvas');
                    setSelectedScript(null);
                    setSelectedNode(null);
                  }}
                  className={`w-full text-left px-2 py-1.5 rounded text-xs flex items-center justify-between transition-colors border ${
                    isSelected
                      ? 'bg-emerald-950/60 border-emerald-500/50 text-emerald-200'
                      : 'border-transparent text-neutral-400 hover:bg-neutral-800/50 hover:text-neutral-200'
                  }`}
                >
                  <div className="flex items-center gap-2 truncate">
                    <span>{wf.icon}</span>
                    <span className="truncate text-[11px] font-medium">{wf.name}</span>
                  </div>
                  <span className="text-[9px] font-mono text-neutral-500 shrink-0">
                    {wf.nodes.length} nœuds
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-1.5 space-y-1">
          <div className="text-[10px] font-mono uppercase tracking-wider text-neutral-500 px-2 pt-1 pb-0.5 font-bold">
            Explorateur de Scripts Python
          </div>

          {Object.entries(filteredCatalog).map(([domainKey, domain]) => {
            const isDomainOpen = !!openFolders[domainKey];
            const domainScriptCount = Object.values(domain.sub).reduce(
              (acc, s) => acc + s.scripts.length,
              0
            );

            return (
              <div key={domainKey} className="space-y-0.5">
                <button
                  onClick={() => toggleFolder(domainKey)}
                  className="w-full text-left px-2 py-1 rounded flex items-center justify-between text-xs font-semibold text-neutral-300 hover:bg-neutral-800/60 transition-colors group"
                >
                  <div className="flex items-center gap-1.5 truncate">
                    {isDomainOpen ? (
                      <ChevronDown className="w-3.5 h-3.5 text-neutral-500 group-hover:text-neutral-300" />
                    ) : (
                      <ChevronRight className="w-3.5 h-3.5 text-neutral-500 group-hover:text-neutral-300" />
                    )}
                    {isDomainOpen ? (
                      <FolderOpen className="w-3.5 h-3.5 text-amber-400/90" />
                    ) : (
                      <Folder className="w-3.5 h-3.5 text-amber-400/80" />
                    )}
                    <span className="truncate text-[11px]">{domain.label}</span>
                  </div>
                  <span className="text-[9px] font-mono text-neutral-500 bg-neutral-900 px-1 py-0.2 rounded">
                    {domainScriptCount}
                  </span>
                </button>

                {isDomainOpen && (
                  <div className="pl-3.5 space-y-0.5 border-l border-neutral-800/60 ml-2">
                    {Object.entries(domain.sub).map(([subKey, subGroup]) => {
                      const subFolderKey = `${domainKey}:${subKey}`;
                      const isSubOpen = !!openFolders[subFolderKey];

                      return (
                        <div key={subKey} className="space-y-0.5">
                          <button
                            onClick={() => toggleFolder(subFolderKey)}
                            className="w-full text-left px-1.5 py-0.5 rounded flex items-center justify-between text-[11px] text-neutral-400 hover:text-neutral-200 hover:bg-neutral-800/40 transition-colors"
                          >
                            <div className="flex items-center gap-1 truncate">
                              {isSubOpen ? (
                                <ChevronDown className="w-3 h-3 text-neutral-500" />
                              ) : (
                                <ChevronRight className="w-3 h-3 text-neutral-500" />
                              )}
                              <span className="text-xs">{subGroup.icon}</span>
                              <span className="truncate font-medium">{subGroup.label}</span>
                            </div>
                            <span className="text-[9px] font-mono text-neutral-500">
                              {subGroup.scripts.length}
                            </span>
                          </button>

                          {isSubOpen && (
                            <div className="pl-3 space-y-0.5 border-l border-neutral-800/40 ml-1.5">
                              {subGroup.scripts.map((script) => {
                                const isSelected =
                                  viewMode === 'script' && selectedScript?.path === script.path;

                                return (
                                  <button
                                    key={script.path}
                                    onClick={() => {
                                      setSelectedScript(script);
                                      setViewMode('script');
                                      setExecLog(null);
                                    }}
                                    className={`w-full text-left px-1.5 py-1 rounded text-[11px] font-mono flex items-center justify-between transition-colors border ${
                                      isSelected
                                        ? 'bg-neutral-800 border-neutral-600 text-neutral-100 shadow-sm'
                                        : 'border-transparent text-neutral-400 hover:bg-neutral-800/40 hover:text-neutral-200'
                                    }`}
                                  >
                                    <div className="flex items-center gap-1.5 truncate">
                                      <FileCode2
                                        className={`w-3 h-3 shrink-0 ${
                                          script.isGenerator
                                            ? 'text-emerald-400'
                                            : script.isVerifier
                                            ? 'text-amber-400'
                                            : 'text-cyan-400'
                                        }`}
                                      />
                                      <span className="truncate">{script.name}</span>
                                    </div>
                                    <span
                                      className={`text-[8px] px-1 py-0.2 rounded font-mono shrink-0 ml-1 ${
                                        script.isGenerator
                                          ? 'bg-emerald-950 text-emerald-400 border border-emerald-800/60'
                                          : script.isVerifier
                                          ? 'bg-amber-950 text-amber-400 border border-amber-800/60'
                                          : 'bg-cyan-950 text-cyan-400 border border-cyan-800/60'
                                      }`}
                                    >
                                      {script.isGenerator ? 'Moteur' : script.isVerifier ? 'Vérif' : 'Op'}
                                    </span>
                                  </button>
                                );
                              })}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {viewMode === 'canvas' && (
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
        )}
      </aside>

      <main className="flex-1 relative overflow-hidden flex flex-col bg-[#080a0f]">
        {viewMode === 'canvas' && (
          <div
            className="flex-1 relative overflow-hidden cursor-grab active:cursor-grabbing"
            onMouseDown={handleMouseDownCanvas}
            onMouseMove={handleMouseMoveCanvas}
            onMouseUp={handleMouseUpCanvas}
            style={{
              backgroundImage:
                'radial-gradient(circle at 1px 1px, rgba(255, 255, 255, 0.05) 1px, transparent 0)',
              backgroundSize: '24px 24px',
            }}
          >
            <header className="absolute top-3 left-4 right-4 z-10 flex items-center justify-between bg-neutral-900/90 backdrop-blur-md border border-neutral-800 px-4 py-2.5 rounded-xl shadow-xl">
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

            <div
              className="absolute inset-0 origin-top-left transition-transform duration-75 ease-out"
              style={{
                transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`,
              }}
            >
              <svg className="absolute inset-0 w-[3000px] h-[3000px] pointer-events-none overflow-visible">
                <defs>
                  <linearGradient id="edge-grad" x1="0%" y1="0%" x2="100%" y2="0%">
                    <stop offset="0%" stopColor="#10b981" stopOpacity="0.8" />
                    <stop offset="100%" stopColor="#06b6d4" stopOpacity="0.8" />
                  </linearGradient>
                </defs>
                {activeWf?.nodes.flatMap((node) => {
                  const startPos = nodePositions[node.id] || { x: node.x, y: node.y };
                  const startX = startPos.x + 220;
                  const startY = startPos.y + 45;

                  return node.outputs.map((targetId) => {
                    const targetNode = activeWf.nodes.find((n) => n.id === targetId);
                    if (!targetNode) return null;
                    const endPos = nodePositions[targetId] || { x: targetNode.x, y: targetNode.y };
                    const endX = endPos.x;
                    const endY = endPos.y + 45;

                    const dx = Math.max(40, (endX - startX) / 2);
                    const pathData = `M ${startX} ${startY} C ${startX + dx} ${startY}, ${endX - dx} ${endY}, ${endX} ${endY}`;

                    return (
                      <g key={`${node.id}->${targetId}`}>
                        <path
                          d={pathData}
                          fill="none"
                          stroke="url(#edge-grad)"
                          strokeWidth="2.5"
                          strokeDasharray="6,4"
                        />
                        <circle cx={endX} cy={endY} r="3" fill="#06b6d4" />
                      </g>
                    );
                  });
                })}
              </svg>

              {activeWf?.nodes.map((node) => {
                const pos = nodePositions[node.id] || { x: node.x, y: node.y };
                const colors = getNodeColor(node.type);
                const isSelected = selectedNode?.id === node.id;

                return (
                  <div
                    key={node.id}
                    data-node="true"
                    onMouseDown={(e) => startDragNode(e, node)}
                    style={{ left: pos.x, top: pos.y, width: 220 }}
                    className={`absolute p-3 rounded-xl border bg-[#0d1017]/95 backdrop-blur shadow-lg cursor-grab active:cursor-grabbing transition-shadow ${colors.border} ${colors.bg} ${colors.glow} ${
                      isSelected ? 'ring-2 ring-cyan-400 shadow-cyan-500/20' : ''
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1.5">
                      <span className={`text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded ${colors.header}`}>
                        {node.type}
                      </span>
                      <span className="text-[9px] font-mono text-neutral-400 bg-neutral-900/80 px-1 py-0.5 rounded border border-neutral-800">
                        {node.badge}
                      </span>
                    </div>

                    <div className="font-bold text-xs text-neutral-100 mb-1">{node.name}</div>
                    <div className="text-[10px] text-neutral-400 line-clamp-2 leading-relaxed mb-2">
                      {node.desc}
                    </div>

                    <div className="text-[9px] font-mono text-neutral-500 truncate border-t border-neutral-800/80 pt-1.5 flex items-center justify-between">
                      <span className="truncate">{node.file}</span>
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 shrink-0 ml-1" />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {viewMode === 'script' && selectedScript && (
          <div className="flex-1 flex flex-col p-6 overflow-y-auto space-y-5">
            <div className="flex items-start justify-between border-b border-neutral-800/80 pb-4">
              <div className="flex items-start gap-3">
                <div
                  className={`w-12 h-12 rounded-xl border flex items-center justify-center text-xl shadow-lg ${
                    selectedScript.isGenerator
                      ? 'bg-emerald-950/40 border-emerald-500/40 text-emerald-400'
                      : selectedScript.isVerifier
                      ? 'bg-amber-950/40 border-amber-500/40 text-amber-400'
                      : 'bg-cyan-950/40 border-cyan-500/40 text-cyan-400'
                  }`}
                >
                  <FileCode2 className="w-6 h-6" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h1 className="text-base font-bold text-neutral-100 font-mono">
                      {selectedScript.name}
                    </h1>
                    <span
                      className={`text-[10px] font-mono px-2 py-0.5 rounded-full border ${
                        selectedScript.isGenerator
                          ? 'bg-emerald-950 text-emerald-300 border-emerald-800'
                          : selectedScript.isVerifier
                          ? 'bg-amber-950 text-amber-300 border-amber-800'
                          : 'bg-cyan-950 text-cyan-300 border-cyan-800'
                      }`}
                    >
                      {selectedScript.type}
                    </span>
                  </div>
                  <p className="text-xs text-neutral-400 font-mono mt-1 break-all">
                    {selectedScript.path}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => executeTarget(selectedScript.path, '--dry-run')}
                  disabled={executing}
                  className="px-3 py-1.5 rounded-lg border border-neutral-700 bg-neutral-800/80 hover:bg-neutral-700 text-xs font-mono text-neutral-300 transition-colors"
                >
                  Dry Run
                </button>
                <button
                  onClick={() => executeTarget(selectedScript.path, 'run')}
                  disabled={executing}
                  className={`px-4 py-1.5 rounded-lg font-bold text-xs font-mono flex items-center gap-2 shadow-lg transition-all disabled:opacity-50 ${
                    selectedScript.isGenerator
                      ? 'bg-emerald-600 hover:bg-emerald-500 text-neutral-950 shadow-emerald-900/30'
                      : selectedScript.isVerifier
                      ? 'bg-amber-600 hover:bg-amber-500 text-neutral-950 shadow-amber-900/30'
                      : 'bg-cyan-600 hover:bg-cyan-500 text-neutral-950 shadow-cyan-900/30'
                  }`}
                >
                  <Play className="w-3.5 h-3.5 fill-current" />
                  <span>{executing ? 'Exécution en cours...' : 'Exécuter Script'}</span>
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <div className="p-3.5 rounded-xl bg-neutral-900/60 border border-neutral-800">
                <div className="text-[10px] font-mono text-neutral-500 uppercase">Nature Fonctionnelle</div>
                <div className="text-xs font-bold mt-1 text-neutral-200">
                  {selectedScript.isGenerator
                    ? '⚡ Système Générateur Actif (Forge de Valeur)'
                    : selectedScript.isVerifier
                    ? '🛡️ Vérificateur Passif / Gatekeeper Déterministe'
                    : '⚙️ Script Opérationnel Système'}
                </div>
                <div className="text-[11px] text-neutral-400 mt-1">
                  {selectedScript.isGenerator
                    ? 'Produit des artefacts concrets, calculs ou enrichit la mémoire.'
                    : selectedScript.isVerifier
                    ? 'Évalue la conformité des règles d’intégrité sans créer d’actif.'
                    : 'Tâche de plomberie, démon d’arrière-plan ou utilitaire.'}
                </div>
              </div>

              <div className="p-3.5 rounded-xl bg-neutral-900/60 border border-neutral-800">
                <div className="text-[10px] font-mono text-neutral-500 uppercase">Domaine d'Action</div>
                <div className="text-xs font-bold mt-1 text-neutral-200 font-mono">
                  {selectedScript.path.split('/')[0] || 'Transversal'}
                </div>
                <div className="text-[11px] text-neutral-400 mt-1">
                  Localisation canonique dans l’arborescence ASpace OS V3.
                </div>
              </div>

              <div className="p-3.5 rounded-xl bg-neutral-900/60 border border-neutral-800">
                <div className="text-[10px] font-mono text-neutral-500 uppercase">Runtime Local</div>
                <div className="text-xs font-bold mt-1 text-emerald-400 font-mono">
                  Python 3.12+ (CPython Local)
                </div>
                <div className="text-[11px] text-neutral-400 mt-1">
                  Isolation de process, timeout 35s, capture stdio.
                </div>
              </div>
            </div>

            <div className="flex-1 flex flex-col min-h-[260px] rounded-xl border border-neutral-800 bg-black/90 p-3 font-mono text-xs overflow-hidden shadow-2xl">
              <div className="flex items-center justify-between border-b border-neutral-800/80 pb-2 mb-2 text-[11px]">
                <div className="flex items-center gap-2">
                  <Terminal className="w-3.5 h-3.5 text-neutral-400" />
                  <span className="text-neutral-300 font-bold">Console d'Exécution Python</span>
                  {execLog && (
                    <span
                      className={`text-[9px] px-1.5 py-0.2 rounded font-mono ${
                        execLog.code === 0
                          ? 'bg-emerald-950 text-emerald-300 border border-emerald-800'
                          : 'bg-rose-950 text-rose-300 border border-rose-800'
                      }`}
                    >
                      RC = {execLog.code}
                    </span>
                  )}
                </div>
                {execLog?.cmd && (
                  <span className="text-[10px] text-neutral-500 truncate max-w-md">
                    {execLog.cmd}
                  </span>
                )}
              </div>

              <pre className="flex-1 p-2 bg-neutral-950/60 rounded border border-neutral-900 text-[11px] text-neutral-300 overflow-y-auto whitespace-pre-wrap leading-relaxed">
                {execLog
                  ? execLog.stdout || execLog.stderr || '(Processus terminé avec code ' + execLog.code + ' sans sortie stdio)'
                  : 'En attente d’exécution... Cliquez sur "Exécuter Script" ou "Dry Run" ci-dessus pour lancer le processus.'}
              </pre>
            </div>
          </div>
        )}

        {viewMode === 'canvas' && (selectedNode || execLog) && (
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
                  <div className="text-emerald-400 font-mono">
                    {selectedNode.type} • {selectedNode.badge}
                  </div>
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
                    <div>
                      Entrées:{' '}
                      {selectedNode.inputs.length
                        ? selectedNode.inputs.join(', ')
                        : 'Aucune (Trigger racine)'}
                    </div>
                    <div>
                      Sorties:{' '}
                      {selectedNode.outputs.length
                        ? selectedNode.outputs.join(', ')
                        : 'Aucune (Sortie terminale)'}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {execLog && (
              <div className="flex-1 flex flex-col min-h-0 pt-2 border-t border-neutral-800">
                <div className="flex items-center justify-between text-[10px] font-mono mb-1">
                  <span className="text-neutral-400">Code de sortie:</span>
                  <span
                    className={`font-bold ${
                      execLog.code === 0 ? 'text-emerald-400' : 'text-rose-400'
                    }`}
                  >
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
