import React from 'react';
import { useAmyCockpitStore } from '../stores/useAmyCockpitStore';

export const DeterministicGuardHUD: React.FC = () => {
  const {
    preToolGuardPassed,
    rotRateAlert,
    rotRateDays,
    lastBuildSuccessful,
    dlpViolationsCount,
    updateGuardStatus,
  } = useAmyCockpitStore();

  return (
    <div className="bg-neutral-900/40 border border-neutral-800/80 rounded-2xl p-4 shadow-xl backdrop-blur-sm space-y-3 font-mono text-xs">
      <div className="flex items-center justify-between border-b border-neutral-800/80 pb-2">
        <div className="flex items-center gap-2">
          <span className="text-orange-400 font-bold">5D</span>
          <h2 className="text-xs font-bold uppercase tracking-wider text-neutral-200">
            DETERMINISTIC GUARD HUD
          </h2>
        </div>
        <span className="text-[10px] text-emerald-400 font-semibold">● CIRCUIT BREAKERS OK</span>
      </div>

      <div className="grid grid-cols-3 gap-3">
        {/* Pre-Tool Guard (DLP) */}
        <div className="p-3 rounded-xl bg-neutral-950/80 border border-neutral-800 flex flex-col justify-between space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[10px] text-neutral-400 uppercase font-semibold">PRE-TOOL GUARD</span>
            <span
              className={`w-2.5 h-2.5 rounded-full ${
                preToolGuardPassed ? 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.8)]' : 'bg-red-500 animate-ping'
              }`}
            />
          </div>
          <div>
            <div className="text-xs font-bold text-neutral-200">
              {preToolGuardPassed ? 'DLP/SECRETS PASSED' : 'LEAK BLOCKED'}
            </div>
            <div className="text-[9px] text-neutral-500 mt-0.5">{dlpViolationsCount} Fuite(s) Détectée(s)</div>
          </div>
          <button
            onClick={() => updateGuardStatus('preToolGuardPassed', !preToolGuardPassed)}
            className="w-full py-1 rounded bg-neutral-900 hover:bg-neutral-800 text-[9px] text-neutral-400 hover:text-white border border-neutral-800 transition-colors"
          >
            TOGGLE GUARD
          </button>
        </div>

        {/* Rot-Rate Indicator */}
        <div className="p-3 rounded-xl bg-neutral-950/80 border border-neutral-800 flex flex-col justify-between space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[10px] text-neutral-400 uppercase font-semibold">ROT RATE CHECK</span>
            <span
              className={`w-2.5 h-2.5 rounded-full ${
                rotRateAlert ? 'bg-amber-500 shadow-[0_0_8px_rgba(245,158,11,0.8)]' : 'bg-emerald-500'
              }`}
            />
          </div>
          <div>
            <div className="text-xs font-bold text-neutral-200">
              {rotRateAlert ? 'DOC STALE (>7D)' : 'CONTEXT FRESH'}
            </div>
            <div className="text-[9px] text-neutral-500 mt-0.5">Dernier Refresh: il y a {rotRateDays}j</div>
          </div>
          <button
            onClick={() => updateGuardStatus('rotRateAlert', !rotRateAlert)}
            className="w-full py-1 rounded bg-neutral-900 hover:bg-neutral-800 text-[9px] text-neutral-400 hover:text-white border border-neutral-800 transition-colors"
          >
            REFRESH RATE
          </button>
        </div>

        {/* Post-Build SSSF Gate */}
        <div className="p-3 rounded-xl bg-neutral-950/80 border border-neutral-800 flex flex-col justify-between space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[10px] text-neutral-400 uppercase font-semibold">POST-BUILD GATE</span>
            <span
              className={`w-2.5 h-2.5 rounded-full ${
                lastBuildSuccessful ? 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.8)]' : 'bg-red-500'
              }`}
            />
          </div>
          <div>
            <div className="text-xs font-bold text-neutral-200">
              {lastBuildSuccessful ? 'RYAN FORGE: 0 ERR' : 'BUILD FAIL (TSC)'}
            </div>
            <div className="text-[9px] text-neutral-500 mt-0.5">SSSF Validator: OK</div>
          </div>
          <button
            onClick={() => updateGuardStatus('lastBuildSuccessful', !lastBuildSuccessful)}
            className="w-full py-1 rounded bg-neutral-900 hover:bg-neutral-800 text-[9px] text-neutral-400 hover:text-white border border-neutral-800 transition-colors"
          >
            SIMULER BUILD
          </button>
        </div>
      </div>
    </div>
  );
};
