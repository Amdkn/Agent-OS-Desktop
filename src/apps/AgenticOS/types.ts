export interface MicroAppItem {
  id: string;
  name: string;
  description: string;
  icon: string;
  badge?: string;
  category: 'core' | 'custom' | 'external';
  url?: string;
}

export interface CalendarEvent {
  id: string;
  time: string;
  title: string;
  category: 'client' | 'agentic' | 'content' | 'routine';
  duration: string;
}

export interface EmailIntel {
  total24h: number;
  unread: number;
  syncedAt: string;
  syncAccount: string;
  flagged: Array<{
    id: string;
    title: string;
    sender: string;
    timeAgo: string;
    priority: 'high' | 'medium' | 'urgent';
  }>;
  distribution: Array<{
    label: string;
    count: number;
    color: string;
  }>;
}

export type ClaudeModel = 'HAIKU' | 'SONNET' | 'OPUS' | 'FABLE' | 'GLM';
export type EffortLevel = 'LOW' | 'MEDIUM' | 'HIGH' | 'XHIGH' | 'MAX';

export interface SkillCard {
  id: string;
  command: string;
  name: string;
  icon: string;
  description: string;
  defaultModel: ClaudeModel;
  defaultEffort: EffortLevel;
  selectedModel: ClaudeModel;
  selectedEffort: EffortLevel;
  lastRun?: string;
  lastOutput?: string;
  status: 'idle' | 'running' | 'success' | 'error';
}

export interface RoutineItem {
  id: string;
  time: string;
  name: string;
  runner: 'HERMES' | 'DESKTOP' | 'CLOUD';
  status: 'FIRED' | 'NEXT' | 'QUEUED' | 'RUNNING' | 'ERROR';
  frequency: string;
  lastRun?: string;
}

export interface BrainNode {
  id: string;
  label: string;
  type: 'app' | 'routine' | 'department' | 'memory_file' | 'skill' | 'core';
  department?: 'CONTENT' | 'COMMUNITY' | 'PRODUCT' | 'PERSONAL' | 'BUSINESS';
  layer: 1 | 2 | 3 | 4; // 1: Core/Skill, 2: Memory/Dept, 3: Routines, 4: Apps
  icon?: string;
  path?: string;
  size?: number;
  connections: string[];
}

export interface GenerationAsset {
  id: string;
  title: string;
  client: string;
  date: string;
  type: 'image' | 'video' | 'mockup' | 'pdf' | 'html';
  thumbnailUrl: string;
  prompt?: string;
  ratio?: string;
}
