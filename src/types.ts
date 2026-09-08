/**
 * Domain types shared by the shell, apps, and storage.
 * Persistence layer is contract-typed — every collection row fits one of these.
 */

export type WindowId = string;
export type AppId = string;

/* -------------------------- Domaines (gabarit Life OS) -------------------------- */

/**
 * Les trois domaines d'Agent OS, sur le gabarit de Life OS / Business OS :
 *   - L0 TECH     : l'infrastructure — observateurs, mémoires, passerelles, harness.
 *   - L1 LIFE     : le noyau personnel — Life OS 2026, Corpus, Ikigai.
 *   - L2 BUSINESS : le noyau économique — Coach OS, SaaS Builder, Marketplace.
 * Chaque app déclare son domaine dans son manifest ; le shell ne connaît
 * rien de nommé — il ne fait que grouper ce qui s'est déclaré.
 */
export type DomaineId = 'l0-tech' | 'l1-life' | 'l2-business';

export interface DomaineInfo {
  id: DomaineId;
  /** Nom affiché, gabarit Life OS : PASSION / MISSION / ... */
  nom: string;
  /** Horizon Life OS — H1 : tenir aujourd'hui, H3 : tenir 10 ans. */
  horizon: 'H1' | 'H3';
  /** Une ligne qui dit pourquoi ce domaine existe. */
  description: string;
  icon: string;
}

/** Ports irréversibles — le bandeau Beth les affiche en permanence. */
export const PORTES_IRREVERSIBLES: string[] = [
  'CA racine',
  'push dépôt divergent',
  'virement',
  'suppression de données',
  'confiance: machine → confiance: humain',
];

/** A registry entry for an app discoverable in the disk-based apps folder. */
export interface AppManifest {
  id: AppId;
  name: string;
  /** Singletons launch one instance; multi apps launch N. */
  kind: 'singleton' | 'multi';
  description: string;
  icon: string;
  /** Domaine d'appartenance (gabarit Life OS). Optionnel pour compat : le regroupement le place alors en L0 TECH. */
  domaine?: DomaineId;
  /** Catégorie Business OS / CMS */
  category?: string;
  /** Ordre d'ancrage dans le Dock (slot 1 à N) */
  dockSlot?: number;
  /** Si true, l'application est invisible dans le Dock et n'apparaît que dans l'AppDrawer */
  hidden?: boolean;
  /** Couleur d'accent optionnelle propre à l'application */
  accentColor?: string;
}

/** A live window on the desktop. */
export interface WindowState {
  id: WindowId;
  appId: AppId;
  title: string;
  /** Display state — minimized apps are kept in the store but not rendered. */
  minimized: boolean;
  /** Stacking — higher z renders on top. */
  z: number;
  x: number;
  y: number;
  w: number;
  h: number;
  /** Plein ecran. La geometrie d'avant est gardee pour pouvoir revenir. */
  maximized?: boolean;
  restore?: { x: number; y: number; w: number; h: number };
  /** Épinglage Always-on-top (Mode PiP) */
  pinned?: boolean;
  /** Type d'ancrage actif */
  snapped?: 'left' | 'right' | 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right' | 'maximize' | null;
  /** Identifiant du workspace auquel appartient la fenêtre */
  workspaceId?: string;
  /** Saved per-instance — apps that remember their view. */
  payload?: Record<string, unknown>;
}

/* -------------------------- V3 Workspaces -------------------------- */

export interface WorkspaceInfo {
  id: string;
  name: string;
  icon: string;
  domaine?: DomaineId;
  description?: string;
}


/* -------------------------- Storage contracts -------------------------- */

/**
 * The durable layer is a small set of named collections. Apps declare
 * which collections they read and write; the storage adapter doesn't care
 * about schemas beyond what each collection entry already provides.
 */
export type Collection =
  | 'memories'      // Markdown-ish notes, the "durable" surface
  | 'snapshots'     // Metadata about backups (we export the rows themselves)
  | 'app_state';    // Per-app, per-instance persisted UI state

export interface Memory {
  id: string;
  title: string;
  body: string;
  tags: string[];
  createdAt: number;
  updatedAt: number;
}

export interface AppStateEntry {
  /** Composite key `${appId}/${windowId}` lets windows restore their view. */
  key: string;
  appId: AppId;
  windowId: WindowId;
  state: Record<string, unknown>;
  updatedAt: number;
}

export interface Snapshot {
  id: string;
  createdAt: number;
  appVersion: string;
  counts: Record<string, number>;
  /** The actual payload — zipped JSON on disk. */
  payload: SnapshotPayload;
}

export interface SnapshotPayload {
  memories: Memory[];
  app_state: AppStateEntry[];
}

/* -------------------------- Observers mirror -------------------------- */

/**
 * A subset of the Observers REGISTRY.json — just the fields the agents app
 * needs to render. We don't depend on the file at runtime; the data is
 * bundled as a static JSON so the app boots offline.
 */
export interface ObserverEntry {
  id: string;
  name: string;
  status: 'presente' | 'a_cloner' | 'service_heberge';
  chemin?: string;
  depot?: string;
  url?: string;
  description?: string;
}
