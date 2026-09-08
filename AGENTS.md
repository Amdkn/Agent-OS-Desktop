# AGENTS.md — Agent OS Desktop (Bureau Souverain V2)

> **Substrat V2** : Bureau multi-fenêtres et intégration du Content Management System (CMS) Hiérarchique Wix Pattern.

---

## 1. Responsabilités & Architecture V2

- **Niveau 1 (Root Items)** : Applications déclarées dans le registre (`apps/registry.ts`).
- **Niveau 2 (Collections de l'App -> Items L2)** : Vues de header et pages de sidebar (`docteur`, `yas`, `ryan`, `graham`, `lineage`, `framework`, `contour`, `vertex`, etc.).
- **Niveau 3 (Collections de la Page -> Items L3)** : Cartes, sections, graphes et widgets.
- **Niveau 4 (Items de Données / Datasets)** : Enregistrements concrets (nœuds, baux, métriques, SOPs, signaux).
- **Niveau 5 (Champs & Attributs)** : Clés, valeurs, types et badges SLA.
- **Niveau 6 (Actions & Déclencheurs)** : Exécution d'actions OSDK, inspection, snapshots WAL.
- **Niveau 7 (Audit Trail & Payloads)** : JSON immuable, signatures RDF et horodatage certifié.

## 2. Invariants de Développement

1. **Compilation Stricte** : `npm run typecheck` (`tsc --noEmit`) doit retourner 0 erreur.
2. **Absence de Placeholders** : `node verif/verif_marqueurs.mjs` vérifié en permanence.
3. **Persistance de Session** : `agent-os.session.v2` dans `localStorage`.
4. **Dock & Navigation** : Bouton d'accès direct `🗂️ CMS Hiérarchique V2` intégré au dock et raccourci dans le menu `Affichage`.
5. **Filtrage Granulaire & Traversant** : La barre de recherche filtre dynamiquement les applications (L1), les vues (L2), les sections (L3) et les enregistrements (L4) avec les sélecteurs de niveau `N1` à `N7`.
6. **Bouton CMS Bidirectionnel** : Chaque application majeure intègre un bouton direct `🗂️ CMS` dans sa barre de titre/header pour basculer instantanément dans l'inspecteur CMS.

## 3. Roadmap V3 & Standard Business OS (Template Reproductible)
- **Alignement Business OS** : Transformation en Template reproductible de Web Desktop le plus avancé (Loi L0 d'auto-réplication).
- **Pilier 1 (Tiling & Aero Snap)** : Ancrage dynamique 50/50, 4 quadrants, visual ghost preview et mode PiP.
- **Pilier 2 (Command Palette ⌘K)** : Spotlight universel indexant les 7 niveaux du CMS V2 avec déclenchement d'actions N6.
- **Pilier 3 (Multi-Workspaces)** : Espaces L0 Tech, L1 Life, L2 Business et Workspaces sur-mesure étanches.
- **Pilier 4 (Widget SDK & Blueprints)** : Moteur déclaratif d'applications et export/import instantané de configuration de bureau (clonage client/franchise).
- **Pilier 5 (Design System & 12 Thèmes)** : 12 thèmes canoniques portés de BusinessOS, injection de tokens CSS dynamiques via `:root`, centre de notifications avec unread badge, toasts interactifs, et Launchpad AppDrawer.
- **Pilier 6 (Architecture AppLayout & Résilience)** : Cadre d'application responsive avec sidebar rétractable, breadcrumbs dans la barre de titre de fenêtre, décodeur défensif d'enveloppe de session et filet de capture d'erreurs globales avec réinitialisation d'urgence `?reset=1`.
- **Pilier 7 (Dock V3 aux Standards BusinessOS & Déploiement GitHub)** :
  - **20 Skins UI/UX Pro Max** portés de BusinessOS (`dockSkins.ts` : glass, clay, brutalism, cyberpunk, retro, macos, win95, solarpunk...).
  - **Placement Réversible à Droite** (`bottom` ou `right`), modifiant dynamiquement la zone de travail utile du bureau (`cadreBureau()`).
  - **Magnification Progressive Fish-Eye** : Transition fluide au survol calculée par distance (1.28x au centre, 1.14x au premier rang, 1.05x au second rang).
  - **Pop-up In-Dock Settings** (`Settings2`) : Commutateur immédiat de position et de skin avec prévisualisation des pastilles.
  - **Dépôt GitHub Public pour Jules** : Synchronisé sur [https://github.com/Amdkn/Agent-OS-Desktop](https://github.com/Amdkn/Agent-OS-Desktop) (branche `main`), validé `tsc --noEmit` 0 erreur, build Vite production conforme, serveur local actif sur le port 5555.
- **Invariant Absolu** : Préservation intégrale et non-régression sur le fenêtrage V1 et le CMS V2.

