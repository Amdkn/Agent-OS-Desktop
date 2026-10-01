import assert from 'node:assert';
import { resolveDisplayStatus } from './useRuntimePresence.ts';
import type { RuntimePresence } from '../contracts/truth.ts';

function runTests() {
  console.log("Running useRuntimePresence tests...");
  let passed = 0;
  let failed = 0;

  function check(condition: boolean, message: string) {
    if (condition) {
      passed++;
    } else {
      failed++;
      console.error(`❌ FAILED: ${message}`);
    }
  }

  const now = Date.now();
  
  // Test: UI cannot show ONLINE (AVAILABLE) without fresh runtime evidence (expired expiresAt)
  const expiredPresence: RuntimePresence = {
    identity: 'test-agent',
    provenance: 'test',
    observedAt: now - 10000,
    expiresAt: now - 5000,
    ttlSeconds: 5,
    livenessReason: 'test',
    evidenceRefs: [],
    fencingLeaseIdentity: '',
    capabilities: {}
  };
  
  const responseOk = { status: 'SUCCESS', systemStatus: 'ONLINE_AUTHENTICATED', reconciliationState: 'IN_SYNC' };
  
  const statusExpired = resolveDisplayStatus(responseOk, expiredPresence);
  check(statusExpired === 'OFFLINE', `Expected OFFLINE for expired presence, got ${statusExpired}`);
  
  // Test: UI cannot show ONLINE without ANY runtime evidence (null presence)
  const statusNoPresence = resolveDisplayStatus(responseOk, undefined);
  check(statusNoPresence === 'UNKNOWN', `Expected UNKNOWN for missing presence, got ${statusNoPresence}`);
  
  // Test: Fresh runtime evidence
  const freshPresence: RuntimePresence = {
    ...expiredPresence,
    expiresAt: now + 5000
  };
  
  const statusFresh = resolveDisplayStatus(responseOk, freshPresence);
  check(statusFresh === 'AVAILABLE', `Expected AVAILABLE for fresh presence, got ${statusFresh}`);
  
  // Test: Distinguish stale cloud vs healthy local are distinct
  const responseStaleCloud = { status: 'SUCCESS', systemStatus: 'ONLINE_AUTHENTICATED', reconciliationState: 'STALE_CLOUD' };
  const statusStaleCloud = resolveDisplayStatus(responseStaleCloud, freshPresence);
  check(statusStaleCloud === 'STALE', `Expected STALE for STALE_CLOUD reconciliation, got ${statusStaleCloud}`);
  
  const responseLiveLocal = { status: 'SUCCESS', systemStatus: 'OFFLINE_LOCAL', reconciliationState: 'LIVE_LOCAL' };
  const statusLiveLocal = resolveDisplayStatus(responseLiveLocal, freshPresence);
  // Based on logic, if it's LIVE_LOCAL and systemStatus is OFFLINE_LOCAL, it goes to AVAILABLE because DEGRADED_PROVIDER is not set
  check(statusLiveLocal === 'AVAILABLE', `Expected AVAILABLE for LIVE_LOCAL reconciliation, got ${statusLiveLocal}`);

  const responseDegraded = { status: 'SUCCESS', systemStatus: 'DEGRADED_PROVIDER', reconciliationState: 'IN_SYNC' };
  const statusDegraded = resolveDisplayStatus(responseDegraded, freshPresence);
  check(statusDegraded === 'DEGRADED', `Expected DEGRADED for DEGRADED_PROVIDER, got ${statusDegraded}`);
  
  // Test: EXECUTING
  const executingPresence: RuntimePresence = {
    ...freshPresence,
    livenessReason: 'executing'
  };
  const statusExecuting = resolveDisplayStatus(responseOk, executingPresence);
  check(statusExecuting === 'EXECUTING', `Expected EXECUTING, got ${statusExecuting}`);
  
  // Test: BOUND
  const boundPresence: RuntimePresence = {
    ...freshPresence,
    fencingLeaseIdentity: 'lease-123'
  };
  const statusBound = resolveDisplayStatus(responseOk, boundPresence);
  check(statusBound === 'BOUND', `Expected BOUND, got ${statusBound}`);

  console.log(`\nTests completed: ${passed} passed, ${failed} failed.`);
  if (failed > 0) {
    process.exit(1);
  }
}

runTests();
