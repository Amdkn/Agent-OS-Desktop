/** Habillages du dock — les vingt styles du catalogue UI UX Pro Max.
 *
 *  Les mêmes vingt styles que la vitrine de l'app Design, mais déclarés ici,
 *  dans le socle. Le dock ne peut pas importer depuis `src/apps/design/` : le
 *  socle ne dépend d'aucune app, sinon retirer une app casserait la barre.
 *  Les `id` et les `label` sont alignés sur ceux de la vitrine pour qu'un
 *  utilisateur reconnaisse le même nom des deux côtés.
 *
 *  Chaque habillage ne décrit que ce dont la barre a besoin : un fond, une
 *  bordure, une ombre, un rayon, et la manière dont une icône active se
 *  détache. Rien de plus — un dock n'a pas de typographie ni de grille.
 */

export interface DockSkin {
  id: string;
  label: string;
  /** Fond de la barre. Peut être un dégradé. */
  background: string;
  /** Couleur de bordure. */
  border: string;
  /** Ombre portée de la barre. */
  shadow: string;
  /** Rayon des coins de la barre, en px. */
  radius: number;
  /** Rayon des pastilles d'app, en px. */
  tileRadius: number;
  /** Filtre d'arrière-plan (flou). Vide = aucun. */
  backdrop: string;
  /** Vrai quand le fond est sombre : les libellés passent en clair. */
  dark: boolean;
}

export const DOCK_SKINS: DockSkin[] = [
  {
    id: 'glass', label: 'Glassmorphism',
    background: 'color-mix(in srgb, var(--theme-surface) 72%, transparent)',
    border: 'rgba(255,255,255,0.45)',
    shadow: '0 0 0 1px rgba(0,0,0,0.10), 0 12px 34px -12px rgba(0,0,0,0.45)',
    radius: 18, tileRadius: 13, backdrop: 'blur(20px) saturate(1.4)', dark: false,
  },
  {
    id: 'clay', label: 'Claymorphism',
    background: 'linear-gradient(160deg, #fdf2f8, #ede9fe)',
    border: 'rgba(255,255,255,0.9)',
    shadow: '0 10px 0 -4px rgba(167,139,250,0.35), 0 18px 30px -14px rgba(76,29,149,0.45)',
    radius: 22, tileRadius: 16, backdrop: '', dark: false,
  },
  {
    id: 'brutalism', label: 'Brutalism',
    background: '#facc15',
    border: '#000000',
    shadow: '6px 6px 0 0 #000000',
    radius: 0, tileRadius: 0, backdrop: '', dark: false,
  },
  {
    id: 'cyberpunk', label: 'Cyberpunk Neon',
    background: 'linear-gradient(160deg, #12002e, #1a0b3d)',
    border: '#ff2bd6',
    shadow: '0 0 18px -2px #ff2bd6, 0 0 34px -10px #00f0ff',
    radius: 6, tileRadius: 4, backdrop: '', dark: true,
  },
  {
    id: 'softui', label: 'Soft UI / Neu',
    background: '#e8e5e1',
    border: 'rgba(255,255,255,0.8)',
    shadow: 'inset 2px 2px 6px rgba(255,255,255,0.9), inset -2px -2px 6px rgba(0,0,0,0.10), 0 10px 24px -14px rgba(0,0,0,0.30)',
    radius: 20, tileRadius: 14, backdrop: '', dark: false,
  },
  {
    id: 'editorial', label: 'Editorial Mag',
    background: '#fdfbf5',
    border: '#111111',
    shadow: '0 2px 0 0 #111111',
    radius: 2, tileRadius: 2, backdrop: '', dark: false,
  },
  {
    id: 'y2k', label: 'Y2K Chrome',
    background: 'linear-gradient(160deg, #f8fafc, #cbd5e1 45%, #94a3b8)',
    border: '#e2e8f0',
    shadow: '0 0 0 1px rgba(255,255,255,0.8), 0 14px 30px -12px rgba(30,64,175,0.55)',
    radius: 24, tileRadius: 18, backdrop: '', dark: false,
  },
  {
    id: 'memphis', label: 'Memphis 80s',
    background: '#fef9c3',
    border: '#0f172a',
    shadow: '4px 4px 0 0 #22d3ee, 8px 8px 0 0 #f472b6',
    radius: 14, tileRadius: 10, backdrop: '', dark: false,
  },
  {
    id: 'vapor', label: 'Vaporwave',
    background: 'linear-gradient(160deg, #ff6ec7, #7dd3fc)',
    border: 'rgba(255,255,255,0.6)',
    shadow: '0 14px 34px -12px rgba(217,70,239,0.65)',
    radius: 16, tileRadius: 12, backdrop: '', dark: false,
  },
  {
    id: 'bauhaus', label: 'Bauhaus',
    background: '#f5f5f4',
    border: '#111111',
    shadow: '0 0 0 3px #dc2626, 0 0 0 6px #facc15',
    radius: 0, tileRadius: 0, backdrop: '', dark: false,
  },
  {
    id: 'artdeco', label: 'Art Deco',
    background: 'linear-gradient(160deg, #1c1917, #292524)',
    border: '#d4af37',
    shadow: '0 0 0 1px #d4af37, 0 14px 30px -14px rgba(0,0,0,0.8)',
    radius: 4, tileRadius: 3, backdrop: '', dark: true,
  },
  {
    id: 'bento', label: 'Bento',
    background: '#faf7f0',
    border: '#d6cfc2',
    shadow: '0 8px 22px -14px rgba(41,37,36,0.45)',
    radius: 14, tileRadius: 10, backdrop: '', dark: false,
  },
  {
    id: 'retrofuture', label: 'Retro Future',
    background: 'linear-gradient(160deg, #ccfbf1, #fecaca)',
    border: '#fbbf24',
    shadow: '0 10px 26px -14px rgba(180,83,9,0.5)',
    radius: 26, tileRadius: 20, backdrop: '', dark: false,
  },
  {
    id: 'aurora', label: 'Aurora Mesh',
    background: 'linear-gradient(160deg, #0f766e, #7c3aed 60%, #db2777)',
    border: 'rgba(255,255,255,0.35)',
    shadow: '0 16px 40px -16px rgba(124,58,237,0.7)',
    radius: 20, tileRadius: 15, backdrop: 'blur(8px)', dark: true,
  },
  {
    id: 'terminal', label: 'Terminal Mono',
    background: '#0a0a0a',
    border: '#22c55e',
    shadow: '0 0 14px -2px rgba(34,197,94,0.6)',
    radius: 2, tileRadius: 2, backdrop: '', dark: true,
  },
  {
    id: 'wabisabi', label: 'Wabi-sabi',
    background: '#f3efe6',
    border: '#b8ab97',
    shadow: '0 8px 20px -14px rgba(68,64,60,0.5)',
    radius: 18, tileRadius: 14, backdrop: '', dark: false,
  },
  {
    id: 'genz', label: 'GenZ Linear',
    background: 'linear-gradient(160deg, #ede9fe, #a7f3d0)',
    border: 'rgba(255,255,255,0.7)',
    shadow: '0 12px 28px -14px rgba(99,102,241,0.55)',
    radius: 20, tileRadius: 15, backdrop: 'blur(6px)', dark: false,
  },
  {
    id: 'handdrawn', label: 'Hand-drawn',
    background: '#fffdf7',
    border: '#44403c',
    shadow: '2px 3px 0 0 rgba(68,64,60,0.6)',
    radius: 16, tileRadius: 12, backdrop: '', dark: false,
  },
  {
    id: 'neobrutal', label: 'Neo-brutalist',
    background: '#2563eb',
    border: '#000000',
    shadow: '7px 7px 0 0 #000000',
    radius: 4, tileRadius: 2, backdrop: '', dark: true,
  },
  {
    id: 'liquidchrome', label: 'Liquid Chrome',
    background: 'linear-gradient(160deg, #e2e8f0, #94a3b8 40%, #f1f5f9 70%, #64748b)',
    border: 'rgba(255,255,255,0.8)',
    shadow: '0 14px 32px -14px rgba(15,23,42,0.6)',
    radius: 22, tileRadius: 17, backdrop: '', dark: false,
  },
];

export const DOCK_SKIN_DEFAULT = 'glass';

export function dockSkinById(id: string): DockSkin {
  return DOCK_SKINS.find((s) => s.id === id) ?? DOCK_SKINS[0];
}
