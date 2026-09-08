import React, { useState } from 'react';
import { useAmyCockpitStore } from '../stores/useAmyCockpitStore';

export const SilverPlatterGrid: React.FC = () => {
  const { walDbStatus } = useAmyCockpitStore();
  const [dataFilter, setDataFilter] = useState<'ALL' | 'HEALTH' | 'CASH' | 'DELIVERY'>('ALL');

  const kpiCards = [
    { id: 'kpi-1', category: 'HEALTH', title: 'Santé LD03 (Opérationnel)', value: '99.8%', status: 'EXCELLENT', color: 'text-emerald-400 border-emerald-800 bg-emerald-950/20' },
    { id: 'kpi-2', category: 'CASH', title: 'Cash Flow LD02 (Runway)', value: '18.4 Mois', status: 'STABLE', color: 'text-amber-400 border-amber-800 bg-amber-950/20' },
    { id: 'kpi-3', category: 'DELIVERY', title: 'Delivery BD05 (SOP Velocity)', value: '14 / Semaine', status: 'CIBLE ATTEINTE', color: 'text-sky-400 border-sky-800 bg-sky-950/20' },
    { id: 'kpi-4', category: 'HEALTH', title: 'Latence SQLite WAL (uc.db)', value: '1.4 ms', status: 'OPTIQUE', color: 'text-purple-400 border-purple-800 bg-purple-950/20' },
  ];

  const filteredCards = dataFilter === 'ALL'
    ? kpiCards
    : kpiCards.filter((c) => c.category === dataFilter);

  return (
    <div className="bg-neutral-900/40 border border-neutral-800/80 rounded-2xl p-4 shadow-xl backdrop-blur-sm space-y-4 font-mono text-xs">
      <div className="flex items-center justify-between border-b border-neutral-800/80 pb-2">
        <div className="flex items-center gap-2">
          <span className="text-orange-400 font-bold">1D</span>
          <h2 className="text-xs font-bold uppercase tracking-wider text-neutral-200">
            SILVER PLATTER GRID (DATA PANTRY)
          </h2>
        </div>
        <div className="flex items-center gap-3 text-[10px]">
          <span className="flex items-center gap-1 text-neutral-400">
            <span>uc.db WAL:</span>
            <strong className="text-emerald-400 uppercase">{walDbStatus.ucDb}</strong>
          </span>
          <span className="flex items-center gap-1 text-neutral-400">
            <span>sssf.db:</span>
            <strong className="text-emerald-400 uppercase">{walDbStatus.sssfDb}</strong>
          </span>
          <span className="flex items-center gap-1 text-neutral-400">
            <span>Supabase:</span>
            <strong className="text-emerald-400 uppercase">{walDbStatus.supabase}</strong>
          </span>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center justify-between">
        <span className="text-[10px] text-neutral-500 uppercase font-semibold">
          DONNÉES PRÉ-MÂCHÉES (ZÉRO JSON BRUT)
        </span>
        <div className="flex items-center gap-1">
          {['ALL', 'HEALTH', 'CASH', 'DELIVERY'].map((f) => (
            <button
              key={f}
              onClick={() => setDataFilter(f as any)}
              className={`px-2 py-0.5 rounded text-[9px] font-bold transition-all ${
                dataFilter === f
                  ? 'bg-orange-600 text-white shadow-md'
                  : 'bg-neutral-900 text-neutral-500 hover:text-neutral-300'
              }`}
            >
              {f}
            </button>
          ))}
        </div>
      </div>

      {/* Materialized KPI Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {filteredCards.map((card) => (
          <div
            key={card.id}
            className={`p-3 rounded-xl border flex flex-col justify-between space-y-2 transition-all hover:scale-[1.02] ${card.color}`}
          >
            <span className="text-[10px] font-semibold text-neutral-400 uppercase truncate">
              {card.title}
            </span>
            <div className="text-xl font-extrabold font-mono tracking-tight text-white">
              {card.value}
            </div>
            <div className="flex items-center justify-between text-[9px] font-bold">
              <span className="text-neutral-400">{card.category}</span>
              <span>{card.status}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
