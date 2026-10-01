import assert from 'node:assert';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import http from 'node:http';
import { once } from 'node:events';
import {
  ServerProjectionService,
  mapBrowserHealthToPresence,
  resolveBrowserHealthUrl
} from '../../tools/projection-service.ts';

async function withRuntimeServer(
  healthBody: Record<string, unknown>,
  fn: (healthUrl: string) => Promise<void>
) {
  const server = http.createServer((req, res) => {
    if (req.url !== '/health') {
      res.statusCode = 404;
      res.end();
      return;
    }
    res.setHeader('content-type', 'application/json');
    res.end(JSON.stringify(healthBody));
  });

  server.listen(0, '127.0.0.1');
  await once(server, 'listening');

  const address = server.address();
  assert.ok(address && typeof address === 'object');

  try {
    await fn(`http://127.0.0.1:${address.port}/health`);
  } finally {
    server.close();
    await once(server, 'close');
  }
}

async function runTests() {
  console.log('Running Server Projection Service tests...');

  // Test 1: explicit missing runtime manifest => OFFLINE_LOCAL
  {
    const layer = new ServerProjectionService({
      SUPABASE_URL: '',
      SUPABASE_ANON_KEY: '',
      RUNTIME_MANIFEST_PATH: path.join(os.tmpdir(), `missing-runtime-${crypto.randomUUID()}.json`)
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

  // Test 2: Defer CLOUD_PROJECTION when local runtime is offline
  {
    const layer = new ServerProjectionService({
      SUPABASE_URL: '',
      SUPABASE_ANON_KEY: '',
      RUNTIME_MANIFEST_PATH: path.join(os.tmpdir(), `missing-runtime-${crypto.randomUUID()}.json`)
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

  // Test 3: system-status classification
  {
    const layer = new ServerProjectionService({
      SUPABASE_URL: 'https://test.supabase.co',
      SUPABASE_ANON_KEY: 'test-key'
    });

    assert.strictEqual(await layer.evaluateSystemStatus(true), 'ONLINE_AUTHENTICATED');
    assert.strictEqual(await layer.evaluateSystemStatus(false), 'OFFLINE_LOCAL');
    console.log('✓ ONLINE_AUTHENTICATED evaluateSystemStatus test passed');
  }

  // Test 4: Deny GIT_TRUTH authority
  {
    const layer = new ServerProjectionService({
      SUPABASE_URL: '',
      SUPABASE_ANON_KEY: '',
      RUNTIME_MANIFEST_PATH: path.join(os.tmpdir(), `missing-runtime-${crypto.randomUUID()}.json`)
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
      SUPABASE_ANON_KEY: '',
      RUNTIME_MANIFEST_PATH: path.join(os.tmpdir(), `missing-runtime-${crypto.randomUUID()}.json`)
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

  // Test 6: production-shaped aspace.dc.runtime.v1 manifest uses health_urls.browser.
  await withRuntimeServer({
    schema: 'aspace.machine.health.v1',
    daemon: 'UP',
    worker: 'UP',
    aggregate: 'ONLINE',
    worker_ref: 'aspace-dc-user-session',
    fencing_token: 42,
    capabilities: {
      'browser.tabs.read': 'AVAILABLE',
      'browser.dom.action': 'AVAILABLE'
    },
    presence: {
      active: true,
      ttl_expired: false,
      last_seen: new Date().toISOString(),
      session_id: 'aspace-dc-sovereign',
      fencing_token: 42,
      worker_id: 'aspace-dc-user-session'
    },
    degraded_reason: null
  }, async (healthUrl) => {
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'agent-os-runtime-'));
    const manifestPath = path.join(dir, 'runtime.json');

    fs.writeFileSync(manifestPath, JSON.stringify({
      schema: 'aspace.dc.runtime.v1',
      state: 'ONLINE',
      gateway_url: 'http://127.0.0.1:65530/mcp',
      health_urls: {
        filesystem: 'http://127.0.0.1:65531/health',
        process: 'http://127.0.0.1:65532/health',
        browser: healthUrl
      }
    }));

    try {
      const layer = new ServerProjectionService({
        SUPABASE_URL: '',
        SUPABASE_ANON_KEY: '',
        RUNTIME_MANIFEST_PATH: manifestPath
      });

      const res = await layer.project({
        requestId: crypto.randomUUID(),
        timestamp: Date.now(),
        authority: 'LOCAL_PROCESS',
        payload: { action: 'get_presence', identity: 'doctor_13_kernel' }
      });

      assert.strictEqual(res.systemStatus, 'DEGRADED_PROVIDER');
      assert.strictEqual(res.status, 'SUCCESS');

      const presence = res.data?.presence as any;
      assert.strictEqual(presence.identity, 'aspace-dc-user-session');
      assert.strictEqual(presence.provenance, 'aspace.dc.runtime.v1/health_urls.browser');
      assert.strictEqual(presence.fencingLeaseIdentity, 'fence:42');
      assert.strictEqual(presence.livenessReason, 'browser_worker_active');
      assert.ok(presence.expiresAt > presence.observedAt);
      assert.strictEqual(presence.capabilities['browser.dom.action'], 'AVAILABLE');
      console.log('✓ Production runtime manifest + RuntimePresence mapping test passed');
    } finally {
      fs.rmSync(dir, { recursive: true, force: true });
    }
  });

  // Test 7: legacy URL fallback remains bounded and explicit.
  {
    assert.strictEqual(
      resolveBrowserHealthUrl({ url: 'http://127.0.0.1:9999' }),
      'http://127.0.0.1:9999/health'
    );
    assert.throws(
      () => resolveBrowserHealthUrl({ schema: 'aspace.dc.runtime.v1', health_urls: {} }),
      /missing browser health URL/
    );
    console.log('✓ Runtime manifest compatibility/error contract test passed');
  }

  // Test 8: raw daemon health maps to an expired/offline RuntimePresence when worker is stale.
  {
    const observedAt = 10_000;
    const presence = mapBrowserHealthToPresence({
      schema: 'aspace.machine.health.v1',
      daemon: 'UP',
      worker: 'DOWN',
      aggregate: 'DEGRADED',
      capabilities: { 'browser.dom.action': 'UNAVAILABLE' },
      fencing_token: 7,
      presence: {
        active: false,
        ttl_expired: true,
        session_id: 'stale-session',
        fencing_token: 7,
        worker_id: 'stale-worker'
      },
      degraded_reason: 'WORKER_TTL_EXPIRED_STALE'
    }, observedAt, 5);

    assert.ok(presence.expiresAt < observedAt);
    assert.strictEqual(presence.livenessReason, 'browser_worker_ttl_expired');
    assert.strictEqual(presence.fencingLeaseIdentity, 'fence:7');
    console.log('✓ Stale worker RuntimePresence mapping test passed');
  }

  console.log('All tests passed!');
}

runTests().catch(err => {
  console.error('Test failed:', err);
  process.exit(1);
});
