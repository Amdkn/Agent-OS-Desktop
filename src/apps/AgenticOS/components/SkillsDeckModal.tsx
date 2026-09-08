import React from 'react';
import type { ClaudeModel, EffortLevel, SkillCard } from '../types';

interface Props {
  skill: SkillCard;
  onClose: () => void;
  onSave: (skillId: string, model: ClaudeModel, effort: EffortLevel) => void;
  onRun: (skill: SkillCard) => void;
}

const MODELS: ClaudeModel[] = ['HAIKU', 'SONNET', 'OPUS', 'FABLE', 'GLM'];
const EFFORTS: EffortLevel[] = ['LOW', 'MEDIUM', 'HIGH', 'XHIGH', 'MAX'];

export const SkillsDeckModal: React.FC<Props> = ({ skill, onClose, onSave, onRun }) => {
  const [selectedModel, setSelectedModel] = React.useState<ClaudeModel>(skill.selectedModel);
  const [selectedEffort, setSelectedEffort] = React.useState<EffortLevel>(skill.selectedEffort);

  const handleSelect = (m: ClaudeModel, e: EffortLevel) => {
    setSelectedModel(m);
    setSelectedEffort(e);
    onSave(skill.id, m, e);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4 animate-fade-in">
      <div className="w-full max-w-lg bg-neutral-900 border border-neutral-800 rounded-2xl shadow-2xl overflow-hidden text-neutral-200 text-xs">
        {/* Header */}
        <div className="px-5 py-4 border-b border-neutral-800 flex items-center justify-between bg-neutral-950/60">
          <div className="flex items-center gap-2">
            <span className="text-orange-500 font-mono font-bold text-sm">{skill.command}</span>
            <span className="text-neutral-500 text-xs uppercase tracking-wider font-semibold">• Model & Effort Matrix</span>
          </div>
          <button
            onClick={onClose}
            className="w-7 h-7 rounded-lg bg-neutral-800 hover:bg-neutral-700 text-neutral-400 hover:text-white flex items-center justify-center transition-colors"
          >
            ✕
          </button>
        </div>

        {/* Matrix Body */}
        <div className="p-6 space-y-6">
          <p className="text-neutral-400 text-xs">
            Sélectionnez la combinaison modèle et niveau d'effort pour l'exécution sans interface (headless <code className="text-orange-400">claude -p</code>).
          </p>

          {/* Effort Column Headers */}
          <div className="grid grid-cols-6 gap-2 text-center text-[10px] font-mono text-neutral-500 font-semibold tracking-wider">
            <div className="text-left text-neutral-600">MODEL</div>
            {EFFORTS.map((eff) => (
              <div key={eff} className={selectedEffort === eff ? 'text-orange-400 font-bold' : ''}>
                {eff}
              </div>
            ))}
          </div>

          {/* Models Rows & Matrix Dots */}
          <div className="space-y-3">
            {MODELS.map((mod) => {
              const isCurrentModel = selectedModel === mod;
              return (
                <div
                  key={mod}
                  className={`grid grid-cols-6 items-center gap-2 px-3 py-2.5 rounded-xl border transition-all ${
                    isCurrentModel
                      ? 'bg-neutral-800/80 border-orange-500/50 shadow-inner'
                      : 'bg-neutral-950/40 border-neutral-800/60 hover:border-neutral-700'
                  }`}
                >
                  <span className={`font-mono text-xs font-semibold ${isCurrentModel ? 'text-white' : 'text-neutral-400'}`}>
                    {mod}
                  </span>

                  {EFFORTS.map((eff) => {
                    const isSelected = isCurrentModel && selectedEffort === eff;
                    return (
                      <button
                        key={eff}
                        onClick={() => handleSelect(mod, eff)}
                        className="flex items-center justify-center p-1.5 group"
                        title={`${mod} at ${eff} effort`}
                      >
                        <div
                          className={`w-3.5 h-3.5 rounded-full transition-all flex items-center justify-center ${
                            isSelected
                              ? 'bg-orange-500 ring-4 ring-orange-500/20 scale-125'
                              : 'bg-neutral-700 group-hover:bg-neutral-500'
                          }`}
                        >
                          {isSelected && <div className="w-1 h-1 rounded-full bg-white" />}
                        </div>
                      </button>
                    );
                  })}
                </div>
              );
            })}
          </div>

          {/* Preset Summary */}
          <div className="p-3.5 bg-neutral-950 rounded-xl border border-neutral-800/80 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-neutral-400 text-xs">Configuration active :</span>
              <span className="px-2 py-0.5 rounded bg-orange-950 text-orange-400 border border-orange-800 font-mono font-bold text-xs">
                {selectedModel}
              </span>
              <span className="px-2 py-0.5 rounded bg-neutral-800 text-neutral-300 font-mono text-xs">
                {selectedEffort}
              </span>
            </div>
            <span className="text-[11px] text-neutral-500 font-mono">1-shot execution</span>
          </div>
        </div>

        {/* Footer actions */}
        <div className="px-6 py-4 border-t border-neutral-800 bg-neutral-950/80 flex items-center justify-end gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-neutral-300 text-xs font-medium transition-colors"
          >
            Fermer
          </button>
          <button
            onClick={() => {
              onRun({ ...skill, selectedModel, selectedEffort });
              onClose();
            }}
            className="px-5 py-2 rounded-xl bg-gradient-to-r from-orange-600 to-amber-600 hover:from-orange-500 hover:to-amber-500 text-white text-xs font-semibold shadow-lg shadow-orange-950 flex items-center gap-2 transition-all"
          >
            <span>▶</span>
            <span>Lancer {skill.command}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
