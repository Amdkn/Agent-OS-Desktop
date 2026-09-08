/**
 * Life OS 2026 — instance LOCALE (le clone `_Life-OS-2026-clone`, port 4444).
 * L'app n'est qu'une encapsulation : Life OS existe, on ne le refait pas.
 * Sa jumelle en ligne est une app distincte, volontairement — un basculement
 * cache une des deux, et une app qu'on ne voit pas n'existe pas.
 */
import { Cadre } from '../_cadre/Cadre';

export function LifeOSApp() {
  return (
    <Cadre
      url="http://127.0.0.1:4444"
      titre="Life OS 2026 · local"
      detail="clone _Life-OS-2026-clone · npm run dev · port 4444 · Supabase hjweyhpmrxqsxfbibsnc"
      cle="lifeos"
      urlEnLigne="https://life-os-2026-amd-lab.vercel.app"
      titreEnLigne="Life OS en ligne (Vercel)"
      remede="Cliquez sur « Lancer » pour démarrer l'instance locale sur le port 4444, ou ouvrez directement la version déployée sur Vercel."
    />
  );
}
export const App = LifeOSApp;
export const manifest = {
  id: 'lifeos',
  name: 'Life OS 2026',
  kind: 'multi' as const,
  description: 'Life OS 2026 en local (port 4444).',
  icon: '◍',
  domaine: 'l1-life',
};
