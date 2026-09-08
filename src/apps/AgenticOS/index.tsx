/**
 * ROBO Agentic OS — Virtual Command Center & ARMS Second Brain.
 * Rebuilt from Jay E / RoboNuggets video transcription & architectural blueprints.
 */

import { useState, useEffect } from 'react';
import type { AppManifest } from '../../types';
import type { ClaudeModel, EffortLevel, EmailIntel, RoutineItem, SkillCard } from './types';
import { CommandCenter } from './components/CommandCenter';
import { SecondBrainOrbit } from './components/SecondBrainOrbit';
import { SkillsDeckModal } from './components/SkillsDeckModal';
import { GenerationsGallery } from './components/GenerationsGallery';
import { TeleprompterApp } from './components/TeleprompterApp';
import { ExcalidrawCanvas } from './components/ExcalidrawCanvas';
import { RouteursApp } from '../Routeurs';

export const manifest: AppManifest = {
  id: 'agentic-os',
  name: 'Agentic OS',
  kind: 'singleton',
  description: 'Centre de commande ARMS (RoboNuggets) • Skills Deck, Second Brain, Routines & Micro Apps',
  icon: '⬡',
  domaine: 'l0-tech',
};

const INITIAL_SKILLS: SkillCard[] = [
  {
    id: 'sprint-planning',
    command: '/sprint-planning',
    name: 'Sprint Planning',
    icon: '📅',
    description: 'Structure and automate upcoming sprint goals and agent tasks.',
    defaultModel: 'SONNET',
    defaultEffort: 'MEDIUM',
    selectedModel: 'SONNET',
    selectedEffort: 'MEDIUM',
    status: 'idle',
  },
  {
    id: 'newsletter',
    command: '/newsletter',
    name: 'Newsletter Draft',
    icon: '✉️',
    description: 'Transform new transcripts into Substack newsletters with tone of voice.',
    defaultModel: 'OPUS',
    defaultEffort: 'XHIGH',
    selectedModel: 'OPUS',
    selectedEffort: 'XHIGH',
    status: 'idle',
  },
  {
    id: 'games',
    command: '/games',
    name: 'Games & Simulations',
    icon: '🕹️',
    description: 'Interactive simulation loops and agent benchmark arenas.',
    defaultModel: 'OPUS',
    defaultEffort: 'XHIGH',
    selectedModel: 'OPUS',
    selectedEffort: 'XHIGH',
    status: 'idle',
  },
  {
    id: 'clean-up',
    command: '/clean-up',
    name: 'Clean Up & Optimization',
    icon: '🧹',
    description: 'Flush memory cache, remove stale files and optimize computer speed.',
    defaultModel: 'FABLE',
    defaultEffort: 'XHIGH',
    selectedModel: 'FABLE',
    selectedEffort: 'XHIGH',
    status: 'idle',
  },
  {
    id: 'youtube-ingest',
    command: '/youtube-ingest',
    name: 'YouTube Ingest',
    icon: '▶️',
    description: 'Ingest and transcribe YouTube videos directly into Memory Core.',
    defaultModel: 'SONNET',
    defaultEffort: 'HIGH',
    selectedModel: 'SONNET',
    selectedEffort: 'HIGH',
    status: 'idle',
  },
  {
    id: 'adr-architecture',
    command: '/adr-architecture',
    name: 'ADR Architect',
    icon: '🏛️',
    description: 'Architecture Decision Record generator for OpenSpec changes.',
    defaultModel: 'OPUS',
    defaultEffort: 'MAX',
    selectedModel: 'OPUS',
    selectedEffort: 'MAX',
    status: 'idle',
  },
];

const INITIAL_ROUTINES: RoutineItem[] = [
  {
    id: 'rt-1',
    time: '07:00',
    name: 'client health scan',
    runner: 'HERMES',
    status: 'FIRED',
    frequency: 'Daily',
  },
  {
    id: 'rt-2',
    time: '09:00',
    name: 'youtube to substack daily',
    runner: 'DESKTOP',
    status: 'FIRED',
    frequency: 'Daily',
  },
  {
    id: 'rt-3',
    time: '09:00',
    name: 'daily inbox digest team',
    runner: 'DESKTOP',
    status: 'FIRED',
    frequency: 'Daily',
  },
  {
    id: 'rt-4',
    time: '11:00',
    name: 'deliverables status sweep',
    runner: 'HERMES',
    status: 'FIRED',
    frequency: 'Daily',
  },
  {
    id: 'rt-5',
    time: '13:00',
    name: 'community pulse digest',
    runner: 'HERMES',
    status: 'NEXT',
    frequency: 'Daily',
  },
  {
    id: 'rt-6',
    time: '16:30',
    name: 'content pipeline check',
    runner: 'HERMES',
    status: 'QUEUED',
    frequency: 'Daily',
  },
  {
    id: 'rt-7',
    time: '23:00',
    name: 'guardian & bifrost sync',
    runner: 'HERMES',
    status: 'QUEUED',
    frequency: 'Daily',
  },
];

const INITIAL_EMAIL_INTEL: EmailIntel = {
  total24h: 47,
  unread: 12,
  syncedAt: '11:10 AM',
  syncAccount: 'team@robonuggets.com',
  flagged: [
    {
      id: 'f1',
      title: 'Sponsorship proposal — AI dev tools brand',
      sender: 'Sponsor Lead',
      timeAgo: '2h',
      priority: 'high',
    },
    {
      id: 'f2',
      title: 'Enterprise plan inquiry — 40 seats',
      sender: 'Enterprise Client',
      timeAgo: '4h',
      priority: 'urgent',
    },
    {
      id: 'f3',
      title: 'Partnership: newsletter cross-promo',
      sender: 'Newsletter Partner',
      timeAgo: '7h',
      priority: 'medium',
    },
  ],
  distribution: [
    { label: 'PARTN', count: 9, color: '#f97316' },
    { label: 'LEADS', count: 14, color: '#eab308' },
    { label: 'PR', count: 6, color: '#ec4899' },
    { label: 'OTHER', count: 16, color: '#64748b' },
    { label: 'MEMBERS', count: 9, color: '#38bdf8' },
    { label: 'NEWS', count: 12, color: '#a855f7' },
    { label: 'NOISE', count: 7, color: '#334155' },
  ],
};

export function App() {
  const [currentView, setCurrentView] = useState<
    'command-center' | 'second-brain' | 'generations' | 'teleprompter' | 'excalidraw' | 'passerelles'
  >('command-center');
  const [skills, setSkills] = useState<SkillCard[]>(INITIAL_SKILLS);
  const [routines, setRoutines] = useState<RoutineItem[]>(INITIAL_ROUTINES);
  const [emailIntel] = useState<EmailIntel>(INITIAL_EMAIL_INTEL);
  const [activeModalSkill, setActiveModalSkill] = useState<SkillCard | null>(null);
  const [skillOutput, setSkillOutput] = useState<{ command: string; output: string } | null>(null);

  // Sync real skills and routines from backend API if available
  useEffect(() => {
    fetch('/api/arms/etat')
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (data?.skills?.items?.length) {
          const liveSkills: SkillCard[] = data.skills.items.slice(0, 8).map((sk: any) => ({
            id: sk.nom,
            command: `/${sk.nom}`,
            name: sk.nom,
            icon: '⚡',
            description: `${sk.fichiers} fichiers • ${sk.lignes} lignes`,
            defaultModel: 'SONNET',
            defaultEffort: 'HIGH',
            selectedModel: 'SONNET',
            selectedEffort: 'HIGH',
            status: 'idle',
          }));
          setSkills((prev) => {
            // Keep user selected defaults or merge
            const map = new Map(prev.map((p) => [p.command, p]));
            return liveSkills.map((ls) => map.get(ls.command) || ls);
          });
        }
        if (data?.routines?.items?.length) {
          const liveRoutines: RoutineItem[] = data.routines.items.slice(0, 7).map((rt: any, idx: number) => ({
            id: `live-rt-${idx}`,
            time: rt.prochain ? new Date(rt.prochain).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '09:00',
            name: rt.nom,
            runner: 'DESKTOP',
            status: rt.etat === 'en cours' ? 'RUNNING' : rt.etat === 'prête' ? 'FIRED' : 'QUEUED',
            frequency: 'Daily',
          }));
          setRoutines(liveRoutines);
        }
      })
      .catch(() => {});
  }, []);

  const handleSaveSkillConfig = (skillId: string, model: ClaudeModel, effort: EffortLevel) => {
    setSkills((prev) =>
      prev.map((s) => (s.id === skillId ? { ...s, selectedModel: model, selectedEffort: effort } : s))
    );
  };

  const handleRunSkill = (skill: SkillCard) => {
    setSkills((prev) => prev.map((s) => (s.id === skill.id ? { ...s, status: 'running' } : s)));
    fetch('/api/arms/lancer', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ nom: skill.id.replace(/^\//, ''), modele: skill.selectedModel.toLowerCase() }),
    })
      .then((r) => r.json())
      .then((res) => {
        setSkills((prev) => prev.map((s) => (s.id === skill.id ? { ...s, status: res.ok ? 'success' : 'error' } : s)));
        setSkillOutput({ command: skill.command, output: res.sortie || 'Exécution terminée.' });
      })
      .catch((err) => {
        setSkills((prev) => prev.map((s) => (s.id === skill.id ? { ...s, status: 'error' } : s)));
        setSkillOutput({ command: skill.command, output: `Erreur: ${String(err)}` });
      });
  };

  const handleOpenMicroApp = (appId: string) => {
    if (appId === 'generations') setCurrentView('generations');
    else if (appId === 'teleprompter') setCurrentView('teleprompter');
    else if (appId === 'second-brain') setCurrentView('second-brain');
    else if (appId === 'excalidraw') setCurrentView('excalidraw');
    else if (appId === 'passerelles') setCurrentView('passerelles');
  };

  return (
    <div className="w-full h-full bg-[#08080a] flex flex-col relative overflow-hidden font-sans">
      {/* Active View Router */}
      {currentView === 'command-center' && (
        <CommandCenter
          onOpenSecondBrain={() => setCurrentView('second-brain')}
          onOpenMicroApp={handleOpenMicroApp}
          onOpenSkillSettings={(sk) => setActiveModalSkill(sk)}
          onRunSkill={handleRunSkill}
          skills={skills}
          routines={routines}
          emailIntel={emailIntel}
        />
      )}

      {currentView === 'second-brain' && (
        <SecondBrainOrbit
          onBack={() => setCurrentView('command-center')}
          onOpenApp={(appId) => handleOpenMicroApp(appId)}
        />
      )}

      {currentView === 'generations' && (
        <GenerationsGallery onBack={() => setCurrentView('command-center')} />
      )}

      {currentView === 'teleprompter' && (
        <TeleprompterApp onBack={() => setCurrentView('command-center')} />
      )}

      {currentView === 'excalidraw' && (
        <ExcalidrawCanvas onBack={() => setCurrentView('command-center')} />
      )}

      {currentView === 'passerelles' && (
        <div className="flex flex-col h-full bg-[#08080a]">
          <div className="px-6 py-2 bg-neutral-950 border-b border-neutral-800 flex items-center justify-between">
            <span className="text-xs font-mono text-orange-400 font-bold">⇄ PASSERELLES & OBSERVATEURS</span>
            <button
              onClick={() => setCurrentView('command-center')}
              className="px-3 py-1 rounded-lg bg-neutral-900 border border-neutral-700 text-xs text-neutral-300 hover:text-white"
            >
              ← RETOUR COMMAND CENTER
            </button>
          </div>
          <div className="flex-1 overflow-hidden">
            <RouteursApp />
          </div>
        </div>
      )}

      {/* Model & Effort Matrix Popover Modal */}
      {activeModalSkill && (
        <SkillsDeckModal
          skill={activeModalSkill}
          onClose={() => setActiveModalSkill(null)}
          onSave={handleSaveSkillConfig}
          onRun={handleRunSkill}
        />
      )}

      {/* Skill Run Output Drawer / Toast */}
      {skillOutput && (
        <div className="fixed bottom-6 right-6 z-50 w-96 max-h-80 bg-neutral-900 border border-orange-500/50 rounded-2xl shadow-2xl overflow-hidden flex flex-col animate-fade-in text-xs">
          <div className="px-4 py-2.5 bg-neutral-950 border-b border-neutral-800 flex items-center justify-between">
            <span className="font-mono text-orange-400 font-bold">{skillOutput.command} output</span>
            <button onClick={() => setSkillOutput(null)} className="text-neutral-500 hover:text-white text-xs">
              ✕
            </button>
          </div>
          <pre className="p-4 overflow-y-auto font-mono text-[11px] text-neutral-300 bg-black/40 flex-1 whitespace-pre-wrap">
            {skillOutput.output}
          </pre>
        </div>
      )}
    </div>
  );
}

export default App;
