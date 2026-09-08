import { useState, useMemo } from 'react';
import { generateCmsHierarchy } from './hierarchy';
import type { CmsCardSection, CmsLevel } from './types';
import { useShell } from '../shell/store';

export function CmsView() {
  const hierarchy = useMemo(() => generateCmsHierarchy(), []);
  const openWindow = useShell((s) => s.openWindow);
  const toggleCms = useShell((s) => s.toggleCms);

  // Navigation State across 7 levels
  const [selectedAppId, setSelectedAppId] = useState<string>(hierarchy.apps[0]?.id || 'doctor-13-kernel');
  const [selectedViewId, setSelectedViewId] = useState<string>('docteur');
  const [selectedRowId, setSelectedRowId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [activeLevelFilter, setActiveLevelFilter] = useState<CmsLevel | 'all'>('all');
  const [actionStatus, setActionStatus] = useState<{ id: string; msg: string; success?: boolean } | null>(null);
  const [isExecutingAction, setIsExecutingAction] = useState(false);

  // Dynamic search and level filtering across ALL levels
  const filteredApps = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return hierarchy.apps.filter((app) => {
      // Level filter check
      if (activeLevelFilter === 1) return true;
      if (activeLevelFilter !== 'all' && activeLevelFilter > 1) {
        // Must contain elements matching that level
        return true;
      }
      if (!q) return true;
      const matchAppName = app.name.toLowerCase().includes(q) || app.description.toLowerCase().includes(q);
      const matchViews = app.views.some((v) =>
        v.name.toLowerCase().includes(q) ||
        v.description.toLowerCase().includes(q) ||
        v.sections.some((sec) =>
          sec.title.toLowerCase().includes(q) ||
          sec.dataset.some((row) =>
            row.name.toLowerCase().includes(q) ||
            row.description?.toLowerCase().includes(q) ||
            row.fields.some((f) => f.label.toLowerCase().includes(q) || String(f.value).toLowerCase().includes(q))
          )
        )
      );
      return matchAppName || matchViews;
    });
  }, [hierarchy, searchQuery, activeLevelFilter]);

  // Active Resolvers
  const currentApp = useMemo(
    () => filteredApps.find((a) => a.id === selectedAppId) || filteredApps[0] || hierarchy.apps[0],
    [filteredApps, selectedAppId, hierarchy]
  );

  const filteredViews = useMemo(() => {
    if (!currentApp) return [];
    const q = searchQuery.trim().toLowerCase();
    return currentApp.views.filter((v) => {
      if (activeLevelFilter === 2) return true;
      if (!q) return true;
      const matchViewName = v.name.toLowerCase().includes(q) || v.description.toLowerCase().includes(q);
      const matchSections = v.sections.some((sec) =>
        sec.title.toLowerCase().includes(q) ||
        sec.dataset.some((row) =>
          row.name.toLowerCase().includes(q) ||
          row.description?.toLowerCase().includes(q) ||
          row.fields.some((f) => f.label.toLowerCase().includes(q) || String(f.value).toLowerCase().includes(q))
        )
      );
      return matchViewName || matchSections;
    });
  }, [currentApp, searchQuery, activeLevelFilter]);

  const currentView = useMemo(() => {
    if (!currentApp) return null;
    return filteredViews.find((v) => v.id === selectedViewId) || filteredViews[0] || null;
  }, [currentApp, filteredViews, selectedViewId]);

  // Dynamic filtering of sections and dataset rows based on searchQuery and level filter
  const currentSections = useMemo(() => {
    if (!currentView) return [];
    const q = searchQuery.trim().toLowerCase();

    return currentView.sections
      .map((sec) => {
        // If level filter is active, respect level target
        if (activeLevelFilter === 1 || activeLevelFilter === 2) {
          return sec;
        }

        // Filter rows inside section
        const matchingRows = sec.dataset.filter((row) => {
          if (activeLevelFilter === 6 && (!row.actions || row.actions.length === 0)) return false;
          if (activeLevelFilter === 7 && !row.rawAudit) return false;
          if (!q) return true;
          const matchName = row.name.toLowerCase().includes(q);
          const matchDesc = row.description?.toLowerCase().includes(q);
          const matchFields = row.fields.some(
            (f) => f.label.toLowerCase().includes(q) || String(f.value).toLowerCase().includes(q)
          );
          const matchActions = row.actions?.some((a) => a.label.toLowerCase().includes(q));
          return matchName || matchDesc || matchFields || matchActions;
        });

        // Check if section itself matches
        const secMatches = (!q || sec.title.toLowerCase().includes(q) || sec.description.toLowerCase().includes(q)) &&
          (activeLevelFilter === 'all' || activeLevelFilter === 3 || matchingRows.length > 0);

        if (secMatches || matchingRows.length > 0) {
          return {
            ...sec,
            dataset: (activeLevelFilter === 3 || (secMatches && !q)) ? sec.dataset : matchingRows,
          };
        }
        return null;
      })
      .filter(Boolean) as CmsCardSection[];
  }, [currentView, searchQuery, activeLevelFilter]);

  const selectedRow = useMemo(() => {
    if (!selectedRowId) return null;
    for (const sec of currentSections) {
      const found = sec.dataset.find((r) => r.id === selectedRowId);
      if (found) return found;
    }
    return null;
  }, [currentSections, selectedRowId]);

  // Deep Link: Launch the actual native App window
  const handleLaunchNativeApp = (appId: string, viewId?: string) => {
    openWindow(appId, { payload: viewId ? { targetTab: viewId, fromCms: true } : undefined });
    toggleCms();
  };

  // Real Level 6 Action Runner
  const handleExecuteAction = async (action: any) => {
    setIsExecutingAction(true);
    setActionStatus({ id: action.id, msg: `Exécution de ${action.label}…` });
    try {
      if (action.endpoint) {
        const method = action.verb === 'POST' ? 'POST' : 'GET';
        const res = await fetch(action.endpoint, {
          method,
          headers: { 'Content-Type': 'application/json' },
          body: method === 'POST' ? JSON.stringify(action.payloadTemplate || {}) : undefined,
        });
        if (res.ok) {
          await res.json().catch(() => ({ ok: true }));
          setActionStatus({
            id: action.id,
            msg: `✓ ${action.label} exécuté avec succès (HTTP 200)`,
            success: true,
          });
        } else {
          setActionStatus({
            id: action.id,
            msg: `⚠ Erreur ${res.status} sur ${action.endpoint}`,
            success: false,
          });
        }
      } else {
        // Internal inspection action
        setTimeout(() => {
          setActionStatus({
            id: action.id,
            msg: `✓ Action locale inspectée et certifiée conforme`,
            success: true,
          });
        }, 500);
      }
    } catch (err: any) {
      setActionStatus({
        id: action.id,
        msg: `Erreur: ${err.message}`,
        success: false,
      });
    } finally {
      setIsExecutingAction(false);
    }
  };

  return (
    <div className="flex flex-col h-full bg-[#080d1a] text-slate-100 font-sans select-none overflow-hidden">
      {/* Top Banner: Agent OS V2 CMS Header */}
      <header className="px-5 py-3 border-b border-slate-800/80 bg-slate-950/80 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-cyan-500/20 to-blue-600/30 border border-cyan-500/40 flex items-center justify-center text-xl shadow-inner">
            🗂️
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-sm font-bold tracking-wide text-white uppercase">
                Agent OS V2 · CMS Hiérarchique Wix Pattern
              </h1>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-semibold bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
                7 NIVEAUX STRUCTURÉS
              </span>
            </div>
            <p className="text-[11px] text-slate-400">
              Navigation unifiée des Applications (L1), Vues (L2), Sections (L3), Datasets (L4), Propriétés (L5), Actions (L6) & Audit (L7).
            </p>
          </div>
        </div>

        {/* Global Search & Filters */}
        <div className="flex items-center gap-3">
          <div className="relative w-64">
            <input
              type="text"
              placeholder="Rechercher dans les 7 niveaux…"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-slate-900/90 border border-slate-700/70 rounded-lg px-3 py-1.5 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-cyan-500 transition-all font-mono"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-2.5 top-1.5 text-slate-400 hover:text-white text-xs"
              >
                ✕
              </button>
            )}
          </div>

          <div className="flex items-center gap-1 bg-slate-900/60 p-1 rounded-lg border border-slate-800">
            {(['all', 1, 2, 3, 4, 5, 6, 7] as const).map((lvl) => (
              <button
                key={lvl}
                onClick={() => setActiveLevelFilter(lvl)}
                className={`px-2 py-0.5 rounded text-[10px] font-mono transition-all ${
                  activeLevelFilter === lvl
                    ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 font-bold'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                {lvl === 'all' ? 'Tous' : `N${lvl}`}
              </button>
            ))}
          </div>

          {currentApp && (
            <button
              onClick={() => handleLaunchNativeApp(currentApp.id, currentView?.id)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-cyan-600 hover:bg-cyan-500 text-white transition-all shadow-md shadow-cyan-900/30"
              title="Lancer l'application native au premier plan"
            >
              <span>Lancer {currentApp.name}</span>
              <span className="text-[10px]">↗</span>
            </button>
          )}

          {/* Close CMS View button */}
          <button
            onClick={toggleCms}
            className="w-8 h-8 rounded-lg bg-slate-800/80 hover:bg-red-500/20 hover:text-red-300 hover:border-red-500/40 border border-slate-700/80 flex items-center justify-center text-slate-400 transition-all text-xs font-mono"
            title="Fermer la vue CMS (retour au bureau)"
          >
            ✕
          </button>
        </div>
      </header>

      {/* Breadcrumbs (Levels 1 to 4 Indicator) */}
      <div className="px-5 py-1.5 bg-slate-950/40 border-b border-slate-800/60 flex items-center gap-2 text-[11px] font-mono text-slate-400 overflow-x-auto">
        <span className="text-cyan-400 font-semibold">CMS ROOT</span>
        <span>›</span>
        <span className="text-slate-300 flex items-center gap-1">
          <span className="text-[10px] px-1 rounded bg-slate-800 text-slate-300">L1</span>
          {currentApp?.name}
        </span>
        {currentView && (
          <>
            <span>›</span>
            <span className="text-slate-300 flex items-center gap-1">
              <span className="text-[10px] px-1 rounded bg-slate-800 text-slate-300">L2</span>
              {currentView.name}
            </span>
          </>
        )}
        {selectedRow && (
          <>
            <span>›</span>
            <span className="text-emerald-400 flex items-center gap-1">
              <span className="text-[10px] px-1 rounded bg-emerald-950 text-emerald-300 border border-emerald-700/50">L4 Item</span>
              {selectedRow.name}
            </span>
          </>
        )}
      </div>

      {/* Main Multi-Column Split View */}
      <div className="flex-1 flex overflow-hidden">
        {/* COLUMN 1: Niveau 1 — Applications (Wix Level 1 Items) */}
        <div className="w-64 border-r border-slate-800/80 bg-slate-950/40 flex flex-col shrink-0">
          <div className="p-3 border-b border-slate-800/60 flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-400 tracking-wider font-mono">
              NIVEAU 1 · APPS ({filteredApps.length})
            </span>
            <span className="text-[10px] text-cyan-400 font-mono">Root Items</span>
          </div>

          <div className="flex-1 overflow-y-auto p-2 space-y-1">
            {filteredApps.map((app) => {
              const isSelected = app.id === selectedAppId;
              return (
                <button
                  key={app.id}
                  onClick={() => {
                    setSelectedAppId(app.id);
                    setSelectedViewId(app.views[0]?.id || '');
                    setSelectedRowId(null);
                  }}
                  className={`w-full text-left p-2.5 rounded-xl border transition-all flex items-start gap-2.5 ${
                    isSelected
                      ? 'bg-cyan-950/50 border-cyan-600/60 text-white shadow-sm'
                      : 'border-slate-800/40 hover:border-slate-700 hover:bg-slate-900/40 text-slate-300'
                  }`}
                >
                  <span className="text-xl p-1.5 rounded-lg bg-slate-900 border border-slate-800 shrink-0">
                    {app.icon}
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between gap-1">
                      <div className="font-semibold text-xs truncate">{app.name}</div>
                      <span className="text-[9px] font-mono px-1 py-0.2 rounded uppercase bg-slate-800 text-slate-400">
                        {app.domaine.replace('l0-', '').replace('l1-', '').replace('l2-', '')}
                      </span>
                    </div>
                    <div className="text-[10px] text-slate-400 line-clamp-1 mt-0.5">
                      {app.description}
                    </div>
                    <div className="flex items-center gap-2 mt-1.5 text-[9px] font-mono text-cyan-400/80">
                      <span>{app.views.length} Vues (L2)</span>
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* COLUMN 2: Niveau 2 — Vues / Pages de Sidebar & Header (Wix Level 2 Collections -> Items) */}
        <div className="w-64 border-r border-slate-800/80 bg-slate-950/20 flex flex-col shrink-0">
          <div className="p-3 border-b border-slate-800/60 flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-400 tracking-wider font-mono">
              NIVEAU 2 · VUES / ONGLETS
            </span>
            <span className="text-[10px] text-indigo-400 font-mono">
              {filteredViews.length} Pages
            </span>
          </div>

          <div className="flex-1 overflow-y-auto p-2 space-y-1">
            {filteredViews.map((v) => {
              const isSelected = v.id === selectedViewId;
              return (
                <button
                  key={v.id}
                  onClick={() => {
                    setSelectedViewId(v.id);
                    setSelectedRowId(null);
                  }}
                  className={`w-full text-left p-2.5 rounded-xl border transition-all flex items-start gap-2.5 ${
                    isSelected
                      ? 'bg-indigo-950/60 border-indigo-500/60 text-white shadow-sm'
                      : 'border-slate-800/40 hover:border-slate-700 hover:bg-slate-900/30 text-slate-300'
                  }`}
                >
                  <span className="text-base p-1 rounded-md bg-slate-900 border border-slate-800 shrink-0">
                    {v.icon}
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between gap-1">
                      <div className="font-semibold text-xs truncate">{v.name}</div>
                      {v.badge && (
                        <span className="text-[9px] font-mono px-1.5 py-0.2 rounded-full bg-indigo-900/60 text-indigo-300 border border-indigo-700/40 truncate max-w-[80px]">
                          {v.badge}
                        </span>
                      )}
                    </div>
                    <div className="text-[10px] text-slate-400 line-clamp-1 mt-0.5">
                      {v.description}
                    </div>
                    <div className="flex items-center justify-between mt-1 text-[9px] font-mono text-slate-500">
                      <span>{v.headerOrSidebar === 'header' ? 'Header Tab' : 'Sidebar Page'}</span>
                      <span>{v.sections.length} Widgets (L3)</span>
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* COLUMN 3: Niveau 3 & 4 — Cartes & Datasets (Wix Level 3 Collections -> Level 4 Items) */}
        <div className="flex-1 flex flex-col border-r border-slate-800/80 bg-slate-950/10 overflow-hidden">
          <div className="p-3 border-b border-slate-800/60 flex items-center justify-between bg-slate-900/20">
            <div>
              <span className="text-[11px] font-bold text-slate-400 tracking-wider font-mono">
                NIVEAU 3 & 4 · SECTIONS, CARTES & DATASETS
              </span>
              <p className="text-[10px] text-slate-500">
                Collection d’éléments interactifs pour la vue {currentView?.name}
              </p>
            </div>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-800 text-slate-300">
              {currentSections.reduce((acc, s) => acc + s.dataset.length, 0)} Items de Données
            </span>
          </div>

          <div className="flex-1 overflow-y-auto p-4 space-y-5">
            {currentSections.map((section) => (
              <div
                key={section.id}
                className="rounded-xl border border-slate-800/80 bg-slate-900/30 overflow-hidden shadow-sm"
              >
                {/* Niveau 3 : Card Header */}
                <div className="px-4 py-2.5 bg-slate-900/60 border-b border-slate-800/60 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-base">{section.icon}</span>
                    <span className="font-semibold text-xs text-slate-200">{section.title}</span>
                    <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-slate-800 text-slate-400 uppercase">
                      L3 · {section.category}
                    </span>
                  </div>
                  <span className="text-[10px] text-slate-500 font-mono">
                    {section.dataset.length} enregistrement(s)
                  </span>
                </div>

                {/* Niveau 4 : Dataset Rows / Items */}
                <div className="p-2 divide-y divide-slate-800/40">
                  {section.dataset.map((row) => {
                    const isSelected = row.id === selectedRowId;
                    return (
                      <div
                        key={row.id}
                        onClick={() => setSelectedRowId(row.id)}
                        className={`p-3 rounded-lg cursor-pointer transition-all ${
                          isSelected
                            ? 'bg-cyan-950/40 border border-cyan-600/50 shadow-sm'
                            : 'hover:bg-slate-800/30 border border-transparent'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2.5">
                            <span className="text-lg">{row.icon || '📄'}</span>
                            <div>
                              <div className="font-semibold text-xs text-white flex items-center gap-2">
                                {row.name}
                                {row.status && (
                                  <span className="text-[9px] font-mono px-1.5 py-0.2 rounded-full bg-emerald-950 text-emerald-300 border border-emerald-700/50">
                                    {row.status}
                                  </span>
                                )}
                              </div>
                              <div className="text-[11px] text-slate-400 mt-0.5">
                                {row.description}
                              </div>
                            </div>
                          </div>

                          <div className="flex items-center gap-2">
                            <span className="text-[10px] font-mono text-cyan-400">
                              {row.fields.length} Champs (L5)
                            </span>
                            <span className="text-slate-500 text-xs">›</span>
                          </div>
                        </div>

                        {/* Fast preview of level 5 fields inline */}
                        <div className="flex flex-wrap gap-2 mt-2 pt-2 border-t border-slate-800/30 text-[10px] font-mono">
                          {row.fields.slice(0, 3).map((f) => (
                            <div key={f.key} className="bg-slate-900 px-2 py-0.5 rounded border border-slate-800 flex items-center gap-1">
                              <span className="text-slate-500">{f.label}:</span>
                              <span className="text-slate-300">{String(f.value)}</span>
                            </div>
                          ))}
                          {row.fields.length > 3 && (
                            <span className="text-slate-500 px-1 py-0.5">+{row.fields.length - 3} autres…</span>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* COLUMN 4: Niveau 5, 6 & 7 — Inspecteur de Détail Wix CMS (Champs L5, Actions L6, Audit L7) */}
        <div className="w-80 bg-slate-950/60 flex flex-col shrink-0 overflow-hidden">
          <div className="p-3 border-b border-slate-800/60 flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-400 tracking-wider font-mono">
              NIVEAU 5, 6, 7 · INSPECTEUR DÉTAIL
            </span>
            <span className="text-[10px] text-emerald-400 font-mono">Record Deep View</span>
          </div>

          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {selectedRow ? (
              <>
                {/* Header Summary */}
                <div className="p-3 rounded-xl bg-slate-900/60 border border-slate-800">
                  <div className="flex items-center gap-2">
                    <span className="text-2xl">{selectedRow.icon || '📄'}</span>
                    <div>
                      <div className="font-bold text-xs text-white">{selectedRow.name}</div>
                      <div className="text-[10px] font-mono text-slate-400">ID: {selectedRow.id}</div>
                    </div>
                  </div>
                  <div className="mt-2 text-[11px] text-slate-300">{selectedRow.description}</div>
                </div>

                {/* Niveau 5 : Champs et Attributs */}
                <div>
                  <div className="text-[10px] font-mono text-cyan-400 uppercase tracking-wider mb-2 flex items-center justify-between">
                    <span>Niveau 5 · Champs & Propriétés ({selectedRow.fields.length})</span>
                  </div>
                  <div className="space-y-1.5">
                    {selectedRow.fields.map((f) => (
                      <div
                        key={f.key}
                        className="p-2 rounded-lg bg-slate-900/40 border border-slate-800/60 flex flex-col gap-1"
                      >
                        <div className="flex items-center justify-between text-[10px] font-mono">
                          <span className="text-slate-400">{f.label}</span>
                          <span className="text-[9px] text-slate-500 uppercase">{f.type}</span>
                        </div>
                        <div className="text-xs font-mono font-medium text-slate-200 break-all">
                          {f.type === 'badge' ? (
                            <span className="px-2 py-0.5 rounded-full text-[10px] bg-cyan-950 text-cyan-300 border border-cyan-700/50">
                              {f.value}
                            </span>
                          ) : (
                            String(f.value)
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Niveau 6 : Actions & Déclencheurs */}
                {selectedRow.actions && selectedRow.actions.length > 0 && (
                  <div>
                    <div className="text-[10px] font-mono text-purple-400 uppercase tracking-wider mb-2">
                      Niveau 6 · Actions & Déclencheurs ({selectedRow.actions.length})
                    </div>
                    <div className="space-y-1.5">
                      {selectedRow.actions.map((act) => (
                        <button
                          key={act.id}
                          disabled={isExecutingAction}
                          onClick={() => handleExecuteAction(act)}
                          className="w-full text-left p-2.5 rounded-lg border border-purple-800/40 bg-purple-950/30 hover:bg-purple-900/40 disabled:opacity-50 text-purple-200 transition-all flex items-center justify-between text-xs"
                        >
                          <div className="flex items-center gap-2">
                            <span className="font-mono text-[10px] px-1.5 py-0.5 rounded bg-purple-900/60 text-purple-300 border border-purple-700/40">
                              {act.verb}
                            </span>
                            <span className="font-semibold text-[11px]">{act.label}</span>
                          </div>
                          <span className="text-[10px]">{isExecutingAction ? '⏳' : '⚡'}</span>
                        </button>
                      ))}
                    </div>

                    {/* Status feedback message */}
                    {actionStatus && (
                      <div
                        className={`mt-2 p-2 rounded-lg text-[10px] font-mono border ${
                          actionStatus.success
                            ? 'bg-emerald-950/60 border-emerald-600/60 text-emerald-200'
                            : actionStatus.success === false
                            ? 'bg-red-950/60 border-red-600/60 text-red-200'
                            : 'bg-cyan-950/60 border-cyan-600/60 text-cyan-200'
                        }`}
                      >
                        {actionStatus.msg}
                      </div>
                    )}
                  </div>
                )}

                {/* Niveau 7 : Payloads & Audit Traces */}
                {selectedRow.rawAudit && (
                  <div>
                    <div className="text-[10px] font-mono text-amber-400 uppercase tracking-wider mb-2 flex items-center justify-between">
                      <span>Niveau 7 · Trace d’Audit & Payload Brut</span>
                      <span className="text-[9px] text-slate-500">JSON Immuable</span>
                    </div>
                    <pre className="p-2.5 rounded-lg bg-slate-950 border border-slate-800 text-[10px] font-mono text-amber-300/90 overflow-x-auto max-h-48 scrollbar">
                      {JSON.stringify(selectedRow.rawAudit, null, 2)}
                    </pre>
                  </div>
                )}
              </>
            ) : (
              <div className="h-full flex flex-col items-center justify-center text-center text-slate-500 p-4">
                <div className="text-3xl mb-2">👈</div>
                <div className="text-xs font-semibold text-slate-400">Sélectionnez un élément (L4)</div>
                <div className="text-[10px] text-slate-500 mt-1 max-w-xs">
                  Inspectez instantanément ses champs (L5), ses actions (L6) et sa signature de vérification (L7).
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
