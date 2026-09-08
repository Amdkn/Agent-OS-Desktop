import type { ReactNode } from 'react';

export type StatusTone = 'emerald' | 'blue' | 'amber' | 'rose' | 'purple' | 'slate';

export interface BlueprintKpi {
  id: string;
  label: string;
  value: string | number;
  delta?: string;
  trend?: 'up' | 'down' | 'neutral';
  tone?: StatusTone;
  icon?: string;
  subtext?: string;
}

export interface BlueprintColumn<T = Record<string, unknown>> {
  key: string;
  label: string;
  width?: string;
  render?: (value: unknown, row: T) => ReactNode;
}

export interface BlueprintKanbanCard {
  id: string;
  title: string;
  columnId: string;
  description?: string;
  priority?: 'low' | 'medium' | 'high' | 'critical';
  assignee?: string;
  tags?: string[];
  dueDate?: string;
}

export interface BlueprintKanbanColumn {
  id: string;
  title: string;
  tone?: StatusTone;
}

export interface BlueprintAction {
  id: string;
  label: string;
  verb: 'INSPECT' | 'EXECUTE' | 'EXPORT' | 'SYNC' | 'AUDIT';
  description: string;
  endpoint?: string;
  handler?: () => Promise<{ success: boolean; message: string; output?: unknown }>;
}

export interface AppBlueprint<T = Record<string, unknown>> {
  id: string;
  name: string;
  version: string;
  icon: string;
  domaine: 'l0-tech' | 'l1-life' | 'l2-business';
  description: string;
  kpis: BlueprintKpi[];
  dataTitle?: string;
  columns?: BlueprintColumn<T>[];
  dataset?: T[];
  kanbanColumns?: BlueprintKanbanColumn[];
  kanbanCards?: BlueprintKanbanCard[];
  actions?: BlueprintAction[];
}
