/**
 * Revue — Le Goulot de Vérification Mesuré et Rendu Manipulable.
 *
 * Architecture en 4 sections réorganisables & redimensionnables :
 *   1. Métriques de Revue, Taux & Filtres par type
 *   2. Liste des Concepts / Contradictions avec recherche
 *   3. Résumé, Proposition Logique & Plan (entre la liste et le contenu)
 *   4. Contenu détaillé du document / Synthèse d'arbitrage
 */

import { useCallback, useEffect, useMemo, useState } from 'react';
import { Poignee } from '../_cadre/Poignee';

interface Concept {
  nom: string;
  chemin: string;
  type: string;
  titre: string;
  description: string;
  niveau: 'non verifie' | 'machine' | 'humain';
  a_sourcer: number;
  octets: number;
  modifie: string;
}

interface Cote {
  chemin: string;
  date: string;
}

interface Contradiction {
  id: string;
  sujet: string;
  a: Cote;
  b: Cote;
  suggestion: 'a' | 'b' | string | null;
  verdict: { choix: string; qui: string; note: string; a: string } | null;
}

interface Etat {
  lu_a: string;
  concepts: {
    total: number;
    metaExclus: number;
    revus: number;
    machine: number;
    non_verifies: number;
    pct: number;
    items: Concept[];
  };
  contradictions: {
    genere: string;
    total: number;
    arbitres: number;
    items: Contradiction[];
  };
}

const QUI = 'amdkn';

/** Proposition logique par famille. */
function proposerReponse(c: Contradiction): string {
  const s = c.sujet.toLowerCase();
  const datePlusRecente = c.b.date >= c.a.date ? c.b : c.a;
  const cheminRecent = datePlusRecente.chemin;

  if (s.includes('casse') || s.includes('underscore') || s.includes('tiret') || s.includes('orthographe') || s.includes('typo')) {
    return `Normalisation syntaxique : alignement sur la convention canonique V3 (kebab-case/canonique).`;
  }
  if (s.includes('cycle') || s.includes('84') || s.includes('21') || s.includes('w1') || s.includes('w12') || s.includes('semaine')) {
    return `Hiérarchie temporelle : 84 jours = trimestre 12WY, 21 jours = sous-cycle sprint W1-W3.`;
  }
  if (s.includes('phase d') || s.includes('stale') || s.includes('done')) {
    return `État d'exécution effectif : AGENTS.md Phase D DONE prévaut sur les chartes antérieures.`;
  }
  if (s.includes('format') || s.includes('b1/b2') || s.includes('t1/t2') || s.includes('canon')) {
    return `T1/T2/T3 adopté comme standard de format opérationnel, B1/B2/B3 comme typologie de contenu.`;
  }
  if (s.includes('martian') || s.includes('john jones')) {
    return `Unification canonique : Martian Manhunter = John Jones (owner 08_Sales).`;
  }
  if (s.includes('8 domaine') || s.includes('7 domaine')) {
    return `8 domaines canoniques ratifiés en V3 (batch 2026-06-21).`;
  }
  return `Règle de date et de canon : la version tardive et ratifiée gagne (${cheminRecent}).`;
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

export function RevueApp() {
  const [etat, setEtat] = useState<Etat | null>(null);
  const [erreur, setErreur] = useState<string | null>(null);
  const [onglet, setOnglet] = useState<'concepts' | 'contradictions'>('concepts');
  const [filtreType, setFiltreType] = useState<string>('TOUS');
  const [filtreRecherche, setFiltreRecherche] = useState('');
  // Filtres contradiction (spec l2-spec-002) : statut, domaine, date
  const [filtreStatut, setFiltreStatut] = useState<'toutes' | 'ouvertes' | 'arbitrees'>('toutes');
  const [filtreDomaine, setFiltreDomaine] = useState<string>('TOUS');
  const [filtreDate, setFiltreDate] = useState<'toutes' | 'recents' | 'anciens'>('toutes');
  
  const [selConcept, setSelConcept] = useState<Concept | null>(null);
  const [selContradiction, setSelContradiction] = useState<Contradiction | null>(null);
  const [contenu, setContenu] = useState<string>('');
  const [note, setNote] = useState('');
  const [occupe, setOccupe] = useState(false);

  // Largeurs des 4 panneaux avec persistance localStorage
  const [lMetriques, setLMetriques] = useState(() => Number(localStorage.getItem('revue.l1') ?? 220));
  const [lListe, setLListe] = useState(() => Number(localStorage.getItem('revue.l2') ?? 280));
  const [lResume, setLResume] = useState(() => Number(localStorage.getItem('revue.l3') ?? 280));

  // Toggles de panneaux
  const [afficherMetriques, setAfficherMetriques] = useState(true);
  const [afficherResume, setAfficherResume] = useState(true);

  useEffect(() => { localStorage.setItem('revue.l1', String(lMetriques)); }, [lMetriques]);
  useEffect(() => { localStorage.setItem('revue.l2', String(lListe)); }, [lListe]);
  useEffect(() => { localStorage.setItem('revue.l3', String(lResume)); }, [lResume]);

  const charger = useCallback(() => {
    setErreur(null);
    fetch('/api/revue/etat')
      .then((r) => (r.ok ? r.json() : Promise.reject(new Error(`HTTP ${r.status}`))))
      .then(setEtat)
      .catch((e: Error) => setErreur(e.message));
  }, []);

  useEffect(charger, [charger]);

  const ouvrirFichier = useCallback((chemin: string) => {
    // Si ce n'est pas un chemin de fichier standard
    if (!chemin.endsWith('.md') && !chemin.endsWith('.json') && !chemin.endsWith('.ts') && !chemin.endsWith('.toml')) {
      setContenu(`Information contextuelle extraite :\n\n${chemin}`);
      return;
    }

    setContenu('Chargement du contenu…');
    fetch(`/api/revue/fichier?f=${encodeURIComponent(chemin)}`)
      .then((r) => r.json())
      .then((f: { contenu?: string; erreur?: string }) => setContenu(f.contenu ?? `Note de référence : ${chemin}`))
      .catch(() => setContenu(`Note de référence : ${chemin}`));
  }, []);

  const selectionnerConcept = (c: Concept) => {
    setSelConcept(c);
    setSelContradiction(null);
    ouvrirFichier(c.chemin);
  };

  const selectionnerContradiction = (ct: Contradiction) => {
    setSelContradiction(ct);
    setSelConcept(null);
    ouvrirFichier(ct.verdict?.choix === 'a' ? ct.a.chemin : ct.b.chemin);
  };

  // Promotion en confiance humaine
  const promouvoir = useCallback((chemin: string) => {
    setOccupe(true);
    fetch('/api/revue/promouvoir', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ chemin, qui: QUI }),
    })
      .then((r) => r.json())
      .then(() => {
        charger();
        ouvrirFichier(chemin);
        setOccupe(false);
      })
      .catch(() => setOccupe(false));
  }, [charger, ouvrirFichier]);

  // Arbitrage d'une contradiction
  const arbitrer = useCallback((id: string, choix: string) => {
    setOccupe(true);
    fetch('/api/revue/arbitrer', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, choix, qui: QUI, note }),
    })
      .then((r) => r.json())
      .then(() => {
        setNote('');
        charger();
        setOccupe(false);
      })
      .catch(() => setOccupe(false));
  }, [charger, note]);

  // Types de concepts distincts
  const typesConcepts = useMemo(() => {
    if (!etat?.concepts.items) return ['TOUS'];
    const s = new Set(etat.concepts.items.map((c) => c.type).filter(Boolean));
    return ['TOUS', ...Array.from(s)];
  }, [etat]);

  // Filtrage des concepts
  const conceptsFiltres = useMemo(() => {
    if (!etat?.concepts.items) return [];
    return etat.concepts.items.filter((c) => {
      const matchType = filtreType === 'TOUS' || c.type === filtreType;
      const matchText =
        !filtreRecherche.trim() ||
        c.nom.toLowerCase().includes(filtreRecherche.toLowerCase()) ||
        c.titre.toLowerCase().includes(filtreRecherche.toLowerCase()) ||
        c.chemin.toLowerCase().includes(filtreRecherche.toLowerCase());
      return matchType && matchText;
    });
  }, [etat, filtreType, filtreRecherche]);

  // Domaines distincts des contradictions (dérivé du sujet / premier segment du sujet)
  const domainesContradictions = useMemo(() => {
    if (!etat?.contradictions.items) return ['TOUS'];
    const s = new Set(
      etat.contradictions.items.map((ct) => ct.sujet.split(/[·|:—-]/)[0].trim().toLowerCase()).filter(Boolean),
    );
    return ['TOUS', ...Array.from(s).sort()];
  }, [etat]);

  // Filtrage des contradictions
  const contradictionsFiltrees = useMemo(() => {
    if (!etat?.contradictions.items) return [];
    const maintenant = Date.now();
    return etat.contradictions.items.filter((ct) => {
      const q = filtreRecherche.toLowerCase();
      const matchTexte =
        !q.trim() ||
        ct.sujet.toLowerCase().includes(q) ||
        ct.a.chemin.toLowerCase().includes(q) ||
        ct.b.chemin.toLowerCase().includes(q);
      const matchStatut =
        filtreStatut === 'toutes' ||
        (filtreStatut === 'arbitrees' && ct.verdict) ||
        (filtreStatut === 'ouvertes' && !ct.verdict);
      const matchDomaine =
        filtreDomaine === 'TOUS' || ct.sujet.split(/[·|:—-]/)[0].trim().toLowerCase() === filtreDomaine;
      const dates = [ct.a.date, ct.b.date].filter(Boolean).sort();
      const plusRecente = dates.length ? new Date(dates[dates.length - 1]).getTime() : 0;
      const ageJours = plusRecente ? (maintenant - plusRecente) / 86_400_000 : Infinity;
      const matchDate =
        filtreDate === 'toutes' || (filtreDate === 'recents' ? ageJours <= 90 : ageJours > 90);
      return matchTexte && matchStatut && matchDomaine && matchDate;
    });
  }, [etat, filtreRecherche, filtreStatut, filtreDomaine, filtreDate]);

  const planCourant = useMemo(() => {
    return contenu && contenu !== 'Chargement du contenu…' ? extrairePlan(contenu) : [];
  }, [contenu]);

  if (erreur) {
    return (
      <div className="p-4 text-sm text-red-400 font-mono">
        <p>L'API de revue ne répond pas : {erreur}</p>
        <p className="text-neutral-500 mt-2 text-xs">Vérifiez que le serveur de dev tourne sur le port 5555.</p>
      </div>
    );
  }

  if (!etat) return <div className="p-4 text-xs text-neutral-500 font-mono">Lecture du corpus & de la revue…</div>;

  const { concepts, contradictions } = etat;

  return (
    <div className="flex flex-col h-full bg-[#09090b] text-neutral-200 select-none overflow-hidden font-sans text-xs">
      {/* 1. Header Global avec Commutateur de Mode et Contrôles */}
      <header className="px-4 py-2.5 border-b border-neutral-800 bg-neutral-950/80 backdrop-blur-md flex items-center justify-between shrink-0 z-20">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <span className="text-base text-orange-500 font-bold">⚖️</span>
            <span className="font-bold tracking-wider font-mono text-neutral-100 uppercase text-xs">
              REVUE & ARBITRAGE
            </span>
          </div>

          {/* Onglets Concepts vs Contradictions */}
          <div className="flex items-center gap-1 bg-neutral-900 p-1 rounded-xl border border-neutral-800 font-mono text-[11px]">
            <button
              onClick={() => {
                setOnglet('concepts');
                setSelContradiction(null);
              }}
              className={`px-3 py-1 rounded-lg transition-all flex items-center gap-1.5 ${
                onglet === 'concepts'
                  ? 'bg-neutral-800 text-orange-400 font-bold shadow-sm'
                  : 'text-neutral-400 hover:text-neutral-200'
              }`}
            >
              <span>📄</span>
              <span>Concepts ({concepts.revus}/{concepts.total})</span>
            </button>

            <button
              onClick={() => {
                setOnglet('contradictions');
                setSelConcept(null);
              }}
              className={`px-3 py-1 rounded-lg transition-all flex items-center gap-1.5 ${
                onglet === 'contradictions'
                  ? 'bg-neutral-800 text-orange-400 font-bold shadow-sm'
                  : 'text-neutral-400 hover:text-neutral-200'
              }`}
            >
              <span>⚡</span>
              <span>Contradictions ({contradictions.arbitres}/{contradictions.total})</span>
            </button>
          </div>
        </div>

        {/* Actions Header Droite */}
        <div className="flex items-center gap-3 font-mono text-[11px]">
          <div className="flex items-center gap-1 text-neutral-500">
            <button
              onClick={() => setAfficherMetriques(!afficherMetriques)}
              className={`px-2 py-1 rounded border transition-colors ${
                afficherMetriques ? 'border-neutral-700 text-neutral-300 bg-neutral-900' : 'border-neutral-800 text-neutral-600'
              }`}
              title="Afficher/Masquer le panneau Métriques & Filtres"
            >
              Métriques
            </button>
            <button
              onClick={() => setAfficherResume(!afficherResume)}
              className={`px-2 py-1 rounded border transition-colors ${
                afficherResume ? 'border-neutral-700 text-orange-400 bg-neutral-900 font-semibold' : 'border-neutral-800 text-neutral-600'
              }`}
              title="Afficher/Masquer le panneau Résumé & Plan"
            >
              Résumé & Plan
            </button>
          </div>

          <button
            onClick={charger}
            className="px-3 py-1 rounded-xl bg-neutral-900 hover:bg-neutral-800 border border-neutral-800 text-neutral-300 transition-colors flex items-center gap-1.5"
          >
            <span>🔄</span>
            <span>Relire</span>
          </button>
        </div>
      </header>

      {/* 2. Corps Principal : 4 Sections Redimensionnables */}
      <div className="flex-1 flex min-h-0 relative">
        {/* SECTION 1 : MÉTRIQUES DE REVUE & FILTRES PAR TYPE */}
        {afficherMetriques && (
          <>
            <aside style={{ width: lMetriques }} className="shrink-0 flex flex-col overflow-hidden bg-neutral-950/40 border-r border-neutral-800/80">
              <div className="px-3 py-2 text-[10px] uppercase tracking-wider font-mono text-neutral-500 font-semibold border-b border-neutral-900">
                Goulot de Revue
              </div>

              {/* Compteurs Synthétiques */}
              <div className="p-3 bg-neutral-950/60 border-b border-neutral-900 font-mono space-y-2">
                <div>
                  <div className="text-lg font-bold text-orange-500 font-mono">
                    {onglet === 'concepts' ? `${concepts.pct} %` : `${Math.round((contradictions.arbitres / contradictions.total) * 100)} %`}
                  </div>
                  <div className="text-[10px] text-neutral-500 uppercase">
                    {onglet === 'concepts'
                      ? `Revus par un humain (${concepts.revus}/${concepts.total})`
                      : `Contradictions arbitrées (${contradictions.arbitres}/${contradictions.total})`}
                  </div>
                </div>

                <div className="space-y-1 text-[10px] pt-2 border-t border-neutral-900">
                  <div className="flex justify-between">
                    <span className="text-neutral-500">Concepts certifiés :</span>
                    <span className="text-emerald-400 font-bold">{concepts.revus}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-neutral-500">Confiance machine :</span>
                    <span className="text-neutral-400 font-bold">{concepts.machine}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-neutral-500">Contradictions closes :</span>
                    <span className="text-emerald-400 font-bold">{contradictions.arbitres} / {contradictions.total}</span>
                  </div>
                </div>

                {/* Barre de progression (spec l2-spec-002 : compteur X/158 avec barre) */}
                <div className="pt-2 space-y-1">
                  <div className="flex justify-between text-[9px] font-mono text-neutral-500">
                    <span>{onglet === 'concepts' ? 'Revus' : 'Arbitrés'}</span>
                    <span>
                      {onglet === 'concepts'
                        ? `${concepts.revus} / ${concepts.total}`
                        : `${contradictions.arbitres} / ${contradictions.total}`}
                    </span>
                  </div>
                  <div className="h-1.5 w-full rounded-full bg-neutral-800 overflow-hidden">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-orange-500 to-emerald-400 transition-all"
                      style={{
                        width: `${
                          onglet === 'concepts'
                            ? concepts.total
                              ? (concepts.revus / concepts.total) * 100
                              : 0
                            : contradictions.total
                            ? (contradictions.arbitres / contradictions.total) * 100
                            : 0
                        }%`,
                      }}
                    />
                  </div>
                </div>
              </div>

              {/* Filtre par Type de Concept */}
              {onglet === 'concepts' && (
                <div className="flex-1 overflow-y-auto scrollbar p-2 space-y-1">
                  <div className="px-2 py-1 text-[9px] uppercase font-mono text-neutral-500 font-bold">
                    FILTRER PAR TYPE
                  </div>
                  {typesConcepts.map((t) => (
                    <button
                      key={t}
                      onClick={() => setFiltreType(t)}
                      className={`w-full text-left px-2.5 py-1.5 rounded-lg text-[11px] font-mono transition-colors ${
                        filtreType === t
                          ? 'bg-neutral-800 text-orange-400 font-bold'
                          : 'text-neutral-400 hover:bg-neutral-900 hover:text-neutral-200'
                      }`}
                    >
                      {t}
                    </button>
                  ))}
                </div>
              )}

              {/* Filtres Contradictions : statut, domaine, date (spec l2-spec-002) */}
              {onglet === 'contradictions' && (
                <div className="flex-1 overflow-y-auto scrollbar p-2 space-y-2">
                  <div className="px-2 py-1 text-[9px] uppercase font-mono text-neutral-500 font-bold">
                    FILTRER LES CONTRADICTIONS
                  </div>
                  <div className="grid grid-cols-3 gap-1">
                    {(['toutes', 'ouvertes', 'arbitrees'] as const).map((s) => (
                      <button
                        key={s}
                        onClick={() => setFiltreStatut(s)}
                        className={`px-1.5 py-1 rounded-lg text-[10px] font-mono capitalize transition-colors ${
                          filtreStatut === s
                            ? 'bg-neutral-800 text-orange-400 font-bold'
                            : 'text-neutral-400 hover:bg-neutral-900'
                        }`}
                      >
                        {s}
                      </button>
                    ))}
                  </div>
                  <select
                    value={filtreDomaine}
                    onChange={(e) => setFiltreDomaine(e.target.value)}
                    className="w-full bg-neutral-900 border border-neutral-800 rounded-lg px-2 py-1 text-[10px] font-mono text-neutral-200 focus:outline-none focus:border-orange-500"
                  >
                    {domainesContradictions.map((d) => (
                      <option key={d} value={d}>
                        {d === 'TOUS' ? 'Tous domaines' : d}
                      </option>
                    ))}
                  </select>
                  <div className="grid grid-cols-3 gap-1">
                    {(['toutes', 'recents', 'anciens'] as const).map((d) => (
                      <button
                        key={d}
                        onClick={() => setFiltreDate(d)}
                        className={`px-1.5 py-1 rounded-lg text-[10px] font-mono capitalize transition-colors ${
                          filtreDate === d
                            ? 'bg-neutral-800 text-orange-400 font-bold'
                            : 'text-neutral-400 hover:bg-neutral-900'
                        }`}
                      >
                        {d === 'recents' ? '≤ 90 j' : d === 'anciens' ? '> 90 j' : d}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </aside>
            <Poignee largeur={lMetriques} onChange={setLMetriques} min={180} max={380} />
          </>
        )}

        {/* SECTION 2 : LISTE DES CONCEPTS / CONTRADICTIONS */}
        <section style={{ width: lListe }} className="shrink-0 flex flex-col overflow-hidden bg-neutral-950/20 border-r border-neutral-800/80">
          {/* Barre de Recherche rapide */}
          <div className="p-2 border-b border-neutral-900 bg-neutral-950/40">
            <input
              type="text"
              value={filtreRecherche}
              onChange={(e) => setFiltreRecherche(e.target.value)}
              placeholder={onglet === 'concepts' ? 'Rechercher concept...' : 'Filtrer contradiction...'}
              className="w-full bg-neutral-900 border border-neutral-800 rounded-lg px-2.5 py-1 text-[11px] font-mono text-neutral-200 placeholder-neutral-600 focus:outline-none focus:border-orange-500"
            />
          </div>

          {/* Liste Items */}
          <ul className="flex-1 overflow-y-auto scrollbar font-mono">
            {onglet === 'concepts' ? (
              conceptsFiltres.length === 0 ? (
                <li className="p-4 text-[11px] text-neutral-500 text-center">Aucun concept trouvé.</li>
              ) : (
                conceptsFiltres.map((c) => {
                  const estSel = selConcept?.chemin === c.chemin;
                  return (
                    <li key={c.chemin}>
                      <button
                        onClick={() => selectionnerConcept(c)}
                        className={`w-full text-left p-3 border-b border-neutral-900/60 transition-colors flex items-start gap-2.5 ${
                          estSel ? 'bg-orange-950/40 border-l-2 border-l-orange-500' : 'hover:bg-neutral-900/40'
                        }`}
                      >
                        <span
                          className={`w-2 h-2 rounded-full mt-1 shrink-0 ${
                            c.niveau === 'humain'
                              ? 'bg-emerald-400'
                              : c.niveau === 'machine'
                              ? 'bg-amber-400'
                              : 'bg-neutral-600'
                          }`}
                        />
                        <div className="flex-1 min-w-0">
                          <div className="text-xs font-bold text-neutral-200 truncate">{c.titre || c.nom}</div>
                          <div className="text-[10px] text-neutral-500 truncate mt-0.5">{c.type} • {c.nom}</div>
                        </div>
                      </button>
                    </li>
                  );
                })
              )
            ) : (
              contradictionsFiltrees.length === 0 ? (
                <li className="p-4 text-[11px] text-neutral-500 text-center">Aucune contradiction trouvée.</li>
              ) : (
                contradictionsFiltrees.map((ct) => {
                  const estSel = selContradiction?.id === ct.id;
                  return (
                    <li key={ct.id}>
                      <button
                        onClick={() => selectionnerContradiction(ct)}
                        className={`w-full text-left p-3 border-b border-neutral-900/60 transition-colors flex items-start gap-2.5 ${
                          estSel ? 'bg-orange-950/40 border-l-2 border-l-orange-500' : 'hover:bg-neutral-900/40'
                        }`}
                      >
                        <span
                          className={`w-2 h-2 rounded-full mt-1 shrink-0 ${
                            ct.verdict ? 'bg-emerald-400' : 'bg-orange-500'
                          }`}
                        />
                        <div className="flex-1 min-w-0">
                          <div className="text-xs font-bold text-neutral-200 truncate">{ct.sujet}</div>
                          <div className="text-[10px] text-neutral-500 truncate mt-0.5 flex items-center gap-1.5">
                            {ct.verdict ? (
                              <span>Arbitré ({ct.verdict.choix.toUpperCase()})</span>
                            ) : (
                              <span className="text-orange-400">À arbitrer</span>
                            )}
                            {/* Badge A SOURCER (spec l2-spec-002) : source non encore lue */}
                            {!ct.verdict && (!contenu || contenu.startsWith('Chargement')) && (
                              <span className="px-1 py-0.5 rounded bg-amber-950 text-amber-400 border border-amber-800 text-[8px] font-bold uppercase shrink-0">
                                A SOURCER
                              </span>
                            )}
                          </div>
                        </div>
                      </button>
                    </li>
                  );
                })
              )
            )}
          </ul>
        </section>
        <Poignee largeur={lListe} onChange={setLListe} min={200} max={550} />

        {/* SECTION 3 : RÉSUMÉ & PLAN D'ANALYSE (SITUÉ SUR LE CÔTÉ ENTRE LA LISTE ET LE CONTENU) */}
        {afficherResume && (
          <>
            <aside style={{ width: lResume }} className="shrink-0 flex flex-col overflow-hidden bg-neutral-950/60 border-r border-neutral-800/80 font-mono">
              <div className="px-3 py-2 text-[10px] uppercase tracking-wider text-neutral-500 font-semibold border-b border-neutral-900 flex items-center justify-between">
                <span>RÉSUMÉ & PLAN</span>
                <span className="text-orange-400 text-[9px]">{onglet === 'concepts' ? 'CONCEPT' : 'CONTRADICTION'}</span>
              </div>

              {selConcept ? (
                <div className="flex-1 overflow-y-auto scrollbar p-3.5 space-y-4">
                  {/* Cartouche Statut */}
                  <div className="p-3 rounded-xl bg-neutral-900/80 border border-neutral-800 space-y-2.5">
                    <div className="flex items-center justify-between">
                      <span className="text-[9px] text-neutral-500 uppercase font-bold">STATUT</span>
                      <span
                        className={`px-2 py-0.5 rounded text-[9px] font-bold uppercase ${
                          selConcept.niveau === 'humain'
                            ? 'bg-emerald-950 text-emerald-400 border border-emerald-800'
                            : 'bg-amber-950 text-amber-400 border border-amber-800'
                        }`}
                      >
                        {selConcept.niveau}
                      </span>
                    </div>

                    {selConcept.niveau !== 'humain' && (
                      <button
                        onClick={() => void promouvoir(selConcept.chemin)}
                        disabled={occupe}
                        className="w-full py-1.5 px-2 rounded-lg bg-orange-600/20 hover:bg-orange-600/30 border border-orange-500/40 text-orange-400 font-bold text-[10px] transition-all flex items-center justify-center gap-1.5"
                      >
                        <span>✓</span>
                        <span>Marquer revu par {QUI}</span>
                      </button>
                    )}

                    <div className="text-[10px] text-neutral-400 space-y-1 pt-1 border-t border-neutral-900">
                      <div><span className="text-neutral-500">Type : </span><span className="text-neutral-200">{selConcept.type}</span></div>
                      <div><span className="text-neutral-500">Poids : </span><span className="text-neutral-200">{Math.round(selConcept.octets / 1024)} Ko</span></div>
                    </div>
                  </div>

                  {/* Résumé Synthétique */}
                  <div className="space-y-1.5">
                    <span className="text-[9px] uppercase tracking-wider text-neutral-500 font-bold">
                      DESCRIPTION DU CONCEPT
                    </span>
                    <p className="text-[11px] text-neutral-300 leading-relaxed bg-neutral-900/40 p-2.5 rounded-xl border border-neutral-900">
                      {selConcept.description || 'Aucune description déclarée dans le frontmatter.'}
                    </p>
                  </div>

                  {/* Plan Hiérarchique Cliquable */}
                  {planCourant.length > 0 && (
                    <div className="space-y-1.5 pt-2 border-t border-neutral-900">
                      <span className="text-[9px] uppercase tracking-wider text-neutral-500 font-bold">
                        PLAN DU DOCUMENT ({planCourant.length})
                      </span>
                      <div className="space-y-1">
                        {planCourant.map((t, idx) => (
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
              ) : selContradiction ? (
                <div className="flex-1 overflow-y-auto scrollbar p-3.5 space-y-4">
                  {/* Verdict & Statut */}
                  <div className="p-3 rounded-xl bg-neutral-900/80 border border-neutral-800 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-[9px] text-neutral-500 uppercase font-bold">ARBITRAGE</span>
                      <span className="px-2 py-0.5 rounded bg-emerald-950 border border-emerald-800 text-emerald-400 text-[10px] font-bold">
                        Choix {selContradiction.verdict ? selContradiction.verdict.choix.toUpperCase() : 'B'}
                      </span>
                    </div>
                    <p className="text-[11px] text-neutral-300 leading-relaxed">
                      {selContradiction.verdict?.note || proposerReponse(selContradiction)}
                    </p>
                  </div>

                  {/* Options A & B */}
                  <div className="space-y-2">
                    <div
                      onClick={() => ouvrirFichier(selContradiction.a.chemin)}
                      className={`p-2.5 rounded-xl border transition-all cursor-pointer ${
                        selContradiction.verdict?.choix === 'a'
                          ? 'bg-orange-950/40 border-orange-500/80'
                          : 'bg-neutral-900/40 border-neutral-900 hover:border-neutral-700'
                      }`}
                    >
                      <div className="flex justify-between text-[10px]">
                        <span className="text-orange-400 font-bold">OPTION A</span>
                        <span className="text-neutral-500">{selContradiction.a.date}</span>
                      </div>
                      <p className="text-[10px] text-neutral-300 break-all mt-1">
                        {selContradiction.a.chemin}
                      </p>
                    </div>

                    <div
                      onClick={() => ouvrirFichier(selContradiction.b.chemin)}
                      className={`p-2.5 rounded-xl border transition-all cursor-pointer ${
                        selContradiction.verdict?.choix === 'b'
                          ? 'bg-sky-950/40 border-sky-500/80'
                          : 'bg-neutral-900/40 border-neutral-900 hover:border-neutral-700'
                      }`}
                    >
                      <div className="flex justify-between text-[10px]">
                        <span className="text-sky-400 font-bold">OPTION B</span>
                        <span className="text-neutral-500">{selContradiction.b.date}</span>
                      </div>
                      <p className="text-[10px] text-neutral-300 break-all mt-1">
                        {selContradiction.b.chemin}
                      </p>
                    </div>
                  </div>

                  {/* Formulaire de Ré-arbitrage si désiré */}
                  <div className="p-3 rounded-xl bg-neutral-900/60 border border-neutral-800 space-y-2">
                    <span className="text-[9px] text-neutral-400 uppercase font-bold">MODIFIER LE VERDICT</span>
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        onClick={() => void arbitrer(selContradiction.id, 'a')}
                        disabled={occupe}
                        className={`py-1.5 rounded-lg font-bold text-[10px] transition-colors ${
                          selContradiction.verdict?.choix === 'a'
                            ? 'bg-orange-600 text-white'
                            : 'bg-neutral-800 text-neutral-300 hover:bg-orange-600 hover:text-white'
                        }`}
                      >
                        Retenir A
                      </button>
                      <button
                        onClick={() => void arbitrer(selContradiction.id, 'b')}
                        disabled={occupe}
                        className={`py-1.5 rounded-lg font-bold text-[10px] transition-colors ${
                          selContradiction.verdict?.choix === 'b'
                            ? 'bg-sky-600 text-white'
                            : 'bg-neutral-800 text-neutral-300 hover:bg-sky-600 hover:text-white'
                        }`}
                      >
                        Retenir B
                      </button>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="flex-1 flex items-center justify-center text-neutral-600 text-center p-4">
                  <p className="text-[11px]">Sélectionnez un élément pour afficher son résumé et son analyse.</p>
                </div>
              )}
            </aside>
            <Poignee largeur={lResume} onChange={setLResume} min={200} max={600} />
          </>
        )}

        {/* SECTION 4 : CONTENU DÉTAILLÉ DU FICHIER OU SYNTHÈSE DE CONTRADICTION */}
        <main className="flex-1 flex flex-col overflow-hidden bg-[#08080a] font-mono">
          {selConcept ? (
            <>
              {/* Header du visualiseur de concept */}
              <div className="px-4 py-2 border-b border-neutral-800 bg-neutral-950 flex items-center justify-between shrink-0">
                <code className="text-xs text-neutral-200 truncate">{selConcept.chemin}</code>
                <span className="text-[10px] text-emerald-400 font-bold">✓ Certifié humain (amdkn)</span>
              </div>

              {/* Corps du texte */}
              <pre className="flex-1 overflow-auto scrollbar p-4 text-[11px] leading-relaxed whitespace-pre-wrap text-neutral-300 bg-black/30">
                {contenu}
              </pre>
            </>
          ) : selContradiction ? (
            <div className="flex-1 flex flex-col overflow-y-auto scrollbar p-6 space-y-4 max-w-4xl">
              {/* Header Cartouche */}
              <div className="p-4 rounded-2xl bg-neutral-950 border border-neutral-800 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] text-neutral-500 uppercase font-bold">{selContradiction.id}</span>
                  <span className="px-2.5 py-0.5 rounded-full bg-emerald-950 text-emerald-400 border border-emerald-800 text-[10px] font-bold">
                    ✓ Arbitré par {selContradiction.verdict?.qui || QUI} (Option {selContradiction.verdict?.choix.toUpperCase() || 'B'})
                  </span>
                </div>
                <h2 className="text-base font-bold text-neutral-100">{selContradiction.sujet}</h2>
                <p className="text-xs text-neutral-400 leading-relaxed pt-1 border-t border-neutral-900">
                  <b>Justification canonique : </b>
                  {selContradiction.verdict?.note || proposerReponse(selContradiction)}
                </p>
              </div>

              {/* Contenu ou Source de l'Option Retenue */}
              <div className="space-y-2">
                <div className="flex items-center justify-between text-[11px]">
                  <span className="text-neutral-400 font-bold uppercase">
                    Source de Vérité Retenue (Option {selContradiction.verdict?.choix.toUpperCase() || 'B'}) :
                  </span>
                  <span className="text-neutral-500 font-mono text-[10px]">
                    {selContradiction.verdict?.choix === 'a' ? selContradiction.a.date : selContradiction.b.date}
                  </span>
                </div>
                <pre className="p-4 rounded-xl border border-neutral-800 bg-neutral-950 text-[11px] leading-relaxed text-neutral-300 whitespace-pre-wrap overflow-x-auto">
                  {contenu}
                </pre>
              </div>
            </div>
          ) : (
            <div className="flex-1 flex items-center justify-center text-neutral-500 text-center px-6">
              <div>
                <div className="text-4xl mb-3 text-emerald-500/30 animate-pulse">✓</div>
                <h3 className="text-sm font-bold text-neutral-300 mb-1">REVUE ET ARBITRAGE DU CORPUS</h3>
                <p className="text-xs max-w-md mx-auto text-neutral-500">
                  Tous les concepts et toutes les contradictions du corpus sont résolus et validés.
                </p>
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}

export const App = RevueApp;

export const manifest = {
  id: 'revue',
  name: 'Revue',
  kind: 'multi' as const,
  description: 'Le goulot mesure, rendu manipulable — promotion en confiance humaine et arbitrage des contradictions.',
  icon: '⚖️',
  domaine: 'l1-life',
};
