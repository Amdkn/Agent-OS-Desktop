import React, { useState, useEffect } from 'react';
import type { AppManifest } from '../../types';

export const manifest: AppManifest = {
  id: 'tech-os-docs',
  name: 'API Specs Tech OS',
  kind: 'singleton',
  description: 'Documentation interactive des API, CLI, tables de données et protocoles d\'A\'Space Tech OS.',
  icon: '📚',
  domaine: 'l0-tech',
};

interface EndpointDoc {
  method: string;
  path: string;
  desc: string;
  exampleResponse: string;
}

interface TechDoc {
  id: string;
  title: string;
  file: string;
  layer: string;
  summary: string;
  cli: string;
  endpoints: EndpointDoc[];
  invariants: string[];
}

export function TechOSDocsApp() {
  const [docs, setDocs] = useState<TechDoc[]>([]);
  const [selectedDocId, setSelectedDocId] = useState<string>('doc-dark-factory');
  const [search, setSearch] = useState('');
  const [copiedPath, setCopiedPath] = useState<string | null>(null);

  useEffect(() => {
    fetch('/api/tech-os/docs')
      .then((r) => r.json())
      .then((data) => {
        if (data.ok && data.docs) {
          setDocs(data.docs);
        }
      })
      .catch((e) => console.error('Erreur chargement docs:', e));
  }, []);

  const filteredDocs = docs.filter(
    (d) =>
      d.title.toLowerCase().includes(search.toLowerCase()) ||
      d.summary.toLowerCase().includes(search.toLowerCase()) ||
      d.cli.toLowerCase().includes(search.toLowerCase())
  );

  const activeDoc = docs.find((d) => d.id === selectedDocId) || docs[0];

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedPath(text);
    setTimeout(() => setCopiedPath(null), 2000);
  };

  return (
    <div className="flex h-full w-full bg-[#0d1017] text-neutral-200 select-none overflow-hidden font-sans">
      {/* Volet Latéral : Sommaire des API & Modules */}
      <aside className="w-72 border-r border-neutral-800 bg-[#090b10] flex flex-col shrink-0">
        <div className="p-3 border-b border-neutral-800">
          <div className="flex items-center gap-2 mb-2">
            <span className="text-xl">📚</span>
            <div>
              <h1 className="text-xs font-bold uppercase tracking-wider text-emerald-400 font-mono">Documentation API</h1>
              <p className="text-[10px] text-neutral-500 font-mono">Specs du Kernel Tech OS</p>
            </div>
          </div>
          <input
            type="text"
            placeholder="Rechercher une API ou CLI…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full px-2.5 py-1.5 rounded-lg bg-neutral-900 border border-neutral-800 text-xs text-neutral-200 placeholder-neutral-500 focus:outline-none focus:border-emerald-500 font-mono"
          />
        </div>

        <div className="flex-1 overflow-y-auto p-2 space-y-1">
          {filteredDocs.map((doc) => {
            const isSelected = doc.id === selectedDocId;
            return (
              <button
                key={doc.id}
                onClick={() => setSelectedDocId(doc.id)}
                className={`w-full text-left p-2.5 rounded-lg border transition-all flex flex-col gap-1 ${
                  isSelected
                    ? 'bg-neutral-800/90 border-emerald-500/60 shadow-sm text-neutral-100'
                    : 'bg-neutral-900/30 border-transparent hover:bg-neutral-800/40 hover:border-neutral-700/50 text-neutral-400'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold truncate">{doc.title.split('—')[0]}</span>
                  <span className="text-[9px] font-mono px-1.5 py-0.2 rounded bg-neutral-950 border border-neutral-800 text-emerald-400">
                    {doc.layer}
                  </span>
                </div>
                <div className="text-[10px] text-neutral-500 font-mono truncate">{doc.file}</div>
              </button>
            );
          })}
        </div>
      </aside>

      {/* Zone Principale : Fiche API interactive */}
      <main className="flex-1 overflow-y-auto p-6 bg-[#0a0c10]">
        {activeDoc ? (
          <div className="max-w-4xl mx-auto space-y-6">
            {/* Header de la Spécification */}
            <div className="border-b border-neutral-800 pb-4">
              <div className="flex items-center gap-2 mb-1">
                <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-emerald-950 text-emerald-400 border border-emerald-800/80">
                  {activeDoc.layer}
                </span>
                <span className="text-xs font-mono text-neutral-500">📁 {activeDoc.file}</span>
              </div>
              <h2 className="text-xl font-bold text-neutral-100 tracking-tight">{activeDoc.title}</h2>
              <p className="text-xs text-neutral-400 mt-2 leading-relaxed">{activeDoc.summary}</p>
            </div>

            {/* Commande CLI Signature */}
            <div className="bg-[#0f131a] p-4 rounded-xl border border-neutral-800 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-mono uppercase tracking-wider text-neutral-400 font-bold">
                  Commande CLI & Signature
                </span>
                <button
                  onClick={() => copyToClipboard(activeDoc.cli)}
                  className="text-[10px] font-mono text-emerald-400 hover:text-emerald-300"
                >
                  {copiedPath === activeDoc.cli ? '✓ Copié' : 'Copier'}
                </button>
              </div>
              <pre className="p-3 bg-black/60 rounded-lg border border-neutral-800/80 text-xs font-mono text-emerald-400 overflow-x-auto">
                {activeDoc.cli}
              </pre>
            </div>

            {/* Endpoints & Verbes */}
            <div className="space-y-3">
              <h3 className="text-sm font-bold uppercase tracking-wider text-neutral-300 font-mono">
                Points d'Entrée & Verbes API
              </h3>
              <div className="space-y-3">
                {activeDoc.endpoints.map((ep, idx) => (
                  <div key={idx} className="p-4 rounded-xl bg-neutral-900/40 border border-neutral-800 space-y-2">
                    <div className="flex items-center gap-2">
                      <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-neutral-800 text-neutral-300">
                        {ep.method}
                      </span>
                      <span className="text-xs font-mono font-bold text-cyan-400">{ep.path}</span>
                    </div>
                    <p className="text-xs text-neutral-400">{ep.desc}</p>
                    {ep.exampleResponse && (
                      <div>
                        <span className="text-[10px] font-mono text-neutral-500">Exemple de sortie :</span>
                        <pre className="mt-1 p-2.5 bg-black/70 rounded border border-neutral-800/80 text-[10px] font-mono text-neutral-300 whitespace-pre-wrap">
                          {ep.exampleResponse}
                        </pre>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Règles & Invariants Inviolables (GEMINI.md) */}
            <div className="bg-emerald-950/20 border border-emerald-900/40 rounded-xl p-4 space-y-2">
              <h3 className="text-xs font-bold uppercase tracking-wider text-emerald-400 font-mono flex items-center gap-1.5">
                <span>🛡️</span> Invariants d'Intégrité & Tolérance Zéro
              </h3>
              <ul className="space-y-1.5 text-xs text-neutral-300">
                {activeDoc.invariants.map((inv, idx) => (
                  <li key={idx} className="flex items-start gap-2">
                    <span className="text-emerald-500 font-bold">•</span>
                    <span>{inv}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        ) : (
          <div className="h-full flex items-center justify-center text-neutral-500 text-xs">
            Sélectionnez une API dans la colonne de gauche.
          </div>
        )}
      </main>
    </div>
  );
}

export const App = TechOSDocsApp;
