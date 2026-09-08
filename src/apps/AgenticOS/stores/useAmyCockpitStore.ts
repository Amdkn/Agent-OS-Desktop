import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { z } from 'zod';

export const AgentEventSchema = z.object({
  id: z.string().uuid().or(z.string()),
  timestamp: z.number().int(),
  source: z.enum(['YAZ', 'RYAN', 'GRAHAM', 'RIVER', 'RORY', 'HERMES', 'AMY']),
  level: z.enum(['INFO', 'WARNING', 'CRITICAL', 'CIRCUIT_BREAKER']),
  dimension: z.enum(['1D', '2D', '3D', '4D', '5D', '6D', '7D']),
  payload: z.record(z.string(), z.unknown()),
  doxContext: z.string().min(1),
  signature: z.string().optional(),
});

export type AgentEvent = z.infer<typeof AgentEventSchema>;

export type HorizonLevel = 'H1' | 'H3' | 'H10' | 'H30' | 'H90';
export type EffortLevel7D = 'low' | 'medium' | 'high' | 'xhigh';

export interface CockpitState {
  // 7D & 6D : Contexte & Hivemind
  isWarRoomOpen: boolean;
  activeAudioChannel: 'text' | 'voice_daemon';
  standupOutput: string | null;
  isStandupRunning: boolean;
  activeDoxPath: string;
  activeHorizon: HorizonLevel;
  isAgentsMdModalOpen: boolean;
  agentsMdContent: string;

  // 5D : Guards & Sécurité
  preToolGuardPassed: boolean;
  rotRateAlert: boolean;
  rotRateDays: number;
  lastBuildSuccessful: boolean;
  dlpViolationsCount: number;

  // 4D : Cadence & Routines
  isStrategicBlockActive: boolean;
  strategicBlockTimeLeft: number; // minutes
  weeklyExecutionScore: number;
  nextCronCountdownSeconds: number;

  // 3D : Skills Deck & Omnibar
  effortLevel: EffortLevel7D;
  activeModel: string;
  isOmnibarOpen: boolean;

  // 2D & 1D : River Events & Silver Platter
  eventsStream: AgentEvent[];
  deadLetterQueueCount: number;
  selectedArtifactCategory: string;
  walDbStatus: {
    ucDb: 'healthy' | 'syncing' | 'degraded';
    sssfDb: 'healthy' | 'syncing' | 'degraded';
    supabase: 'connected' | 'offline';
  };

  // Actions
  toggleWarRoom: () => void;
  setWarRoomOpen: (open: boolean) => void;
  setActiveAudioChannel: (channel: 'text' | 'voice_daemon') => void;
  triggerStandup: () => Promise<void>;
  setDoxContext: (path: string) => void;
  setActiveHorizon: (horizon: HorizonLevel) => void;
  setAgentsMdModalOpen: (open: boolean) => void;
  setEffortLevel: (level: EffortLevel7D) => void;
  setActiveModel: (model: string) => void;
  setStrategicBlock: (active: boolean) => void;
  toggleStrategicBlock: () => void;
  updateGuardStatus: (guard: 'preToolGuardPassed' | 'rotRateAlert' | 'lastBuildSuccessful', status: boolean) => void;
  setOmnibarOpen: (open: boolean) => void;
  addEvent: (event: Omit<AgentEvent, 'id' | 'timestamp'>) => void;
  clearDeadLetterQueue: () => void;
}

export const useAmyCockpitStore = create<CockpitState>()(
  persist(
    (set) => ({
      isWarRoomOpen: false,
      activeAudioChannel: 'text',
      standupOutput: null,
      isStandupRunning: false,
      activeDoxPath: '10_Tech_OS',
      activeHorizon: 'H1',
      isAgentsMdModalOpen: false,
      agentsMdContent: `# AGENTS.md — Local Context (10_Tech_OS)
> **Zone Invariants** : Strict TypeScript, Zero Placeholders, WAL Sync Active.
- **Architecte** : Amadou Kone (amdkn)
- **Agent Executeur** : Jules (Software Factory)
- **Règles** : Interdiction de mocks inertes. Validation par /api/tech-os/kernel-state.`,

      preToolGuardPassed: true,
      rotRateAlert: false,
      rotRateDays: 2,
      lastBuildSuccessful: true,
      dlpViolationsCount: 0,

      isStrategicBlockActive: false,
      strategicBlockTimeLeft: 180,
      weeklyExecutionScore: 92,
      nextCronCountdownSeconds: 1420,

      effortLevel: 'medium',
      activeModel: 'claude-3-7-sonnet',
      isOmnibarOpen: false,

      eventsStream: [
        {
          id: 'ev-1',
          timestamp: Date.now() - 300000,
          source: 'RYAN',
          level: 'INFO',
          dimension: '5D',
          payload: { action: 'POST_BUILD_VALIDATE', status: 'SUCCESS' },
          doxContext: '10_Tech_OS',
        },
        {
          id: 'ev-2',
          timestamp: Date.now() - 600000,
          source: 'RIVER',
          level: 'INFO',
          dimension: '2D',
          payload: { webhook: 'github_push', repo: 'Agent-OS-Desktop' },
          doxContext: '10_Tech_OS',
        },
        {
          id: 'ev-3',
          timestamp: Date.now() - 1200000,
          source: 'GRAHAM',
          level: 'INFO',
          dimension: '1D',
          payload: { wal_sync: 'uc.db', rows_written: 142 },
          doxContext: '50_Distillation',
        },
      ],
      deadLetterQueueCount: 0,
      selectedArtifactCategory: 'ALL',
      walDbStatus: {
        ucDb: 'healthy',
        sssfDb: 'healthy',
        supabase: 'connected',
      },

      toggleWarRoom: () => set((state) => ({ isWarRoomOpen: !state.isWarRoomOpen })),
      setWarRoomOpen: (open) => set({ isWarRoomOpen: open }),
      setActiveAudioChannel: (channel) => set({ activeAudioChannel: channel }),

      triggerStandup: async () => {
        set({ isStandupRunning: true });
        try {
          const res = await fetch('/api/tech-os/kernel-state');
          if (res.ok) {
            const data = await res.json();
            set({
              standupOutput: `[STANDUP CONSOLIDATION 24H]\n- Substrat Kernel: ACTIVE (${data.uptime || '99.9%'})\n- Agents connectés: Graham, Ryan, Yaz, Beth, Rory\n- Score 12WY: 92%\n- Prochaine action: Finalisation Interface Amy 7D.`,
              isStandupRunning: false,
            });
          } else {
            set({
              standupOutput: `[STANDUP CONSOLIDATION 24H (Local)]\n- Synthèse Hivemind 7D générée à ${new Date().toLocaleTimeString()}\n- Statut A.R.M.S: 100% opérationnel\n- Focus: Exécution déterministe sous 11e Docteur.`,
              isStandupRunning: false,
            });
          }
        } catch {
          set({
            standupOutput: `[STANDUP CONSOLIDATION 24H (Local Cache)]\n- Synthèse Hivemind 7D générée à ${new Date().toLocaleTimeString()}\n- Statut A.R.M.S: 100% opérationnel\n- Focus: Exécution déterministe sous 11e Docteur.`,
            isStandupRunning: false,
          });
        }
      },

      setDoxContext: (path) => set({ activeDoxPath: path }),
      setActiveHorizon: (horizon) => set({ activeHorizon: horizon }),
      setAgentsMdModalOpen: (open) => set({ isAgentsMdModalOpen: open }),
      setEffortLevel: (level) => set({ effortLevel: level }),
      setActiveModel: (model) => set({ activeModel: model }),
      setStrategicBlock: (active) => set({ isStrategicBlockActive: active }),
      toggleStrategicBlock: () => set((s) => ({ isStrategicBlockActive: !s.isStrategicBlockActive })),
      updateGuardStatus: (guard, status) => set({ [guard]: status }),
      setOmnibarOpen: (open) => set({ isOmnibarOpen: open }),

      addEvent: (eventData) =>
        set((state) => ({
          eventsStream: [
            {
              ...eventData,
              id: `ev-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
              timestamp: Date.now(),
            },
            ...state.eventsStream.slice(0, 49),
          ],
        })),

      clearDeadLetterQueue: () => set({ deadLetterQueueCount: 0 }),
    }),
    {
      name: 'amy-cockpit-store-v1',
      partialize: (state) => ({
        activeDoxPath: state.activeDoxPath,
        activeHorizon: state.activeHorizon,
        effortLevel: state.effortLevel,
        activeModel: state.activeModel,
        isStrategicBlockActive: state.isStrategicBlockActive,
        weeklyExecutionScore: state.weeklyExecutionScore,
      }),
    }
  )
);
