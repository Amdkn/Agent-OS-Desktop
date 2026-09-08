/**
 * Life OS 2026 — instance EN LIGNE (deploiement Vercel du depot Amdkn/Life-OS-2026).
 * Meme projet Supabase que l'instance locale : les donnees sont les memes,
 * seul l'hebergement change.
 */
import { Cadre } from '../_cadre/Cadre';

export function LifeOSOnlineApp() {
  return (
    <Cadre
      url="https://life-os-2026-amd-lab.vercel.app"
      titre="Life OS 2026 · en ligne"
      detail="Vercel · dépôt Amdkn/Life-OS-2026 · mêmes données Supabase que le local"
      remede="Le déploiement Vercel est injoignable. Vérifiez la connexion réseau."
    />
  );
}
export const App = LifeOSOnlineApp;
export const manifest = {
  id: 'lifeos-online',
  name: 'Life OS en ligne',
  kind: 'multi' as const,
  description: 'Life OS 2026 déployé sur Vercel.',
  icon: '☁',
  domaine: 'l1-life',
};
