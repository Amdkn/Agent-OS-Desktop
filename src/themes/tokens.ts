/**
 * App Themes — 12 thèmes canoniques portés depuis BusinessOS.
 * Chaque thème = tokens CSS minimaux + meta (description / best for / mood).
 * ThemeStore applique les tokens via :root CSS variables at runtime.
 */

export interface ThemeTokens {
  // Accent
  accent: string;
  accentRgb: string;
  accentHover: string;
  accentSoft: string;
  // Surfaces
  bg: string;
  canvas: string;
  surface: string;
  surfaceHover: string;
  // Text
  text: string;
  textMuted: string;
  textDim: string;
  // Borders
  border: string;
  borderSubtle: string;
  // Shape
  radius: string;
  radiusSm: string;
  radiusLg: string;
  // Effects
  shadow: string;
  shadowLg: string;
  blur: string;
  // Typography
  fontDisplay: string;
  fontBody: string;
  // Mode
  isDark: boolean;
}

export interface ThemeMeta {
  id: string;
  name: string;
  sourceStyleId: string;
  description: string;
  bestFor: string[];
  mood: string;
  lightMode: boolean;
  darkMode: boolean;
  accent: string;
  isDark: boolean;
}

export const THEMES: Record<string, ThemeTokens> = {
  'warm-paper': {
    accent: '#f08143', accentRgb: '240, 129, 67', accentHover: '#e07535', accentSoft: '#f0814320',
    bg: '#ffffff', canvas: '#f4f5f0', surface: '#ffffff', surfaceHover: '#fafaf9',
    text: '#292524', textMuted: '#78716c', textDim: '#a8a29e',
    border: '#e7e5e4', borderSubtle: '#f5f5f4',
    radius: '12px', radiusSm: '8px', radiusLg: '20px',
    shadow: '0 1px 2px rgba(0,0,0,0.05)', shadowLg: '0 8px 24px rgba(0,0,0,0.10)',
    blur: 'none',
    fontDisplay: '"Instrument Serif", "Times New Roman", serif', fontBody: 'Inter, ui-sans-serif, system-ui, sans-serif',
    isDark: false,
  },

  glassmorphism: {
    accent: '#6366f1', accentRgb: '99, 102, 241', accentHover: '#4f46e5', accentSoft: '#6366f125',
    bg: '#f0f3ff', canvas: 'linear-gradient(135deg,#e0e7ff,#cffafe)', surface: 'rgba(255,255,255,0.55)', surfaceHover: 'rgba(255,255,255,0.75)',
    text: '#1e1b4b', textMuted: '#6366f1', textDim: '#a5b4fc',
    border: 'rgba(99,102,241,0.18)', borderSubtle: 'rgba(99,102,241,0.10)',
    radius: '20px', radiusSm: '12px', radiusLg: '28px',
    shadow: '0 8px 32px rgba(99,102,241,0.18)', shadowLg: '0 16px 48px rgba(99,102,241,0.30)',
    blur: 'blur(20px)',
    fontDisplay: 'Inter, ui-sans-serif, system-ui, sans-serif', fontBody: 'Inter, ui-sans-serif, system-ui, sans-serif',
    isDark: false,
  },

  neumorphism: {
    accent: '#0891b2', accentRgb: '8, 145, 178', accentHover: '#0e7490', accentSoft: '#0891b220',
    bg: '#e0e5ec', canvas: '#e0e5ec', surface: '#e0e5ec', surfaceHover: '#dde2e9',
    text: '#2c3e50', textMuted: '#5a6c7d', textDim: '#8898a8',
    border: 'transparent', borderSubtle: 'rgba(0,0,0,0.04)',
    radius: '18px', radiusSm: '12px', radiusLg: '28px',
    shadow: '8px 8px 16px rgba(163,177,198,0.6), -8px -8px 16px rgba(255,255,255,0.5)', shadowLg: '12px 12px 24px rgba(163,177,198,0.7), -12px -12px 24px rgba(255,255,255,0.6)',
    blur: 'none',
    fontDisplay: 'Inter, ui-sans-serif, system-ui, sans-serif', fontBody: 'Inter, ui-sans-serif, system-ui, sans-serif',
    isDark: false,
  },

  brutalism: {
    accent: '#fbbf24', accentRgb: '251, 191, 36', accentHover: '#f59e0b', accentSoft: '#fbbf2440',
    bg: '#fef3c7', canvas: '#fde68a', surface: '#fef3c7', surfaceHover: '#fef9c3',
    text: '#000000', textMuted: '#1f2937', textDim: '#4b5563',
    border: '#000000', borderSubtle: '#00000080',
    radius: '0px', radiusSm: '0px', radiusLg: '0px',
    shadow: '6px 6px 0 #000000', shadowLg: '10px 10px 0 #000000',
    blur: 'none',
    fontDisplay: '"Space Grotesk", "JetBrains Mono", monospace', fontBody: '"Space Grotesk", "JetBrains Mono", monospace',
    isDark: false,
  },

  'dark-oled': {
    accent: '#06b6d4', accentRgb: '6, 182, 212', accentHover: '#22d3ee', accentSoft: '#06b6d425',
    bg: '#000000', canvas: '#050505', surface: '#0a0a0a', surfaceHover: '#141414',
    text: '#fafafa', textMuted: '#a1a1aa', textDim: '#52525b',
    border: '#27272a', borderSubtle: '#18181b',
    radius: '14px', radiusSm: '8px', radiusLg: '22px',
    shadow: '0 0 20px rgba(6,182,212,0.15)', shadowLg: '0 0 40px rgba(6,182,212,0.30)',
    blur: 'none',
    fontDisplay: 'Inter, ui-sans-serif, system-ui, sans-serif', fontBody: 'Inter, ui-sans-serif, system-ui, sans-serif',
    isDark: true,
  },

  aurora: {
    accent: '#ec4899', accentRgb: '236, 72, 153', accentHover: '#db2777', accentSoft: '#ec489925',
    bg: 'linear-gradient(135deg,#1e1b4b 0%,#312e81 40%,#5b21b6 100%)', canvas: 'linear-gradient(135deg,#0f0a2e 0%,#1e1b4b 50%,#312e81 100%)', surface: 'rgba(255,255,255,0.08)', surfaceHover: 'rgba(255,255,255,0.12)',
    text: '#ffffff', textMuted: '#c4b5fd', textDim: '#a78bfa',
    border: 'rgba(236,72,153,0.30)', borderSubtle: 'rgba(255,255,255,0.10)',
    radius: '24px', radiusSm: '14px', radiusLg: '36px',
    shadow: '0 8px 32px rgba(236,72,153,0.25)', shadowLg: '0 16px 64px rgba(91,33,182,0.40)',
    blur: 'blur(16px)',
    fontDisplay: '"Instrument Serif", "Times New Roman", serif', fontBody: 'Inter, ui-sans-serif, system-ui, sans-serif',
    isDark: true,
  },

  cyberpunk: {
    accent: '#00ff9d', accentRgb: '0, 255, 157', accentHover: '#00cc7e', accentSoft: '#00ff9d30',
    bg: '#0a0a14', canvas: '#050510', surface: '#10101e', surfaceHover: '#1a1a2e',
    text: '#00ff9d', textMuted: '#ff007a', textDim: '#5a5a7a',
    border: '#00ff9d', borderSubtle: '#00ff9d40',
    radius: '4px', radiusSm: '2px', radiusLg: '8px',
    shadow: '0 0 8px rgba(0,255,157,0.5), 0 0 16px rgba(255,0,122,0.3)', shadowLg: '0 0 24px rgba(0,255,157,0.6), 0 0 48px rgba(255,0,122,0.4)',
    blur: 'none',
    fontDisplay: '"JetBrains Mono", "Courier New", monospace', fontBody: '"JetBrains Mono", "Courier New", monospace',
    isDark: true,
  },

  editorial: {
    accent: '#b91c1c', accentRgb: '185, 28, 28', accentHover: '#991b1b', accentSoft: '#b91c1c20',
    bg: '#fefdf8', canvas: '#f8f5ed', surface: '#ffffff', surfaceHover: '#fefdf8',
    text: '#1c1917', textMuted: '#57534e', textDim: '#a8a29e',
    border: '#1c1917', borderSubtle: '#d6d3d1',
    radius: '2px', radiusSm: '0px', radiusLg: '4px',
    shadow: 'none', shadowLg: '0 4px 12px rgba(0,0,0,0.06)',
    blur: 'none',
    fontDisplay: '"Playfair Display", "Times New Roman", serif', fontBody: 'Georgia, "Times New Roman", serif',
    isDark: false,
  },

  'liquid-glass': {
    accent: '#0ea5e9', accentRgb: '14, 165, 233', accentHover: '#0284c7', accentSoft: '#0ea5e930',
    bg: 'linear-gradient(180deg,#bae6fd 0%,#7dd3fc 50%,#e0f2fe 100%)', canvas: 'linear-gradient(180deg,#7dd3fc 0%,#bae6fd 100%)', surface: 'rgba(255,255,255,0.40)', surfaceHover: 'rgba(255,255,255,0.65)',
    text: '#0c4a6e', textMuted: '#0369a1', textDim: '#38bdf8',
    border: 'rgba(255,255,255,0.55)', borderSubtle: 'rgba(255,255,255,0.30)',
    radius: '28px', radiusSm: '16px', radiusLg: '40px',
    shadow: '0 12px 48px rgba(14,165,233,0.25), inset 0 0 0 1px rgba(255,255,255,0.30)', shadowLg: '0 24px 80px rgba(14,165,233,0.40)',
    blur: 'blur(40px)',
    fontDisplay: 'Inter, ui-sans-serif, system-ui, sans-serif', fontBody: 'Inter, ui-sans-serif, system-ui, sans-serif',
    isDark: false,
  },

  claymorphism: {
    accent: '#f97316', accentRgb: '249, 115, 22', accentHover: '#ea580c', accentSoft: '#f9731625',
    bg: '#fef3e7', canvas: '#fee5cc', surface: '#fed7aa', surfaceHover: '#fdba74',
    text: '#7c2d12', textMuted: '#9a3412', textDim: '#c2410c',
    border: 'transparent', borderSubtle: 'rgba(124,45,18,0.10)',
    radius: '24px', radiusSm: '14px', radiusLg: '36px',
    shadow: 'inset 6px 6px 12px rgba(180,83,9,0.18), inset -6px -6px 12px rgba(255,255,255,0.7), 6px 6px 12px rgba(180,83,9,0.10)', shadowLg: 'inset 10px 10px 20px rgba(180,83,9,0.20), inset -10px -10px 20px rgba(255,255,255,0.8), 10px 10px 20px rgba(180,83,9,0.15)',
    blur: 'none',
    fontDisplay: '"Comfortaa", "Inter", sans-serif', fontBody: '"Comfortaa", "Inter", sans-serif',
    isDark: false,
  },

  trust: {
    accent: '#0f172a', accentRgb: '15, 23, 42', accentHover: '#020617', accentSoft: '#0f172a20',
    bg: '#fafaf9', canvas: '#f5f5f4', surface: '#ffffff', surfaceHover: '#fafaf9',
    text: '#0c0a09', textMuted: '#57534e', textDim: '#a8a29e',
    border: '#e7e5e4', borderSubtle: '#f5f5f4',
    radius: '6px', radiusSm: '4px', radiusLg: '10px',
    shadow: '0 1px 3px rgba(0,0,0,0.04)', shadowLg: '0 4px 12px rgba(0,0,0,0.08)',
    blur: 'none',
    fontDisplay: '"Cormorant Garamond", "Times New Roman", serif', fontBody: 'Inter, ui-sans-serif, system-ui, sans-serif',
    isDark: false,
  },

  'vibrant-block': {
    accent: '#e11d48',
    accentRgb: '225, 29, 72',
    accentHover: '#be123c',
    accentSoft: '#e11d4840',
    bg: '#fef2f2',
    canvas: '#fecaca',
    surface: '#fef2f2',
    surfaceHover: '#fee2e2',
    text: '#0c0a09',
    textMuted: '#44403c',
    textDim: '#78716c',
    border: '#0c0a09',
    borderSubtle: '#0c0a0980',
    radius: '0px',
    radiusSm: '0px',
    radiusLg: '0px',
    shadow: '8px 8px 0 #0c0a09',
    shadowLg: '12px 12px 0 #0c0a09',
    blur: 'none',
    fontDisplay: 'Archivo Black, Inter, sans-serif',
    fontBody: 'Archivo, Inter, sans-serif',
    isDark: false,
  },
};

type ThemeMetaInput = Omit<ThemeMeta, 'accent' | 'isDark'>;

const THEME_META_RAW: ThemeMetaInput[] = [
  { id: 'warm-paper', name: 'Warm Paper', sourceStyleId: 'warm-paper-light', description: 'Original Macro shell, serif display, paper grain', bestFor: [], mood: 'the editor desk', lightMode: true, darkMode: false },
  { id: 'glassmorphism', name: 'Glassmorphism', sourceStyleId: 'glassmorphism', description: 'Translucent surfaces, backdrop-blur, soft indigo shadows', bestFor: ['marketplace'], mood: 'frosted confidence', lightMode: true, darkMode: true },
  { id: 'neumorphism', name: 'Neumorphism', sourceStyleId: 'neumorphism', description: 'Soft UI raised/inset shadows, pastel cyan', bestFor: ['operations'], mood: 'tactile and calm', lightMode: true, darkMode: true },
  { id: 'brutalism', name: 'Brutalism', sourceStyleId: 'brutalism', description: 'Hard borders, mono display, yellow accent', bestFor: ['product'], mood: 'no bullshit', lightMode: true, darkMode: true },
  { id: 'dark-oled', name: 'Dark OLED', sourceStyleId: 'dark-mode', description: 'Pure black, cyan glow, financial-grade contrast', bestFor: ['finance', 'dashboard'], mood: 'terminal-grade', lightMode: false, darkMode: true },
  { id: 'aurora', name: 'Aurora UI', sourceStyleId: 'aurora-ui', description: 'Gradient purple/pink conique, floating orbs, blur layers', bestFor: [], mood: 'warm north star', lightMode: false, darkMode: true },
  { id: 'cyberpunk', name: 'Cyberpunk', sourceStyleId: 'cyberpunk-ui', description: 'Neon green/magenta on black, monospace, scanline glow', bestFor: ['it-rd'], mood: 'neon and code', lightMode: false, darkMode: true },
  { id: 'editorial', name: 'Editorial', sourceStyleId: 'editorial-magazine', description: 'Serif Playfair display, narrow gutters, rule lines', bestFor: ['tasks', 'people'], mood: 'long-form calm', lightMode: true, darkMode: false },
  { id: 'liquid-glass', name: 'Liquid Glass', sourceStyleId: 'liquid-glass', description: 'Heavy blur, multi-layer translucency, sky-blue gradient', bestFor: [], mood: 'apple-vision-pro', lightMode: true, darkMode: true },
  { id: 'claymorphism', name: 'Claymorphism', sourceStyleId: 'claymorphism', description: 'Pastel 3D, soft inner shadows, peach gradient', bestFor: ['clients'], mood: 'squishy warmth', lightMode: true, darkMode: false },
  { id: 'trust', name: 'Trust and Authority', sourceStyleId: 'trust-authority', description: 'Noir sobre, Cormorant serif headings, classical restraint', bestFor: ['sales', 'legal'], mood: 'old money sober', lightMode: true, darkMode: false },
  { id: 'vibrant-block', name: 'Vibrant Block', sourceStyleId: 'vibrant-block-based', description: 'Bold colors, hard edges, Archivo Black, drop-shadow blocks', bestFor: ['growth'], mood: 'growth-hacker loud', lightMode: true, darkMode: false },
];

export const THEME_META: ThemeMeta[] = THEME_META_RAW.map((m) => ({
  ...m,
  accent: THEMES[m.id].accent,
  isDark: THEMES[m.id].isDark,
}));

export const CANONICAL_APP_THEMES: Record<string, string> = {
  dashboard: 'dark-oled',
  product: 'brutalism',
  growth: 'vibrant-block',
  sales: 'warm-paper',
  operations: 'brutalism',
  finance: 'trust',
  legal: 'trust',
  people: 'editorial',
  'it-rd': 'cyberpunk',
  clients: 'claymorphism',
  tasks: 'editorial',
  marketplace: 'glassmorphism',
  settings: 'warm-paper',
  franchise: 'glassmorphism',
};

export const THEME_LIST = THEME_META.map((m) => m.id);
