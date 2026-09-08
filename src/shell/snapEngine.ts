import type { Cadre } from './store';
import type { WindowId, WindowState } from '../types';

export type SnapPosition =
  | 'left'
  | 'right'
  | 'top-left'
  | 'top-right'
  | 'bottom-left'
  | 'bottom-right'
  | 'maximize'
  | 'center';

export interface SnapGeometry {
  x: number;
  y: number;
  w: number;
  h: number;
  position: SnapPosition;
}

const EDGE_THRESHOLD = 30;
const CORNER_THRESHOLD = 60;

/**
 * Calcule la géométrie résultante d'un positionnement Snap dans le cadre du bureau.
 */
export function getSnapGeometry(pos: SnapPosition, cadre: Cadre): Cadre {
  const halfW = Math.floor(cadre.w / 2);
  const halfH = Math.floor(cadre.h / 2);

  switch (pos) {
    case 'left':
      return { x: cadre.x, y: cadre.y, w: halfW, h: cadre.h };
    case 'right':
      return { x: cadre.x + halfW, y: cadre.y, w: cadre.w - halfW, h: cadre.h };
    case 'top-left':
      return { x: cadre.x, y: cadre.y, w: halfW, h: halfH };
    case 'top-right':
      return { x: cadre.x + halfW, y: cadre.y, w: cadre.w - halfW, h: halfH };
    case 'bottom-left':
      return { x: cadre.x, y: cadre.y + halfH, w: halfW, h: cadre.h - halfH };
    case 'bottom-right':
      return { x: cadre.x + halfW, y: cadre.y + halfH, w: cadre.w - halfW, h: cadre.h - halfH };
    case 'maximize':
      return { x: cadre.x, y: cadre.y, w: cadre.w, h: cadre.h };
    case 'center':
      return {
        x: cadre.x + Math.floor(cadre.w * 0.1),
        y: cadre.y + Math.floor(cadre.h * 0.1),
        w: Math.floor(cadre.w * 0.8),
        h: Math.floor(cadre.h * 0.8),
      };
  }
}

/**
 * Détecte si le curseur de la souris touche une zone d'ancrage Aero Snap
 */
export function detectSnapTarget(cursorX: number, cursorY: number, cadre: Cadre): SnapPosition | null {
  const relX = cursorX - cadre.x;
  const relY = cursorY - cadre.y;

  const isLeft = relX <= EDGE_THRESHOLD;
  const isRight = relX >= cadre.w - EDGE_THRESHOLD;
  const isTop = relY <= EDGE_THRESHOLD;
  const isBottom = relY >= cadre.h - EDGE_THRESHOLD;

  // Coins (Quadrants)
  if (isTop && relX <= CORNER_THRESHOLD) return 'top-left';
  if (isTop && relX >= cadre.w - CORNER_THRESHOLD) return 'top-right';
  if (isBottom && relX <= CORNER_THRESHOLD) return 'bottom-left';
  if (isBottom && relX >= cadre.w - CORNER_THRESHOLD) return 'bottom-right';

  // Bords
  if (isTop) return 'maximize';
  if (isLeft) return 'left';
  if (isRight) return 'right';

  return null;
}

/**
 * Calcule l'agencement scindé en 2 (Split Horizontal 50/50)
 */
export function computeSplitHorizontal(wins: WindowState[], cadre: Cadre): Array<{ id: WindowId; geom: Cadre }> {
  if (wins.length === 0) return [];
  if (wins.length === 1) {
    return [{ id: wins[0].id, geom: getSnapGeometry('maximize', cadre) }];
  }
  const halfW = Math.floor(cadre.w / 2);
  return [
    { id: wins[0].id, geom: { x: cadre.x, y: cadre.y, w: halfW, h: cadre.h } },
    { id: wins[1].id, geom: { x: cadre.x + halfW, y: cadre.y, w: cadre.w - halfW, h: cadre.h } },
  ];
}

/**
 * Calcule l'agencement scindé verticalement (Split Vertical 50/50)
 */
export function computeSplitVertical(wins: WindowState[], cadre: Cadre): Array<{ id: WindowId; geom: Cadre }> {
  if (wins.length === 0) return [];
  if (wins.length === 1) {
    return [{ id: wins[0].id, geom: getSnapGeometry('maximize', cadre) }];
  }
  const halfH = Math.floor(cadre.h / 2);
  return [
    { id: wins[0].id, geom: { x: cadre.x, y: cadre.y, w: cadre.w, h: halfH } },
    { id: wins[1].id, geom: { x: cadre.x, y: cadre.y + halfH, w: cadre.w, h: cadre.h - halfH } },
  ];
}

/**
 * Calcule l'agencement en 4 quadrants (Grid 4)
 */
export function computeGrid4(wins: WindowState[], cadre: Cadre): Array<{ id: WindowId; geom: Cadre }> {
  const slots: SnapPosition[] = ['top-left', 'top-right', 'bottom-left', 'bottom-right'];
  return wins.slice(0, 4).map((w, idx) => ({
    id: w.id,
    geom: getSnapGeometry(slots[idx], cadre),
  }));
}

/**
 * Calcule l'agencement en cascade classique
 */
export function computeCascade(wins: WindowState[], cadre: Cadre): Array<{ id: WindowId; geom: Cadre }> {
  const baseW = Math.min(840, Math.floor(cadre.w * 0.7));
  const baseH = Math.min(560, Math.floor(cadre.h * 0.7));
  const step = 32;

  return wins.map((w, idx) => {
    const offset = (idx * step) % Math.max(100, Math.min(cadre.w - baseW, cadre.h - baseH));
    return {
      id: w.id,
      geom: {
        x: cadre.x + offset,
        y: cadre.y + offset,
        w: baseW,
        h: baseH,
      },
    };
  });
}
