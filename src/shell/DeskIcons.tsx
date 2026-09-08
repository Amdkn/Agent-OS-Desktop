/**
 * Desktop icons.
 *
 * One per registered app, taking its manifest from the open registry.
 * Adding an app folder under src/apps/ drops a new icon here without any
 * edit to this file — that's the whole point of the registry being open.
 *
 * Behavior:
 *   - single click selects (visual ring around the chosen icon)
 *   - double click opens (uses the same openWindow path as the dock)
 *   - drag persists — the cumulative-cursor-delta trap is avoided by
 *     recomputing the icon position from the cursor and the offset
 *     captured on mousedown.
 *
 * The desk background still lets pointer-events fall through where there's
 * no icon, so an empty area of the desktop is also "click to deselect".
 */

import { useEffect, useRef } from 'react';
import type { AppManifest } from '../types';
import { useShell } from './store';

interface IconPos {
  x: number;
  y: number;
}

interface DeskIconsProps {
  /** Position resolved in Desk.tsx — persisted values win, missing apps get the next free cell. */
  layout: Record<string, IconPos>;
}

export function DeskIcons({ layout }: DeskIconsProps) {
  const apps = useShell((s) => s.apps);
  const open = useShell((s) => s.openWindow);
  const selectedIcon = useShell((s) => s.selectedIcon);
  const selectIcon = useShell((s) => s.selectDesktopIcon);
  const moveIcon = useShell((s) => s.moveDesktopIcon);

  // Cursor position captured on mousedown. Recomputing absolute position
  // from cursor - capturedStartCursor + iconStartPosition is what avoids
  // a drift every frame.
  const dragRef = useRef<{
    appId: string;
    cursorStartX: number;
    cursorStartY: number;
    iconStartX: number;
    iconStartY: number;
  } | null>(null);

  // Deselect when clicking an empty area of the desk.
  useEffect(() => {
    const onDocMouseDown = (e: MouseEvent) => {
      const target = e.target as HTMLElement | null;
      if (!target) return;
      // If the click landed inside an icon, the icon will handle it (and decide whether to select).
      if (target.closest('[data-desktop-icon]')) return;
      if (selectedIcon !== null) selectIcon(null);
    };
    window.addEventListener('mousedown', onDocMouseDown);
    return () => window.removeEventListener('mousedown', onDocMouseDown);
  }, [selectedIcon, selectIcon]);

  if (!apps.length) return null;

  return (
    <div
      className="absolute inset-0 pointer-events-none"
      data-desktop-icons-layer
    >
      {apps.map((app) => {
        const pos = layout[app.id];
        if (!pos) return null;
        const selected = selectedIcon === app.id;
        return (
          <DesktopIcon
            key={app.id}
            app={app}
            x={pos.x}
            y={pos.y}
            selected={selected}
            onSelect={() => selectIcon(app.id)}
            onOpen={() => open(app.id)}
            onDragStart={(cursorX, cursorY) => {
              dragRef.current = {
                appId: app.id,
                cursorStartX: cursorX,
                cursorStartY: cursorY,
                iconStartX: pos.x,
                iconStartY: pos.y,
              };
              // The icon stays selected while being dragged.
              selectIcon(app.id);
            }}
            onDragMove={(cursorX, cursorY) => {
              const snap = dragRef.current;
              if (!snap) return;
              // Absolute position: icon start + (cursor - start cursor).
              // Never accumulate — that's the whole point.
              const nx = snap.iconStartX + (cursorX - snap.cursorStartX);
              const ny = snap.iconStartY + (cursorY - snap.cursorStartY);
              moveIcon(app.id, Math.max(0, nx), Math.max(0, ny));
            }}
            onDragEnd={() => {
              dragRef.current = null;
            }}
          />
        );
      })}
    </div>
  );
}

interface DesktopIconProps {
  app: AppManifest;
  x: number;
  y: number;
  selected: boolean;
  onSelect: () => void;
  onOpen: () => void;
  onDragStart: (cursorX: number, cursorY: number) => void;
  onDragMove: (cursorX: number, cursorY: number) => void;
  onDragEnd: () => void;
}

function DesktopIcon({
  app,
  x,
  y,
  selected,
  onSelect,
  onOpen,
  onDragStart,
  onDragMove,
  onDragEnd,
}: DesktopIconProps) {
  // Track whether the mousedown turned into an actual drag, so a click that
  // happens to wiggle a pixel or two still counts as a click.
  const movedRef = useRef(false);

  const onMouseDown = (e: React.MouseEvent) => {
    if (e.button !== 0) return;
    e.stopPropagation();
    e.preventDefault();
    movedRef.current = false;
    onDragStart(e.clientX, e.clientY);

    // Track cursor on document — React's synthetic events stop firing once
    // the cursor leaves the icon's painted area, which is exactly when we
    // still need the move events.
    const startCursorX = e.clientX;
    const startCursorY = e.clientY;
    const DRAG_THRESHOLD = 3;

    const onMove = (ev: MouseEvent) => {
      if (
        !movedRef.current &&
        (Math.abs(ev.clientX - startCursorX) > DRAG_THRESHOLD ||
          Math.abs(ev.clientY - startCursorY) > DRAG_THRESHOLD)
      ) {
        movedRef.current = true;
      }
      onDragMove(ev.clientX, ev.clientY);
    };
    const onUp = () => {
      onDragEnd();
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('mouseup', onUp);
    };
    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup', onUp);
  };

  return (
    <div
      data-desktop-icon={app.id}
      onMouseDown={onMouseDown}
      onClick={(e) => {
        e.stopPropagation();
        // A drag ends with a mouseup; onClick only fires when the mouse didn't move.
        if (!movedRef.current) onSelect();
      }}
      onDoubleClick={(e) => {
        e.stopPropagation();
        if (!movedRef.current) onOpen();
      }}
      className="absolute pointer-events-auto select-none"
      style={{
        left: x,
        top: y,
        width: 96,
      }}
    >
      <div
        className="flex flex-col items-center gap-1 px-1 py-1 rounded-md cursor-pointer"
        style={{
          background: selected ? 'rgba(108, 240, 194, 0.18)' : 'transparent',
          border: selected
            ? '1px solid rgba(108, 240, 194, 0.55)'
            : '1px solid transparent',
        }}
      >
        <div
          className="w-14 h-14 rounded-lg flex items-center justify-center text-2xl"
          style={{
            background: 'rgba(20, 24, 38, 0.65)',
            border: '1px solid rgba(255, 255, 255, 0.08)',
            backdropFilter: 'blur(6px)',
          }}
        >
          <span>{app.icon}</span>
        </div>
        <div
          className="text-[11px] text-center leading-tight px-1.5 py-0.5 rounded w-full"
          style={{
            color: 'var(--color-text)',
            background: selected ? 'rgba(5,9,19,0.55)' : 'transparent',
          }}
        >
          {app.name}
        </div>
      </div>
    </div>
  );
}
