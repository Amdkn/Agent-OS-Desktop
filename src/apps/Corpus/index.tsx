/**
 * Corpus — Observabilité & Exploration d'A'Space OS V3.
 *
 * Architecture des 4 panneaux réorganisables & redimensionnables :
 *   1. Points d'accès & Compteurs réels du corpus
 *   2. Arborescence V3 (navigation par dossiers & fichiers avec recherche)
 *   3. Résumé & Plan d'analyse (situé sur le côté entre l'arborescence et le contenu)
 *   4. Contenu détaillé du document avec plan interactif
 */

import { useCallback, useEffect, useMemo, useState } from 'react';
import { Poignee } from '../_cadre/Poignee';

interface Racine {
  id: string;
  titre: string;
  detail: string;
  fichier?: string;
  dossier?: string;
}

interface Item {
  nom: string;
  dossier: boolean;
  chemin: string;
  octets: number;
}

interface Fichier {
  chemin: string;
  octets: number;
  tronque: boolean;
  contenu: string;
}

type Mesures = Record<string, number>;

const ETIQ: Record<string, string> = {
  concepts_okf_bundle: 'concepts OKF (bundle)',
  onthologies: 'ontologies',
  distillation: 'distillation',
  methodologies: 'méthodologies',
  triplets_ttl: 'triplets .ttl',
  contradictions: 'contradictions',
  domaines_migres: 'domaines migrés',
  ontologies_domaines: 'ontologies de domaine',
};

async function apiCorpus<T>(route: string): Promise<T | null> {
  try {
    const r = await fetch(`/api/corpus${route}`, { cache: 'no-store' });
    if (!r.ok) return null;
    return (await r.json()) as T;
  } catch {
    return null;
  }
}

/** Extrait les titres d'un document markdown */
function extrairePlan(md: string) {
  return md
    .split('\n')
    .map((l) => /^(#{1,4})\s+(.*)$/.exec(l.trim()))
    .filter((m): m is RegExpExecArray => m !== null)
    .map((m) => ({ niveau: m[1].length, texte: m[2].replace(/[`*]/g, '') }))
    .slice(0, 60);
}

/** Extrait et analyse le frontmatter d'un fichier */
function analyserFrontmatter(contenu: string) {
  if (!contenu.startsWith('---')) return null;
  const fin = contenu.indexOf('\n---', 3);
  if (fin === -1) return null;
  const fm = contenu.slice(3, fin);

  const getField = (name: string) => {
    const regex = new RegExp(`^${name}:\\s*(.+)$`, 'm');
    const match = regex.exec(fm);
    return match ? match[1].trim() : null;
  };

  const isVerifiedHuman = fm.includes('human:');
  const isVerifiedMachine = fm.includes('machine:') || fm.includes('claude');

  return {
    titre: getField('title') || getField('titre') || getField('id'),
    type: getField('type') || getField('Type'),
    description: getField('description') || getField('desc'),
    tags: getField('tags'),
    statut: isVerifiedHuman ? 'humain' : isVerifiedMachine ? 'machine' : 'non verifie',
    texteBrut: fm,
  };
}

export function CorpusApp() {
  const [racines, setRacines] = useState<Racine[]>([]);
  const [mesures, setMesures] = useState<Mesures | null>(null);
  const [dossier, setDossier] = useState<string>('');
  const [items, setItems] = useState<Item[]>([]);
  const [fichier, setFichier] = useState<Fichier | null>(null);
  const [filtreFichier, setFiltreFichier] = useState('');
  const [dernierChangement, setDernierChangement] = useState<{ type: string; chemin: string; at: number } | null>(null);

  // Largeurs des panneaux persistantes
  const [lAcces, setLAcces] = useState(() => Number(localStorage.getItem('corpus.l1') ?? 220));
  const [lArbre, setLArbre] = useState(() => Number(localStorage.getItem('corpus.l2') ?? 260));
  const [lResume, setLResume] = useState(() => Number(localStorage.getItem('corpus.l3') ?? 270));

  // Toggles de panneaux
  const [afficherAcces, setAfficherAcces] = useState(true);
  const [afficherResume, setAfficherResume] = useState(true);

  const [erreur, setErreur] = useState<string | null>(null);
  const [charge, setCharge] = useState(false);

  useEffect(() => { localStorage.setItem('corpus.l1', String(lAcces)); }, [lAcces]);
  useEffect(() => { localStorage.setItem('corpus.l2', String(lArbre)); }, [lArbre]);
  useEffect(() => { localStorage.setItem('corpus.l3', String(lResume)); }, [lResume]);

  const charger = useCallback(async () => {
    const r = await apiCorpus<{ racines: Racine[] }>('/racines');
    if (!r) {
      setErreur("L'API du corpus ne répond pas.");
      setCharge(true);
      return;
    }
    setRacines(r.racines);
    setMesures(await apiCorpus<Mesures>('/mesures'));
    setCharge(true);
  }, []);

  useEffect(() => {
    void charger();
  }, [charger]);

  const ouvrirDossier = useCallback(async (d: string) => {
    setErreur(null);
    const r = await apiCorpus<{ chemin: string; items: Item[] }>(`/arbre?d=${encodeURIComponent(d)}`);
    if (!r) {
      setErreur(`Dossier illisible : ${d}`);
      return;
    }
    setDossier(r.chemin);
    setItems(r.items);
  }, []);

  const ouvrirFichier = useCallback(async (f: string) => {
    setErreur(null);
    const r = await apiCorpus<Fichier>(`/fichier?f=${encodeURIComponent(f)}`);
    if (!r) {
      setErreur(`Fichier illisible : ${f}`);
      return;
    }
    setFichier(r);
  }, []);

  // WebSocket Live Reload lors de modifications disque
  useEffect(() => {
    const hot = (import.meta as unknown as { hot?: { on: (e: string, cb: (d: unknown) => void) => void } }).hot;
    if (!hot) return;
    hot.on('corpus:change', (brut) => {
      const d = brut as { type: string; chemin: string };
      setDernierChangement({ ...d, at: Date.now() });
      void apiCorpus<Mesures>('/mesures').then((m) => { if (m) setMesures(m); });
      setDossier((courant) => {
        if (courant && d.chemin.startsWith(courant)) void ouvrirDossier(courant);
        return courant;
      });
      setFichier((f) => {
        if (f && d.chemin === f.chemin) void ouvrirFichier(f.chemin);
        return f;
      });
    });
  }, [ouvrirDossier, ouvrirFichier]);

  // Fil d'Ariane
  const filAriane = useMemo(() => {
    if (!dossier) return [];
    const parts = dossier.split('/');
    return parts.map((p, i) => ({ nom: p, chemin: parts.slice(0, i + 1).join('/') }));
  }, [dossier]);

  // Items filtrés dans l'arborescence
  const itemsFiltres = useMemo(() => {
    if (!filtreFichier.trim()) return items;
    return items.filter((it) => it.nom.toLowerCase().includes(filtreFichier.toLowerCase()));
  }, [items, filtreFichier]);

  // Analyse synthétique du fichier ouvert
  const metaFichier = useMemo(() => {
    if (!fichier) return null;
    const fm = analyserFrontmatter(fichier.contenu);
    const plan = fichier.chemin.endsWith('.md') ? extrairePlan(fichier.contenu) : [];

    let resumeTexte = fm?.description || '';
    if (!resumeTexte) {
      const lignes = fichier.contenu
        .split('\n')
        .map((l) => l.trim())
        .filter((l) => l && !l.startsWith('#') && !l.startsWith('---') && !l.startsWith('import'));
      resumeTexte = lignes.slice(0, 3).join(' ') || 'Fichier textuel / technique sans description.';
    }

    return {
      fm,
      plan,
      resumeTexte,
      nom: fichier.chemin.split('/').pop() || fichier.chemin,
      estMd: fichier.chemin.endsWith('.md'),
    };
  }, [fichier]);

  if (!charge) return <div className="p-4 text-xs text-neutral-500 font-mono">Chargement du corpus V3…</div>;

  return (
    <div className="flex flex-col h-full bg-[#09090b] text-neutral-200 select-none overflow-hidden font-sans text-xs">
      {/* 1. Header Global */}
      <header className="px-4 py-2.5 border-b border-neutral-800 bg-neutral-950/80 backdrop-blur-md flex items-center justify-between shrink-0 z-20">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <span className="text-base text-orange-500 font-bold">◈</span>
            <span className="font-bold tracking-wider font-mono text-neutral-100 uppercase text-xs">
              CORPUS V3
            </span>
          </div>
          <span className="text-[11px] text-neutral-500 font-mono hidden sm:inline">
            Observabilité & Arborescence Système
          </span>
        </div>

        {/* Header Right Actions */}
        <div className="flex items-center gap-3 font-mono text-[11px]">
          <div className="flex items-center gap-1 text-neutral-500">
            <button
              onClick={() => setAfficherAcces(!afficherAcces)}
              className={`px-2.5 py-1 rounded-lg border transition-colors ${
                afficherAcces ? 'border-neutral-700 text-neutral-300 bg-neutral-900' : 'border-neutral-800 text-neutral-600'
              }`}
              title="Afficher/Masquer les Points d'accès"
            >
              Points d'accès
            </button>
            <button
              onClick={() => setAfficherResume(!afficherResume)}
              className={`px-2.5 py-1 rounded-lg border transition-colors ${
                afficherResume ? 'border-neutral-700 text-orange-400 bg-neutral-900 font-semibold' : 'border-neutral-800 text-neutral-600'
              }`}
              title="Afficher/Masquer le panneau Résumé & Plan"
            >
              Résumé & Plan
            </button>
          </div>

          <button
            onClick={() => void charger()}
            className="px-3 py-1 rounded-xl bg-neutral-900 hover:bg-neutral-800 border border-neutral-800 text-neutral-300 transition-colors flex items-center gap-1.5"
          >
            <span>🔄</span>
            <span>Relire</span>
          </button>
        </div>
      </header>

      {/* 2. Corps Principal : 4 Sections Redimensionnables */}
      <div className="flex-1 flex min-h-0 relative">
        {/* SECTION 1 : POINTS D'ACCÈS & COMPTEURS DU CORPUS */}
        {afficherAcces && (
          <>
            <aside style={{ width: lAcces }} className="shrink-0 flex flex-col overflow-hidden bg-neutral-950/40 border-r border-neutral-800/80">
              <div className="px-3 py-2 text-[10px] uppercase tracking-wider font-mono text-neutral-500 font-semibold border-b border-neutral-900">
                Points d'accès
              </div>
              <ul className="flex-1 overflow-y-auto scrollbar">
                {racines.map((r) => (
                  <li key={r.id}>
                    <button
                      onClick={() => {
                        if (r.dossier) void ouvrirDossier(r.dossier);
                        if (r.fichier) void ouvrirFichier(r.fichier);
                      }}
                      className="w-full text-left px-3 py-2.5 border-b border-neutral-900/60 hover:bg-neutral-900/60 transition-colors group"
                    >
                      <div className="font-semibold text-xs text-neutral-200 group-hover:text-orange-400 transition-colors">
                        {r.titre}
                      </div>
                      <div className="text-[10px] text-neutral-500 leading-snug line-clamp-2 mt-0.5">
                        {r.detail}
                      </div>
                    </button>
                  </li>
                ))}
              </ul>

              {/* Changement Disque Live */}
              {dernierChangement && Date.now() - dernierChangement.at < 10000 && (
                <div className="border-t border-orange-950 bg-orange-950/40 px-3 py-1.5 text-[10px] font-mono text-orange-400 truncate animate-pulse">
                  ● {dernierChangement.type} — {dernierChangement.chemin.split('/').pop()}
                </div>
              )}

              {/* Compteurs Vivants */}
              {mesures && (
                <div className="border-t border-neutral-900 p-3 bg-neutral-950/80 space-y-1 font-mono">
                  <div className="text-[9px] uppercase tracking-wider text-neutral-500 font-bold mb-1.5">
                    Corpus, mesuré à l'instant
                  </div>
                  {Object.entries(mesures).map(([k, v]) => (
                    <div key={k} className="flex justify-between text-[10px]">
                      <span className="text-neutral-500">{ETIQ[k] ?? k}</span>
                      <span className="text-neutral-300 font-bold tabular-nums">{v}</span>
                    </div>
                  ))}
                </div>
              )}
            </aside>
            <Poignee largeur={lAcces} onChange={setLAcces} min={180} max={400} />
          </>
        )}

        {/* SECTION 2 : ARBORESCENCE V3 */}
        <section style={{ width: lArbre }} className="shrink-0 flex flex-col overflow-hidden bg-neutral-950/20 border-r border-neutral-800/80">
          {/* Fil d'Ariane */}
          <div className="p-2 border-b border-neutral-900 text-[11px] font-mono flex items-center gap-1 min-h-[36px] bg-neutral-950/40 overflow-x-auto">
            <button
              onClick={() => void ouvrirDossier('')}
              className="text-orange-400 font-bold hover:underline"
            >
              V3
            </button>
            {filAriane.map((f) => (
              <span key={f.chemin} className="flex items-center gap-1 shrink-0">
                <span className="text-neutral-600">/</span>
                <button
                  onClick={() => void ouvrirDossier(f.chemin)}
                  className="text-neutral-300 hover:text-white hover:underline truncate max-w-[120px]"
                >
                  {f.nom}
                </button>
              </span>
            ))}
          </div>

          {/* Recherche rapide */}
          <div className="p-2 border-b border-neutral-900/60 bg-neutral-950/20">
            <input
              type="text"
              value={filtreFichier}
              onChange={(e) => setFiltreFichier(e.target.value)}
              placeholder="Filtrer dossier..."
              className="w-full bg-neutral-900 border border-neutral-800 rounded-lg px-2.5 py-1 text-[11px] font-mono text-neutral-200 placeholder-neutral-600 focus:outline-none focus:border-orange-500"
            />
          </div>

          {/* Liste Fichiers / Dossiers */}
          <ul className="flex-1 overflow-y-auto scrollbar">
            {itemsFiltres.length === 0 && (
              <li className="p-4 text-[11px] text-neutral-500 text-center font-mono">
                {items.length === 0 ? "Choisissez un point d'accès à gauche." : 'Aucun fichier correspondant.'}
              </li>
            )}
            {itemsFiltres.map((it) => {
              const estSelectionne = fichier?.chemin === it.chemin;
              return (
                <li key={it.chemin}>
                  <button
                    onClick={() => (it.dossier ? void ouvrirDossier(it.chemin) : void ouvrirFichier(it.chemin))}
                    className={`w-full text-left px-3 py-2 flex items-center gap-2 border-b border-neutral-900/40 transition-colors ${
                      estSelectionne
                        ? 'bg-orange-950/40 text-orange-300 border-l-2 border-l-orange-500'
                        : 'hover:bg-neutral-900/40 text-neutral-300'
                    }`}
                  >
                    <span className="text-neutral-500 w-3 text-xs">{it.dossier ? '▸' : '·'}</span>
                    <span className="flex-1 truncate font-mono text-xs">{it.nom}</span>
                    {!it.dossier && (
                      <span className="text-[10px] font-mono text-neutral-500 tabular-nums shrink-0">
                        {it.octets > 1024 ? `${Math.round(it.octets / 1024)} Ko` : `${it.octets} o`}
                      </span>
                    )}
                  </button>
                </li>
              );
            })}
          </ul>
        </section>
        <Poignee largeur={lArbre} onChange={setLArbre} min={200} max={500} />

        {/* SECTION 3 : RÉSUMÉ & ANALYSE DU CONTENU (ENTRE ARBORESCENCE ET CONTENU) */}
        {afficherResume && (
          <>
            <aside
              style={{ width: lResume }}
              className="shrink-0 flex flex-col overflow-hidden bg-neutral-950/60 border-r border-neutral-800/80 font-mono"
            >
              <div className="px-3 py-2 text-[10px] uppercase tracking-wider text-neutral-500 font-semibold border-b border-neutral-900 flex items-center justify-between">
                <span>RÉSUMÉ & PLAN</span>
                {metaFichier && (
                  <span className="text-orange-400 text-[9px]">{metaFichier.estMd ? 'MARKDOWN' : 'FICHIER'}</span>
                )}
              </div>

              {metaFichier ? (
                <div className="flex-1 overflow-y-auto scrollbar p-3.5 space-y-4">
                  {/* Cartouche Métadonnées & Statut */}
                  <div className="p-3 rounded-xl bg-neutral-900/80 border border-neutral-800 space-y-2.5">
                    <div className="flex items-center justify-between">
                      <span className="text-[9px] text-neutral-500 uppercase font-bold">STATUT</span>
                      <span
                        className={`px-2 py-0.5 rounded text-[9px] font-bold uppercase ${
                          metaFichier.fm?.statut === 'humain'
                            ? 'bg-emerald-950 text-emerald-400 border border-emerald-800'
                            : metaFichier.fm?.statut === 'machine'
                            ? 'bg-amber-950 text-amber-400 border border-amber-800'
                            : 'bg-neutral-800 text-neutral-400'
                        }`}
                      >
                        {metaFichier.fm?.statut || 'machine'}
                      </span>
                    </div>

                    {metaFichier.fm?.type && (
                      <div className="text-[10px] text-neutral-400">
                        <span className="text-neutral-500">Type : </span>
                        <span className="text-neutral-200 font-semibold">{metaFichier.fm.type}</span>
                      </div>
                    )}
                  </div>

                  {/* Résumé Synthétique */}
                  <div className="space-y-1.5">
                    <span className="text-[9px] uppercase tracking-wider text-neutral-500 font-bold">
                      RÉSUMÉ DU DOCUMENT
                    </span>
                    <p className="text-[11px] text-neutral-300 leading-relaxed bg-neutral-900/40 p-2.5 rounded-xl border border-neutral-900">
                      {metaFichier.resumeTexte}
                    </p>
                  </div>

                  {/* Plan Hiérarchique Cliquable */}
                  {metaFichier.plan.length > 0 && (
                    <div className="space-y-1.5 pt-2 border-t border-neutral-900">
                      <span className="text-[9px] uppercase tracking-wider text-neutral-500 font-bold">
                        STRUCTURE DU PLAN ({metaFichier.plan.length})
                      </span>
                      <div className="space-y-1">
                        {metaFichier.plan.map((t, idx) => (
                          <div
                            key={idx}
                            className="text-[11px] leading-snug truncate text-neutral-400 hover:text-orange-400 cursor-pointer transition-colors"
                            style={{
                              paddingLeft: (t.niveau - 1) * 8,
                              opacity: 1 - (t.niveau - 1) * 0.12,
                            }}
                          >
                            <span className="opacity-40 font-bold mr-1">{'#'.repeat(t.niveau)}</span>
                            <span>{t.texte}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div className="flex-1 flex items-center justify-center text-neutral-600 text-center p-4">
                  <p className="text-[11px]">Sélectionnez un fichier pour voir son analyse et son plan.</p>
                </div>
              )}
            </aside>
            <Poignee largeur={lResume} onChange={setLResume} min={200} max={600} />
          </>
        )}

        {/* SECTION 4 : CONTENU DÉTAILLÉ DU FICHIER */}
        <main className="flex-1 flex flex-col overflow-hidden bg-[#08080a]">
          {erreur && (
            <div className="m-3 p-3 rounded-xl border border-red-500/40 bg-red-950/20 text-red-400 text-xs font-mono">
              {erreur}
            </div>
          )}

          {!fichier && !erreur && (
            <div className="flex-1 flex items-center justify-center text-neutral-500 text-center px-6">
              <div>
                <div className="text-4xl mb-3 text-orange-500/30 animate-pulse">◈</div>
                <h3 className="text-sm font-bold text-neutral-300 font-mono mb-1">
                  EXPLORATEUR DU CORPUS V3
                </h3>
                <p className="text-xs max-w-md mx-auto text-neutral-500">
                  Parcourez l'ensemble des fichiers, concepts, ontologies et méthodologies d'A'Space OS V3.
                </p>
              </div>
            </div>
          )}

          {fichier && (
            <>
              {/* Header Bar */}
              <div className="px-4 py-2 border-b border-neutral-800 bg-neutral-950 flex items-center justify-between font-mono shrink-0">
                <div className="flex items-center gap-2 truncate">
                  <code className="text-xs text-neutral-200 truncate">{fichier.chemin}</code>
                  <span className="text-[10px] text-neutral-500 tabular-nums">
                    ({Math.round(fichier.octets / 1024)} Ko)
                  </span>
                </div>
                {fichier.tronque && (
                  <span className="text-[10px] text-red-400 font-bold">tronqué à 400 Ko</span>
                )}
              </div>

              {/* Content Body */}
              <pre className="flex-1 overflow-auto scrollbar p-4 text-[11px] leading-relaxed whitespace-pre-wrap font-mono text-neutral-300 bg-black/30">
                {fichier.contenu}
              </pre>
            </>
          )}
        </main>
      </div>
    </div>
  );
}

export const App = CorpusApp;

export const manifest = {
  id: 'corpus',
  name: 'Corpus',
  kind: 'multi' as const,
  description: "Observabilité d'A'Space OS V3 — Arborescence, Résumé intermédiaire, Plan et Contenu.",
  icon: '◈',
  domaine: 'l1-life',
};
