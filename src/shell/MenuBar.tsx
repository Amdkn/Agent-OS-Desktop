import { useEffect, useState } from 'react';
import { useStorage } from '../storage/useStorage';
import { downloadSnapshot, importSnapshotFromFile } from '../storage/backup';
import { useShell } from './store';
import { WALLPAPERS } from './wallpaper';
import { exportDesktopTemplate, importDesktopTemplate } from '../blueprints/templateManager';
import { cadreBureau } from './Window';
import { NotificationsDropdown } from './NotificationsDropdown';
import { useThemeStore } from '../themes/store';
import { THEME_META } from '../themes/tokens';

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
  const wallpaperId = useShell((s) => s.wallpaperId);
  const setWallpaper = useShell((s) => s.setWallpaper);
  const workspaces = useShell((s) => s.workspaces);
  const activeWorkspaceId = useShell((s) => s.activeWorkspaceId);
  const switchWorkspace = useShell((s) => s.switchWorkspace);
  const tileWindows = useShell((s) => s.tileWindows);
  const toggleCommandPalette = useShell((s) => s.toggleCommandPalette);

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

  const handleImportTemplate = () => {
    setOpen(null);
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'application/json';
    input.onchange = () => {
      const f = input.files?.[0];
      if (f) {
        importDesktopTemplate(f).then((res) => {
          alert(res.message);
        }).catch(() => undefined);
      }
    };
    input.click();
  };

  const menus = [
    {
      label: 'Agent OS',
      items: [
        { label: 'à propos de Agent OS V3', action: () => alert('Agent OS V3 — Template Reproductible de Web Desktop & Standard Business OS (Loi L0 Rick)') },
        { label: 'Ouvrir Command Palette (⌘K)', action: () => { toggleCommandPalette(); setOpen(null); } },
      ],
    },
    {
      label: 'Fichier',
      items: [
        { label: 'Exporter le Template de Bureau V3 (JSON)…', action: () => { exportDesktopTemplate(); setOpen(null); } },
        { label: 'Importer un Template de Bureau V3 (JSON)…', action: handleImportTemplate },
        { label: '—', action: () => undefined },
        { label: 'Exporter un instantané SQLite/Stockage…', action: handleExport },
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
        { label: 'Command Palette (⌘K / Ctrl+K)', action: () => { toggleCommandPalette(); setOpen(null); } },
        { label: 'Vue CMS Hiérarchique (Agent OS V2)', action: () => { useShell.getState().toggleCms(); setOpen(null); } },
        { label: 'Vue par domaines (Life OS)', action: () => { useShell.getState().toggleDomaines(); setOpen(null); } },
        { label: '—', action: () => undefined },
        ...WALLPAPERS.map((w) => ({
          label: `${wallpaperId === w.id ? '✓ ' : '   '}${w.label}`,
          action: () => {
            setWallpaper(w.id);
            setOpen(null);
          },
        })),
      ],
    },
    {
      label: 'Thème',
      items: [
        ...THEME_META.map((t) => ({
          label: `${useThemeStore.getState().globalTheme === t.id ? '✓ ' : '   '}${t.name} (${t.mood})`,
          action: () => {
            useThemeStore.getState().setGlobalTheme(t.id);
            setOpen(null);
          },
        })),
      ],
    },
    {
      label: 'Fenêtre',
      items: [
        { label: 'Scinder Horizontalement (50/50)', action: () => { tileWindows('split-h', cadreBureau()); setOpen(null); } },
        { label: 'Scinder Verticalement (50/50)', action: () => { tileWindows('split-v', cadreBureau()); setOpen(null); } },
        { label: 'Grille 4 Quadrants (25%)', action: () => { tileWindows('grid-4', cadreBureau()); setOpen(null); } },
        { label: 'Réorganiser en Cascade', action: () => { tileWindows('cascade', cadreBureau()); setOpen(null); } },
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
          type="button"
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

      {/* Sélecteur de Workspaces V3 */}
      <div className="flex items-center gap-1 mx-2 px-1 py-0.5 rounded-lg bg-black/40 border border-white/10 font-mono text-[11px]">
        {workspaces.map((ws) => (
          <button
            type="button"
            key={ws.id}
            onClick={() => switchWorkspace(ws.id)}
            className={`px-2 py-0.5 rounded transition-all flex items-center gap-1 ${
              activeWorkspaceId === ws.id
                ? 'bg-[var(--color-accent)] text-black font-bold shadow-sm'
                : 'text-[var(--color-text-dim)] hover:text-white hover:bg-white/10'
            }`}
          >
            <span>{ws.icon}</span>
            <span className="hidden sm:inline">{ws.name}</span>
          </button>
        ))}
      </div>

      <div className="flex-1" />
      <button
        type="button"
        onClick={toggleCommandPalette}
        aria-label="Ouvrir la Command Palette universelle"
        title="Ouvrir la Command Palette universelle (Ctrl+K / ⌘K)"
        className="flex items-center gap-1.5 px-2 py-0.5 rounded bg-white/5 hover:bg-white/10 border border-white/10 text-[var(--color-text-dim)] hover:text-white transition-colors mr-2 cursor-pointer"
      >
        <span>🔍</span>
        <span className="hidden md:inline font-mono text-[10px]">⌘K</span>
      </button>

      <div className="mr-2 flex items-center">
        <NotificationsDropdown />
      </div>

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
                type="button"
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
