import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import { corpusApi } from './tools/corpus-api';
import { armsApi } from './tools/arms-api';
import { revueApi } from './tools/revue-api';
import { routeursApi } from './tools/routeurs-api';
import fs from 'node:fs';
import path from 'node:path';

// Le bureau a besoin de voir l'état réel de la boucle gauntlet, qui vit
// dans un fichier hors du projet (le profil). On ajoute un seul endpoint
// qui lit le ruban et le rend en JSON. Pas d'écriture : la boucle reste
// l'autorité qui modifie le registre. Le bureau ne fait que regarder.
function gauntletApi() {
  const RACINE = path.resolve('C:/Users/amado/ASpace_OS_V2/20_Life_OS/24_PARA_Enterprise/03_Resources_Geordi/05_From_V2_Domains/30_Business_OS/10_Projects/omk/repos/coach-os/_gauntlet');
  return {
    name: 'gauntlet-api',
    configureServer(server: import('vite').ViteDevServer) {
      server.middlewares.use('/api/gauntlet', (req, res) => {
        // Pas de cache : le bureau voit l'état réel, pas une snapshot.
        res.setHeader('Cache-Control', 'no-store');
        res.setHeader('Content-Type', 'application/json; charset=utf-8');
        const url = (req.url || '/').split('?')[0];
        if (url === '/' || url === '') {
          const ruban = path.join(RACINE, 'DEFAUTS.jsonl');
          const verrou = path.join(RACINE, '.encours');
          let defauts: unknown[] = [];
          let agentVivant: { pid: string; cause: string; age_min: number } | null = null;
          try {
            const txt = fs.readFileSync(ruban, 'utf-8');
            defauts = txt.split('\n').filter(Boolean).map((l) => {
              try { return JSON.parse(l); } catch { return null; }
            }).filter((x): x is unknown => x !== null);
          } catch {
            // Le registre n'existe pas : phase 0 pas faite. On rend un objet
            // vide, et l'app affichera son état « pas recensé ».
          }
          if (fs.existsSync(verrou)) {
            const parts = fs.readFileSync(verrou, 'utf-8').trim().split(' ');
            const age = Math.max(0, Math.floor((Date.now() / 1000 - Number(parts[2])) / 60));
            agentVivant = { pid: parts[0], cause: parts[1], age_min: age };
          }
          res.end(JSON.stringify({ defauts, agentVivant }));
          return;
        }
        res.statusCode = 404;
        res.end(JSON.stringify({ erreur: 'endpoint inconnu' }));
      });
    },
  };
}

export default defineConfig({
  plugins: [react(), tailwindcss(), gauntletApi(), corpusApi(), armsApi(), revueApi(), routeursApi()],
  server: {
    host: '127.0.0.1',
    // 5555 plutot que 5180 : un port qu'on retient sans le chercher.
    // strictPort reste vrai — on veut un echec bruyant si le port est pris,
    // pas un demarrage silencieux sur 5556 qui casserait le raccourci.
    port: 5555,
    strictPort: true,
  },
  build: {
    target: 'es2022',
    sourcemap: true,
  },
});
// rechargement force 2026-08-30e
