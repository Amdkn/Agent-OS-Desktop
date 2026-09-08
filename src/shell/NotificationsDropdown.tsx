import { useEffect, useRef, useState } from 'react';
import { useShell, type Notification } from './store';

function formatRelative(ts: number): string {
  const delta = Math.max(0, Date.now() - ts);
  const sec = Math.floor(delta / 1000);
  if (sec < 5) return 'à l’instant';
  if (sec < 60) return `il y a ${sec}s`;
  const min = Math.floor(sec / 60);
  if (min < 60) return `il y a ${min} min`;
  const hr = Math.floor(min / 60);
  if (hr < 24) return `il y a ${hr} h`;
  const day = Math.floor(hr / 24);
  return `il y a ${day} j`;
}

const TYPE_COLORS: Record<Notification['type'], string> = {
  info: '#3b82f6',
  success: '#22c55e',
  warning: '#f59e0b',
  error: '#ef4444',
};

export function NotificationsDropdown() {
  const notifications = useShell((s) => s.notifications);
  const unreadCount = useShell((s) => s.notificationCount);
  const clearNotifications = useShell((s) => s.clearNotifications);
  const dismissAllNotifications = useShell((s) => s.dismissAllNotifications);
  const dismissNotification = useShell((s) => s.dismissNotification);

  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent): void => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    const onKey = (e: KeyboardEvent): void => {
      if (e.key === 'Escape') setOpen(false);
    };
    document.addEventListener('mousedown', onDown);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onDown);
      document.removeEventListener('keydown', onKey);
    };
  }, [open]);

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-label="Notifications"
        className="relative h-6 w-6 rounded flex items-center justify-center transition-colors hover:bg-white/10 text-white/70 hover:text-white"
        title="Centre de notifications"
      >
        <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
          <path d="M13.73 21a2 2 0 0 1-3.46 0" />
        </svg>
        {unreadCount > 0 && (
          <span
            className="absolute -top-1 -right-1 text-white text-[8px] font-bold rounded-full min-w-[14px] h-[14px] flex items-center justify-center px-0.5"
            style={{ background: 'var(--theme-accent, #06b6d4)', boxShadow: '0 0 4px rgba(0,0,0,0.5)' }}
          >
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <div
          role="menu"
          aria-label="Notifications"
          className="absolute right-0 top-full mt-2 z-[5100] w-[320px] rounded-2xl overflow-hidden flex flex-col border border-white/10 shadow-2xl"
          style={{
            background: 'rgba(15, 23, 42, 0.95)',
            backdropFilter: 'blur(24px) saturate(180%)',
            maxHeight: 'min(65vh, 460px)',
          }}
        >
          {/* Header */}
          <div className="flex items-center justify-between gap-2 px-3.5 py-2.5 text-[11px] font-bold uppercase tracking-wider text-white/60 border-b border-white/10 bg-white/5">
            <span>Notifications ({notifications.length})</span>
            {notifications.length > 0 && (
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={clearNotifications}
                  disabled={unreadCount === 0}
                  className="text-[10px] font-semibold text-cyan-400 hover:underline disabled:opacity-40 disabled:no-underline"
                >
                  Tout marquer lu
                </button>
                <button
                  type="button"
                  onClick={dismissAllNotifications}
                  className="text-[10px] font-semibold text-rose-400/80 hover:text-rose-300"
                  title="Effacer tout"
                >
                  Effacer
                </button>
              </div>
            )}
          </div>

          {/* List */}
          <div className="flex-1 overflow-y-auto">
            {notifications.length === 0 ? (
              <div className="px-4 py-8 text-center text-xs text-white/40">
                Aucune notification pour le moment
              </div>
            ) : (
              notifications.map((n) => (
                <div
                  key={n.id}
                  className="flex items-start gap-2.5 px-3 py-2.5 border-b border-white/5 hover:bg-white/5 transition-colors"
                  style={{
                    background: n.read ? 'transparent' : 'rgba(6, 182, 212, 0.08)',
                  }}
                >
                  <div
                    className="w-2 h-2 shrink-0 rounded-full mt-1.5"
                    style={{
                      backgroundColor: TYPE_COLORS[n.type] || '#3b82f6',
                      boxShadow: `0 0 6px ${TYPE_COLORS[n.type] || '#3b82f6'}`,
                    }}
                  />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-1">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-white/50 truncate">
                        {n.source || 'Agent OS'}
                      </span>
                      <span className="text-[9px] text-white/40 shrink-0">
                        {formatRelative(n.timestamp)}
                      </span>
                    </div>
                    <div className="text-xs text-white/90 mt-0.5 leading-snug break-words">
                      {n.message}
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => dismissNotification(n.id)}
                    aria-label="Supprimer"
                    className="shrink-0 text-white/30 hover:text-white/80 p-0.5"
                  >
                    <svg className="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M18 6L6 18M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
