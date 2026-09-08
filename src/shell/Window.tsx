/**
 * Window chrome — drag, resize, traffic lights, focus.
 *
 * Resize handles on every edge and every corner: dragging by the south-east
 * corner only was the bare minimum and a constant reminder of what was
 * missing. The minimum size keeps a window from collapsing into something
 * unusable.
 *
 * Drag math: the handler captures the cursor's starting position once on
 * mousedown; every subsequent move recomputes absolute position from the
 * stored offset — never from the previous event. That's what stops the
 * cumulative drift where a window falls behind the cursor after a few
 * seconds of dragging.
 */

import { useEffect, useRef } from 'react';
import type { WindowState } from '../types';
import { useShell, borner, type Cadre } from './store';
import { detectSnapTarget } from './snapEngine';
import { WindowNavProvider, useWindowNav } from './WindowNavContext';
import { Breadcrumbs } from './Breadcrumbs';
import { useThemeFor } from '../themes/store';

/** Zone utilisable du bureau : sous la barre de menus, au-dessus ou à gauche du dock. */
const HAUT_BARRE = 32;
const BAS_DOCK = 58;
const DROITE_DOCK = 58;

export function cadreBureau(): Cadre {
  const dockPos = useShell.getState().dockPosition;
  const isRight = dockPos === 'right';
  return {
    x: 0,
    y: HAUT_BARRE,
    w: Math.max(320, window.innerWidth - (isRight ? DROITE_DOCK : 0)),
    h: Math.max(240, window.innerHeight - HAUT_BARRE - (isRight ? 8 : BAS_DOCK)),
  };
}

interface WindowProps {
  win: WindowState;
  children: React.ReactNode;
}

const MIN_W = 320;
const MIN_H = 200;

/** Which edges the resize affects. The cardinal letters are bit flags. */
type Edge = 'n' | 's' | 'e' | 'w' | 'ne' | 'nw' | 'se' | 'sw';

const EDGES: Edge[] = ['n', 's', 'e', 'w', 'ne', 'nw', 'se', 'sw'];

interface ResizeStart {
  // Where the cursor was when the drag started.
  startCursorX: number;
  startCursorY: number;
  // Window geometry at the same moment.
  startX: number;
  startY: number;
  startW: number;
  startH: number;
  edge: Edge;
}

function WindowTitleBarContent({
  win,
  onTitleMouseDown,
  minimize,
  close,
  toggleMaximize,
  togglePinWindow,
  snapWindow,
}: {
  win: WindowState;
  onTitleMouseDown: (e: React.MouseEvent) => void;
  minimize: (id: string) => void;
  close: (id: string) => void;
  toggleMaximize: (id: string, cadre: Cadre) => void;
  togglePinWindow: (id: string) => void;
  snapWindow: (id: string, pos: 'left' | 'right', cadre: Cadre) => void;
}) {
  const nav = useWindowNav();

  return (
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
      <button
        onClick={(e) => {
          e.stopPropagation();
          toggleMaximize(win.id, cadreBureau());
        }}
        aria-label={win.maximized ? 'restaurer' : 'plein ecran'}
        title={win.maximized ? 'restaurer' : 'plein ecran'}
        className="traffic-light bg-emerald-400 hover:bg-emerald-300"
      />

      <div className="flex-1 flex items-center min-w-0 px-2 overflow-hidden">
        {nav ? (
          <Breadcrumbs
            appTitle={win.title}
            activePage={nav.activePage}
            detailLabel={nav.detailLabel}
            onBackToActivePage={nav.backToActivePage}
          />
        ) : (
          <div className="text-xs text-[var(--color-text-dim)] truncate">
            {win.title}
          </div>
        )}
      </div>

      <div className="flex items-center gap-1 shrink-0">
        <button
          onClick={(e) => {
            e.stopPropagation();
            togglePinWindow(win.id);
          }}
          title={win.pinned ? 'Désépingler PiP' : 'Épingler au premier plan (PiP)'}
          className={`px-1.5 py-0.5 rounded text-[10px] transition-colors ${
            win.pinned
              ? 'bg-[var(--color-accent)] text-black font-semibold shadow-sm'
              : 'text-[var(--color-text-dim)] hover:text-white hover:bg-white/10'
          }`}
        >
          📌
        </button>
        <button
          onClick={(e) => {
            e.stopPropagation();
            snapWindow(win.id, 'left', cadreBureau());
          }}
          title="Ancrer à gauche (50%)"
          className="px-1 py-0.5 rounded text-[10px] text-[var(--color-text-dim)] hover:text-white hover:bg-white/10"
        >
          ◧
        </button>
        <button
          onClick={(e) => {
            e.stopPropagation();
            snapWindow(win.id, 'right', cadreBureau());
          }}
          title="Ancrer à droite (50%)"
          className="px-1 py-0.5 rounded text-[10px] text-[var(--color-text-dim)] hover:text-white hover:bg-white/10"
        >
          ◨
        </button>
      </div>
    </div>
  );
}

export function Window({ win, children }: WindowProps) {
  const close = useShell((s) => s.closeWindow);
  const minimize = useShell((s) => s.minimizeWindow);
  const focus = useShell((s) => s.focusWindow);
  const move = useShell((s) => s.moveWindow);
  const resize = useShell((s) => s.resizeWindow);
  const toggleMaximize = useShell((s) => s.toggleMaximize);
  const snapWindow = useShell((s) => s.snapWindow);
  const togglePinWindow = useShell((s) => s.togglePinWindow);
  const setActiveSnapTarget = useShell((s) => s.setActiveSnapTarget);

  const theme = useThemeFor(win.appId);

  const focused = useShell((s) => s.focused === win.id);
  const dragRef = useRef<{ ox: number; oy: number } | null>(null);
  const resizeRef = useRef<ResizeStart | null>(null);

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
      const snap = dragRef.current;
      if (!snap) return;
      const nx = Math.max(0, ev.clientX - snap.ox);
      const ny = Math.max(0, ev.clientY - snap.oy);
      move(win.id, nx, ny);

      // Aero Snap detection
      const target = detectSnapTarget(ev.clientX, ev.clientY, cadreBureau());
      setActiveSnapTarget(target);
    };
    const onUp = (ev: MouseEvent) => {
      dragRef.current = null;
      setActiveSnapTarget(null);
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('mouseup', onUp);

      // Si relâché sur une zone de snap, appliquer
      const snapTarget = detectSnapTarget(ev.clientX, ev.clientY, cadreBureau());
      if (snapTarget) {
        snapWindow(win.id, snapTarget, cadreBureau());
      }
    };
    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup', onUp);
  };

  const onResizeMouseDown = (edge: Edge) => (e: React.MouseEvent) => {
    if (e.button !== 0) return;
    e.stopPropagation();
    focus(win.id);
    resizeRef.current = {
      startCursorX: e.clientX,
      startCursorY: e.clientY,
      startX: win.x,
      startY: win.y,
      startW: win.w,
      startH: win.h,
      edge,
    };
    const onMove = (ev: MouseEvent) => {
      const s = resizeRef.current;
      if (!s) return;
      const dx = ev.clientX - s.startCursorX;
      const dy = ev.clientY - s.startCursorY;

      let nx = s.startX;
      let ny = s.startY;
      let nw = s.startW;
      let nh = s.startH;

      const affectsW = s.edge.includes('w');
      const affectsE = s.edge.includes('e');
      const affectsN = s.edge.includes('n');
      const affectsS = s.edge.includes('s');

      if (affectsE) nw = Math.max(MIN_W, s.startW + dx);
      if (affectsS) nh = Math.max(MIN_H, s.startH + dy);
      if (affectsW) {
        const proposed = s.startW - dx;
        nw = Math.max(MIN_W, proposed);
        nx = s.startX + (s.startW - nw);
      }
      if (affectsN) {
        const proposed = s.startH - dy;
        nh = Math.max(MIN_H, proposed);
        ny = s.startY + (s.startH - nh);
      }

      void affectsW; void affectsE; void affectsN; void affectsS;

      const g = borner({ x: nx, y: ny, w: nw, h: nh }, cadreBureau(), MIN_W, MIN_H);
      resize(win.id, g.w, g.h);
      move(win.id, g.x, g.y);
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
    <WindowNavProvider>
      <div
        onMouseDown={() => focus(win.id)}
        className="absolute window-chrome rounded-lg overflow-hidden flex flex-col transition-shadow duration-200"
        style={{
          left: win.x,
          top: win.y,
          width: win.w,
          height: win.h,
          zIndex: win.z,
          boxShadow: focused ? `0 16px 48px -12px ${theme.accent}40, 0 0 0 1px ${theme.border}` : '0 10px 30px -10px rgba(0,0,0,0.5)',
          borderRadius: theme.radius || '12px',
        }}
      >
        <WindowTitleBarContent
          win={win}
          onTitleMouseDown={onTitleMouseDown}
          minimize={minimize}
          close={close}
          toggleMaximize={toggleMaximize}
          togglePinWindow={togglePinWindow}
          snapWindow={snapWindow}
        />

        <div className="flex-1 min-h-0 overflow-auto scrollbar">{children}</div>

        {!win.maximized &&
          EDGES.map((edge) => (
            <ResizeHandle key={edge} edge={edge} onMouseDown={onResizeMouseDown(edge)} />
          ))}

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
    </WindowNavProvider>
  );
}

interface ResizeHandleProps {
  edge: Edge;
  onMouseDown: (e: React.MouseEvent) => void;
}

function ResizeHandle({ edge, onMouseDown }: ResizeHandleProps) {
  const cursor = CURSOR_BY_EDGE[edge];
  const style = STYLE_BY_EDGE[edge];
  return (
    <div
      onMouseDown={onMouseDown}
      aria-hidden
      className="absolute"
      // z-index au-dessus du contenu : sans lui, le corps de la fenetre recouvre
      // les poignees laterales et le redimensionnement ne repond que par le haut
      // et le bas, par accident.
      style={{ ...style, cursor, zIndex: 20 }}
    />
  );
}

const CURSOR_BY_EDGE: Record<Edge, string> = {
  n: 'ns-resize',
  s: 'ns-resize',
  e: 'ew-resize',
  w: 'ew-resize',
  ne: 'nesw-resize',
  nw: 'nwse-resize',
  se: 'nwse-resize',
  sw: 'nesw-resize',
};

const STYLE_BY_EDGE: Record<Edge, React.CSSProperties> = {
  // 8 px, pas 4 : viser une bande de 4 px a la souris est un exercice d'adresse.
  n: { top: 0, left: '14px', right: '14px', height: '8px' },
  s: { bottom: 0, left: '14px', right: '14px', height: '8px' },
  e: { top: '14px', bottom: '14px', right: 0, width: '8px' },
  w: { top: '14px', bottom: '14px', left: 0, width: '8px' },
  ne: { top: 0, right: 0, width: '14px', height: '14px' },
  nw: { top: 0, left: 0, width: '14px', height: '14px' },
  se: { bottom: 0, right: 0, width: '14px', height: '14px' },
  sw: { bottom: 0, left: 0, width: '14px', height: '14px' },
};
