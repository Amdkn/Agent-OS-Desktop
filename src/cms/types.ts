/**
 * Agent OS V2 — Hierarchical CMS Definitions (Wix CMS Pattern)
 *
 * Imbrication jusqu'à 7 niveaux :
 * - Niveau 1 : Apps (Items au niveau racine d'Agent OS)
 * - Niveau 2 : Pages / Vues / Onglets de Sidebar et Header (Collections de l'App -> 2ème niveau d'Items)
 * - Niveau 3 : Cartes, Contenus, Sections & Widgets (Collections de la Page -> 3ème niveau d'Items)
 * - Niveau 4 : Lignes / Entités / Datasets (Entités, Checkpoints, Télémétrie, Workflows, Signaux, SOPs, Nœuds)
 * - Niveau 5 : Champs, Attributs, Propriétés & Métadonnées (Clé, Valeur, Badge, Types, SLA)
 * - Niveau 6 : Actions, Déclencheurs & Opérations (Exécuter, Snapshot, Invoquer, Vérifier, Inspecter)
 * - Niveau 7 : Payloads & Audit Traces (JSON brut, Hash, Signatures RDF, Événements de preuve)
 */

export type CmsLevel = 1 | 2 | 3 | 4 | 5 | 6 | 7;

export interface CmsLevelMeta {
  level: CmsLevel;
  title: string;
  kind: 'item' | 'collection';
  description: string;
  icon: string;
}

export interface CmsAction {
  id: string;
  label: string;
  verb: 'GET' | 'POST' | 'INSPECT' | 'EXEC' | 'NAVIGATE';
  endpoint?: string;
  payloadTemplate?: Record<string, unknown>;
  description?: string;
}

export interface CmsField {
  key: string;
  label: string;
  type: 'string' | 'number' | 'boolean' | 'badge' | 'date' | 'code' | 'json';
  value: any;
  statusBadge?: string;
  color?: string;
}

export interface CmsDatasetRow {
  id: string;
  name: string;
  type: string;
  status?: string;
  icon?: string;
  description?: string;
  level: 4;
  fields: CmsField[]; // Niveau 5
  actions?: CmsAction[]; // Niveau 6
  rawAudit?: Record<string, unknown> | string; // Niveau 7
}

export interface CmsCardSection {
  id: string;
  title: string;
  category: 'kpi' | 'table' | 'graph' | 'workflow' | 'inspector' | 'logs' | 'form';
  icon: string;
  description: string;
  level: 3;
  dataset: CmsDatasetRow[]; // Niveau 4
}

export interface CmsPageView {
  id: string;
  name: string;
  headerOrSidebar: 'header' | 'sidebar' | 'hybrid';
  icon: string;
  badge?: string;
  description: string;
  level: 2;
  sections: CmsCardSection[]; // Niveau 3
}

export interface CmsAppItem {
  id: string;
  name: string;
  domaine: 'l0-tech' | 'l1-life' | 'l2-business';
  kind: 'singleton' | 'multi';
  icon: string;
  description: string;
  level: 1;
  views: CmsPageView[]; // Niveau 2
}

export interface CmsHierarchy {
  version: '2.0.0';
  rootName: 'Agent OS V2 CMS';
  description: 'Architecture Content Management System multi-niveaux pour les applications, vues, widgets et données souveraines.';
  apps: CmsAppItem[];
}
