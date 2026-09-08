const BASE = 'http://127.0.0.1:5555';

const API = [
  '/api/corpus',
  '/api/arms',
  '/api/revue',
  '/api/routeurs',
  '/api/gauntlet',
  '/api/workspace/health',
  '/api/tech-os/workflows',
  '/api/tech-os/kernel-state',
];

const echecs = [];

const racine = await fetch(BASE + '/', { signal: AbortSignal.timeout(15000) });
const ctRacine = racine.headers.get('content-type') || '';
if (racine.status === 200 && ctRacine.includes('text/html')) {
  console.log('/ -> 200 text/html');
} else {
  echecs.push(`/ -> ${racine.status} ${ctRacine}`);
}

for (const ep of API) {
  try {
    const r = await fetch(BASE + ep, { signal: AbortSignal.timeout(30000) });
    const ct = r.headers.get('content-type') || '';
    if (r.status === 200 && ct.includes('application/json')) {
      console.log(`${ep} -> 200 json`);
    } else {
      echecs.push(`${ep} -> ${r.status} ${ct}`);
    }
  } catch (e) {
    echecs.push(`${ep} -> ERREUR ${String(e).slice(0, 80)}`);
  }
}

if (echecs.length) {
  console.log('ECHECS:\n' + echecs.join('\n'));
  process.exit(1);
}
console.log('HTTP_ENDPOINTS_OK');
