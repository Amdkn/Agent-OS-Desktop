/**
 * Workspace — le mini-SaaS du Rick's Verse.
 *
 * Session multi-tenant légère : le tenant = le profil Hermes choisi dans le
 * sélecteur. Chaque tenant garde sa propre conversation (état React isolé par
 * slug, persisté en localStorage). Toute l'intelligence passe par le gateway
 * LOCAL Hermes (127.0.0.1:8642 via le proxy /api/workspace) — zéro backend
 * distant.
 *
 * Renommage canonique (décision du conseil des Docteurs, 2026-09-01) :
 * les noms affichés vivent dans le mapping COMPAGNONS — le slug technique
 * reste la clé canonique (uc.db, dossiers, scripts), jamais modifié.
 */

import { useCallback, useEffect, useRef, useState } from 'react';

interface Tenant {
  slug: string;
  nom: string;
  role: string;
}

// Un seul mapping slug → nom affiché, chargé depuis mapping.json
// (arbitrage Docteurs 2026-09-01 : libellé seul change, slug = clé canonique).
import mappingJson from './mapping.json';

interface EntreeMapping { nom: string; role: string }

const MAPPING = mappingJson as Record<string, string | EntreeMapping>;

const SLUGS_AFFICHES = [
  'a0-amadeus',
  'yaz_spec_l0',
  'ryan_build_l0',
  'graham_spawn_l0',
  'doctor13_review_l0',
  'rick_governance_l0',
  'kernel_builder_a',
  'kernel_copier_b',
  'kernel_controller_c',
  'amy_spec_l1',
  'rory_build_l1',
  'river_spawn_l1',
  'doctor11_review_l1',
  'clara_spec_l2',
  'nardole_build_l2',
  'bill_spawn_l2',
  'doctor12_review_l2',
  'donna_dlq',
];

const COMPAGNONS: Tenant[] = SLUGS_AFFICHES.map((slug) => {
  const e = MAPPING[slug];
  if (!e || typeof e === 'string') {
    // A SOURCER : libellé absent du mapping — affiché tel quel, jamais inventé.
    return { slug, nom: slug, role: typeof e === 'string' ? e : 'A SOURCER' };
  }
  return { slug, nom: e.nom, role: e.role };
});

const CLE_STOCKAGE = 'workspace-tenant-messages';

interface Message { role: 'user' | 'assistant'; content: string }

type Etat = 'sonde' | 'vivant' | 'muet';

function chargerMessages(): Record<string, Message[]> {
  try {
    return JSON.parse(localStorage.getItem(CLE_STOCKAGE) || '{}') as Record<string, Message[]>;
  } catch {
    return {};
  }
}

export function WorkspaceApp() {
  const [tenant, setTenant] = useState<Tenant>(COMPAGNONS[0]);
  const [messages, setMessages] = useState<Record<string, Message[]>>(chargerMessages);
  const [saisie, setSaisie] = useState('');
  const [etat, setEtat] = useState<Etat>('sonde');
  const [occupe, setOccupe] = useState(false);
  const fil = useRef<HTMLDivElement>(null);

  const sonder = useCallback(async () => {
    try {
      const r = await fetch('/api/workspace/health', { cache: 'no-store' });
      setEtat(r.ok ? 'vivant' : 'muet');
    } catch {
      setEtat('muet');
    }
  }, []);

  useEffect(() => {
    void sonder();
    const id = setInterval(() => void sonder(), 10000);
    return () => clearInterval(id);
  }, [sonder]);

  useEffect(() => {
    fil.current?.scrollTo(0, fil.current.scrollHeight);
  }, [messages, tenant]);

  // Persistance par tenant : chaque profil retrouve sa session au rechargement.
  useEffect(() => {
    localStorage.setItem(CLE_STOCKAGE, JSON.stringify(messages));
  }, [messages]);

  const envoyer = async () => {
    const texte = saisie.trim();
    if (!texte || occupe) return;
    setSaisie('');
    setOccupe(true);
    const historique = messages[tenant.slug] || [];
    const suivants: Message[] = [...historique, { role: 'user', content: texte }];
    setMessages((m) => ({ ...m, [tenant.slug]: suivants }));
    try {
      const r = await fetch('/api/workspace/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'X-Tenant': tenant.slug },
        body: JSON.stringify({
          model: 'hermes-agent',
          messages: suivants.map((m) => ({ role: m.role, content: m.content })),
        }),
      });
      const j = (await r.json()) as {
        choices?: Array<{ message?: { content?: string } }>;
        erreur?: string;
      };
      const reponse = j.choices?.[0]?.message?.content || `Erreur: ${j.erreur || r.status}`;
      setMessages((m) => ({
        ...m,
        [tenant.slug]: [...suivants, { role: 'assistant', content: reponse }],
      }));
      localStorage.setItem(CLE_STOCKAGE, JSON.stringify(messages));
    } catch {
      setMessages((m) => ({
        ...m,
        [tenant.slug]: [...suivants, { role: 'assistant', content: 'Gateway local injoignable.' }],
      }));
    } finally {
      setOccupe(false);
    }
  };

  const filTenant = messages[tenant.slug] || [];
  const pastille =
    etat === 'vivant' ? 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.7)]'
    : etat === 'muet' ? 'bg-red-500'
    : 'bg-amber-400 animate-pulse';

  return (
    <div className="flex h-full flex-col text-xs bg-[#09090b] text-neutral-200 select-none overflow-hidden font-mono">
      {/* Barre de statut */}
      <header className="shrink-0 h-10 px-3 border-b border-neutral-800/80 bg-neutral-950/95 flex items-center justify-between gap-2 z-10">
        <div className="flex items-center gap-2 min-w-0 truncate">
          <span className={`h-2.5 w-2.5 rounded-full shrink-0 ${pastille}`} aria-hidden />
          {/* Titre dynamique : le tenant courant est visible en permanence (P2) */}
          <span className="font-bold text-neutral-100 truncate text-[11px]">
            Hermes Chat API · {tenant.nom} — {tenant.role}
          </span>
          <span className="text-[10px] text-neutral-500 truncate hidden md:inline">
            · gateway local 8642 · {etat === 'vivant' ? 'répond' : etat === 'muet' ? 'éteint' : 'sonde…'}
          </span>
        </div>
        <div className="flex items-center gap-1 shrink-0">
          {/* Le sélecteur de tenant : le cœur du multi-tenant léger */}
          <select
            value={tenant.slug}
            onChange={(e) => {
              const t = COMPAGNONS.find((c) => c.slug === e.target.value);
              if (t) setTenant(t);
            }}
            className="px-2 py-1 rounded-md bg-neutral-900 border border-neutral-800 text-neutral-200 text-[11px] outline-none focus:border-orange-500/60"
            title="Tenant = profil Hermes"
          >
            {COMPAGNONS.map((c) => (
              <option key={c.slug} value={c.slug}>
                {c.nom} · {c.role}
              </option>
            ))}
          </select>
          <button
            onClick={() => void sonder()}
            className="px-2 py-1 rounded-md bg-neutral-900 hover:bg-neutral-800 border border-neutral-800 text-neutral-400 hover:text-neutral-200 transition-colors text-[11px]"
            title="Tester le gateway local"
          >
            Sonder
          </button>
          <button
            onClick={() => setMessages((m) => ({ ...m, [tenant.slug]: [] }))}
            className="px-2 py-1 rounded-md bg-neutral-900 hover:bg-neutral-800 border border-neutral-800 text-neutral-400 hover:text-neutral-200 transition-colors text-[11px]"
            title="Vider la conversation du tenant courant"
          >
            Recharger
          </button>
        </div>
      </header>

      {/* Fil de conversation du tenant courant */}
      <div ref={fil} className="flex-1 min-h-0 overflow-y-auto px-3 py-3 space-y-2 bg-[#08080a]">
        {filTenant.length === 0 && (
          <div className="h-full flex items-center justify-center">
            <p className="text-[11px] text-neutral-600 text-center">
              Session de <span className="text-neutral-400">{tenant.nom}</span> — écris pour parler au
              gateway local (profil <code className="text-orange-400">{tenant.slug}</code>).
            </p>
          </div>
        )}
        {filTenant.map((m, i) => (
          <div
            key={i}
            className={`max-w-[85%] rounded-xl px-3 py-2 leading-relaxed whitespace-pre-wrap ${
              m.role === 'user'
                ? 'ml-auto bg-orange-600/90 text-white rounded-br-sm'
                : 'mr-auto bg-neutral-900 border border-neutral-800 text-neutral-200 rounded-bl-sm'
            }`}
          >
            {m.content}
          </div>
        ))}
        {occupe && (
          <div className="mr-auto bg-neutral-900 border border-neutral-800 rounded-xl px-3 py-2 text-neutral-500 animate-pulse">
            …
          </div>
        )}
      </div>

      {/* Saisie */}
      <footer className="shrink-0 border-t border-neutral-900 bg-neutral-950 p-2 flex items-center gap-2">
        <input
          value={saisie}
          onChange={(e) => setSaisie(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
              e.preventDefault();
              void envoyer();
            }
          }}
          placeholder={`Message pour ${tenant.nom}…`}
          className="flex-1 px-3 py-2 rounded-lg bg-neutral-900 border border-neutral-800 text-[12px] text-neutral-100 outline-none focus:border-orange-500/60 placeholder:text-neutral-600"
        />
        <button
          onClick={() => void envoyer()}
          disabled={occupe || !saisie.trim()}
          className="px-3 py-2 rounded-lg bg-orange-600 hover:bg-orange-500 disabled:opacity-40 text-white font-bold text-[11px] transition-all"
        >
          Envoyer
        </button>
        <span className="text-[10px] text-neutral-600 shrink-0 hidden lg:inline">
          tenant: {tenant.slug}
        </span>
      </footer>
    </div>
  );
}

// (supprimé : reliquat cadreVierge)

export const App = WorkspaceApp;
export const manifest = {
  id: 'workspace',
  name: 'Hermes Chat API',
  kind: 'multi' as const,
  description: 'Chat API multi-tenant connecté au gateway local Hermes (8642).',
  icon: '💬',
  domaine: 'l0-tech',
};
