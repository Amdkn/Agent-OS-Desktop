import React from 'react';
import { useAmyCockpitStore } from '../stores/useAmyCockpitStore';

interface Props {
  node: any | null;
  onClose: () => void;
}

export const DetailSidebarPanel: React.FC<Props> = ({ node, onClose }) => {
  const store = useAmyCockpitStore();

  if (!node) return null;

  return (
    <aside className="fixed inset-y-0 right-0 z-50 w-96 bg-[#0b0e14]/95 backdrop-blur-2xl border-l border-neutral-800 shadow-2xl flex flex-col font-mono text-xs text-neutral-200 animate-in slide-in-from-right duration-200">
      {/* Panel Header */}
      <div className="px-5 py-4 border-b border-neutral-800 bg-neutral-950/80 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <span className="text-lg">{node.icon || '📌'}</span>
          <div>
            <span className="text-[9px] px-1.5 py-0.5 rounded bg-orange-950 text-orange-400 border border-orange-800 font-bold uppercase">
              {node.dimension || `LAYER ${node.layer || '7D'}`}
            </span>
            <h3 className="text-xs font-bold text-neutral-100 truncate mt-0.5">{node.label || node.name}</h3>
          </div>
        </div>
        <button
          onClick={onClose}
          className="p-1 rounded bg-neutral-900 border border-neutral-800 text-neutral-400 hover:text-white"
        >
          ✕
        </button>
      </div>

      {/* Dynamic Interactive Body according to node dimension */}
      <div className="flex-1 p-5 overflow-y-auto space-y-4">
        {/* Status Badge */}
        <div className="p-3 rounded-xl bg-neutral-900/80 border border-neutral-800 space-y-1">
          <span className="text-[10px] text-neutral-500 uppercase font-semibold">STATUT OPERATIONNEL</span>
          <div className="flex items-center justify-between">
            <span className="font-bold text-emerald-400">● ACTIF & SYNCHRONISÉ</span>
            <span className="text-[10px] text-neutral-400">Contrat Zod OK</span>
          </div>
        </div>

        {/* CMS Level Mapping */}
        <div className="p-3 rounded-xl bg-black/60 border border-neutral-800 space-y-2">
          <span className="text-[10px] text-orange-400 uppercase font-bold">STRUCTURATION CMS MULTI-COUCHES</span>
          <div className="space-y-1 text-[11px] text-neutral-300">
            <div><strong>N1 Application:</strong> Agentic OS (Amy)</div>
            <div><strong>N2 Vue:</strong> {node.dimension || '7D Cockpit'}</div>
            <div><strong>N3 Section:</strong> Orbit & Inspection Node</div>
            <div><strong>N4 Record ID:</strong> {node.id}</div>
          </div>
        </div>

        {/* Context Controls */}
        <div className="space-y-2">
          <span className="text-[10px] text-neutral-500 uppercase font-semibold">INSPECTION DE CONTEXTE</span>
          <div className="p-3 rounded-xl bg-neutral-950 border border-neutral-800 space-y-2 text-[11px]">
            <div className="flex justify-between">
              <span className="text-neutral-400">DOX Path:</span>
              <span className="text-orange-400 font-bold">{store.activeDoxPath}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-neutral-400">Ikigai Horizon:</span>
              <span className="text-orange-400 font-bold">{store.activeHorizon}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-neutral-400">Effort Modèle:</span>
              <span className="text-orange-400 font-bold uppercase">{store.effortLevel}</span>
            </div>
          </div>
        </div>

        {/* Action Button */}
        <button
          onClick={() => {
            store.addEvent({
              source: 'AMY',
              level: 'INFO',
              dimension: '3D',
              payload: { inspectedNode: node.id, label: node.label },
              doxContext: store.activeDoxPath,
            });
            alert(`Nœud [${node.label}] révisé et tracé dans uc.db !`);
          }}
          className="w-full py-2.5 rounded-xl bg-orange-600 hover:bg-orange-500 text-white font-bold transition-all shadow-lg shadow-orange-950"
        >
          INSPECTER DANS UC.DB ↵
        </button>
      </div>

      {/* Footer */}
      <div className="px-5 py-3 border-t border-neutral-800 bg-neutral-950 text-[10px] text-neutral-500 flex justify-between">
        <span>A'Space OS V3</span>
        <span>Inspection 7D</span>
      </div>
    </aside>
  );
};
