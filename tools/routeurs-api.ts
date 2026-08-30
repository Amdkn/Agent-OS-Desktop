/**
 * API des passerelles de modeles — l'etat reel des deux routeurs locaux.
 *
 * POURQUOI ELLE EXISTE
 * 9Router et OmniRoute ont TOUS DEUX 20128 comme port par defaut. La collision
 * etait inevitable, et elle est arrivee : une mise a jour a ramene 9Router sur
 * son defaut, il a squatte le port d'OmniRoute, et les relais parlaient au
 * mauvais routeur -- en repondant, ce qui est le pire des cas.
 *
 * Le diagnostic a pris une demi-heure faute de vue. Cette API la donne.
 *
 * REPARTITION ARBITREE LE 2026-08-30
 *   9Router    20128  (son defaut, on le lui laisse)
 *   OmniRoute  20129  (deplace explicitement)
 *
 * CE QU'ELLE SURVEILLE EN PLUS DU PORT
 * L'adresse de liaison. Un routeur qui porte des cles de fournisseurs et
 * ecoute sur 0.0.0.0 est joignable par tout le reseau local. C'est le defaut
 * de 9Router, et OmniRoute n'a meme pas d'option -- il faut lui passer
 * HOSTNAME. Un tableau qui montre « en ligne » sans montrer OU il ecoute
 * cacherait exactement le probleme qu'on vient de payer.
 */

import { execFile } from 'node:child_process';
import fs from 'node:fs';
import http from 'node:http';
import path from 'node:path';
import type { Plugin, ViteDevServer } from 'vite';

const V3 = path.resolve('C:/Users/amado/ASpace_OS_V3');
const LANCEURS = path.join(V3, '00_Amadeus/20_Harness/routers');

interface Routeur {
  cle: string; nom: string; port: number; role: string;
  lanceur: string; journal: string;
}

const ROUTEURS: Routeur[] = [
  {
    cle: '9router', nom: '9Router', port: 20128,
    role: 'Passerelle LLM locale — port par defaut du produit',
    lanceur: path.join(LANCEURS, '9router.cmd'),
    journal: path.join(LANCEURS, 'log-9router.log'),
  },
  {
    cle: 'omniroute', nom: 'OmniRoute', port: 20129,
    role: 'Passerelle multi-fournisseurs — deplacee pour liberer 20128',
    lanceur: path.join(LANCEURS, 'omniroute.cmd'),
    journal: path.join(LANCEURS, 'omniroute.log'),
  },
];

function json(res: import('node:http').ServerResponse, code: number, corps: unknown) {
  res.statusCode = code;
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  res.setHeader('Cache-Control', 'no-store');
  res.end(JSON.stringify(corps));
}

/** Qui ecoute, et surtout SUR QUELLE ADRESSE. */
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

/** Un port ouvert ne prouve pas qu'un service repond : on interroge.
 *
 *  PIEGE PAYE LE 2026-08-30 : la premiere version appelait `require('node:http')`.
 *  Vite compile ce fichier en ESM, ou `require` n'existe pas -- la sonde levait
 *  a chaque appel et faisait tomber TOUT le serveur, pas seulement cette route.
 *  Une sonde de sante qui tue le service qu'elle surveille est le pire des
 *  instruments. L'import est statique, en tete de fichier. */
function repond(port: number): Promise<number | null> {
  return new Promise((resolve) => {
    let fini = false;
    const finir = (v: number | null) => { if (!fini) { fini = true; resolve(v); } };
    try {
      const req = http.request(
        { host: '127.0.0.1', port, path: '/', method: 'GET', timeout: 6000 },
        (r) => { finir(r.statusCode ?? null); req.destroy(); });
      req.on('error', () => finir(null));
      req.on('timeout', () => { req.destroy(); finir(null); });
      req.end();
    } catch {
      // Aucune sonde ne doit pouvoir faire tomber l'API qui l'heberge.
      finir(null);
    }
  });
}

function queue(p: string, n = 12): string[] {
  try {
    return fs.readFileSync(p, 'utf-8').split('\n').filter(Boolean).slice(-n);
  } catch { return []; }
}

export function routeursApi(): Plugin {
  return {
    name: 'routeurs-api',
    configureServer(server: ViteDevServer) {
      server.middlewares.use('/api/routeurs', async (req, res) => {
        const url = new URL(req.url || '/', 'http://x');
        const route = url.pathname.replace(/\/+$/, '') || '/';

        if (route === '/' || route === '/etat') {
          const ports = await ecoutes();
          const items = await Promise.all(ROUTEURS.map(async (r) => {
            const l = ports.get(r.port) ?? [];
            const code = l.length ? await repond(r.port) : null;
            // Le point qui compte : 0.0.0.0 signifie joignable depuis tout le
            // reseau local, avec des cles de fournisseurs derriere.
            const expose = l.some((x) => x.adresse === '0.0.0.0' || x.adresse === '::');
            return {
              ...r,
              en_ligne: l.length > 0,
              adresses: l.map((x) => x.adresse),
              pids: l.map((x) => x.pid),
              // Deux processus sur un meme port : c'est exactement la panne
              // du 2026-08-30, et elle doit se voir d'un coup d'oeil.
              conflit: l.length > 1,
              expose,
              http: code,
              lanceur_present: fs.existsSync(r.lanceur),
              journal: queue(r.journal),
            };
          }));
          return json(res, 200, { lu_a: new Date().toISOString(), routeurs: items });
        }

        if (route === '/demarrer' && req.method === 'POST') {
          let corps = '';
          for await (const c of req) corps += c;
          let cle = '';
          try { ({ cle = '' } = JSON.parse(corps || '{}')); } catch { /* vide */ }
          const r = ROUTEURS.find((x) => x.cle === cle);
          if (!r) return json(res, 400, { erreur: 'routeur inconnu' });
          if (!fs.existsSync(r.lanceur)) {
            return json(res, 404, { erreur: `lanceur absent : ${r.lanceur}` });
          }
          // On passe par le lanceur V3 et jamais par une commande recomposee :
          // il porte le savoir paye (--tray pour 9Router, sinon il bloque sur
          // un menu ; HOSTNAME pour OmniRoute, que Next.js lit au lieu de HOST).
          execFile('cmd', ['/c', 'start', '', '/MIN', r.lanceur],
                   { timeout: 10000 }, () => { /* detache */ });
          return json(res, 200, { demarre: r.cle, via: r.lanceur });
        }

        return json(res, 404, { erreur: 'route inconnue' });
      });
    },
  };
}
