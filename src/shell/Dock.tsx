/**
 * Dock — the bottom launcher.
 *
 * One button per registered app. Clicking an app opens (or focuses) a
 * window. Singleton apps (none in V1) would just refocus.
 */

import { useShell, useOrderedWindows } from './store';

export function Dock() {
  const apps = useShell((s) => s.apps);
  const open = useShell((s) => s.openWindow);
  const openWindows = useOrderedWindows();
  const focused = useShell((s) => s.focused);

  // For each app, is there at least one open window?
  const openByApp = new Map<string, number>();
  for (const w of openWindows) {
    openByApp.set(w.appId, (openByApp.get(w.appId) ?? 0) + 1);
  }

  return (
    <div className="absolute bottom-3 left-1/2 -translate-x-1/2 z-40">
      <div
        className="flex items-end gap-1.5 px-2 py-1.5 rounded-xl border"
        style={{
          background: 'var(--color-bar)',
          borderColor: 'var(--color-bar-border)',
          backdropFilter: 'blur(14px)',
          boxShadow: '0 10px 30px rgba(0,0,0,0.5)',
        }}
      >
        {apps.map((app) => {
          const count = openByApp.get(app.id) ?? 0;
          const running = count > 0;
          const isFocused = Array.from(openByApp.entries()).some(([aid]) => aid === app.id) &&
            openWindows.some((w) => w.appId === app.id && w.id === focused);
          return (
            <button
              key={app.id}
              onClick={() => open(app.id)}
              title={app.description}
              className="group relative w-11 h-11 rounded-lg flex items-center justify-center text-2xl hover:scale-110 transition-transform"
              style={{
                background: isFocused
                  ? 'rgba(108, 240, 194, 0.18)'
                  : 'rgba(255, 255, 255, 0.04)',
                border: '1px solid rgba(255,255,255,0.08)',
              }}
            >
              <span>{app.icon}</span>
              {running && (
                <span
                  className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-[var(--color-accent)]"
                  aria-hidden
                />
              )}
              <span
                className="absolute bottom-full mb-2 left-1/2 -translate-x-1/2 px-2 py-1 rounded text-[10px] whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none"
                style={{
                  background: 'var(--color-window-title)',
                  border: '1px solid var(--color-window-border)',
                }}
              >
                {app.name}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
