/**
 * Memories app — the durable layer's read/write surface.
 *
 * Backed by the StorageAdapter. The list lives on the left, the editor on
 * the right. New memories start blank. Tags are free-form.
 *
 * The export/import buttons live in the footer — that's the whole point of
 * the persistence layer.
 */

import { useEffect, useMemo, useState } from 'react';
import { newMemory, type StorageAdapter } from '../../storage/contract';
import { useStorage } from '../../storage/useStorage';
import { downloadSnapshot, importSnapshotFromFile } from '../../storage/backup';
import type { Memory } from '../../types';

function useMemories(adapter: StorageAdapter) {
  const [memories, setMemories] = useState<Memory[]>([]);
  const [loading, setLoading] = useState(true);
  const reload = () => {
    setLoading(true);
    adapter.listMemories().then((r) => {
      setMemories(r);
      setLoading(false);
    });
  };
  useEffect(reload, [adapter]);
  return { memories, loading, reload };
}

export function MemoriesApp() {
  const adapter = useStorage();
  const { memories, loading, reload } = useMemories(adapter);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [importError, setImportError] = useState<string | null>(null);

  const selected = useMemo(
    () => memories.find((m) => m.id === selectedId) ?? null,
    [memories, selectedId],
  );

  const handleNew = async () => {
    const m = newMemory();
    await adapter.putMemory(m);
    reload();
    setSelectedId(m.id);
  };

  const handleSave = async (m: Memory) => {
    await adapter.putMemory({ ...m, updatedAt: Date.now() });
    reload();
  };

  const handleDelete = async (id: string) => {
    await adapter.deleteMemory(id);
    if (selectedId === id) setSelectedId(null);
    reload();
  };

  const handleExport = async () => {
    await downloadSnapshot(adapter);
  };

  const handleImport = async (file: File) => {
    setImportError(null);
    try {
      await importSnapshotFromFile(adapter, file);
      reload();
    } catch (err) {
      setImportError((err as Error).message);
    }
  };

  return (
    <div className="flex h-full text-sm">
      <aside className="w-56 border-r border-white/10 flex flex-col">
        <div className="p-2 border-b border-white/10 flex gap-2">
          <button
            onClick={handleNew}
            className="flex-1 px-2 py-1 rounded bg-[var(--color-accent)]/15 text-[var(--color-accent)] border border-[var(--color-accent)]/30 hover:bg-[var(--color-accent)]/25 transition-colors"
          >
            + nouvelle
          </button>
        </div>
        <ul className="flex-1 overflow-auto scrollbar">
          {loading && (
            <li className="p-3 text-xs text-[var(--color-text-dim)]">chargement…</li>
          )}
          {!loading && memories.length === 0 && (
            <li className="p-3 text-xs text-[var(--color-text-dim)]">
              aucune mémoire — cliquez sur « nouvelle ».
            </li>
          )}
          {memories.map((m) => (
            <li key={m.id}>
              <button
                onClick={() => setSelectedId(m.id)}
                className={`w-full text-left px-3 py-2 border-b border-white/5 hover:bg-white/[0.04] transition-colors ${
                  selectedId === m.id ? 'bg-white/[0.06]' : ''
                }`}
              >
                <div className="font-medium truncate">{m.title || 'sans titre'}</div>
                <div className="text-[10px] text-[var(--color-text-dim)]">
                  {new Date(m.updatedAt).toLocaleString()}
                </div>
                {m.tags.length > 0 && (
                  <div className="mt-1 flex flex-wrap gap-1">
                    {m.tags.map((t) => (
                      <span
                        key={t}
                        className="text-[10px] px-1.5 py-0.5 rounded bg-white/5 text-[var(--color-text-dim)]"
                      >
                        {t}
                      </span>
                    ))}
                  </div>
                )}
              </button>
            </li>
          ))}
        </ul>
        <div className="p-2 border-t border-white/10 flex gap-2">
          <button
            onClick={handleExport}
            className="flex-1 px-2 py-1 rounded text-xs border border-white/10 hover:bg-white/5"
          >
            exporter
          </button>
          <label className="flex-1 px-2 py-1 rounded text-xs border border-white/10 hover:bg-white/5 text-center cursor-pointer">
            importer
            <input
              type="file"
              accept="application/json"
              className="hidden"
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) handleImport(f);
                e.target.value = '';
              }}
            />
          </label>
        </div>
      </aside>
      <main className="flex-1 flex flex-col">
        {!selected && (
          <div className="flex-1 flex items-center justify-center text-[var(--color-text-dim)]">
            <div className="text-center">
              <div className="text-3xl mb-2 opacity-40">✎</div>
              <p>Sélectionnez une mémoire, ou créez-en une nouvelle.</p>
            </div>
          </div>
        )}
        {selected && (
          <MemoryEditor
            memory={selected}
            onSave={handleSave}
            onDelete={handleDelete}
          />
        )}
        {importError && (
          <div className="px-4 py-2 border-t border-[var(--color-danger)]/30 bg-[var(--color-danger)]/10 text-xs text-[var(--color-danger)]">
            {importError}
          </div>
        )}
      </main>
    </div>
  );
}

function MemoryEditor({
  memory,
  onSave,
  onDelete,
}: {
  memory: Memory;
  onSave: (m: Memory) => void;
  onDelete: (id: string) => void;
}) {
  const [title, setTitle] = useState(memory.title);
  const [body, setBody] = useState(memory.body);
  const [tags, setTags] = useState(memory.tags.join(', '));

  useEffect(() => {
    setTitle(memory.title);
    setBody(memory.body);
    setTags(memory.tags.join(', '));
  }, [memory.id]);

  const save = () => {
    onSave({
      ...memory,
      title: title.trim() || 'sans titre',
      body,
      tags: tags
        .split(',')
        .map((t) => t.trim())
        .filter(Boolean),
    });
  };

  return (
    <div className="flex flex-col h-full">
      <div className="p-3 border-b border-white/10 flex gap-2">
        <input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          onBlur={save}
          placeholder="titre"
          className="flex-1 bg-transparent border border-white/10 rounded px-2 py-1 text-sm focus:outline-none focus:border-[var(--color-accent)]/50"
        />
        <button
          onClick={save}
          className="px-3 py-1 rounded text-xs bg-[var(--color-accent)]/15 text-[var(--color-accent)] border border-[var(--color-accent)]/30 hover:bg-[var(--color-accent)]/25"
        >
          sauver
        </button>
        <button
          onClick={() => onDelete(memory.id)}
          className="px-3 py-1 rounded text-xs border border-[var(--color-danger)]/30 text-[var(--color-danger)] hover:bg-[var(--color-danger)]/10"
        >
          supprimer
        </button>
      </div>
      <textarea
        value={body}
        onChange={(e) => setBody(e.target.value)}
        onBlur={save}
        placeholder="…"
        className="flex-1 bg-transparent p-4 text-sm font-mono resize-none focus:outline-none scrollbar"
      />
      <div className="p-3 border-t border-white/10">
        <input
          value={tags}
          onChange={(e) => setTags(e.target.value)}
          onBlur={save}
          placeholder="étiquettes, séparées par des virgules"
          className="w-full bg-transparent border border-white/10 rounded px-2 py-1 text-xs focus:outline-none focus:border-[var(--color-accent)]/50"
        />
      </div>
    </div>
  );
}

export const manifest = {
  id: 'memories',
  name: 'Mémoires',
  kind: 'multi' as const,
  description: 'Notes durables. Backup en un clic.',
  icon: '✎',
};
