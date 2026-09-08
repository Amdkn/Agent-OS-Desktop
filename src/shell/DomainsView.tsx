/**
 * DomainsView — la vue bureau par domaines, sur le gabarit Life OS.
 *
 * Ce que Life OS montre (menu latéral Overview/PASSION/MISSION/…, horizons
 * H1/H3, tuiles), Agent OS le transpose : Overview + L0 TECH / L1 LIFE /
 * L2 BUSINESS, avec une tuile par app. Une tuile ouvre la fenêtre de l'app
 * (le même openWindow que le dock) — la vue ne duplique rien, elle range.
 *
 * Les apps viennent du registre auto-détecté : ajouter un dossier sous
 * src/apps avec un manifest ajoute sa tuile ici sans éditer ce fichier.
 */

import { useMemo, useState } from 'react';
import type { AppManifest, DomaineId } from '../types';
import { grouperParDomaine } from './domaines';
import { useShell } from './store';

type Vue = 'overview' | DomaineId;

const ETIQUETTE_HORIZON: Record<string, string> = {
  H1: 'H1 · tenir aujourd’hui',
  H3: 'H3 · tenir 10 ans',
};

function Tuile({ app, onOpen }: { app: AppManifest; onOpen: (id: string) => void }) {
  return (
    <button
      onClick={() => onOpen(app.id)}
      title={app.description}
      className="group text-left rounded-xl border p-3 flex flex-col gap-1.5 transition-all hover:-translate-y-0.5"
      style={{
        background: 'rgba(15, 20, 34, 0.72)',
        borderColor: 'rgba(255, 255, 255, 0.09)',
        backdropFilter: 'blur(8px)',
      }}
    >
      <div className="flex items-center gap-2.5">
        <span
          className="w-9 h-9 rounded-lg flex items-center justify-center text-lg shrink-0"
          style={{ background: 'rgba(108, 240, 194, 0.10)', border: '1px solid rgba(108, 240, 194, 0.25)' }}
        >
          {app.icon}
        </span>
        <span className="font-semibold text-sm" style={{ color: 'var(--color-text)' }}>
          {app.name}
        </span>
      </div>
      <p className="text-[11px] leading-snug line-clamp-2" style={{ color: 'var(--color-text-dim)' }}>
        {app.description}
      </p>
      <span
        className="text-[10px] opacity-0 group-hover:opacity-100 transition-opacity font-mono"
        style={{ color: 'var(--color-accent)' }}
      >
        ouvrir ↗
      </span>
    </button>
  );
}

export function DomainsView({ apps }: { apps: AppManifest[] }) {
  const [vue, setVue] = useState<Vue>('overview');
  const open = useShell((s) => s.openWindow);
  const groupes = useMemo(() => grouperParDomaine(apps), [apps]);
  const actif = groupes.find((g) => g.domaine.id === vue);

  const entrees =
    vue === 'overview'
      ? groupes
      : actif
        ? [{ domaine: actif.domaine, apps: actif.apps }]
        : [];

  const compteParDomaine = new Map(groupes.map((g) => [g.domaine.id, g.apps.length]));

  return (
    <div
      className="absolute inset-0 flex overflow-hidden"
      style={{ background: 'rgba(5, 9, 19, 0.45)' }}
    >
      {/* Menu latéral — gabarit Life OS */}
      <nav
        className="w-56 shrink-0 flex flex-col border-r py-3 px-2 gap-0.5"
        style={{ background: 'rgba(8, 12, 24, 0.8)', borderColor: 'rgba(255,255,255,0.08)' }}
      >
        <div className="px-3 pb-2 text-[10px] font-mono tracking-[0.2em]" style={{ color: 'var(--color-text-dim)' }}>
          AGENT OS · DOMAINES
        </div>
        <SideItem
          actif={vue === 'overview'}
          onClick={() => setVue('overview')}
          icon="◈"
          nom="Overview"
          detail={`${apps.length} apps`}
        />
        {groupes.map(({ domaine }) => (
          <SideItem
            key={domaine.id}
            actif={vue === domaine.id}
            onClick={() => setVue(domaine.id)}
            icon={domaine.icon}
            nom={domaine.nom}
            detail={`${domaine.horizon} · ${compteParDomaine.get(domaine.id) ?? 0} apps`}
          />
        ))}
        <div className="flex-1" />
        <div className="px-3 text-[10px] leading-relaxed" style={{ color: 'var(--color-text-dim)' }}>
          Gabarit Life OS — les apps s'ajoutent toutes seules : un dossier sous
          src/apps avec un manifest, et la tuile apparaît ici.
        </div>
      </nav>

      {/* Contenu — horizons + tuiles CRAFT */}
      <div className="flex-1 overflow-y-auto p-6">
        {entrees.map(({ domaine, apps: appsDuDomaine }) => (
          <section key={domaine.id} className="mb-8 last:mb-0">
            <header className="mb-3">
              <div className="flex items-baseline gap-3">
                <h2 className="text-lg font-bold tracking-wide" style={{ color: 'var(--color-text)' }}>
                  {domaine.icon} {domaine.nom}
                </h2>
                <span
                  className="text-[10px] font-mono px-2 py-0.5 rounded-full"
                  style={{ background: 'rgba(108, 240, 194, 0.12)', color: 'var(--color-accent)' }}
                >
                  {ETIQUETTE_HORIZON[domaine.horizon] ?? domaine.horizon}
                </span>
              </div>
              <p className="text-xs mt-0.5" style={{ color: 'var(--color-text-dim)' }}>
                {domaine.description}
              </p>
            </header>
            <div className="grid gap-3" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))' }}>
              {appsDuDomaine.map((app) => (
                <Tuile key={app.id} app={app} onOpen={open} />
              ))}
            </div>
          </section>
        ))}
      </div>
    </div>
  );
}

function SideItem({
  actif,
  onClick,
  icon,
  nom,
  detail,
}: {
  actif: boolean;
  onClick: () => void;
  icon: string;
  nom: string;
  detail: string;
}) {
  return (
    <button
      onClick={onClick}
      className="flex items-center gap-2.5 px-3 py-2 rounded-lg text-left transition-colors"
      style={{
        background: actif ? 'rgba(108, 240, 194, 0.14)' : 'transparent',
        border: `1px solid ${actif ? 'rgba(108, 240, 194, 0.4)' : 'transparent'}`,
      }}
    >
      <span className="text-base w-5 text-center">{icon}</span>
      <span className="min-w-0">
        <span className="block text-xs font-bold tracking-widest" style={{ color: 'var(--color-text)' }}>
          {nom}
        </span>
        <span className="block text-[10px] font-mono" style={{ color: 'var(--color-text-dim)' }}>
          {detail}
        </span>
      </span>
    </button>
  );
}
