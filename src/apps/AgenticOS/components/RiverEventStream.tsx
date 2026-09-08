import React, { useState } from 'react';
import { useAmyCockpitStore } from '../stores/useAmyCockpitStore';

const MOCK_ARTIFACTS = [
  { id: 'art-1', name: 'SOP-Standard-Deployment-V3.pdf', type: 'PDF', date: 'Aujourd\'hui 10:12', size: '1.2 MB' },
  { id: 'art-2', name: 'schema_rory_supabase_v2.sql', type: 'SQL', date: 'Hier 18:45', size: '45 KB' },
  { id: 'art-3', name: 'AmyOmnibar.tsx', type: 'REACT', date: 'Il y a 2h', size: '8 KB' },
  { id: 'art-4', name: 'export_metrics_12wy.html', type: 'HTML', date: 'Hier 14:00', size: '230 KB' },
];

export const RiverEventStream: React.FC = () => {
  const { eventsStream, deadLetterQueueCount, clearDeadLetterQueue } = useAmyCockpitStore();
  const [filterCategory, setFilterCategory] = useState<string>('ALL');

  const filteredArtifacts = filterCategory === 'ALL'
    ? MOCK_ARTIFACTS
    : MOCK_ARTIFACTS.filter((a) => a.type === filterCategory);

  return (
    <div className="bg-neutral-900/40 border border-neutral-800/80 rounded-2xl p-4 shadow-xl backdrop-blur-sm space-y-4 font-mono text-xs">
      <div className="flex items-center justify-between border-b border-neutral-800/80 pb-2">
        <div className="flex items-center gap-2">
          <span className="text-orange-400 font-bold">2D</span>
          <h2 className="text-xs font-bold uppercase tracking-wider text-neutral-200">
            RIVER EVENT STREAM & ARTIFACTS RING
          </h2>
        </div>
        <div className="flex items-center gap-2">
          {deadLetterQueueCount > 0 ? (
            <button
              onClick={clearDeadLetterQueue}
              className="px-2 py-0.5 rounded bg-red-950 border border-red-700 text-red-400 text-[10px] font-bold animate-pulse"
              title="Purger la file Dead Letter Queue"
            >
              DLQ: {deadLetterQueueCount} ÉCHECS (REJOUER)
            </button>
          ) : (
            <span className="text-[10px] text-emerald-400 font-semibold">● DLQ PROPRE</span>
          )}
        </div>
      </div>

      {/* Live Event Stream Ticker */}
      <div className="space-y-1.5">
        <span className="text-[10px] text-neutral-500 uppercase font-semibold">
          FLUX D'ÉVÉNEMENTS ASYNCHRONES (N8N / WEBHCOKS)
        </span>
        <div className="bg-black/60 border border-neutral-800 rounded-xl p-2.5 max-h-32 overflow-y-auto space-y-1">
          {eventsStream.length === 0 ? (
            <div className="text-neutral-500 text-[11px] p-2 text-center">Aucun événement récent</div>
          ) : (
            eventsStream.map((ev) => (
              <div
                key={ev.id}
                className="flex items-center justify-between p-1.5 rounded bg-neutral-900/60 border border-neutral-800/60 text-[10px] hover:border-orange-500/40 transition-colors"
              >
                <div className="flex items-center gap-2 truncate">
                  <span className="px-1.5 py-0.2 rounded bg-orange-950 text-orange-400 border border-orange-800 font-bold text-[9px]">
                    {ev.source}
                  </span>
                  <span className="text-neutral-300 truncate">
                    {JSON.stringify(ev.payload)}
                  </span>
                </div>
                <span className="text-neutral-500 text-[9px] shrink-0 ml-2">
                  {new Date(ev.timestamp).toLocaleTimeString()}
                </span>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Artifacts Ring Carousel / Catalog */}
      <div className="space-y-2 pt-1 border-t border-neutral-800/60">
        <div className="flex items-center justify-between">
          <span className="text-[10px] text-neutral-500 uppercase font-semibold">
            CARROUSEL D'ACTIFS D'INGÉNIERIE
          </span>
          <div className="flex items-center gap-1">
            {['ALL', 'PDF', 'SQL', 'REACT', 'HTML'].map((cat) => (
              <button
                key={cat}
                onClick={() => setFilterCategory(cat)}
                className={`px-2 py-0.5 rounded text-[9px] font-bold ${
                  filterCategory === cat
                    ? 'bg-orange-600 text-white'
                    : 'bg-neutral-900 text-neutral-500 hover:text-neutral-300'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-2">
          {filteredArtifacts.map((art) => (
            <div
              key={art.id}
              className="p-2.5 rounded-xl bg-neutral-950/80 border border-neutral-800 hover:border-orange-500/50 transition-all flex items-center justify-between cursor-pointer group"
            >
              <div className="truncate pr-2">
                <div className="flex items-center gap-1.5">
                  <span className="text-xs">📁</span>
                  <span className="text-[11px] font-bold text-neutral-200 group-hover:text-orange-400 truncate">
                    {art.name}
                  </span>
                </div>
                <div className="text-[9px] text-neutral-500 mt-0.5">
                  {art.date} • {art.size}
                </div>
              </div>
              <span className="text-neutral-600 group-hover:text-orange-400 text-xs">→</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
