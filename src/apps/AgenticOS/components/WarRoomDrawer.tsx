import React, { useState } from 'react';
import { useAmyCockpitStore } from '../stores/useAmyCockpitStore';

export const WarRoomDrawer: React.FC = () => {
  const {
    isWarRoomOpen,
    setWarRoomOpen,
    activeAudioChannel,
    setActiveAudioChannel,
    standupOutput,
    isStandupRunning,
    triggerStandup,
  } = useAmyCockpitStore();

  const [activeTab, setActiveTab] = useState<'standup' | 'debate' | 'audio'>('standup');
  const [agentDebateTopic, setAgentDebateTopic] = useState('Arbitrage Architecture: Microservices vs Monolithe Souverain');
  const [debateLog, setDebateLog] = useState<Array<{ agent: string; color: string; message: string }>>([
    {
      agent: 'Beth Visionnaire',
      color: 'text-purple-400 border-purple-800 bg-purple-950/40',
      message: 'Nous devrions découpler les modules en micro-apps isolées pour supporter le multi-tenant.',
    },
    {
      agent: 'Ryan Bâtisseur',
      color: 'text-amber-400 border-amber-800 bg-amber-950/40',
      message: 'Attention aux coûts de réseau. Un monolithe modulaire avec SQLite WAL garantit une latence < 2ms.',
    },
  ]);

  if (!isWarRoomOpen) return null;

  const handleRunDebate = () => {
    setDebateLog((prev) => [
      ...prev,
      {
        agent: 'Graham Synthèse',
        color: 'text-emerald-400 border-emerald-800 bg-emerald-950/40',
        message: `[Arbitrage Consensuel sur: ${agentDebateTopic}] Adoption du Monolithe Modulaire V3 avec contrats Zod aux frontières.`,
      },
    ]);
  };

  return (
    <div className="fixed inset-y-0 right-0 z-50 w-full max-w-md bg-[#0b0e14]/95 backdrop-blur-xl border-l border-neutral-800 shadow-2xl flex flex-col text-neutral-200 font-sans transition-all animate-in slide-in-from-right duration-300">
      {/* Drawer Header */}
      <div className="px-5 py-4 border-b border-neutral-800 bg-neutral-950/80 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-lg bg-orange-950/80 border border-orange-600/50 flex items-center justify-center text-orange-400 font-mono text-sm font-bold shadow-[0_0_10px_rgba(249,115,22,0.3)]">
            7D
          </div>
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider font-mono text-neutral-100">
              WAR ROOM & HIVEMIND
            </h3>
            <p className="text-[10px] text-neutral-500 font-mono">Conseil des Agents • Orchestration 11e Docteur</p>
          </div>
        </div>
        <button
          onClick={() => setWarRoomOpen(false)}
          className="p-1.5 rounded-lg bg-neutral-900 border border-neutral-800 hover:bg-neutral-800 text-neutral-400 hover:text-white transition-colors text-xs font-mono"
          title="Fermer (Esc)"
        >
          ✕
        </button>
      </div>

      {/* Tabs Bar */}
      <div className="flex border-b border-neutral-800/80 bg-neutral-900/40 text-xs font-mono">
        <button
          onClick={() => setActiveTab('standup')}
          className={`flex-1 py-2.5 text-center font-bold transition-colors border-b-2 ${
            activeTab === 'standup'
              ? 'border-orange-500 text-orange-400 bg-orange-950/20'
              : 'border-transparent text-neutral-400 hover:text-neutral-200'
          }`}
        >
          /STANDUP 24H
        </button>
        <button
          onClick={() => setActiveTab('debate')}
          className={`flex-1 py-2.5 text-center font-bold transition-colors border-b-2 ${
            activeTab === 'debate'
              ? 'border-orange-500 text-orange-400 bg-orange-950/20'
              : 'border-transparent text-neutral-400 hover:text-neutral-200'
          }`}
        >
          ARÈNE DÉBAT
        </button>
        <button
          onClick={() => setActiveTab('audio')}
          className={`flex-1 py-2.5 text-center font-bold transition-colors border-b-2 ${
            activeTab === 'audio'
              ? 'border-orange-500 text-orange-400 bg-orange-950/20'
              : 'border-transparent text-neutral-400 hover:text-neutral-200'
          }`}
        >
          CANAL AUDIO
        </button>
      </div>

      {/* Content Body */}
      <div className="flex-1 p-5 overflow-y-auto space-y-4 font-mono text-xs">
        {activeTab === 'standup' && (
          <div className="space-y-4">
            <div className="p-3.5 rounded-xl bg-neutral-900/60 border border-neutral-800/80 space-y-2">
              <span className="text-[10px] text-orange-400 font-semibold uppercase tracking-wider">
                COMMANDE UNIFIÉE INTER-AGENTS
              </span>
              <p className="text-[11px] text-neutral-400 leading-relaxed font-sans">
                Interroge instantanément la mémoire vive des agents A2 (12WY, PARA, GTD, Ikigai) pour produire un état consolidé.
              </p>
              <button
                onClick={triggerStandup}
                disabled={isStandupRunning}
                className={`w-full py-2.5 rounded-lg font-bold flex items-center justify-center gap-2 transition-all ${
                  isStandupRunning
                    ? 'bg-orange-950 text-orange-400 border border-orange-800 animate-pulse'
                    : 'bg-gradient-to-r from-orange-600 to-amber-600 hover:from-orange-500 hover:to-amber-500 text-white shadow-lg shadow-orange-950'
                }`}
              >
                <span>{isStandupRunning ? '⏳' : '⚡'}</span>
                <span>{isStandupRunning ? 'CONSOLIDATION EN COURS...' : 'LANCER /STANDUP GLOBAL'}</span>
              </button>
            </div>

            {standupOutput && (
              <div className="p-4 rounded-xl bg-black/60 border border-neutral-800 space-y-2">
                <div className="flex items-center justify-between text-[10px] text-neutral-500">
                  <span>RAPPORT DE CONSOLIDATION</span>
                  <span className="text-emerald-400 font-bold">● VIVANT</span>
                </div>
                <pre className="text-[11px] text-neutral-300 whitespace-pre-wrap leading-relaxed font-mono">
                  {standupOutput}
                </pre>
              </div>
            )}
          </div>
        )}

        {activeTab === 'debate' && (
          <div className="space-y-4">
            <div className="space-y-2">
              <label className="text-[10px] text-neutral-400 uppercase font-semibold">
                SUJET D'ARBITRAGE MULTI-AGENTS
              </label>
              <input
                type="text"
                value={agentDebateTopic}
                onChange={(e) => setAgentDebateTopic(e.target.value)}
                className="w-full bg-neutral-900 border border-neutral-800 rounded-lg p-2.5 text-xs text-neutral-100 focus:outline-none focus:border-orange-500"
              />
            </div>

            <button
              onClick={handleRunDebate}
              className="w-full py-2 rounded-lg bg-neutral-800 hover:bg-neutral-700 border border-neutral-700 text-neutral-200 font-bold transition-all text-xs"
            >
              ⚔️ SOUMETTRE À L'ARBITRAGE (BETH VS RYAN)
            </button>

            <div className="space-y-2 pt-2">
              <span className="text-[10px] text-neutral-500 uppercase">HISTORIQUE DES ÉCHANGES</span>
              {debateLog.map((log, i) => (
                <div key={i} className={`p-3 rounded-lg border text-xs space-y-1 ${log.color}`}>
                  <span className="font-bold text-[10px] block">{log.agent}</span>
                  <p className="font-sans leading-relaxed">{log.message}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'audio' && (
          <div className="space-y-4">
            <div className="p-4 rounded-xl bg-neutral-900/60 border border-neutral-800 space-y-3">
              <span className="text-[10px] text-orange-400 font-semibold uppercase">
                COMMUTATION FLUX AUDIO VOCAL
              </span>
              <p className="text-[11px] text-neutral-400 font-sans">
                Bascule entre l'affichage textuel condensé et le flux audio émis par le démon vocal local (antigravity_tts_daemon.py).
              </p>

              <div className="grid grid-cols-2 gap-2 pt-2">
                <button
                  onClick={() => setActiveAudioChannel('text')}
                  className={`p-3 rounded-xl border text-center transition-all ${
                    activeAudioChannel === 'text'
                      ? 'bg-orange-950/80 border-orange-500 text-orange-300 font-bold'
                      : 'bg-neutral-950 border-neutral-800 text-neutral-500 hover:text-neutral-300'
                  }`}
                >
                  <div className="text-lg">💬</div>
                  <div className="text-[10px] mt-1 font-bold">FLUX TEXTE</div>
                </button>

                <button
                  onClick={() => setActiveAudioChannel('voice_daemon')}
                  className={`p-3 rounded-xl border text-center transition-all ${
                    activeAudioChannel === 'voice_daemon'
                      ? 'bg-orange-950/80 border-orange-500 text-orange-300 font-bold shadow-[0_0_15px_rgba(249,115,22,0.3)]'
                      : 'bg-neutral-950 border-neutral-800 text-neutral-500 hover:text-neutral-300'
                  }`}
                >
                  <div className="text-lg">🎙️</div>
                  <div className="text-[10px] mt-1 font-bold">TTS DAEMON</div>
                </button>
              </div>
            </div>

            <div className="p-3.5 rounded-xl bg-black/40 border border-neutral-800 flex items-center justify-between text-[11px]">
              <span className="text-neutral-400">Statut antigravity_tts_daemon:</span>
              <span className="text-emerald-400 font-bold font-mono">● EN ÉCOUTE (PORT 5199)</span>
            </div>
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="px-5 py-3 border-t border-neutral-800 bg-neutral-950 text-[10px] font-mono text-neutral-500 flex justify-between">
        <span>A.R.M.S 7D War Room</span>
        <span className="text-neutral-400">A'Space OS V3</span>
      </div>
    </div>
  );
};
