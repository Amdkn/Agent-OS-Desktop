/**
 * Application root.
 *
 * Three things happen here:
 *   1. Apps are registered with the shell store (from the on-disk registry).
 *   2. The previous window layout is restored from the persistence layer.
 *   3. The shell is composed: MenuBar + Desk + Dock.
 */

import { useEffect } from 'react';
import { MenuBar } from './shell/MenuBar';
import { Dock } from './shell/Dock';
import { Desk } from './shell/Desk';
import { useShell, useOrderedWindows } from './shell/store';
import { apps } from './apps/registry';
import { useStorage } from './storage/useStorage';
import type { WindowState } from './types';

const SESSION_KEY = 'agent-os.session.v1';

interface SessionShape {
  windows: WindowState[];
}

export function App() {
  const registerApps = useShell((s) => s.registerApps);
  const hydrateWindows = useShell((s) => s.hydrateWindows);
  const restore = useShell((s) => s.hydrateWindows);
  const windows = useOrderedWindows();
  const adapter = useStorage();

  // 1. Register apps once.
  useEffect(() => {
    registerApps(apps.map((a) => a.manifest));
  }, [registerApps]);

  // 2. Restore previous session (windows that were open when the tab closed).
  useEffect(() => {
    const raw = localStorage.getItem(SESSION_KEY);
    if (!raw) return;
    try {
      const parsed = JSON.parse(raw) as SessionShape;
      if (Array.isArray(parsed.windows)) {
        // Drop windows whose app is no longer registered.
        const known = new Set(apps.map((a) => a.manifest.id));
        const cleaned = parsed.windows.filter((w) => known.has(w.appId));
        if (cleaned.length) restore(cleaned);
      }
    } catch {
      // Corrupt session — ignore.
    }
  }, [restore]);

  // 3. Persist the session on every change.
  useEffect(() => {
    const subs = windows;
    const data: SessionShape = { windows: subs };
    localStorage.setItem(SESSION_KEY, JSON.stringify(data));
  }, [windows]);

  // 4. Persist per-window window state for the durable layer.
  useEffect(() => {
    for (const w of windows) {
      void adapter.putAppState({
        key: `${w.appId}/${w.id}`,
        appId: w.appId,
        windowId: w.id,
        state: { x: w.x, y: w.y, w: w.w, h: w.h, payload: w.payload ?? {} },
        updatedAt: Date.now(),
      });
    }
  }, [windows, adapter]);

  // Just referencing the hydrate function so the variable is used — keeps
  // the explicit "we may want to re-hydrate" affordance visible.
  void hydrateWindows;

  return (
    <div className="fixed inset-0 flex flex-col">
      <MenuBar />
      <div className="flex-1 relative">
        <Desk />
        <Dock />
      </div>
    </div>
  );
}
