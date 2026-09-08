/**
 * Passerelles & Observateurs — Centre de pilotage unifié des flux et services d'observabilité.
 *
 * Intègre directement les interfaces web (iframes haute fidélité) de :
 *   - Bifrost      (http://127.0.0.1:8080)
 *   - 9Router      (http://127.0.0.1:20128)
 *   - OmniRoute    (http://127.0.0.1:20129)
 *   - AgentGateway (http://127.0.0.1:15000/ui)
 *   - Observatoire (http://127.0.0.1:8787)
 *   - AgentPulse   (http://127.0.0.1:5001)
 *
 * Commandes intégrées :
 *   - Relancer un service sur son port
 *   - Éteindre / Tuer un processus pour libérer les ressources CPU/GPU
 *   - Bouton Arrêt d'urgence Anti-Surchauffe (éteint tous les processus)
 *   - Diagnostics des ports, conflits et journaux en direct
 */

import { useCallback, useEffect, useRef, useState } from 'react';

interface GatewayTarget {
  id: string;
  nom: string;
  port: number;
  url: string;
  icon: string;
  role: string;
}

const PASSERELLES: GatewayTarget[] = [
  {
    id: 'bifrost',
    nom: 'Bifrost',
    port: 8080,
    url: 'http://127.0.0.1:8080',
    icon: '⚡',
    role: 'Bifrost AI Gateway & MCP Manager (Port 8080)',
  },
  {
    id: '9router',
    nom: '9Router',
    port: 20128,
    url: 'http://127.0.0.1:20128',
    icon: '🔀',
    role: 'Passerelle LLM locale (Port 20128)',
  },
  {
    id: 'omniroute',
    nom: 'OmniRoute',
    port: 20129,
    url: 'http://127.0.0.1:20129',
    icon: '🌐',
    role: 'Passerelle multi-fournisseurs (Port 20129)',
  },
  {
    id: 'agentgateway',
    nom: 'AgentGateway',
    port: 15000,
    url: 'http://127.0.0.1:15000/ui',
    icon: '🛡️',
    role: 'Console de supervision AgentGateway (Port 15000)',
  },
  {
    id: 'observatoire',
    nom: 'Observatoire',
    port: 8787,
    url: 'http://127.0.0.1:8787',
    icon: '🔭',
    role: 'Observatoire des délégations & télémétrie (Port 8787)',
  },
  {
    id: 'agentpulse',
    nom: 'AgentPulse',
    port: 5001,
    url: 'http://127.0.0.1:5001',
    icon: '💓',
    role: 'Visualisation des runs & métriques AgentPulse (Port 5001)',
  },
];

type TargetStatus = 'checking' | 'up' | 'down';

interface DiagnosticRouteur {
  cle: string;
  nom: string;
  port: number;
  role: string;
  en_ligne: boolean;
  adresses: string[];
  pids: string[];
  conflit: boolean;
  expose: boolean;
  http: number | null;
  lanceur: string;
  lanceur_present: boolean;
  journal: string[];
}

interface DiagnosticEtat {
  lu_a: string;
  routeurs: DiagnosticRouteur[];
}

function toEmbedUrl(url: string): string {
  if (url.startsWith('http://127.0.0.1:8080')) {
    return url.replace('http://127.0.0.1:8080', 'http://127.0.0.1:8082');
  }
  if (url.startsWith('http://localhost:8080')) {
    return url.replace('http://localhost:8080', 'http://127.0.0.1:8082');
  }
  if (url.startsWith('http://127.0.0.1:20129')) {
    return url.replace('http://127.0.0.1:20129', 'http://127.0.0.1:20130');
  }
  if (url.startsWith('http://localhost:20129')) {
    return url.replace('http://localhost:20129', 'http://127.0.0.1:20130');
  }
  return url;
}

export function RouteursApp() {
  const [activeTab, setActiveTab] = useState<string>('bifrost');
  const [currentUrl, setCurrentUrl] = useState<string>(PASSERELLES[0].url);
  const [draftUrl, setDraftUrl] = useState<string>(PASSERELLES[0].url);
  const [statuses, setStatuses] = useState<Record<string, TargetStatus>>({});
  const [actionEnCours, setActionEnCours] = useState<string | null>(null);
  const [journalOuvert, setJournalOuvert] = useState<string | null>(null);
  const [messageFlash, setMessageFlash] = useState<string | null>(null);

  // Diagnostic state
  const [diagEtat, setDiagEtat] = useState<DiagnosticEtat | null>(null);
  const [diagErreur, setDiagErreur] = useState<string | null>(null);

  const iframeRef = useRef<HTMLIFrameElement>(null);

  const afficherFlash = (msg: string) => {
    setMessageFlash(msg);
    setTimeout(() => setMessageFlash(null), 4000);
  };

  // Sonder la disponibilité d'une cible
  const sonderCible = useCallback(async (target: GatewayTarget) => {
    try {
      const res = await fetch(target.url, { mode: 'no-cors', cache: 'no-store' });
      const isUp = res.type === 'opaque' || (res.status >= 200 && res.status < 500);
      setStatuses((prev) => ({ ...prev, [target.id]: isUp ? 'up' : 'down' }));
    } catch {
      setStatuses((prev) => ({ ...prev, [target.id]: 'down' }));
    }
  }, []);

  const sonderToutes = useCallback(() => {
    PASSERELLES.forEach((p) => {
      setStatuses((prev) => ({ ...prev, [p.id]: 'checking' }));
      void sonderCible(p);
    });
  }, [sonderCible]);

  const chargerDiagnostic = useCallback(() => {
    setDiagErreur(null);
    fetch('/api/routeurs/etat')
      .then((r) => (r.ok ? r.json() : Promise.reject(new Error(`HTTP ${r.status}`))))
      .then(setDiagEtat)
      .catch((e: Error) => setDiagErreur(e.message));
  }, []);

  useEffect(() => {
    sonderToutes();
    chargerDiagnostic();
    const id = setInterval(() => {
      sonderToutes();
      if (activeTab === 'diagnostic') chargerDiagnostic();
    }, 15000);
    return () => clearInterval(id);
  }, [sonderToutes, chargerDiagnostic, activeTab]);

  const selectionnerPasserelle = (p: GatewayTarget) => {
    setActiveTab(p.id);
    setCurrentUrl(p.url);
    setDraftUrl(p.url);
    void sonderCible(p);
  };

  const rechargerCadre = () => {
    if (iframeRef.current) {
      iframeRef.current.src = toEmbedUrl(currentUrl);
    }
    const current = PASSERELLES.find((p) => p.id === activeTab);
    if (current) void sonderCible(current);
  };

  // Démarrer un service
  const demarrerService = (cle: string) => {
    setActionEnCours(cle);
    fetch(`/api/routeurs/demarrer?cle=${encodeURIComponent(cle)}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ cle }),
    })
      .then(() => {
        afficherFlash(`Démarrage de ${cle} envoyé`);
        setTimeout(() => {
          sonderToutes();
          chargerDiagnostic();
          setActionEnCours(null);
          rechargerCadre();
        }, 4000);
      })
      .catch(() => setActionEnCours(null));
  };

  // Relancer un service sur son port
  const relancerService = (cle: string) => {
    setActionEnCours(cle);
    fetch(`/api/routeurs/relancer?cle=${encodeURIComponent(cle)}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ cle }),
    })
      .then(() => {
        afficherFlash(`Relance de ${cle} en cours…`);
        setTimeout(() => {
          sonderToutes();
          chargerDiagnostic();
          setActionEnCours(null);
          rechargerCadre();
        }, 5000);
      })
      .catch(() => setActionEnCours(null));
  };

  // Éteindre / Tuer un service sur son port
  const eteindreService = (cle: string) => {
    setActionEnCours(cle);
    fetch(`/api/routeurs/arreter?cle=${encodeURIComponent(cle)}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ cle }),
    })
      .then(() => {
        afficherFlash(`Processus ${cle} arrêté`);
        setTimeout(() => {
          sonderToutes();
          chargerDiagnostic();
          setActionEnCours(null);
        }, 2000);
      })
      .catch(() => setActionEnCours(null));
  };

  // Arrêt d'urgence Anti-Surchauffe (Éteint TOUT)
  const arreterTousLesServices = () => {
    if (!confirm('Voulez-vous éteindre TOUS les routeurs et observateurs pour libérer le processeur/GPU ?')) {
      return;
    }
    setActionEnCours('all');
    fetch('/api/routeurs/arreter-tout', { method: 'POST' })
      .then(() => {
        afficherFlash('❄️ Tous les processus ont été éteints.');
        setTimeout(() => {
          sonderToutes();
          chargerDiagnostic();
          setActionEnCours(null);
        }, 2000);
      })
      .catch(() => setActionEnCours(null));
  };

  const activeGateway = PASSERELLES.find((p) => p.id === activeTab);
  const activeStatus = activeTab !== 'diagnostic' ? statuses[activeTab] ?? 'checking' : 'up';

  return (
    <div className="flex flex-col h-full bg-neutral-950 text-neutral-200 text-xs select-none">
      {/* 1. Barre supérieure : Onglets des Passerelles & Observateurs */}
      <header className="px-3 py-2 border-b border-neutral-800/80 bg-neutral-900/50 flex items-center justify-between gap-2 shrink-0">
        <div className="flex items-center gap-1.5 overflow-x-auto">
          {PASSERELLES.map((p) => {
            const st = statuses[p.id] ?? 'checking';
            const isActive = activeTab === p.id;
            return (
              <button
                key={p.id}
                onClick={() => selectionnerPasserelle(p)}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-md font-medium text-xs transition-all ${
                  isActive
                    ? 'bg-neutral-800 text-white shadow-sm border border-neutral-700'
                    : 'text-neutral-400 hover:text-neutral-200 hover:bg-neutral-800/50 border border-transparent'
                }`}
              >
                <span>{p.icon}</span>
                <span>{p.nom}</span>
                <span
                  className={`w-2 h-2 rounded-full shrink-0 ${
                    st === 'up'
                      ? 'bg-emerald-500 shadow-[0_0_6px_rgba(16,185,129,0.6)]'
                      : st === 'checking'
                      ? 'bg-amber-400 animate-pulse'
                      : 'bg-rose-500'
                  }`}
                />
              </button>
            );
          })}

          <div className="h-4 w-[1px] bg-neutral-800 mx-1 shrink-0" />

          <button
            onClick={() => {
              setActiveTab('diagnostic');
              chargerDiagnostic();
            }}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md font-medium text-xs transition-all ${
              activeTab === 'diagnostic'
                ? 'bg-neutral-800 text-white shadow-sm border border-neutral-700'
                : 'text-neutral-400 hover:text-neutral-200 hover:bg-neutral-800/50 border border-transparent'
            }`}
          >
            <span>📊</span>
            <span>Diagnostics & Contrôle</span>
          </button>
        </div>

        {/* Bouton d'urgence Anti-Surchauffe */}
        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={arreterTousLesServices}
            disabled={actionEnCours === 'all'}
            title="Arrêt d'urgence de tous les routeurs pour refroidir le PC"
            className="flex items-center gap-1 px-2.5 py-1 rounded bg-rose-950/70 hover:bg-rose-900 border border-rose-800 text-rose-300 text-[11px] font-semibold transition-colors disabled:opacity-50"
          >
            <span>❄️</span>
            <span>Anti-Surchauffe</span>
          </button>
        </div>
      </header>

      {/* 2. Barre d'adresse & contrôles du service actif (Mode Iframe) */}
      {activeTab !== 'diagnostic' && (
        <div className="px-3 py-1.5 border-b border-neutral-900 bg-neutral-950/80 flex items-center justify-between gap-3 shrink-0">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              setCurrentUrl(draftUrl);
            }}
            className="flex-1 flex items-center gap-2"
          >
            <span className="text-neutral-500 font-mono text-[11px]">URL</span>
            <input
              type="text"
              value={draftUrl}
              onChange={(e) => setDraftUrl(e.target.value)}
              className="flex-1 bg-neutral-900 border border-neutral-800 rounded px-2.5 py-1 text-xs font-mono text-neutral-300 focus:outline-none focus:border-orange-500"
            />
            <button
              type="submit"
              className="px-2.5 py-1 bg-neutral-800 hover:bg-neutral-700 border border-neutral-700 rounded text-[11px] text-neutral-300"
            >
              Aller
            </button>
          </form>

          {/* Boutons d'action sur le processus actif */}
          <div className="flex items-center gap-1.5 shrink-0">
            {activeStatus === 'up' ? (
              <>
                <button
                  onClick={() => relancerService(activeTab)}
                  disabled={actionEnCours === activeTab}
                  title="Relancer le processus sur ce port"
                  className="flex items-center gap-1 px-2.5 py-1 rounded bg-amber-950/60 hover:bg-amber-900 border border-amber-800 text-amber-300 text-[11px] disabled:opacity-50"
                >
                  <span>⚡</span>
                  <span>{actionEnCours === activeTab ? 'Relance…' : 'Relancer'}</span>
                </button>
                <button
                  onClick={() => eteindreService(activeTab)}
                  disabled={actionEnCours === activeTab}
                  title="Éteindre le processus sur ce port"
                  className="flex items-center gap-1 px-2.5 py-1 rounded bg-neutral-900 hover:bg-rose-950 border border-neutral-700 hover:border-rose-800 text-rose-300 text-[11px] disabled:opacity-50"
                >
                  <span>🛑</span>
                  <span>{actionEnCours === activeTab ? 'Arrêt…' : 'Éteindre'}</span>
                </button>
              </>
            ) : (
              <button
                onClick={() => demarrerService(activeTab)}
                disabled={actionEnCours === activeTab}
                title="Démarrer le service"
                className="flex items-center gap-1 px-3 py-1 bg-emerald-950 hover:bg-emerald-900 border border-emerald-700 rounded text-emerald-300 font-medium text-[11px] disabled:opacity-50"
              >
                <span>⚡</span>
                <span>{actionEnCours === activeTab ? 'Démarrage…' : 'Démarrer'}</span>
              </button>
            )}

            <button
              onClick={rechargerCadre}
              title="Recharger l'iframe"
              className="p-1.5 rounded hover:bg-neutral-800 text-neutral-400 hover:text-neutral-200 border border-neutral-800"
            >
              🔄
            </button>

            <a
              href={currentUrl}
              target="_blank"
              rel="noreferrer"
              title="Ouvrir dans un nouvel onglet"
              className="flex items-center gap-1 px-2.5 py-1 rounded bg-neutral-800 hover:bg-neutral-700 text-neutral-200 border border-neutral-700 text-[11px]"
            >
              <span>↗</span>
              <span>Ouvrir</span>
            </a>
          </div>
        </div>
      )}

      {/* Message Flash */}
      {messageFlash && (
        <div className="px-3 py-1 bg-orange-950/80 border-b border-orange-800 text-orange-200 text-[11px] flex items-center justify-between shrink-0">
          <span>{messageFlash}</span>
          <button onClick={() => setMessageFlash(null)} className="text-orange-400 hover:text-orange-200">
            ✕
          </button>
        </div>
      )}

      {/* 3. Zone Principale (Iframe ou Diagnostics & Contrôle) */}
      <main className="flex-1 min-h-0 relative bg-black">
        {activeTab !== 'diagnostic' ? (
          activeStatus === 'down' ? (
            <div className="h-full flex items-center justify-center p-6 text-center bg-neutral-950">
              <div className="max-w-md bg-neutral-900/60 border border-neutral-800 p-6 rounded-xl shadow-xl">
                <div className="text-4xl mb-3">{activeGateway?.icon || '⚠️'}</div>
                <h3 className="text-base font-semibold text-neutral-100 mb-1">
                  {activeGateway?.nom} est hors ligne
                </h3>
                <p className="text-neutral-400 text-xs mb-4">
                  Aucun processus ne répond actuellement sur <code className="text-orange-400">{currentUrl}</code>.
                </p>
                <div className="flex justify-center gap-3">
                  <button
                    disabled={actionEnCours === activeTab}
                    onClick={() => demarrerService(activeTab)}
                    className="px-4 py-2 bg-orange-600 hover:bg-orange-500 text-white font-medium rounded-lg shadow-lg disabled:opacity-50 text-xs flex items-center gap-2"
                  >
                    <span>⚡</span>
                    <span>{actionEnCours === activeTab ? 'Démarrage en cours…' : 'Démarrer le service'}</span>
                  </button>
                  <button
                    onClick={rechargerCadre}
                    className="px-4 py-2 bg-neutral-800 hover:bg-neutral-700 text-neutral-300 rounded-lg border border-neutral-700 text-xs"
                  >
                    Réessayer la sonde
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <iframe
              ref={iframeRef}
              src={toEmbedUrl(currentUrl)}
              title={activeGateway?.nom ?? 'Passerelle'}
              className="w-full h-full border-0 bg-white"
              sandbox="allow-scripts allow-same-origin allow-forms allow-popups allow-downloads allow-modals"
            />
          )
        ) : (
          /* Onglet Diagnostics & Contrôle Système */
          <div className="h-full overflow-auto p-4 space-y-4 bg-neutral-950">
            <div className="flex items-center justify-between pb-2 border-b border-neutral-800">
              <div>
                <h2 className="text-sm font-semibold text-neutral-100">Supervision des Ports & Contrôle des Processus</h2>
                <p className="text-[11px] text-neutral-500">
                  Détection des conflits de ports, PID actifs, relance et extinction immédiate.
                </p>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={arreterTousLesServices}
                  className="px-3 py-1 rounded bg-rose-950 border border-rose-800 text-rose-300 hover:bg-rose-900 text-[11px] font-semibold"
                >
                  ❄️ Tout éteindre
                </button>
                <button
                  onClick={chargerDiagnostic}
                  className="px-2.5 py-1 rounded bg-neutral-800 hover:bg-neutral-700 border border-neutral-700 text-[11px]"
                >
                  Actualiser
                </button>
              </div>
            </div>

            {diagErreur && (
              <div className="p-3 bg-red-950/40 border border-red-800 rounded-lg text-red-300 text-xs">
                Erreur de sonde API : {diagErreur}
              </div>
            )}

            {diagEtat ? (
              <div className="space-y-3">
                {diagEtat.routeurs.map((r) => (
                  <section
                    key={r.cle}
                    className={`border rounded-lg p-3 bg-neutral-900/40 ${
                      r.conflit || r.expose ? 'border-red-900/80 bg-red-950/10' : 'border-neutral-800'
                    }`}
                  >
                    <header className="flex items-center justify-between gap-3 mb-2">
                      <div className="flex items-center gap-2.5">
                        <span
                          className={`w-2.5 h-2.5 rounded-full ${
                            !r.en_ligne
                              ? 'bg-neutral-600'
                              : r.conflit || r.expose
                              ? 'bg-red-500 shadow-[0_0_6px_rgba(239,68,68,0.6)]'
                              : 'bg-emerald-500 shadow-[0_0_6px_rgba(16,185,129,0.6)]'
                          }`}
                        />
                        <span className="font-semibold text-neutral-200 text-sm">{r.nom}</span>
                        <span className="text-orange-400 font-mono text-xs">:{r.port}</span>
                        {r.http && (
                          <span className="px-1.5 py-0.5 rounded bg-neutral-800 text-[10px] text-neutral-400 font-mono">
                            HTTP {r.http}
                          </span>
                        )}
                      </div>

                      <div className="flex items-center gap-2">
                        {r.en_ligne ? (
                          <>
                            <button
                              disabled={actionEnCours === r.cle}
                              onClick={() => relancerService(r.cle)}
                              className="px-2.5 py-1 rounded bg-amber-950 border border-amber-800 text-amber-300 hover:bg-amber-900 text-[11px]"
                            >
                              Relancer
                            </button>
                            <button
                              disabled={actionEnCours === r.cle}
                              onClick={() => eteindreService(r.cle)}
                              className="px-2.5 py-1 rounded bg-rose-950 border border-rose-800 text-rose-300 hover:bg-rose-900 text-[11px]"
                            >
                              Éteindre
                            </button>
                          </>
                        ) : (
                          r.lanceur_present && (
                            <button
                              disabled={actionEnCours === r.cle}
                              onClick={() => demarrerService(r.cle)}
                              className="px-2.5 py-1 rounded bg-emerald-950 border border-emerald-800 text-emerald-300 hover:bg-emerald-900 text-[11px]"
                            >
                              Démarrer
                            </button>
                          )
                        )}

                        {r.journal && r.journal.length > 0 && (
                          <button
                            onClick={() => setJournalOuvert(journalOuvert === r.cle ? null : r.cle)}
                            className="px-2.5 py-1 rounded bg-neutral-800 border border-neutral-700 hover:bg-neutral-700 text-neutral-300 text-[11px]"
                          >
                            {journalOuvert === r.cle ? 'Masquer logs' : 'Voir logs'}
                          </button>
                        )}
                      </div>
                    </header>

                    <p className="text-[11px] text-neutral-500 mb-2">{r.role}</p>

                    <div className="flex flex-wrap gap-x-4 gap-y-1 text-[11px] text-neutral-400 font-mono">
                      <span>État: {r.en_ligne ? 'En ligne' : 'Arrêté'}</span>
                      {r.en_ligne && <span>Écoute: {r.adresses.join(', ') || '127.0.0.1'}</span>}
                      {r.en_ligne && <span>PIDs: {r.pids.join(', ')}</span>}
                    </div>

                    {r.expose && (
                      <p className="mt-2 text-xs text-red-400">
                        ⚠️ <b>Exposé au réseau local</b> : écoute sur 0.0.0.0.
                      </p>
                    )}
                    {r.conflit && (
                      <p className="mt-2 text-xs text-red-400">
                        ⚠️ <b>Conflit</b> : plusieurs processus écoutent sur le port {r.port}.
                      </p>
                    )}

                    {journalOuvert === r.cle && (
                      <pre className="mt-3 p-3 bg-black/60 border border-neutral-800 rounded-lg text-[10px] text-neutral-400 overflow-x-auto max-h-48 whitespace-pre-wrap font-mono">
                        {r.journal.join('\n')}
                      </pre>
                    )}
                  </section>
                ))}
              </div>
            ) : (
              <div className="text-neutral-500 text-xs">Chargement des données de supervision…</div>
            )}
          </div>
        )}
      </main>

      {/* 4. Pied de page informatif */}
      <footer className="px-3 py-1 border-t border-neutral-900 bg-neutral-950 text-[10px] text-neutral-500 flex items-center justify-between">
        <span>Agent OS Passerelles & Observabilité — Contrôle unifié des processus & anti-surchauffe</span>
        <span>Port 5555</span>
      </footer>
    </div>
  );
}

export const manifest = {
  id: 'routeurs',
  name: 'Passerelles & Observateurs',
  kind: 'multi' as const,
  description: 'Hub unifié des routeurs (Bifrost, 9Router, OmniRoute) et observateurs (AgentGateway, Observatoire, AgentPulse).',
  icon: '⇄',
  domaine: 'l0-tech',
};

export const App = RouteursApp;

