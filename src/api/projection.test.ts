import assert from 'node:assert';
import { ApiProjectionLayer } from './projection.ts';

async function runTests() {
  console.log('Running API Projection Layer tests...');

  // Test 1: OFFLINE_LOCAL
  {
    const layer = new ApiProjectionLayer({});
    const req = {
      requestId: crypto.randomUUID(),
      timestamp: Date.now(),
      authority: 'LOCAL_PROCESS',
      payload: { test: 'data' }
    };

    // Using any cast to pass through Zod schema for testing
    const res = await layer.project(req as any);

    assert.strictEqual(res.systemStatus, 'OFFLINE_LOCAL');
    assert.strictEqual(res.status, 'SUCCESS');
    assert.strictEqual(res.data?._mode, 'local-fallback');
    assert.strictEqual(res.reconciliationState, 'LIVE_LOCAL');
    console.log('✓ OFFLINE_LOCAL test passed');
  }

  // Test 2: Defer CLOUD_PROJECTION when offline
  {
    const layer = new ApiProjectionLayer({});
    const req = {
      requestId: crypto.randomUUID(),
      timestamp: Date.now(),
      authority: 'CLOUD_PROJECTION',
      payload: { test: 'data' }
    };

    const res = await layer.project(req as any);

    assert.strictEqual(res.systemStatus, 'OFFLINE_LOCAL');
    assert.strictEqual(res.status, 'DEFERRED');
    console.log('✓ Defer CLOUD_PROJECTION when offline test passed');
  }

  // Test 3: ONLINE_AUTHENTICATED
  {
    const layer = new ApiProjectionLayer({
      SUPABASE_URL: 'https://test.supabase.co',
      SUPABASE_ANON_KEY: 'test-key'
    });

    const req = {
      requestId: crypto.randomUUID(),
      timestamp: Date.now(),
      authority: 'CLOUD_PROJECTION',
      payload: { test: 'data' }
    };

    const res = await layer.project(req as any);

    assert.strictEqual(res.systemStatus, 'ONLINE_AUTHENTICATED');
    assert.strictEqual(res.status, 'SUCCESS');
    assert.strictEqual(res.data?._mode, 'online');
    assert.strictEqual(res.reconciliationState, 'IN_SYNC');
    console.log('✓ ONLINE_AUTHENTICATED test passed');
  }

  // Test 4: Deny GIT_TRUTH authority
  {
    const layer = new ApiProjectionLayer({});
    const req = {
      requestId: crypto.randomUUID(),
      timestamp: Date.now(),
      authority: 'GIT_TRUTH',
      payload: { test: 'data' }
    };

    const res = await layer.project(req as any);

    assert.strictEqual(res.status, 'ERROR');
    assert.ok(res.error?.includes('Insufficient authority'));
    console.log('✓ Deny GIT_TRUTH test passed');
  }

  console.log('All tests passed!');
}

runTests().catch(err => {
  console.error('Test failed:', err);
  process.exit(1);
});
