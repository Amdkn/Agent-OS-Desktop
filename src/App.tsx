/**
 * Application root.
 *
 * Four things happen here:
 *   1. Apps are registered with the shell store (from the on-disk registry).
 *   2. The previous window layout and desktop state are restored from
 *      persistence (localStorage).
 *   3. Each session change is mirrored back to localStorage.
 *   4. The shell is composed: MenuBar + Desk + Dock.
 */

import { useEffect, useRef } from 'react';
import { MenuBar } from './shell/MenuBar';
import { Dock } from './shell/Dock';
import { Desk } from './shell/Desk';
import { useShell, useOrderedWindows, type IconPosition } from './shell/store';
import { apps } from './apps/registry';
import { DomainsView } from './shell/DomainsView';
import { CmsView } from './cms/CmsView';
import { VetoBand } from './shell/VetoBand';
import { useStorage } from './storage/useStorage';
import type { WindowState } from './types';
import { CommandPalette } from './shell/CommandPalette';
import { SnapGhostOverlay } from './shell/SnapGhostOverlay';
import { cadreBureau } from './shell/Window';
import { ThemeApplier } from './themes/ThemeApplier';
import { ToastContainer } from './shell/Toast';
import { ViewportGuard } from './shell/ViewportGuard';
import { AppDrawer } from './shell/AppDrawer';
import { decodeVersionedEnvelope } from './shell/migrationDefensive';

const SESSION_KEY_V3 = 'agent-os.session.v3';
const SESSION_KEY_V2 = 'agent-os.session.v2';
const CURRENT_SCHEMA_VERSION = 3;

interface SessionShape {
  windows: WindowState[];
  wallpaperId?: string;
  desktopIcons?: Record<string, IconPosition>;
  activeWorkspaceId?: string;
}

const DEFAULT_WALLPAPER_ID = 'solarpunk-3';

function isValidWallpaperId(id: string): boolean {
  return typeof id === 'string' && id.length > 0 && id.length < 64 && /^[a-z0-9_-]+$/i.test(id);
}

export function App() {
  const registerApps = useShell((s) => s.registerApps);
  const hydrateWindows = useShell((s) => s.hydrateWindows);
  const hydrateIconPositions = useShell((s) => s.hydrateIconPositions);
  const setWallpaper = useShell((s) => s.setWallpaper);
  const switchWorkspace = useShell((s) => s.switchWorkspace);
  const windows = useOrderedWindows();
  const allWindowsMap = useShell((s) => s.windows);
  const appsState = useShell((s) => s.apps);
  const wallpaperId = useShell((s) => s.wallpaperId);
  const desktopIcons = useShell((s) => s.desktopIcons);
  const domainesVisibles = useShell((s) => s.domainesVisibles);
  const cmsVisibles = useShell((s) => s.cmsVisibles);
  const activeSnapTarget = useShell((s) => s.activeSnapTarget);
  const activeWorkspaceId = useShell((s) => s.activeWorkspaceId);
  const adapter = useStorage();

  const restoredRef = useRef(false);

  // 1. Register apps once.
  useEffect(() => {
    registerApps(apps.map((a) => a.manifest));
  }, [registerApps]);

  // 2. Restore previous session with defensive envelope validation
  useEffect(() => {
    if (restoredRef.current) return;
    const rawV3 = localStorage.getItem(SESSION_KEY_V3);
    let parsed: SessionShape | undefined = decodeVersionedEnvelope<SessionShape>(rawV3, CURRENT_SCHEMA_VERSION);

    if (!parsed) {
      // Fallback v2 non-versioned
      const rawV2 = localStorage.getItem(SESSION_KEY_V2) ?? rawV3;
      if (rawV2) {
        try {
          const direct = JSON.parse(rawV2);
          if (direct && typeof direct === 'object') {
            parsed = direct.state ?? direct;
          }
        } catch {
          // Ignorer corruption
        }
      }
    }

    if (parsed) {
      if (Array.isArray(parsed.windows)) {
        const known = new Set(apps.map((a) => a.manifest.id));
        const cleaned = parsed.windows.filter((w) => known.has(w.appId));
        if (cleaned.length) hydrateWindows(cleaned);
      }
      if (typeof parsed.wallpaperId === 'string' && isValidWallpaperId(parsed.wallpaperId)) {
        setWallpaper(parsed.wallpaperId);
      }
      if (parsed.desktopIcons && typeof parsed.desktopIcons === 'object') {
        hydrateIconPositions(parsed.desktopIcons);
      }
      if (parsed.activeWorkspaceId) {
        switchWorkspace(parsed.activeWorkspaceId);
      }
    }
    restoredRef.current = true;
  }, [hydrateWindows, hydrateIconPositions, setWallpaper, switchWorkspace]);

  // 3. Persist the session on every change wrapped in a versioned envelope.
  useEffect(() => {
    const allWindowsList = Object.values(allWindowsMap);
    const envelope = {
      version: CURRENT_SCHEMA_VERSION,
      state: {
        windows: allWindowsList,
        wallpaperId,
        desktopIcons,
        activeWorkspaceId,
      },
    };
    try {
      localStorage.setItem(SESSION_KEY_V3, JSON.stringify(envelope));
    } catch {
      // localStorage quota
    }
  }, [allWindowsMap, wallpaperId, desktopIcons, activeWorkspaceId]);

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

  // Reference reserved for type narrowing even if the menu doesn't use it.
  void DEFAULT_WALLPAPER_ID;
  void appsState;

  return (
    <div className="fixed inset-0 flex flex-col">
      <ThemeApplier />
      <MenuBar />
      <VetoBand />
      <ViewportGuard>
        <div className="flex-1 relative">
          <SnapGhostOverlay target={activeSnapTarget} cadre={cadreBureau()} />
          {domainesVisibles && apps.length > 0 && <DomainsView apps={apps.map((a) => a.manifest)} />}
          <Desk />
          {cmsVisibles && (
            <div className="absolute inset-0 z-30 pb-16">
              <CmsView />
            </div>
          )}
          <Dock />
          <CommandPalette />
          <AppDrawer />
          <ToastContainer />
        </div>
      </ViewportGuard>
    </div>
  );
}

