/**
 * Window chrome — drag, resize, traffic lights, focus.
 *
 * Resize is corner-only (south-east) for V1. Drag is from the title bar.
 * Click on the body brings the window to the front.
 */

import { useEffect, useRef } from 'react';
import type { WindowState } from '../types';
import { useShell } from './store';

interface WindowProps {
  win: WindowState;
  children: React.ReactNode;
}

const MIN_W = 320;
const MIN_H = 200;

export function Window({ win, children }: WindowProps) {
  const close = useShell((s) => s.closeWindow);
  const minimize = useShell((s) => s.minimizeWindow);
  const focus = useShell((s) => s.focusWindow);
  const move = useShell((s) => s.moveWindow);
  const resize = useShell((s) => s.resizeWindow);

  const focused = useShell((s) => s.focused === win.id);
  const dragRef = useRef<{ ox: number; oy: number } | null>(null);
  const resizeRef = useRef<{ ow: number; oh: number } | null>(null);

  // Esc closes — small QoL, deliberately not configurable in V1.
  useEffect(() => {
    if (!focused) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        close(win.id);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [focused, close, win.id]);

  const onTitleMouseDown = (e: React.MouseEvent) => {
    if (e.button !== 0) return;
    focus(win.id);
    dragRef.current = { ox: e.clientX - win.x, oy: e.clientY - win.y };
    const onMove = (ev: MouseEvent) => {
      if (!dragRef.current) return;
      const nx = Math.max(0, ev.clientX - dragRef.current.ox);
      const ny = Math.max(0, ev.clientY - dragRef.current.oy);
      move(win.id, nx, ny);
    };
    const onUp = () => {
      dragRef.current = null;
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('mouseup', onUp);
    };
    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup', onUp);
  };

  const onResizeMouseDown = (e: React.MouseEvent) => {
    if (e.button !== 0) return;
    e.stopPropagation();
    focus(win.id);
    resizeRef.current = { ow: win.w, oh: win.h };
    const startX = e.clientX;
    const startY = e.clientY;
    const onMove = (ev: MouseEvent) => {
      const nw = Math.max(MIN_W, resizeRef.current!.ow + (ev.clientX - startX));
      const nh = Math.max(MIN_H, resizeRef.current!.oh + (ev.clientY - startY));
      resize(win.id, nw, nh);
    };
    const onUp = () => {
      resizeRef.current = null;
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('mouseup', onUp);
    };
    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup', onUp);
  };

  return (
    <div
      onMouseDown={() => focus(win.id)}
      className="absolute window-chrome rounded-lg overflow-hidden flex flex-col"
      style={{
        left: win.x,
        top: win.y,
        width: win.w,
        height: win.h,
        zIndex: win.z,
      }}
    >
      <div
        onMouseDown={onTitleMouseDown}
        onDoubleClick={() => minimize(win.id)}
        className="window-titlebar h-9 flex items-center px-3 gap-2 cursor-grab active:cursor-grabbing select-none"
      >
        <button
          onClick={(e) => {
            e.stopPropagation();
            close(win.id);
          }}
          aria-label="fermer"
          className="traffic-light bg-rose-400 hover:bg-rose-300"
        />
        <button
          onClick={(e) => {
            e.stopPropagation();
            minimize(win.id);
          }}
          aria-label="réduire"
          className="traffic-light bg-amber-400 hover:bg-amber-300"
        />
        <span
          aria-hidden
          className="traffic-light bg-emerald-400/60 cursor-default"
        />
        <div className="flex-1 text-center text-xs text-[var(--color-text-dim)] select-none">
          {win.title}
        </div>
        <div className="w-12" />
      </div>
      <div className="flex-1 min-h-0 overflow-auto scrollbar">{children}</div>
      <div
        onMouseDown={onResizeMouseDown}
        className="absolute right-0 bottom-0 w-3 h-3 cursor-nwse-resize"
        style={{
          background:
            'linear-gradient(135deg, transparent 50%, rgba(255,255,255,0.25) 50%)',
        }}
      />
      {focused && (
        <div
          aria-hidden
          className="absolute inset-0 rounded-lg pointer-events-none"
          style={{
            boxShadow:
              'inset 0 0 0 2px rgba(108, 240, 194, 0.55), 0 0 24px rgba(108, 240, 194, 0.18)',
          }}
        />
      )}
    </div>
  );
}
