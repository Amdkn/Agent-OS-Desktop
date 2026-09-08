import { useState } from 'react';
import type { AppBlueprint } from './types';
import { MetricCard } from './MetricCard';
import { DataGrid } from './DataGrid';
import { KanbanBoard } from './KanbanBoard';
import { ActionConsole } from './ActionConsole';
import { useShell } from '../shell/store';

interface BlueprintAppFactoryProps<T extends Record<string, unknown>> {
  blueprint: AppBlueprint<T>;
  initialTab?: 'overview' | 'data' | 'kanban' | 'actions';
}

export function BlueprintAppFactory<T extends Record<string, unknown>>({
  blueprint,
  initialTab = 'overview',
}: BlueprintAppFactoryProps<T>) {
  const [activeTab, setActiveTab] = useState<'overview' | 'data' | 'kanban' | 'actions'>(initialTab);
  const toggleCms = useShell((s) => s.toggleCms);

  return (
    <div className="w-full h-full flex flex-col bg-slate-950 text-[var(--color-text)] overflow-hidden select-none">
      {/* Barre de navigation interne */}
      <div className="flex items-center justify-between px-4 py-2.5 border-b border-white/10 bg-slate-900/80 backdrop-blur-md">
        <div className="flex items-center gap-3">
          <span className="text-xl">{blueprint.icon}</span>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-sm font-bold text-slate-100 tracking-tight">
                {blueprint.name}
              </h2>
              <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-white/10 text-[var(--color-accent)]">
                v{blueprint.version}
              </span>
              <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-[var(--color-accent)]/15 text-[var(--color-accent)] border border-[var(--color-accent)]/30 uppercase">
                {blueprint.domaine}
              </span>
            </div>
            <p className="text-[11px] text-[var(--color-text-dim)] truncate max-w-md">
              {blueprint.description}
            </p>
          </div>
        </div>

        {/* Boutons d'onglets & Passerelle CMS */}
        <div className="flex items-center gap-1">
          <div className="flex rounded-lg bg-black/40 border border-white/10 p-0.5 text-xs font-mono">
            <button
              onClick={() => setActiveTab('overview')}
              className={`px-2.5 py-1 rounded transition-colors ${
                activeTab === 'overview'
                  ? 'bg-[var(--color-accent)] text-black font-semibold shadow-sm'
                  : 'text-[var(--color-text-dim)] hover:text-white hover:bg-white/10'
              }`}
            >
              📊 Aperçu
            </button>
            {blueprint.columns && blueprint.dataset && (
              <button
                onClick={() => setActiveTab('data')}
                className={`px-2.5 py-1 rounded transition-colors ${
                  activeTab === 'data'
                    ? 'bg-[var(--color-accent)] text-black font-semibold shadow-sm'
                    : 'text-[var(--color-text-dim)] hover:text-white hover:bg-white/10'
                }`}
              >
                📋 Données
              </button>
            )}
            {blueprint.kanbanColumns && blueprint.kanbanCards && (
              <button
                onClick={() => setActiveTab('kanban')}
                className={`px-2.5 py-1 rounded transition-colors ${
                  activeTab === 'kanban'
                    ? 'bg-[var(--color-accent)] text-black font-semibold shadow-sm'
                    : 'text-[var(--color-text-dim)] hover:text-white hover:bg-white/10'
                }`}
              >
                📌 Kanban
              </button>
            )}
            {blueprint.actions && blueprint.actions.length > 0 && (
              <button
                onClick={() => setActiveTab('actions')}
                className={`px-2.5 py-1 rounded transition-colors ${
                  activeTab === 'actions'
                    ? 'bg-[var(--color-accent)] text-black font-semibold shadow-sm'
                    : 'text-[var(--color-text-dim)] hover:text-white hover:bg-white/10'
                }`}
              >
                ⚡ Actions N6
              </button>
            )}
          </div>

          <button
            onClick={toggleCms}
            title="Inspecter dans le CMS Hiérarchique V2"
            className="px-2.5 py-1 rounded-lg bg-white/5 border border-white/10 text-xs text-[var(--color-accent)] hover:bg-white/10 transition-colors flex items-center gap-1 font-mono ml-2"
          >
            🗂️ CMS
          </button>
        </div>
      </div>

      {/* Corps des vues */}
      <div className="flex-1 overflow-y-auto p-4 scrollbar">
        {activeTab === 'overview' && (
          <div className="flex flex-col gap-5">
            {/* Grille des KPIs */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              {blueprint.kpis.map((kpi) => (
                <MetricCard key={kpi.id} kpi={kpi} />
              ))}
            </div>

            {/* Aperçu des tables ou kanban */}
            {blueprint.columns && blueprint.dataset && (
              <div className="flex flex-col gap-2">
                <DataGrid
                  title={blueprint.dataTitle ?? 'Registre Opérationnel'}
                  columns={blueprint.columns}
                  dataset={blueprint.dataset}
                />
              </div>
            )}
          </div>
        )}

        {activeTab === 'data' && blueprint.columns && blueprint.dataset && (
          <DataGrid
            title={blueprint.dataTitle ?? 'Registre Détaillé'}
            columns={blueprint.columns}
            dataset={blueprint.dataset}
          />
        )}

        {activeTab === 'kanban' && blueprint.kanbanColumns && blueprint.kanbanCards && (
          <KanbanBoard
            columns={blueprint.kanbanColumns}
            initialCards={blueprint.kanbanCards}
          />
        )}

        {activeTab === 'actions' && blueprint.actions && (
          <ActionConsole actions={blueprint.actions} />
        )}
      </div>
    </div>
  );
}
