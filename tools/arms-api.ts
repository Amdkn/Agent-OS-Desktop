/**
 * API ARMS — l'etat reel des quatre piliers de l'Agentic OS.
 *
 * LE CADRE
 * ARMS (Jay E / RoboNuggets) : Applications, Routines, Memory, Skills. Le
 * guide le dit dans l'ordre inverse, de bas en haut, et c'est le bon ordre :
 * les skills se composent en memoire, la memoire rend les routines fiables,
 * les routines rendent les applications utiles.
 *
 * LE PRINCIPE QUI COMMANDE CE FICHIER
 * « Show, do not store. La page lit ton workspace -- elle est une fenetre,
 * jamais l'endroit ou vit la verite. » Rien n'est ecrit ici. Chaque chiffre
 * est relu sur le disque a chaque appel. Une valeur figee dans le code
 * vieillit et ment ; c'est le defaut que cette app existe pour ne pas avoir.
 *
 * CE QU'ON REFUSE DE FAIRE
 * Le guide propose des « niveaux » L1/L2/L3 par pilier. On ne les DECLARE
 * pas : on les DEDUIT d'un critere mesurable, et quand le critere n'est pas
 * observable depuis ce poste, on rend `null` avec la raison. Un tableau de
 * bord qui affiche un niveau flatteur non mesure est pire qu'un tableau vide.
 */

import { execFile } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import type { Plugin, ViteDevServer } from 'vite';

const MAISON = os.homedir();
const V3 = path.resolve('C:/Users/amado/ASpace_OS_V3');
const SKILLS = path.join(MAISON, '.claude', 'skills');
const MCP = path.join(MAISON, '.mcp.json');

function json(res: import('node:http').ServerResponse, code: number, corps: unknown) {
  res.statusCode = code;
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  res.setHeader('Cache-Control', 'no-store');
  res.end(JSON.stringify(corps));
}

/** Liste un dossier sans jamais lever : un pilier illisible rend une liste vide,
 *  pas une erreur 500 qui masquerait les trois autres. */
function lire(d: string): fs.Dirent[] {
  try { return fs.readdirSync(d, { withFileTypes: true }); } catch { return []; }
}

function compterRecursif(d: string, max = 500): number {
  let n = 0;
  const pile = [d];
  while (pile.length && n < max) {
    const c = pile.pop()!;
    for (const e of lire(c)) {
      if (e.isDirectory()) pile.push(path.join(c, e.name));
      else n++;
    }
  }
  return n;
}

// ---------------------------------------------------------------- S : Skills

function skills() {
  // PIEGE PAYE LE 2026-08-30 : `isDirectory()` rend **false** pour un lien
  // symbolique vers un dossier. Deux skills sur six (`composio`, `unlazy`)
  // disparaissaient silencieusement du tableau de bord.
  //
  // Une sonde PowerShell `(Get-Item).LinkType` avait pourtant repondu « aucun
  // lien » : c'est l'instrument qui avait tort. Quand la mesure contredit
  // l'observation, on repare la sonde, on n'ajuste pas le chiffre.
  //
  // On garde les liens ET on les signale : une skill liee est reelle, mais
  // elle vit ailleurs, et ca se sait au moment de la modifier.
  const entrees = lire(SKILLS).filter((e) => {
    if (e.isDirectory()) return true;
    if (!e.isSymbolicLink()) return false;
    try { return fs.statSync(path.join(SKILLS, e.name)).isDirectory(); } catch { return false; }
  });

  const items = entrees.map((e) => {
    const dir = path.join(SKILLS, e.name);
    const lien = !e.isDirectory();
    const fichiers = compterRecursif(dir);
    let lignes = 0;
    // Le guide fixe une regle nette : « under 60 lines - short skills get
    // followed, long ones get skimmed ». On la mesure au lieu d'y croire.
    let a_skill_md = false;
    for (const nom of ['SKILL.md', 'skill.md']) {
      const p = path.join(dir, nom);
      if (fs.existsSync(p)) {
        a_skill_md = true;
        try { lignes = fs.readFileSync(p, 'utf-8').split('\n').length; } catch { /* vide */ }
        break;
      }
    }
    return {
      nom: e.name,
      fichiers,
      lignes,
      lien,
      // Un dossier sans SKILL.md n'est pas une skill au sens du cadre : c'est
      // un dossier de scripts. Afficher « 0 ligne » le ferait passer pour une
      // skill vide alors que le fichier d'instructions n'existe pas du tout.
      a_skill_md,
      // « A skill is not just one markdown file » : au-dela d'un fichier, la
      // skill porte des references et devient un arbre (niveau 2).
      arbre: fichiers > 1,
      trop_longue: lignes > 60,
    };
  });
  const arbres = items.filter((s) => s.arbre).length;
  return {
    total: items.length,
    arbres,
    liens: items.filter((s) => s.lien).length,
    sans_skill_md: items.filter((s) => !s.a_skill_md).length,
    epaisses: items.filter((s) => s.trop_longue).length,
    // L1 : des skills existent. L2 : au moins une porte un jeu de fichiers.
    // L3 : declenchable sans session -- non observable depuis le disque seul.
    niveau: items.length === 0 ? 1 : arbres > 0 ? 2 : 1,
    niveau3_note: "non mesurable ici : depend d'un declenchement hors session",
    items: items.sort((a, b) => b.fichiers - a.fichiers),
  };
}

// ---------------------------------------------------------------- M : Memory

/** Les routeurs du guide : « a master router file names your areas of work ».
 *  Ici ce sont les deux CLAUDE.md et les index regeneres. */
function memoire() {
  // `auto` distingue ce qui est charge a CHAQUE session de ce qui est lu a la
  // demande. Les additionner donnerait un cout de demarrage trois fois trop
  // gros -- une carte qui exagere le prix pousse a couper ce qu'il faut garder.
  const candidats = [
    { role: 'routeur maitre (pourquoi)', auto: true, p: path.join(MAISON, 'CLAUDE.md') },
    { role: 'routeur de travail (comment)', auto: true, p: path.join(V3, 'CLAUDE.md') },
    { role: 'carte du corpus', auto: false, p: path.join(V3, 'CARTOGRAPHIE.md') },
    { role: 'index des distillations', auto: false, p: path.join(V3, 'INDEX_DISTILLATIONS.md') },
    { role: 'rapport d\u2019intentions', auto: false,
      p: path.join(V3, '50_Distillation/RAPPORT_INTENTIONS_V3.md') },
  ];
  const routeurs = candidats.map((c) => {
    let octets = 0, lignes = 0, modifie: string | null = null;
    try {
      const st = fs.statSync(c.p);
      octets = st.size;
      modifie = new Date(st.mtime).toISOString().slice(0, 10);
      lignes = fs.readFileSync(c.p, 'utf-8').split('\n').length;
    } catch { /* absent : octets reste 0, et l'app l'affiche comme manquant */ }
    return {
      role: c.role,
      auto: c.auto,
      nom: path.basename(c.p),
      chemin: c.p.replace(/\\/g, '/'),
      present: octets > 0,
      octets, lignes,
      tokens_estimes: Math.round(octets / 4),
      modifie,
    };
  });
  const presents = routeurs.filter((r) => r.present).length;
  const vivants = routeurs.filter((r) => r.present);
  return {
    routeurs,
    presents,
    // Deux totaux distincts, parce qu'un seul mentirait : le cout de
    // demarrage n'est PAS la somme de tout ce qui est atteignable.
    tokens_demarrage: vivants.filter((r) => r.auto)
      .reduce((s, r) => s + r.tokens_estimes, 0),
    tokens_a_la_demande: vivants.filter((r) => !r.auto)
      .reduce((s, r) => s + r.tokens_estimes, 0),
    // L1 : un dossier. L2 : des routeurs existent. L3 : une carte visuelle --
    // et elle existe, c'est l'app Corpus de ce meme bureau.
    niveau: presents === 0 ? 1 : 3,
    niveau3_preuve: 'app Corpus — arborescence vivante du corpus V3',
  };
}

// -------------------------------------------------------------- R : Routines

/** Les taches planifiees Windows, hors Microsoft. `Get-ScheduledTask` est lu
 *  a chaud : une liste figee ici serait fausse des la premiere tache ajoutee. */
function routines(): Promise<unknown> {
  return new Promise((resolve) => {
    execFile(
      'powershell',
      ['-NoProfile', '-Command',
       // On joint `Get-ScheduledTaskInfo` : sans lui on a des noms sans
       // horaires, et le tableau du guide (TIME / ROUTINE / STATUS) perd sa
       // colonne la plus utile -- celle qui dit ce qui va tomber ensuite.
       "Get-ScheduledTask | Where-Object { $_.TaskPath -notlike '\\Microsoft\\*' } | " +
       'ForEach-Object { $i = $_ | Get-ScheduledTaskInfo -ErrorAction SilentlyContinue; ' +
       '[pscustomobject]@{ TaskName=$_.TaskName; State=$_.State; TaskPath=$_.TaskPath; ' +
       'Next=$i.NextRunTime; Last=$i.LastRunTime; Result=$i.LastTaskResult } } | ' +
       'ConvertTo-Json -Compress'],
      { timeout: 12000, maxBuffer: 4 << 20 },
      (err, out) => {
        if (err) {
          // On dit pourquoi c'est vide. Un pilier muet ferait croire a zero tache.
          return resolve({ total: null, erreur: 'Get-ScheduledTask injoignable', items: [] });
        }
        let brut: unknown;
        try { brut = JSON.parse(out || '[]'); } catch { brut = []; }
        const arr = (Array.isArray(brut) ? brut : [brut]) as Array<{
          TaskName?: string; State?: number | string; TaskPath?: string;
          Next?: string; Last?: string; Result?: number;
        }>;
        /** PowerShell serialise les dates en `/Date(1756...)/`. Sans ce
         *  decodage la colonne horaire afficherait la chaine brute. */
        const date = (v?: string): string | null => {
          if (!v) return null;
          const m = /\/Date\((\d+)/.exec(v);
          const d = m ? new Date(Number(m[1])) : new Date(v);
          return Number.isNaN(d.getTime()) ? null : d.toISOString();
        };
        const items = arr.filter(Boolean).map((t) => ({
          nom: t.TaskName ?? '(sans nom)',
          chemin: t.TaskPath ?? '\\',
          // L'enum Windows : 3 = Ready, 4 = Running, 1 = Disabled.
          etat: t.State === 3 || t.State === 'Ready' ? 'prête'
              : t.State === 4 || t.State === 'Running' ? 'en cours'
              : t.State === 1 || t.State === 'Disabled' ? 'désactivée'
              : String(t.State ?? '?'),
          prochain: date(t.Next),
          dernier: date(t.Last),
          // 0 = succes. On garde le code brut : un « echec » sans code ne se
          // diagnostique pas, et 267011 (« jamais lancee ») n'est pas une panne.
          resultat: typeof t.Result === 'number' ? t.Result : null,
        }));
        // Tri par prochaine echeance : le tableau doit repondre « qu'est-ce
        // qui tombe ensuite », pas « quel nom vient en premier dans l'alphabet ».
        items.sort((a, b) => (a.prochain ?? '9').localeCompare(b.prochain ?? '9'));
        resolve({
          total: items.length,
          actives: items.filter((i) => i.etat !== 'désactivée').length,
          en_echec: items.filter((i) => i.resultat !== null && i.resultat !== 0
                                        && i.resultat !== 267011).length,
          // L1 : des taches locales tournent. L2/L3 exigent une machine
          // toujours allumee -- invisible depuis ce poste, donc non affirme.
          niveau: items.length > 0 ? 1 : 0,
          niveau2_note: "non mesurable ici : exige de constater une machine distante",
          items: items.slice(0, 40),
        });
      },
    );
  });
}

// ---------------------------------------------------------- A : Applications

function applications() {
  let serveurs: Record<string, { url?: string; command?: string }> = {};
  try {
    serveurs = (JSON.parse(fs.readFileSync(MCP, 'utf-8')).mcpServers ?? {});
  } catch { /* absent : on rendra 0, pas une erreur */ }
  const items = Object.entries(serveurs).map(([nom, v]) => ({
    nom,
    transport: v.url ? 'http' : 'stdio',
    // On n'affiche JAMAIS la valeur d'un secret. Le nom du serveur suffit ;
    // l'URL peut porter un jeton en clair dans certaines configurations.
    cible: v.url ? new URL(v.url).host : (v.command ?? '?'),
  }));
  return {
    total: items.length,
    http: items.filter((i) => i.transport === 'http').length,
    stdio: items.filter((i) => i.transport === 'stdio').length,
    // L3 = des applications maison. Le bureau lui-meme en est une, et ses
    // apps sont sur le disque : on les compte plutot que de l'affirmer.
    micro_apps: lire(path.resolve('src/apps'))
      .filter((e) => e.isDirectory() && !e.name.startsWith('_'))
      .map((e) => e.name),
    niveau: items.length === 0 ? 1 : 3,
    items,
  };
}

// ------------------------------------------------------------- artefacts

/** « Artifacts, one click away » : ce que les agents ont produit recemment.
 *  On balaie les dossiers de rapports et de sorties, pas tout le corpus --
 *  6 500 fichiers rendraient la liste inutilisable. */
function artefacts(limite = 24) {
  const zones = [
    '50_Distillation', '60_Implementation_Méthodologiques',
    '70_Onthologies/_briefs', '10_Tech_OS/00_Governance_Rick',
    '30_Business_OS/09_Blueprints', '80_Agent-OS',
  ];
  const trouves: Array<{ nom: string; chemin: string; octets: number; modifie: number }> = [];
  for (const z of zones) {
    const base = path.join(V3, z);
    const pile = [base];
    let garde = 4000;
    while (pile.length && garde-- > 0) {
      const d = pile.pop()!;
      for (const e of lire(d)) {
        if (e.name.startsWith('.') || e.name === 'node_modules') continue;
        const p = path.join(d, e.name);
        if (e.isDirectory()) { pile.push(p); continue; }
        if (!/^(RAPPORT_|SYNTHESE_|AUDIT_)/.test(e.name) && !/\.html$/i.test(e.name)) continue;
        try {
          const st = fs.statSync(p);
          trouves.push({
            nom: e.name,
            chemin: path.relative(V3, p).replace(/\\/g, '/'),
            octets: st.size,
            modifie: st.mtimeMs,
          });
        } catch { /* illisible : on l'omet plutot que de faire tomber la liste */ }
      }
    }
  }
  trouves.sort((a, b) => b.modifie - a.modifie);
  return {
    total: trouves.length,
    items: trouves.slice(0, limite).map((a) => ({
      ...a, modifie: new Date(a.modifie).toISOString(),
    })),
  };
}

// ------------------------------------------------- deck de skills (headless)

/** Lance une skill hors session, comme le fait le guide avec `-p`.
 *
 *  GARDE : le nom est valide contre les dossiers reellement presents dans
 *  ~/.claude/skills. Sans cette liste blanche, un champ de la page
 *  deviendrait une execution de commande arbitraire depuis le navigateur.
 *
 *  On passe par `claude-glm` : hors quota Anthropic, avec les deux drapeaux
 *  MCP sans lesquels l'appel rend « Prompt is too long » avant de commencer. */
function lancerSkill(nom: string, modele: string): Promise<{ ok: boolean; sortie: string }> {
  return new Promise((resolve) => {
    try {
      const permis = new Set(lire(SKILLS).map((e) => e.name));
      if (!permis.has(nom)) {
        return resolve({ ok: false, sortie: `skill inconnue : ${nom}` });
      }
      const cmd = path.join(MAISON, '.claude', 'custom-models',
        modele === 'glm' ? 'claude-glm.cmd' : 'claude-glm.cmd');
      if (!fs.existsSync(cmd)) {
        return resolve({ ok: false, sortie: `lanceur introuvable : ${cmd}` });
      }
      execFile('cmd.exe',
        ['/c', cmd, '--dangerously-skip-permissions', '--strict-mcp-config',
         '--mcp-config', '{"mcpServers":{}}', '-p', `/${nom}`],
        { timeout: 300000, maxBuffer: 8 << 20 },
        (err, out, errOut) => resolve({
          ok: !err,
          sortie: (out || errOut || String(err ?? '')).slice(-4000),
        }));
    } catch (err: unknown) {
      resolve({ ok: false, sortie: String(err) });
    }
  });
}

export function armsApi(): Plugin {
  return {
    name: 'arms-api',
    configureServer(server: ViteDevServer) {
      server.middlewares.use('/api/arms', async (req, res) => {
        const route = (new URL(req.url || '/', 'http://x').pathname).replace(/\/+$/, '') || '/';
        if (route === '/' || route === '/etat') {
          return json(res, 200, {
            lu_a: new Date().toISOString(),
            skills: skills(),
            memoire: memoire(),
            routines: await routines(),
            applications: applications(),
            artefacts: artefacts(),
          });
        }

        if (route === '/lancer' && req.method === 'POST') {
          let corps = '';
          for await (const c of req) corps += c;
          let nom = '', modele = 'glm';
          try { ({ nom = '', modele = 'glm' } = JSON.parse(corps || '{}')); } catch { /* vide */ }
          if (!nom) return json(res, 400, { erreur: 'nom de skill manquant' });
          const r = await lancerSkill(nom, modele);
          return json(res, r.ok ? 200 : 500, r);
        }

        return json(res, 404, { erreur: 'route inconnue' });
      });
    },
  };
}
