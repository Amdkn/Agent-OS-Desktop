import { execFile } from 'node:child_process';
import path from 'node:path';
import type { IncomingMessage, ServerResponse } from 'node:http';

const ROLES = new Set(['Rick', 'Doctor11', 'Doctor12', 'Doctor13',
  'Ryan', 'Yaz', 'Graham', 'Bill', 'Clara', 'Nardole', 'Amy', 'Rory', 'River']);

export function serveWorkgraphProjection(
  req: IncomingMessage, res: ServerResponse, pathname: string, kernelDir: string
): boolean {
  if (pathname !== '/workgraph/projection') return false;
  res.setHeader('Cache-Control', 'no-store');
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  if (req.method !== 'GET') {
    res.statusCode = 405;
    res.setHeader('Allow', 'GET');
    res.end(JSON.stringify({ ok: false, error: 'Read-only projection' }));
    return true;
  }
  const params = new URL(req.url || '/', 'http://localhost').searchParams;
  const role = params.get('role') || params.get('companion') || 'Rick';
  const workId = params.get('work_id');
  if (!ROLES.has(role) || (workId !== null && (!/^[1-9][0-9]*$/.test(workId) || !Number.isSafeInteger(Number(workId))))) {
    res.statusCode = 400;
    res.end(JSON.stringify({ ok: false, error: 'Invalid role or work_id' }));
    return true;
  }
  const args = ['-X', 'utf8', path.join(kernelDir, 'dao_jing.py'), '--role', role];
  if (workId !== null) args.push('--work-id', workId);
  execFile('python', args, { timeout: 10000, maxBuffer: 16384, windowsHide: true }, (err, stdout) => {
    if (err) {
      res.statusCode = 503;
      res.end(JSON.stringify({ ok: false, error: 'WorkGraph projection unavailable' }));
      return;
    }
    try {
      const data = JSON.parse(stdout);
      if (data.schema !== 'WorkGraphProjection.v1' || data.authority !== 'read_only') throw new Error('Invalid projection');
      res.end(JSON.stringify(data));
    } catch {
      res.statusCode = 502;
      res.end(JSON.stringify({ ok: false, error: 'Invalid kernel projection' }));
    }
  });
  return true;
}
