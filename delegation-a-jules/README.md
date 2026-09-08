# MANDAT DE DÉLÉGATION À JULES (BUILD AGENT)
## Projet : Interface Amy (Agentic OS / ARMS Cockpit)

> **Destinataire :** Jules (Google Cloud / Coding Agent)  
> **Commanditaire :** Amadou Kone (`amdkn`) via l'Orchestrateur Antigravity  
> **Cible du Code :** `c:\Users\amado\agent-os\desktop\src\apps\AgenticOS\`  
> **Spécification Fondatrice :** [`PRD-Interface-Amy-Agentic-OS-ARMS.md`](./PRD-Interface-Amy-Agentic-OS-ARMS.md)

---

## 1. Contexte & Rôle de Jules dans l'Écosystème

Antigravity agit comme **l'Orchestrateur Suprême du War Room (Hivemind)**. Pour préserver les quotas d'orchestration, l'exécution lourde des composants React et le build UI sont délégués à **Jules**.

- **Amy (`companion_amy_interface`)** est l'agent responsable de l'ergonomie, de l'expérience utilisateur et de la surface visuelle sous le 11e Docteur (Life Core, Domaine L1).
- L'application existante **Agentic OS** (`src/apps/AgenticOS/`) sert de socle ARMS (RoboNuggets / Jay E).
- **La mission de Jules :** Enrichir, câbler et finaliser les 7 modules de l'interface d'Amy conformément au PRD joint.

---

## 2. Règles Inviolables d'A'Space OS V3 pour Jules

Toute contribution de Jules doit respecter sans exception les invariants suivants :

### Règle 1 : Zéro Mock, Zéro Coquille Vide (Anti-Paresse)
- Interdiction formelle d'écrire des composants `<div>TODO</div>` ou des faux boutons inactifs.
- Chaque bouton doit posséder un gestionnaire d'événement (`onClick`), un feedback visuel ou un appel d'API vers le backend Tech OS (`/api/tech-os/*` ou les stores Zustand du shell).

### Règle 2 : TypeScript Strict (Compilation à 0 Erreur)
- Aucune régression tolérée. La commande suivante doit s'exécuter avec succès avant de considérer le travail fini :
  ```bash
  npm run typecheck
  # ou npx tsc --noEmit
  ```

### Règle 3 : Respect du Design System & Thèmes d'Agent OS
- Utilisation de Tailwind CSS et Lucide-React.
- Prise en charge des thèmes sombres/haptiques existants (fond `#0b0e14`, accents émeraude, cyan, violet, orange).
- L'agencement doit s'intégrer harmonieusement dans le WindowFrame du bureau d'Agent OS (port `5555`).

### Règle 4 : Plomberie Déterministe (Pyramide à 7 Niveaux)
Les composants doivent s'articuler selon la hiérarchie A.R.M.S. $\times$ 7D définie au PRD :
- **7D War Room Drawer :** Volet escamotable pour le standup multi-agents et feedback vocal.
- **6D Context Breadcrumb :** Affichage de l'ancrage DOX (`AGENTS.md` local) et de l'horizon Ikigai (H1 à H90).
- **5D Deterministic Guard HUD :** Indicateurs Pre-Tool Guard (DLP/Secrets), Rot Rate (> 7 jours) et Gates SSSF.
- **4D Cadence Ticker :** Routines circadiennes et Scorecard 12WY.
- **3D Skills Deck & Omnibar :** Invocation d'outils et sélecteur d'effort de modèle.
- **2D River Event Stream & Artifacts Ring :** Carrousel d'actifs et flux d'événements asynchrones.
- **1D Silver Platter Grid :** Données pré-mâchées, statut WAL de `uc.db` et `sssf.db`.

---

## 3. Fichiers Disponibles pour Jules

1. [`PRD-Interface-Amy-Agentic-OS-ARMS.md`](./PRD-Interface-Amy-Agentic-OS-ARMS.md) : Cahier des charges exhaustif rédigé par Amadou Kone.
2. `src/apps/AgenticOS/index.tsx` : Point d'entrée existant de l'application.
3. `src/apps/AgenticOS/components/` : Composants actuels (`CommandCenter.tsx`, `SecondBrainOrbit.tsx`, `SkillsDeckModal.tsx`, etc.).

---

## 4. Livrables Attendus de Jules

1. Implémentation complète et typée des nouveaux composants ou refonte intégrée de `CommandCenter.tsx`.
2. Validation stricte du build (`npm run build` ou `npm run typecheck`).
3. Commit Git clair sur la branche de travail.
