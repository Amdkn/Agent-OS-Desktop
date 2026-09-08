import type { SnapPosition } from './snapEngine';
import { getSnapGeometry } from './snapEngine';
import type { Cadre } from './store';

interface SnapGhostOverlayProps {
  target: SnapPosition | null;
  cadre: Cadre;
}

export function SnapGhostOverlay({ target, cadre }: SnapGhostOverlayProps) {
  if (!target) return null;

  const geom = getSnapGeometry(target, cadre);

  return (
    <div
      className="absolute pointer-events-none transition-all duration-150 ease-out z-[9999]"
      style={{
        left: geom.x + 6,
        top: geom.y + 6,
        width: Math.max(0, geom.w - 12),
        height: Math.max(0, geom.h - 12),
      }}
    >
      <div
        className="w-full h-full rounded-xl border-2 border-[var(--color-accent)]/80 bg-[var(--color-accent)]/15 shadow-2xl backdrop-blur-md flex items-center justify-center animate-pulse"
      >
        <div className="px-3 py-1.5 rounded-md bg-black/60 border border-[var(--color-accent)]/40 text-[var(--color-accent)] text-xs font-mono tracking-wider uppercase">
          Ancrage · {target}
        </div>
      </div>
    </div>
  );
}
