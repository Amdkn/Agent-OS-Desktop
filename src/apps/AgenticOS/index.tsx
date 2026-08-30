/**
 * Agentic OS — le centre de commande ARMS.
 *
 * LE CADRE
 * ARMS (Jay E / RoboNuggets) : Applications, Routines, Memory, Skills, plus
 * la couche bonus du guide -- le centre de commande visuel.
 *
 * CE QUE LA LECON DEMANDE, ET QU'ON A D'ABORD MANQUE
 * La premiere version ne portait que le cadre : quatre listes. Or la lecon
 * decrit surtout des WIDGETS -- un deck de skills declenchables, un tableau
 * de routines TIME/ROUTINE/STATUS, des artefacts a un clic, une horloge
 * multi-fuseaux. Le cadre sans les widgets, c'est le squelette sans la chair.
 *
 * CE QU'ON REFUSE DE FABRIQUER
 * La lecon montre aussi un widget e-mail et un calendrier connecte. Aucun
 * connecteur correspondant n'est cable ici : les afficher avec des chiffres
 * inventes donnerait un tableau de bord plus joli et faux. Ils sont absents,
 * et cette absence est ecrite a l'ecran.
 *
 * LE PRINCIPE QUI COMMANDE TOUT
 * « Show, do not store. » Chaque point de chaque anneau, chaque ligne de
 * chaque tableau est un fichier ou une tache reelle, relue a l'ouverture.
 * Rien ne se saisit ici.
 */

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

interface Skill {
  nom: string; fichiers: number; lignes: number;
  arbre: boolean; trop_longue: boolean; lien: boolean; a_skill_md: boolean;
}
interface Routeur {
  role: string; auto: boolean; nom: string; chemin: string; present: boolean;
  octets: number; lignes: number; tokens_estimes: number; modifie: string | null;
}
interface Tache {
  nom: string; chemin: string; etat: string;
  prochain: string | null; dernier: string | null; resultat: number | null;
}
interface Connecteur { nom: string; transport: string; cible: string; }
interface Artefact { nom: string; chemin: string; octets: number; modifie: string; }

interface Etat {
  lu_a: string;
  skills: {
    total: number; arbres: number; liens: number; sans_skill_md: number;
    epaisses: number; niveau: number; niveau3_note: string; items: Skill[];
  };
  memoire: {
    routeurs: Routeur[]; presents: number; niveau: number; niveau3_preuve: string;
    tokens_demarrage: number; tokens_a_la_demande: number;
  };
  routines: {
    total: number | null; actives?: number; en_echec?: number; niveau?: number;
    erreur?: string; niveau2_note?: string; items: Tache[];
  };
  applications: {
    total: number; http: number; stdio: number;
    micro_apps: string[]; niveau: number; items: Connecteur[];
  };
  artefacts: { total: number; items: Artefact[] };
}

/* ------------------------------------------------------------------ anneaux */

const CX = 300, CY = 300;

/** Place n points sur un cercle, en partant du haut : un anneau qui commence
 *  a droite se lit mal, l'oeil cherche le nord. */
function surCercle(n: number, r: number, i: number) {
  const a = (-90 + (360 / Math.max(n, 1)) * i) * (Math.PI / 180);
  return { x: CX + r * Math.cos(a), y: CY + r * Math.sin(a) };
}

function Anneau({ r, label }: { r: number; label: string }) {
  return (
    <>
      <circle cx={CX} cy={CY} r={r} fill="none" stroke="#27272a" strokeWidth="1" />
      <text x={CX} y={CY - r - 7} textAnchor="middle"
        className="fill-neutral-600 text-[9px] tracking-[0.2em] uppercase">{label}</text>
    </>
  );
}

/* ------------------------------------------------------------ canvas infini */

interface Vue2D { x: number; y: number; k: number; }

/** La position des cartes survit au rechargement. `localStorage` leve sur une
 *  origine opaque (`file://`, `data:`) : sans ce try/catch, une seule
 *  exception rendrait la page blanche -- piege deja paye sur ce poste. */
function lireDisposition(): Record<string, { x: number; y: number }> {
  try { return JSON.parse(localStorage.getItem('agentic-os:canvas') ?? '{}'); }
  catch { return {}; }
}
function ecrireDisposition(d: Record<string, { x: number; y: number }>) {
  try { localStorage.setItem('agentic-os:canvas', JSON.stringify(d)); } catch { /* sans effet */ }
}

/**
 * Le plan de travail infini du guide — le « landing pad » ou les artefacts
 * produits par les agents se posent et se rangent a la main.
 *
 * Il est DERRIERE le reste : les anneaux ARMS flottent dessus, a l'origine.
 * Molette pour zoomer au curseur, glisser le fond pour deplacer, glisser une
 * carte pour la placer. La disposition se garde entre deux sessions.
 */
function Canvas({ enfants, cartes, surCarte }: {
  enfants: React.ReactNode;
  cartes: Array<{ id: string; nom: string; meta: string; html: boolean }>;
  surCarte: (id: string) => void;
}) {
  const [v, setV] = useState<Vue2D>({ x: 0, y: 0, k: 1 });
  const [pos, setPos] = useState<Record<string, { x: number; y: number }>>(lireDisposition);
  const [glisse, setGlisse] = useState<{ id: string | null; dx: number; dy: number } | null>(null);
  const boite = useRef<HTMLDivElement>(null);

  /** Centre l'origine du plan dans la fenetre. Sans ca, la vue demarre a
   *  (0,0) et l'anneau -- qui est centre sur l'origine -- apparait coupe dans
   *  le coin superieur gauche. On mesure le conteneur au lieu de coder une
   *  taille en dur, qui serait fausse des le premier redimensionnement. */
  const centrer = useCallback(() => {
    const r = boite.current?.getBoundingClientRect();
    if (r) setV({ x: r.width / 2, y: r.height / 2, k: 1 });
  }, []);

  // Recentre tant que l'utilisateur n'a pas touche a la vue. Sans ca, le plan
  // est centre sur la largeur qu'avait le conteneur AVANT que les panneaux
  // lateraux se retirent -- l'anneau reste alors colle a gauche. Une fois la
  // vue deplacee a la main, on ne la bouge plus : rien n'est plus agacant
  // qu'un plan qui se recadre tout seul pendant qu'on travaille dessus.
  const touche = useRef(false);
  useEffect(() => {
    const el = boite.current;
    if (!el) return;
    centrer();
    const ro = new ResizeObserver(() => { if (!touche.current) centrer(); });
    ro.observe(el);
    return () => ro.disconnect();
  }, [centrer]);

  // Une carte jamais placee recoit une position en spirale autour de l'origine :
  // les empiler toutes en (0,0) rendrait le plan inutilisable au premier chargement.
  const placer = useCallback((id: string, i: number) => {
    if (pos[id]) return pos[id];
    const a = i * 0.9, r = 330 + i * 26;
    return { x: Math.cos(a) * r, y: Math.sin(a) * r * 0.62 };
  }, [pos]);

  const molette = useCallback((e: React.WheelEvent) => {
    e.preventDefault();
    touche.current = true;
    const r = e.currentTarget.getBoundingClientRect();
    const mx = e.clientX - r.left, my = e.clientY - r.top;
    setV((p) => {
      const k = Math.min(3, Math.max(0.15, p.k * (e.deltaY < 0 ? 1.12 : 1 / 1.12)));
      // Zoom ancre au curseur : sans cette correction, le contenu fuit hors
      // de l'ecran des le deuxieme cran de molette.
      return { k, x: mx - (mx - p.x) * (k / p.k), y: my - (my - p.y) * (k / p.k) };
    });
  }, []);

  const bas = useCallback((e: React.PointerEvent, id: string | null) => {
    if (e.button !== 0) return;
    if (!id) touche.current = true;
    e.currentTarget.setPointerCapture?.(e.pointerId);
    if (id) {
      const p = pos[id] ?? { x: 0, y: 0 };
      setGlisse({ id, dx: e.clientX - p.x * v.k, dy: e.clientY - p.y * v.k });
    } else {
      setGlisse({ id: null, dx: e.clientX - v.x, dy: e.clientY - v.y });
    }
  }, [pos, v]);

  const bouge = useCallback((e: React.PointerEvent) => {
    if (!glisse) return;
    if (glisse.id) {
      setPos((p) => ({ ...p, [glisse.id!]: {
        x: (e.clientX - glisse.dx) / v.k, y: (e.clientY - glisse.dy) / v.k,
      } }));
    } else {
      setV((p) => ({ ...p, x: e.clientX - glisse.dx, y: e.clientY - glisse.dy }));
    }
  }, [glisse, v.k]);

  const haut = useCallback(() => {
    if (glisse?.id) ecrireDisposition(pos);
    setGlisse(null);
  }, [glisse, pos]);

  return (
    <div ref={boite}
      className="absolute inset-0 overflow-hidden cursor-grab active:cursor-grabbing"
      onWheel={molette} onPointerDown={(e) => bas(e, null)}
      onPointerMove={bouge} onPointerUp={haut} onPointerLeave={haut}
      style={{
        // La trame se deplace et se dilate avec la vue : une grille fixe
        // ferait croire que rien ne bouge pendant un deplacement.
        backgroundImage: 'radial-gradient(circle, #262629 1px, transparent 1px)',
        backgroundSize: `${28 * v.k}px ${28 * v.k}px`,
        backgroundPosition: `${v.x}px ${v.y}px`,
      }}>
      <div className="absolute origin-top-left"
        style={{ transform: `translate(${v.x}px, ${v.y}px) scale(${v.k})` }}>
        <div className="absolute" style={{ left: -300, top: -300 }}>{enfants}</div>

        {cartes.map((c, i) => {
          const p = placer(c.id, i);
          return (
            <div key={c.id}
              onPointerDown={(e) => { e.stopPropagation(); bas(e, c.id); }}
              onDoubleClick={() => surCarte(c.id)}
              className="absolute w-52 rounded border border-neutral-800 bg-neutral-900/95
                         hover:border-neutral-600 px-2 py-1.5 cursor-move select-none"
              style={{ left: p.x, top: p.y }}>
              <div className="flex items-start gap-1.5">
                <span className={`text-[10px] mt-0.5 ${c.html ? 'text-cyan-500' : 'text-neutral-600'}`}>
                  {c.html ? '◧' : '≡'}
                </span>
                <div className="min-w-0 flex-1">
                  <div className="text-[11px] text-neutral-200 truncate">{c.nom}</div>
                  <div className="text-[9px] text-neutral-600 truncate">{c.meta}</div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <div className="absolute bottom-0 inset-x-0 h-6 flex items-center gap-3 px-3
                      bg-neutral-950/85 border-t border-neutral-900 text-[10px] text-neutral-600">
        <button onPointerDown={(e) => e.stopPropagation()}
          onClick={(e) => { e.stopPropagation(); touche.current = false; centrer(); }}
          className="px-1.5 rounded border border-neutral-800 hover:border-neutral-600">recentrer</button>
        <span className="truncate flex-1">molette : zoom · glisser le fond : déplacer · glisser une carte : ranger</span>
        <span className="tabular-nums text-neutral-500 shrink-0">{Math.round(v.k * 100)} %</span>
      </div>
    </div>
  );
}

/* ----------------------------------------------------------------- horloge */

/** Les fuseaux du guide, adaptes : le poste est en Ohio (ET). On calcule par
 *  Intl plutot que par un decalage en dur -- un offset code en dur devient
 *  faux deux fois par an, au changement d'heure. */
const FUSEAUX = [
  { nom: 'ici · ET', tz: 'America/New_York' },
  { nom: 'PT', tz: 'America/Los_Angeles' },
  { nom: 'Londres', tz: 'Europe/London' },
  { nom: 'Sydney', tz: 'Australia/Sydney' },
];

function semaineISO(d: Date) {
  const t = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
  t.setUTCDate(t.getUTCDate() + 4 - (t.getUTCDay() || 7));
  const j1 = new Date(Date.UTC(t.getUTCFullYear(), 0, 1));
  return Math.ceil(((t.getTime() - j1.getTime()) / 86400000 + 1) / 7);
}

function Horloge() {
  const [t, setT] = useState(() => new Date());
  useEffect(() => {
    const id = setInterval(() => setT(new Date()), 1000);
    return () => clearInterval(id);
  }, []);
  return (
    <div className="px-3 py-2 border-b border-neutral-900">
      <div className="flex items-baseline gap-2">
        <span className="text-[10px] tracking-widest uppercase text-orange-500">
          S{semaineISO(t)}
        </span>
        <span className="text-[10px] text-neutral-500">
          {t.toLocaleDateString('fr-FR', { weekday: 'short', day: 'numeric', month: 'short' })}
        </span>
      </div>
      <div className="text-2xl tabular-nums text-neutral-100 leading-tight">
        {t.toLocaleTimeString('fr-FR')}
      </div>
      <div className="grid grid-cols-2 gap-x-3 mt-1">
        {FUSEAUX.map((f) => (
          <div key={f.tz} className="flex justify-between text-[10px]">
            <span className="text-neutral-600">{f.nom}</span>
            <span className="text-neutral-400 tabular-nums">
              {t.toLocaleTimeString('fr-FR', { timeZone: f.tz, hour: '2-digit', minute: '2-digit' })}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

/* -------------------------------------------------------------------- vues */

function Niveau({ n, note }: { n: number | undefined; note?: string }) {
  if (!n) return <span className="text-[10px] text-neutral-600">non mesuré</span>;
  return (
    <span className="inline-flex items-center gap-0.5 align-middle" title={note}>
      {[1, 2, 3].map((i) => (
        <span key={i} className={`w-1 h-1 rounded-full ${i <= n ? 'bg-orange-500' : 'bg-neutral-700'}`} />
      ))}
    </span>
  );
}

function Bloc({ lettre, titre, niveau, note, children }: {
  lettre?: string; titre: string; niveau?: number; note?: string; children: React.ReactNode;
}) {
  return (
    <section className="border-b border-neutral-900 last:border-0">
      <header className="px-3 py-1.5 flex items-center gap-2 sticky top-0 bg-neutral-950/95 backdrop-blur z-10">
        {lettre && <span className="text-orange-500 font-mono text-xs">{lettre}</span>}
        <h2 className="text-[11px] tracking-wide uppercase text-neutral-400 flex-1">{titre}</h2>
        {niveau !== undefined && <Niveau n={niveau} note={note} />}
      </header>
      <div className="px-3 pb-3">{children}</div>
    </section>
  );
}

const heure = (iso: string | null) =>
  iso ? new Date(iso).toLocaleString('fr-FR', {
    day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit',
  }) : '—';

export function AgenticOSApp() {
  const [etat, setEtat] = useState<Etat | null>(null);
  const [erreur, setErreur] = useState<string | null>(null);
  const racine = useRef<HTMLDivElement>(null);
  const [large, setLarge] = useState(0);

  /** Deux panneaux fixes de 17 rem plus un centre : sous ~1100 px, le centre
   *  est ecrase a une bande inutilisable et les textes se coupent au milieu
   *  des mots. On mesure la largeur REELLE du conteneur plutot que celle de
   *  l'ecran -- l'app vit dans une fenetre du bureau, pas en plein ecran. */
  // `etat` en dependance, et ce n'est pas cosmetique : au premier rendu l'app
  // renvoie « Lecture du disque… », donc `racine.current` est nul et
  // l'observateur ne s'attache jamais. `large` restait a 0, les deux panneaux
  // restaient affiches, et le centre restait ecrase -- le defaut visible a
  // l'ecran alors que le code semblait correct.
  useEffect(() => {
    const el = racine.current;
    if (!el) return;
    setLarge(el.getBoundingClientRect().width);
    const ro = new ResizeObserver(([e]) => setLarge(e.contentRect.width));
    ro.observe(el);
    return () => ro.disconnect();
  }, [etat]);
  const montreGauche = large === 0 || large >= 900;
  const montreDroite = large === 0 || large >= 1180;
  const [survol, setSurvol] = useState<{ t: string; d: string } | null>(null);
  const [course, setCourse] = useState<{ nom: string; sortie?: string; ok?: boolean } | null>(null);
  const [vue, setVue] = useState<{ chemin: string; nom: string; contenu: string; html: boolean } | null>(null);

  /** Le « landing pad » de la lecon : l'artefact s'ouvre ici, pas dans un
   *  explorateur. On passe par /api/corpus/fichier, deja borne a la racine V3
   *  et en lecture seule -- ouvrir une seconde porte serait une seconde faille. */
  const ouvrir = useCallback((a: { chemin: string; nom: string }) => {
    setVue({ chemin: a.chemin, nom: a.nom, contenu: '…', html: /\.html?$/i.test(a.nom) });
    fetch(`/api/corpus/fichier?f=${encodeURIComponent(a.chemin)}`)
      .then((r) => r.json())
      .then((f: { contenu?: string; erreur?: string }) =>
        setVue({
          chemin: a.chemin, nom: a.nom,
          contenu: f.contenu ?? `illisible : ${f.erreur ?? 'inconnu'}`,
          html: /\.html?$/i.test(a.nom),
        }))
      .catch((e: Error) => setVue({ chemin: a.chemin, nom: a.nom, contenu: e.message, html: false }));
  }, []);

  const charger = useCallback(() => {
    setErreur(null);
    fetch('/api/arms/etat')
      .then((r) => (r.ok ? r.json() : Promise.reject(new Error(`HTTP ${r.status}`))))
      .then(setEtat)
      .catch((e: Error) => setErreur(e.message));
  }, []);

  useEffect(() => {
    charger();
    if (import.meta.hot) {
      import.meta.hot.on('corpus:change', charger);
      return () => { import.meta.hot?.off('corpus:change', charger); };
    }
  }, [charger]);

  /** Declenche une skill hors session, comme le `-p` de la lecon. Le nom est
   *  valide cote serveur contre les dossiers reels : la page ne peut pas
   *  faire executer autre chose qu'une skill existante. */
  const lancer = useCallback((nom: string) => {
    setCourse({ nom });
    fetch('/api/arms/lancer', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ nom, modele: 'glm' }),
    })
      .then((r) => r.json())
      .then((r: { ok: boolean; sortie: string }) =>
        setCourse({ nom, ok: r.ok, sortie: r.sortie }))
      .catch((e: Error) => setCourse({ nom, ok: false, sortie: e.message }));
  }, []);

  const noeuds = useMemo(() => {
    if (!etat) return null;
    const { memoire, skills, routines } = etat;
    return {
      memoire: memoire.routeurs.map((r, i) => ({ ...r, ...surCercle(memoire.routeurs.length, 92, i) })),
      skills: skills.items.map((s, i) => ({ ...s, ...surCercle(skills.items.length, 165, i) })),
      routines: routines.items.map((t, i) => ({ ...t, ...surCercle(routines.items.length, 238, i) })),
    };
  }, [etat]);

  if (erreur) {
    return (
      <div className="p-4 text-sm text-red-400">
        <p>L&apos;API ARMS ne répond pas : {erreur}</p>
        <p className="text-neutral-500 mt-2 text-xs">
          Servie par <code>tools/arms-api.ts</code>. On affiche l&apos;erreur plutôt
          qu&apos;une page vide : un tableau muet ferait croire à un système sans
          skills ni routines.
        </p>
      </div>
    );
  }
  if (!etat || !noeuds) return <div className="p-4 text-sm text-neutral-500">Lecture du disque…</div>;

  const { skills, memoire, routines, applications, artefacts } = etat;

  return (
    <div ref={racine}
      className="h-full flex bg-neutral-950 text-neutral-300 overflow-hidden text-[13px]
                 [&_*::-webkit-scrollbar]:w-1.5 [&_*::-webkit-scrollbar]:h-1.5
                 [&_*::-webkit-scrollbar-track]:bg-transparent
                 [&_*::-webkit-scrollbar-thumb]:bg-neutral-800 [&_*::-webkit-scrollbar-thumb]:rounded">

      {/* ================================================= colonne gauche */}
      {montreGauche && (
      <aside className="w-[17rem] shrink-0 border-r border-neutral-900 overflow-auto">
        <Horloge />

        <Bloc titre="Skills deck">
          <p className="text-[10px] text-neutral-600 mb-2 leading-snug">
            Déclenche la skill hors session via <code>claude-glm</code> — hors quota
            Anthropic. Le nom est validé côté serveur contre les dossiers réels.
          </p>
          <div className="space-y-1.5">
            {skills.items.filter((s) => s.a_skill_md).map((s) => (
              <div key={s.nom}
                className="border border-neutral-800 rounded px-2 py-1.5 flex items-center gap-2">
                <div className="flex-1 min-w-0">
                  <div className="text-xs text-neutral-200 truncate">/{s.nom}</div>
                  <div className="text-[9px] text-neutral-600 tracking-wide uppercase">
                    glm · {s.lignes} lignes
                  </div>
                </div>
                <button onClick={() => lancer(s.nom)}
                  disabled={course?.nom === s.nom && course.sortie === undefined}
                  className="text-[10px] px-2 py-1 rounded border border-orange-800 text-orange-400
                             hover:bg-orange-950 disabled:opacity-40 shrink-0">
                  {course?.nom === s.nom && course.sortie === undefined ? '…' : '▶'}
                </button>
              </div>
            ))}
          </div>
          {course?.sortie !== undefined && (
            <div className="mt-2 border border-neutral-800 rounded p-2">
              <div className={`text-[10px] mb-1 ${course.ok ? 'text-green-500' : 'text-red-400'}`}>
                /{course.nom} — {course.ok ? 'terminé' : 'échec'}
              </div>
              <pre className="text-[9px] text-neutral-500 whitespace-pre-wrap max-h-32 overflow-auto">
                {course.sortie}
              </pre>
            </div>
          )}
        </Bloc>

        <Bloc titre={`Artefacts · ${artefacts.total}`}>
          <p className="text-[10px] text-neutral-600 mb-2 leading-snug">
            Ce que les agents ont produit, le plus récent d&apos;abord.
            <b className="text-neutral-500"> Cliquer ouvre</b> — la leçon est nette :
            « artifacts, one click away, each opening on click ».
          </p>
          <ul className="space-y-1">
            {artefacts.items.map((a) => (
              <li key={a.chemin}>
                <button onClick={() => ouvrir(a)} title={a.chemin}
                  className={`w-full text-left text-xs px-1 py-0.5 rounded hover:bg-neutral-900 ${
                    vue?.chemin === a.chemin ? 'bg-neutral-900' : ''}`}>
                  <div className="truncate text-neutral-300">{a.nom}</div>
                  <div className="flex justify-between text-[9px] text-neutral-600">
                    <span className="truncate">{a.chemin.split('/').slice(0, -1).join('/')}</span>
                    <span className="tabular-nums shrink-0 ml-2">
                      {new Date(a.modifie).toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit' })}
                    </span>
                  </div>
                </button>
              </li>
            ))}
          </ul>
        </Bloc>
      </aside>
      )}

      {/* ================================================== le centre radial */}
      <div className="flex-1 min-w-0 relative flex flex-col">
        <div className="px-4 py-2 flex items-center gap-3 shrink-0 border-b border-neutral-900">
          <h1 className="text-sm text-neutral-200">
            Agentic OS <span className="text-neutral-600">· ARMS</span>
          </h1>
          <span className="text-[11px] text-neutral-600 flex-1 truncate">
            lu à {new Date(etat.lu_a).toLocaleTimeString('fr-FR')} — rien n&apos;est stocké ici
          </span>
          <button onClick={charger}
            className="text-[11px] px-2 py-0.5 rounded border border-neutral-800 hover:border-neutral-600">
            relire
          </button>
        </div>

        <div className="flex-1 min-h-0 relative">
          <Canvas
            cartes={artefacts.items.map((a) => ({
              id: a.chemin,
              nom: a.nom,
              meta: `${new Date(a.modifie).toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit' })} · ${Math.round(a.octets / 1024)} Ko`,
              html: /\.html?$/i.test(a.nom),
            }))}
            surCarte={(id) => {
              const a = artefacts.items.find((x) => x.chemin === id);
              if (a) ouvrir(a);
            }}
            enfants={
          <svg width={600} height={600} viewBox="0 0 600 600">
            <Anneau r={92} label="memory" />
            <Anneau r={165} label="skills" />
            <Anneau r={238} label="routines" />

            {noeuds.memoire.map((r) => (
              <line key={`l${r.chemin}`} x1={CX} y1={CY} x2={r.x} y2={r.y}
                stroke={r.present ? '#ea580c' : '#3f3f46'} strokeWidth="0.5" opacity="0.5" />
            ))}

            {noeuds.routines.map((t, i) => (
              <circle key={`r${i}`} cx={t.x} cy={t.y} r="2.5"
                className={t.etat === 'désactivée' ? 'fill-neutral-700'
                  : t.etat === 'en cours' ? 'fill-green-500' : 'fill-orange-500/60'}
                onMouseEnter={() => setSurvol({ t: t.nom, d: `routine · ${t.etat} · prochain ${heure(t.prochain)}` })}
                onMouseLeave={() => setSurvol(null)} />
            ))}

            {noeuds.skills.map((s) => (
              <g key={`s${s.nom}`}
                onMouseEnter={() => setSurvol({
                  t: `/${s.nom}`,
                  d: `${s.fichiers} fichiers · ${s.a_skill_md ? `${s.lignes} lignes` : 'pas de SKILL.md'}${s.lien ? ' · lien' : ''}`,
                })}
                onMouseLeave={() => setSurvol(null)}>
                <circle cx={s.x} cy={s.y} r={s.arbre ? 6 : 4}
                  className={s.a_skill_md ? 'fill-purple-500/80' : 'fill-amber-600/80'} />
                <text x={s.x} y={s.y - 11} textAnchor="middle"
                  className="fill-neutral-500 text-[8px]">{s.nom}</text>
              </g>
            ))}

            {noeuds.memoire.map((r) => (
              <g key={`m${r.chemin}`}
                onMouseEnter={() => setSurvol({
                  t: r.nom,
                  d: `${r.role} · ${r.lignes} lignes · ${r.auto ? 'chargé chaque session' : 'lu à la demande'}`,
                })}
                onMouseLeave={() => setSurvol(null)}>
                <circle cx={r.x} cy={r.y} r={r.auto ? 7 : 5}
                  className={r.present ? 'fill-orange-500' : 'fill-red-600'} />
                <text x={r.x} y={r.y - 12} textAnchor="middle"
                  className="fill-neutral-400 text-[8px]">{r.nom.replace('.md', '')}</text>
              </g>
            ))}

            <circle cx={CX} cy={CY} r="46" className="fill-neutral-900 stroke-orange-600" strokeWidth="1.5" />
            <text x={CX} y={CY - 6} textAnchor="middle" className="fill-orange-500 text-[11px] font-mono">
              CLAUDE.md
            </text>
            <text x={CX} y={CY + 8} textAnchor="middle" className="fill-neutral-500 text-[8px]">
              routeur maître
            </text>
            <text x={CX} y={CY + 20} textAnchor="middle" className="fill-neutral-600 text-[8px] tabular-nums">
              ~{memoire.tokens_demarrage.toLocaleString('fr-FR')} tok
            </text>
          </svg>
            } />

          <div className="absolute bottom-8 left-3 right-3 h-8 pointer-events-none">
            {survol && (
              <div className="text-xs">
                <span className="text-neutral-200">{survol.t}</span>
                <span className="text-neutral-500 ml-2">{survol.d}</span>
              </div>
            )}
          </div>

          {/* Le landing pad : l'artefact se lit ici, par-dessus l'anneau, et
              se referme d'un clic. Il RECOUVRE plutot que de pousser le reste :
              une mise en page qui saute a chaque ouverture fatigue vite. */}
          {vue && (
            <div className="absolute inset-0 bg-neutral-950/97 flex flex-col">
              <div className="px-3 py-1.5 border-b border-neutral-800 flex items-center gap-2 shrink-0">
                <span className="text-xs text-neutral-200 truncate flex-1">{vue.nom}</span>
                <span className="text-[10px] text-neutral-600 truncate max-w-[16rem]">{vue.chemin}</span>
                <button onClick={() => setVue(null)}
                  className="text-[11px] px-2 py-0.5 rounded border border-neutral-800 hover:border-neutral-600 shrink-0">
                  fermer
                </button>
              </div>
              {vue.html ? (
                // `sandbox` sans `allow-same-origin` : un artefact HTML est du
                // code produit par un agent, pas du contenu de confiance. Il
                // s'affiche, il n'accede a rien.
                <iframe title={vue.nom} sandbox="" srcDoc={vue.contenu}
                  className="flex-1 w-full bg-white" />
              ) : (
                <pre className="flex-1 overflow-auto p-3 text-[11px] leading-relaxed
                                text-neutral-300 whitespace-pre-wrap">{vue.contenu}</pre>
              )}
            </div>
          )}
        </div>

        {/* Le tableau de la lecon : TIME / ROUTINE / STATUS, trie par
            prochaine echeance -- il doit repondre « qu'est-ce qui tombe
            ensuite », pas donner un ordre alphabetique. */}
        <div className="border-t border-neutral-900 shrink-0">
          <div className="px-3 py-1.5 flex items-center gap-2">
            <span className="text-orange-500 font-mono text-xs">R</span>
            <h2 className="text-[11px] tracking-wide uppercase text-neutral-400 flex-1">
              Routines · {routines.total} · {routines.actives} actives
              {!!routines.en_echec && <span className="text-red-400 ml-2">{routines.en_echec} en échec</span>}
            </h2>
            <Niveau n={routines.niveau} note={routines.niveau2_note} />
          </div>
          <div className="max-h-40 overflow-auto">
            <table className="w-full text-[11px]">
              <thead className="text-[9px] uppercase tracking-wider text-neutral-600 sticky top-0 bg-neutral-950">
                <tr>
                  <th className="text-left font-normal px-3 py-1">prochain</th>
                  <th className="text-left font-normal py-1">routine</th>
                  <th className="text-left font-normal py-1">dernier</th>
                  <th className="text-right font-normal px-3 py-1">état</th>
                </tr>
              </thead>
              <tbody>
                {routines.items.map((t, i) => (
                  <tr key={`${t.nom}${i}`} className="border-t border-neutral-900/60">
                    <td className="px-3 py-0.5 tabular-nums text-neutral-400 whitespace-nowrap">
                      {heure(t.prochain)}
                    </td>
                    <td className="py-0.5 text-neutral-300 truncate max-w-[14rem]">{t.nom}</td>
                    <td className="py-0.5 tabular-nums text-neutral-600 whitespace-nowrap">
                      {heure(t.dernier)}
                    </td>
                    <td className="px-3 py-0.5 text-right whitespace-nowrap">
                      <span className={
                        t.resultat !== null && t.resultat !== 0 && t.resultat !== 267011
                          ? 'text-red-400'
                          : t.etat === 'en cours' ? 'text-green-500'
                          : t.etat === 'désactivée' ? 'text-neutral-700' : 'text-orange-500/70'}>
                        {t.resultat !== null && t.resultat !== 0 && t.resultat !== 267011
                          ? `échec ${t.resultat}` : t.etat}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* ================================================= colonne droite */}
      {montreDroite && (
      <aside className="w-[17rem] shrink-0 border-l border-neutral-900 overflow-auto">
        <Bloc lettre="M" titre="Memory" niveau={memoire.niveau} note={memoire.niveau3_preuve}>
          <p className="text-[11px] text-neutral-500 mb-2 leading-snug">
            <b className="text-orange-500">~{memoire.tokens_demarrage.toLocaleString('fr-FR')}</b> tokens
            chargés à <b>chaque</b> session ·{' '}
            <b className="text-neutral-300">~{memoire.tokens_a_la_demande.toLocaleString('fr-FR')}</b> lus
            à la demande. Les additionner gonflerait le coût de démarrage de trois fois.
          </p>
          <ul className="space-y-1">
            {memoire.routeurs.map((r) => (
              <li key={r.chemin} className="flex items-baseline gap-2 text-xs">
                <span className={r.present ? (r.auto ? 'text-orange-500' : 'text-neutral-500') : 'text-red-500'}>
                  {r.present ? '●' : '○'}
                </span>
                <span className="flex-1 truncate text-neutral-300">{r.nom}</span>
                <span className="text-[10px] text-neutral-600 tabular-nums shrink-0">
                  {r.present ? `${r.lignes} l.` : 'absent'}
                </span>
              </li>
            ))}
          </ul>
        </Bloc>

        <Bloc lettre="S" titre="Skills" niveau={skills.niveau} note={skills.niveau3_note}>
          <p className="text-[11px] text-neutral-500 mb-2">
            {skills.total} skills · {skills.arbres} avec références
            {skills.liens > 0 && <> · {skills.liens} liées</>}
          </p>
          <ul className="space-y-1">
            {skills.items.map((s) => (
              <li key={s.nom} className="flex items-baseline gap-2 text-xs">
                <span className={s.a_skill_md ? 'text-purple-400' : 'text-amber-500'}>
                  {s.arbre ? '◆' : '◇'}
                </span>
                <span className="flex-1 truncate text-neutral-300">
                  /{s.nom}{s.lien && <span className="text-neutral-600 ml-0.5">↗</span>}
                </span>
                <span className={`text-[10px] tabular-nums shrink-0 ${
                  !s.a_skill_md || s.trop_longue ? 'text-amber-500' : 'text-neutral-600'}`}>
                  {s.a_skill_md ? `${s.lignes} l.` : 'nu'}
                </span>
              </li>
            ))}
          </ul>
          {(skills.epaisses > 0 || skills.sans_skill_md > 0) && (
            <p className="mt-2 text-[10px] text-amber-600/80 leading-snug">
              {skills.epaisses > 0 && <>{skills.epaisses} dépassent les 60 lignes du guide —
              « short skills get followed, long ones get skimmed ». </>}
              {skills.sans_skill_md > 0 && <>{skills.sans_skill_md} sans SKILL.md : dossier
              de scripts, pas une skill.</>}
            </p>
          )}
        </Bloc>

        <Bloc lettre="A" titre="Applications" niveau={applications.niveau}>
          <p className="text-[11px] text-neutral-500 mb-2">
            {applications.total} connecteurs · {applications.http} http · {applications.stdio} stdio
          </p>
          <ul className="space-y-1 mb-3">
            {applications.items.map((c) => (
              <li key={c.nom} className="flex items-baseline gap-2 text-xs">
                <span className="text-orange-500">{c.transport === 'http' ? '⇄' : '▸'}</span>
                <span className="flex-1 truncate text-neutral-300">{c.nom}</span>
              </li>
            ))}
          </ul>
          <p className="text-[11px] text-neutral-500 mb-1">
            Micro-apps — {applications.micro_apps.length} :
          </p>
          <div className="flex flex-wrap gap-1">
            {applications.micro_apps.map((a) => (
              <span key={a} className="text-[10px] px-1.5 py-0.5 rounded bg-neutral-900 text-neutral-400">{a}</span>
            ))}
          </div>
        </Bloc>

        {/* L'absence est une information. La taire donnerait un tableau
            complet en apparence et faux en pratique. */}
        <Bloc titre="Non câblé">
          <ul className="text-[11px] text-neutral-600 space-y-1 leading-snug">
            <li>· <b className="text-neutral-500">E-mail</b> — la leçon en montre un ;
              aucun connecteur ici. Afficher des chiffres inventés serait pire que rien.</li>
            <li>· <b className="text-neutral-500">Calendrier</b> — idem. L&apos;horloge
              à gauche est calculée localement, elle ne lit aucun agenda.</li>
            <li>· <b className="text-neutral-500">Routines niveau 2</b> — exige une
              machine toujours allumée, invisible depuis ce poste.</li>
          </ul>
        </Bloc>
      </aside>
      )}
    </div>
  );
}

export const manifest = {
  id: 'agentic-os',
  name: 'Agentic OS',
  kind: 'single' as const,
  description: 'Centre de commande ARMS — deck de skills, routines, artefacts, lus à chaud.',
  icon: '⬢',
};

export const App = AgenticOSApp;
