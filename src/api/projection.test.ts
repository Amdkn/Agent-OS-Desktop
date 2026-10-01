import assert from 'node:assert';
import { ServerProjectionService } from '../../tools/projection-service.ts';

import os from 'node:os';
import path from 'node:path';

async function runTests() {
  const isolatedDir = path.join(os.tmpdir(), 'non-existent-' + crypto.randomUUID());
  console.log('Running Server Projection Service tests...');

  // Test 1: OFFLINE_LOCAL
  {
    const layer = new ServerProjectionService({ SUPABASE_URL: '', SUPABASE_ANON_KEY: '', MANIFEST_DIR: isolatedDir });
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
    const layer = new ServerProjectionService({ SUPABASE_URL: '', SUPABASE_ANON_KEY: '', MANIFEST_DIR: isolatedDir });
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
    const layer = new ServerProjectionService({ SUPABASE_URL: 'https://test.supabase.co', SUPABASE_ANON_KEY: 'test-key', MANIFEST_DIR: isolatedDir });

    const status1 = await layer.evaluateSystemStatus(true);
    assert.strictEqual(status1, 'ONLINE_AUTHENTICATED');

    const status2 = await layer.evaluateSystemStatus(false);
    assert.strictEqual(status2, 'OFFLINE_LOCAL');
    console.log('✓ ONLINE_AUTHENTICATED evaluateSystemStatus test passed');
  }

  // Test 4: Deny GIT_TRUTH authority
  {
    const layer = new ServerProjectionService({ SUPABASE_URL: '', SUPABASE_ANON_KEY: '', MANIFEST_DIR: isolatedDir });
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
      const layer = new ServerProjectionService({ SUPABASE_URL: '', SUPABASE_ANON_KEY: '', MANIFEST_DIR: isolatedDir });
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



  // Test 6: Correct manifest schema resolution
  {
    const os = await import('node:os');
    const path = await import('node:path');
    const fs = await import('node:fs');
    
    // Create a truly isolated temp directory
    const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'aspace-test-'));
    const manifestPath = path.join(tempDir, 'runtime.json');
    
    const layer = new ServerProjectionService({
      SUPABASE_URL: '',
      SUPABASE_ANON_KEY: '',
      MANIFEST_DIR: tempDir
    });

    const originalFetch = globalThis.fetch;

    try {
      fs.writeFileSync(manifestPath, JSON.stringify({
        gateway_url: 'http://gateway',
        health_urls: {
          browser: 'http://test-browser-health/health'
        }
      }));
      
      let fetchedUrl = '';
      globalThis.fetch = async (url, _options) => {
        fetchedUrl = url.toString();
        return {
          ok: true,
          json: async () => ({ schema: 'aspace.machine.health.v1', presence: {} })
        } as any;
      };

      const req = {
        requestId: crypto.randomUUID(),
        timestamp: Date.now(),
        authority: 'LOCAL_PROCESS' as const,
        payload: { action: 'get_presence', identity: 'test-id' }
      };

      await layer.project(req);
      assert.strictEqual(fetchedUrl, 'http://test-browser-health/health');
      console.log('✓ Correct manifest schema resolution test passed');
    } finally {
      fs.rmSync(tempDir, { recursive: true, force: true });
      globalThis.fetch = originalFetch;
    }
  }


  // Test 7: DEGRADED_PROVIDER when local live but no Supabase
  {
    const layer = new ServerProjectionService({
      SUPABASE_URL: '',
      SUPABASE_ANON_KEY: '',
      MANIFEST_DIR: isolatedDir
    });

    const status = await layer.evaluateSystemStatus(true);
    assert.strictEqual(status, 'DEGRADED_PROVIDER');
    console.log('✓ DEGRADED_PROVIDER test passed');
  }

  console.log('All tests passed!');
}

runTests().catch(err => {
  console.error('Test failed:', err);
  process.exit(1);
});