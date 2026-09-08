import React, { useState, useEffect } from 'react';
import type { EmailIntel, MicroAppItem, RoutineItem, SkillCard } from '../types';
import { useAmyCockpitStore } from '../stores/useAmyCockpitStore';
import { ContextBreadcrumb } from './ContextBreadcrumb';
import { DeterministicGuardHUD } from './DeterministicGuardHUD';
import { CadenceTicker } from './CadenceTicker';
import { AmyOmnibar } from './AmyOmnibar';
import { RiverEventStream } from './RiverEventStream';
import { SilverPlatterGrid } from './SilverPlatterGrid';
import { WarRoomDrawer } from './WarRoomDrawer';

interface Props {
  onOpenSecondBrain: () => void;
  onOpenMicroApp: (appId: string) => void;
  onOpenSkillSettings: (skill: SkillCard) => void;
  onRunSkill: (skill: SkillCard) => void;
  skills: SkillCard[];
  routines: RoutineItem[];
  emailIntel: EmailIntel;
}

const DEFAULT_MICRO_APPS: MicroAppItem[] = [
  {
    id: 'generations',
    name: 'Generations',
    description: 'Every image and video you have generated',
    icon: '🖼️',
    category: 'core',
  },
  {
    id: 'teleprompter',
    name: 'Teleprompter',
    description: 'Scripts you read on camera',
    icon: '📜',
    category: 'core',
  },
  {
    id: 'second-brain',
    name: 'Second Brain',
    description: 'Your whole workspace as a living map',
    icon: '🧠',
    category: 'core',
  },
  {
    id: 'excalidraw',
    name: 'Excalidraw',
    description: 'Hand-drawn diagrams ready to copy onto your canvas',
    icon: '📐',
    category: 'core',
  },
  {
    id: 'passerelles',
    name: 'Passerelles & Observateurs',
    description: 'Bifrost, 9Router, OmniRoute, Observatoire & Contrôle Processus',
    icon: '⇄',
    badge: '6 ACTIFS',
    category: 'core',
  },
];

export const CommandCenter: React.FC<Props> = ({
  onOpenSecondBrain,
  onOpenMicroApp,
  onOpenSkillSettings,
  onRunSkill,
  skills,
  routines,
  emailIntel,
}) => {
  const [timeStr, setTimeStr] = useState('');
  const [dateStr, setDateStr] = useState('');
  const { toggleWarRoom } = useAmyCockpitStore();

  // Live Digital Clock
  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setTimeStr(
        now.toLocaleTimeString('en-US', {
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit',
          hour12: true,
        })
      );
      setDateStr(
        `Wk ${getWeekNumber(now)} | ${now.toLocaleDateString('en-US', {
          weekday: 'short',
          month: 'short',
          day: 'numeric',
          year: 'numeric',
        })}`
      );
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  function getWeekNumber(d: Date) {
    const date = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
    date.setUTCDate(date.getUTCDate() + 4 - (date.getUTCDay() || 7));
    const yearStart = new Date(Date.UTC(date.getUTCFullYear(), 0, 1));
    return Math.ceil(((date.getTime() - yearStart.getTime()) / 86400000 + 1) / 7);
  }

  return (
    <div className="flex-1 flex flex-col h-full bg-[#08080a] text-neutral-200 select-none overflow-y-auto font-sans relative">
      {/* Top Header OS Bar */}
      <div className="px-8 py-3.5 border-b border-neutral-800/80 bg-neutral-950/60 backdrop-blur-md flex items-center justify-between shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-xl bg-orange-600/20 border border-orange-500/40 flex items-center justify-center text-orange-400 font-bold text-base shadow-[0_0_15px_rgba(249,115,22,0.3)]">
            ⬡
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-sm font-bold tracking-wider text-neutral-100 uppercase font-mono">
                INTERFACE AMY — AGENTIC OS
              </h1>
              <span className="px-2 py-0.5 rounded bg-orange-950/80 border border-orange-800 text-[10px] text-orange-400 font-mono font-semibold">
                11E DOCTEUR • ARMS 7D
              </span>
            </div>
            <p className="text-[11px] text-neutral-500 font-mono">
              Cockpit Haptique Déterministe • Substrat Rory / River / Tech OS
            </p>
          </div>
        </div>

        {/* Global Action Bar */}
        <div className="flex items-center gap-2 text-xs font-mono">
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-neutral-900 border border-neutral-800 text-neutral-400">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span>HERMES 24/7 SYNCED ({routines.length} ROUTINES)</span>
          </div>
          <button
            onClick={toggleWarRoom}
            className="flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-orange-950/80 border border-orange-700 hover:bg-orange-900 text-orange-300 font-bold font-mono transition-all"
          >
            <span>🏛️</span>
            <span>WAR ROOM (7D)</span>
          </button>
          <button
            onClick={onOpenSecondBrain}
            className="flex items-center gap-2 px-4 py-1.5 rounded-xl bg-gradient-to-r from-orange-600 to-amber-600 hover:from-orange-500 hover:to-amber-500 text-white font-bold shadow-lg shadow-orange-950 transition-all"
          >
            <span>🌌</span>
            <span>SECOND BRAIN</span>
          </button>
        </div>
      </div>

      {/* 6D Context Breadcrumb Bar */}
      <ContextBreadcrumb />

      {/* Main 7D Cockpit Grid */}
      <div className="flex-1 p-6 space-y-6 overflow-y-auto">
        {/* 1D Level: Silver Platter Grid */}
        <SilverPlatterGrid />

        {/* 3D & 2D Middle Deck: Amy Omnibar & River Event Stream */}
        <div className="grid grid-cols-12 gap-6">
          <div className="col-span-12 lg:col-span-6">
            <AmyOmnibar />
          </div>
          <div className="col-span-12 lg:col-span-6">
            <RiverEventStream />
          </div>
        </div>

        {/* 5D & 4D Guards & Cadence Tickers */}
        <div className="grid grid-cols-12 gap-6">
          <div className="col-span-12 lg:col-span-6">
            <DeterministicGuardHUD />
          </div>
          <div className="col-span-12 lg:col-span-6">
            <CadenceTicker />
          </div>
        </div>

        {/* Bottom Operational Section: Micro Apps, Email Intel & Skills Deck */}
        <div className="grid grid-cols-12 gap-6 items-start">
          {/* Micro Apps Section */}
          <div className="col-span-12 lg:col-span-4 bg-neutral-900/40 border border-neutral-800/80 rounded-2xl p-5 shadow-xl backdrop-blur-sm space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-sm text-neutral-400">⊞</span>
                <h2 className="text-xs font-bold uppercase tracking-wider font-mono text-neutral-200">
                  MICRO APPS (2D APPLICATIONS)
                </h2>
              </div>
            </div>

            <div className="space-y-2">
              {DEFAULT_MICRO_APPS.map((app) => (
                <div
                  key={app.id}
                  onClick={() => onOpenMicroApp(app.id)}
                  className="group p-3 rounded-xl bg-neutral-950/60 hover:bg-neutral-800/60 border border-neutral-800/60 hover:border-orange-500/50 transition-all cursor-pointer flex items-center justify-between"
                >
                  <div className="flex items-center gap-3">
                    <span className="text-lg">{app.icon}</span>
                    <div>
                      <div className="flex items-center gap-1.5">
                        <span className="text-xs font-bold text-neutral-200 group-hover:text-orange-400 font-mono transition-colors">
                          {app.name}
                        </span>
                        {app.badge && (
                          <span className="px-1.5 py-0.2 rounded bg-orange-950/60 text-orange-400 border border-orange-800 text-[9px] font-mono font-semibold">
                            {app.badge}
                          </span>
                        )}
                      </div>
                      <p className="text-[10px] text-neutral-500 line-clamp-1">{app.description}</p>
                    </div>
                  </div>
                  <span className="text-neutral-600 group-hover:text-orange-400 group-hover:translate-x-0.5 transition-all text-xs font-mono">
                    →
                  </span>
                </div>
              ))}
            </div>

            {/* Live Clock Card */}
            <div className="p-3.5 bg-neutral-950/80 rounded-xl border border-neutral-800 flex flex-col space-y-1">
              <span className="text-[10px] font-mono text-orange-400 uppercase font-semibold">
                {dateStr}
              </span>
              <div className="text-xl font-mono font-extrabold text-orange-500 tracking-tight">
                {timeStr || '11:10:59 am'}
              </div>
              <span className="text-[10px] font-mono text-neutral-500">Local Time • Synchronisé A'Space V3</span>
            </div>
          </div>

          {/* Email Intel Section */}
          <div className="col-span-12 lg:col-span-4 bg-neutral-900/40 border border-neutral-800/80 rounded-2xl p-5 shadow-xl backdrop-blur-sm space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-sm text-neutral-400">✉️</span>
                <h2 className="text-xs font-bold uppercase tracking-wider font-mono text-neutral-200">
                  EMAIL INTEL
                </h2>
              </div>
              <span className="text-[10px] font-mono text-emerald-400 font-semibold">● SYNCED</span>
            </div>

            <div className="space-y-3">
              <div className="flex items-baseline gap-2">
                <span className="text-3xl font-mono font-extrabold text-orange-500">
                  {emailIntel.total24h}
                </span>
                <span className="text-[10px] font-mono text-neutral-500 uppercase">EMAILS PAST 24H</span>
              </div>

              <div className="space-y-1.5">
                <span className="text-[10px] font-mono text-neutral-500 uppercase tracking-wider font-semibold">
                  FLAGGED • NEEDS ATTENTION
                </span>
                {emailIntel.flagged.map((item) => (
                  <div
                    key={item.id}
                    className="p-2 rounded-lg bg-neutral-950/70 border border-neutral-800/80 flex items-start gap-2 hover:border-orange-500/40 transition-colors cursor-pointer"
                  >
                    <span className="text-orange-500 text-xs">✉️</span>
                    <div className="flex-1 min-w-0">
                      <h4 className="text-[11px] font-semibold text-neutral-200 truncate">{item.title}</h4>
                      <span className="text-[10px] font-mono text-neutral-500">{item.timeAgo}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Skills Deck Cards */}
          <div className="col-span-12 lg:col-span-4 bg-neutral-900/40 border border-neutral-800/80 rounded-2xl p-5 shadow-xl backdrop-blur-sm space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-sm text-neutral-400">⚡</span>
                <h2 className="text-xs font-bold uppercase tracking-wider font-mono text-neutral-200">
                  SKILLS DECK
                </h2>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2.5">
              {skills.slice(0, 4).map((sk) => (
                <div
                  key={sk.id}
                  className="p-3 rounded-xl bg-neutral-950/80 border border-neutral-800/80 hover:border-orange-500/50 transition-all flex flex-col justify-between space-y-2 group"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs">{sk.icon}</span>
                    <button
                      onClick={() => onOpenSkillSettings(sk)}
                      className="text-neutral-600 group-hover:text-neutral-400 hover:text-white text-xs p-1"
                      title="Adjust Model & Effort"
                    >
                      ⚙️
                    </button>
                  </div>

                  <div>
                    <h4 className="text-[11px] font-bold font-mono text-orange-400 truncate">
                      {sk.command}
                    </h4>
                    <div className="flex items-center gap-1 text-[9px] font-mono text-neutral-500 mt-0.5">
                      <span className="text-neutral-300 font-semibold">{sk.selectedModel}</span>
                      <span>•</span>
                      <span>{sk.selectedEffort}</span>
                    </div>
                  </div>

                  <button
                    onClick={() => onRunSkill(sk)}
                    disabled={sk.status === 'running'}
                    className={`w-full py-1 rounded-lg text-[10px] font-mono font-bold flex items-center justify-center gap-1.5 transition-all ${
                      sk.status === 'running'
                        ? 'bg-orange-950 text-orange-400 border border-orange-800 animate-pulse'
                        : 'bg-neutral-900 hover:bg-orange-600 text-neutral-300 hover:text-white border border-neutral-800'
                    }`}
                  >
                    <span>{sk.status === 'running' ? '⏳' : '▶'}</span>
                    <span>{sk.status === 'running' ? 'RUNNING' : 'RUN'}</span>
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* 7D War Room Drawer Panel */}
      <WarRoomDrawer />
    </div>
  );
};
