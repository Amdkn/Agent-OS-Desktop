import { useState, useEffect, useMemo } from 'react';
import type { AppManifest } from '../../types';
import {
  Activity,
  Zap,
  Search,
  Sliders,
  Eye,
  RefreshCw,
  Play,
  Pause,
  ShieldAlert,
  CheckCircle2,
  AlertCircle,
  X,
  ChevronRight,
  Copy,
  Check,
  Flame,
  Coins,
  Clock,
  Sparkles,
  Radio
} from 'lucide-react';

export const manifest: AppManifest = {
  id: 'posthog-observatory',
  name: 'PostHog Observatory',
  kind: 'singleton',
  description: 'Observatoire unifié & Orchestrateur inspiré de PostHog : Event Stream, LLM Tracing (Yas), Session Replay, Feature Flags & DLQ sans conteneur.',
  icon: '🦔',
  domaine: 'l0-tech',
  category: 'Observabilité & Orchestration',
  accentColor: '#f59e0b'
};

interface EventItem {
  id: number;
  workId: number | null;
  timestamp: string;
  domain: 'Tech OS' | 'Life OS' | 'Business OS';
  domainColor: string;
  source: string;
  kind: string;
  workTitle: string;
  summary: string;
  payload: Record<string, any>;
}

interface LlmTrace {
  id: string;
  timestamp: string;
  model: string;
  agent: string;
  promptTokens: number;
  completionTokens: number;
  costUsd: number;
  latencyMs: number;
  status: 'success' | 'rate_limited' | 'error';
  promptPreview: string;
  responsePreview: string;
  toolCallsCount: number;
}

interface SessionStep {
  step: number;
  type: string;
  title: string;
  timestamp: string;
  durationMs: number;
  detail: string;
}

interface AgentSession {
  id: string;
  name: string;
  agent: string;
  startedAt: string;
  durationSec: number;
  totalSteps: number;
  status: string;
  score: number;
  steps: SessionStep[];
}

interface FeatureFlag {
  id: string;
  name: string;
  description: string;
  enabled: boolean;
  type: string;
  blastRadius: string;
  environment: string;
}

interface DlqItem {
  id: string;
  workId: number;
  workTitle: string;
  errorType: string;
  message: string;
  timestamp: string;
  remediationStatus: string;
  patchSuggestion: string;
  autoFixedBy?: string;
}

export function App() {
  const [activeTab, setActiveTab] = useState<'stream' | 'llm' | 'replay' | 'flags' | 'dlq'>('stream');
  const [loading, setLoading] = useState<boolean>(true);
  const [data, setData] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  // Filtres Stream
  const [searchTerm, setSearchTerm] = useState('');
  const [domainFilter, setDomainFilter] = useState<'ALL' | 'Tech OS' | 'Life OS' | 'Business OS'>('ALL');
  const [kindFilter, setKindFilter] = useState<string>('ALL');
  const [selectedEvent, setSelectedEvent] = useState<EventItem | null>(null);

  // LLM Traces
  const [selectedTrace, setSelectedTrace] = useState<LlmTrace | null>(null);

  // Replay
  const [selectedSessionId, setSelectedSessionId] = useState<string>('sess-a66f5256');
  const [replayPlaying, setReplayPlaying] = useState<boolean>(false);
  const [currentStepIdx, setCurrentStepIdx] = useState<number>(0);
  const [replaySpeed, setReplaySpeed] = useState<number>(1);

  // Copie JSON
  const [copied, setCopied] = useState<boolean>(false);

  // Auto-refresh
  const [autoPoll, setAutoPoll] = useState<boolean>(true);

  const fetchData = () => {
    fetch('/api/tech-os/observability')
      .then((r) => r.json())
      .then((res) => {
        if (res.ok) {
          setData(res);
          setError(null);
        } else {
          setError(res.error || 'Erreur API Observabilité');
        }
        setLoading(false);
      })
      .catch((err) => {
        setError(err.message);
        setLoading(false);
      });
  };

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    if (!autoPoll) return;
    const interval = setInterval(() => {
      fetchData();
    }, 6000);
    return () => clearInterval(interval);
  }, [autoPoll]);

  // Player session replay
  useEffect(() => {
    if (!replayPlaying) return;
    const activeSession = data?.sessions?.find((s: AgentSession) => s.id === selectedSessionId);
    if (!activeSession) return;

    const interval = setInterval(() => {
      setCurrentStepIdx((prev) => {
        if (prev >= activeSession.steps.length - 1) {
          setReplayPlaying(false);
          return prev;
        }
        return prev + 1;
      });
    }, 1800 / replaySpeed);

    return () => clearInterval(interval);
  }, [replayPlaying, replaySpeed, selectedSessionId, data]);

  const handleToggleFlag = (flagId: string) => {
    fetch('/api/tech-os/observability/toggle-flag', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ flagId })
    })
      .then((r) => r.json())
      .then((res) => {
        if (res.ok) {
          fetchData();
        }
      })
      .catch(console.error);
  };

  const handleRemediate = (dlqId: string) => {
    fetch('/api/tech-os/observability/remediate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ dlqId })
    })
      .then((r) => r.json())
      .then((res) => {
        if (res.ok) {
          fetchData();
        }
      })
      .catch(console.error);
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Filtrage des événements
  const filteredEvents = useMemo(() => {
    if (!data?.events) return [];
    return data.events.filter((ev: EventItem) => {
      if (domainFilter !== 'ALL' && ev.domain !== domainFilter) return false;
      if (kindFilter !== 'ALL' && ev.kind !== kindFilter) return false;
      if (searchTerm) {
        const q = searchTerm.toLowerCase();
        const matchTitle = ev.workTitle?.toLowerCase().includes(q);
        const matchSummary = ev.summary?.toLowerCase().includes(q);
        const matchSource = ev.source?.toLowerCase().includes(q);
        const matchKind = ev.kind?.toLowerCase().includes(q);
        if (!matchTitle && !matchSummary && !matchSource && !matchKind) return false;
      }
      return true;
    });
  }, [data?.events, domainFilter, kindFilter, searchTerm]);

  const activeSession = useMemo(() => {
    return data?.sessions?.find((s: AgentSession) => s.id === selectedSessionId) || data?.sessions?.[0];
  }, [data?.sessions, selectedSessionId]);

  if (loading && !data) {
    return (
      <div className="flex h-full w-full items-center justify-center bg-[#0d1117] text-amber-400">
        <div className="flex flex-col items-center gap-3">
          <RefreshCw className="h-8 w-8 animate-spin" />
          <span className="text-xs font-mono tracking-wider">CHARGEMENT DE L'OBSERVATOIRE POSTHOG...</span>
        </div>
      </div>
    );
  }

  const metrics = data?.metrics || {};

  return (
    <div className="flex h-full w-full flex-col bg-[#0b0f14] text-slate-200 select-none overflow-hidden font-sans">
      {/* Top Header PostHog Cockpit */}
      <div className="flex items-center justify-between border-b border-slate-800/80 bg-[#0f141c]/90 px-4 py-2.5 backdrop-blur-md">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-to-br from-amber-500/20 to-orange-500/30 border border-amber-500/40 text-xl shadow-sm shadow-amber-500/20">
            🦔
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-sm font-bold tracking-tight text-white flex items-center gap-1.5">
                POSTHOG OBSERVATORY <span className="text-[10px] px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-300 font-mono border border-amber-500/30">V3 LOCAL</span>
              </span>
              <span className="flex items-center gap-1 text-[11px] text-emerald-400 font-mono">
                <Radio className="h-3 w-3 animate-pulse text-emerald-400" />
                In-Process Zero Docker
              </span>
            </div>
            <p className="text-[11px] text-slate-400">
              Event Bus uc.db (WAL) · Requêtes Colonnaires Locales · Yas LLM Traces · Beth Veto Gates
            </p>
          </div>
        </div>

        {/* Action controls */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => setAutoPoll(!autoPoll)}
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded text-xs font-mono border transition-all ${
              autoPoll
                ? 'bg-emerald-950/40 border-emerald-600/50 text-emerald-300 hover:bg-emerald-900/50'
                : 'bg-slate-800/60 border-slate-700 text-slate-400 hover:bg-slate-750'
            }`}
          >
            <span className={`h-1.5 w-1.5 rounded-full ${autoPoll ? 'bg-emerald-400 animate-ping' : 'bg-slate-500'}`} />
            {autoPoll ? 'Live Sync (6s)' : 'En Pause'}
          </button>

          <button
            onClick={fetchData}
            title="Rafraîchir maintenant"
            className="flex items-center gap-1 px-2 py-1 rounded text-xs font-mono bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-300 transition-all active:scale-95"
          >
            <RefreshCw className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>

      {/* Metrics Banner (Style PostHog Insight Rollup) */}
      <div className="grid grid-cols-6 border-b border-slate-800/60 bg-[#0d121a]/60 text-xs">
        <div className="flex flex-col border-r border-slate-800/60 p-2.5">
          <span className="text-[10px] text-slate-400 uppercase font-mono flex items-center gap-1">
            <Activity className="h-3 w-3 text-amber-400" /> Total Événements
          </span>
          <div className="flex items-baseline gap-1 mt-0.5">
            <span className="text-base font-bold text-white font-mono">{metrics.totalEvents?.toLocaleString() || 0}</span>
            <span className="text-[10px] text-emerald-400 font-mono">+{metrics.eventsPerMinute || 0}/m</span>
          </div>
        </div>

        <div className="flex flex-col border-r border-slate-800/60 p-2.5">
          <span className="text-[10px] text-slate-400 uppercase font-mono flex items-center gap-1">
            <Coins className="h-3 w-3 text-cyan-400" /> Tokens Yas LLM
          </span>
          <div className="flex items-baseline gap-1 mt-0.5">
            <span className="text-base font-bold text-white font-mono">{(metrics.totalTokens / 1000).toFixed(1)}k</span>
            <span className="text-[10px] text-amber-400 font-mono">${metrics.estimatedCostUsd || '0.00'}</span>
          </div>
        </div>

        <div className="flex flex-col border-r border-slate-800/60 p-2.5">
          <span className="text-[10px] text-slate-400 uppercase font-mono flex items-center gap-1">
            <Clock className="h-3 w-3 text-indigo-400" /> Latence p95
          </span>
          <div className="flex items-baseline gap-1 mt-0.5">
            <span className="text-base font-bold text-white font-mono">{metrics.p95LatencyMs || 0}ms</span>
            <span className="text-[10px] text-slate-400 font-mono">avg {metrics.avgLatencyMs || 0}ms</span>
          </div>
        </div>

        <div className="flex flex-col border-r border-slate-800/60 p-2.5">
          <span className="text-[10px] text-slate-400 uppercase font-mono flex items-center gap-1">
            <Sparkles className="h-3 w-3 text-emerald-400" /> Calibration
          </span>
          <div className="flex items-baseline gap-1 mt-0.5">
            <span className="text-base font-bold text-emerald-300 font-mono">{metrics.calibrationPct || 0}%</span>
            <span className="text-[10px] text-slate-400 font-mono">prédictions</span>
          </div>
        </div>

        <div className="flex flex-col border-r border-slate-800/60 p-2.5">
          <span className="text-[10px] text-slate-400 uppercase font-mono flex items-center gap-1">
            <CheckCircle2 className="h-3 w-3 text-purple-400" /> Works Validés
          </span>
          <div className="flex items-baseline gap-1 mt-0.5">
            <span className="text-base font-bold text-purple-300 font-mono">{metrics.worksDone || 0}</span>
            <span className="text-[10px] text-slate-400 font-mono">détachés</span>
          </div>
        </div>

        <div className="flex flex-col p-2.5 bg-amber-950/20">
          <span className="text-[10px] text-amber-400 uppercase font-mono flex items-center gap-1">
            <ShieldAlert className="h-3 w-3 text-amber-400" /> Veto Beth
          </span>
          <div className="flex items-baseline gap-1 mt-0.5">
            <span className="text-xs font-bold text-amber-300 font-mono">5 PORTES OK</span>
            <span className="text-[10px] text-emerald-400 font-mono">0 fail</span>
          </div>
        </div>
      </div>

      {/* Navigation Tabs PostHog Style */}
      <div className="flex items-center gap-1 border-b border-slate-800/80 bg-[#0b0e14] px-4 pt-2">
        <button
          onClick={() => setActiveTab('stream')}
          className={`flex items-center gap-2 border-b-2 px-3 py-2 text-xs font-medium transition-colors ${
            activeTab === 'stream'
              ? 'border-amber-400 text-amber-300'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <Activity className="h-3.5 w-3.5" />
          Live Event Stream
          <span className="ml-1 rounded-full bg-slate-800 px-1.5 py-0.2 text-[10px] font-mono text-slate-300">
            {filteredEvents.length}
          </span>
        </button>

        <button
          onClick={() => setActiveTab('llm')}
          className={`flex items-center gap-2 border-b-2 px-3 py-2 text-xs font-medium transition-colors ${
            activeTab === 'llm'
              ? 'border-amber-400 text-amber-300'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <Zap className="h-3.5 w-3.5 text-cyan-400" />
          LLM Observability (Yas)
          <span className="ml-1 rounded-full bg-cyan-950/60 border border-cyan-800/50 px-1.5 py-0.2 text-[10px] font-mono text-cyan-300">
            {data?.llmTraces?.length || 0} traces
          </span>
        </button>

        <button
          onClick={() => setActiveTab('replay')}
          className={`flex items-center gap-2 border-b-2 px-3 py-2 text-xs font-medium transition-colors ${
            activeTab === 'replay'
              ? 'border-amber-400 text-amber-300'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <Play className="h-3.5 w-3.5 text-orange-400" />
          Session Replay (Inspector)
        </button>

        <button
          onClick={() => setActiveTab('flags')}
          className={`flex items-center gap-2 border-b-2 px-3 py-2 text-xs font-medium transition-colors ${
            activeTab === 'flags'
              ? 'border-amber-400 text-amber-300'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <Sliders className="h-3.5 w-3.5 text-purple-400" />
          Feature Flags & Veto Gates
          <span className="ml-1 rounded-full bg-purple-950/60 border border-purple-800/50 px-1.5 py-0.2 text-[10px] font-mono text-purple-300">
            {data?.featureFlags?.length || 0}
          </span>
        </button>

        <button
          onClick={() => setActiveTab('dlq')}
          className={`flex items-center gap-2 border-b-2 px-3 py-2 text-xs font-medium transition-colors ${
            activeTab === 'dlq'
              ? 'border-amber-400 text-amber-300'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <Flame className="h-3.5 w-3.5 text-red-400" />
          Self-Driving & DLQ (Donna)
          <span className="ml-1 rounded-full bg-red-950/60 border border-red-800/50 px-1.5 py-0.2 text-[10px] font-mono text-red-300">
            {data?.dlq?.length || 0}
          </span>
        </button>
      </div>

      {/* Main Tab Content */}
      <div className="flex-1 overflow-hidden relative">
        {error && (
          <div className="absolute top-2 right-4 z-50 flex items-center gap-2 rounded bg-red-950/80 border border-red-800 px-3 py-2 text-xs text-red-300">
            <AlertCircle className="h-4 w-4" />
            <span>{error}</span>
          </div>
        )}

        {/* TAB 1: LIVE EVENT STREAM */}
        {activeTab === 'stream' && (
          <div className="flex h-full w-full">
            {/* Left list of events */}
            <div className="flex flex-1 flex-col border-r border-slate-800/80 bg-[#0b0e14]">
              {/* Filter bar */}
              <div className="flex items-center gap-2 border-b border-slate-800/60 p-2.5 bg-[#0e121a]">
                <div className="relative flex-1">
                  <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-slate-400" />
                  <input
                    type="text"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    placeholder="Filtrer par titre, kind, source, workId..."
                    className="w-full rounded bg-slate-900 border border-slate-700/80 pl-8 pr-3 py-1.5 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-amber-500/70"
                  />
                  {searchTerm && (
                    <button onClick={() => setSearchTerm('')} className="absolute right-2 top-2 text-slate-400 hover:text-slate-200">
                      <X className="h-3.5 w-3.5" />
                    </button>
                  )}
                </div>

                {/* Domain Pills */}
                <div className="flex items-center gap-1">
                  {(['ALL', 'Tech OS', 'Life OS', 'Business OS'] as const).map((dom) => (
                    <button
                      key={dom}
                      onClick={() => setDomainFilter(dom)}
                      className={`px-2 py-1 rounded text-[11px] font-medium transition-all ${
                        domainFilter === dom
                          ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                          : 'bg-slate-900 text-slate-400 border border-slate-800 hover:bg-slate-800'
                      }`}
                    >
                      {dom === 'ALL' ? 'Tous' : dom}
                    </button>
                  ))}
                </div>

                {/* Kind Filter Dropdown */}
                <select
                  value={kindFilter}
                  onChange={(e) => setKindFilter(e.target.value)}
                  className="rounded bg-slate-900 border border-slate-700/80 px-2 py-1.5 text-xs text-slate-300 focus:outline-none"
                >
                  <option value="ALL">Tous les types</option>
                  {Object.keys(data?.eventsByKind || {}).map((k) => (
                    <option key={k} value={k}>
                      {k} ({data.eventsByKind[k]})
                    </option>
                  ))}
                </select>
              </div>

              {/* Event list scrollable */}
              <div className="flex-1 overflow-y-auto divide-y divide-slate-850">
                {filteredEvents.length === 0 ? (
                  <div className="flex h-40 flex-col items-center justify-center text-slate-500 text-xs">
                    <Activity className="h-6 w-6 mb-2 opacity-40" />
                    Aucun événement correspondant au filtre
                  </div>
                ) : (
                  filteredEvents.map((ev: EventItem) => {
                    const isSelected = selectedEvent?.id === ev.id;
                    return (
                      <div
                        key={ev.id}
                        onClick={() => setSelectedEvent(ev)}
                        className={`flex items-start justify-between p-3 cursor-pointer transition-colors ${
                          isSelected
                            ? 'bg-amber-950/20 border-l-2 border-amber-400'
                            : 'hover:bg-slate-900/60'
                        }`}
                      >
                        <div className="flex items-start gap-3 min-w-0 flex-1">
                          <div
                            className="mt-0.5 px-1.5 py-0.5 rounded text-[10px] font-mono font-bold shrink-0 uppercase border"
                            style={{
                              backgroundColor: `${ev.domainColor}15`,
                              borderColor: `${ev.domainColor}40`,
                              color: ev.domainColor
                            }}
                          >
                            {ev.domain}
                          </div>

                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-2">
                              <span className="font-semibold text-xs text-white truncate">
                                {ev.workTitle}
                              </span>
                              <span className="text-[10px] px-1.5 py-0.2 rounded bg-slate-800 text-slate-300 font-mono">
                                {ev.kind}
                              </span>
                              {ev.workId && (
                                <span className="text-[10px] text-slate-500 font-mono">#{ev.workId}</span>
                              )}
                            </div>
                            <p className="text-[11px] text-slate-300 mt-0.5 line-clamp-1">{ev.summary}</p>
                            <div className="flex items-center gap-2 mt-1 text-[10px] text-slate-500 font-mono">
                              <span>Source: {ev.source}</span>
                              <span>•</span>
                              <span>{ev.timestamp}</span>
                            </div>
                          </div>
                        </div>

                        <ChevronRight className="h-4 w-4 text-slate-600 shrink-0 ml-2 mt-2" />
                      </div>
                    );
                  })
                )}
              </div>
            </div>

            {/* Right details Inspector Drawer */}
            <div className="w-96 border-l border-slate-800/80 bg-[#0d1117] flex flex-col overflow-hidden">
              {selectedEvent ? (
                <div className="flex flex-col h-full">
                  <div className="flex items-center justify-between border-b border-slate-800 p-3 bg-[#111620]">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-white font-mono">Événement #{selectedEvent.id}</span>
                      <span
                        className="text-[10px] px-1.5 py-0.2 rounded font-mono font-bold"
                        style={{
                          backgroundColor: `${selectedEvent.domainColor}20`,
                          color: selectedEvent.domainColor
                        }}
                      >
                        {selectedEvent.domain}
                      </span>
                    </div>
                    <button
                      onClick={() => copyToClipboard(JSON.stringify(selectedEvent, null, 2))}
                      className="flex items-center gap-1 text-[11px] text-slate-400 hover:text-white px-2 py-1 rounded bg-slate-800"
                    >
                      {copied ? <Check className="h-3 w-3 text-emerald-400" /> : <Copy className="h-3 w-3" />}
                      {copied ? 'Copié' : 'JSON'}
                    </button>
                  </div>

                  <div className="flex-1 overflow-y-auto p-4 space-y-4 text-xs font-mono">
                    <div>
                      <span className="text-slate-500 uppercase text-[10px]">Titre Tâche</span>
                      <div className="text-slate-200 font-sans mt-0.5 font-medium">{selectedEvent.workTitle}</div>
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <span className="text-slate-500 uppercase text-[10px]">Type (Kind)</span>
                        <div className="text-amber-300 font-mono mt-0.5">{selectedEvent.kind}</div>
                      </div>
                      <div>
                        <span className="text-slate-500 uppercase text-[10px]">Work ID</span>
                        <div className="text-slate-300 font-mono mt-0.5">#{selectedEvent.workId || 'Système'}</div>
                      </div>
                    </div>

                    <div>
                      <span className="text-slate-500 uppercase text-[10px]">Timestamp Horodaté</span>
                      <div className="text-slate-300 mt-0.5">{selectedEvent.timestamp}</div>
                    </div>

                    <div>
                      <span className="text-slate-500 uppercase text-[10px]">Source / Harness</span>
                      <div className="text-cyan-300 mt-0.5">{selectedEvent.source}</div>
                    </div>

                    <div>
                      <span className="text-slate-500 uppercase text-[10px]">Payload Brut (Kafka/uc.db)</span>
                      <pre className="mt-1 rounded bg-black/60 border border-slate-800 p-2.5 text-[11px] text-emerald-300 overflow-x-auto whitespace-pre-wrap max-h-72">
                        {JSON.stringify(selectedEvent.payload, null, 2)}
                      </pre>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="flex h-full flex-col items-center justify-center p-6 text-center text-slate-500 text-xs">
                  <Eye className="h-8 w-8 mb-2 opacity-30" />
                  Sélectionnez un événement dans le flux pour inspecter ses métadonnées et son payload.
                </div>
              )}
            </div>
          </div>
        )}

        {/* TAB 2: LLM OBSERVABILITY (YAS) */}
        {activeTab === 'llm' && (
          <div className="flex h-full w-full flex-col overflow-y-auto p-4 space-y-4">
            {/* Top Cards Model Breakdown */}
            <div className="grid grid-cols-4 gap-3">
              {data?.modelBreakdown?.map((m: any) => (
                <div key={m.name} className="flex flex-col rounded-lg border border-slate-800 bg-[#0e131d] p-3.5">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-white flex items-center gap-1.5">
                      <span className="h-2 w-2 rounded-full" style={{ backgroundColor: m.color }} />
                      {m.name}
                    </span>
                    <span className="text-[11px] font-mono text-slate-400">{m.percentage}%</span>
                  </div>
                  <div className="mt-2 flex items-baseline justify-between">
                    <span className="text-base font-bold text-white font-mono">{m.tokens.toLocaleString()} tok</span>
                    <span className="text-xs font-mono text-amber-400">${m.cost.toFixed(4)}</span>
                  </div>
                  <div className="mt-2 h-1.5 w-full rounded-full bg-slate-800 overflow-hidden">
                    <div className="h-full rounded-full" style={{ width: `${m.percentage}%`, backgroundColor: m.color }} />
                  </div>
                </div>
              ))}
            </div>

            {/* Invocations Table */}
            <div className="rounded-lg border border-slate-800 bg-[#0e131d] overflow-hidden">
              <div className="flex items-center justify-between border-b border-slate-800 px-4 py-2.5 bg-[#121824]">
                <span className="text-xs font-bold text-white uppercase tracking-wider font-mono flex items-center gap-2">
                  <Zap className="h-4 w-4 text-cyan-400" /> Traces d'Inférence LLM en Temps Réel (Yas Core)
                </span>
                <span className="text-[11px] font-mono text-slate-400">
                  {data?.llmTraces?.length || 0} appels enregistrés
                </span>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs font-mono">
                  <thead className="border-b border-slate-800 bg-slate-900/60 text-[10px] text-slate-400 uppercase">
                    <tr>
                      <th className="p-2.5">Trace ID</th>
                      <th className="p-2.5">Agent Invoqueur</th>
                      <th className="p-2.5">Modèle</th>
                      <th className="p-2.5">Tokens (In / Out)</th>
                      <th className="p-2.5">Latence</th>
                      <th className="p-2.5">Coût ($)</th>
                      <th className="p-2.5">Outils</th>
                      <th className="p-2.5">Statut</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60">
                    {data?.llmTraces?.map((tr: LlmTrace) => (
                      <tr
                        key={tr.id}
                        onClick={() => setSelectedTrace(tr)}
                        className="hover:bg-slate-800/40 cursor-pointer transition-colors"
                      >
                        <td className="p-2.5 font-bold text-amber-400">{tr.id}</td>
                        <td className="p-2.5 text-white font-sans">{tr.agent}</td>
                        <td className="p-2.5">
                          <span className="px-1.5 py-0.5 rounded bg-slate-800 border border-slate-700 text-[11px] text-slate-200">
                            {tr.model}
                          </span>
                        </td>
                        <td className="p-2.5 text-slate-300">
                          {tr.promptTokens.toLocaleString()} / <span className="text-emerald-400 font-bold">{tr.completionTokens.toLocaleString()}</span>
                        </td>
                        <td className="p-2.5 text-indigo-300">{tr.latencyMs}ms</td>
                        <td className="p-2.5 text-amber-300 font-bold">${tr.costUsd.toFixed(4)}</td>
                        <td className="p-2.5 text-cyan-400">{tr.toolCallsCount} calls</td>
                        <td className="p-2.5">
                          <span className="flex items-center gap-1 text-emerald-400 text-[10px]">
                            <CheckCircle2 className="h-3 w-3" /> OK 200
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Trace Viewer Modal / Drawer if selected */}
            {selectedTrace && (
              <div className="rounded-lg border border-cyan-800/50 bg-[#0d1420] p-4 space-y-3">
                <div className="flex items-center justify-between border-b border-cyan-900/50 pb-2">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-cyan-300 font-mono">Détails Trace : {selectedTrace.id}</span>
                    <span className="text-[10px] px-2 py-0.5 rounded bg-cyan-950 text-cyan-200 border border-cyan-800 font-mono">
                      {selectedTrace.model}
                    </span>
                  </div>
                  <button onClick={() => setSelectedTrace(null)} className="text-slate-400 hover:text-white">
                    <X className="h-4 w-4" />
                  </button>
                </div>

                <div className="grid grid-cols-2 gap-3 text-xs">
                  <div>
                    <span className="text-[10px] uppercase text-slate-500 font-mono">Prompt / Context Preview</span>
                    <div className="mt-1 rounded bg-black/60 border border-slate-800 p-2 text-slate-300 font-mono text-[11px]">
                      {selectedTrace.promptPreview}
                    </div>
                  </div>
                  <div>
                    <span className="text-[10px] uppercase text-slate-500 font-mono">Model Completion Preview</span>
                    <div className="mt-1 rounded bg-black/60 border border-slate-800 p-2 text-emerald-300 font-mono text-[11px]">
                      {selectedTrace.responsePreview}
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* TAB 3: AGENT SESSION REPLAY */}
        {activeTab === 'replay' && (
          <div className="flex h-full w-full">
            {/* Left sessions list */}
            <div className="w-80 border-r border-slate-800/80 bg-[#0b0e14] flex flex-col">
              <div className="border-b border-slate-800 p-3 bg-[#0f131c]">
                <span className="text-xs font-bold text-white uppercase font-mono flex items-center gap-1.5">
                  <Play className="h-3.5 w-3.5 text-orange-400" /> Runs d'Agents Enregistrés
                </span>
              </div>
              <div className="flex-1 overflow-y-auto divide-y divide-slate-850">
                {data?.sessions?.map((s: AgentSession) => {
                  const isSel = s.id === selectedSessionId;
                  return (
                    <div
                      key={s.id}
                      onClick={() => {
                        setSelectedSessionId(s.id);
                        setCurrentStepIdx(0);
                        setReplayPlaying(false);
                      }}
                      className={`p-3 cursor-pointer transition-colors ${
                        isSel ? 'bg-orange-950/20 border-l-2 border-orange-400' : 'hover:bg-slate-900/60'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-semibold text-xs text-white truncate">{s.name}</span>
                        <span className="text-[10px] font-mono text-emerald-400 font-bold">{s.score}%</span>
                      </div>
                      <p className="text-[11px] text-slate-400 mt-0.5">{s.agent}</p>
                      <div className="flex items-center gap-2 mt-1 text-[10px] text-slate-500 font-mono">
                        <span>{s.startedAt}</span>
                        <span>•</span>
                        <span>{s.steps.length} étapes</span>
                        <span>•</span>
                        <span>{Math.round(s.durationSec / 60)}m</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Right player & step timeline */}
            <div className="flex-1 flex flex-col bg-[#0d1117] overflow-hidden">
              {activeSession && (
                <>
                  {/* Replay Player Controls Bar */}
                  <div className="flex items-center justify-between border-b border-slate-800 p-3 bg-[#111722]">
                    <div className="flex items-center gap-3">
                      <button
                        onClick={() => setReplayPlaying(!replayPlaying)}
                        className="flex h-8 w-8 items-center justify-center rounded-full bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold transition-all shadow-md shadow-amber-500/30"
                      >
                        {replayPlaying ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4 ml-0.5" />}
                      </button>

                      <div>
                        <span className="text-xs font-bold text-white">{activeSession.name}</span>
                        <div className="text-[10px] text-slate-400 font-mono">
                          Étape {currentStepIdx + 1} / {activeSession.steps.length} — {activeSession.agent}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <span className="text-[10px] text-slate-400 font-mono">Vitesse :</span>
                      {[1, 2, 5].map((spd) => (
                        <button
                          key={spd}
                          onClick={() => setReplaySpeed(spd)}
                          className={`px-2 py-0.5 rounded text-[10px] font-mono transition-all ${
                            replaySpeed === spd
                              ? 'bg-amber-500/30 text-amber-300 border border-amber-500/50'
                              : 'bg-slate-800 text-slate-400 hover:text-white'
                          }`}
                        >
                          {spd}x
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Scrubber Progress Line */}
                  <div className="h-1.5 w-full bg-slate-800 cursor-pointer relative" onClick={(e) => {
                    const rect = e.currentTarget.getBoundingClientRect();
                    const ratio = (e.clientX - rect.left) / rect.width;
                    const nextIdx = Math.min(activeSession.steps.length - 1, Math.max(0, Math.floor(ratio * activeSession.steps.length)));
                    setCurrentStepIdx(nextIdx);
                  }}>
                    <div
                      className="h-full bg-amber-500 transition-all duration-150"
                      style={{ width: `${((currentStepIdx + 1) / activeSession.steps.length) * 100}%` }}
                    />
                  </div>

                  {/* Step Execution Timeline */}
                  <div className="flex-1 overflow-y-auto p-4 space-y-3">
                    {activeSession.steps.map((st: SessionStep, idx: number) => {
                      const isCurrent = idx === currentStepIdx;
                      const isPast = idx < currentStepIdx;

                      let badgeColor = '#3b82f6';
                      if (st.type === 'USER_INPUT') badgeColor = '#f59e0b';
                      if (st.type === 'THINKING') badgeColor = '#06b6d4';
                      if (st.type === 'TOOL_CALL') badgeColor = '#a855f7';
                      if (st.type === 'TOOL_RESULT') badgeColor = '#10b981';

                      return (
                        <div
                          key={st.step}
                          onClick={() => setCurrentStepIdx(idx)}
                          className={`rounded-lg border p-3 cursor-pointer transition-all ${
                            isCurrent
                              ? 'bg-slate-900 border-amber-400 shadow-md shadow-amber-500/10'
                              : isPast
                              ? 'bg-slate-900/40 border-slate-800/80 opacity-75'
                              : 'bg-slate-950/40 border-slate-850 opacity-40'
                          }`}
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <span
                                className="text-[10px] px-1.5 py-0.2 rounded font-mono font-bold"
                                style={{ backgroundColor: `${badgeColor}20`, color: badgeColor }}
                              >
                                {st.type}
                              </span>
                              <span className="text-xs font-semibold text-white">{st.title}</span>
                            </div>
                            <div className="flex items-center gap-2 text-[10px] text-slate-500 font-mono">
                              <span>{st.timestamp}</span>
                              {st.durationMs > 0 && <span>+{st.durationMs}ms</span>}
                            </div>
                          </div>
                          <p className="mt-1 text-xs text-slate-300 font-mono">{st.detail}</p>
                        </div>
                      );
                    })}
                  </div>
                </>
              )}
            </div>
          </div>
        )}

        {/* TAB 4: FEATURE FLAGS & BETH VETO */}
        {activeTab === 'flags' && (
          <div className="flex h-full w-full flex-col overflow-y-auto p-4 space-y-5">
            {/* Beth Veto Banner Detail */}
            <div className="rounded-lg border border-amber-500/40 bg-gradient-to-r from-amber-950/40 via-red-950/30 to-black p-4">
              <div className="flex items-center gap-2 text-amber-400 font-bold text-xs uppercase font-mono">
                <ShieldAlert className="h-4 w-4 text-amber-400 animate-pulse" />
                SYSTÈME DE VETO BETH — LES 5 PORTES IRRÉVERSIBLES (LOI L0 & L-VETO)
              </div>
              <p className="text-xs text-slate-300 mt-1">
                Ces portes exigent une signature humaine explicite avant franchissement. Toute tentative par un agent autonome est avortée par trigger SQL strict.
              </p>
              <div className="grid grid-cols-5 gap-2 mt-3 font-mono text-[11px]">
                {[
                  { name: '1. CA RACINE', status: 'VERROUILLÉ', color: 'emerald' },
                  { name: '2. PUSH DIVERGENT', status: 'VERROUILLÉ', color: 'emerald' },
                  { name: '3. VIREMENT COMPTE', status: 'VETO ACTIF', color: 'amber' },
                  { name: '4. SUPPRESSION DB', status: 'BLOCAGE ACID', color: 'red' },
                  { name: '5. CONFIANCE MACHINE', status: 'SURVEILLÉ', color: 'cyan' },
                ].map((gate) => (
                  <div key={gate.name} className="rounded border border-slate-800 bg-black/60 p-2 text-center">
                    <span className="text-[10px] text-slate-400 block">{gate.name}</span>
                    <span className="text-xs font-bold text-white mt-0.5 block">{gate.status}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Feature Flags Table */}
            <div className="rounded-lg border border-slate-800 bg-[#0e131d] overflow-hidden">
              <div className="flex items-center justify-between border-b border-slate-800 px-4 py-2.5 bg-[#121824]">
                <span className="text-xs font-bold text-white uppercase tracking-wider font-mono flex items-center gap-2">
                  <Sliders className="h-4 w-4 text-purple-400" /> Drapeaux d'Expérimentation & Modes Opérationnels
                </span>
                <span className="text-[11px] font-mono text-slate-400">Persistence locale dans feature_flags.json</span>
              </div>

              <div className="divide-y divide-slate-800/80">
                {data?.featureFlags?.map((fl: FeatureFlag) => (
                  <div key={fl.id} className="flex items-center justify-between p-3.5 hover:bg-slate-800/30 transition-colors">
                    <div className="min-w-0 flex-1 pr-4">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-white font-mono">{fl.name}</span>
                        <span className="text-[10px] px-1.5 py-0.2 rounded bg-slate-800 text-slate-300 font-mono">
                          {fl.id}
                        </span>
                        <span className="text-[10px] px-1.5 py-0.2 rounded bg-purple-950/60 border border-purple-800/50 text-purple-300 font-mono">
                          {fl.blastRadius}
                        </span>
                      </div>
                      <p className="text-xs text-slate-400 mt-1">{fl.description}</p>
                    </div>

                    {/* Toggle Button */}
                    <button
                      onClick={() => handleToggleFlag(fl.id)}
                      className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                        fl.enabled ? 'bg-amber-500' : 'bg-slate-700'
                      }`}
                    >
                      <span
                        className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-lg ring-0 transition duration-200 ease-in-out ${
                          fl.enabled ? 'translate-x-5' : 'translate-x-0'
                        }`}
                      />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* TAB 5: SELF-DRIVING & DLQ */}
        {activeTab === 'dlq' && (
          <div className="flex h-full w-full flex-col overflow-y-auto p-4 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                  <Flame className="h-4 w-4 text-red-400" />
                  DEAD LETTER QUEUE (DONNA DLQ) & SELF-DRIVING HEALING
                </h3>
                <p className="text-xs text-slate-400">
                  Détection des exceptions d'exécution et génération automatique de patchs de remédiation par Ryan.
                </p>
              </div>
            </div>

            <div className="space-y-3">
              {data?.dlq?.map((item: DlqItem) => (
                <div key={item.id} className="rounded-lg border border-slate-800 bg-[#0e131d] p-4 space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-white font-mono">{item.workTitle}</span>
                      <span className="text-[10px] px-1.5 py-0.2 rounded bg-red-950 border border-red-800 text-red-300 font-mono">
                        {item.errorType}
                      </span>
                    </div>
                    <span className="text-[10px] text-slate-500 font-mono">{item.timestamp}</span>
                  </div>

                  <p className="text-xs text-red-300/90 font-mono bg-red-950/20 border border-red-900/40 p-2 rounded">
                    {item.message}
                  </p>

                  <div className="flex items-center justify-between pt-1">
                    <div className="text-xs text-slate-300 font-sans">
                      <span className="text-[10px] text-amber-400 uppercase font-mono mr-1.5">Recommandation Ryan :</span>
                      {item.patchSuggestion}
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleRemediate(item.id)}
                        className="flex items-center gap-1 px-3 py-1 rounded text-xs font-medium bg-emerald-600 hover:bg-emerald-500 text-white shadow-sm transition-all"
                      >
                        <Check className="h-3 w-3" /> Appliquer Auto-Patch
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
