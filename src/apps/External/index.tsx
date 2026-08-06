/**
 * External Frame app — embeds an interface that runs elsewhere.
 *
 * Two known targets are pre-wired:
 *   - agentgateway console: http://127.0.0.1:15000/ui
 *   - Observatoire:         http://127.0.0.1:8787
 *
 * The user can also type a custom URL. The status dot shows whether the
 * target currently responds — we probe on URL change and on window focus.
 * If the target is dead, the iframe is not rendered; we show a clear
 * message instead of a blank white rectangle.
 */

import { useEffect, useRef, useState } from 'react';

interface Target {
  id: string;
  label: string;
  url: string;
}

const KNOWN: Target[] = [
  { id: 'gateway', label: 'agentgateway console', url: 'http://127.0.0.1:15000/ui' },
  { id: 'observatoire', label: 'Observatoire', url: 'http://127.0.0.1:8787' },
];

type Status = 'unknown' | 'checking' | 'up' | 'down';

export function ExternalApp() {
  const [url, setUrl] = useState<string>(KNOWN[0].url);
  const [draft, setDraft] = useState<string>(KNOWN[0].url);
  const [status, setStatus] = useState<Status>('unknown');
  const [statusMessage, setStatusMessage] = useState<string>('');
  const inputRef = useRef<HTMLInputElement>(null);

  const probe = async (target: string) => {
    setStatus('checking');
    setStatusMessage('');
    try {
      // Use `no-cors` mode so we can detect "reachable" without CORS gating.
      // The response is opaque, but we only need the network round-trip.
      const res = await fetch(target, { mode: 'no-cors', cache: 'no-store' });
      // In no-cors, res.type === 'opaque' even on 4xx/5xx — so reaching
      // the host at all is the success signal we want.
      if (res.type === 'opaque') {
        setStatus('up');
        setStatusMessage('opaque — la cible répond');
      } else {
        setStatus('up');
        setStatusMessage('OK');
      }
    } catch (err) {
      setStatus('down');
      setStatusMessage((err as Error).message || 'cible injoignable');
    }
  };

  useEffect(() => {
    probe(url);
    const onFocus = () => probe(url);
    window.addEventListener('focus', onFocus);
    return () => window.removeEventListener('focus', onFocus);
  }, [url]);

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    setUrl(draft);
  };

  const STATUS_DOT: Record<Status, string> = {
    unknown: 'bg-white/30',
    checking: 'bg-amber-400 animate-pulse',
    up: 'bg-emerald-400',
    down: 'bg-rose-400',
  };
  const STATUS_LABEL: Record<Status, string> = {
    unknown: 'inconnu',
    checking: 'vérification…',
    up: 'ok',
    down: 'mort',
  };
  const STATUS_TEXT: Record<Status, string> = {
    unknown: 'text-white/60',
    checking: 'text-amber-300',
    up: 'text-emerald-300',
    down: 'text-rose-300',
  };

  return (
    <div className="flex flex-col h-full text-sm">
      <header className="px-3 py-2 border-b border-white/10 flex items-center gap-3">
        <span className="text-base">▣</span>
        <form onSubmit={submit} className="flex-1 flex gap-2">
          <input
            ref={inputRef}
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            placeholder="http://127.0.0.1:port/"
            className="flex-1 bg-black/40 border border-white/10 rounded px-2 py-1 text-xs font-mono focus:outline-none focus:border-[var(--color-accent)]/50"
          />
          <button
            type="submit"
            className="px-2 py-1 rounded text-xs border border-white/10 hover:bg-white/5"
          >
            ouvrir
          </button>
        </form>
        <div className="flex items-center gap-2 text-xs">
          <span className={`w-2 h-2 rounded-full ${STATUS_DOT[status]}`} />
          <span className={STATUS_TEXT[status]}>{STATUS_LABEL[status]}</span>
        </div>
      </header>

      <div className="px-3 py-2 border-b border-white/10 flex flex-wrap gap-1.5">
        {KNOWN.map((t) => (
          <button
            key={t.id}
            onClick={() => {
              setDraft(t.url);
              setUrl(t.url);
            }}
            className={`px-2 py-1 rounded text-[10px] uppercase tracking-wide border transition-colors ${
              url === t.url
                ? 'border-[var(--color-accent)]/50 bg-[var(--color-accent)]/10 text-[var(--color-accent)]'
                : 'border-white/10 text-[var(--color-text-dim)] hover:bg-white/5'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      <div className="flex-1 relative bg-black">
        {status === 'down' && (
          <div className="absolute inset-0 flex items-center justify-center p-8">
            <div className="max-w-md text-center">
              <div className="text-3xl mb-2 opacity-40">⚠</div>
              <p className="text-sm text-rose-300 font-medium">
                Cible injoignable
              </p>
              <p className="mt-2 text-xs text-[var(--color-text-dim)] font-mono">
                {url}
              </p>
              {statusMessage && (
                <p className="mt-2 text-xs text-[var(--color-text-dim)]">
                  {statusMessage}
                </p>
              )}
              <p className="mt-4 text-xs text-[var(--color-text-dim)]">
                Aucun cadre blanc ne s'affichera — vérifiez que le service
                tourne et réessayez.
              </p>
            </div>
          </div>
        )}
        {status !== 'down' && (
          <iframe
            src={url}
            title={url}
            className="w-full h-full border-0"
            sandbox="allow-scripts allow-same-origin allow-forms allow-popups"
          />
        )}
      </div>

      {statusMessage && status === 'up' && (
        <footer className="px-3 py-1 border-t border-white/10 text-[10px] text-[var(--color-text-dim)] font-mono">
          {statusMessage}
        </footer>
      )}
    </div>
  );
}

export const manifest = {
  id: 'external',
  name: 'Cadre externe',
  kind: 'multi' as const,
  description: 'Encapsule une interface qui tourne ailleurs.',
  icon: '▣',
};
