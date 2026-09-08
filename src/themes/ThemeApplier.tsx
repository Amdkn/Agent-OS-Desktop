import { useEffect } from 'react';
import { useThemeStore, applyThemeTokens } from './store';
import { THEMES } from './tokens';

export function ThemeApplier(): null {
  const globalTheme = useThemeStore((s) => s.globalTheme);

  useEffect(() => {
    const root = document.documentElement;
    const tokens = THEMES[globalTheme] ?? THEMES['dark-oled'];
    applyThemeTokens(root, tokens);
    root.setAttribute('data-theme', globalTheme);
    root.setAttribute('data-theme-dark', tokens.isDark ? 'true' : 'false');
  }, [globalTheme]);

  return null;
}
