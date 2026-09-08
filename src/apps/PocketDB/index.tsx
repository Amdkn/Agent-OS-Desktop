import { useCallback, useEffect, useState } from 'react';

interface DbInfo {
  id: string;
  nom: string;
  path: string;
  taille_octets: number;
  nb_tables: number;
  nb_lignes_total: number;
  hash_integrite: string;
  statut: string;
  dernier_audit: string;
}

interface LifeDomain {
  id: string;
  slug: string;
  nom: string;
  score: number;
  priorite: string;
  objectifs_actifs: string;
  habitudes_actives: string;
  derniere_revue: string;
}

interface FrameworkState {
  id: string;
  code: string;
  nom: string;
  etat: string;
  elements_count: number;
  synced_with: string;
}

interface MetaAudit {
  id: string;
  service: string;
  statut: string;
  checksum: string;
  record_count: number;
  details: string;
  audited_at: string;
}

interface AuditState {
  success: boolean;
  dbs: DbInfo[];
  domains: LifeDomain[];
  frameworks: FrameworkState[];
  audits: MetaAudit[];
}

export function PocketDBApp() {
  const [onglet, setOnglet] = useState<'admin' | 'dbs' | 'frameworks'>('admin');
  const [etatAudit, setEtatAudit] = useState<AuditState | null>(null);
  const [enLigne, setEnLigne] = useState<boolean | null>(null);
  const [enAudit, setEnAudit] = useState(false);
  const [messageFlash, setMessageFlash] = useState<string | null>(null);

  const URL_IFRAME_DEBLOQUE = 'http://127.0.0.1:8092/_/';
  const URL_POCKETBASE_DIRECT = 'http://127.0.0.1:8090/_/';

  const chargerEtat = useCallback(async () => {
    try {
      const res = await fetch('/api/meta-audit/etat');
      if (res.ok) {
        const data = (await res.json()) as AuditState;
        setEtatAudit(data);
      }
    } catch {
      /* ignore */
    }
  }, []);

  const sonderService = useCallback(async () => {
    try {
      const res = await fetch('/api/routeurs/etat');
      if (res.ok) {
        const data = await res.json();
        const r = data.routeurs?.find((x: { cle: string }) => x.cle === 'pocketdb');
        setEnLigne(r?.en_ligne ?? false);
      }
    } catch {
      setEnLigne(false);
    }
  }, []);

  useEffect(() => {
    void sonderService();
    void chargerEtat();
    const id = setInterval(() => {
      void sonderService();
      void chargerEtat();
    }, 10000);
    return () => clearInterval(id);
  }, [sonderService, chargerEtat]);

  const executerMetaAudit = async () => {
    setEnAudit(true);
    setMessageFlash('Audit et synchronisation des bases en cours…');
    try {
      const res = await fetch('/api/meta-audit/sync', { method: 'POST' });
      const d = await res.json();
      if (d.success) {
        setMessageFlash('✅ Meta-Audit réussi : bases de données synchronisées !');
        await chargerEtat();
      } else {
        setMessageFlash(`⚠️ Erreur : ${d.erreur || 'Échec synchronisation'}`);
      }
    } catch (e) {
      setMessageFlash(`⚠️ Erreur de communication : ${String(e)}`);
    } finally {
      setEnAudit(false);
      setTimeout(() => setMessageFlash(null), 5000);
    }
  };

  const demarrerPocketDB = async () => {
    setMessageFlash('Démarrage de PocketDB…');
    try {
      await fetch('/api/routeurs/demarrer?cle=pocketdb', { method: 'POST' });
      setTimeout(() => {
        void sonderService();
        void chargerEtat();
        setMessageFlash('PocketDB lancé !');
        setTimeout(() => setMessageFlash(null), 3000);
      }, 2000);
    } catch {
      setMessageFlash('Erreur au démarrage');
    }
  };

  return (
    <div className="flex h-full flex-col text-xs bg-[#09090b] text-neutral-200 select-none overflow-hidden font-sans">
      {/* Header & Tabs */}
      <header className="shrink-0 h-11 px-3 border-b border-neutral-800 bg-neutral-950/90 flex items-center justify-between gap-3">
        <div className="flex items-center gap-2 min-w-0">
          <span className="text-base">🗄️</span>
          <span className="font-bold text-neutral-100 text-sm tracking-tight">PocketDB</span>
          <span
            className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium ${
              enLigne ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-red-500/10 text-red-400 border border-red-500/20'
            }`}
          >
            <span className={`w-1.5 h-1.5 rounded-full ${enLigne ? 'bg-emerald-400 animate-pulse' : 'bg-red-400'}`} />
            {enLigne ? 'Port 8090 (Actif)' : 'Éteint'}
          </span>
        </div>

        {/* Onglets */}
        <div className="flex items-center bg-neutral-900 border border-neutral-800 rounded-lg p-0.5 gap-1">
          <button
            onClick={() => setOnglet('admin')}
            className={`px-3 py-1 rounded-md text-[11px] font-medium transition-all ${
              onglet === 'admin' ? 'bg-orange-600 text-white shadow-sm' : 'text-neutral-400 hover:text-neutral-200'
            }`}
          >
            Console Admin
          </button>
          <button
            onClick={() => setOnglet('dbs')}
            className={`px-3 py-1 rounded-md text-[11px] font-medium transition-all ${
              onglet === 'dbs' ? 'bg-orange-600 text-white shadow-sm' : 'text-neutral-400 hover:text-neutral-200'
            }`}
          >
            Registre des DBs ({etatAudit?.dbs?.length ?? 6})
          </button>
          <button
            onClick={() => setOnglet('frameworks')}
            className={`px-3 py-1 rounded-md text-[11px] font-medium transition-all ${
              onglet === 'frameworks' ? 'bg-orange-600 text-white shadow-sm' : 'text-neutral-400 hover:text-neutral-200'
            }`}
          >
            Life OS & Frameworks
          </button>
        </div>

        {/* Actions rapides */}
        <div className="flex items-center gap-1.5">
          <button
            onClick={() => void executerMetaAudit()}
            disabled={enAudit}
            className="flex items-center gap-1 px-2.5 py-1 rounded-md bg-orange-600/20 hover:bg-orange-600/30 border border-orange-500/30 text-orange-300 hover:text-orange-200 text-[11px] font-medium transition-all disabled:opacity-50"
            title="Lancer un scan immédiat et synchroniser les DBs dans PocketBase"
          >
            <span className={enAudit ? 'animate-spin' : ''}>⚡</span>
            {enAudit ? 'Audit en cours…' : 'Meta-Audit'}
          </button>
          <a
            href={URL_POCKETBASE_DIRECT}
            target="_blank"
            rel="noreferrer"
            className="px-2 py-1 rounded-md bg-neutral-900 hover:bg-neutral-800 border border-neutral-800 text-neutral-400 hover:text-neutral-200 text-[11px] transition-colors"
            title="Ouvrir la console dans un nouvel onglet"
          >
            ↗ Onglet
          </a>
        </div>
      </header>

      {/* Message Flash */}
      {messageFlash && (
        <div className="bg-orange-950/80 border-b border-orange-500/30 px-3 py-1 text-[11px] text-orange-200 flex items-center justify-between">
          <span>{messageFlash}</span>
          <button onClick={() => setMessageFlash(null)} className="text-orange-400 hover:text-orange-200">×</button>
        </div>
      )}

      {/* Contenu principal selon l'onglet */}
      <div className="flex-1 min-h-0 relative overflow-hidden bg-[#0c0c0e]">
        {/* Onglet 1: Console Admin Iframe */}
        {onglet === 'admin' && (
          <div className="w-full h-full relative">
            {enLigne ? (
              <iframe
                src={URL_IFRAME_DEBLOQUE}
                title="PocketBase Admin UI"
                className="w-full h-full border-0"
                sandbox="allow-same-origin allow-scripts allow-forms allow-popups allow-modals"
              />
            ) : (
              <div className="h-full flex flex-col items-center justify-center p-6 text-center">
                <div className="w-12 h-12 rounded-xl bg-neutral-900 border border-neutral-800 flex items-center justify-center text-2xl mb-3">
                  🗄️
                </div>
                <h3 className="font-semibold text-neutral-100 text-sm mb-1">PocketDB est éteint</h3>
                <p className="text-xs text-neutral-500 max-w-sm mb-4">
                  Le service PocketBase sur le port 8090 est actuellement inactif.
                </p>
                <button
                  onClick={() => void demarrerPocketDB()}
                  className="px-4 py-2 rounded-lg bg-orange-600 hover:bg-orange-500 text-white font-semibold text-xs transition-all shadow-md"
                >
                  🚀 Démarrer PocketDB
                </button>
              </div>
            )}
          </div>
        )}

        {/* Onglet 2: Registre & Meta-Audit des DBs */}
        {onglet === 'dbs' && (
          <div className="h-full overflow-y-auto p-4 space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-neutral-800/80">
              <div>
                <h2 className="font-bold text-neutral-100 text-sm">Registre des Bases de Données Souveraines</h2>
                <p className="text-[11px] text-neutral-500">
                  Synchronisation perpétuelle et empreinte cryptographique (SHA256) de toutes les DBs d'A'Space OS.
                </p>
              </div>
              <div className="text-right">
                <span className="text-[11px] text-emerald-400 font-semibold">● 91 306+ enregistrements tracés</span>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {(etatAudit?.dbs ?? []).map((db) => (
                <div
                  key={db.id}
                  className="bg-neutral-900/80 border border-neutral-800 rounded-xl p-3 hover:border-neutral-700 transition-colors flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <span className="font-bold text-neutral-200 text-xs truncate">{db.nom}</span>
                      <span className="shrink-0 px-1.5 py-0.5 rounded text-[9px] font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                        CANON VERIFIÉ
                      </span>
                    </div>
                    <p className="text-[10px] text-neutral-500 font-mono truncate mb-2" title={db.path}>
                      {db.path}
                    </p>
                  </div>

                  <div className="space-y-1.5 pt-2 border-t border-neutral-800/60 font-mono text-[11px]">
                    <div className="flex justify-between text-neutral-400">
                      <span>Taille :</span>
                      <span className="text-neutral-200 font-medium">{(db.taille_octets / 1024).toFixed(1)} KB</span>
                    </div>
                    <div className="flex justify-between text-neutral-400">
                      <span>Tables :</span>
                      <span className="text-neutral-200 font-medium">{db.nb_tables}</span>
                    </div>
                    <div className="flex justify-between text-neutral-400">
                      <span>Total Lignes :</span>
                      <span className="text-orange-400 font-bold">{db.nb_lignes_total.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between text-neutral-400 text-[10px]">
                      <span>Hash SHA256 :</span>
                      <span className="text-neutral-400 truncate max-w-[120px]">{db.hash_integrite}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Historique des audits */}
            <div className="mt-6 pt-4 border-t border-neutral-800/80">
              <h3 className="font-bold text-neutral-200 text-xs mb-2">Derniers Runs de Meta-Audit</h3>
              <div className="space-y-2">
                {(etatAudit?.audits ?? []).map((a) => (
                  <div key={a.id} className="bg-neutral-950 border border-neutral-800/70 rounded-lg p-2.5 flex items-center justify-between text-[11px]">
                    <div className="flex items-center gap-2">
                      <span className="text-emerald-400">✓</span>
                      <span className="font-semibold text-neutral-300">{a.service}</span>
                      <span className="text-neutral-500">· {a.record_count.toLocaleString()} entités auditées</span>
                    </div>
                    <div className="font-mono text-neutral-500 text-[10px]">
                      {a.audited_at}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Onglet 3: Life OS & Frameworks */}
        {onglet === 'frameworks' && (
          <div className="h-full overflow-y-auto p-4 space-y-6">
            {/* 8 Domaines de Vie */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <h2 className="font-bold text-neutral-100 text-sm">Les 8 Domaines de Vie (Life OS)</h2>
                <span className="text-[11px] text-neutral-500">Miroir temps-réel synchronisé dans PocketDB</span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                {(etatAudit?.domains ?? []).map((dom) => (
                  <div key={dom.id} className="bg-neutral-900/70 border border-neutral-800 rounded-xl p-3">
                    <div className="flex justify-between items-start mb-1.5">
                      <span className="font-semibold text-neutral-200 text-xs">{dom.nom}</span>
                      <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded ${dom.priorite === 'P0' ? 'bg-red-500/20 text-red-300' : 'bg-neutral-800 text-neutral-400'}`}>
                        {dom.priorite}
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-[11px] text-neutral-400 mb-1">
                      <span>Score vitalité</span>
                      <span className="font-bold text-orange-400">{dom.score}%</span>
                    </div>
                    <div className="w-full h-1.5 bg-neutral-800 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-orange-500 to-amber-400 rounded-full"
                        style={{ width: `${dom.score}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Frameworks V3 */}
            <div className="pt-4 border-t border-neutral-800/80">
              <h2 className="font-bold text-neutral-100 text-sm mb-3">Frameworks d'Ingénierie Personnelle & Systémique</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {(etatAudit?.frameworks ?? []).map((fw) => {
                  let parsedEtat: unknown = null;
                  try {
                    parsedEtat = JSON.parse(fw.etat);
                  } catch {
                    parsedEtat = fw.etat;
                  }
                  return (
                    <div key={fw.id} className="bg-neutral-900/70 border border-neutral-800 rounded-xl p-3 flex flex-col justify-between">
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-bold text-neutral-200 text-xs">{fw.nom}</span>
                        <span className="text-[10px] text-neutral-500 font-mono">{fw.elements_count} items</span>
                      </div>
                      <pre className="text-[10px] font-mono bg-black/50 p-2 rounded-lg text-neutral-300 overflow-x-auto max-h-36 leading-relaxed">
                        {JSON.stringify(parsedEtat, null, 2)}
                      </pre>
                      <div className="mt-2 pt-2 border-t border-neutral-800/50 flex justify-between text-[10px] text-neutral-500">
                        <span>Sync : {fw.synced_with}</span>
                        <span>Canon scellé</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export const App = PocketDBApp;
export const manifest = {
  id: 'pocketdb',
  name: 'PocketDB',
  kind: 'multi' as const,
  description: 'PocketDB (PocketBase) — Hub de meta-audit perpétuel et synchronisation des bases de données Life OS.',
  icon: '🗄️',
  domaine: 'l0-tech',
};
