/**
 * API du corpus — expose A'Space OS V3 au bureau, en lecture seule.
 *
 * POURQUOI CE PLUGIN
 * Une app de navigateur ne lit pas le disque. Sans cet endpoint, une « app
 * d'observabilite » ne peut afficher que ce qu'on y recopie a la main -- c'est
 * exactement le defaut de l'app Memoires, qui est un bloc-notes et non une vue
 * sur le corpus.
 *
 * CE QU'IL EXPOSE
 *   GET /api/corpus/racines      les points d'acces (ontologie, cascade,
 *                                distillation, methodologies, OKF, RDF)
 *   GET /api/corpus/arbre?d=...  l'arborescence d'un dossier, un niveau
 *   GET /api/corpus/fichier?f=.. le contenu d'un fichier texte
 *   GET /api/corpus/mesures      les compteurs vivants du corpus
 *
 * LECTURE SEULE, ET BORNEE
 * Aucune ecriture. Tout chemin est resolu puis verifie comme etant SOUS la
 * racine : une requete `?f=../../.claude/settings.json` est refusee. Sans ce
 * garde, un endpoint de lecture devient une fuite de secrets.
 */

import fs from 'node:fs';
import path from 'node:path';
import type { Plugin, ViteDevServer } from 'vite';

const RACINE = path.resolve('C:/Users/amado/ASpace_OS_V3');

/** Points d'entree du corpus. L'ordre est celui de la lecture recommandee. */
const RACINES = [
  {
    id: 'ontologie',
    titre: 'Ontologie V2',
    detail: "Extraite du corpus, pas inventee — axes A/B/G, 533 verbes, 366 systemes de codes",
    fichier: '00_Amadeus/30_MEMORY_CORE/ONTOLOGIE_V2.md',
  },
  {
    id: 'cascade',
    titre: 'Cascade E-Myth',
    detail: 'A1/A2/A3, B1/B2/B3, S1/S2/S3 et Donna — source des instructions injectees',
    fichier: '10_Tech_OS/00_Governance_Rick/CASCADE.md',
  },
  {
    id: 'distillation',
    titre: 'Distillation',
    detail: 'Methode et substrat — extraction scriptee puis distillation semantique',
    dossier: '50_Distillation',
    fichier: '50_Distillation/METHODE.md',
  },
  {
    id: 'methodologies',
    titre: 'Implementation methodologique',
    detail: 'Vagues, frameworks, protocoles, primitives, autonomie des agents',
    dossier: '60_Implementation_Méthodologiques',
    fichier: '60_Implementation_Méthodologiques/index.md',
  },
  {
    id: 'onthologies',
    titre: 'Onthologies',
    detail: 'Triplets RDF (.ttl), sujets, verbes, revue',
    dossier: '70_Onthologies',
    fichier: '70_Onthologies/index.md',
  },
  {
    id: 'okf',
    titre: 'Memoire OKF',
    detail: 'Concepts recents : integrations, operations, architecture, securite',
    dossier: '40_Memory_Wiki_OKF',
    fichier: '40_Memory_Wiki_OKF/index.md',
  },
  {
    id: 'rdf',
    titre: 'Triplets RDF',
    detail: 'Les graphes .ttl du corpus',
    dossier: '70_Onthologies/triplets',
  },
  {
    id: 'migration',
    titre: "Migration V3 — porte d'argent",
    detail: "Verdicts du triptyque par domaine : distillation, implementation, ontologie",
    dossier: '60_Implementation_Méthodologiques/domaines',
  },
  {
    id: 'agentos',
    titre: 'Agent OS — observabilite',
    detail: 'Tableaux de revue et schema de cadence, apres OKF/OpenWiki',
    dossier: '80_Agent-OS',
    fichier: '80_Agent-OS/index.md',
  },
  {
    id: 'contradictions',
    titre: 'Contradictions',
    detail: '204 contradictions cataloguees, avec chemins et dates',
    fichier: '00_Amadeus/30_MEMORY_CORE/carto/CONSOLIDE.json',
  },
];

/** Resout un chemin relatif SOUS la racine, ou rend null. */
function sousRacine(rel: string): string | null {
  if (!rel) return null;
  const abs = path.resolve(RACINE, rel);
  // `path.resolve` neutralise les `..` ; on verifie ensuite l'appartenance.
  // Comparer les chaines seules laisserait passer « ...V3_autre ».
  const r = RACINE.endsWith(path.sep) ? RACINE : RACINE + path.sep;
  return abs === RACINE || abs.startsWith(r) ? abs : null;
}

function json(res: import('node:http').ServerResponse, code: number, corps: unknown) {
  res.statusCode = code;
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  res.setHeader('Cache-Control', 'no-store');
  res.end(JSON.stringify(corps));
}

export function corpusApi(): Plugin {
  return {
    name: 'corpus-api',
    configureServer(server: ViteDevServer) {
      // --- Synchronisation avec le systeme de fichiers -----------------
      // Le bureau doit montrer l'etat REEL du disque : un fichier ajoute ou
      // supprime dans V3 doit se voir sans rechargement, sans Obsidian, sans
      // second cerveau a tenir a jour. Le corpus EST la source ; l'app n'en
      // est qu'une vue.
      //
      // On se greffe sur le watcher que Vite tient deja (chokidar) plutot
      // que d'en instancier un second : deux watchers sur le meme arbre
      // doublent les evenements et la charge disque pour rien.
      //
      // Vite ne surveille pas V3 par defaut -- le projet est ailleurs. On
      // ajoute uniquement les etages operationnels vivants, en excluant formellement
      // _cold_archive (115 000 fichiers) et les archives volumineuses pour eviter
      // l'asphyxie memoire de Chokidar sur Windows.
      const DOSSIERS_A_SURVEILLER = [
        '00_Amadeus/60_Tape_Specs',
        '10_Tech_OS',
        '20_Life_OS',
        '30_Business_OS',
        '40_Memory_Wiki_OKF',
        '50_Distillation',
        '60_Implementation_Méthodologiques',
        '70_Onthologies/sujets',
        '70_Onthologies/triplets',
        '80_Agent-OS',
        '90-self-evolution',
        '_INBOX',
      ];
      for (const rel of DOSSIERS_A_SURVEILLER) {
        const p = path.join(RACINE, rel);
        if (fs.existsSync(p)) {
          server.watcher.add(p);
        }
      }

      let dernier = 0;
      const prevenir = (type: string, chemin: string) => {
        if (!chemin.startsWith(RACINE)) return;
        const rel = path.relative(RACINE, chemin).split(path.sep).join('/');
        // Le bruit qui n'apprend rien : dossiers techniques, cold archive et temporaires.
        if (/(^|\/)(node_modules|\.git|__pycache__|_cold_archive|_ARCHIVE_|sessions_zombies)(\/|$)/.test(rel)) return;
        if (/\.(tmp|swp|part|crdownload)$/i.test(rel)) return;
        // Antirebond : un enregistrement d'editeur emet souvent 2-3
        // evenements. Sans cela l'app se rafraichit trois fois par sauvegarde.
        const now = Date.now();
        if (now - dernier < 150) return;
        dernier = now;
        server.ws.send({ type: 'custom', event: 'corpus:change', data: { type, chemin: rel } });
      };

      server.watcher.on('add', (p) => prevenir('ajout', p));
      server.watcher.on('unlink', (p) => prevenir('suppression', p));
      server.watcher.on('change', (p) => prevenir('modification', p));
      server.watcher.on('addDir', (p) => prevenir('ajout-dossier', p));
      server.watcher.on('unlinkDir', (p) => prevenir('suppression-dossier', p));

      server.middlewares.use('/api/corpus', (req, res) => {
        const u = new URL(req.url || '/', 'http://x');
        const route = u.pathname.replace(/\/+$/, '') || '/';

        if (route === '/' || route === '/racines') {
          // On n'annonce que ce qui existe vraiment : une entree pointant vers
          // un fichier absent ferait croire a une lacune du corpus.
          const vivantes = RACINES.filter((r) => {
            const c = sousRacine(r.fichier ?? r.dossier ?? '');
            return c !== null && fs.existsSync(c);
          });
          return json(res, 200, { racine: RACINE, racines: vivantes });
        }

        if (route === '/arbre') {
          const abs = sousRacine(u.searchParams.get('d') || '');
          if (!abs) return json(res, 400, { erreur: 'chemin hors racine' });
          let entrees: fs.Dirent[];
          try {
            entrees = fs.readdirSync(abs, { withFileTypes: true });
          } catch {
            return json(res, 404, { erreur: 'dossier illisible' });
          }
          const items = entrees
            .filter((e) => !e.name.startsWith('.') && e.name !== 'node_modules')
            .map((e) => {
              const p = path.join(abs, e.name);
              let octets = 0;
              try { octets = e.isFile() ? fs.statSync(p).size : 0; } catch { /* ignore */ }
              return {
                nom: e.name,
                dossier: e.isDirectory(),
                chemin: path.relative(RACINE, p).replace(/\\/g, '/'),
                octets,
              };
            })
            .sort((a, b) => (a.dossier === b.dossier ? a.nom.localeCompare(b.nom) : a.dossier ? -1 : 1));
          return json(res, 200, { chemin: path.relative(RACINE, abs).replace(/\\/g, '/'), items });
        }

        if (route === '/fichier') {
          const abs = sousRacine(u.searchParams.get('f') || '');
          if (!abs) return json(res, 400, { erreur: 'chemin hors racine' });
          let st: fs.Stats;
          try { st = fs.statSync(abs); } catch { return json(res, 404, { erreur: 'introuvable' }); }
          // Un fichier de 880 Ko bloquerait le rendu. On tronque et on le DIT :
          // un contenu coupe en silence ferait conclure a un corpus incomplet.
          const MAX = 400_000;
          const contenu = fs.readFileSync(abs, 'utf-8').slice(0, MAX);
          return json(res, 200, {
            chemin: path.relative(RACINE, abs).replace(/\\/g, '/'),
            octets: st.size,
            tronque: st.size > MAX,
            contenu,
          });
        }

        if (route === '/mesures') {
          // Compteurs lus a chaud : une mesure figee dans le code vieillit et
          // ment. Bornee en profondeur pour rester instantanee.
          const compter = (rel: string, ext: string) => {
            const base = sousRacine(rel);
            if (!base || !fs.existsSync(base)) return 0;
            let n = 0;
            const pile = [base];
            let gardeFou = 20000;
            while (pile.length && gardeFou-- > 0) {
              const d = pile.pop()!;
              let es: fs.Dirent[];
              try { es = fs.readdirSync(d, { withFileTypes: true }); } catch { continue; }
              for (const e of es) {
                if (e.name === 'node_modules' || e.name.startsWith('.')) continue;
                const p = path.join(d, e.name);
                if (e.isDirectory()) pile.push(p);
                else if (e.name.endsWith(ext)) n++;
              }
            }
            return n;
          };
          let contradictions = 0;
          try {
            const c = sousRacine('00_Amadeus/30_MEMORY_CORE/carto/CONSOLIDE.json');
            if (c) contradictions = (JSON.parse(fs.readFileSync(c, 'utf-8')).contradictions ?? []).length;
          } catch { /* absent : on rend 0, pas une erreur */ }
          return json(res, 200, {
            concepts_okf_bundle: compter('40_Memory_Wiki_OKF', '.md'),
            onthologies: compter('70_Onthologies', '.md'),
            distillation: compter('50_Distillation', '.md'),
            methodologies: compter('60_Implementation_Méthodologiques', '.md'),
            triplets_ttl: compter('70_Onthologies/triplets', '.ttl'),
            domaines_migres: compter('60_Implementation_Méthodologiques/domaines', '.json'),
            ontologies_domaines: compter('70_Onthologies/sujets', '.ttl'),
            contradictions,
          });
        }

        return json(res, 404, { erreur: 'route inconnue' });
      });
    },
  };
}
