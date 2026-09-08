/**
 * Hermes Workspace — le VRAI Hermes Workspace (github outsourc-e/hermes-workspace v2.3.0),
 * servi en local par le dépôt C:/Users/amado/agent-os/hermes-workspace-repo (pnpm dev, port 3000).
 * Chat multi-model, Conductor, Dashboard, Memory, Terminal pty, Settings.
 * Le chat simplifié (src/apps/Workspace) reste en place à côté.
 */
import { Cadre } from '../_cadre/Cadre';

export function HermesWorkspaceApp() {
  return (
    <Cadre
      cle="hermes"
      url="http://127.0.0.1:3000"
      titre="Hermes Workspace"
      detail="Hermes Workspace v2.3.0 · Gateway :8642 · Dashboard :9119"
      remede="npm run dev dans C:/Users/amado/hermes-workspace ou cliquer sur Lancer."
    />
  );
}

export const App = HermesWorkspaceApp;
export const manifest = {
  id: 'hermes-workspace',
  name: 'Hermes Workspace',
  kind: 'multi' as const,
  description: 'Hermes Workspace (v2.3.0) : Chat multi-agents, Conductor, Dashboard, Kanban, Terminal & Observabilité.',
  icon: '⚡',
  domaine: 'l0-tech',
};
