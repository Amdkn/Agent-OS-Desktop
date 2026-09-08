import React from 'react';

interface BreadcrumbsProps {
  appTitle: string;
  activePage?: string;
  detailLabel?: string | null;
  onBackToActivePage?: () => void;
}

export function Breadcrumbs({
  appTitle,
  activePage = 'Overview',
  detailLabel = null,
  onBackToActivePage,
}: BreadcrumbsProps): React.ReactNode {
  const path = detailLabel ? [appTitle, activePage, detailLabel] : [appTitle, activePage];
  const sectionIndex = path.length - 2;

  return (
    <div className="flex items-center gap-1.5 h-full select-none overflow-hidden text-xs">
      <button
        type="button"
        onClick={() => onBackToActivePage?.()}
        disabled={!onBackToActivePage}
        aria-label="Back to list"
        className="p-1 rounded-md text-white/50 hover:bg-white/10 hover:text-white transition-all active:scale-90 disabled:opacity-30 disabled:cursor-default disabled:hover:bg-transparent"
        title={onBackToActivePage ? 'Retour' : undefined}
      >
        <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M19 12H5M12 19l-7-7 7-7" />
        </svg>
      </button>

      <div className="w-px h-3 bg-white/15 mx-1 shrink-0" />

      <nav className="flex items-center gap-1.5 overflow-x-auto no-scrollbar whitespace-nowrap">
        {path.map((segment, i) => {
          const isLast = i === path.length - 1;
          const isClickableSection = i === sectionIndex && !!detailLabel && !!onBackToActivePage;
          return (
            <div key={i} className="flex items-center gap-1.5 shrink-0">
              {i > 0 && (
                <svg className="w-3 h-3 text-white/30" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M9 18l6-6-6-6" />
                </svg>
              )}
              <button
                type="button"
                onClick={() => {
                  if (isClickableSection) onBackToActivePage?.();
                }}
                disabled={isLast || !isClickableSection}
                className={`text-[10px] font-semibold uppercase tracking-wider transition-all duration-200 ${
                  isLast
                    ? 'text-[var(--theme-accent,#06b6d4)] cursor-default'
                    : isClickableSection
                      ? 'text-white/60 hover:text-white cursor-pointer hover:bg-white/10 px-1.5 py-0.5 rounded-md'
                      : 'text-white/60 cursor-default'
                }`}
              >
                {segment}
              </button>
            </div>
          );
        })}
      </nav>
    </div>
  );
}
