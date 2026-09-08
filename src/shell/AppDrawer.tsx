import { useState, useMemo } from 'react';
import { useShell } from './store';
import { apps as registryApps } from '../apps/registry';

export function AppDrawer(): import('react').ReactNode {
  const isOpen = useShell((s) => s.appDrawerOpen);
  const closeDrawer = useShell((s) => s.toggleAppDrawer);
  const openWindow = useShell((s) => s.openWindow);
  const [query, setQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  const allApps = useMemo(() => {
    return registryApps.map((a) => a.manifest);
  }, []);

  const categories = useMemo(() => {
    const set = new Set<string>();
    allApps.forEach((a) => {
      if (a.category) set.add(a.category);
      else if (a.domaine) set.add(a.domaine.toUpperCase());
    });
    return ['all', ...Array.from(set)];
  }, [allApps]);

  const filteredApps = useMemo(() => {
    return allApps.filter((a) => {
      const matchesQuery =
        !query ||
        a.name.toLowerCase().includes(query.toLowerCase()) ||
        a.description.toLowerCase().includes(query.toLowerCase());
      const matchesCategory =
        selectedCategory === 'all' ||
        a.category === selectedCategory ||
        (a.domaine && a.domaine.toUpperCase() === selectedCategory);
      return matchesQuery && matchesCategory;
    });
  }, [allApps, query, selectedCategory]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[5500] bg-black/80 backdrop-blur-2xl p-8 sm:p-14 flex flex-col items-center animate-in fade-in duration-200">
      <button
        type="button"
        onClick={closeDrawer}
        aria-label="Fermer le tiroir d'applications"
        className="absolute top-6 right-8 p-2.5 rounded-full bg-white/10 hover:bg-white/20 text-white/70 hover:text-white transition-all border border-white/10 shadow-lg cursor-pointer"
      >
        <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M18 6L6 18M6 6l12 12" />
        </svg>
      </button>

      <div className="w-full max-w-2xl mb-8 space-y-4 text-center">
        <div className="flex items-center justify-center gap-2">
          <span className="text-2xl">⚡</span>
          <h2 className="text-2xl font-black text-white tracking-tight font-sans uppercase">
            Launchpad · Agent OS
          </h2>
        </div>
        <p className="text-xs text-white/50">
          Toutes les applications enregistrées et outils souverains du système
        </p>

        <div className="relative max-w-lg mx-auto">
          <input
            autoFocus
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            type="text"
            placeholder="Rechercher une application, outil ou module…"
            aria-label="Rechercher une application"
            className="w-full bg-white/10 border border-white/15 rounded-2xl py-3 pl-11 pr-4 text-sm text-white placeholder-white/40 outline-none focus:border-[var(--theme-accent,#06b6d4)] focus:bg-white/15 transition-all shadow-inner"
          />
          <svg
            className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
          >
            <circle cx="11" cy="11" r="8" />
            <line x1="21" y1="21" x2="16.65" y2="16.65" />
          </svg>
        </div>

        {/* Category Pills */}
        <div className="flex flex-wrap items-center justify-center gap-2 pt-2">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-3 py-1 rounded-full text-xs font-semibold uppercase tracking-wider transition-all cursor-pointer ${
                selectedCategory === cat
                  ? 'bg-[var(--theme-accent,#06b6d4)] text-black shadow-md shadow-cyan-500/20'
                  : 'bg-white/5 text-white/60 hover:text-white hover:bg-white/10 border border-white/5'
              }`}
            >
              {cat === 'all' ? 'Toutes' : cat}
            </button>
          ))}
        </div>
      </div>

      {/* Grid */}
      <div className="w-full max-w-5xl flex-1 overflow-y-auto px-4 pb-12">
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-6">
          {filteredApps.map((app) => (
            <button
              key={app.id}
              onClick={() => {
                openWindow(app.id, { title: app.name });
                closeDrawer();
              }}
              className="flex flex-col items-center gap-3 p-3 rounded-2xl hover:bg-white/10 transition-all duration-200 group text-center cursor-pointer border border-transparent hover:border-white/10"
            >
              <div
                className="w-16 h-16 rounded-2xl bg-white/10 border border-white/15 flex items-center justify-center text-3xl shadow-lg group-hover:scale-110 group-hover:border-[var(--theme-accent,#06b6d4)] transition-all duration-300"
                style={{
                  boxShadow: '0 8px 24px -6px rgba(0,0,0,0.5)',
                }}
              >
                {app.icon || '📦'}
              </div>
              <div className="min-w-0">
                <div className="text-xs font-bold text-white/90 group-hover:text-white truncate">
                  {app.name}
                </div>
                <div className="text-[10px] text-white/40 truncate max-w-[120px] mt-0.5">
                  {app.description || app.id}
                </div>
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
