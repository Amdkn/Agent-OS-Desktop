import React from 'react';
import { useAmyCockpitStore, HorizonLevel } from '../stores/useAmyCockpitStore';

const DOX_PATH_OPTIONS = [
  '10_Tech_OS',
  '20_Life_OS',
  '30_Business_OS',
  '50_Distillation',
  '70_Ontologies',
  '90_Archives',
];

const HORIZONS: HorizonLevel[] = ['H1', 'H3', 'H10', 'H30', 'H90'];

export const ContextBreadcrumb: React.FC = () => {
  const {
    activeDoxPath,
    setDoxContext,
    activeHorizon,
    setActiveHorizon,
    isAgentsMdModalOpen,
    setAgentsMdModalOpen,
    agentsMdContent,
    toggleWarRoom,
    isWarRoomOpen,
  } = useAmyCockpitStore();

  return (
    <div className="w-full bg-neutral-950/90 border-b border-neutral-800/90 px-6 py-2.5 flex flex-wrap items-center justify-between gap-4 text-xs font-mono shrink-0 select-none backdrop-blur-md">
      {/* 6D Navigation & DOX Active Selector */}
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-neutral-900 border border-neutral-800 text-neutral-400">
          <span className="text-orange-400 font-bold">6D</span>
          <span className="text-neutral-600">/</span>
          <span className="text-neutral-300 font-semibold">SOUL & ROUTER</span>
        </div>

        {/* DOX Path Dropdown */}
        <div className="flex items-center gap-2">
          <span className="text-neutral-500">DOX:</span>
          <select
            value={activeDoxPath}
            onChange={(e) => setDoxContext(e.target.value)}
            className="bg-neutral-900 border border-neutral-800 rounded-lg px-2.5 py-1 text-xs text-orange-400 font-bold font-mono focus:outline-none focus:border-orange-500 cursor-pointer"
          >
            {DOX_PATH_OPTIONS.map((path) => (
              <option key={path} value={path} className="bg-neutral-950 text-neutral-200">
                📁 {path}
              </option>
            ))}
          </select>
        </div>

        {/* Inspector Button AGENTS.md */}
        <button
          onClick={() => setAgentsMdModalOpen(true)}
          className="flex items-center gap-1.5 px-3 py-1 rounded-lg bg-neutral-900 hover:bg-neutral-800 border border-neutral-800 text-neutral-300 hover:text-white transition-all"
          title="Inspecter le AGENTS.md du contexte local"
        >
          <span>📜</span>
          <span className="font-semibold text-[11px]">AGENTS.md</span>
        </button>
      </div>

      {/* Ikigai Horizon Gauge & War Room Trigger */}
      <div className="flex items-center gap-4">
        {/* Ikigai Horizon Selectors */}
        <div className="flex items-center gap-1.5 bg-neutral-900/80 p-1 rounded-xl border border-neutral-800">
          <span className="text-[10px] text-neutral-500 px-2 font-semibold uppercase">IKIGAI:</span>
          {HORIZONS.map((h) => (
            <button
              key={h}
              onClick={() => setActiveHorizon(h)}
              className={`px-2.5 py-0.5 rounded-lg text-[10px] font-bold transition-all ${
                activeHorizon === h
                  ? 'bg-orange-600 text-white shadow-md shadow-orange-950'
                  : 'text-neutral-400 hover:text-white hover:bg-neutral-800'
              }`}
            >
              {h}
            </button>
          ))}
        </div>

        {/* War Room Drawer Toggle Button */}
        <button
          onClick={toggleWarRoom}
          className={`flex items-center gap-2 px-3.5 py-1.5 rounded-xl font-bold transition-all text-xs ${
            isWarRoomOpen
              ? 'bg-orange-600 text-white border border-orange-400 shadow-[0_0_15px_rgba(249,115,22,0.4)]'
              : 'bg-neutral-900 hover:bg-neutral-800 border border-neutral-800 text-orange-400'
          }`}
        >
          <span>🏛️</span>
          <span>WAR ROOM (7D)</span>
        </button>
      </div>

      {/* Modal AGENTS.md Inspector */}
      {isAgentsMdModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-2xl bg-neutral-950 border border-neutral-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[80vh]">
            <div className="px-5 py-3 bg-neutral-900 border-b border-neutral-800 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-orange-400 text-base">📜</span>
                <h3 className="font-bold text-neutral-200 font-mono text-xs">
                  INSPECTEUR LOCAL : {activeDoxPath}/AGENTS.md
                </h3>
              </div>
              <button
                onClick={() => setAgentsMdModalOpen(false)}
                className="text-neutral-500 hover:text-white text-xs font-mono"
              >
                ✕
              </button>
            </div>
            <div className="p-5 overflow-y-auto font-mono text-xs text-neutral-300 leading-relaxed whitespace-pre-wrap bg-black/50 flex-1">
              {agentsMdContent}
            </div>
            <div className="px-5 py-3 bg-neutral-900 border-t border-neutral-800 flex justify-end">
              <button
                onClick={() => setAgentsMdModalOpen(false)}
                className="px-4 py-1.5 bg-orange-600 hover:bg-orange-500 text-white font-bold rounded-lg text-xs"
              >
                FERMER
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
