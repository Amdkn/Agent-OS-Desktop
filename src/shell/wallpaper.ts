/**
 * Wallpaper registry.
 *
 * The list is open — adding a JPEG under public/wallpapers/ and an entry
 * below is all that's required. The choice persists in localStorage, the
 * same way the rest of the shell state does.
 *
 * The url() is a plain string rather than a Vite import — `public/` assets
 * are served at the root URL, no bundler rewrite needed, and we don't want
 * a wallpaper swap to invalidate the bundle.
 */

export interface Wallpaper {
  id: string;
  label: string;
  /** Path under public/, served by Vite at the site root. */
  src: string;
}

export const WALLPAPERS: Wallpaper[] = [
  {
    id: 'solarpunk-default',
    label: 'Solarpunk Canon (BusinessOS)',
    src: '/wallpapers/solarpunk-default.jpg',
  },
  {
    id: 'solarpunk-3',
    label: 'Solarpunk #3',
    src: '/wallpapers/solarpunk-3.jpg',
  },
];

export const DEFAULT_WALLPAPER_ID = WALLPAPERS[0].id;

export function findWallpaper(id: string): Wallpaper {
  return WALLPAPERS.find((w) => w.id === id) ?? WALLPAPERS[0];
}

/** Compose a `background-image` value for an inline style. */
export function wallpaperStyle(w: Wallpaper): { backgroundImage: string } {
  return { backgroundImage: `url("${w.src}")` };
}
