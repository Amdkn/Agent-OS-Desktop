import { useState, useEffect, useMemo, useRef } from 'react';
import { useShell } from './store';
import { generateCmsHierarchy } from '../cms/hierarchy';
import type { CmsAppItem, CmsPageView } from '../cms/types';
import { cadreBureau } from './Window';

interface PaletteItem {
  id: string;
  category: 'workspace' | 'app' | 'window' | 'cms_view' | 'action' | 'layout';
  title: string;
  subtitle: string;
  icon: string;
  badge?: string;
  onSelect: () => void;
}

export function CommandPalette() {
  const isOpen = useShell((s) => s.commandPaletteOpen);
  const setOpen = useShell((s) => s.setCommandPalette);
  const openWindow = useShell((s) => s.openWindow);
  const focusWindow = useShell((s) => s.focusWindow);
  const windows = useShell((s) => s.windows);
  const order = useShell((s) => s.order);
  const apps = useShell((s) => s.apps);
  const workspaces = useShell((s) => s.workspaces);
  const activeWorkspaceId = useShell((s) => s.activeWorkspaceId);
  const switchWorkspace = useShell((s) => s.switchWorkspace);
  const tileWindows = useShell((s) => s.tileWindows);
  const toggleCms = useShell((s) => s.toggleCms);
  const toggleDomaines = useShell((s) => s.toggleDomaines);

  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  // Écoute globale Ctrl+K / Cmd+K
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setOpen(!isOpen);
      } else if (e.key === 'Escape' && isOpen) {
        e.preventDefault();
        setOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, setOpen]);

  // Focus automatique du champ de saisie à l'ouverture
  useEffect(() => {
    if (isOpen) {
      setQuery('');
      setSelectedIndex(0);
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [isOpen]);

  const hierarchy = useMemo(() => generateCmsHierarchy(), []);

  // Construction de l'index des items
  const allItems = useMemo<PaletteItem[]>(() => {
    const items: PaletteItem[] = [];

    // 1. Workspaces
    for (const ws of workspaces) {
      const isCurrent = ws.id === activeWorkspaceId;
      items.push({
        id: `ws-${ws.id}`,
        category: 'workspace',
        title: `Workspace : ${ws.name}`,
        subtitle: ws.description ?? 'Basculer vers cet espace de travail',
        icon: ws.icon,
        badge: isCurrent ? 'Actif' : 'Changer',
        onSelect: () => {
          switchWorkspace(ws.id);
          setOpen(false);
        },
      });
    }

    // 2. Agencements de fenêtres (Tiling Presets)
    items.push(
      {
        id: 'tile-split-h',
        category: 'layout',
        title: 'Agencer : Scinder Horizontalement (50/50)',
        subtitle: 'Aligne deux fenêtres côte à côte à 50% de largeur',
        icon: '◧',
        badge: 'Tiling V3',
        onSelect: () => {
          tileWindows('split-h', cadreBureau());
          setOpen(false);
        },
      },
      {
        id: 'tile-grid-4',
        category: 'layout',
        title: 'Agencer : Grille 4 Quadrants',
        subtitle: "Répartit 4 fenêtres dans les quatre coins de l'écran (25% chacune)",
        icon: '◰',
        badge: 'Tiling V3',
        onSelect: () => {
          tileWindows('grid-4', cadreBureau());
          setOpen(false);
        },
      },
      {
        id: 'tile-cascade',
        category: 'layout',
        title: 'Agencer : Réorganisation en Cascade',
        subtitle: 'Dispose les fenêtres en escalier naturel',
        icon: '🪟',
        badge: 'Tiling V3',
        onSelect: () => {
          tileWindows('cascade', cadreBureau());
          setOpen(false);
        },
      },
      {
        id: 'toggle-cms',
        category: 'layout',
        title: 'Basculer : Navigateur CMS Wix Pattern V2',
        subtitle: 'Affiche ou masque la vue CMS hiérarchique à 7 niveaux',
        icon: '🗂️',
        badge: 'CMS V2',
        onSelect: () => {
          toggleCms();
          setOpen(false);
        },
      },
      {
        id: 'toggle-domaines',
        category: 'layout',
        title: 'Basculer : Vue par Domaines (Life OS)',
        subtitle: 'Affiche ou masque la carte des 3 domaines en fond de bureau',
        icon: '🌐',
        badge: 'Life OS',
        onSelect: () => {
          toggleDomaines();
          setOpen(false);
        },
      }
    );

    // 3. Fenêtres ouvertes
    for (const wid of order) {
      const win = windows[wid];
      if (!win) continue;
      items.push({
        id: `win-${win.id}`,
        category: 'window',
        title: `Fenêtre : ${win.title}`,
        subtitle: `App: ${win.appId} ${win.minimized ? '(réduite)' : '(ouverte)'}`,
        icon: '🪟',
        badge: win.pinned ? 'Épinglée PiP' : undefined,
        onSelect: () => {
          focusWindow(win.id);
          setOpen(false);
        },
      });
    }

    // 4. Applications déclarées
    for (const app of apps) {
      items.push({
        id: `app-${app.id}`,
        category: 'app',
        title: `Lancer : ${app.name}`,
        subtitle: app.description,
        icon: app.icon,
        badge: app.domaine ?? 'app',
        onSelect: () => {
          openWindow(app.id);
          setOpen(false);
        },
      });
    }

    // 5. Vues et Pages CMS (Niveau 2)
    for (const appItem of hierarchy.apps) {
      for (const view of appItem.views) {
        items.push({
          id: `view-${appItem.id}-${view.id}`,
          category: 'cms_view',
          title: `${appItem.name} › ${view.name}`,
          subtitle: view.description,
          icon: view.icon,
          badge: `L2 · ${view.headerOrSidebar}`,
          onSelect: () => {
            openWindow(appItem.id, { payload: { targetTab: view.id } });
            setOpen(false);
          },
        });
      }
    }

    // 6. Actions Exécutables N6 du CMS
    const collectActions = (appItem: CmsAppItem, view: CmsPageView) => {
      for (const sec of view.sections) {
        for (const row of sec.dataset) {
          for (const act of (row.actions ?? [])) {
            items.push({
              id: `act-${act.id}`,
              category: 'action',
              title: `Action N6 : ${act.label}`,
              subtitle: `Déclencheur sur ${row.name} (${appItem.name}) · ${act.verb}`,
              icon: '⚡',
              badge: act.verb,
              onSelect: () => {
                openWindow(appItem.id, { payload: { targetTab: view.id, executeActionId: act.id } });
                setOpen(false);
              },
            });
          }
        }
      }
    };


    for (const a of hierarchy.apps) {
      for (const v of a.views) {
        collectActions(a, v);
      }
    }

    return items;
  }, [workspaces, activeWorkspaceId, switchWorkspace, tileWindows, toggleCms, toggleDomaines, order, windows, apps, hierarchy, focusWindow, openWindow, setOpen]);

  // Filtrage par query flou
  const filteredItems = useMemo(() => {
    if (!query.trim()) return allItems.slice(0, 30);
    const q = query.toLowerCase().trim();
    return allItems
      .filter((it) => it.title.toLowerCase().includes(q) || it.subtitle.toLowerCase().includes(q) || it.badge?.toLowerCase().includes(q))
      .slice(0, 40);
  }, [allItems, query]);

  // Gestion des flèches et validation
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex((prev) => (prev + 1) % Math.max(1, filteredItems.length));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex((prev) => (prev - 1 + filteredItems.length) % Math.max(1, filteredItems.length));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      const item = filteredItems[selectedIndex];
      if (item) item.onSelect();
    }
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-[10000] bg-black/60 backdrop-blur-md flex items-start justify-center pt-20 px-4 select-none"
      onClick={() => setOpen(false)}
    >
      <div
        className="w-full max-w-2xl window-chrome rounded-xl border border-[var(--color-accent)]/40 shadow-2xl overflow-hidden flex flex-col animate-in fade-in zoom-in-95 duration-150"
        onClick={(e) => e.stopPropagation()}
        style={{ background: 'rgba(15, 23, 42, 0.94)' }}
      >
        {/* Barre de recherche */}
        <div className="flex items-center gap-3 px-4 py-3 border-b border-white/10 bg-white/5">
          <span className="text-lg text-[var(--color-accent)]">🔍</span>
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setSelectedIndex(0);
            }}
            onKeyDown={handleKeyDown}
            placeholder="Rechercher une application, vue CMS, action N6, workspace (⌘K)..."
            className="flex-1 bg-transparent border-none outline-none text-sm text-[var(--color-text)] placeholder-[var(--color-text-dim)]"
          />
          <kbd className="px-2 py-0.5 rounded bg-white/10 text-[10px] font-mono text-[var(--color-text-dim)] border border-white/10">
            ESC pour fermer
          </kbd>
        </div>

        {/* Liste des résultats */}
        <div className="max-h-[420px] overflow-y-auto scrollbar p-2 flex flex-col gap-1">
          {filteredItems.length === 0 ? (
            <div className="text-center py-8 text-xs text-[var(--color-text-dim)]">
              Aucun résultat pour « {query} »
            </div>
          ) : (
            filteredItems.map((item, idx) => {
              const selected = idx === selectedIndex;
              return (
                <div
                  key={item.id}
                  onClick={item.onSelect}
                  onMouseEnter={() => setSelectedIndex(idx)}
                  className={`flex items-center gap-3 px-3 py-2 rounded-lg cursor-pointer transition-colors ${
                    selected
                      ? 'bg-[var(--color-accent)]/20 border border-[var(--color-accent)]/50 text-white'
                      : 'hover:bg-white/5 text-[var(--color-text-dim)]'
                  }`}
                >
                  <span className="text-base w-6 text-center">{item.icon}</span>
                  <div className="flex-1 min-w-0">
                    <div className="text-xs font-medium text-[var(--color-text)] truncate">
                      {item.title}
                    </div>
                    <div className="text-[11px] text-[var(--color-text-dim)] truncate">
                      {item.subtitle}
                    </div>
                  </div>
                  {item.badge && (
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-white/10 border border-white/10 text-[var(--color-accent)] shrink-0">
                      {item.badge}
                    </span>
                  )}
                </div>
              );
            })
          )}
        </div>

        {/* Pied de commande */}
        <div className="px-4 py-2 bg-black/40 border-t border-white/5 flex items-center justify-between text-[11px] text-[var(--color-text-dim)] font-mono">
          <div className="flex items-center gap-3">
            <span>↑↓ Naviguer</span>
            <span>↵ Exécuter</span>
          </div>
          <div className="text-[var(--color-accent)]">
            Agent OS V3 · Standard Business OS
          </div>
        </div>
      </div>
    </div>
  );
}
