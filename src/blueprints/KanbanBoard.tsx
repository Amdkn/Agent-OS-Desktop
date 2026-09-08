import { useState } from 'react';
import type { BlueprintKanbanColumn, BlueprintKanbanCard } from './types';

interface KanbanBoardProps {
  columns: BlueprintKanbanColumn[];
  initialCards: BlueprintKanbanCard[];
  onCardMove?: (cardId: string, newColId: string) => void;
}

const PRIORITY_BADGES: Record<string, string> = {
  critical: 'bg-rose-500/20 text-rose-300 border-rose-500/40',
  high: 'bg-amber-500/20 text-amber-300 border-amber-500/40',
  medium: 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40',
  low: 'bg-slate-500/20 text-slate-300 border-slate-500/40',
};

export function KanbanBoard({ columns, initialCards, onCardMove }: KanbanBoardProps) {
  const [cards, setCards] = useState<BlueprintKanbanCard[]>(initialCards);

  const moveCard = (cardId: string, direction: 'prev' | 'next') => {
    setCards((prev) =>
      prev.map((c) => {
        if (c.id !== cardId) return c;
        const currentIdx = columns.findIndex((col) => col.id === c.columnId);
        if (currentIdx === -1) return c;
        const nextIdx = direction === 'next' ? currentIdx + 1 : currentIdx - 1;
        if (nextIdx < 0 || nextIdx >= columns.length) return c;
        const nextCol = columns[nextIdx].id;
        if (onCardMove) onCardMove(cardId, nextCol);
        return { ...c, columnId: nextCol };
      })
    );
  };

  return (
    <div className="flex gap-3 overflow-x-auto pb-2 scrollbar">
      {columns.map((col, colIdx) => {
        const colCards = cards.filter((c) => c.columnId === col.id);
        return (
          <div
            key={col.id}
            className="flex-1 min-w-[240px] max-w-[320px] rounded-xl border border-white/10 bg-slate-900/50 backdrop-blur-md flex flex-col p-3 shadow-md"
          >
            {/* Header colonne */}
            <div className="flex items-center justify-between pb-2 mb-2 border-b border-white/10">
              <span className="text-xs font-semibold text-[var(--color-text)] uppercase tracking-wider font-mono">
                {col.title}
              </span>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-white/10 text-[var(--color-accent)]">
                {colCards.length}
              </span>
            </div>

            {/* Liste des cartes */}
            <div className="flex flex-col gap-2 overflow-y-auto max-h-[380px] scrollbar pr-1">
              {colCards.length === 0 ? (
                <div className="text-center py-8 text-[11px] text-[var(--color-text-dim)] border border-dashed border-white/5 rounded-lg">
                  Aucune tâche
                </div>
              ) : (
                colCards.map((card) => (
                  <div
                    key={card.id}
                    className="p-3 rounded-lg border border-white/10 bg-black/40 hover:border-[var(--color-accent)]/40 transition-all flex flex-col gap-2 shadow-sm"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <span className="text-xs font-medium text-slate-200 leading-snug">
                        {card.title}
                      </span>
                      {card.priority && (
                        <span
                          className={`text-[9px] font-mono px-1.5 py-0.5 rounded border uppercase shrink-0 ${
                            PRIORITY_BADGES[card.priority] ?? 'border-white/10 text-slate-300'
                          }`}
                        >
                          {card.priority}
                        </span>
                      )}
                    </div>

                    {card.description && (
                      <p className="text-[11px] text-[var(--color-text-dim)] line-clamp-2">
                        {card.description}
                      </p>
                    )}

                    {card.tags && card.tags.length > 0 && (
                      <div className="flex flex-wrap gap-1">
                        {card.tags.map((t) => (
                          <span
                            key={t}
                            className="text-[9px] font-mono px-1 py-0.5 rounded bg-white/5 text-slate-400"
                          >
                            #{t}
                          </span>
                        ))}
                      </div>
                    )}

                    {/* Footer carte & déplacement */}
                    <div className="flex items-center justify-between pt-1 border-t border-white/5 text-[10px] font-mono text-[var(--color-text-dim)]">
                      <span>{card.assignee ?? 'Agent'}</span>
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => moveCard(card.id, 'prev')}
                          disabled={colIdx === 0}
                          title="Reculer"
                          className="px-1.5 py-0.5 rounded bg-white/5 hover:bg-white/15 disabled:opacity-20"
                        >
                          ◀
                        </button>
                        <button
                          onClick={() => moveCard(card.id, 'next')}
                          disabled={colIdx === columns.length - 1}
                          title="Avancer"
                          className="px-1.5 py-0.5 rounded bg-white/5 hover:bg-white/15 disabled:opacity-20"
                        >
                          ▶
                        </button>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
