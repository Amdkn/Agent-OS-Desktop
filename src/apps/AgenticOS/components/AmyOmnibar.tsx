import React, { useState } from 'react';
import { useAmyCockpitStore, EffortLevel7D } from '../stores/useAmyCockpitStore';

const SUBSTRATES = [
  { id: 'claude-3-7-sonnet', name: 'Claude 3.7 Sonnet' },
  { id: 'claude-3-5-sonnet', name: 'Claude 3.5 Sonnet' },
  { id: 'gemini-2- flash', name: 'Gemini 2.0 Flash' },
  { id: 'hermes-local', name: 'Hermes 3 Local (Ollama)' },
];

const EFFORT_LEVELS: EffortLevel7D[] = ['low', 'medium', 'high', 'xhigh'];

export const AmyOmnibar: React.FC = () => {
  const {
    effortLevel,
    setEffortLevel,
    activeModel,
    setActiveModel,
    addEvent,
  } = useAmyCockpitStore();

  const [commandInput, setCommandInput] = useState('');
  const [commandStatus, setCommandStatus] = useState<string | null>(null);

  const handleExecuteCommand = (e: React.FormEvent) => {
    e.preventDefault();
    if (!commandInput.trim()) return;

    const cmd = commandInput.trim();
    setCommandStatus(`Exécution de [${cmd}] avec ${activeModel} (${effortLevel.toUpperCase()})...`);

    addEvent({
      source: 'AMY',
      level: 'INFO',
      dimension: '3D',
      payload: { command: cmd, model: activeModel, effort: effortLevel },
      doxContext: '10_Tech_OS',
    });

    setTimeout(() => {
      setCommandStatus(`✓ Commande [${cmd}] transmise au bus River.`);
      setCommandInput('');
      setTimeout(() => setCommandStatus(null), 3000);
    }, 800);
  };

  return (
    <div className="bg-neutral-900/40 border border-neutral-800/80 rounded-2xl p-4 shadow-xl backdrop-blur-sm space-y-4 font-mono text-xs">
      <div className="flex items-center justify-between border-b border-neutral-800/80 pb-2">
        <div className="flex items-center gap-2">
          <span className="text-orange-400 font-bold">3D</span>
          <h2 className="text-xs font-bold uppercase tracking-wider text-neutral-200">
            AMY OMNIBAR & SKILLS DECK
          </h2>
        </div>
        <span className="text-[10px] text-neutral-500">PALETTE Cmd+K</span>
      </div>

      {/* Omnibar Universal Input Form */}
      <form onSubmit={handleExecuteCommand} className="relative">
        <div className="relative flex items-center bg-black/60 border border-neutral-800 rounded-xl px-3.5 py-2.5 focus-within:border-orange-500/80 transition-all shadow-inner">
          <span className="text-orange-500 font-bold mr-2 text-sm">⌘</span>
          <input
            type="text"
            value={commandInput}
            onChange={(e) => setCommandInput(e.target.value)}
            placeholder="Tapez /build, /capture, /audit, /dispatch ou une commande MCP..."
            className="w-full bg-transparent text-xs font-mono text-neutral-100 placeholder-neutral-500 focus:outline-none"
          />
          <button
            type="submit"
            className="px-3 py-1 rounded-lg bg-orange-600 hover:bg-orange-500 text-white font-bold text-[10px] transition-all shrink-0 ml-2 shadow-md shadow-orange-950"
          >
            LANCER ↵
          </button>
        </div>
      </form>

      {commandStatus && (
        <div className="p-2 rounded-lg bg-orange-950/40 border border-orange-800/60 text-orange-300 text-[11px] animate-fade-in font-sans">
          {commandStatus}
        </div>
      )}

      {/* Substrate Selector & Effort Slider */}
      <div className="grid grid-cols-2 gap-3 pt-1">
        {/* Substrate Model Switcher */}
        <div className="p-3 rounded-xl bg-neutral-950/80 border border-neutral-800 space-y-1.5">
          <span className="text-[10px] text-neutral-400 uppercase font-semibold">SUBSTRAT D'EXÉCUTION</span>
          <label htmlFor="substrate-selector" className="sr-only">Substrat d'exécution</label>
          <select
            id="substrate-selector"
            value={activeModel}
            onChange={(e) => setActiveModel(e.target.value)}
            className="w-full bg-neutral-900 border border-neutral-800 rounded-lg p-1.5 text-xs text-orange-400 font-bold font-mono focus:outline-none focus:border-orange-500 cursor-pointer"
          >
            {SUBSTRATES.map((sub) => (
              <option key={sub.id} value={sub.id} className="bg-neutral-950 text-neutral-200">
                {sub.name}
              </option>
            ))}
          </select>
        </div>

        {/* Effort Level Slider / Selector */}
        <div className="p-3 rounded-xl bg-neutral-950/80 border border-neutral-800 space-y-1.5">
          <div className="flex justify-between items-center">
            <span className="text-[10px] text-neutral-400 uppercase font-semibold">NIVEAU D'EFFORT</span>
            <span className="text-[10px] font-bold text-orange-400 uppercase">{effortLevel}</span>
          </div>
          <div className="grid grid-cols-4 gap-1">
            {EFFORT_LEVELS.map((eff) => (
              <button
                key={eff}
                onClick={() => setEffortLevel(eff)}
                className={`py-1 rounded text-[9px] font-bold uppercase transition-all ${
                  effortLevel === eff
                    ? 'bg-orange-600 text-white shadow-md'
                    : 'bg-neutral-900 text-neutral-500 hover:text-neutral-300 border border-neutral-800'
                }`}
              >
                {eff}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
