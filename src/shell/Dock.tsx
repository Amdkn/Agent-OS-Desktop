/**
 * Dock — the launcher & running window manager for Agent OS V3.
 *
 * Upgraded to BusinessOS standard:
 *  - 20 UI/UX Pro Max skins from dockSkins.ts (glass, clay, brutalism, cyberpunk, etc.)
 *  - Reversible position: bottom horizontal or right vertical column.
 *  - Fish-eye / progressive magnification scaling on hover.
 *  - Built-in settings popover for position & skins.
 *  - Launchpad & CMS V2 Hierarchical buttons integrated seamlessly.
 */

import { useState, useRef, useEffect } from 'react';
import { useShell, useOrderedWindows } from './store';
import { DOCK_SKINS, dockSkinById } from './dockSkins';
import { Settings2, PanelBottom, PanelRight, Check, X } from 'lucide-react';

export const HAUTEUR_DOCK = 54;
export const LARGEUR_DOCK = 54;

export function Dock() {
  const apps = useShell((s) => s.apps);
  const open = useShell((s) => s.openWindow);
  const openWindows = useOrderedWindows();
  const focused = useShell((s) => s.focused);
  const focusWindow = useShell((s) => s.focusWindow);
  const minimizeWindow = useShell((s) => s.minimizeWindow);
  const closeWindow = useShell((s) => s.closeWindow);
  const cmsVisibles = useShell((s) => s.cmsVisibles);
  const toggleCms = useShell((s) => s.toggleCms);
  const toggleAppDrawer = useShell((s) => s.toggleAppDrawer);
  const isAppDrawerOpen = useShell((s) => s.appDrawerOpen);

  const position = useShell((s) => s.dockPosition);
  const skinId = useShell((s) => s.dockSkinId);
  const setPosition = useShell((s) => s.setDockPosition);
  const setSkin = useShell((s) => s.setDockSkinId);

  const [reglagesOuverts, setReglagesOuverts] = useState(false);
  const [survolIndex, setSurvolIndex] = useState<number | null>(null);
  const panneauRef = useRef<HTMLDivElement>(null);

  // Fermeture automatique du popover de réglages au clic extérieur ou touche Échap
  useEffect(() => {
    if (!reglagesOuverts) return;
    const surClic = (e: MouseEvent) => {
      if (panneauRef.current && !panneauRef.current.contains(e.target as Node)) {
        setReglagesOuverts(false);
      }
    };
    const surTouche = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setReglagesOuverts(false);
    };
    document.addEventListener('mousedown', surClic);
    document.addEventListener('keydown', surTouche);
    return () => {
      document.removeEventListener('mousedown', surClic);
      document.removeEventListener('keydown', surTouche);
    };
  }, [reglagesOuverts]);

  // Fenêtres ouvertes : une pastille par application ayant au moins une fenêtre ouverte
  // Map appId -> WindowState[] pour gérer focus, minimisation et fermeture
  const openByApp = new Map<string, typeof openWindows>();
  for (const w of openWindows) {
    const list = openByApp.get(w.appId) ?? [];
    list.push(w);
    openByApp.set(w.appId, list);
  }

  // Liste des apps ouvertes, ordonnées selon l'ordre d'ouverture
  const openAppIds = Array.from(openByApp.keys());
  const openAppsList = openAppIds.map((aid) => {
    const found = apps.find((a) => a.id === aid);
    const wins = openByApp.get(aid) ?? [];
    return {
      id: aid,
      name: found?.name ?? wins[0]?.title ?? aid,
      description: found?.description ?? wins[0]?.title ?? aid,
      icon: found?.icon ?? '🪟',
      windows: wins,
    };
  });

  const skin = dockSkinById(skinId);
  const vertical = position === 'right';

  // Calcul d'échelle fish-eye progressive (macOS-like)
  const getScale = (index: number) => {
    if (survolIndex === null) return 1;
    const distance = Math.abs(survolIndex - index);
    if (distance === 0) return 1.28; // Bouton sous le curseur
    if (distance === 1) return 1.14; // Voisins immédiats
    if (distance === 2) return 1.05; // Deuxième rang
    return 1;
  };

  return (
    <div
      data-dock
      data-dock-position={position}
      className={`fixed z-40 flex pointer-events-none transition-all duration-300 ${
        vertical
          ? 'inset-y-0 right-0 items-center justify-end pr-2'
          : 'inset-x-0 bottom-0 items-end justify-center pb-2'
      }`}
      style={vertical ? { width: LARGEUR_DOCK + 16 } : { height: HAUTEUR_DOCK + 16 }}
    >
      <div
        className={`pointer-events-auto flex items-center border transition-all duration-200 ${
          vertical
            ? 'flex-col gap-1.5 px-1.5 py-2 max-h-[88vh]'
            : 'flex-row gap-1.5 px-2 py-1.5 max-w-[92vw]'
        }`}
        style={{
          background: skin.background,
          borderColor: skin.border,
          boxShadow: skin.shadow,
          borderRadius: skin.radius,
          backdropFilter: skin.backdrop || 'blur(16px)',
        }}
        onMouseLeave={() => setSurvolIndex(null)}
      >
        {/* Launchpad / AppDrawer */}
        <div className="relative group shrink-0">
          <button
            onClick={toggleAppDrawer}
            onMouseEnter={() => setSurvolIndex(-2)}
            title="Toutes les Applications (Launchpad)"
            aria-label="Launchpad"
            className="flex items-center justify-center border transition-all duration-150 active:scale-95"
            style={{
              width: 34,
              height: 34,
              borderRadius: skin.tileRadius,
              transform: `scale(${getScale(-2)})`,
              background: isAppDrawerOpen
                ? 'rgba(6, 182, 212, 0.35)'
                : skin.dark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(255, 255, 255, 0.7)',
              borderColor: isAppDrawerOpen
                ? 'rgba(6, 182, 212, 0.7)'
                : skin.dark ? 'rgba(255, 255, 255, 0.15)' : 'rgba(0, 0, 0, 0.12)',
            }}
          >
            <span className="text-lg">🚀</span>
          </button>
          {isAppDrawerOpen && (
            <span
              className={`absolute rounded-full bg-cyan-400 shadow-sm shadow-cyan-400 pointer-events-none ${
                vertical
                  ? 'left-0.5 top-1/2 -translate-y-1/2 w-1.5 h-1.5'
                  : 'bottom-0 left-1/2 -translate-x-1/2 w-1.5 h-1.5'
              }`}
            />
          )}
          <span
            className={`absolute px-2 py-1 rounded text-[10px] whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-50 ${
              vertical
                ? 'right-full mr-2 top-1/2 -translate-y-1/2'
                : 'bottom-full mb-2 left-1/2 -translate-x-1/2'
            }`}
            style={{
              background: 'var(--color-window-title)',
              border: '1px solid var(--color-window-border)',
              color: 'var(--color-text)',
            }}
          >
            Launchpad
          </span>
        </div>

        {/* Explorateur Hiérarchique CMS V2 */}
        <div className="relative group shrink-0">
          <button
            onClick={toggleCms}
            onMouseEnter={() => setSurvolIndex(-1)}
            title="Agent OS V2 · CMS Hiérarchique (Wix Pattern 7 Niveaux)"
            aria-label="CMS Hiérarchique V2"
            className="flex items-center justify-center border transition-all duration-150 active:scale-95"
            style={{
              width: 34,
              height: 34,
              borderRadius: skin.tileRadius,
              transform: `scale(${getScale(-1)})`,
              background: cmsVisibles
                ? 'rgba(56, 189, 248, 0.35)'
                : skin.dark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(255, 255, 255, 0.7)',
              borderColor: cmsVisibles
                ? 'rgba(56, 189, 248, 0.7)'
                : skin.dark ? 'rgba(255, 255, 255, 0.15)' : 'rgba(0, 0, 0, 0.12)',
            }}
          >
            <span className="text-lg">🗂️</span>
          </button>
          {cmsVisibles && (
            <span
              className={`absolute rounded-full bg-sky-400 shadow-sm shadow-sky-400 pointer-events-none ${
                vertical
                  ? 'left-0.5 top-1/2 -translate-y-1/2 w-1.5 h-1.5'
                  : 'bottom-0 left-1/2 -translate-x-1/2 w-1.5 h-1.5'
              }`}
            />
          )}
          <span
            className={`absolute px-2 py-1 rounded text-[10px] whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-50 ${
              vertical
                ? 'right-full mr-2 top-1/2 -translate-y-1/2'
                : 'bottom-full mb-2 left-1/2 -translate-x-1/2'
            }`}
            style={{
              background: 'var(--color-window-title)',
              border: '1px solid var(--color-window-border)',
              color: 'var(--color-text)',
            }}
          >
            CMS Hiérarchique V2
          </span>
        </div>

        {/* Séparateur conditionnel si au moins une application est ouverte */}
        {openAppsList.length > 0 && (
          <span
            className="shrink-0 rounded-full"
            style={{
              background: skin.dark ? 'rgba(255,255,255,0.22)' : 'rgba(0,0,0,0.15)',
              width: vertical ? 20 : 1,
              height: vertical ? 1 : 20,
              margin: vertical ? '2px 0' : '0 2px',
            }}
          />
        )}

        {/* Liste défilable des applications OUVERTES du Dock (disparaissent à la fermeture) */}
        {openAppsList.length > 0 && (
          <div
            className={`no-scrollbar flex min-w-0 p-1 items-center ${
              vertical
                ? 'flex-col gap-1.5 max-h-[64vh] overflow-y-auto overflow-x-hidden'
                : 'flex-row gap-1.5 max-w-[70vw] overflow-x-auto overflow-y-hidden'
            }`}
          >
            {openAppsList.map((app, idx) => {
              const wins = app.windows;
              const hasFocus = wins.some((w) => w.id === focused);
              const allMinimized = wins.every((w) => w.minimized);
              const scale = getScale(idx);

              const handleClick = () => {
                // Si la fenêtre active de cette app est au premier plan, on la minimise
                if (hasFocus && focused) {
                  minimizeWindow(focused);
                } else {
                  // Sinon on restaure ou focalise la première fenêtre
                  const target = wins[0];
                  if (target) {
                    focusWindow(target.id);
                  }
                }
              };

              return (
                <div key={app.id} className="group relative shrink-0">
                  <button
                    onClick={handleClick}
                    onMouseEnter={() => setSurvolIndex(idx)}
                    title={app.description || app.name}
                    aria-label={app.name}
                    className={`flex items-center justify-center border transition-all duration-150 active:scale-95 ${
                      allMinimized ? 'opacity-60' : 'opacity-100'
                    }`}
                    style={{
                      width: 34,
                      height: 34,
                      borderRadius: skin.tileRadius,
                      transform: `scale(${scale})`,
                      background: hasFocus
                        ? 'rgba(16, 185, 129, 0.25)'
                        : skin.dark ? 'rgba(255, 255, 255, 0.12)' : 'rgba(255, 255, 255, 0.85)',
                      borderColor: hasFocus
                        ? 'rgba(16, 185, 129, 0.6)'
                        : skin.dark ? 'rgba(255, 255, 255, 0.15)' : 'rgba(0, 0, 0, 0.1)',
                      boxShadow: hasFocus
                        ? '0 0 10px rgba(16, 185, 129, 0.35)'
                        : 'none',
                    }}
                  >
                    <span className="text-xl select-none">{app.icon}</span>
                  </button>

                  {/* Bouton de fermeture au survol */}
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      wins.forEach((w) => closeWindow(w.id));
                    }}
                    title={`Fermer ${app.name}`}
                    aria-label={`Fermer ${app.name}`}
                    className="absolute -top-1 -right-1 hidden h-3.5 w-3.5 items-center justify-center rounded-full bg-red-500 text-white shadow group-hover:flex hover:bg-red-600 z-30"
                  >
                    <X className="h-2 w-2" />
                  </button>

                  {/* Point d'état d'activité */}
                  <span
                    className={`absolute rounded-full pointer-events-none transition-all ${
                      hasFocus
                        ? 'bg-emerald-400 shadow-sm shadow-emerald-400'
                        : 'bg-white/60'
                    } ${
                      vertical
                        ? 'left-0.5 top-1/2 -translate-y-1/2 w-1.5 h-1.5'
                        : 'bottom-0 left-1/2 -translate-x-1/2 w-1.5 h-1.5'
                    }`}
                  />

                  {/* Infobulle nom */}
                  <span
                    className={`absolute px-2 py-1 rounded text-[10px] whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-50 ${
                      vertical
                        ? 'right-full mr-2 top-1/2 -translate-y-1/2'
                        : 'bottom-full mb-2 left-1/2 -translate-x-1/2'
                    }`}
                    style={{
                      background: 'var(--color-window-title)',
                      border: '1px solid var(--color-window-border)',
                      color: 'var(--color-text)',
                    }}
                  >
                    {app.name}
                  </span>
                </div>
              );
            })}
          </div>
        )}

        {/* Séparateur pour les réglages */}
        <span
          className="shrink-0 rounded-full"
          style={{
            background: skin.dark ? 'rgba(255,255,255,0.22)' : 'rgba(0,0,0,0.15)',
            width: vertical ? 20 : 1,
            height: vertical ? 1 : 20,
            margin: vertical ? '2px 0' : '0 2px',
          }}
        />

        {/* Bouton de Réglages du Dock (Position & 20 Skins UI/UX Pro Max) */}
        <div className="relative shrink-0" ref={panneauRef}>
          <button
            onClick={() => setReglagesOuverts((v) => !v)}
            onMouseEnter={() => setSurvolIndex(999)}
            title="Réglages du dock (Position & Thèmes)"
            aria-label="Réglages du dock"
            aria-expanded={reglagesOuverts}
            className="flex items-center justify-center border transition-all duration-150 active:scale-95"
            style={{
              width: 34,
              height: 34,
              borderRadius: skin.tileRadius,
              transform: `scale(${getScale(999)})`,
              background: reglagesOuverts
                ? 'rgba(139, 92, 246, 0.35)'
                : skin.dark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(255, 255, 255, 0.7)',
              borderColor: reglagesOuverts
                ? 'rgba(139, 92, 246, 0.7)'
                : skin.dark ? 'rgba(255, 255, 255, 0.15)' : 'rgba(0, 0, 0, 0.12)',
              color: skin.dark ? '#ffffff' : 'var(--color-text)',
            }}
          >
            <Settings2 className="h-4 w-4" />
          </button>

          {/* Panneau Popover des Réglages */}
          {reglagesOuverts && (
            <div
              className={`absolute z-50 w-64 rounded-xl border p-3 shadow-2xl backdrop-blur-xl ${
                vertical ? 'right-full top-0 mr-3' : 'bottom-full right-0 mb-3'
              }`}
              style={{
                background: 'var(--color-surface, rgba(15, 23, 42, 0.95))',
                borderColor: 'var(--color-bar-border, rgba(255, 255, 255, 0.15))',
                boxShadow: '0 20px 50px rgba(0,0,0,0.7)',
                color: 'var(--color-text, #f8fafc)',
              }}
            >
              {/* Section Position réversible */}
              <div className="mb-2 flex items-center justify-between">
                <span className="text-[10px] font-bold uppercase tracking-wider text-white/50">
                  Position du Dock
                </span>
                <span className="text-[9px] text-cyan-400 font-mono">Reversible</span>
              </div>
              <div className="mb-3 grid grid-cols-2 gap-1.5">
                <button
                  onClick={() => setPosition('bottom')}
                  className={`flex items-center justify-center gap-1.5 rounded-lg border px-2.5 py-1.5 text-xs font-medium transition-all ${
                    position === 'bottom'
                      ? 'bg-cyan-500/25 border-cyan-400 text-cyan-200'
                      : 'bg-white/5 border-white/10 text-white/70 hover:bg-white/10'
                  }`}
                >
                  <PanelBottom className="h-3.5 w-3.5" />
                  Bas
                </button>
                <button
                  onClick={() => setPosition('right')}
                  className={`flex items-center justify-center gap-1.5 rounded-lg border px-2.5 py-1.5 text-xs font-medium transition-all ${
                    position === 'right'
                      ? 'bg-cyan-500/25 border-cyan-400 text-cyan-200'
                      : 'bg-white/5 border-white/10 text-white/70 hover:bg-white/10'
                  }`}
                >
                  <PanelRight className="h-3.5 w-3.5" />
                  Droite
                </button>
              </div>

              {/* Section Habillages / Skins (20 thèmes BusinessOS) */}
              <div className="mb-2 flex items-center justify-between">
                <span className="text-[10px] font-bold uppercase tracking-wider text-white/50">
                  Habillage · {DOCK_SKINS.length} Styles
                </span>
                <span className="text-[9px] text-purple-400 font-mono">UI/UX Pro Max</span>
              </div>
              <div className="flex max-h-56 flex-col gap-1 overflow-y-auto pr-1 custom-scrollbar">
                {DOCK_SKINS.map((s) => {
                  const on = s.id === skinId;
                  return (
                    <button
                      key={s.id}
                      onClick={() => setSkin(s.id)}
                      className={`flex items-center gap-2.5 rounded-lg px-2 py-1.5 text-left text-xs transition-colors ${
                        on
                          ? 'bg-white/15 text-white font-medium'
                          : 'text-white/70 hover:bg-white/10'
                      }`}
                    >
                      {/* Vignette miniature */}
                      <span
                        className="h-4 w-6 shrink-0 border"
                        style={{
                          background: s.background,
                          borderColor: s.border,
                          borderRadius: Math.min(6, s.radius),
                        }}
                      />
                      <span className="flex-1 truncate">{s.label}</span>
                      {on && <Check className="h-3.5 w-3.5 text-cyan-400 shrink-0" />}
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

