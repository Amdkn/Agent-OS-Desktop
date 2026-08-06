/**
 * Menu bar — the top chrome.
 *
 * Single global menu. Left: app name. Center: a few top-level menus that
 * show their dropdown on hover. Right: a clock.
 *
 * The "Fichier" menu is the only one wired up — it owns the export/import
 * actions. The rest are placeholders so the bar reads as a real menubar.
 */

import { useEffect, useState } from 'react';
import { useStorage } from '../storage/useStorage';
import { downloadSnapshot, importSnapshotFromFile } from '../storage/backup';

function useClock() {
  const [now, setNow] = useState(() => new Date());
  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 30_000);
    return () => clearInterval(id);
  }, []);
  return now;
}

export function MenuBar() {
  const now = useClock();
  const adapter = useStorage();
  const [open, setOpen] = useState<string | null>(null);

  const handleExport = async () => {
    setOpen(null);
    await downloadSnapshot(adapter);
  };

  const handleImport = () => {
    setOpen(null);
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'application/json';
    input.onchange = () => {
      const f = input.files?.[0];
      if (f) importSnapshotFromFile(adapter, f).catch(() => undefined);
    };
    input.click();
  };

  const menus = [
    {
      label: 'Agent OS',
      items: [
        { label: 'à propos de Agent OS', action: () => alert('Agent OS V1 — bureau libre') },
      ],
    },
    {
      label: 'Fichier',
      items: [
        { label: 'Exporter un instantané…', action: handleExport },
        { label: 'Importer un instantané…', action: handleImport },
      ],
    },
    {
      label: 'Édition',
      items: [
        { label: '—', action: () => undefined },
      ],
    },
    {
      label: 'Affichage',
      items: [
        { label: '—', action: () => undefined },
      ],
    },
    {
      label: 'Fenêtre',
      items: [
        { label: '—', action: () => undefined },
      ],
    },
  ];

  return (
    <div
      className="relative z-50 h-8 px-3 flex items-center gap-1 text-xs border-b"
      style={{
        background: 'var(--color-bar)',
        borderColor: 'var(--color-bar-border)',
        backdropFilter: 'blur(12px)',
      }}
      onMouseLeave={() => setOpen(null)}
    >
      <div className="w-5 h-5 rounded-sm bg-[var(--color-accent)]/80 mr-2" />
      {menus.map((m) => (
        <button
          key={m.label}
          onMouseEnter={() => setOpen(m.label)}
          onClick={() => setOpen((cur) => (cur === m.label ? null : m.label))}
          className={`px-2 py-1 rounded transition-colors ${
            open === m.label ? 'bg-white/10' : 'hover:bg-white/5'
          }`}
        >
          {m.label}
        </button>
      ))}
      <div className="flex-1" />
      <div className="font-mono text-[10px] text-[var(--color-text-dim)] mr-2">
        {adapter.label}
      </div>
      <div className="font-mono text-[11px] text-[var(--color-text-dim)]">
        {now.toLocaleString('fr-FR', {
          weekday: 'short',
          day: '2-digit',
          month: 'short',
          hour: '2-digit',
          minute: '2-digit',
        })}
      </div>
      {open && (
        <div
          className="absolute top-full left-0 mt-0 min-w-[200px] window-chrome rounded-md py-1 text-xs"
          onMouseEnter={() => setOpen(open)}
        >
          {menus
            .find((m) => m.label === open)!
            .items.map((it, i) => (
              <button
                key={i}
                onClick={it.action}
                className="w-full text-left px-3 py-1.5 hover:bg-[var(--color-accent)]/15 hover:text-[var(--color-accent)] disabled:opacity-50"
                disabled={it.label === '—'}
              >
                {it.label}
              </button>
            ))}
        </div>
      )}
    </div>
  );
}
