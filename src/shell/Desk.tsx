/**
 * Desk — the desktop background and the place where windows live.
 *
 * Two visual elements:
 *   - a subtle radial gradient (defined in index.css)
 *   - a small "Agent OS" badge in the bottom-right with a one-line caption
 *     (the visual analogue of RyOS's Rover — small, decorative, dead simple)
 *
 * Windows are rendered in stacking order (z) so the topmost appears last.
 */

import { useOrderedWindows } from './store';
import { Window } from './Window';
import { getApp } from '../apps/registry';

export function Desk() {
  const windows = useOrderedWindows();
  const sorted = [...windows].sort((a, b) => a.z - b.z);

  return (
    <div className="absolute inset-0 desk-bg overflow-hidden">
      {sorted.map((w) => {
        if (w.minimized) return null;
        const app = getApp(w.appId);
        if (!app) return null;
        const Component = app.component as React.ComponentType;
        return (
          <Window key={w.id} win={w}>
            <Component />
          </Window>
        );
      })}
      <div className="absolute bottom-3 right-3 text-[10px] text-[var(--color-text-dim)] font-mono opacity-60 select-none pointer-events-none">
        Agent OS · V1
      </div>
    </div>
  );
}
