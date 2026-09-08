import { useShell, type IconPosition } from '../shell/store';
import type { WindowState, WorkspaceInfo } from '../types';

export interface DesktopTemplate {
  format: 'agent-os-v3-template';
  version: '3.0.0';
  exportedAt: string;
  author: string;
  name: string;
  description: string;
  wallpaperId: string;
  activeWorkspaceId: string;
  workspaces: WorkspaceInfo[];
  windows: WindowState[];
  desktopIcons: Record<string, IconPosition>;
}

/**
 * Exporte l'agencement complet du Web Desktop en template reproductible JSON (Loi L0).
 */
export function exportDesktopTemplate(templateName = 'Business OS Template V3'): DesktopTemplate {
  const s = useShell.getState();
  const template: DesktopTemplate = {
    format: 'agent-os-v3-template',
    version: '3.0.0',
    exportedAt: new Date().toISOString(),
    author: 'Amadou Kone (Amdkn)',
    name: templateName,
    description: 'Template reproductible de Web Desktop souverain aligné sur le Standard Business OS.',
    wallpaperId: s.wallpaperId,
    activeWorkspaceId: s.activeWorkspaceId,
    workspaces: s.workspaces,
    windows: s.order.map((id) => s.windows[id]).filter(Boolean),
    desktopIcons: s.desktopIcons,
  };

  const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(template, null, 2));
  const link = document.createElement('a');
  link.setAttribute('href', dataStr);
  link.setAttribute('download', `desktop-template-${Date.now()}.json`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);

  return template;
}

/**
 * Importe et applique un template de Web Desktop JSON en restaurant la configuration complète.
 */
export async function importDesktopTemplate(file: File): Promise<{ success: boolean; message: string }> {
  try {
    const text = await file.text();
    const data = JSON.parse(text) as DesktopTemplate;

    if (!data || data.format !== 'agent-os-v3-template' || !Array.isArray(data.windows)) {
      return { success: false, message: 'Format de template invalide ou non reconnu.' };
    }

    const s = useShell.getState();

    // 1. Wallpaper
    if (data.wallpaperId) {
      s.setWallpaper(data.wallpaperId);
    }

    // 2. Workspaces
    if (Array.isArray(data.workspaces) && data.workspaces.length > 0) {
      for (const ws of data.workspaces) {
        if (!s.workspaces.some((w) => w.id === ws.id)) {
          s.addWorkspace(ws);
        }
      }
    }

    // 3. Desktop Icons
    if (data.desktopIcons && typeof data.desktopIcons === 'object') {
      s.hydrateIconPositions(data.desktopIcons);
    }

    // 4. Windows
    if (Array.isArray(data.windows)) {
      s.hydrateWindows(data.windows);
    }

    // 5. Active workspace
    if (data.activeWorkspaceId) {
      s.switchWorkspace(data.activeWorkspaceId);
    }

    return { success: true, message: `Template « ${data.name} » importé avec succès (${data.windows.length} fenêtres).` };
  } catch (err) {
    return { success: false, message: `Erreur d'import : ${String(err)}` };
  }

}
