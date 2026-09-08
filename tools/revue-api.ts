/**
 * API de revue — le goulot mesure, rendu manipulable.
 *
 * POURQUOI ELLE EXISTE
 * Deux chiffres commandent ce fichier :
 *   - 2 concepts sur 26 sont revus par un humain (8 %). 423 fichiers ont ete
 *     produits en deux vagues, zero relu. La production depasse la
 *     verification -- c'est P6, et produire davantage n'aide plus.
 *   - 204 contradictions sont cataloguees depuis le 2026-08-13 et aucune n'a
 *     ete arbitree. Ce ne sont pas des erreurs a corriger : ce sont des
 *     endroits ou deux versions du systeme coexistent.
 *
 * Les deux attendent la meme chose : un humain qui tranche. Aucune interface
 * ne le permettait, donc rien ne bougeait.
 *
 * LA PORTE QUE CE FICHIER NE FRANCHIT PAS
 * `confiance: machine` -> `confiance: humain` ne se pose que par un geste
 * explicite du proprietaire, et l'ecriture porte SON identifiant. Aucune
 * route ici ne promeut quoi que ce soit automatiquement.
 */

import fs from 'node:fs';
import path from 'node:path';
import type { Plugin, ViteDevServer } from 'vite';

const V3 = path.resolve('C:/Users/amado/ASpace_OS_V3');
const BUNDLE = path.join(V3, '40_Memory_Wiki_OKF');
const CONSOLIDE = path.join(V3, '00_Amadeus/30_MEMORY_CORE/carto/CONSOLIDE.json');
const VERDICTS = path.join(V3, '90-self-evolution/reports/arbitrages.json');

// La documentation du FORMAT n'est pas un concept. Les compter ensemble
// gonflait le taux de revue et masquait le goulot : 6/26 au lieu de 2/26.
const META = new Set(['Format spec', 'Bundle guide', 'Quickstart', 'Bundle index']);

function json(res: import('node:http').ServerResponse, code: number, corps: unknown) {
  res.statusCode = code;
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  res.setHeader('Cache-Control', 'no-store');
  res.end(JSON.stringify(corps));
}

/** Garde de chemin : tout ce qui est lu ou ecrit doit rester sous V3. Sans
 *  cette borne, un `../` dans une requete sortirait du corpus. */
function sousV3(p: string): boolean {
  const r = path.resolve(p);
  return r === V3 || r.startsWith(V3 + path.sep);
}

function frontmatter(t: string): string | null {
  if (!t.startsWith('---')) return null;
  const fin = t.indexOf('\n---', 3);
  return fin > 0 ? t.slice(3, fin) : null;
}

/** Le niveau se DEDUIT de `verified`, il ne se declare pas. C'est tout
 *  l'interet du format : mesure et suppose ne doivent pas se ressembler. */
function niveau(fm: string): 'non verifie' | 'machine' | 'humain' {
  const b = /verified:([\s\S]*?)(?:\n\w|$)/.exec(fm);
  if (!b || !b[1].trim()) return 'non verifie';
  return b[1].includes('human:') ? 'humain' : 'machine';
}

function parcourir(dir: string, out: string[] = []): string[] {
  let entrees: fs.Dirent[];
  try { entrees = fs.readdirSync(dir, { withFileTypes: true }); } catch { return out; }
  for (const e of entrees) {
    if (e.name.startsWith('.')) continue;
    const p = path.join(dir, e.name);
    if (e.isDirectory()) parcourir(p, out);
    else if (e.name.endsWith('.md')) out.push(p);
  }
  return out;
}

function concepts() {
  const items = [];
  let metaExclus = 0;
  for (const p of parcourir(BUNDLE)) {
    let t: string;
    try { t = fs.readFileSync(p, 'utf-8'); } catch { continue; }
    const fm = frontmatter(t);
    if (!fm) continue;
    const ty = (/^type:\s*(.+)$/m.exec(fm)?.[1] ?? '').trim();
    if (META.has(ty)) { metaExclus++; continue; }

    const st = fs.statSync(p);
    items.push({
      nom: path.basename(p, '.md'),
      chemin: path.relative(V3, p).replace(/\\/g, '/'),
      type: ty,
      titre: (/^title:\s*(.+)$/m.exec(fm)?.[1] ?? '').trim(),
      description: (/^description:\s*(.+)$/m.exec(fm)?.[1] ?? '').trim(),
      niveau: niveau(fm),
      // « A SOURCER » signale un livrable honnetement incomplet : c'est un
      // signal de priorite pour la revue, pas un defaut a masquer.
      a_sourcer: (t.match(/A SOURCER/g) ?? []).length,
      octets: st.size,
      modifie: new Date(st.mtime).toISOString(),
    });
  }
  const revus = items.filter((i) => i.niveau === 'humain').length;
  return {
    total: items.length,
    metaExclus,
    revus,
    machine: items.filter((i) => i.niveau === 'machine').length,
    non_verifies: items.filter((i) => i.niveau === 'non verifie').length,
    pct: items.length ? Math.round((100 * revus) / items.length) : 0,
    // Les non verifies d'abord, puis les plus gros : ce qui coute le plus
    // cher a laisser en `machine` remonte en tete.
    items: items.sort((a, b) =>
      (a.niveau === 'humain' ? 1 : 0) - (b.niveau === 'humain' ? 1 : 0)
      || b.a_sourcer - a.a_sourcer || b.octets - a.octets),
  };
}

function contradictions() {
  let brut: { contradictions?: unknown[]; genere?: string } = {};
  try { brut = JSON.parse(fs.readFileSync(CONSOLIDE, 'utf-8')); } catch { /* vide */ }
  const arbitres = lireVerdicts();
  const items = (brut.contradictions ?? []).map((c, i) => {
    const x = c as Record<string, string>;
    return {
      id: `C${String(i + 1).padStart(3, '0')}`,
      sujet: x.sujet ?? '(sans sujet)',
      a: { chemin: x.chemin_a ?? '', date: x.date_a ?? '' },
      b: { chemin: x.chemin_b ?? '', date: x.date_b ?? '' },
      // ONTOLOGIE_V2 : « la version tardive gagne » est la regle de date du
      // proprietaire. On la SUGGERE, on ne l'applique pas : deux versions
      // peuvent coexister a dessein.
      suggestion: !x.date_a || !x.date_b ? null
        : x.date_a === x.date_b ? 'meme date — la regle de date ne tranche pas'
        : (x.date_a > x.date_b ? 'a' : 'b'),
      verdict: arbitres[`C${String(i + 1).padStart(3, '0')}`] ?? null,
    };
  });
  return {
    genere: brut.genere ?? '?',
    total: items.length,
    arbitres: items.filter((i) => i.verdict).length,
    items,
  };
}

function lireVerdicts(): Record<string, unknown> {
  try { return JSON.parse(fs.readFileSync(VERDICTS, 'utf-8')); } catch { return {}; }
}

export function revueApi(): Plugin {
  return {
    name: 'revue-api',
    configureServer(server: ViteDevServer) {
      server.middlewares.use('/api/revue', async (req, res) => {
        const url = new URL(req.url || '/', 'http://x');
        const route = url.pathname.replace(/\/+$/, '') || '/';

        if (route === '/' || route === '/etat') {
          return json(res, 200, {
            lu_a: new Date().toISOString(),
            concepts: concepts(),
            contradictions: contradictions(),
          });
        }

        if (route === '/fichier') {
          const rel = url.searchParams.get('f') ?? '';
          const abs = path.resolve(V3, rel);
          if (!sousV3(abs)) return json(res, 403, { erreur: 'hors du corpus' });
          try {
            return json(res, 200, { contenu: fs.readFileSync(abs, 'utf-8') });
          } catch (e) {
            return json(res, 404, { erreur: String(e) });
          }
        }

        // Promotion machine -> humain. C'est LA porte : elle exige un
        // identifiant, et elle ecrit dans le fichier reel.
        if (route === '/promouvoir' && req.method === 'POST') {
          let corps = '';
          for await (const c of req) corps += c;
          let chemin = '', qui = '';
          try { ({ chemin = '', qui = '' } = JSON.parse(corps || '{}')); } catch { /* vide */ }
          if (!chemin || !qui) {
            return json(res, 400, { erreur: 'chemin et qui sont requis' });
          }
          const abs = path.resolve(V3, chemin);
          if (!sousV3(abs)) return json(res, 403, { erreur: 'hors du corpus' });

          let t: string;
          try { t = fs.readFileSync(abs, 'utf-8'); } catch (e) {
            return json(res, 404, { erreur: String(e) });
          }
          const fm = frontmatter(t);
          if (!fm) return json(res, 400, { erreur: 'pas de frontmatter OKF' });
          const vb = /verified:([\s\S]*?)(?:\n\w|$)/.exec(fm);
          if (vb && vb[1].includes(`human:${qui}`)) {
            return json(res, 200, { deja: true, chemin });
          }
          const quand = new Date().toISOString().replace(/\.\d+/, '');
          const neuf = fm.replace(/verified:/,
            `verified:\n  - { by: human:${qui}, at: ${quand} }`);
          fs.writeFileSync(abs, t.replace(fm, neuf), 'utf-8');
          return json(res, 200, { promu: true, chemin, qui, quand });
        }

        // Arbitrage d'une contradiction. On enregistre le verdict a cote,
        // sans toucher aux fichiers en conflit : trancher n'est pas reecrire,
        // et le proprietaire doit pouvoir revenir sur un arbitrage.
        if (route === '/arbitrer' && req.method === 'POST') {
          let corps = '';
          for await (const c of req) corps += c;
          let id = '', choix = '', qui = '', note = '';
          try { ({ id = '', choix = '', qui = '', note = '' } = JSON.parse(corps || '{}')); }
          catch { /* vide */ }
          if (!id || !choix || !qui) {
            return json(res, 400, { erreur: 'id, choix et qui sont requis' });
          }
          const v = lireVerdicts();
          v[id] = { choix, qui, note, a: new Date().toISOString().replace(/\.\d+/, '') };
          fs.mkdirSync(path.dirname(VERDICTS), { recursive: true });
          fs.writeFileSync(VERDICTS, JSON.stringify(v, null, 2), 'utf-8');
          return json(res, 200, { arbitre: true, id, choix });
        }

        return json(res, 404, { erreur: 'route inconnue' });
      });
    },
  };
}
