/**
 * Domaines — le gabarit Life OS appliqué à Agent OS.
 *
 * Les apps se déclarent (manifest.domaine) ; ce module ne fait que regrouper
 * ce qui s'est déclaré. Aucun id d'app n'est codé en dur : une app sans
 * domaine tombe dans L0 TECH (l'infrastructure, le rez-de-chaussée).
 */

import type { AppManifest, DomaineId, DomaineInfo } from '../types';

export const DOMAINES: Record<DomaineId, DomaineInfo> = {
  'l0-tech': {
    id: 'l0-tech',
    nom: 'TECH',
    horizon: 'H1',
    description: "L'infrastructure — observateurs, mémoires, passerelles, harness.",
    icon: '⚙',
  },
  'l1-life': {
    id: 'l1-life',
    nom: 'LIFE',
    horizon: 'H3',
    description: 'Le noyau personnel — Life OS 2026, Corpus, Revue.',
    icon: '◍',
  },
  'l2-business': {
    id: 'l2-business',
    nom: 'BUSINESS',
    horizon: 'H3',
    description: 'Le noyau économique — Coach OS et ses Extensions.',
    icon: '⌘',
  },
};

export const ORDRE_DOMAINES: DomaineId[] = ['l0-tech', 'l1-life', 'l2-business'];

/** Groupe les apps par domaine, dans l'ordre canonique. */
export function grouperParDomaine(
  apps: AppManifest[],
): Array<{ domaine: DomaineInfo; apps: AppManifest[] }> {
  const buckets = new Map<DomaineId, AppManifest[]>();
  for (const app of apps) {
    const dom: DomaineId = app.domaine ?? 'l0-tech';
    const list = buckets.get(dom);
    if (list) list.push(app);
    else buckets.set(dom, [app]);
  }
  return ORDRE_DOMAINES.filter((id) => buckets.has(id)).map((id) => ({
    domaine: DOMAINES[id],
    apps: buckets.get(id) ?? [],
  }));
}
