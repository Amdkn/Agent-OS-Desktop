/**
 * Cadre — Composant haute fidélité pour les applications encapsulées (Coach OS, Life OS).
 *
 * Résout :
 *   - Zéro clignotement : le polling en arrière-plan est totalement silencieux
 *   - Persistance de session : l'iframe reste monté sans être détruit/recréé à chaque micro-changement d'état
 *   - Contrôle direct du cycle de vie des processus (Lancer / Relancer / Éteindre)
 */

import { useCallback, useEffect, useRef, useState } from 'react';

export interface CadreProps {
  url: string;
  titre: string;
  detail: string;
  /** Clé de service pour l'API /api/routeurs (ex: 'coachos', 'lifeos') */
  cle?: string;
  /** Affiche comment relancer la cible quand elle est muette. */
  remede?: string;
  /** URL alternative de repli en ligne (ex: déploiement Vercel) */
  urlEnLigne?: string;
  titreEnLigne?: string;
}

type Etat = 'inconnu' | 'sonde' | 'vivant' | 'muet';

export function Cadre({ url, titre, detail, cle, remede, urlEnLigne, titreEnLigne }: CadreProps) {
  const [etat, setEtat] = useState<Etat>('inconnu');
  const [message, setMessage] = useState('');
  const [actionEnCours, setActionEnCours] = useState<string | null>(null);
  const [messageFlash, setMessageFlash] = useState<string | null>(null);
  const cadre = useRef<HTMLIFrameElement>(null);

  const afficherFlash = (msg: string) => {
    setMessageFlash(msg);
    setTimeout(() => setMessageFlash(null), 4000);
  };

  // Sonder la cible : silencieux en polling, bruyant seulement si demandé explicitement
  const sonder = useCallback(
    async (explicite = false) => {
      if (explicite) {
        setEtat('sonde');
        setMessage('sonde en cours…');
      }
      try {
        const r = await fetch(url, { mode: 'no-cors', cache: 'no-store' });
        setEtat('vivant');
        setMessage(r.type === 'opaque' ? 'répond' : `code ${r.status}`);
      } catch {
        setEtat('muet');
        setMessage('éteint');
      }
    },
    [url]
  );

  useEffect(() => {
    void sonder(true);
    // Polling silencieux toutes les 6 secondes sans flash de statut
    const id = setInterval(() => void sonder(false), 6000);
    return () => clearInterval(id);
  }, [sonder]);

  // Commandes de contrôle de processus
  const demarrerProcessus = () => {
    if (!cle) return;
    setActionEnCours('demarrer');
    fetch(`/api/routeurs/demarrer?cle=${encodeURIComponent(cle)}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ cle }),
    })
      .then(() => {
        afficherFlash(`Démarrage lancé…`);
        setTimeout(() => {
          void sonder(false);
          setActionEnCours(null);
          if (cadre.current) cadre.current.src = url;
        }, 2500);
      })
      .catch(() => setActionEnCours(null));
  };

  const relancerProcessus = () => {
    if (!cle) return;
    setActionEnCours('relancer');
    fetch(`/api/routeurs/relancer?cle=${encodeURIComponent(cle)}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ cle }),
    })
      .then(() => {
        afficherFlash(`Relance en cours…`);
        setTimeout(() => {
          void sonder(false);
          setActionEnCours(null);
          if (cadre.current) cadre.current.src = url;
        }, 3000);
      })
      .catch(() => setActionEnCours(null));
  };

  const eteindreProcessus = () => {
    if (!cle) return;
    setActionEnCours('eteindre');
    fetch(`/api/routeurs/arreter?cle=${encodeURIComponent(cle)}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ cle }),
    })
      .then(() => {
        afficherFlash(`Processus arrêté`);
        setEtat('muet');
        setMessage('éteint');
        setTimeout(() => {
          void sonder(false);
          setActionEnCours(null);
        }, 1000);
      })
      .catch(() => setActionEnCours(null));
  };

  const pastille =
    etat === 'vivant' ? 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.7)]'
    : etat === 'muet' ? 'bg-red-500'
    : etat === 'sonde' ? 'bg-amber-400 animate-pulse'
    : 'bg-white/20';

  return (
    <div className="flex h-full flex-col text-xs bg-[#09090b] text-neutral-200 select-none overflow-hidden font-mono">
      {/* Header Compact Mono-Ligne */}
      <header className="shrink-0 h-10 px-3 border-b border-neutral-800/80 bg-neutral-950/95 flex items-center justify-between gap-2 z-10">
        <div className="flex items-center gap-2 min-w-0 truncate">
          <span className={`h-2.5 w-2.5 rounded-full shrink-0 ${pastille}`} aria-hidden />
          <span className="font-bold text-neutral-100 truncate text-[11px]">{titre}</span>
          <span className="text-[10px] text-neutral-500 truncate hidden md:inline">
            · {messageFlash || message}
          </span>
        </div>

        {/* Contrôles d'Action */}
        <div className="flex items-center gap-1 shrink-0">
          {cle && etat === 'muet' && (
            <button
              onClick={demarrerProcessus}
              disabled={Boolean(actionEnCours)}
              className="px-2.5 py-1 rounded-md bg-emerald-600 hover:bg-emerald-500 text-white font-bold transition-all text-[11px] flex items-center gap-1 shadow-sm"
              title="Démarrer le serveur local"
            >
              <span>🚀</span>
              <span>{actionEnCours === 'demarrer' ? '…' : 'Lancer'}</span>
            </button>
          )}

          {cle && etat === 'vivant' && (
            <>
              <button
                onClick={relancerProcessus}
                disabled={Boolean(actionEnCours)}
                className="px-2 py-1 rounded-md bg-neutral-900 hover:bg-neutral-800 border border-neutral-800 text-neutral-300 hover:text-orange-400 transition-colors text-[11px] flex items-center gap-1"
                title="Relancer le serveur local"
              >
                <span>⚡</span>
                <span>Relancer</span>
              </button>
              <button
                onClick={eteindreProcessus}
                disabled={Boolean(actionEnCours)}
                className="px-2 py-1 rounded-md bg-neutral-900 hover:bg-red-950/80 border border-neutral-800 hover:border-red-500/50 text-neutral-400 hover:text-red-400 transition-colors text-[11px] flex items-center gap-1"
                title="Arrêter le serveur pour libérer les ressources"
              >
                <span>🛑</span>
                <span>Éteindre</span>
              </button>
            </>
          )}

          <button
            onClick={() => void sonder(true)}
            className="px-2 py-1 rounded-md bg-neutral-900 hover:bg-neutral-800 border border-neutral-800 text-neutral-400 hover:text-neutral-200 transition-colors text-[11px]"
            title="Tester la connectivité"
          >
            Sonder
          </button>
          <button
            onClick={() => {
              if (cadre.current) cadre.current.src = url;
            }}
            className="px-2 py-1 rounded-md bg-neutral-900 hover:bg-neutral-800 border border-neutral-800 text-neutral-400 hover:text-neutral-200 transition-colors text-[11px]"
            title="Rafraîchir"
          >
            Recharger
          </button>
          <a
            href={url}
            target="_blank"
            rel="noreferrer"
            className="px-2 py-1 rounded-md bg-neutral-900 hover:bg-neutral-800 border border-neutral-800 text-neutral-300 hover:text-white transition-colors text-[11px]"
            title="Ouvrir dans un nouvel onglet"
          >
            ↗ Onglet
          </a>
        </div>
      </header>

      {/* Corps Principal */}
      <div className="flex-1 min-h-0 bg-[#08080a] relative">
        {/* Iframe toujours maintenu dans le DOM pour préserver l'état de session */}
        <iframe
          ref={cadre}
          src={url}
          title={titre}
          className={`w-full h-full border-0 ${etat === 'vivant' ? 'block' : 'hidden'}`}
          sandbox="allow-scripts allow-same-origin allow-forms allow-popups allow-downloads allow-modals"
        />

        {/* Écran de repli quand le serveur est éteint */}
        {etat === 'muet' && (
          <div className="absolute inset-0 flex items-center justify-center p-4 overflow-y-auto bg-[#08080a]">
            <div className="max-w-md w-full bg-neutral-900/60 p-5 rounded-2xl border border-neutral-800 text-center space-y-3.5 shadow-2xl backdrop-blur-sm">
              <div className="w-10 h-10 rounded-xl bg-neutral-950 border border-neutral-800 flex items-center justify-center text-xl mx-auto text-neutral-400">
                {cle === 'coachos' ? '⌘' : cle === 'lifeos' ? '◍' : '🌐'}
              </div>

              <div>
                <h3 className="text-xs font-bold text-neutral-100">{titre} est éteint</h3>
                <p className="text-[11px] text-neutral-500 mt-0.5">
                  Serveur inactif sur <code className="text-orange-400 font-bold">{url}</code>
                </p>
              </div>

              {/* Action Principale */}
              {cle && (
                <button
                  onClick={demarrerProcessus}
                  disabled={Boolean(actionEnCours)}
                  className="w-full py-2 px-3 rounded-xl bg-orange-600 hover:bg-orange-500 text-white font-bold text-xs shadow-md shadow-orange-950/40 transition-all flex items-center justify-center gap-1.5"
                >
                  <span>🚀</span>
                  <span>{actionEnCours === 'demarrer' ? 'Démarrage en cours…' : `Démarrer le serveur local`}</span>
                </button>
              )}

              {/* Repli en ligne */}
              {urlEnLigne && (
                <div className="pt-1 border-t border-neutral-800/80">
                  <a
                    href={urlEnLigne}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1.5 text-[11px] text-sky-400 hover:text-sky-300 font-semibold transition-colors mt-1"
                  >
                    <span>☁️</span>
                    <span>Ouvrir {titreEnLigne || 'la version en ligne'} ↗</span>
                  </a>
                </div>
              )}

              {remede && (
                <p className="text-[10px] text-neutral-500 leading-relaxed bg-black/40 p-2 rounded-lg border border-neutral-900 text-left">
                  {remede}
                </p>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Footer */}
      <footer className="shrink-0 h-6 px-3 border-t border-neutral-900 bg-neutral-950 flex justify-between items-center text-[10px] text-neutral-500">
        <span className="truncate">{detail}</span>
        <span className="tabular-nums shrink-0 ml-2">{url}</span>
      </footer>
    </div>
  );
}
