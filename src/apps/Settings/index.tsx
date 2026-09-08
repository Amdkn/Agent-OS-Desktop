import type { AppManifest } from '../../types';
import { AppLayout, type AppSection, type AppToolDef } from '../../shell/AppLayout';
import { useThemeStore } from '../../themes/store';
import { THEME_META } from '../../themes/tokens';
import { WALLPAPERS } from '../../shell/wallpaper';
import { useShell } from '../../shell/store';

export const manifest: AppManifest = {
  id: 'settings',
  name: 'Paramètres Système',
  kind: 'singleton',
  domaine: 'l0-tech',
  category: 'SYSTÈME',
  dockSlot: 99,
  description: 'Thèmes, fonds d’écran, environnement et préférences système Agent OS V3',
  icon: '⚙️',
  accentColor: '#06b6d4',
};

export function App() {
  const globalTheme = useThemeStore((s) => s.globalTheme);
  const setGlobalTheme = useThemeStore((s) => s.setGlobalTheme);
  const wallpaperId = useShell((s) => s.wallpaperId);
  const setWallpaper = useShell((s) => s.setWallpaper);
  const activeWorkspaceId = useShell((s) => s.activeWorkspaceId);
  const workspaces = useShell((s) => s.workspaces);
  const addToast = useShell((s) => s.addToast);

  const sections: AppSection[] = [
    {
      id: 'appearance',
      label: 'Apparence & Thèmes',
      icon: '🎨',
      render: () => (
        <div className="space-y-6 max-w-2xl">
          <div>
            <h3 className="text-sm font-bold text-white uppercase tracking-wider mb-1">
              Thème de l’OS (12 Presets BusinessOS)
            </h3>
            <p className="text-xs text-white/50 mb-4">
              Chaque thème injecte dynamiquement ses tokens CSS (couleurs, ombres, polices, rayon de courbure).
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {THEME_META.map((t) => {
                const isSelected = globalTheme === t.id;
                return (
                  <button
                    key={t.id}
                    type="button"
                    onClick={() => {
                      setGlobalTheme(t.id);
                      addToast(`Thème activé : ${t.name}`, 'info', 'Paramètres');
                    }}
                    className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
                      isSelected
                        ? 'border-[var(--theme-accent,#06b6d4)] bg-white/10 shadow-lg'
                        : 'border-white/10 bg-white/5 hover:border-white/20 hover:bg-white/10'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-bold text-xs text-white flex items-center gap-1.5">
                        <span
                          className="w-2.5 h-2.5 rounded-full"
                          style={{ backgroundColor: t.accent }}
                        />
                        {t.name}
                      </span>
                      {isSelected && (
                        <span className="text-[10px] font-bold text-[var(--theme-accent,#06b6d4)]">
                          Actif
                        </span>
                      )}
                    </div>
                    <div className="text-[11px] text-white/70 italic mb-1">{t.mood}</div>
                    <div className="text-[10px] text-white/40 leading-snug">{t.description}</div>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="pt-4 border-t border-white/10">
            <h3 className="text-sm font-bold text-white uppercase tracking-wider mb-1">
              Fonds d’écran (Multi-layer Wallpapers)
            </h3>
            <p className="text-xs text-white/50 mb-3">
              Sélectionnez l'arrière-plan du bureau virtuel.
            </p>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {WALLPAPERS.map((w) => {
                const isSelected = wallpaperId === w.id;
                return (
                  <button
                    key={w.id}
                    type="button"
                    onClick={() => {
                      setWallpaper(w.id);
                      addToast(`Fond d'écran changé : ${w.label}`, 'info', 'Paramètres');
                    }}
                    className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer ${
                      isSelected
                        ? 'border-[var(--theme-accent,#06b6d4)] bg-white/10 shadow-md'
                        : 'border-white/10 bg-white/5 hover:border-white/20'
                    }`}
                  >
                    <div className="text-xs font-bold text-white truncate">{w.label}</div>
                    <div className="text-[10px] text-white/40 font-mono mt-0.5">{w.id}</div>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      ),
    },
    {
      id: 'workspaces',
      label: 'Espaces de Travail (L0 / L1 / L2)',
      icon: '🏛️',
      render: () => (
        <div className="space-y-4 max-w-xl">
          <div>
            <h3 className="text-sm font-bold text-white uppercase tracking-wider mb-1">
              Gestion des Workspaces V3
            </h3>
            <p className="text-xs text-white/50 mb-4">
              Conformément à la hiérarchie transversale d'A'Space OS V3 (L0 Tech, L1 Life, L2 Business).
            </p>
          </div>

          <div className="space-y-2">
            {workspaces.map((ws) => {
              const isActive = activeWorkspaceId === ws.id;
              return (
                <div
                  key={ws.id}
                  className={`p-3 rounded-xl border flex items-center justify-between ${
                    isActive
                      ? 'border-[var(--theme-accent,#06b6d4)] bg-white/10'
                      : 'border-white/10 bg-white/5'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">{ws.icon}</span>
                    <div>
                      <div className="text-xs font-bold text-white">{ws.name}</div>
                      <div className="text-[11px] text-white/50">{ws.description}</div>
                    </div>
                  </div>
                  {isActive ? (
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-[var(--theme-accent,#06b6d4)] text-black font-bold">
                      Actuel
                    </span>
                  ) : (
                    <button
                      type="button"
                      onClick={() => useShell.getState().switchWorkspace(ws.id)}
                      className="text-xs px-2.5 py-1 rounded bg-white/10 hover:bg-white/20 text-white font-medium"
                    >
                      Bascule
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      ),
    },
    {
      id: 'system',
      label: 'Diagnostics & Immunité',
      icon: '🛡️',
      render: () => (
        <div className="space-y-4 max-w-xl">
          <div>
            <h3 className="text-sm font-bold text-white uppercase tracking-wider mb-1">
              Santé & Loi L0 Rick
            </h3>
            <p className="text-xs text-white/50 mb-4">
              Système immunitaire anti-rejeu et persistance défensive (Schema Version 3).
            </p>
          </div>

          <div className="p-4 rounded-xl border border-emerald-500/20 bg-emerald-500/10 space-y-2">
            <div className="flex items-center gap-2 text-emerald-400 font-bold text-xs">
              <span>✓</span>
              <span>Architecture Souveraine & Moteur de Bureau V3 Actif</span>
            </div>
            <p className="text-[11px] text-white/70 leading-relaxed">
              Toutes les transactions et sessions sont encapsulées dans des enveloppes versionnées
              avec migration défensive. Les erreurs de runtime sont absorbées par RootErrorBoundary et ViewportGuard.
            </p>
          </div>

          <div className="pt-2">
            <button
              type="button"
              onClick={() => {
                addToast('Test de notification déclenché avec succès !', 'success', 'Système');
              }}
              className="px-4 py-2 rounded-xl bg-[var(--theme-accent,#06b6d4)] text-black font-bold text-xs hover:opacity-90 transition-all cursor-pointer shadow-lg"
            >
              Déclencher un Toast de test
            </button>
          </div>
        </div>
      ),
    },
  ];

  const tools: AppToolDef[] = [
    {
      id: 'tool-clear-cache',
      name: 'Nettoyer le Cache',
      description: 'Réinitialise les états temporaires sans affecter les instantanés durables.',
      status: 'idle',
      icon: '🧹',
      onRun: () => addToast('Cache nettoyé avec succès', 'info', 'Outils'),
    },
    {
      id: 'tool-snapshot',
      name: 'Instantané Session',
      description: 'Force la persistance immédiate de la disposition active.',
      status: 'idle',
      icon: '💾',
      onRun: () => addToast('Session sauvegardée', 'success', 'Outils'),
    },
  ];

  return (
    <AppLayout
      appId="settings"
      title="Paramètres Système"
      subtitle="Standard Business OS V3"
      icon="⚙️"
      accent="#06b6d4"
      sections={sections}
      tools={tools}
    />
  );
}

export default App;
