import assert from 'node:assert';
import { canaryFixtures } from './fixtures.ts';
import { resolveDisplayStatus } from '../../hooks/useRuntimePresence.ts';
import type { RuntimePresence } from '../../contracts/truth.ts';

async function runTests() {
  console.log('Running Canary Harness tests...');

  // State 1: Live + Fresh -> AVAILABLE
  {
    const fixture = canaryFixtures[0];
    const status = resolveDisplayStatus(fixture, fixture.data?.presence as RuntimePresence | undefined);
    assert.strictEqual(status, 'AVAILABLE', 'State 1 should be AVAILABLE');
    assert.strictEqual(fixture.systemStatus, 'ONLINE_AUTHENTICATED');
    assert.strictEqual(fixture.reconciliationState, 'IN_SYNC');
    console.log('✓ State 1: Live + Fresh test passed');
  }

  // State 2: Live + Stale Cloud -> STALE
  {
    const fixture = canaryFixtures[1];
    const status = resolveDisplayStatus(fixture, fixture.data?.presence as RuntimePresence | undefined);
    assert.strictEqual(status, 'STALE', 'State 2 should be STALE');
    assert.strictEqual(fixture.reconciliationState, 'STALE_CLOUD');
    console.log('✓ State 2: Live + Stale Cloud test passed');
  }

  // State 3: Dead worker + stale LIVE cloud record -> OFFLINE (No false live)
  {
    const fixture = canaryFixtures[2];
    const status = resolveDisplayStatus(fixture, fixture.data?.presence as RuntimePresence | undefined);
    assert.strictEqual(status, 'OFFLINE', 'State 3 must be OFFLINE despite cloud record (No false live)');
    assert.strictEqual(fixture.reconciliationState, 'CLOUD_AHEAD');
    console.log('✓ State 3: Dead + Stale Live Cloud test passed');
  }

  // State 4: Repo drift
  {
    const fixture = canaryFixtures[3];
    assert.strictEqual(fixture.reconciliationState, 'NESTED_REPO_DRIFT', 'State 4 must show NESTED_REPO_DRIFT');
    assert.strictEqual(fixture.fingerprint.parentGitlinkCommitSha, 'drifted-0000');
    console.log('✓ State 4: Repo drift test passed');
  }

  // State 5: No Supabase -> DEGRADED
  {
    const fixture = canaryFixtures[4];
    const status = resolveDisplayStatus(fixture, fixture.data?.presence as RuntimePresence | undefined);
    assert.strictEqual(status, 'DEGRADED', 'State 5 should be DEGRADED');
    assert.strictEqual(fixture.systemStatus, 'DEGRADED_PROVIDER');
    console.log('✓ State 5: No Supabase test passed');
  }

  // State 6: Local runtime unavailable -> UNKNOWN (Error projecting)
  {
    const fixture = canaryFixtures[5];
    const status = resolveDisplayStatus(fixture, fixture.data?.presence as RuntimePresence | undefined);
    assert.strictEqual(status, 'UNKNOWN', 'State 6 should result in UNKNOWN status');
    assert.strictEqual(fixture.status, 'ERROR');
    console.log('✓ State 6: Local runtime unavailable test passed');
  }

  // State 7: Reconnect with newer fencing token -> BOUND
  {
    const fixture = canaryFixtures[6];
    const status = resolveDisplayStatus(fixture, fixture.data?.presence as RuntimePresence | undefined);
    assert.strictEqual(status, 'BOUND', 'State 7 should be BOUND due to lease identity');
    assert.strictEqual((fixture.data?.presence as RuntimePresence).fencingLeaseIdentity, 'new-fencing-token-1234');
    console.log('✓ State 7: Reconnect with newer fencing token test passed');
  }

  console.log('All Canary Harness tests passed!');
}

runTests().catch(err => {
  console.error('Test failed:', err);
  process.exit(1);
});
