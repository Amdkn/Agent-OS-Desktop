import { useState, useEffect, useCallback } from 'react';
import type { RuntimePresence, ReconciliationClassification, SystemStatus, SourceSyncFingerprint } from '../contracts/truth.ts';
import { isPresenceLive } from '../contracts/truth.ts';
import { projectionLayer } from '../api/projection.ts';

export type DisplayStatus = 'LOADING' | 'OFFLINE' | 'AVAILABLE' | 'BOUND' | 'EXECUTING' | 'STALE' | 'DEGRADED' | 'UNKNOWN';

export interface PresenceState {
  status: DisplayStatus;
  presence: RuntimePresence | null;
  reconciliationState: ReconciliationClassification | null;
  systemStatus: SystemStatus | null;
  fingerprint: SourceSyncFingerprint | null;
  evidenceRefs: string[];
  refresh: () => Promise<void>;
}

export function resolveDisplayStatus(
  response: any,
  returnedPresence: RuntimePresence | undefined
): DisplayStatus {
  if (response.status === 'ERROR' || !returnedPresence) {
    return 'UNKNOWN';
  }

  const isLive = isPresenceLive(returnedPresence);
  
  if (!isLive) {
    return 'OFFLINE';
  }

  if (response.systemStatus === 'DEGRADED_PROVIDER') {
     return 'DEGRADED';
  }

  if (response.reconciliationState === 'STALE_CLOUD' || response.reconciliationState === 'CONFLICT') {
     return 'STALE';
  }

  if (returnedPresence.livenessReason === 'executing' || returnedPresence.capabilities?.status === 'executing') {
      return 'EXECUTING';
  } else if (returnedPresence.fencingLeaseIdentity) {
      return 'BOUND';
  } else {
      return 'AVAILABLE';
  }
}

export function useRuntimePresence(identity: string): PresenceState {
  const [presence, setPresence] = useState<RuntimePresence | null>(null);
  const [status, setStatus] = useState<DisplayStatus>('LOADING');
  const [reconciliationState, setReconciliationState] = useState<ReconciliationClassification | null>(null);
  const [systemStatus, setSystemStatus] = useState<SystemStatus | null>(null);
  const [fingerprint, setFingerprint] = useState<SourceSyncFingerprint | null>(null);
  const [evidenceRefs, setEvidenceRefs] = useState<string[]>([]);

  const fetchPresence = useCallback(async () => {
    try {
      const response = await projectionLayer.project({
        requestId: crypto.randomUUID(),
        timestamp: Date.now(),
        authority: 'LOCAL_PROCESS',
        payload: {
          action: 'get_presence',
          identity
        }
      });

      setReconciliationState(response.reconciliationState);
      setSystemStatus(response.systemStatus);
      setFingerprint(response.fingerprint);
      setEvidenceRefs(response.evidenceRefs);

      const returnedPresence = response.data?.presence as RuntimePresence | undefined;
      setPresence(returnedPresence || null);
      setStatus(resolveDisplayStatus(response, returnedPresence));

    } catch (e) {
      console.error("Failed to fetch runtime presence:", e);
      setStatus('UNKNOWN');
    }
  }, [identity]);

  useEffect(() => {
    fetchPresence();
  }, [fetchPresence]);

  return {
    status,
    presence,
    reconciliationState,
    systemStatus,
    fingerprint,
    evidenceRefs,
    refresh: fetchPresence
  };
}
