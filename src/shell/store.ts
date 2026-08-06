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
import type { WindowId, WindowState, AppManifest } from '../types';

interface ShellState {
  windows: Record<WindowId, WindowState>;
  order: WindowId[];
  /** Apps discovered from the disk. Populated by the registry. */
  apps: AppManifest[];
  focused: WindowId | null;
  /** Counter used to give every new window a fresh id and to push focused on top. */
  zCounter: number;

  registerApps: (apps: AppManifest[]) => void;
  openWindow: (
    appId: string,
    opts?: { title?: string; x?: number; y?: number; w?: number; h?: number; payload?: Record<string, unknown> },
  ) => WindowId;
  closeWindow: (id: WindowId) => void;
  focusWindow: (id: WindowId) => void;
  minimizeWindow: (id: WindowId) => void;
  toggleMinimize: (id: WindowId) => void;
  moveWindow: (id: WindowId, x: number, y: number) => void;
  resizeWindow: (id: WindowId, w: number, h: number) => void;
  setPayload: (id: WindowId, payload: Record<string, unknown>) => void;
  /** Replace the whole window layout — used after restoring a snapshot. */
  hydrateWindows: (windows: WindowState[]) => void;
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
          [existing]: { ...w, minimized: false, z },
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
  return useMemo(
    () => order.map((id) => windows[id]).filter(Boolean),
    [order, windows],
  );
}
