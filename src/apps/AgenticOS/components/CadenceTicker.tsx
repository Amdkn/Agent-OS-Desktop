import React, { useState, useEffect } from 'react';
import { useAmyCockpitStore } from '../stores/useAmyCockpitStore';

export const CadenceTicker: React.FC = () => {
  const {
    weeklyExecutionScore,
    isStrategicBlockActive,
    toggleStrategicBlock,
    nextCronCountdownSeconds,
  } = useAmyCockpitStore();

  const [secondsLeft, setSecondsLeft] = useState(nextCronCountdownSeconds);

  useEffect(() => {
    const timer = setInterval(() => {
      setSecondsLeft((prev) => (prev > 0 ? prev - 1 : 1800));
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  return (
    <div className="bg-neutral-900/40 border border-neutral-800/80 rounded-2xl p-4 shadow-xl backdrop-blur-sm space-y-3 font-mono text-xs">
      <div className="flex items-center justify-between border-b border-neutral-800/80 pb-2">
        <div className="flex items-center gap-2">
          <span className="text-orange-400 font-bold">4D</span>
          <h2 className="text-xs font-bold uppercase tracking-wider text-neutral-200">
            CADENCE & ROUTINES TICKER
          </h2>
        </div>
        <span className="text-[10px] text-neutral-500">CYCLE CIRCADIEN</span>
      </div>

      <div className="grid grid-cols-3 gap-3">
        {/* Scorecard 12WY */}
        <div className="p-3 rounded-xl bg-neutral-950/80 border border-neutral-800 flex flex-col justify-between space-y-1">
          <span className="text-[10px] text-neutral-400 uppercase font-semibold">SCORECARD 12WY</span>
          <div className="flex items-baseline gap-1">
            <span className="text-2xl font-extrabold text-orange-500">{weeklyExecutionScore}%</span>
            <span className="text-[9px] text-emerald-400 font-semibold">(&gt;85% OK)</span>
          </div>
          <div className="w-full bg-neutral-800 h-1.5 rounded-full overflow-hidden">
            <div
              className="bg-orange-500 h-full rounded-full transition-all duration-500"
              style={{ width: `${weeklyExecutionScore}%` }}
            />
          </div>
        </div>

        {/* Verrou Strategic Block */}
        <div
          className={`p-3 rounded-xl border flex flex-col justify-between space-y-1 transition-all ${
            isStrategicBlockActive
              ? 'bg-purple-950/80 border-purple-600/80 shadow-[0_0_15px_rgba(168,85,247,0.3)]'
              : 'bg-neutral-950/80 border-neutral-800'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-[10px] text-neutral-400 uppercase font-semibold">STRATEGIC BLOCK</span>
            <span className="text-[10px]">{isStrategicBlockActive ? '🔒' : '🔓'}</span>
          </div>
          <div className="text-xs font-bold text-neutral-200">
            {isStrategicBlockActive ? 'MODE DEEP WORK (3H)' : 'DEEP WORK INACTIF'}
          </div>
          <button
            onClick={toggleStrategicBlock}
            className={`w-full py-1 rounded text-[9px] font-bold transition-all ${
              isStrategicBlockActive
                ? 'bg-purple-600 text-white hover:bg-purple-500'
                : 'bg-neutral-900 hover:bg-neutral-800 text-neutral-400 border border-neutral-800'
            }`}
          >
            {isStrategicBlockActive ? 'DÉVERROUILLER' : 'ACTIVATION 3H'}
          </button>
        </div>

        {/* Moniteur de Crons */}
        <div className="p-3 rounded-xl bg-neutral-950/80 border border-neutral-800 flex flex-col justify-between space-y-1">
          <span className="text-[10px] text-neutral-400 uppercase font-semibold">PROCHAIN CRON</span>
          <div className="text-xl font-extrabold font-mono text-amber-400 tracking-tight">
            {formatTime(secondsLeft)}
          </div>
          <div className="text-[9px] text-neutral-500">Heartbeat Graham & Hermes</div>
        </div>
      </div>
    </div>
  );
};
