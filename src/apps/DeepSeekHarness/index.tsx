import { Cadre } from '../_cadre/Cadre';

export function DeepSeekHarnessApp() {
  return (
    <Cadre
      cle="deepseek"
      url="http://127.0.0.1:3080"
      titre="DeepSeek Harness"
      detail="DeepSeek Harness (dsh) v0.1.1 · Architecture Tout-Plugin Cordis"
      remede="dsh web --port 3080 ou cliquer sur Lancer."
    />
  );
}

export const App = DeepSeekHarnessApp;
export const manifest = {
  id: 'deepseek-harness',
  name: 'DeepSeek Harness',
  kind: 'multi' as const,
  description: 'DeepSeek Harness (dsh) : agent harness open-source avec architecture tout-plugin Cordis et Web UI.',
  icon: '🐋',
  domaine: 'l0-tech',
};
