/**
 * Revue — le goulot mesure, rendu manipulable.
 *
 * POURQUOI CETTE APP EXISTE
 * Deux chiffres, tous deux mesures :
 *   - 2 concepts sur 26 sont revus par un humain. 8 %. Le reste est en
 *     `confiance: machine` -- vrai jusqu'a preuve du contraire, et personne
 *     n'a apporte la preuve.
 *   - 204 contradictions cataloguees le 2026-08-13, zero arbitree. 127 d'entre
 *     elles se trancheraient par la seule regle de date du proprietaire.
 *
 * Produire davantage n'aide plus : le goulot est la verification. Il n'etait
 * pas manipulable, donc rien ne bougeait. C'est la seule chose que cette app
 * change.
 *
 * LA PORTE QU'ELLE NE FRANCHIT PAS SEULE
 * Promouvoir en `humain` et arbitrer une contradiction sont des gestes du
 * PROPRIETAIRE. L'app les rend possibles en deux clics ; elle ne les fait
 * jamais a sa place, et chaque ecriture porte son identifiant.
 */

import { useCallback, useEffect, useMemo, useState } from 'react';

interface Concept {
  nom: string; chemin: string; type: string; titre: string; description: string;
  niveau: 'non verifie' | 'machine' | 'humain';
  a_sourcer: number; octets: number; modifie: string;
}
interface Cote { chemin: string; date: string }
interface Contradiction {
  id: string; sujet: string; a: Cote; b: Cote;
  suggestion: 'a' | 'b' | string | null;
  verdict: { choix: string; qui: string; note: string; a: string } | null;
}
interface Etat {
  lu_a: string;
  concepts: {
    total: number; metaExclus: number; revus: number; machine: number;
    non_verifies: number; pct: number; items: Concept[];
  };
  contradictions: { genere: string; total: number; arbitres: number; items: Contradiction[] };
}

/** Le propriétaire. C'est l'identifiant écrit dans `verified:` — jamais
 *  « machine », jamais anonyme : un `human:` non attribuable ferait passer du
 *  supposé pour du mesuré, et c'est D2 qui s'effondre. */
const QUI = 'amdkn';

const court = (p: string, n = 58) =>
  p.length <= n ? p : '…' + p.slice(-(n - 1));

export function RevueApp() {
  const [etat, setEtat] = useState<Etat | null>(null);
  const [erreur, setErreur] = useState<string | null>(null);
  const [onglet, setOnglet] = useState<'concepts' | 'contradictions'>('concepts');
  const [sel, setSel] = useState<string | null>(null);
  const [contenu, setContenu] = useState<string>('');
  const [note, setNote] = useState('');
  const [occupe, setOccupe] = useState(false);

  const charger = useCallback(() => {
    setErreur(null);
    fetch('/api/revue/etat')
      .then((r) => (r.ok ? r.json() : Promise.reject(new Error(`HTTP ${r.status}`))))
      .then(setEtat)
      .catch((e: Error) => setErreur(e.message));
  }, []);

  useEffect(charger, [charger]);

  const ouvrir = useCallback((chemin: string) => {
    setSel(chemin);
    setContenu('…');
    fetch(`/api/revue/fichier?f=${encodeURIComponent(chemin)}`)
      .then((r) => r.json())
      .then((f: { contenu?: string; erreur?: string }) =>
        setContenu(f.contenu ?? `illisible : ${f.erreur}`))
      .catch((e: Error) => setContenu(e.message));
  }, []);

  /** Le geste que rien ne permettait. Il écrit dans le fichier réel, avec
   *  l'identifiant du propriétaire et l'horodatage. */
  const promouvoir = useCallback((chemin: string) => {
    setOccupe(true);
    fetch('/api/revue/promouvoir', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ chemin, qui: QUI }),
    }).then((r) => r.json()).then(() => { charger(); setOccupe(false); })
      .catch(() => setOccupe(false));
  }, [charger]);

  const arbitrer = useCallback((id: string, choix: string) => {
    setOccupe(true);
    fetch('/api/revue/arbitrer', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, choix, qui: QUI, note }),
    }).then((r) => r.json()).then(() => { setNote(''); charger(); setOccupe(false); })
      .catch(() => setOccupe(false));
  }, [charger, note]);

  const suggerables = useMemo(
    () => etat?.contradictions.items.filter(
      (c) => !c.verdict && (c.suggestion === 'a' || c.suggestion === 'b')).length ?? 0,
    [etat]);

  if (erreur) {
    return (
      <div className="p-4 text-sm text-red-400">
        <p>L&apos;API de revue ne répond pas : {erreur}</p>
        <p className="text-neutral-500 mt-2 text-xs">
          Servie par <code>tools/revue-api.ts</code>.
        </p>
      </div>
    );
  }
  if (!etat) return <div className="p-4 text-sm text-neutral-500">Lecture du corpus…</div>;

  const { concepts, contradictions } = etat;

  return (
    <div className="h-full flex flex-col bg-neutral-950 text-neutral-300 text-[13px]
                    [&_*::-webkit-scrollbar]:w-1.5 [&_*::-webkit-scrollbar-thumb]:bg-neutral-800
                    [&_*::-webkit-scrollbar-track]:bg-transparent
                    [&_*::-webkit-scrollbar-thumb]:rounded">
      <div className="px-4 py-2 border-b border-neutral-900 flex items-center gap-3 shrink-0">
        <h1 className="text-sm text-neutral-200">Revue</h1>
        <div className="flex gap-1">
          {(['concepts', 'contradictions'] as const).map((o) => (
            <button key={o} onClick={() => { setOnglet(o); setSel(null); }}
              className={`text-[11px] px-2 py-0.5 rounded border ${
                onglet === o ? 'border-orange-700 text-orange-400'
                             : 'border-neutral-800 text-neutral-500 hover:border-neutral-600'}`}>
              {o === 'concepts'
                ? `Concepts ${concepts.revus}/${concepts.total}`
                : `Contradictions ${contradictions.arbitres}/${contradictions.total}`}
            </button>
          ))}
        </div>
        <span className="text-[11px] text-neutral-600 flex-1 truncate">
          lu à {new Date(etat.lu_a).toLocaleTimeString('fr-FR')}
        </span>
        <button onClick={charger}
          className="text-[11px] px-2 py-0.5 rounded border border-neutral-800 hover:border-neutral-600">
          relire
        </button>
      </div>

      {onglet === 'concepts' ? (
        <div className="flex-1 min-h-0 flex">
          <div className="w-[24rem] shrink-0 border-r border-neutral-900 overflow-auto">
            <div className="px-3 py-2 border-b border-neutral-900">
              <div className="text-[11px] text-neutral-500 leading-snug">
                <b className="text-orange-500">{concepts.pct} %</b> revus par un humain
                ({concepts.revus}/{concepts.total}) · {concepts.machine} en{' '}
                <b>machine</b>.
                <span className="text-neutral-600"> {concepts.metaExclus} fichiers de
                doc du format exclus du compte — les inclure gonflerait le taux.</span>
              </div>
            </div>
            <ul>
              {concepts.items.map((c) => (
                <li key={c.chemin}>
                  <button onClick={() => ouvrir(c.chemin)}
                    className={`w-full text-left px-3 py-1.5 border-b border-neutral-900/60
                                hover:bg-neutral-900 ${sel === c.chemin ? 'bg-neutral-900' : ''}`}>
                    <div className="flex items-center gap-2">
                      <span className={c.niveau === 'humain' ? 'text-green-500'
                        : c.niveau === 'machine' ? 'text-orange-500/70' : 'text-red-500'}>●</span>
                      <span className="flex-1 truncate text-neutral-200 text-xs">{c.nom}</span>
                      {c.a_sourcer > 0 &&
                        <span className="text-[9px] text-amber-500 shrink-0">
                          {c.a_sourcer} À SOURCER</span>}
                    </div>
                    <div className="text-[10px] text-neutral-600 truncate pl-4">
                      {c.type} · {(c.octets / 1024).toFixed(0)} Ko
                    </div>
                  </button>
                </li>
              ))}
            </ul>
          </div>

          <div className="flex-1 min-w-0 flex flex-col">
            {sel ? (
              <>
                <div className="px-3 py-2 border-b border-neutral-900 flex items-center gap-2">
                  <span className="text-xs text-neutral-400 truncate flex-1">{court(sel, 70)}</span>
                  {concepts.items.find((c) => c.chemin === sel)?.niveau === 'humain' ? (
                    <span className="text-[11px] text-green-500">revu par {QUI}</span>
                  ) : (
                    <button disabled={occupe} onClick={() => promouvoir(sel)}
                      className="text-[11px] px-2 py-0.5 rounded border border-green-800
                                 text-green-400 hover:bg-green-950 disabled:opacity-40">
                      {occupe ? '…' : `marquer revu par ${QUI}`}
                    </button>
                  )}
                </div>
                <pre className="flex-1 overflow-auto p-3 text-[11px] leading-relaxed
                                whitespace-pre-wrap text-neutral-300">{contenu}</pre>
              </>
            ) : (
              <div className="p-4 text-xs text-neutral-500 max-w-lg">
                <p className="mb-2">Choisir un concept pour le lire.</p>
                <p className="text-neutral-600 leading-relaxed">
                  <b className="text-neutral-400">Marquer revu</b> écrit
                  <code className="mx-1">human:{QUI}</code> dans le
                  <code className="mx-1">verified:</code> du fichier réel. C&apos;est
                  le seul verrou qu&apos;aucun script ne peut poser à ta place —
                  l&apos;app le rend possible, elle ne le fait pas.
                </p>
              </div>
            )}
          </div>
        </div>
      ) : (
        <div className="flex-1 min-h-0 overflow-auto">
          <div className="px-3 py-2 border-b border-neutral-900 text-[11px] text-neutral-500 leading-snug">
            <b className="text-neutral-200">{contradictions.total}</b> contradictions
            cataloguées le {contradictions.genere},{' '}
            <b className="text-orange-500">{contradictions.arbitres}</b> arbitrées.
            {' '}<b className="text-neutral-300">{suggerables}</b> se trancheraient par
            la règle de date — <i>la version tardive gagne</i> — mais deux versions
            peuvent coexister à dessein : la règle est <b>suggérée</b>, jamais appliquée.
          </div>
          <ul>
            {contradictions.items.map((c) => (
              <li key={c.id} className="border-b border-neutral-900/60 px-3 py-2">
                <div className="flex items-baseline gap-2">
                  <span className="text-[10px] text-neutral-600 tabular-nums shrink-0">{c.id}</span>
                  <span className="text-xs text-neutral-200 flex-1">{c.sujet}</span>
                  {c.verdict && (
                    <span className="text-[10px] text-green-500 shrink-0">
                      {c.verdict.choix} · {c.verdict.qui}
                    </span>
                  )}
                </div>
                <div className="grid grid-cols-2 gap-2 mt-1.5">
                  {(['a', 'b'] as const).map((k) => (
                    <div key={k}
                      className={`text-[10px] p-1.5 rounded border ${
                        c.verdict?.choix === k ? 'border-green-800 bg-green-950/30'
                          : c.suggestion === k ? 'border-orange-900/60' : 'border-neutral-900'}`}>
                      <div className="flex justify-between text-neutral-600">
                        <span>{k.toUpperCase()}</span>
                        <span className="tabular-nums">{c[k].date}</span>
                        {c.suggestion === k && <span className="text-orange-600">plus récent</span>}
                      </div>
                      <div className="text-neutral-400 break-all mt-0.5">{c[k].chemin}</div>
                    </div>
                  ))}
                </div>
                {!c.verdict && (
                  <div className="flex gap-1.5 mt-1.5 items-center">
                    {(['a', 'b', 'les deux'] as const).map((ch) => (
                      <button key={ch} disabled={occupe} onClick={() => arbitrer(c.id, ch)}
                        className="text-[10px] px-2 py-0.5 rounded border border-neutral-800
                                   hover:border-orange-700 hover:text-orange-400 disabled:opacity-40">
                        {ch === 'les deux' ? 'coexistent' : `garder ${ch.toUpperCase()}`}
                      </button>
                    ))}
                    <input value={note} onChange={(e) => setNote(e.target.value)}
                      placeholder="pourquoi (facultatif)"
                      className="flex-1 text-[10px] bg-neutral-900 border border-neutral-800
                                 rounded px-1.5 py-0.5 text-neutral-300 placeholder-neutral-700" />
                  </div>
                )}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

export const manifest = {
  id: 'revue',
  name: 'Revue',
  kind: 'single' as const,
  description: 'Le goulot P6 rendu manipulable — concepts à relire, contradictions à arbitrer.',
  icon: '✓',
};

export const App = RevueApp;
