/**
 * API du Workspace — proxy minimal vers le gateway LOCAL Hermes (port 8642).
 *
 * Mesuré 2026-09-01 :
 *   - gateway hermes (processus `hermes gateway run`) : 127.0.0.1:8642, /health → 200
 *   - POST /v1/chat/completions fonctionne avec le Bearer API_SERVER_KEY du .env
 *   - pas de CORS depuis l'origine 5555 (403 sur le preflight) → on proxifie côté Node.
 *
 * Le SaaS-ness : chaque requête chat porte un en-tête `X-Tenant` (le slug du
 * profil Hermes). Le tenant est propagé au champ `user` de la requête OpenAI —
 * le tracé multi-tenant vit côté gateway, l'app ne maintient aucun état serveur.
 */

import fs from 'node:fs';
import http from 'node:http';
import path from 'node:path';
import type { Plugin, ViteDevServer } from 'vite';

const GATEWAY = { host: '127.0.0.1', port: 8642 };

function lireCle(): string {
  // La clé vit dans le .env du profil — même source que le gateway, jamais en dur.
  for (const envPath of [
    'C:/Users/amado/AppData/Local/hermes/profiles/a0-amadeus/.env',
    'C:/Users/amado/AppData/Local/hermes/.env',
  ]) {
    try {
      const m = fs.readFileSync(envPath, 'utf-8').match(/^API_SERVER_KEY=(.+)$/m);
      if (m) return m[1].trim();
    } catch {
      /* fichier absent : on essaie le suivant */
    }
  }
  return '';
}

function proxy(req: http.IncomingMessage, res: http.ServerResponse, reqPath: string, corps?: string) {
  const cle = lireCle();
  const headers: Record<string, string> = { Authorization: `Bearer ${cle}` };
  if (corps) headers['Content-Type'] = 'application/json';
  const r = http.request(
    { host: GATEWAY.host, port: GATEWAY.port, path: reqPath, method: req.method, headers },
    (up) => {
      res.setHeader('Content-Type', up.headers['content-type'] || 'application/json');
      res.statusCode = up.statusCode || 502;
      up.pipe(res);
    },
  );
  r.on('error', () => {
    res.statusCode = 502;
    res.setHeader('Content-Type', 'application/json');
    res.end(JSON.stringify({ erreur: 'gateway local injoignable sur 8642' }));
  });
  if (corps) r.write(corps);
  r.end();
}

export function workspaceApi(): Plugin {
  return {
    name: 'workspace-api',
    configureServer(server: ViteDevServer) {
      server.middlewares.use('/api/workspace', (req, res) => {
        res.setHeader('Cache-Control', 'no-store');
        const url = (req.url || '/').split('?')[0];

        if (url === '/health' || url === '/models') {
          proxy(req, res, url.startsWith('/health') ? '/health' : '/v1/models');
          return;
        }

        if (url === '/chat' && req.method === 'POST') {
          let corps = '';
          req.on('data', (c) => (corps += c));
          req.on('end', () => {
            try {
              const j = JSON.parse(corps) as Record<string, unknown>;
              // Le tenant est propagé dans `user` (champ standard OpenAI) :
              // le tracé multi-tenant reste côté gateway, l'app reste sans état.
              j.user = String(req.headers['x-tenant'] || 'a0-amadeus');
              proxy(req, res, '/v1/chat/completions', JSON.stringify(j));
            } catch {
              res.statusCode = 400;
              res.end(JSON.stringify({ erreur: 'JSON invalide' }));
            }
          });
          return;
        }

        res.statusCode = 404;
        res.setHeader('Content-Type', 'application/json');
        res.end(JSON.stringify({ erreur: 'endpoint inconnu' }));
      });
    },
  };
}
