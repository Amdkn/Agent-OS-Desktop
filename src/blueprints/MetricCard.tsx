import type { BlueprintKpi, StatusTone } from './types';

interface MetricCardProps {
  kpi: BlueprintKpi;
}

const TONE_CLASSES: Record<StatusTone, { border: string; text: string; bg: string; badge: string }> = {
  emerald: {
    border: 'border-emerald-500/30',
    text: 'text-emerald-400',
    bg: 'bg-emerald-500/10',
    badge: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30',
  },
  blue: {
    border: 'border-cyan-500/30',
    text: 'text-cyan-400',
    bg: 'bg-cyan-500/10',
    badge: 'bg-cyan-500/20 text-cyan-300 border-cyan-500/30',
  },
  amber: {
    border: 'border-amber-500/30',
    text: 'text-amber-400',
    bg: 'bg-amber-500/10',
    badge: 'bg-amber-500/20 text-amber-300 border-amber-500/30',
  },
  rose: {
    border: 'border-rose-500/30',
    text: 'text-rose-400',
    bg: 'bg-rose-500/10',
    badge: 'bg-rose-500/20 text-rose-300 border-rose-500/30',
  },
  purple: {
    border: 'border-purple-500/30',
    text: 'text-purple-400',
    bg: 'bg-purple-500/10',
    badge: 'bg-purple-500/20 text-purple-300 border-purple-500/30',
  },
  slate: {
    border: 'border-slate-500/30',
    text: 'text-slate-300',
    bg: 'bg-slate-500/10',
    badge: 'bg-slate-500/20 text-slate-300 border-slate-500/30',
  },
};

export function MetricCard({ kpi }: MetricCardProps) {
  const tone = TONE_CLASSES[kpi.tone ?? 'emerald'];

  return (
    <div
      className={`relative p-4 rounded-xl border ${tone.border} ${tone.bg} backdrop-blur-md flex flex-col gap-2 transition-all hover:scale-[1.01] shadow-lg`}
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          {kpi.icon && <span className="text-lg">{kpi.icon}</span>}
          <span className="text-xs font-medium text-[var(--color-text-dim)] uppercase tracking-wider">
            {kpi.label}
          </span>
        </div>
        {kpi.delta && (
          <span
            className={`text-[10px] font-mono px-2 py-0.5 rounded-full border ${tone.badge}`}
          >
            {kpi.trend === 'up' && '▲ '}
            {kpi.trend === 'down' && '▼ '}
            {kpi.delta}
          </span>
        )}
      </div>

      <div className={`text-2xl font-mono font-bold tracking-tight ${tone.text}`}>
        {kpi.value}
      </div>

      {kpi.subtext && (
        <div className="text-[11px] text-[var(--color-text-dim)] font-mono truncate">
          {kpi.subtext}
        </div>
      )}
    </div>
  );
}
