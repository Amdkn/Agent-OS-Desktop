/**
 * API des passerelles et observateurs — l'état réel des services locaux.
 *
 * Gère le cycle de vie, le monitoring et les arrêts d'urgence (anti-surchauffe) :
 *   - Bifrost      (8080)
 *   - 9Router      (20128)
 *   - OmniRoute    (20129)
 *   - AgentGateway (15000)
 *   - Observatoire (8787)
 *   - AgentPulse   (5001)
 */

import { execFile } from 'node:child_process';
import fs from 'node:fs';
import http from 'node:http';
import path from 'node:path';
import type { Plugin, ViteDevServer } from 'vite';

const V3 = path.resolve('C:/Users/amado/ASpace_OS_V3');
const LANCEURS = path.join(V3, '00_Amadeus/20_Harness/routers');

interface Routeur {
  cle: string;
  nom: string;
  port: number;
  role: string;
  lanceur: string;
  journal: string;
}

const ROUTEURS: Routeur[] = [
  {
    cle: 'bifrost',
    nom: 'Bifrost',
    port: 8080,
    role: 'Passerelle LLM & MCP Gateway haute performance (Dashboard & Routing)',
    lanceur: path.resolve('C:/Users/amado/.bifrost/demarrer.cmd'),
    journal: path.resolve('C:/Users/amado/.bifrost/bifrost.log'),
  },
  {
    cle: '9router',
    nom: '9Router',
    port: 20128,
    role: 'Passerelle LLM locale — port par défaut',
    lanceur: path.join(LANCEURS, '9router.cmd'),
    journal: path.join(LANCEURS, 'log-9router.log'),
  },
  {
    cle: 'omniroute',
    nom: 'OmniRoute',
    port: 20129,
    role: 'Passerelle multi-fournisseurs (Déportée sur 20129)',
    lanceur: path.join(LANCEURS, 'omniroute.cmd'),
    journal: path.join(LANCEURS, 'omniroute.log'),
  },
  {
    cle: 'agentgateway',
    nom: 'AgentGateway',
    port: 15000,
    role: 'Console de supervision AgentGateway & Proxy',
    lanceur: path.resolve('C:/Users/amado/ASpace_OS_V3/00_Amadeus/20_Harness/agentgateway/run.cmd'),
    journal: path.resolve('C:/Users/amado/ASpace_OS_V3/00_Amadeus/20_Harness/agentgateway/run.log'),
  },
  {
    cle: 'observatoire',
    nom: 'Observatoire',
    port: 8787,
    role: 'Observatoire des délégations & télémétrie',
    lanceur: path.resolve('C:/Users/amado/agent-os/observatoire/lancer.cmd'),
    journal: '',
  },
  {
    cle: 'agentpulse',
    nom: 'AgentPulse',
    port: 5001,
    role: 'Visualisation des runs & métriques AgentPulse',
    lanceur: path.resolve('C:/Users/amado/agentpulse/lancer.cmd'),
    journal: '',
  },
  {
    cle: 'coachos',
    nom: 'Coach OS',
    port: 5174,
    role: 'Coach OS — Application Business OS',
    lanceur: path.resolve('C:/Users/amado/ASpace_OS_V3/30_Business_OS/10_Projects/coach-os-app/lancer_coach_os.cmd'),
    journal: path.resolve('C:/Users/amado/ASpace_OS_V3/30_Business_OS/10_Projects/coach-os-app/dev.log'),
  },
  {
    cle: 'lifeos',
    nom: 'Life OS 2026',
    port: 4444,
    role: 'Life OS 2026 local — Clone & Supabase',
    lanceur: path.resolve('C:/Users/amado/agent-os/desktop/lancer_life_os.cmd'),
    journal: path.resolve('C:/Users/amado/agent-os/desktop/lifeos.log'),
  },
  {
    cle: 'hermes',
    nom: 'Hermes Workspace',
    port: 3000,
    role: 'Hermes Workspace v2.3.0 · Multi-Agent Coding & Orchestration',
    lanceur: path.resolve('C:/Users/amado/agent-os/desktop/lancer_hermes.cmd'),
    journal: path.resolve('C:/Users/amado/AppData/Local/hermes/logs/workspace.log'),
  },
  {
    cle: 'deepseek',
    nom: 'DeepSeek Harness',
    port: 3080,
    role: 'DeepSeek Harness (dsh) v0.1.1 — Architecture Cordis',
    lanceur: path.resolve('C:/Users/amado/agent-os/desktop/lancer_dsh.cmd'),
    journal: '',
  },
  {
    cle: 'pocketdb',
    nom: 'PocketDB',
    port: 8090,
    role: 'PocketDB / PocketBase — Hub Meta-Audit & Synchronisation',
    lanceur: path.resolve('C:/Users/amado/agent-os/desktop/lancer_pocketdb.cmd'),
    journal: path.resolve('C:/Users/amado/bin/pocketbase/pb.log'),
  },
  {
    cle: 'antigravity-remote',
    nom: 'Antigravity Remote',
    port: 55358,
    role: 'Antigravity IDE Remote Web & Debugger Shell (Ports 55358 / 55355)',
    lanceur: path.resolve('C:/Users/amado/AppData/Local/Programs/Antigravity/Antigravity.exe'),
    journal: '',
  },
];

function json(res: http.ServerResponse, code: number, corps: unknown) {
  res.statusCode = code;
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  res.setHeader('Cache-Control', 'no-store');
  res.end(JSON.stringify(corps));
}

/** Qui écoute, et sur quelle adresse */
function ecoutes(): Promise<Map<number, { adresse: string; pid: string }[]>> {
  return new Promise((resolve) => {
    execFile('netstat', ['-ano'], { timeout: 15000, maxBuffer: 8 << 20 }, (err, out) => {
      const m = new Map<number, { adresse: string; pid: string }[]>();
      if (err) return resolve(m);
      for (const L of out.split('\n')) {
        if (!L.includes('LISTENING')) continue;
        const p = L.trim().split(/\s+/);
        const local = p[1] ?? '';
        const i = local.lastIndexOf(':');
        if (i < 0) continue;
        const port = Number(local.slice(i + 1));
        if (!ROUTEURS.some((r) => r.port === port)) continue;
        const liste = m.get(port) ?? [];
        liste.push({ adresse: local.slice(0, i), pid: p[p.length - 1] ?? '?' });
        m.set(port, liste);
      }
      resolve(m);
    });
  });
}

/** Tuer tout processus écoutant sur un port spécifique */
function tuerPort(port: number): Promise<string[]> {
  return new Promise((resolve) => {
    execFile('netstat', ['-ano'], { timeout: 10000 }, (err, out) => {
      if (err || !out) return resolve([]);
      const pids: string[] = [];
      for (const L of out.split('\n')) {
        if (!L.includes('LISTENING')) continue;
        const p = L.trim().split(/\s+/);
        const local = p[1] ?? '';
        const i = local.lastIndexOf(':');
        if (i < 0) continue;
        const pt = Number(local.slice(i + 1));
        if (pt === port) {
          const pid = p[p.length - 1];
          if (pid && pid !== '0' && pid !== '?' && !pids.includes(pid)) {
            pids.push(pid);
          }
        }
      }
      if (!pids.length) return resolve([]);
      for (const pid of pids) {
        execFile('taskkill', ['/F', '/T', '/PID', pid], { timeout: 5000 }, () => {});
      }
      resolve(pids);
    });
  });
}

/** Tester si un port répond en HTTP */
function repond(port: number): Promise<number | null> {
  return new Promise((resolve) => {
    let fait = false;
    const finir = (code: number | null) => {
      if (!fait) {
        fait = true;
        resolve(code);
      }
    };
    try {
      const req = http.request(
        { host: '127.0.0.1', port, path: '/', method: 'GET', timeout: 800 },
        (res) => {
          res.resume();
          finir(res.statusCode ?? 200);
        }
      );
      req.on('error', () => finir(null));
      req.on('timeout', () => {
        req.destroy();
        finir(null);
      });
      req.end();
    } catch {
      finir(null);
    }
  });
}

function queue(p: string, n = 12): string[] {
  if (!p) return [];
  try {
    return fs.readFileSync(p, 'utf-8').split('\n').filter(Boolean).slice(-n);
  } catch {
    return [];
  }
}

function demarrerDebloqueurIframe(portEcoute: number, portCible: number) {
  try {
    const srv = http.createServer((req, res) => {
      const opt: http.RequestOptions = {
        host: '127.0.0.1',
        port: portCible,
        path: req.url,
        method: req.method,
        headers: { ...req.headers, host: `127.0.0.1:${portCible}` },
      };
      const proxyReq = http.request(opt, (proxyRes) => {
        const headers = { ...proxyRes.headers };
        delete headers['x-frame-options'];
        delete headers['content-security-policy'];
        res.writeHead(proxyRes.statusCode || 200, headers);
        proxyRes.pipe(res);
      });
      proxyReq.on('error', () => {
        if (!res.headersSent) {
          res.writeHead(502);
          res.end('Passerelle injoignable');
        }
      });
      req.pipe(proxyReq);
    });
    srv.on('error', () => {
      /* port déjà pris */
    });
    srv.listen(portEcoute, '127.0.0.1');
  } catch {
    /* ignore */
  }
}

async function lireJson(req: http.IncomingMessage): Promise<Record<string, unknown>> {
  try {
    const buffers: Buffer[] = [];
    for await (const chunk of req) {
      buffers.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
    }
    const texte = Buffer.concat(buffers).toString('utf-8').trim();
    return texte ? JSON.parse(texte) : {};
  } catch {
    return {};
  }
}

export function routeursApi(): Plugin {
  // Débloqueurs locaux transparents pour ôter X-Frame-Options / frame-ancestors
  demarrerDebloqueurIframe(8082, 8080); // Bifrost iframe unblocker
  demarrerDebloqueurIframe(20130, 20129); // OmniRoute iframe unblocker
  demarrerDebloqueurIframe(8092, 8090); // PocketDB iframe unblocker (8092 -> 8090)

  return {
    name: 'routeurs-api',
    configureServer(server: ViteDevServer) {
      server.middlewares.use('/api/meta-audit', async (req, res) => {
        const url = new URL(req.url || '/', 'http://x');
        const route = url.pathname.replace(/\/+$/, '') || '/';

        // POST /sync ou /run : Exécute le scan et met à jour PocketBase
        if (route === '/sync' || route === '/run' || (route === '/' && req.method === 'POST')) {
          const script = path.resolve('C:/Users/amado/agent-os/desktop/tools/sync_life_os_pocketbase.py');
          execFile('python', [script], { timeout: 25000 }, (err, stdout, stderr) => {
            if (err) {
              return json(res, 500, { success: false, erreur: stderr || err.message });
            }
            return json(res, 200, { success: true, message: stdout.trim() });
          });
          return;
        }

        // GET /etat : Lit les tables synchronisées dans PocketBase
        if (route === '/' || route === '/etat') {
          const pyCode = `import sqlite3, json
try:
    db = sqlite3.connect(r'C:\\Users\\amado\\bin\\pocketbase\\pb_data\\data.db')
    cur = db.cursor()
    def get_rows(t):
        try:
            cols = [d[0] for d in cur.execute(f"SELECT * FROM [{t}] LIMIT 0").description]
            return [dict(zip(cols, r)) for r in cur.execute(f"SELECT * FROM [{t}]").fetchall()]
        except:
            return []
    dbs = get_rows('system_dbs_registry')
    domains = get_rows('life_domains')
    frameworks = get_rows('frameworks_state')
    audits = get_rows('meta_audits')
    db.close()
    print(json.dumps({'success': True, 'dbs': dbs, 'domains': domains, 'frameworks': frameworks, 'audits': audits}))
except Exception as e:
    print(json.dumps({'success': False, 'erreur': str(e), 'dbs': [], 'domains': [], 'frameworks': [], 'audits': []}))
`;
          execFile('python', ['-c', pyCode], { timeout: 10000 }, (err, stdout) => {
            if (err || !stdout) {
              return json(res, 200, { success: false, dbs: [], domains: [], frameworks: [], audits: [] });
            }
            try {
              return json(res, 200, JSON.parse(stdout));
            } catch {
              return json(res, 200, { success: false, dbs: [], domains: [], frameworks: [], audits: [] });
            }
          });
          return;
        }

        return json(res, 404, { erreur: 'route meta-audit inconnue' });
      });

      server.middlewares.use('/api/routeurs', async (req, res) => {
        const url = new URL(req.url || '/', 'http://x');
        const route = url.pathname.replace(/\/+$/, '') || '/';

        // 1. GET /etat
        if (route === '/' || route === '/etat') {
          const ports = await ecoutes();
          const items = await Promise.all(
            ROUTEURS.map(async (r) => {
              const l = ports.get(r.port) ?? [];
              const code = l.length ? await repond(r.port) : null;
              const expose = l.some((x) => x.adresse === '0.0.0.0' || x.adresse === '::');
              return {
                ...r,
                en_ligne: l.length > 0,
                adresses: l.map((x) => x.adresse),
                pids: l.map((x) => x.pid),
                conflit: l.length > 1,
                expose,
                http: code,
                lanceur_present: Boolean(r.lanceur && fs.existsSync(r.lanceur)),
                journal: queue(r.journal),
              };
            })
          );
          return json(res, 200, { lu_a: new Date().toISOString(), routeurs: items });
        }

        // 2. POST /demarrer
        if (route === '/demarrer' && req.method === 'POST') {
          const data = await lireJson(req);
          const cle = String(url.searchParams.get('cle') || data.cle || '');
          const r = ROUTEURS.find((x) => x.cle === cle);
          if (!r) return json(res, 400, { erreur: 'routeur inconnu', recu: cle });
          if (!r.lanceur || !fs.existsSync(r.lanceur)) {
            return json(res, 404, { erreur: `lanceur absent : ${r.lanceur}` });
          }
          execFile('cmd', ['/c', 'start', '', '/MIN', r.lanceur], { timeout: 10000 }, () => {});
          return json(res, 200, { demarre: r.cle, via: r.lanceur });
        }

        // 3. POST /arreter
        if (route === '/arreter' && req.method === 'POST') {
          const data = await lireJson(req);
          const cle = String(url.searchParams.get('cle') || data.cle || '');
          const r = ROUTEURS.find((x) => x.cle === cle);
          if (!r) return json(res, 400, { erreur: 'service inconnu', recu: cle });
          const pidsTues = await tuerPort(r.port);
          return json(res, 200, { arrete: r.cle, port: r.port, pids: pidsTues });
        }

        // 4. POST /relancer
        if (route === '/relancer' && req.method === 'POST') {
          const data = await lireJson(req);
          const cle = String(url.searchParams.get('cle') || data.cle || '');
          const r = ROUTEURS.find((x) => x.cle === cle);
          if (!r) return json(res, 400, { erreur: 'service inconnu', recu: cle });
          await tuerPort(r.port);
          setTimeout(() => {
            if (r.lanceur && fs.existsSync(r.lanceur)) {
              execFile('cmd', ['/c', 'start', '', '/MIN', r.lanceur], { timeout: 10000 }, () => {});
            }
          }, 1500);
          return json(res, 200, { relance: r.cle });
        }

        // 5. POST /arreter-tout (Anti-surchauffe / Urgence PC)
        if (route === '/arreter-tout' && req.method === 'POST') {
          const resultats: Record<string, string[]> = {};
          for (const r of ROUTEURS) {
            const pids = await tuerPort(r.port);
            resultats[r.cle] = pids;
          }
          return json(res, 200, { message: 'Tous les services ont été arrêtés', tues: resultats });
        }

        return json(res, 404, { erreur: 'route inconnue' });
      });
    },
  };
}
