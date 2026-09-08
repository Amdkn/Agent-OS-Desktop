# **Document de Conception Préliminaire & Cahier des Charges Strict (PDR)**

**Projet :** Interface Amy (Life-OS-2026) — Cockpit Haptique du 11e Docteur  
**Cadre :** A'Space OS V3 / Agent OS AI-Native  
**Statut :** Spécification d'Ingénierie Déterministe (Zéro Mock, Zéro Paresse)

## **1\. Fondations & Philosophie d'Ingénierie**

L'échec des tableaux de bord agentiques conventionnels réside dans leur superficialité : ils conçoivent une interface visuelle déconnectée de la tuyauterie de données, forçant les modèles à brûler leur contexte en manipulations JSON brutes au lieu d'agir \[[00:19](https://www.youtube.com/watch?v=8NSyI-npJCU&t=19), [04:56](https://www.youtube.com/watch?v=8NSyI-npJCU&t=296)\].  
Ce PDR fusionne le **framework A.R.M.S.** (Applications, Routines, Memory, Skills) documenté par Jay E \[[04:20](https://www.youtube.com/watch?v=8NSyI-npJCU&t=260)\] avec la **Pyramide Déterministe à 7 Niveaux** d'A'Space OS V3.  
L'interface d'Amy n'est pas un visualiseur passif : c'est un **tableau de bord de pilotage haptique** servant d'intermédiaire strict entre l'Architecte, le substrat de persistance (Rory / Supabase / SQLite WAL) et le moteur de workflows asynchrones (River / n8n).

                      ┌──────────────────────────────────────────────┐  
                      │        AMY INTERFACE (Cockpit Web/TUI)       │  
                      └──────────────────────┬───────────────────────┘  
                                             │  
               ┌─────────────────────────────┼─────────────────────────────┐  
               ▼                             ▼                             ▼  
   ┌───────────────────────┐     ┌───────────────────────┐     ┌───────────────────────┐  
   │     RORY (State)      │     │    RIVER (Logic)      │     │    KERNEL L0 (Fam)    │  
   │ Supabase / SQLite WAL │     │ n8n Webhooks / Queues │     │ Graham • Ryan • Yaz   │  
   └───────────────────────┘     └───────────────────────┘     └───────────────────────┘

## **2\. Matrice d'Intégration : A.R.M.S. $\\times$ Pyramide à 7 Niveaux**

| Niveau Pyramide | Foyer Opérationnel | Pilier A.R.M.S. | Composant UI Amy | Rôle Déterministe |
| :---- | :---- | :---- | :---- | :---- |
| **7D** | **Hivemind & War Room** | **Applications** \[[04:20](https://www.youtube.com/watch?v=8NSyI-npJCU&t=260)\] | WarRoomDrawer.tsx | Arbitrage multi-agents, commande /standup \[[01:35](https://www.youtube.com/watch?v=8NSyI-npJCU&t=95)\], consensus vocal |
| **6D** | **Soul & Meta-Routeur** | **Memory (Ontologie)** \[[04:20](https://www.youtube.com/watch?v=8NSyI-npJCU&t=260)\] | ContextBreadcrumb.tsx | Aiguillage local DOX (AGENTS.md), ancrage Ikigai H1–H90 |
| **5D** | **Hooks Déterministes** | **Règles & Sécurité** | DeterministicGuardHUD.tsx | Pre-Tool Guard (DLP/Secrets), Rot-Rate check, Post-Build Gates |
| **4D** | **Crons & Heartbeats** | **Routines** \[[04:20](https://www.youtube.com/watch?v=8NSyI-npJCU&t=260)\] | CadenceTicker.tsx | Scorecard 12WY ($\<85\\%$), timer Strategic Block, cadence circadienne |
| **3D** | **Skills & MCPs** | **Skills** \[[04:20](https://www.youtube.com/watch?v=8NSyI-npJCU&t=260)\] | AmyOmnibar.tsx & SkillsDeck.tsx \[[01:22](https://www.youtube.com/watch?v=8NSyI-npJCU&t=82)\] | Palette Cmd+K, sélecteur d'effort \[[01:22](https://www.youtube.com/watch?v=8NSyI-npJCU&t=82)\], invocation CLI / MCP \[[19:27](https://www.youtube.com/watch?v=8NSyI-npJCU&t=1167)\] |
| **2D** | **Webhooks & Bus Event** | **Applications (Micro-Apps)** \[[01:05](https://www.youtube.com/watch?v=8NSyI-npJCU&t=65)\] | RiverEventStream.tsx & ArtifactsRing.tsx \[[01:46](https://www.youtube.com/watch?v=8NSyI-npJCU&t=106)\] | Ticker d'événements entrants, Dead Letter Queue (DLQ), carrousel d'actifs \[[01:46](https://www.youtube.com/watch?v=8NSyI-npJCU&t=106)\] |
| **1D** | **Data Pantry (Silver Platter)** | **Memory (Données Brutes)** \[[04:20](https://www.youtube.com/watch?v=8NSyI-npJCU&t=260)\] | SilverPlatterGrid.tsx | Vues matérialisées, statut WAL (uc.db, sssf.db), zéro JSON brut |

## **3\. Spécifications Détaillées des Modules de l'Interface Amy**

### **Module 7D — War Room & Hivemind (WarRoomDrawer.tsx)**

* **Spécification :** Volet latéral contextuel escamotable (Framer Motion) matérialisant le conseil des agents.  
* **Fonctions Clés :**  
  * **Commande /standup globale :** Déclenche un appel unifié interrogeant les mémoires des agents A2 (12WY, PARA, GTD, Ikigai) pour produire un état consolidé des dernières 24h.  
  * **Sélecteur de Canal :** Bascule instantanée entre le flux textuel condensé et l'écoute du flux audio émis par le démon vocal local (antigravity\_tts\_daemon.py).  
  * **Arène de Débat :** Possibilité de confronter deux perspectives d'agents (ex. *Beth Visionnaire* vs *Ryan Bâtisseur*) avant d'appliquer un arbitrage.

### **Module 6D — Context Breadcrumb & Sélecteur DOX (ContextBreadcrumb.tsx)**

* **Spécification :** Barre d'ancrage persistant en tête d'application.  
* **Fonctions Clés :**  
  * **Aiguillage DOX Actif :** Affiche le sous-dossier maître actuellement ciblé (ex. 10\_Tech\_OS, 50\_Distillation, 70\_Onthologies).  
  * **Inspecteur de AGENTS.md :** Clic droit ouvrant une modale affichant le AGENTS.md local injecté, évitant à l'opérateur de fouiller le système de fichiers.  
  * **Jauge d'Horizon Ikigai :** Indicateur visuel reliant la tâche courante à un horizon explicite (H1, H3, H10, H30, H90).

### **Module 5D — HUD des Gardes Déterministes (DeterministicGuardHUD.tsx)**

* **Spécification :** Affichage d'état des circuits-coupeurs de runtime (*Circuit Breakers*).  
* **Fonctions Clés :**  
  * **Pre-Tool Guard (DLP) :** Témoin lumineux vert/rouge validant l'absence de fuite de tokens, clés API ou données sensibles dans les requêtes sortantes.  
  * **Indicateur de Taux de Pourrissement (*Rot Rate*) :** Surveille le timestamp des schémas et contextes ; passage en ambre si la documentation n'a pas été actualisée depuis $\> 7$ jours.  
  * **Post-Build Gate (SSSF) :** Statut de validation de la forge de Ryan (post\_build\_validator.py). Verrouille l'interface en cas d'échec de compilation TypeScript (tsc \--noEmit).

### **Module 4D — Métronome Temporel & Routines (CadenceTicker.tsx)**

* **Spécification :** Widget de cadencement opérationnel calé sur les cycles de productivité \[[01:12](https://www.youtube.com/watch?v=8NSyI-npJCU&t=72)\].  
* **Fonctions Clés :**  
  * **Jauge 12WY :** Score d'exécution binaire hebdomadaire mis à jour par la routine Cron du dimanche soir.  
  * **Verrou "Strategic Block" :** Minuteur déclenchant une isolation complète de l'interface (mode sombre profond, masquage de tous les widgets secondaires, blocage des webhooks non critiques) pendant les sessions de Deep Work de 3h.  
  * **Moniteur de Crons :** Compte à rebours avant le prochain Heartbeat système (standup matinal, consolidation nocturne de Graham).

### **Module 3D — Amy Omnibar & Skills Deck (AmyOmnibar.tsx & SkillsDeck.tsx)**

* **Spécification :** Centre de commande hybride inspiré du "Skills Deck" de Jay E \[[01:22](https://www.youtube.com/watch?v=8NSyI-npJCU&t=82)\] et de l'Omnibar type Raycast.  
* **Fonctions Clés :**  
  * **Palette Cmd+K :** Entrée universelle avec autocomplétion des slash-commands (/build, /capture, /audit, /dispatch).  
  * **Curseur de Niveau d'Effort :** Slider (Faible / Moyen / Élevé) modulant la profondeur de raisonnement du modèle sous-jacent \[[01:22](https://www.youtube.com/watch?v=8NSyI-npJCU&t=82)\].  
  * **Sélecteur de Substrat :** Bascule dynamique du modèle d'exécution (Claude 3.7 Sonnet, Claude 5, Gemini 2.0 Flash, ou modèle local via Ollama/Hermes) selon la sensibilité de la tâche \[[01:22](https://www.youtube.com/watch?v=8NSyI-npJCU&t=82)\].

### **Module 2D — River Event Stream & Artifacts Ring (RiverEventStream.tsx & ArtifactsRing.tsx)**

* **Spécification :** Zone de télémétrie asynchrone et d'exploration d'artéfacts \[[01:46](https://www.youtube.com/watch?v=8NSyI-npJCU&t=106)\].  
* **Fonctions Clés :**  
  * **Flux d'Événements River :** Ticker défilant horizontalement affichant les webhooks absorbés par n8n (commits Git, alertes PostHog Yaz, encaissements).  
  * **Alerte DLQ (Dead Letter Queue) :** Compteur d'événements en échec nécessitant une intervention manuelle ou un rejeu automatisé.  
  * **Artifacts Ring :** Carrousel visuel indexant chronologiquement les derniers livrables produits par Ryan (SOPs générées, schémas DB, composants UI, exports HTML) avec moteur de recherche instantané \[[01:46](https://www.youtube.com/watch?v=8NSyI-npJCU&t=106), [01:51](https://www.youtube.com/watch?v=8NSyI-npJCU&t=111)\].

### **Module 1D — Silver Platter Grid (SilverPlatterGrid.tsx)**

* **Spécification :** Grille centrale de widgets modulaires alimentée exclusivement par des vues SQL matérialisées et le script silver\_platter.py.  
* **Fonctions Clés :**  
  * **Interdiction de JSON brut :** Aucune carte n'affiche de dump de données non traité. Toute donnée est préalablement condensée en KPIs binaires ou ratios synthétiques.  
  * **Santé de la Pantry :** Indicateurs de connexion et latence des bases locales SQLite WAL (uc.db, sssf.db) et de la persistance distante Supabase.  
  * **Modularité Drag & Drop :** Disposition personnalisable des cartes (Santé LD03, Cash LD02, Delivery BD05) via CSS Grid responsive \[[01:32](https://www.youtube.com/watch?v=8NSyI-npJCU&t=92)\].

## **4\. Stack Technique & Invariants Anti-Paresse**

L'architecture logicielle applique des règles de conception strictes interdisant les raccourcis de développement :

* **Framework :** Next.js 15 (App Router, Server Components pour le rendu initial, Client Components isolés pour l'interactivité).  
* **Moteur Graphique :** React 19 \+ Tailwind CSS v4 (zéro configuration CSS complexe, utilisation des tokens natifs).  
* **Gestion d'État :** Zustand avec middleware devtools et persistance sélective sur localStorage.  
* **Animations :** Motion (framer-motion) pour les transitions physiques (tiroirs, volets, modales).  
* **Contrats d'Interface :** **Zod obligatoire** pour toute charge utile traversant l'application.

TypeScript  
// Contrat Zod d'Interception d'Événement (Exemple strict)  
import { z } from "zod";

export const AgentEventSchema \= z.object({  
  id: z.string().uuid(),  
  timestamp: z.number().int(),  
  source: z.enum(\["YAZ", "RYAN", "GRAHAM", "RIVER", "RORY"\]),  
  level: z.enum(\["INFO", "WARNING", "CRITICAL", "CIRCUIT\_BREAKER"\]),  
  dimension: z.enum(\["1D", "2D", "3D", "4D", "5D", "6D", "7D"\]),  
  payload: z.record(z.unknown()),  
  doxContext: z.string().min(1),  
  signature: z.string().min(32)  
});

export type AgentEvent \= z.infer\<typeof AgentEventSchema\>;

### **Règles de Recette Déterministes (Validation Gates)**

> 1. **Compilation Stricte :** Interdiction de commiter si pnpm tsc \--noEmit produit un avertissement ou une erreur.  
> 2. **Zéro Mock Vide :** Tout composant doit être branché soit sur une API réelle, soit sur le cache SQLite WAL local. Aucun composant avec du faux texte en dur (*lorem ipsum*) n'est toléré en production.  
> 3. **Isolation des Effets :** Aucun useEffect non assorti d'une fonction de nettoyage (*cleanup*) et d'un tableau de dépendances exhaustif.

## **5\. Schéma d'État Centralisé (Zustand Store)**

L'état global de l'interface est unifié dans un store unique partitionné pour éviter les re-rendus parasites :

TypeScript  
// stores/useAmyCockpitStore.ts  
import { create } from "zustand";

interface CockpitState {  
  // 7D & 6D : Contexte & Hivemind  
  isWarRoomOpen: boolean;  
  activeDoxPath: string;  
  activeHorizon: "H1" | "H3" | "H10" | "H30" | "H90";  
    
  // 5D : Guards & Sécurité  
  preToolGuardPassed: boolean;  
  rotRateAlert: boolean;  
  lastBuildSuccessful: boolean;  
    
  // 4D : Cadence  
  isStrategicBlockActive: boolean;  
  weeklyExecutionScore: number;  
    
  // 3D : Skills Deck  
  effortLevel: "low" | "medium" | "high";  
  activeModel: string;  
    
  // Actions  
  toggleWarRoom: () \=\> void;  
  setDoxContext: (path: string) \=\> void;  
  setEffortLevel: (level: "low" | "medium" | "high") \=\> void;  
  setStrategicBlock: (active: boolean) \=\> void;  
  updateGuardStatus: (guard: string, status: boolean) \=\> void;  
}

export const useAmyCockpitStore \= create\<CockpitState\>((set) \=\> ({  
  isWarRoomOpen: false,  
  activeDoxPath: "10\_Tech\_OS",  
  activeHorizon: "H1",  
  preToolGuardPassed: true,  
  rotRateAlert: false,  
  lastBuildSuccessful: true,  
  isStrategicBlockActive: false,  
  weeklyExecutionScore: 100,  
  effortLevel: "medium",  
  activeModel: "claude-3-7-sonnet",  
    
  toggleWarRoom: () \=\> set((state) \=\> ({ isWarRoomOpen: \!state.isWarRoomOpen })),  
  setDoxContext: (path) \=\> set({ activeDoxPath: path }),  
  setEffortLevel: (level) \=\> set({ effortLevel: level }),  
  setStrategicBlock: (active) \=\> set({ isStrategicBlockActive: active }),  
  updateGuardStatus: (guard, status) \=\> set({ \[guard\]: status }),  
}));

## **6\. Plan de Déploiement & Jalons d'Implémentation**

Le déploiement est confié à la **Software Factory de Ryan (SSSF)** selon un découpage par gates de validation :

\[ Gate 0 : Substrat 1D-2D \] ──► \[ Gate 1 : Action 3D-5D \] ──► \[ Gate 2 : Hivemind 6D-7D \]  
  \- Schémas Zod & Types           \- AmyOmnibar & Skills Deck      \- WarRoomDrawer & Audio  
  \- Endpoints SQLite/Supabase     \- HUD des Guards déterministes  \- Meta-Routeur DOX  
  \- SilverPlatterGrid minimal     \- CadenceTicker & Crons         \- Intégration Vercel

* **Jalon 1 (Gate 0 — Fondations & Pantry) :**  
  * Mise en place de l'arborescence Next.js 15 dans apps/life-os-2026.  
  * Établissement des schémas Zod et du store Zustand.  
  * Connexion du composant SilverPlatterGrid aux données pré-mâchées de silver\_platter.py.  
* **Jalon 2 (Gate 1 — Moteur d'Action & Déterminisme) :**  
  * Implémentation de AmyOmnibar et du slider d'effort du Skills Deck \[[01:22](https://www.youtube.com/watch?v=8NSyI-npJCU&t=82)\].  
  * Intégration du DeterministicGuardHUD branché sur les sorties de pre\_tool\_guard.py et post\_build\_validator.py.  
  * Activation du ticker de cadence 12WY et du minuteur de Strategic Block.  
* **Jalon 3 (Gate 2 — Souveraineté & Orchestration) :**  
  * Développement du WarRoomDrawer avec support de la commande /standup \[[01:35](https://www.youtube.com/watch?v=8NSyI-npJCU&t=95)\].  
  * Branchement de la passerelle audio avec le démon vocal antigravity\_tts\_daemon.py.  
  * Déploiement de production sur Vercel avec synchronisation automatique via River.

Le cadre d'ingénierie est verrouillé. Souhaites-tu que Ryan génère immédiatement le composant racine **AmyOmnibar.tsx** avec son sélecteur d'effort et ses contrats Zod, ou préfères-tu commencer par monter le store global Zustand ?