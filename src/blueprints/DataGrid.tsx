import { useState, useMemo } from 'react';
import type { BlueprintColumn } from './types';

interface DataGridProps<T extends Record<string, unknown>> {
  title?: string;
  columns: BlueprintColumn<T>[];
  dataset: T[];
}

export function DataGrid<T extends Record<string, unknown>>({ title, columns, dataset }: DataGridProps<T>) {
  const [search, setSearch] = useState('');
  const [sortKey, setSortKey] = useState<string | null>(null);
  const [sortAsc, setSortAsc] = useState(true);
  const [page, setPage] = useState(1);
  const pageSize = 8;

  // Filtrage
  const filtered = useMemo(() => {
    if (!search.trim()) return dataset;
    const q = search.toLowerCase();
    return dataset.filter((row) =>
      Object.values(row).some((val) => String(val).toLowerCase().includes(q))
    );
  }, [dataset, search]);

  // Tri
  const sorted = useMemo(() => {
    if (!sortKey) return filtered;
    return [...filtered].sort((a, b) => {
      const valA = a[sortKey];
      const valB = b[sortKey];
      if (valA == null) return 1;
      if (valB == null) return -1;
      if (valA < valB) return sortAsc ? -1 : 1;
      if (valA > valB) return sortAsc ? 1 : -1;
      return 0;
    });
  }, [filtered, sortKey, sortAsc]);

  // Pagination
  const totalPages = Math.max(1, Math.ceil(sorted.length / pageSize));
  const currentPage = Math.min(page, totalPages);
  const pagedRows = sorted.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  const toggleSort = (key: string) => {
    if (sortKey === key) {
      setSortAsc(!sortAsc);
    } else {
      setSortKey(key);
      setSortAsc(true);
    }
  };

  const exportCsv = () => {
    if (sorted.length === 0) return;
    const headers = columns.map((c) => '"' + c.label.replace(/"/g, '""') + '"').join(',');
    const rows = sorted.map((row) =>
      columns.map((c) => '"' + String(row[c.key] ?? '').replace(/"/g, '""') + '"').join(',')
    );
    const csvContent = 'data:text/csv;charset=utf-8,' + [headers, ...rows].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `${title ?? 'datagrid'}_export.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const exportJson = () => {
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(sorted, null, 2));
    const link = document.createElement('a');
    link.setAttribute('href', dataStr);
    link.setAttribute('download', `${title ?? 'datagrid'}_export.json`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };


  return (
    <div className="flex flex-col gap-3 p-4 rounded-xl border border-white/10 bg-slate-900/60 backdrop-blur-md shadow-xl">
      {/* Entête de contrôle */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          {title && (
            <h3 className="text-sm font-semibold text-[var(--color-text)] tracking-wide">
              {title}
            </h3>
          )}
          <span className="text-[11px] font-mono px-2 py-0.5 rounded-full bg-white/10 text-[var(--color-text-dim)]">
            {sorted.length} ligne{sorted.length > 1 ? 's' : ''}
          </span>
        </div>

        <div className="flex items-center gap-2">
          <input
            type="text"
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            placeholder="Filtrer le tableau..."
            className="px-3 py-1.5 rounded-lg bg-black/40 border border-white/10 text-xs text-[var(--color-text)] placeholder-[var(--color-text-dim)] outline-none focus:border-[var(--color-accent)]/60 w-48"
          />
          <button
            onClick={exportCsv}
            title="Exporter en format CSV"
            className="px-2.5 py-1.5 rounded-lg bg-white/5 border border-white/10 text-xs text-[var(--color-text-dim)] hover:text-white hover:bg-white/10 transition-colors flex items-center gap-1 font-mono"
          >
            CSV
          </button>
          <button
            onClick={exportJson}
            title="Exporter en JSON"
            className="px-2.5 py-1.5 rounded-lg bg-white/5 border border-white/10 text-xs text-[var(--color-text-dim)] hover:text-white hover:bg-white/10 transition-colors flex items-center gap-1 font-mono"
          >
            JSON
          </button>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto rounded-lg border border-white/10">
        <table className="w-full text-left text-xs text-[var(--color-text)]">
          <thead className="bg-white/5 text-[var(--color-text-dim)] uppercase tracking-wider font-mono text-[10px] border-b border-white/10 select-none">
            <tr>
              {columns.map((c) => (
                <th
                  key={c.key}
                  onClick={() => toggleSort(c.key)}
                  className="px-3 py-2.5 cursor-pointer hover:text-white transition-colors"
                  style={{ width: c.width }}
                >
                  <div className="flex items-center gap-1">
                    <span>{c.label}</span>
                    {sortKey === c.key && (
                      <span className="text-[var(--color-accent)] font-bold">
                        {sortAsc ? '↑' : '↓'}
                      </span>
                    )}
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5 font-mono text-[11px]">
            {pagedRows.length === 0 ? (
              <tr>
                <td colSpan={columns.length} className="text-center py-6 text-[var(--color-text-dim)]">
                  Aucun résultat trouvé.
                </td>
              </tr>
            ) : (
              pagedRows.map((row, rIdx) => (
                <tr key={rIdx} className="hover:bg-white/5 transition-colors">
                  {columns.map((c) => (
                    <td key={c.key} className="px-3 py-2 text-slate-300">
                      {c.render ? c.render(row[c.key], row) : String(row[c.key] ?? '—')}
                    </td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between text-xs text-[var(--color-text-dim)] font-mono pt-1">
          <span>
            Page {currentPage} sur {totalPages}
          </span>
          <div className="flex items-center gap-1">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className="px-2.5 py-1 rounded bg-white/5 border border-white/10 disabled:opacity-30 hover:bg-white/10 transition-colors"
            >
              Précédent
            </button>
            <button
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
              className="px-2.5 py-1 rounded bg-white/5 border border-white/10 disabled:opacity-30 hover:bg-white/10 transition-colors"
            >
              Suivant
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
