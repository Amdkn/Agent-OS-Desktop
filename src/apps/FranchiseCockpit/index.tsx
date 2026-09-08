import type { AppManifest } from '../../types';
import type { AppBlueprint } from '../../blueprints/types';
import { BlueprintAppFactory } from '../../blueprints/BlueprintAppFactory';

export const manifest: AppManifest = {
  id: 'franchise-cockpit',
  name: 'Cockpit Franchise V3',
  kind: 'multi',
  domaine: 'l2-business',
  description: 'Template reproductible de franchise multi-tenant & affiliation (Standard Business OS)',
  icon: '🏛️',
};

interface TenantRow extends Record<string, unknown> {
  id: string;
  name: string;
  tier: string;
  mrr: string;
  affiliates: number;
  status: string;
  lastPulse: string;
}

const franchiseBlueprint: AppBlueprint<TenantRow> = {
  id: 'franchise-cockpit',
  name: 'Cockpit Franchise & Multi-Tenant V3',
  version: '3.0.0',
  icon: '🏛️',
  domaine: 'l2-business',
  description: 'Gouvernance des franchises, affiliation récursive et instanciation de client clones (Loi L0).',
  kpis: [
    {
      id: 'kpi-arr',
      label: 'Revenus Récurrents (MRR)',
      value: '42,500 $',
      delta: '+18.4 %',
      trend: 'up',
      tone: 'emerald',
      icon: '💎',
      subtext: 'Calculé sur 18 franchises actives',
    },
    {
      id: 'kpi-clones',
      label: 'Client Clones Déployés',
      value: '18 / 25',
      delta: '+4 ce mois',
      trend: 'up',
      tone: 'blue',
      icon: '🧬',
      subtext: 'Templates Web Desktop instanciés',
    },
    {
      id: 'kpi-affiliation',
      label: 'Commissions Affiliation',
      value: '6,250 $',
      delta: 'Palier Coach L1 atteint',
      trend: 'neutral',
      tone: 'purple',
      icon: '🤝',
      subtext: 'Modèle Tiers 0 à 3 respecté',
    },
    {
      id: 'kpi-sprint',
      label: 'Sprints 12WY Actifs',
      value: '5 / 5',
      delta: '100% SLA',
      trend: 'up',
      tone: 'amber',
      icon: '⚡',
      subtext: "Cadence d'exécution continue",
    },
  ],
  dataTitle: 'Registre des Franchises & Tenants Affiliés',
  columns: [
    { key: 'name', label: 'Nom du Tenant / Franchise', width: '25%' },
    { key: 'tier', label: 'Tier Métier', width: '15%' },
    { key: 'mrr', label: 'Cotisation SaaS', width: '15%' },
    { key: 'affiliates', label: 'Filleuls L2/L3', width: '15%' },
    { key: 'status', label: 'Statut', width: '15%' },
    { key: 'lastPulse', label: 'Dernier Pulse', width: '15%' },
  ],
  dataset: [
    {
      id: 'ten-001',
      name: 'Amadeus Core Sovereign (L0)',
      tier: 'Level 0 (Architect)',
      mrr: '0 $ (Root)',
      affiliates: 18,
      status: 'SOVEREIGN',
      lastPulse: "Aujourd'hui 16:30",
    },

    {
      id: 'ten-002',
      name: 'Coach OS Franchise Prime (L1)',
      tier: 'Level 1 (Coach)',
      mrr: '1,500 $/m',
      affiliates: 6,
      status: 'RENTABLE_PLUS',
      lastPulse: 'Hier 19:15',
    },
    {
      id: 'ten-003',
      name: 'Nexus Corp Enterprise (L2)',
      tier: 'Level 2 (CEO)',
      mrr: '1,000 $/m',
      affiliates: 4,
      status: 'ACTIF',
      lastPulse: '2026-09-06',
    },
    {
      id: 'ten-004',
      name: 'Solaris Innovation Hub (L2)',
      tier: 'Level 2 (CEO)',
      mrr: '1,000 $/m',
      affiliates: 2,
      status: 'ACTIF',
      lastPulse: '2026-09-05',
    },
  ],
  kanbanColumns: [
    { id: 'onboarding', title: 'Onboarding Franchise', tone: 'blue' },
    { id: 'instanciation', title: 'Clonage Desktop (L0)', tone: 'purple' },
    { id: 'production', title: 'En Exploitation', tone: 'emerald' },
    { id: 'scaling', title: 'Expansion 12WY', tone: 'amber' },
  ],
  kanbanCards: [
    {
      id: 'card-1',
      title: 'Déploiement Template Client #19',
      columnId: 'instanciation',
      description: 'Export du bureau V3 avec les apps Tech OS et Business OS préconfigurées.',
      priority: 'high',
      assignee: 'Bill (Forge)',
      tags: ['template', 'clone'],
    },
    {
      id: 'card-2',
      title: "Validation Contrat d'Affiliation Coach OS",
      columnId: 'onboarding',
      description: 'Vérification du palier $1,500/m avec 3 CEOs parrainés pour gratuité.',
      priority: 'medium',
      assignee: 'Donna (DLQ)',
      tags: ['contrat', 'legal'],
    },
    {
      id: 'card-3',
      title: 'Audit Pulse Hebdomadaire Jerry',
      columnId: 'production',
      description: 'Génération du rapport hebdomadaire consolidé des 4 variantes.',
      priority: 'critical',
      assignee: 'Doctor 12',
      tags: ['pulse', 'audit'],
    },
  ],
  actions: [
    {
      id: 'act-clone-desk',
      label: 'Cloner le Web Desktop (Template JSON)',
      verb: 'EXPORT',
      description: 'Exporte le schéma complet du bureau pour livraison instantanée à un client.',
      handler: async () => {
        return { success: true, message: 'Template de bureau exporté selon la Loi L0 (Rick)' };
      },
    },
    {
      id: 'act-recalc-tiers',
      label: "Recalculer les Paliers d'Affiliation",
      verb: 'EXECUTE',
      description: 'Vérifie les quotas de parrainage et applique les remises directes.',
      handler: async () => {
        return { success: true, message: 'Paliers recalculés : 4 franchises en gratuité nette atteinte' };
      },
    },
    {
      id: 'act-sync-registre',
      label: 'Synchroniser le Registre PARA Business OS',
      verb: 'SYNC',
      description: "Vérifie l'alignement avec 30_Business_OS/00_Registre/registre_para.json.",
      handler: async () => {
        return { success: true, message: 'Registre PARA synchronisé : 14/14 invariants vérifiés' };
      },
    },
  ],

};

export function App() {
  return <BlueprintAppFactory blueprint={franchiseBlueprint} />;
}

export default App;
