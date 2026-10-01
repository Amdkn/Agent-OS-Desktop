import type { ApiProjectionResponse } from '../../contracts/truth.ts';

const baseFingerprint = {
  parentRepoSha: 'fixture-repo-0000',
  parentGitlinkCommitSha: 'fixture-gitlink-0000',
  parentGitlink: 'local',
  agentOsDesktopHeadSha: 'fixture-head-0000',
  agentOsDesktopIsDirty: false
};

const currentTime = Date.now();

// State 1: live local worker + fresh Supabase projection
export const fixtureState1: ApiProjectionResponse = {
  requestId: 'fixture-1',
  timestamp: currentTime,
  status: 'SUCCESS',
  data: {
    presence: {
      identity: 'local-worker',
      provenance: 'fixture',
      observedAt: currentTime - 1000,
      expiresAt: currentTime + 5000,
      ttlSeconds: 15,
      livenessReason: 'heartbeat',
      evidenceRefs: ['fixture-live'],
      fencingLeaseIdentity: '',
      capabilities: {}
    }
  },
  systemStatus: 'ONLINE_AUTHENTICATED',
  reconciliationState: 'IN_SYNC',
  fingerprint: baseFingerprint,
  evidenceRefs: ['route-online_authenticated']
};

// State 2: live local worker + stale Supabase
export const fixtureState2: ApiProjectionResponse = {
  requestId: 'fixture-2',
  timestamp: currentTime,
  status: 'SUCCESS',
  data: {
    presence: {
      identity: 'local-worker',
      provenance: 'fixture',
      observedAt: currentTime - 1000,
      expiresAt: currentTime + 5000,
      ttlSeconds: 15,
      livenessReason: 'heartbeat',
      evidenceRefs: ['fixture-stale-supa'],
      fencingLeaseIdentity: '',
      capabilities: {}
    }
  },
  systemStatus: 'ONLINE_AUTHENTICATED',
  reconciliationState: 'STALE_CLOUD', // Local ahead
  fingerprint: baseFingerprint,
  evidenceRefs: ['route-online_authenticated', 'stale-cloud-detected']
};

// State 3: dead worker + stale LIVE cloud record
export const fixtureState3: ApiProjectionResponse = {
  requestId: 'fixture-3',
  timestamp: currentTime,
  status: 'SUCCESS',
  data: {
    presence: {
      identity: 'local-worker',
      provenance: 'fixture',
      observedAt: currentTime - 10000,
      expiresAt: currentTime - 1000, // Expired!
      ttlSeconds: 15,
      livenessReason: 'stale-record',
      evidenceRefs: ['fixture-dead'],
      fencingLeaseIdentity: '',
      capabilities: {}
    }
  },
  systemStatus: 'ONLINE_AUTHENTICATED',
  reconciliationState: 'CLOUD_AHEAD',
  fingerprint: baseFingerprint,
  evidenceRefs: ['route-online_authenticated']
};

// State 4: source/submodule drift
export const fixtureState4: ApiProjectionResponse = {
  requestId: 'fixture-4',
  timestamp: currentTime,
  status: 'SUCCESS',
  data: {
    presence: {
      identity: 'local-worker',
      provenance: 'fixture',
      observedAt: currentTime - 1000,
      expiresAt: currentTime + 5000,
      ttlSeconds: 15,
      livenessReason: 'heartbeat',
      evidenceRefs: ['fixture-drift'],
      fencingLeaseIdentity: '',
      capabilities: {}
    }
  },
  systemStatus: 'ONLINE_AUTHENTICATED',
  reconciliationState: 'NESTED_REPO_DRIFT',
  fingerprint: { ...baseFingerprint, parentGitlinkCommitSha: 'drifted-0000' },
  evidenceRefs: ['route-online_authenticated', 'repo-drift-detected']
};

// State 5: Supabase unavailable
export const fixtureState5: ApiProjectionResponse = {
  requestId: 'fixture-5',
  timestamp: currentTime,
  status: 'SUCCESS',
  data: {
    presence: {
      identity: 'local-worker',
      provenance: 'fixture',
      observedAt: currentTime - 1000,
      expiresAt: currentTime + 5000,
      ttlSeconds: 15,
      livenessReason: 'heartbeat',
      evidenceRefs: ['fixture-no-supa'],
      fencingLeaseIdentity: '',
      capabilities: {}
    }
  },
  systemStatus: 'DEGRADED_PROVIDER',
  reconciliationState: 'LIVE_LOCAL',
  fingerprint: baseFingerprint,
  evidenceRefs: ['route-degraded_provider']
};

// State 6: local runtime unavailable
export const fixtureState6: ApiProjectionResponse = {
  requestId: 'fixture-6',
  timestamp: currentTime,
  status: 'ERROR',
  error: 'Local runtime connection refused',
  systemStatus: 'OFFLINE_LOCAL',
  reconciliationState: 'IN_SYNC',
  fingerprint: baseFingerprint,
  evidenceRefs: ['route-offline_local', 'conn-refused']
};

// State 7: reconnect with newer fencing token
export const fixtureState7: ApiProjectionResponse = {
  requestId: 'fixture-7',
  timestamp: currentTime,
  status: 'SUCCESS',
  data: {
    presence: {
      identity: 'local-worker',
      provenance: 'fixture',
      observedAt: currentTime - 1000,
      expiresAt: currentTime + 5000,
      ttlSeconds: 15,
      livenessReason: 'reconnected',
      evidenceRefs: ['fixture-reconnect'],
      fencingLeaseIdentity: 'new-fencing-token-1234',
      capabilities: {}
    }
  },
  systemStatus: 'ONLINE_AUTHENTICATED',
  reconciliationState: 'IN_SYNC',
  fingerprint: baseFingerprint,
  evidenceRefs: ['route-online_authenticated', 'fencing-token-updated']
};

export const canaryFixtures = [
  fixtureState1,
  fixtureState2,
  fixtureState3,
  fixtureState4,
  fixtureState5,
  fixtureState6,
  fixtureState7
];
