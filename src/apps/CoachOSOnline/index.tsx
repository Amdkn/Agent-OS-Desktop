/**
 * Coach OS — instance EN LIGNE.
 *
 * L'URL vient du proprietaire, pas d'une deduction : `omk-desktop-web-os.vercel.app`.
 * Le token Vercel de settings.json est revoque (403 sur /v2/user, mesure du
 * 2026-08-29), donc l'API ne permet pas de lister les deploiements — inutile
 * de deviner un nom de projet a partir du nom du depot.
 *
 * Son Supabase n'est PAS celui de Life OS : c'est `ndvqwcapwcnpdvknxcjw`
 * (OMK SERVICES CUSTOMERS). Confondre les deux projets ferait pointer l'app
 * locale sur la mauvaise base.
 */
import { Cadre } from '../_cadre/Cadre';

export function CoachOSOnlineApp() {
  return (
    <Cadre
      url="https://omk-desktop-web-os.vercel.app"
      titre="Coach OS · en ligne"
      detail="Vercel · omk-desktop-web-os · Supabase ndvqwcapwcnpdvknxcjw (OMK Services)"
      remede="Le déploiement Vercel est injoignable. Vérifiez la connexion réseau."
    />
  );
}
export const App = CoachOSOnlineApp;
export const manifest = {
  id: 'coachos-online',
  name: 'Coach OS en ligne',
  kind: 'multi' as const,
  description: 'Coach OS déployé sur Vercel.',
  icon: '☁',
  domaine: 'l2-business',
};
