import { create } from 'zustand';
import { THEMES, CANONICAL_APP_THEMES, type ThemeTokens } from './tokens';

interface ThemeStore {
  globalTheme: string;
  appThemes: Record<string, string>;
  setGlobalTheme: (id: string) => void;
  setAppTheme: (appId: string, themeId: string) => void;
  resetAppTheme: (appId: string) => void;
  resetAll: () => void;
  resolveTheme: (appId: string) => string;
  tokensFor: (appId: string) => ThemeTokens;
}

const THEME_STORAGE_KEY = 'agent-os.themes.v1';

function loadPersistedTheme(): { globalTheme: string; appThemes: Record<string, string> } {
  try {
    const raw = localStorage.getItem(THEME_STORAGE_KEY);
    if (!raw) return { globalTheme: 'dark-oled', appThemes: {} };
    const parsed = JSON.parse(raw);
    const globalTheme = (parsed && typeof parsed.globalTheme === 'string' && THEMES[parsed.globalTheme])
      ? parsed.globalTheme
      : 'dark-oled';
    const appThemes = (parsed && typeof parsed.appThemes === 'object' && parsed.appThemes !== null)
      ? parsed.appThemes
      : {};
    return { globalTheme, appThemes };
  } catch {
    return { globalTheme: 'dark-oled', appThemes: {} };
  }
}

function savePersistedTheme(state: { globalTheme: string; appThemes: Record<string, string> }) {
  try {
    localStorage.setItem(THEME_STORAGE_KEY, JSON.stringify(state));
  } catch {
    // quota exceeded or private mode
  }
}

const initial = loadPersistedTheme();

export const useThemeStore = create<ThemeStore>((set, get) => ({
  globalTheme: initial.globalTheme,
  appThemes: initial.appThemes,
  setGlobalTheme: (id: string) => {
    if (!THEMES[id]) return;
    set({ globalTheme: id });
    savePersistedTheme({ globalTheme: id, appThemes: get().appThemes });
  },
  setAppTheme: (appId: string, themeId: string) => {
    if (!THEMES[themeId]) return;
    const nextAppThemes = { ...get().appThemes, [appId]: themeId };
    set({ appThemes: nextAppThemes });
    savePersistedTheme({ globalTheme: get().globalTheme, appThemes: nextAppThemes });
  },
  resetAppTheme: (appId: string) => {
    const nextAppThemes = { ...get().appThemes };
    delete nextAppThemes[appId];
    set({ appThemes: nextAppThemes });
    savePersistedTheme({ globalTheme: get().globalTheme, appThemes: nextAppThemes });
  },
  resetAll: () => {
    set({ globalTheme: 'dark-oled', appThemes: {} });
    savePersistedTheme({ globalTheme: 'dark-oled', appThemes: {} });
  },
  resolveTheme: (appId: string) => {
    const s = get();
    return s.appThemes[appId] ?? CANONICAL_APP_THEMES[appId] ?? s.globalTheme;
  },
  tokensFor: (appId: string) => {
    const id = get().resolveTheme(appId);
    return THEMES[id] ?? THEMES['dark-oled'];
  },
}));

function accentContrast(accent: string): string {
  const hex = accent.match(/^#([0-9a-f]{6})$/i)?.[1];
  if (!hex) return '#ffffff';
  const channels = [0, 2, 4].map((offset) => {
    const value = Number.parseInt(hex.slice(offset, offset + 2), 16) / 255;
    return value <= 0.04045 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4;
  });
  const luminance = channels[0] * 0.2126 + channels[1] * 0.7152 + channels[2] * 0.0722;
  return luminance > 0.42 ? '#000000' : '#ffffff';
}

/** Apply theme tokens as CSS variables on target element (:root). */
export function applyThemeTokens(target: HTMLElement, t: ThemeTokens, prefix = ''): void {
  const p = prefix;
  target.style.setProperty(`${p}--theme-accent`, t.accent);
  target.style.setProperty(`${p}--theme-on-accent`, accentContrast(t.accent));
  target.style.setProperty(`${p}--theme-control-knob`, '#ffffff');
  target.style.setProperty(`${p}--theme-overlay`, 'rgba(0, 0, 0, 0.45)');
  target.style.setProperty(`${p}--theme-danger`, '#dc2626');
  target.style.setProperty(`${p}--theme-accent-rgb`, t.accentRgb);
  target.style.setProperty(`${p}--theme-accent-hover`, t.accentHover);
  target.style.setProperty(`${p}--theme-accent-soft`, t.accentSoft);
  target.style.setProperty(`${p}--theme-bg`, t.bg);
  target.style.setProperty(`${p}--theme-canvas`, t.canvas);
  target.style.setProperty(`${p}--theme-surface`, t.surface);
  target.style.setProperty(`${p}--theme-surface-hover`, t.surfaceHover);
  target.style.setProperty(`${p}--theme-text`, t.text);
  target.style.setProperty(`${p}--theme-text-muted`, t.textMuted);
  target.style.setProperty(`${p}--theme-text-dim`, t.textDim);
  target.style.setProperty(`${p}--theme-border`, t.border);
  target.style.setProperty(`${p}--theme-border-subtle`, t.borderSubtle);
  target.style.setProperty(`${p}--theme-radius`, t.radius);
  target.style.setProperty(`${p}--theme-radius-sm`, t.radiusSm);
  target.style.setProperty(`${p}--theme-radius-lg`, t.radiusLg);
  target.style.setProperty(`${p}--theme-shadow`, t.shadow);
  target.style.setProperty(`${p}--theme-shadow-lg`, t.shadowLg);
  target.style.setProperty(`${p}--theme-blur`, t.blur);
  target.style.setProperty(`${p}--theme-font-display`, t.fontDisplay);
  target.style.setProperty(`${p}--theme-font-body`, t.fontBody);
  target.style.setProperty(`${p}--theme-is-dark`, t.isDark ? '1' : '0');

  // Aliases for shell compatibility
  target.style.setProperty(`${p}--panel`, t.surface);
  target.style.setProperty(`${p}--panel-solid`, t.surface);
  target.style.setProperty(`${p}--panel-border`, t.border);
  target.style.setProperty(`${p}--panel-border-subtle`, t.borderSubtle);
  target.style.setProperty(`${p}--shadow-panel`, t.shadow);
  target.style.setProperty(`${p}--shadow-window`, t.shadowLg);
}

export function useThemeFor(appId: string): ThemeTokens {
  const id = useThemeStore((s) => s.appThemes[appId] ?? CANONICAL_APP_THEMES[appId] ?? s.globalTheme);
  return THEMES[id] ?? THEMES['dark-oled'];
}
