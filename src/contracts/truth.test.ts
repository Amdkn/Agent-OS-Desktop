import type { RuntimePresence } from './truth.ts';
import {
  RuntimePresenceSchema,
  SourceSyncFingerprintSchema,
  ReconciliationClassificationSchema,
  SystemStatusSchema,
  isPresenceLive
} from './truth.ts';

function runTests() {
  console.log("Running truth contract tests...");
  let passed = 0;
  let failed = 0;

  function assert(condition: boolean, message: string) {
    if (condition) {
      passed++;
    } else {
      failed++;
      console.error(`❌ FAILED: ${message}`);
    }
  }

  // Test: No-fake-status invariant (existence != LIVE)
  const now = Date.now();
  const expiredPresence: RuntimePresence = {
    identity: 'worker-1',
    provenance: 'local-test',
    observedAt: now - 10000,
    expiresAt: now - 5000,
    ttlSeconds: 5,
    livenessReason: 'test',
    evidenceRefs: [],
    fencingLeaseIdentity: 'lease-1',
    capabilities: { "fs-access": true }
  };

  const validExpiredPresence = RuntimePresenceSchema.parse(expiredPresence);
  assert(!isPresenceLive(validExpiredPresence, now), "Expired presence should not be live (prevents false LIVE)");

  const livePresence: RuntimePresence = {
    ...expiredPresence,
    expiresAt: now + 5000,
  };
  const validLivePresence = RuntimePresenceSchema.parse(livePresence);
  assert(isPresenceLive(validLivePresence, now), "Unexpired presence should be live");

  // Test: Stale Cloud representable
  const staleCloudState = ReconciliationClassificationSchema.parse('STALE_CLOUD');
  assert(staleCloudState === 'STALE_CLOUD', "STALE_CLOUD state should be representable");

  // Test: Live Local representable
  const liveLocalState = ReconciliationClassificationSchema.parse('LIVE_LOCAL');
  assert(liveLocalState === 'LIVE_LOCAL', "LIVE_LOCAL state should be representable");

  // Test: Nested Repo Drift representable
  const nestedRepoDriftState = ReconciliationClassificationSchema.parse('NESTED_REPO_DRIFT');
  assert(nestedRepoDriftState === 'NESTED_REPO_DRIFT', "NESTED_REPO_DRIFT state should be representable");

  const fingerprint = SourceSyncFingerprintSchema.parse({
    parentRepoSha: '1234567890abcdef',
    parentGitlinkCommitSha: '0987654321fedcba',
    parentGitlink: 'Agent-OS-Desktop',
    agentOsDesktopHeadSha: 'abcdef1234567890',
    agentOsDesktopIsDirty: true
  });
  assert(fingerprint.agentOsDesktopIsDirty === true, "SourceSyncFingerprint can represent nested repo drift (dirty state)");

  // Test: Degraded Provider representable
  const degradedStatus = SystemStatusSchema.parse('DEGRADED_PROVIDER');
  assert(degradedStatus === 'DEGRADED_PROVIDER', "DEGRADED_PROVIDER status should be representable");

  console.log(`\nTests completed: ${passed} passed, ${failed} failed.`);
  if (failed > 0) {
    process.exit(1);
  }
}

runTests();
