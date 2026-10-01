import assert from 'node:assert/strict';
import { evaluateLiveProjection } from './live-projection-canary.ts';
import type { ApiProjectionResponse } from '../src/contracts/truth.ts';

const now = 1_800_000_000_000;

function base(): ApiProjectionResponse {
  return {
    requestId: '11111111-1111-4111-8111-111111111111',
    timestamp: now,
    status: 'SUCCESS',
    systemStatus: 'DEGRADED_PROVIDER',
    reconciliationState: 'STALE_CLOUD',
    fingerprint: {
      parentRepoSha: 'UNKNOWN',
      parentGitlinkCommitSha: 'UNKNOWN',
      parentGitlink: 'local',
      agentOsDesktopHeadSha: 'abcdef1234567890',
      agentOsDesktopIsDirty: false,
    },
    evidenceRefs: ['route-degraded_provider'],
    data: {
      action: 'get_presence',
      presence: {
        identity: 'worker-1',
        provenance: 'aspace.dc.runtime.v1/health_urls.browser',
        observedAt: now - 1000,
        expiresAt: now + 4000,
        ttlSeconds: 5,
        livenessReason: 'browser_worker_active',
        evidenceRefs: ['runtime-manifest:aspace.dc.runtime.v1'],
        fencingLeaseIdentity: 'fence:7',
        capabilities: { 'browser.tabs.read': 'AVAILABLE' },
      },
    },
  };
}

{
  const result = evaluateLiveProjection(base(), {
    requestId: base().requestId,
    baseUrl: 'http://127.0.0.1:5555',
    expectedSystemStatus: 'DEGRADED_PROVIDER',
    now,
  });
  assert.equal(result.pass, true);
  assert.equal(result.presence?.fencingLeaseIdentity, 'fence:7');
}

{
  const response = base();
  (response.data!.presence as any).expiresAt = now - 1;
  const result = evaluateLiveProjection(response, {
    requestId: response.requestId,
    baseUrl: 'http://127.0.0.1:5555',
    expectedSystemStatus: 'DEGRADED_PROVIDER',
    now,
  });
  assert.equal(result.pass, false);
  assert.equal(
    result.checks.find((check) => check.name === 'runtime_presence_live')?.pass,
    false
  );
}

{
  const response = base();
  response.fingerprint.agentOsDesktopHeadSha = 'UNKNOWN';
  const result = evaluateLiveProjection(response, {
    requestId: response.requestId,
    baseUrl: 'http://127.0.0.1:5555',
    now,
  });
  assert.equal(result.pass, false);
}

{
  const response = base();
  response.systemStatus = 'OFFLINE_LOCAL';
  response.reconciliationState = 'LIVE_LOCAL';
  response.data = { action: 'get_presence' };
  const result = evaluateLiveProjection(response, {
    requestId: response.requestId,
    baseUrl: 'http://127.0.0.1:5555',
    expectedSystemStatus: 'OFFLINE_LOCAL',
    now,
  });
  assert.equal(result.pass, true);
}

console.log('AGENT_OS_LIVE_CANARY_CONTRACT_PASS');
