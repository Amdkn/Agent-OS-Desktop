import React, { useState, useEffect, useRef } from 'react';
import { useWindowNav } from './WindowNavContext';

export interface AppSection {
  id: string;
  label: string;
  icon?: string;
  badge?: string | number;
  render: (helpers: { navigateToSection: (id: string) => void }) => React.ReactNode;
}

export interface AppToolDef {
  id: string;
  name: string;
  description: string;
  status: 'idle' | 'running' | 'awaiting' | 'error';
  icon?: string;
  onRun?: () => void;
}

interface AppLayoutProps {
  appId: string;
  title: string;
  subtitle?: string;
  icon?: string;
  accent?: string;
  sections: AppSection[];
  groups?: Record<string, string>;
  tools?: AppToolDef[];
}

export function AppLayout({
  title,
  subtitle,
  icon,
  accent = 'var(--theme-accent, #06b6d4)',
  sections,
  groups,
  tools,
}: AppLayoutProps) {
  const [activeId, setActiveId] = useState(sections[0]?.id || '');
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [toolsOpen, setToolsOpen] = useState(false);
  const nav = useWindowNav();
  const rootRef = useRef<HTMLDivElement>(null);

  const activeSection = sections.find((s) => s.id === activeId) ?? sections[0];

  // Synchroniser avec les breadcrumbs de la fenêtre
  useEffect(() => {
    if (nav && activeSection) {
      nav.navigateTo(activeSection.label);
    }
  }, [activeSection?.id, activeSection?.label, nav]);

  // Responsive: replier la sidebar si la fenêtre devient étroite (< 640px)
  useEffect(() => {
    if (!rootRef.current) return;
    const observer = new ResizeObserver((entries) => {
      for (const entry of entries) {
        if (entry.contentRect.width < 600) {
          setSidebarCollapsed(true);
        }
      }
    });
    observer.observe(rootRef.current);
    return () => observer.disconnect();
  }, []);

  const navigateToSection = (nextId: string) => {
    setActiveId(nextId);
    if (nav) {
      const sec = sections.find((s) => s.id === nextId);
      if (sec) nav.navigateTo(sec.label);
    }
  };

  return (
    <div ref={rootRef} className="flex h-full w-full bg-[var(--theme-bg,#0a0a0f)] text-[var(--theme-text,#ffffff)] overflow-hidden font-sans select-none">
      {/* Sidebar */}
      <aside
        className={`flex flex-col shrink-0 border-r border-white/10 bg-[var(--theme-canvas,#050508)] transition-all duration-200 ${
          sidebarCollapsed ? 'w-14' : 'w-56'
        }`}
      >
        {/* Sidebar Header */}
        <div className="h-12 border-b border-white/10 px-3 flex items-center justify-between">
          {!sidebarCollapsed && (
            <div className="flex items-center gap-2 min-w-0">
              {icon && <span className="text-lg shrink-0">{icon}</span>}
              <div className="truncate">
                <div className="text-xs font-bold truncate leading-tight">{title}</div>
                {subtitle && <div className="text-[10px] text-white/40 truncate">{subtitle}</div>}
              </div>
            </div>
          )}
          {sidebarCollapsed && icon && (
            <div className="mx-auto text-lg">{icon}</div>
          )}
          <button
            type="button"
            onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
            className="p-1 rounded hover:bg-white/10 text-white/40 hover:text-white transition-colors"
            title={sidebarCollapsed ? 'Déplier le menu' : 'Replier le menu'}
          >
            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              {sidebarCollapsed ? (
                <path d="M9 18l6-6-6-6" />
              ) : (
                <path d="M15 18l-6-6 6-6" />
              )}
            </svg>
          </button>
        </div>

        {/* Navigation Sections */}
        <nav className="flex-1 overflow-y-auto p-2 space-y-1">
          {sections.map((sec) => {
            const isActive = sec.id === activeId;
            const groupHeader = groups?.[sec.id];
            return (
              <div key={sec.id}>
                {groupHeader && !sidebarCollapsed && (
                  <div className="text-[9px] font-bold uppercase tracking-wider text-white/30 px-2.5 pt-3 pb-1">
                    {groupHeader}
                  </div>
                )}
                <button
                  type="button"
                  onClick={() => navigateToSection(sec.id)}
                  title={sec.label}
                  className={`w-full flex items-center gap-2.5 px-2.5 py-1.5 rounded-lg text-xs font-medium transition-all text-left ${
                    isActive
                      ? 'bg-white/15 text-white shadow-sm'
                      : 'text-white/60 hover:text-white hover:bg-white/5'
                  }`}
                  style={{
                    borderLeft: isActive ? `3px solid ${accent}` : '3px solid transparent',
                  }}
                >
                  <span className="text-sm shrink-0">{sec.icon || '📄'}</span>
                  {!sidebarCollapsed && (
                    <span className="truncate flex-1">{sec.label}</span>
                  )}
                  {!sidebarCollapsed && sec.badge !== undefined && (
                    <span className="text-[9px] px-1.5 py-0.2 rounded-full bg-white/10 text-white/70">
                      {sec.badge}
                    </span>
                  )}
                </button>
              </div>
            );
          })}
        </nav>

        {/* Footer info */}
        {tools && tools.length > 0 && !sidebarCollapsed && (
          <div className="p-2 border-t border-white/10">
            <button
              type="button"
              onClick={() => setToolsOpen(!toolsOpen)}
              className="w-full flex items-center justify-between px-2.5 py-1.5 rounded text-[11px] font-semibold text-white/50 hover:text-white hover:bg-white/5"
            >
              <span className="flex items-center gap-1.5">
                <span>🤖</span>
                <span>Assistants ({tools.length})</span>
              </span>
              <span>{toolsOpen ? '▾' : '▸'}</span>
            </button>
          </div>
        )}
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col min-w-0 bg-[var(--theme-surface,#0f0f18)] overflow-hidden">
        {/* Content Header bar */}
        <header className="h-10 border-b border-white/10 px-4 flex items-center justify-between shrink-0 bg-white/[0.02]">
          <div className="flex items-center gap-2 text-xs font-semibold">
            <span className="text-white/40">{title}</span>
            <span className="text-white/20">/</span>
            <span style={{ color: accent }}>{activeSection?.label}</span>
          </div>
          {tools && tools.length > 0 && (
            <button
              type="button"
              onClick={() => setToolsOpen(!toolsOpen)}
              className={`px-2 py-0.5 rounded text-[11px] flex items-center gap-1 transition-all ${
                toolsOpen ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40' : 'text-white/40 hover:text-white hover:bg-white/5'
              }`}
            >
              <span>⚡</span>
              <span>Tools</span>
            </button>
          )}
        </header>

        {/* Active View Container */}
        <div className="flex-1 overflow-auto p-4 sm:p-6">
          {activeSection ? (
            activeSection.render({ navigateToSection })
          ) : (
            <div className="p-8 text-center text-white/40 text-xs">Section introuvable</div>
          )}
        </div>
      </main>

      {/* Optional AI Assistant Tools Panel (Monica/Sider style) */}
      {tools && tools.length > 0 && toolsOpen && (
        <aside className="w-64 shrink-0 border-l border-white/10 bg-[var(--theme-canvas,#050508)] flex flex-col animate-in slide-in-from-right duration-150">
          <div className="h-10 border-b border-white/10 px-3 flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-white/60">
              AI Tools & Actions
            </span>
            <button
              type="button"
              onClick={() => setToolsOpen(false)}
              className="text-white/40 hover:text-white text-xs p-1"
            >
              ✕
            </button>
          </div>
          <div className="flex-1 overflow-y-auto p-3 space-y-3">
            {tools.map((t) => (
              <div
                key={t.id}
                className="p-3 rounded-xl border border-white/10 bg-white/5 space-y-2 hover:border-white/20 transition-all"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5 font-bold text-xs">
                    <span>{t.icon || '⚡'}</span>
                    <span>{t.name}</span>
                  </div>
                  <span
                    className={`w-2 h-2 rounded-full ${
                      t.status === 'running'
                        ? 'bg-amber-400 animate-pulse'
                        : t.status === 'error'
                          ? 'bg-rose-400'
                          : 'bg-emerald-400'
                    }`}
                  />
                </div>
                <p className="text-[10px] text-white/50 leading-snug">{t.description}</p>
                <button
                  type="button"
                  onClick={() => t.onRun?.()}
                  className="w-full py-1 px-2 rounded-lg bg-white/10 hover:bg-white/20 text-xs font-semibold text-white transition-all text-center cursor-pointer active:scale-95"
                >
                  Exécuter
                </button>
              </div>
            ))}
          </div>
        </aside>
      )}
    </div>
  );
}
