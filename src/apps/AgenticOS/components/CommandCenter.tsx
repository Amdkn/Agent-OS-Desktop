import React, { useState, useEffect } from 'react';
import type { EmailIntel, MicroAppItem, RoutineItem, SkillCard } from '../types';

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
  const [searchQuery, setSearchQuery] = useState('');

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

  // Ring Icons around center galaxy
  const ringBadges = [
    { id: 'skills', label: 'Skills Router', icon: '⚡', angle: 0 },
    { id: 'memory', label: 'Second Brain', icon: '🧠', angle: 30 },
    { id: 'generations', label: 'Generations', icon: '🖼️', angle: 60 },
    { id: 'teleprompter', label: 'Teleprompter', icon: '📜', angle: 90 },
    { id: 'excalidraw', label: 'Excalidraw', icon: '📐', angle: 120 },
    { id: 'routines', label: 'Hermes 24/7', icon: '🕒', angle: 150 },
    { id: 'email', label: 'Inbox Intel', icon: '✉️', angle: 180 },
    { id: 'calendar', label: 'Schedule', icon: '📅', angle: 210 },
    { id: 'passerelles', label: 'Passerelles', icon: '⇄', angle: 240 },
    { id: 'connectors', label: 'MCP Connectors', icon: '🔌', angle: 270 },
    { id: 'artifacts', label: 'Artifacts Catalog', icon: '📁', angle: 300 },
    { id: 'info', label: 'System Telemetry', icon: 'ℹ️', angle: 330 },
  ];

  return (
    <div className="flex-1 flex flex-col h-full bg-[#08080a] text-neutral-200 select-none overflow-y-auto font-sans">
      {/* Top OS Bar */}
      <div className="px-8 py-3.5 border-b border-neutral-800/80 bg-neutral-950/60 backdrop-blur-md flex items-center justify-between shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-xl bg-orange-600/20 border border-orange-500/40 flex items-center justify-center text-orange-400 font-bold text-base shadow-[0_0_15px_rgba(249,115,22,0.3)]">
            ⬡
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-sm font-bold tracking-wider text-neutral-100 uppercase font-mono">
                ROBO Agentic OS
              </h1>
              <span className="px-2 py-0.5 rounded bg-orange-950/80 border border-orange-800 text-[10px] text-orange-400 font-mono font-semibold">
                CLAUDE 5 • ARMS CORE
              </span>
            </div>
            <p className="text-[11px] text-neutral-500 font-mono">Virtual Command Center • Jay E | RoboNuggets</p>
          </div>
        </div>

        {/* Global Action Bar */}
        <div className="flex items-center gap-2 text-xs font-mono">
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-neutral-900 border border-neutral-800 text-neutral-400">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span>HERMES SYNCED</span>
          </div>
          <button
            onClick={onOpenSecondBrain}
            className="flex items-center gap-2 px-4 py-1.5 rounded-xl bg-gradient-to-r from-orange-600 to-amber-600 hover:from-orange-500 hover:to-amber-500 text-white font-bold shadow-lg shadow-orange-950 transition-all"
          >
            <span>🌌</span>
            <span>SECOND BRAIN</span>
          </button>
        </div>
      </div>

      {/* Main 3-Column Command Center (Matching Screenshot 1) */}
      <div className="flex-1 p-6 grid grid-cols-12 gap-6 min-h-0 items-start">
        {/* =========================================================
            LEFT COLUMN: MICRO APPS & CALENDAR
            ========================================================= */}
        <div className="col-span-12 lg:col-span-3 space-y-6 flex flex-col">
          {/* Micro Apps Widget */}
          <div className="bg-neutral-900/40 border border-neutral-800/80 rounded-2xl p-5 shadow-xl backdrop-blur-sm space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-sm text-neutral-400">⊞</span>
                <h2 className="text-xs font-bold uppercase tracking-wider font-mono text-neutral-200">
                  MICRO APPS
                </h2>
              </div>
              <button className="px-2 py-0.5 rounded-lg bg-neutral-800 hover:bg-neutral-700 text-[10px] font-mono text-neutral-400 hover:text-white transition-colors">
                + ADD APP
              </button>
            </div>

            {/* List of Micro Apps */}
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
          </div>

          {/* Calendar Widget */}
          <div className="bg-neutral-900/40 border border-neutral-800/80 rounded-2xl p-5 shadow-xl backdrop-blur-sm space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-sm text-neutral-400">📅</span>
                <h2 className="text-xs font-bold uppercase tracking-wider font-mono text-neutral-200">
                  CALENDAR
                </h2>
              </div>
              <button className="px-2 py-0.5 rounded-lg bg-neutral-800 hover:bg-neutral-700 text-[10px] font-mono text-neutral-400 hover:text-white transition-colors">
                OPEN CAL
              </button>
            </div>

            {/* Live Clock Card */}
            <div className="p-4 bg-neutral-950/80 rounded-xl border border-neutral-800 flex flex-col space-y-1">
              <span className="text-[10px] font-mono text-orange-400 uppercase font-semibold">
                {dateStr}
              </span>
              <div className="text-2xl font-mono font-extrabold text-orange-500 tracking-tight drop-shadow-[0_0_12px_rgba(249,115,22,0.4)]">
                {timeStr || '11:10:59 am'}
              </div>
              <span className="text-[10px] font-mono text-neutral-500">AEST • Sydney / Local Time</span>
            </div>

            {/* Schedule Timeline */}
            <div className="space-y-2 text-xs font-mono">
              <div className="flex items-center justify-between p-2 rounded-lg bg-neutral-950/40 border border-neutral-900">
                <span className="text-neutral-500">12:30pm</span>
                <span className="text-neutral-300 font-medium">Sprint Review • Client Sync</span>
              </div>
              <div className="flex items-center justify-between p-2 rounded-lg bg-neutral-950/40 border border-neutral-900">
                <span className="text-neutral-500">02:00pm</span>
                <span className="text-neutral-300 font-medium">Agentic Pipeline Tuning</span>
              </div>
              <div className="flex items-center justify-between p-2 rounded-lg bg-neutral-950/40 border border-neutral-900">
                <span className="text-neutral-500">03:30pm</span>
                <span className="text-neutral-300 font-medium">Content & Recording Prep</span>
              </div>
            </div>
          </div>
        </div>

        {/* =========================================================
            CENTER COLUMN: THE ARTIFACTS RING & SECOND BRAIN GALAXY
            ========================================================= */}
        <div className="col-span-12 lg:col-span-6 flex flex-col items-center justify-center relative min-h-[580px]">
          {/* Top Search / Filter in Ring */}
          <div className="w-full max-w-md mb-2 flex items-center gap-2 bg-neutral-900/80 border border-neutral-800 px-4 py-2 rounded-2xl shadow-xl">
            <span className="text-neutral-500 text-xs">🔍</span>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search 60,596 artifacts, skills & files... (THRO, Beto, etc.)"
              className="w-full bg-transparent text-xs font-mono text-neutral-200 placeholder-neutral-500 focus:outline-none"
            />
          </div>

          {/* Interactive Concentric Galaxy Ring SVG */}
          <div className="relative w-full aspect-square max-w-[500px] flex items-center justify-center">
            <svg viewBox="0 0 500 500" className="w-full h-full">
              <defs>
                <radialGradient id="centerGalaxyGlow" cx="50%" cy="50%" r="50%">
                  <stop offset="0%" stopColor="#f97316" stopOpacity="0.45" />
                  <stop offset="50%" stopColor="#ec4899" stopOpacity="0.2" />
                  <stop offset="80%" stopColor="#06b6d4" stopOpacity="0.05" />
                  <stop offset="100%" stopColor="#000000" stopOpacity="0" />
                </radialGradient>
              </defs>

              {/* Concentric Grid Rings */}
              <circle cx="250" cy="250" r="220" fill="none" stroke="#27272a" strokeWidth="1" strokeDasharray="4 4" opacity="0.6" />
              <circle cx="250" cy="250" r="175" fill="none" stroke="#3f3f46" strokeWidth="1" opacity="0.4" />
              <circle cx="250" cy="250" r="130" fill="none" stroke="#52525b" strokeWidth="1" strokeDasharray="2 2" opacity="0.4" />
              <circle cx="250" cy="250" r="85" fill="none" stroke="#ea580c" strokeWidth="1.2" strokeOpacity="0.5" />

              {/* Particle Point Cloud Galaxy */}
              <circle cx="250" cy="250" r="85" fill="url(#centerGalaxyGlow)" />

              {/* Random simulated file dots */}
              {Array.from({ length: 90 }).map((_, i) => {
                const angle = (i * 137.5 * Math.PI) / 180;
                const dist = 10 + (i / 90) * 70;
                const x = 250 + dist * Math.cos(angle);
                const y = 250 + dist * Math.sin(angle);
                const colors = ['#f97316', '#ec4899', '#06b6d4', '#eab308', '#a855f7', '#10b981'];
                return (
                  <circle
                    key={i}
                    cx={x}
                    cy={y}
                    r={1.2 + (i % 3) * 0.6}
                    fill={colors[i % colors.length]}
                    opacity={0.6 + (i % 4) * 0.1}
                  />
                );
              })}

              {/* Ring Nodes */}
              {ringBadges.map((badge) => {
                const rad = (badge.angle * Math.PI) / 180;
                const bx = 250 + 220 * Math.cos(rad);
                const by = 250 + 220 * Math.sin(rad);
                return (
                  <g
                    key={badge.id}
                    className="cursor-pointer group"
                    onClick={() => {
                      if (badge.id === 'memory') onOpenSecondBrain();
                      else if (badge.id === 'generations' || badge.id === 'teleprompter' || badge.id === 'excalidraw' || badge.id === 'passerelles') {
                        onOpenMicroApp(badge.id);
                      }
                    }}
                  >
                    <circle
                      cx={bx}
                      cy={by}
                      r="14"
                      fill="#18181b"
                      stroke="#3f3f46"
                      strokeWidth="1.5"
                      className="group-hover:stroke-orange-500 group-hover:fill-neutral-800 transition-all"
                    />
                    <text x={bx} y={by + 4} textAnchor="middle" className="text-[11px] fill-white pointer-events-none">
                      {badge.icon}
                    </text>
                  </g>
                );
              })}
            </svg>

            {/* Glowing Big Center Button: CLICK TO OPEN SECOND BRAIN */}
            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-auto">
              <button
                onClick={onOpenSecondBrain}
                className="group p-5 rounded-full bg-black/80 hover:bg-neutral-900 border border-orange-500/50 hover:border-orange-400 shadow-[0_0_30px_rgba(249,115,22,0.4)] flex flex-col items-center justify-center transition-all hover:scale-105"
              >
                <span className="text-2xl animate-pulse">🧠</span>
                <span className="mt-1 text-[10px] font-mono font-bold text-orange-400 group-hover:text-orange-300 tracking-wider uppercase drop-shadow-[0_0_8px_rgba(249,115,22,0.6)]">
                  CLICK TO OPEN
                </span>
                <span className="text-[9px] font-mono text-neutral-400 uppercase tracking-widest">
                  SECOND BRAIN
                </span>
              </button>
            </div>
          </div>

          {/* Quick Metrics Under Ring */}
          <div className="flex items-center gap-6 mt-4 text-[11px] font-mono text-neutral-400 bg-neutral-950/60 px-5 py-2 rounded-xl border border-neutral-800">
            <div><strong className="text-orange-400">{skills.length}</strong> Skills</div>
            <div className="text-neutral-700">•</div>
            <div><strong className="text-sky-400">60,596</strong> Memory Files</div>
            <div className="text-neutral-700">•</div>
            <div><strong className="text-amber-400">{routines.length}</strong> Routines</div>
            <div className="text-neutral-700">•</div>
            <div><strong className="text-emerald-400">8</strong> Connectors</div>
          </div>
        </div>

        {/* =========================================================
            RIGHT COLUMN: EMAIL INTEL, SKILLS DECK & ROUTINES
            ========================================================= */}
        <div className="col-span-12 lg:col-span-3 space-y-6 flex flex-col">
          {/* Email Intelligence Widget */}
          <div className="bg-neutral-900/40 border border-neutral-800/80 rounded-2xl p-5 shadow-xl backdrop-blur-sm space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-sm text-neutral-400">✉️</span>
                <h2 className="text-xs font-bold uppercase tracking-wider font-mono text-neutral-200">
                  EMAIL INTEL
                </h2>
              </div>
              <span className="text-[10px] font-mono text-emerald-400 font-semibold">● SYNCED</span>
            </div>

            {/* Email Counter & Flagged */}
            <div className="space-y-3">
              <div className="flex items-baseline gap-2">
                <span className="text-3xl font-mono font-extrabold text-orange-500">
                  {emailIntel.total24h}
                </span>
                <span className="text-[10px] font-mono text-neutral-500 uppercase">EMAILS PAST 24H</span>
              </div>

              {/* Flagged Items */}
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

              {/* Today's Mix Progress Bar */}
              <div className="space-y-1.5 pt-2 border-t border-neutral-800/60">
                <div className="flex justify-between text-[10px] font-mono text-neutral-500">
                  <span>TODAY'S MIX</span>
                  <span>47 Total</span>
                </div>
                <div className="h-2 rounded-full bg-neutral-800 flex overflow-hidden">
                  {emailIntel.distribution.map((dist, idx) => (
                    <div
                      key={idx}
                      style={{ width: `${(dist.count / 47) * 100}%`, backgroundColor: dist.color }}
                      title={`${dist.label}: ${dist.count}`}
                    />
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Skills Deck Widget (Headless Execution Triggers) */}
          <div className="bg-neutral-900/40 border border-neutral-800/80 rounded-2xl p-5 shadow-xl backdrop-blur-sm space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-sm text-neutral-400">⚡</span>
                <h2 className="text-xs font-bold uppercase tracking-wider font-mono text-neutral-200">
                  SKILLS DECK
                </h2>
              </div>
              <button className="px-2 py-0.5 rounded-lg bg-neutral-800 hover:bg-neutral-700 text-[10px] font-mono text-neutral-400 hover:text-white transition-colors">
                + ADD SKILL
              </button>
            </div>

            {/* Skills Deck Grid Cards */}
            <div className="grid grid-cols-2 gap-2.5">
              {skills.map((sk) => (
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

          {/* Routines Firing Board */}
          <div className="bg-neutral-900/40 border border-neutral-800/80 rounded-2xl p-5 shadow-xl backdrop-blur-sm space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-sm text-neutral-400">🕒</span>
                <h2 className="text-xs font-bold uppercase tracking-wider font-mono text-neutral-200">
                  ROUTINES
                </h2>
              </div>
              <span className="text-[10px] font-mono text-neutral-500">HERMES 24/7 CRON</span>
            </div>

            {/* Routines Table */}
            <div className="space-y-1.5 text-[11px] font-mono">
              <div className="grid grid-cols-12 text-[9px] font-mono uppercase text-neutral-500 pb-1 border-b border-neutral-800">
                <span className="col-span-3">TIME</span>
                <span className="col-span-6">ROUTINE</span>
                <span className="col-span-3 text-right">STATUS</span>
              </div>

              {routines.map((rt) => (
                <div
                  key={rt.id}
                  className="grid grid-cols-12 items-center py-1 px-1 rounded-lg hover:bg-neutral-950 transition-colors"
                >
                  <span className="col-span-3 text-neutral-400">{rt.time}</span>
                  <div className="col-span-6 truncate flex items-center gap-1">
                    <span className="text-neutral-200 truncate">{rt.name}</span>
                    <span className="text-[8px] px-1 rounded bg-neutral-800 text-neutral-500">
                      {rt.runner === 'HERMES' ? '☁️' : '💻'}
                    </span>
                  </div>
                  <div className="col-span-3 text-right">
                    <span
                      className={`px-1.5 py-0.5 rounded text-[9px] font-bold ${
                        rt.status === 'FIRED'
                          ? 'bg-emerald-950 text-emerald-400 border border-emerald-800'
                          : rt.status === 'NEXT'
                          ? 'bg-orange-950 text-orange-400 border border-orange-800 animate-pulse'
                          : 'bg-neutral-800 text-neutral-500'
                      }`}
                    >
                      {rt.status}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
