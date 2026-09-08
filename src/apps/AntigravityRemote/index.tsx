import { Cadre } from '../_cadre/Cadre';

export function AntigravityRemoteApp() {
  return (
    <Cadre
      url="http://127.0.0.1:55358"
      titre="Antigravity Remote (Port 55358)"
      detail="Interface Web IDE Antigravity · Remote Shell & Debugging · Port 55358"
      cle="antigravity-remote"
      urlEnLigne="http://127.0.0.1:55355"
      titreEnLigne="Remote Debugger (Port 55355)"
      remede="Assurez-vous qu'Antigravity est démarré. Cliquez sur 'Ouvrir' pour basculer dans le navigateur si nécessaire."
    />
  );
}

export const App = AntigravityRemoteApp;
export const manifest = {
  id: 'antigravity-remote',
  name: 'Antigravity Remote',
  kind: 'multi' as const,
  description: 'Interface web Antigravity Remote embarquée (Port 55358 / 55355) et liaison directe navigateur.',
  icon: '🌌',
  domaine: 'l0-tech',
};
