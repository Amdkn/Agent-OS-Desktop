/**
 * Passerelles — l'etat des deux routeurs de modeles, lu a chaud.
 *
 * POURQUOI CETTE APP EXISTE
 * 9Router et OmniRoute ont TOUS DEUX 20128 par defaut. Une mise a jour a
 * ramene 9Router sur son defaut : il a squatte le port d'OmniRoute, et les
 * relais ont continue de repondre -- en parlant au mauvais routeur. C'est le
 * pire des cas, parce que ca marche.
 *
 * Le diagnostic a demande une demi-heure de netstat et de lecture de scripts,
 * faute d'une vue. Cette app est cette vue.
 *
 * CE QU'ELLE MONTRE QUE « EN LIGNE » NE MONTRE PAS
 *   - l'ADRESSE de liaison : 0.0.0.0 = joignable par tout le reseau local,
 *     avec des cles de fournisseurs derriere ;
 *   - le CONFLIT : deux processus sur un meme port ;
 *   - la REPONSE HTTP : un port ouvert ne prouve pas qu'un service repond.
 *
 * Un tableau qui afficherait une pastille verte sans ces trois-la cacherait
 * exactement la panne qu'on vient de payer.
 */

import { useCallback, useEffect, useState } from 'react';

interface Routeur {
  cle: string; nom: string; port: number; role: string;
  en_ligne: boolean; adresses: string[]; pids: string[];
  conflit: boolean; expose: boolean; http: number | null;
  lanceur: string; lanceur_present: boolean; journal: string[];
}
interface Etat { lu_a: string; routeurs: Routeur[] }

export function RouteursApp() {
  const [etat, setEtat] = useState<Etat | null>(null);
  const [erreur, setErreur] = useState<string | null>(null);
  const [ouvert, setOuvert] = useState<string | null>(null);
  const [occupe, setOccupe] = useState<string | null>(null);

  const charger = useCallback(() => {
    setErreur(null);
    fetch('/api/routeurs/etat')
      .then((r) => (r.ok ? r.json() : Promise.reject(new Error(`HTTP ${r.status}`))))
      .then(setEtat)
      .catch((e: Error) => setErreur(e.message));
  }, []);

  useEffect(() => {
    charger();
    // Un routeur meurt sans prevenir : sans relecture, la vue serait vraie a
    // l'ouverture et fausse ensuite -- ce qu'on cherche precisement a eviter.
    const id = setInterval(charger, 20000);
    return () => clearInterval(id);
  }, [charger]);

  const demarrer = useCallback((cle: string) => {
    setOccupe(cle);
    fetch('/api/routeurs/demarrer', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ cle }),
    }).then(() => setTimeout(() => { charger(); setOccupe(null); }, 12000))
      .catch(() => setOccupe(null));
  }, [charger]);

  if (erreur) {
    return (
      <div className="p-4 text-sm text-red-400">
        <p>L&apos;API des passerelles ne répond pas : {erreur}</p>
        <p className="text-neutral-500 mt-2 text-xs">
          Servie par <code>tools/routeurs-api.ts</code>.
        </p>
      </div>
    );
  }
  if (!etat) return <div className="p-4 text-sm text-neutral-500">Lecture des ports…</div>;

  return (
    <div className="h-full flex flex-col bg-neutral-950 text-neutral-300 text-[13px]
                    [&_*::-webkit-scrollbar]:w-1.5 [&_*::-webkit-scrollbar-thumb]:bg-neutral-800
                    [&_*::-webkit-scrollbar-track]:bg-transparent
                    [&_*::-webkit-scrollbar-thumb]:rounded">
      <div className="px-4 py-2 border-b border-neutral-900 flex items-center gap-3 shrink-0">
        <h1 className="text-sm text-neutral-200">Passerelles de modèles</h1>
        <span className="text-[11px] text-neutral-600 flex-1 truncate">
          lu à {new Date(etat.lu_a).toLocaleTimeString('fr-FR')} — relu toutes les 20 s
        </span>
        <button onClick={charger}
          className="text-[11px] px-2 py-0.5 rounded border border-neutral-800 hover:border-neutral-600">
          relire
        </button>
      </div>

      <div className="flex-1 overflow-auto p-3 space-y-3">
        {etat.routeurs.map((r) => (
          <section key={r.cle}
            className={`border rounded-lg ${
              r.conflit || r.expose ? 'border-red-900/70' : 'border-neutral-800'}`}>
            <header className="px-3 py-2 flex items-center gap-2.5">
              <span className={`w-2 h-2 rounded-full shrink-0 ${
                !r.en_ligne ? 'bg-neutral-700'
                  : r.conflit || r.expose ? 'bg-red-500'
                  : r.http ? 'bg-green-500' : 'bg-amber-500'}`} />
              <div className="min-w-0 flex-1">
                <div className="flex items-baseline gap-2">
                  <h2 className="text-sm text-neutral-200">{r.nom}</h2>
                  <span className="text-[11px] text-orange-500 tabular-nums">:{r.port}</span>
                  {r.http && <span className="text-[10px] text-neutral-600">HTTP {r.http}</span>}
                </div>
                <p className="text-[10px] text-neutral-600 truncate">{r.role}</p>
              </div>
              {!r.en_ligne && (
                <button disabled={occupe === r.cle || !r.lanceur_present}
                  onClick={() => demarrer(r.cle)}
                  className="text-[11px] px-2 py-0.5 rounded border border-orange-800
                             text-orange-400 hover:bg-orange-950 disabled:opacity-40 shrink-0">
                  {occupe === r.cle ? 'démarrage…' : 'démarrer'}
                </button>
              )}
              <button onClick={() => setOuvert(ouvert === r.cle ? null : r.cle)}
                className="text-[11px] px-2 py-0.5 rounded border border-neutral-800
                           hover:border-neutral-600 shrink-0">
                journal
              </button>
            </header>

            <div className="px-3 pb-2 space-y-1">
              {!r.en_ligne ? (
                <p className="text-[11px] text-neutral-600">
                  Hors ligne. {r.lanceur_present
                    ? 'Le lanceur V3 est présent — il porte les drapeaux qui manquent aux commandes brutes.'
                    : <span className="text-red-400">Lanceur introuvable : {r.lanceur}</span>}
                </p>
              ) : (
                <div className="flex flex-wrap gap-x-4 gap-y-1 text-[11px]">
                  <span className="text-neutral-500">
                    écoute sur{' '}
                    <b className={r.expose ? 'text-red-400' : 'text-neutral-300'}>
                      {r.adresses.join(', ')}
                    </b>
                  </span>
                  <span className="text-neutral-600">PID {r.pids.join(', ')}</span>
                  {!r.http && <span className="text-amber-500">port ouvert, aucune réponse HTTP</span>}
                </div>
              )}

              {r.expose && (
                <p className="text-[10px] text-red-400 leading-snug">
                  <b>Exposé au réseau local.</b> Ce routeur porte des clés de
                  fournisseurs et répond à toute la machine voisine.
                  {r.cle === '9router'
                    ? ' Corriger par --host 127.0.0.1.'
                    : " OmniRoute n'a pas d'option de bind : lui passer HOSTNAME=127.0.0.1 (Next.js lit HOSTNAME, pas HOST)."}
                </p>
              )}
              {r.conflit && (
                <p className="text-[10px] text-red-400 leading-snug">
                  <b>Conflit : {r.pids.length} processus sur le port {r.port}.</b> C&apos;est
                  la panne du 2026-08-30 — les deux routeurs ont le même port par
                  défaut, et le relais parlait au mauvais en répondant quand même.
                </p>
              )}

              {ouvert === r.cle && (
                <pre className="mt-2 text-[9px] text-neutral-500 bg-neutral-900/60 rounded
                                p-2 max-h-40 overflow-auto whitespace-pre-wrap">
                  {r.journal.length ? r.journal.join('\n') : '(journal vide)'}
                </pre>
              )}
            </div>
          </section>
        ))}

        <p className="text-[10px] text-neutral-600 leading-relaxed px-1">
          <b className="text-neutral-500">Répartition arbitrée le 2026-08-30 :</b> 9Router
          garde 20128, son défaut ; OmniRoute passe à 20129. Les deux ont le même
          port par défaut, donc la collision était inévitable — la fixer
          explicitement est la seule façon qu&apos;elle ne revienne pas à la
          prochaine mise à jour. Démarrage automatique par{' '}
          <code>Démarrage\ASpace-routeurs.vbs</code>, qui appelle les lanceurs V3.
        </p>
      </div>
    </div>
  );
}

export const manifest = {
  id: 'routeurs',
  name: 'Passerelles',
  kind: 'single' as const,
  description: 'Les deux routeurs de modèles — port, adresse de liaison, conflit, journal.',
  icon: '⇄',
};

export const App = RouteursApp;
