/**
 * Coach OS — l'app de Business OS, `30_Business_OS/10_Projects/coach-os-app`.
 * Port 5174 impose par son lanceur (--strictPort) : sans cela Vite glisse sur
 * le port suivant et cette app pointerait a vide sans le dire.
 */
import { Cadre } from '../_cadre/Cadre';

export function CoachOSApp() {
  return (
    <Cadre
      url="http://localhost:5174"
      titre="Coach OS"
      detail="ASpace_OS_V3/30_Business_OS/10_Projects/coach-os-app · port 5174"
      cle="coachos"
      urlEnLigne="https://omk-desktop-web-os.vercel.app"
      titreEnLigne="Coach OS en ligne (Vercel)"
      remede="Cliquez sur « Lancer » pour démarrer le serveur local Coach OS sur le port 5174, ou ouvrez la version déployée sur Vercel."
    />
  );
}
export const App = CoachOSApp;
export const manifest = {
  id: 'coachos',
  name: 'Coach OS',
  kind: 'multi' as const,
  description: 'Coach OS — le projet de Business OS.',
  icon: '⌘',
  domaine: 'l2-business',
};
