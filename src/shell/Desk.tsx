/**
 * Desk — the desktop background and the place where windows live.
 *
 * Visual stack, back to front:
 *   1. Wallpaper image (covers the whole area, no distortion).
 *   2. Dark veil — readability first, but the picture still bleeds through.
 *   3. Desktop icons (one per registered app, behind the windows).
 *   4. Windows themselves.
 *   5. The small "Agent OS" badge in the bottom-right.
 *
 * The veil exists because text on top of a photo stops being legible the
 * moment the photo's local luminance goes dark or light. A semi-opaque
 * layer between the picture and the chrome is the cheapest fix and the
 * one that survives the most images.
 */

import { useMemo } from 'react';
import { useShell, useOrderedWindows } from './store';
import { findWallpaper, wallpaperStyle } from './wallpaper';
import { Window } from './Window';
import { getApp } from '../apps/registry';
import { DeskIcons } from './DeskIcons';

const ICON_GRID = { x: 12, y: 12, dx: 96, dy: 110 }; // top-left + cell stride

function defaultIconPosition(index: number): { x: number; y: number } {
  return {
    x: ICON_GRID.x + (index % 6) * ICON_GRID.dx,
    y: ICON_GRID.y + Math.floor(index / 6) * ICON_GRID.dy,
  };
}

/**
 * Pick a position for a freshly-registered app: persisted wins, else the
 * next free cell in the top-left grid. Pure derivation — memoised on the
 * inputs that matter (apps list and stored positions).
 */
function useIconLayout() {
  const apps = useShell((s) => s.apps);
  const stored = useShell((s) => s.desktopIcons);
  return useMemo(() => {
    const out: Record<string, { x: number; y: number }> = {};
    const taken = new Set<string>();
    apps.forEach((app) => {
      const persisted = stored[app.id];
      if (persisted) {
        out[app.id] = persisted;
        taken.add(`${persisted.x},${persisted.y}`);
      }
    });
    apps.forEach((app, i) => {
      if (out[app.id]) return;
      // Walk the grid until we find a free cell.
      let idx = i;
      while (idx < 1000) {
        const p = defaultIconPosition(idx);
        const k = `${p.x},${p.y}`;
        if (!taken.has(k)) {
          out[app.id] = p;
          taken.add(k);
          break;
        }
        idx++;
      }
    });
    return out;
  }, [apps, stored]);
}

export function Desk() {
  const wallpaperId = useShell((s) => s.wallpaperId);
  const wallpaper = useMemo(() => findWallpaper(wallpaperId), [wallpaperId]);
  const windows = useOrderedWindows();
  const sorted = useMemo(
    () => [...windows].sort((a, b) => a.z - b.z),
    [windows],
  );
  const iconLayout = useIconLayout();

  return (
    <div className="absolute inset-0 overflow-hidden">
      {/* Wallpaper */}
      <div
        aria-hidden
        className="absolute inset-0"
        style={{
          ...wallpaperStyle(wallpaper),
          backgroundSize: 'cover',
          backgroundPosition: 'center center',
          backgroundRepeat: 'no-repeat',
          backgroundColor: '#050913',
        }}
      />
      {/* Veil — sits between the picture and every chrome element so text
          stays readable without flattening the wallpaper to a flat fill. */}
      <div
        aria-hidden
        className="absolute inset-0"
        style={{
          background:
            'linear-gradient(180deg, rgba(5,9,19,0.55) 0%, rgba(5,9,19,0.35) 35%, rgba(5,9,19,0.55) 100%)',
        }}
      />

      {/* Desktop icons (behind windows but above the picture). */}
      <DeskIcons layout={iconLayout} />

      {/* Windows on top. */}
      {sorted.map((w) => {
        if (w.minimized) return null;
        const app = getApp(w.appId);
        if (!app) return null;
        const Component = app.component as React.ComponentType<{ payload?: Record<string, unknown> }>;
        return (
          <Window key={w.id} win={w}>
            <Component payload={w.payload} />
          </Window>
        );
      })}

      <div className="absolute bottom-3 right-3 text-[10px] text-[var(--color-text-dim)] font-mono opacity-60 select-none pointer-events-none">
        Agent OS · V2 (CMS Substrat)
      </div>
    </div>
  );
}
