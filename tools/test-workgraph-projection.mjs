import assert from 'node:assert/strict';
import http from 'node:http';
import { serveWorkgraphProjection } from './workgraph-projection.ts';

const kernelDir = process.argv[2];
if (!kernelDir) throw new Error('Pass the absolute kernel directory');
const server = http.createServer((req, res) => {
  const url = new URL(req.url, 'http://localhost');
  const route = url.pathname.replace('/api/tech-os', '');
  if (!serveWorkgraphProjection(req, res, route, kernelDir)) {
    res.statusCode = 404;
    res.end();
  }
});
await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
try {
  const base = 'http://127.0.0.1:' + server.address().port + '/api/tech-os/workgraph/projection';
  const good = await fetch(base + '?role=Rick');
  assert.equal(good.status, 200);
  const body = await good.json();
  assert.equal(body.schema, 'WorkGraphProjection.v1');
  assert.equal(body.authority, 'read_only');
  assert.ok(body.items.length <= 8);
  assert.ok(Buffer.byteLength(JSON.stringify(body)) <= 8192);
  for (const role of ['Doctor11', 'Doctor12', 'Doctor13', 'Ryan', 'Yaz', 'Graham', 'Bill', 'Clara', 'Nardole', 'Amy', 'Rory', 'River']) {
    const response = await fetch(base + '?role=' + role);
    assert.equal(response.status, 200);
    assert.equal((await response.json()).role, role);
  }
  for (const query of ['?role=invalid', '?work_id=1%3Bexit', '?work_id=-1', '?work_id=9007199254740992']) {
    assert.equal((await fetch(base + query)).status, 400);
  }
  assert.equal((await fetch(base, { method: 'POST' })).status, 405);
  assert.equal((await fetch(base, { method: 'DELETE' })).status, 405);
  console.log('PASS: 13 live role projections, 4 invalid inputs, 2 forbidden write methods');
} finally {
  await new Promise(resolve => server.close(resolve));
}
