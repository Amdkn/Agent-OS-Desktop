/**
 * Shell store — windows, focus, and session-wide preferences.
 *
 * Survives only the session (Zustand default). The Snapshot layer below
 * persists the durable state; this store focuses on "what's open right now".
 *
 * Restart-on-reload: we restore the last known windows from the persistence
 * layer (see `loadSession` in App.tsx), so the user comes back to the same
 * arrangement.
 */

import { useMemo } from 'react';
import { create } from 'zustand';

/** Zone utilisable du bureau : sous la barre de menus, au-dessus du dock. */
export interface Cadre { x: number; y: number; w: number; h: number }

/** Ramene une geometrie dans le cadre visible.
 *
 *  Sans cette borne, un redimensionnement par un bord pousse la fenetre hors de
 *  l'ecran : sa barre de titre passe sous le dock ou au-dela du bord droit, et
 *  on ne peut plus ni la deplacer ni la fermer. On garde toujours une prise
 *  atteignable — la barre de titre est la seule prise d'une fenetre.
 */
export function borner(g: Cadre, cadre: Cadre, minW: number, minH: number): Cadre {
  // La fenetre reste ENTIEREMENT dans le cadre. Une premiere version se
  // contentait de garder « une prise visible » : la fenetre debordait alors a
  // droite de plusieurs centaines de pixels, et on perdait le controle de son
  // contenu. Simple et sans surprise vaut mieux qu'astucieux.
  const x0 = Math.max(cadre.x, Math.min(g.x, cadre.x + cadre.w - minW));
  const y0 = Math.max(cadre.y, Math.min(g.y, cadre.y + cadre.h - minH));
  const w = Math.min(Math.max(minW, g.w), cadre.x + cadre.w - x0);
  const h = Math.min(Math.max(minH, g.h), cadre.y + cadre.h - y0);
  return { x: x0, y: y0, w, h };
}
import type { WindowId, WindowState, AppManifest, WorkspaceInfo } from '../types';
import { DEFAULT_WALLPAPER_ID } from './wallpaper';
import {
  type SnapPosition,
  getSnapGeometry,
  computeSplitHorizontal,
  computeSplitVertical,
  computeGrid4,
  computeCascade,
} from './snapEngine';

export const DEFAULT_WORKSPACES: WorkspaceInfo[] = [
  { id: 'l0-tech', name: 'Tech OS', icon: '⚙️', domaine: 'l0-tech', description: 'Plomberie L0, Kernel uc.db, Observateurs & Baux' },
  { id: 'l1-life', name: 'Life OS', icon: '🌿', domaine: 'l1-life', description: 'Santé L1, Énergie, Jauges & Rituels Quotidiens' },
  { id: 'l2-business', name: 'Business OS', icon: '📈', domaine: 'l2-business', description: 'Coach OS L2, Franchises, Cashflow & Squads B3' },
];


export interface IconPosition {
  x: number;
  y: number;
}

export interface Toast {
  id: string;
  message: string;
  type: 'info' | 'success' | 'warning' | 'error';
  source?: string;
}

export interface Notification {
  id: string;
  message: string;
  type: 'info' | 'success' | 'warning' | 'error';
  source?: string;
  timestamp: number;
  read: boolean;
}

interface ShellState {
  windows: Record<WindowId, WindowState>;
  order: WindowId[];
  /** Apps discovered from the disk. Populated by the registry. */
  apps: AppManifest[];
  focused: WindowId | null;
  /** Counter used to give every new window a fresh id and to push focused on top. */
  zCounter: number;

  /** Currently selected wallpaper id. */
  wallpaperId: string;
  /** Desktop icon positions keyed by app id. */
  desktopIcons: Record<string, IconPosition>;
  /** Which desktop icon is currently selected (null = none). */
  selectedIcon: string | null;
  /** Vue par domaines (gabarit Life OS) affichée en fond de bureau. */
  domainesVisibles: boolean;
  /** Vue CMS Hiérarchique Wix Pattern (Agent OS V2). */
  cmsVisibles: boolean;

  /** Command Palette universelle (⌘K) V3 */
  commandPaletteOpen: boolean;
  /** Zone d'ancrage Aero Snap actuellement survolée */
  activeSnapTarget: SnapPosition | null;
  /** Workspace actif (l0-tech, l1-life, l2-business, etc.) */
  activeWorkspaceId: string;
  /** Liste des espaces de travail */
  workspaces: WorkspaceInfo[];

  /** Notifications & Toasts (BusinessOS standard) */
  toasts: Toast[];
  notifications: Notification[];
  notificationCount: number;
  addToast: (msg: string, type?: Toast['type'], source?: string) => void;
  dismissToast: (id: string) => void;
  clearNotifications: () => void;
  dismissNotification: (id: string) => void;
  dismissAllNotifications: () => void;

  /** Tiroir d'apps (AppDrawer) */
  appDrawerOpen: boolean;
  toggleAppDrawer: () => void;
  setAppDrawerOpen: (open: boolean) => void;

  /** Réglages du Dock BusinessOS (position et habillage de skin) */
  dockPosition: 'bottom' | 'right';
  dockSkinId: string;
  setDockPosition: (pos: 'bottom' | 'right') => void;
  setDockSkinId: (skinId: string) => void;
  toggleDockPosition: () => void;

  registerApps: (apps: AppManifest[]) => void;
  openWindow: (
    appId: string,
    opts?: { title?: string; x?: number; y?: number; w?: number; h?: number; payload?: Record<string, unknown>; workspaceId?: string },
  ) => WindowId;
  closeWindow: (id: WindowId) => void;
  focusWindow: (id: WindowId) => void;
  minimizeWindow: (id: WindowId) => void;
  toggleMinimize: (id: WindowId) => void;
  moveWindow: (id: WindowId, x: number, y: number) => void;
  resizeWindow: (id: WindowId, w: number, h: number) => void;
  setPayload: (id: WindowId, payload: Record<string, unknown>) => void;
  /** Bascule plein ecran / taille precedente. */
  toggleMaximize: (id: WindowId, cadre: Cadre) => void;
  /** Ancrage Aero Snap V3 */
  snapWindow: (id: WindowId, pos: SnapPosition, cadre: Cadre) => void;
  /** Agencement automatique des fenêtres V3 */
  tileWindows: (preset: 'split-h' | 'split-v' | 'grid-4' | 'cascade', cadre: Cadre) => void;
  /** Bascule épinglage Always-on-top / PiP */
  togglePinWindow: (id: WindowId) => void;
  /** Replace the whole window layout — used after restoring a snapshot. */
  hydrateWindows: (windows: WindowState[]) => void;
  /** Swap the wallpaper. */
  setWallpaper: (id: string) => void;
  /** Replace the full icon layout — used after restoring a snapshot. */
  hydrateIconPositions: (positions: Record<string, IconPosition>) => void;
  /** Move an icon to a new position (only set if the icon exists). */
  moveDesktopIcon: (appId: string, x: number, y: number) => void;
  /** Mark an icon as selected (null to clear). */
  selectDesktopIcon: (appId: string | null) => void;
  /** Afficher/masquer la vue par domaines. */
  toggleDomaines: () => void;
  /** Afficher/masquer la vue CMS hiérarchique V2. */
  toggleCms: () => void;
  /** Ouvrir/fermer la Command Palette ⌘K */
  setCommandPalette: (open: boolean) => void;
  toggleCommandPalette: () => void;
  /** Définir la zone de snap visuelle */
  setActiveSnapTarget: (target: SnapPosition | null) => void;
  /** Changer de workspace actif */
  switchWorkspace: (id: string) => void;
  /** Ajouter un workspace */
  addWorkspace: (ws: WorkspaceInfo) => void;
}


const DEFAULT_W = 720;
const DEFAULT_H = 480;

function nextPosition(state: ShellState, w: number, h: number): { x: number; y: number } {
  // Cascade new windows so they don't stack exactly.
  const count = state.order.length;
  const offset = (count * 28) % 200;
  const baseX = Math.max(40, Math.floor((window.innerWidth - w) / 2) - offset);
  const baseY = Math.max(80, Math.floor((window.innerHeight - h) / 2) - offset);
  return { x: baseX, y: baseY };
}

export const useShell = create<ShellState>((set, get) => ({
  windows: {},
  order: [],
  apps: [],
  focused: null,
  zCounter: 1,

  wallpaperId: DEFAULT_WALLPAPER_ID,
  desktopIcons: {},
  selectedIcon: null,
  domainesVisibles: true,
  cmsVisibles: false,

  commandPaletteOpen: false,
  activeSnapTarget: null,
  activeWorkspaceId: 'l0-tech',
  workspaces: DEFAULT_WORKSPACES,

  toasts: [],
  notifications: [],
  notificationCount: 0,
  appDrawerOpen: false,

  dockPosition: (() => {
    try {
      const p = localStorage.getItem('agent-os.dock.position');
      return p === 'right' ? 'right' : 'bottom';
    } catch {
      return 'bottom';
    }
  })(),
  dockSkinId: (() => {
    try {
      return localStorage.getItem('agent-os.dock.skin') || 'glass';
    } catch {
      return 'glass';
    }
  })(),

  setDockPosition: (pos) => {
    try { localStorage.setItem('agent-os.dock.position', pos); } catch {}
    set({ dockPosition: pos });
  },
  setDockSkinId: (skinId) => {
    try { localStorage.setItem('agent-os.dock.skin', skinId); } catch {}
    set({ dockSkinId: skinId });
  },
  toggleDockPosition: () =>
    set((s) => {
      const next = s.dockPosition === 'bottom' ? 'right' : 'bottom';
      try { localStorage.setItem('agent-os.dock.position', next); } catch {}
      return { dockPosition: next };
    }),

  registerApps: (apps) => set({ apps }),

  openWindow: (appId, opts) => {
    const state = get();
    const existing = state.order.find((id) => state.windows[id].appId === appId);
    const app = state.apps.find((a) => a.id === appId);
    const isSingleton = app?.kind === 'singleton';

    if (isSingleton && existing) {
      const w = state.windows[existing];
      const next = get();
      const z = next.zCounter + 1;
      set({
        zCounter: z,
        focused: existing,
        windows: {
          ...next.windows,
          [existing]: {
            ...w,
            minimized: false,
            z,
            payload: opts?.payload ? { ...w.payload, ...opts.payload } : w.payload,
            title: opts?.title ?? w.title,
          },
        },
      });
      return existing;
    }

    const id = crypto.randomUUID();
    const w = opts?.w ?? DEFAULT_W;
    const h = opts?.h ?? DEFAULT_H;
    const pos = nextPosition(state, w, h);
    const z = state.zCounter + 1;
    const win: WindowState = {
      id,
      appId,
      title: opts?.title ?? app?.name ?? appId,
      minimized: false,
      z,
      x: opts?.x ?? pos.x,
      y: opts?.y ?? pos.y,
      w,
      h,
      workspaceId: opts?.workspaceId ?? state.activeWorkspaceId,
      payload: opts?.payload,
    };
    set({
      windows: { ...state.windows, [id]: win },
      order: [...state.order, id],
      focused: id,
      zCounter: z,
    });

    return id;
  },

  closeWindow: (id) =>
    set((s) => {
      const { [id]: _, ...rest } = s.windows;
      return {
        windows: rest,
        order: s.order.filter((wid) => wid !== id),
        focused: s.focused === id ? null : s.focused,
      };
    }),

  focusWindow: (id) =>
    set((s) => {
      if (s.windows[id]?.minimized) {
        const z = s.zCounter + 1;
        return {
          zCounter: z,
          focused: id,
          windows: { ...s.windows, [id]: { ...s.windows[id], minimized: false, z } },
        };
      }
      const z = s.zCounter + 1;
      return {
        zCounter: z,
        focused: id,
        windows: { ...s.windows, [id]: { ...s.windows[id], z } },
      };
    }),

  minimizeWindow: (id) =>
    set((s) => ({
      windows: { ...s.windows, [id]: { ...s.windows[id], minimized: true } },
      focused: s.focused === id ? null : s.focused,
    })),

  toggleMinimize: (id) =>
    set((s) => {
      const w = s.windows[id];
      const next = !w.minimized;
      if (next) {
        return {
          windows: { ...s.windows, [id]: { ...w, minimized: true } },
          focused: s.focused === id ? null : s.focused,
        };
      }
      const z = s.zCounter + 1;
      return {
        zCounter: z,
        focused: id,
        windows: { ...s.windows, [id]: { ...w, minimized: false, z } },
      };
    }),

  moveWindow: (id, x, y) =>
    set((s) => ({
      windows: { ...s.windows, [id]: { ...s.windows[id], x, y } },
    })),

  resizeWindow: (id, w, h) =>
    set((s) => ({
      windows: { ...s.windows, [id]: { ...s.windows[id], w, h } },
    })),

  setPayload: (id, payload) =>
    set((s) => ({
      windows: { ...s.windows, [id]: { ...s.windows[id], payload: { ...s.windows[id].payload, ...payload } } },
    })),

  toggleMaximize: (id, cadre) =>
    set((s) => {
      const w = s.windows[id];
      if (!w) return {};
      const suivant: WindowState = w.maximized
        ? { ...w, maximized: false, ...(w.restore ?? { x: w.x, y: w.y, w: w.w, h: w.h }), restore: undefined, snapped: null }
        : { ...w, maximized: true, restore: { x: w.x, y: w.y, w: w.w, h: w.h },
            x: cadre.x, y: cadre.y, w: cadre.w, h: cadre.h, snapped: 'maximize' };
      const z = s.zCounter + 1;
      return { zCounter: z, focused: id, windows: { ...s.windows, [id]: { ...suivant, z } } };
    }),

  snapWindow: (id, pos, cadre) =>
    set((s) => {
      const w = s.windows[id];
      if (!w) return {};
      const geom = getSnapGeometry(pos, cadre);
      const z = s.zCounter + 1;
      return {
        zCounter: z,
        focused: id,
        windows: {
          ...s.windows,
          [id]: {
            ...w,
            minimized: false,
            maximized: pos === 'maximize',
            snapped: pos,
            restore: w.restore ?? { x: w.x, y: w.y, w: w.w, h: w.h },
            x: geom.x,
            y: geom.y,
            w: geom.w,
            h: geom.h,
            z,
          },
        },
      };
    }),

  tileWindows: (preset, cadre) =>
    set((s) => {
      const activeWs = s.activeWorkspaceId;
      const wins = s.order
        .map((id) => s.windows[id])
        .filter((w) => Boolean(w) && !w.minimized && (w.workspaceId === activeWs || !w.workspaceId || w.pinned));
      if (wins.length === 0) return {};

      let arrangements: Array<{ id: WindowId; geom: Cadre }> = [];
      if (preset === 'split-h') arrangements = computeSplitHorizontal(wins, cadre);
      else if (preset === 'split-v') arrangements = computeSplitVertical(wins, cadre);
      else if (preset === 'grid-4') arrangements = computeGrid4(wins, cadre);
      else arrangements = computeCascade(wins, cadre);

      const nextWins = { ...s.windows };
      for (const a of arrangements) {
        if (nextWins[a.id]) {
          nextWins[a.id] = {
            ...nextWins[a.id],
            x: a.geom.x,
            y: a.geom.y,
            w: a.geom.w,
            h: a.geom.h,
            maximized: false,
          };
        }
      }
      return { windows: nextWins };
    }),

  togglePinWindow: (id) =>
    set((s) => {
      const w = s.windows[id];
      if (!w) return {};
      const z = !w.pinned ? s.zCounter + 1000 : s.zCounter + 1;
      return {
        zCounter: z,
        windows: { ...s.windows, [id]: { ...w, pinned: !w.pinned, z } },
      };
    }),

  hydrateWindows: (windows) =>
    set(() => {
      const map: Record<WindowId, WindowState> = {};
      const order: WindowId[] = [];
      let z = 1;
      for (const w of windows) {
        map[w.id] = { ...w, z: z++ };
        order.push(w.id);
      }
      return { windows: map, order, focused: order[order.length - 1] ?? null, zCounter: z };
    }),

  setWallpaper: (id) => set({ wallpaperId: id }),

  hydrateIconPositions: (positions) => set({ desktopIcons: { ...positions } }),

  moveDesktopIcon: (appId, x, y) =>
    set((s) => {
      const prev = s.desktopIcons[appId];
      // Avoid a write + rerender when nothing changed.
      if (prev && prev.x === x && prev.y === y) return {};
      return {
        desktopIcons: {
          ...s.desktopIcons,
          [appId]: { x, y },
        },
      };
    }),

  selectDesktopIcon: (appId) => set({ selectedIcon: appId }),

  toggleDomaines: () => set((s) => ({ domainesVisibles: !s.domainesVisibles })),

  toggleCms: () => set((s) => ({ cmsVisibles: !s.cmsVisibles })),

  setCommandPalette: (open) => set({ commandPaletteOpen: open }),

  toggleCommandPalette: () => set((s) => ({ commandPaletteOpen: !s.commandPaletteOpen })),

  setActiveSnapTarget: (target) => set({ activeSnapTarget: target }),

  switchWorkspace: (id) => set({ activeWorkspaceId: id }),

  addWorkspace: (ws) => set((s) => ({ workspaces: [...s.workspaces, ws] })),

  addToast: (message, type = 'info', source = 'Agent OS') =>
    set((s) => {
      const id = `toast-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
      const newToast: Toast = { id, message, type, source };
      const newNotification: Notification = {
        id: `notif-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
        message,
        type,
        source,
        timestamp: Date.now(),
        read: false,
      };
      const nextNotifs = [newNotification, ...s.notifications].slice(0, 50);
      return {
        toasts: [...s.toasts, newToast],
        notifications: nextNotifs,
        notificationCount: s.notificationCount + 1,
      };
    }),

  dismissToast: (id) =>
    set((s) => ({
      toasts: s.toasts.filter((t) => t.id !== id),
    })),

  clearNotifications: () =>
    set((s) => ({
      notifications: s.notifications.map((n) => ({ ...n, read: true })),
      notificationCount: 0,
    })),

  dismissNotification: (id) =>
    set((s) => {
      const target = s.notifications.find((n) => n.id === id);
      const wasUnread = target && !target.read;
      return {
        notifications: s.notifications.filter((n) => n.id !== id),
        notificationCount: wasUnread ? Math.max(0, s.notificationCount - 1) : s.notificationCount,
      };
    }),

  dismissAllNotifications: () =>
    set({
      notifications: [],
      notificationCount: 0,
    }),

  toggleAppDrawer: () => set((s) => ({ appDrawerOpen: !s.appDrawerOpen })),
  setAppDrawerOpen: (open) => set({ appDrawerOpen: open }),
}));

/** Fenetres dans l'ordre d'empilement.
 *
 *  A NE PAS transformer en selecteur simple. La version precedente etait :
 *
 *      export const selectOrderedWindows = (s) =>
 *        s.order.map((id) => s.windows[id]).filter(Boolean);
 *
 *  Elle construit un NOUVEAU tableau a chaque appel. `useSyncExternalStore`
 *  compare par identite, conclut que l'etat a change, redemande un rendu, qui
 *  reconstruit un tableau, et ainsi de suite : « getSnapshot should be cached »
 *  puis « Maximum update depth exceeded ». La page ne s'affiche jamais.
 *
 *  La regle : un selecteur Zustand ne renvoie qu'un SCALAIRE ou une reference
 *  deja stable dans le magasin. Toute derivation se fait dans le composant,
 *  memorisee. C'est la troisieme fois que ce piege tombe dans cet ecosysteme.
 */
export function useOrderedWindows(): WindowState[] {
  const order = useShell((s) => s.order);       // reference stable du magasin
  const windows = useShell((s) => s.windows);   // idem
  const activeWs = useShell((s) => s.activeWorkspaceId);
  return useMemo(
    () =>
      order
        .map((id) => windows[id])
        .filter((w) => Boolean(w) && (w.workspaceId === activeWs || !w.workspaceId || w.pinned)),
    [order, windows, activeWs],
  );
}

