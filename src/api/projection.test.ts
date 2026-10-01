import assert from 'node:assert';
import { ServerProjectionService } from '../../tools/projection-service.ts';

async function runTests() {
  console.log('Running Server Projection Service tests...');

  // Test 1: OFFLINE_LOCAL
  {
    const layer = new ServerProjectionService({
      SUPABASE_URL: '',
      SUPABASE_ANON_KEY: ''
    });
    const req = {
      requestId: crypto.randomUUID(),
      timestamp: Date.now(),
      authority: 'LOCAL_PROCESS' as const,
      payload: { test: 'data' }
    };

    const res = await layer.project(req);

    assert.strictEqual(res.systemStatus, 'OFFLINE_LOCAL');
    assert.strictEqual(res.status, 'SUCCESS');
    assert.strictEqual(res.data?._mode, 'local-fallback');
    assert.strictEqual(res.reconciliationState, 'LIVE_LOCAL');
    console.log('✓ OFFLINE_LOCAL test passed');
  }

  // Test 2: Defer CLOUD_PROJECTION when offline
  {
    const layer = new ServerProjectionService({
      SUPABASE_URL: '',
      SUPABASE_ANON_KEY: ''
    });
    const req = {
      requestId: crypto.randomUUID(),
      timestamp: Date.now(),
      authority: 'CLOUD_PROJECTION' as const,
      payload: { test: 'data' }
    };

    const res = await layer.project(req);

    assert.strictEqual(res.systemStatus, 'OFFLINE_LOCAL');
    assert.strictEqual(res.status, 'DEFERRED');
    console.log('✓ Defer CLOUD_PROJECTION when offline test passed');
  }

  // Test 3: ONLINE_AUTHENTICATED (needs mock for local runtime)
  // The ServerProjectionService expects local daemon to be up. 
  // For the test, we mock checkLocalRuntimeHealth but since it's private,
  // we test evaluateSystemStatus.
  {
    const layer = new ServerProjectionService({
      SUPABASE_URL: 'https://test.supabase.co',
      SUPABASE_ANON_KEY: 'test-key'
    });

    const status1 = await layer.evaluateSystemStatus(true);
    assert.strictEqual(status1, 'ONLINE_AUTHENTICATED');

    const status2 = await layer.evaluateSystemStatus(false);
    assert.strictEqual(status2, 'OFFLINE_LOCAL');
    console.log('✓ ONLINE_AUTHENTICATED evaluateSystemStatus test passed');
  }

  // Test 4: Deny GIT_TRUTH authority
  {
    const layer = new ServerProjectionService({
      SUPABASE_URL: '',
      SUPABASE_ANON_KEY: ''
    });
    const req = {
      requestId: crypto.randomUUID(),
      timestamp: Date.now(),
      authority: 'GIT_TRUTH' as const,
      payload: { test: 'data' }
    };

    const res = await layer.project(req);

    assert.strictEqual(res.status, 'ERROR');
    assert.ok(res.error?.includes('Insufficient authority'));
    console.log('✓ Deny GIT_TRUTH test passed');
  }

  // Test 5: Source fingerprint does not return hardcoded fakes
  {
      const layer = new ServerProjectionService({
        SUPABASE_URL: '',
        SUPABASE_ANON_KEY: ''
      });
      const req = {
        requestId: crypto.randomUUID(),
        timestamp: Date.now(),
        authority: 'LOCAL_PROCESS' as const,
        payload: { test: 'data' }
      };
      
      const res = await layer.project(req);
      assert.notStrictEqual(res.fingerprint.agentOsDesktopHeadSha, 'local-head-0000');
      assert.notStrictEqual(res.fingerprint.parentRepoSha, 'offline-local-0000');
      
      console.log('✓ No fake SHA test passed');
  }

  console.log('All tests passed!');
}

runTests().catch(err => {
  console.error('Test failed:', err);
  process.exit(1);
});