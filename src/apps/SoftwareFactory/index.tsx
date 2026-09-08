import { useState, useEffect } from 'react';
import type { AppManifest } from '../../types';
import {
  Cpu,
  Play,
  RotateCcw,
  CheckCircle2,
  AlertCircle,
  Clock,
  Layers,
  Terminal,
  ExternalLink,
  ShieldCheck,
  ChevronRight,
  Maximize2
} from 'lucide-react';

export const manifest: AppManifest = {
  id: 'software-factory',
  name: 'Software Factory (Ryan)',
  kind: 'singleton',
  description: 'Atelier de construction logiciel autonome (Ryan) piloté par Antigravity — sessions ADW, phases, portes de validation et visualiseur SSSF interactif.',
  icon: '🏭',
  domaine: 'l0-tech',
  category: 'CI/CD & Provisioning',
  accentColor: '#10b981',
  dockSlot: 7,
};

interface FactoryHealth {
  ok: boolean;
  db: string;
  sessions: number;
  phases: number;
}

interface SSSFSession {
  adw_id: string;
  issue_number?: number;
  created_at: string;
  updated_at?: string;
  current_phase?: string;
  phase_count: number;
  phases: Array<{
    phase_name: string;
    status: string;
    started_at: string;
    completed_at?: string;
  }>;
}

const AVAILABLE_WORKFLOWS = [
  {
    id: 'adw_scout.py',
    name: 'ADW Scout (Audit Codebase)',
    desc: 'Analyse et inventaire instantané de la codebase sans altération.',
    defaultPrompt: 'Audit exhaustif de l\'architecture et dépendances actuelles',
    color: 'emerald'
  },
  {
    id: 'adw_prompt.py',
    name: 'ADW Prompt (Spécification)',
    desc: 'Clarifie le besoin et structure les spécifications d\'exécution.',
    defaultPrompt: 'Spécification détaillée des endpoints et types de données',
    color: 'blue'
  },
  {
    id: 'adw_plan.py',
    name: 'ADW Plan (Architecture & Gates)',
    desc: 'Élabore le plan d\'action complet et matérialise les gates de validation.',
    defaultPrompt: 'Plan de refactorisation et tests automatisés',
    color: 'indigo'
  },
  {
    id: 'adw_build.py',
    name: 'ADW Build (Génération & Implémentation)',
    desc: 'Génération de code autonome pilotée par Antigravity.',
    defaultPrompt: 'Implémentation des modules manquants',
    color: 'amber'
  },
  {
    id: 'adw_plan_build_test.py',
    name: 'ADW Plan + Build + Test (Full Pipeline)',
    desc: 'Pipeline complet de bout en bout avec boucle de vérification.',
    defaultPrompt: 'Pipeline complet de vérification et compilation',
    color: 'rose'
  }
];

export function App() {
  const [activeTab, setActiveTab] = useState<'visualizer' | 'workflows' | 'sessions'>('visualizer');
  const [health, setHealth] = useState<FactoryHealth | null>(null);
  const [sessions, setSessions] = useState<SSSFSession[]>([]);
  const [selectedSession, setSelectedSession] = useState<any | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // Workflow execution state
  const [selectedWorkflow, setSelectedWorkflow] = useState(AVAILABLE_WORKFLOWS[0].id);
  const [workflowPrompt, setWorkflowPrompt] = useState(AVAILABLE_WORKFLOWS[0].defaultPrompt);
  const [runningWorkflow, setRunningWorkflow] = useState<boolean>(false);
  const [executionResult, setExecutionResult] = useState<any | null>(null);

  const fetchHealthAndSessions = async () => {
    try {
      setLoading(true);
      setError(null);
      const [healthRes, sessionsRes] = await Promise.all([
        fetch('/api/tech-os/factory/health'),
        fetch('/api/tech-os/factory/sessions')
      ]);

      if (healthRes.ok) {
        const hData = await healthRes.json();
        setHealth(hData);
      }
      if (sessionsRes.ok) {
        const sData = await sessionsRes.json();
        if (sData.ok && Array.isArray(sData.sessions)) {
          setSessions(sData.sessions);
        }
      }
    } catch (e: any) {
      setError(e.message || 'Erreur de connexion à l\'API SSSF');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHealthAndSessions();
    const interval = setInterval(fetchHealthAndSessions, 15000);
    return () => clearInterval(interval);
  }, []);

  const loadSessionDetail = async (adwId: string) => {
    try {
      const res = await fetch(`/api/tech-os/factory/sessions/${adwId}`);
      if (res.ok) {
        const data = await res.json();
        setSelectedSession(data);
      }
    } catch (err) {
      console.error('Erreur chargement session:', err);
    }
  };

  const handleRunWorkflow = async () => {
    if (runningWorkflow) return;
    setRunningWorkflow(true);
    setExecutionResult(null);
    try {
      const res = await fetch('/api/tech-os/factory/run-workflow', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          workflow: selectedWorkflow,
          prompt: workflowPrompt
        })
      });
      const data = await res.json();
      setExecutionResult(data);
      fetchHealthAndSessions();
    } catch (e: any) {
      setExecutionResult({ ok: false, error: e.message || 'Erreur exécution workflow' });
    } finally {
      setRunningWorkflow(false);
    }
  };

  return (
    <div className="h-full flex flex-col bg-slate-950 text-slate-100 font-sans select-none">
      {/* Header bar */}
      <div className="flex items-center justify-between px-4 py-2.5 bg-slate-900/80 border-b border-slate-800/80 backdrop-blur">
        <div className="flex items-center space-x-3">
          <div className="p-2 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400">
            <Cpu className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <span className="font-semibold text-sm tracking-wide text-white">Software Factory</span>
              <span className="text-xs px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 font-mono border border-emerald-500/30">
                Agent Ryan
              </span>
              <span className="text-xs px-2 py-0.5 rounded-full bg-blue-500/20 text-blue-300 font-mono border border-blue-500/30">
                Antigravity Engine
              </span>
            </div>
            <div className="text-xs text-slate-400 flex items-center space-x-3 mt-0.5">
              <span>DB: {health?.ok ? 'sssf.db (WAL Connecté)' : 'Déconnecté'}</span>
              <span>•</span>
              <span>{health?.sessions ?? 0} sessions</span>
              <span>•</span>
              <span>{health?.phases ?? 0} phases archivées</span>
            </div>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="flex items-center space-x-1 bg-slate-950/60 p-1 rounded-lg border border-slate-800">
          <button
            onClick={() => setActiveTab('visualizer')}
            className={`px-3 py-1.5 rounded-md text-xs font-medium transition-all ${
              activeTab === 'visualizer'
                ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Visualiseur SSSF (4600)
          </button>
          <button
            onClick={() => setActiveTab('workflows')}
            className={`px-3 py-1.5 rounded-md text-xs font-medium transition-all ${
              activeTab === 'workflows'
                ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Workflows ADW
          </button>
          <button
            onClick={() => setActiveTab('sessions')}
            className={`px-3 py-1.5 rounded-md text-xs font-medium transition-all ${
              activeTab === 'sessions'
                ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Sessions ({sessions.length})
          </button>

          <button
            onClick={fetchHealthAndSessions}
            disabled={loading}
            title="Rafraîchir"
            className="p-1.5 rounded-md text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition"
          >
            <RotateCcw className={`w-3.5 h-3.5 ${loading ? 'animate-spin text-emerald-400' : ''}`} />
          </button>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 overflow-hidden relative">
        {/* TAB 1: VISUALIZER IFRAME */}
        {activeTab === 'visualizer' && (
          <div className="w-full h-full flex flex-col">
            <div className="px-3 py-1.5 bg-slate-900/50 border-b border-slate-800/60 flex items-center justify-between text-xs text-slate-400">
              <div className="flex items-center space-x-2">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                <span>Flux visuel temps réel connecté sur http://127.0.0.1:4600</span>
              </div>
              <a
                href="http://127.0.0.1:4600"
                target="_blank"
                rel="noreferrer"
                className="flex items-center space-x-1 text-slate-400 hover:text-emerald-400 transition"
              >
                <span>Ouvrir en externe</span>
                <ExternalLink className="w-3 h-3" />
              </a>
            </div>
            <iframe
              src="http://127.0.0.1:4600"
              title="SSSF Visualizer"
              className="w-full flex-1 border-0 bg-slate-950"
            />
          </div>
        )}

        {/* TAB 2: WORKFLOWS RUNNER */}
        {activeTab === 'workflows' && (
          <div className="w-full h-full p-6 overflow-y-auto flex flex-col space-y-6">
            <div className="max-w-4xl mx-auto w-full space-y-6">
              <div>
                <h3 className="text-lg font-bold text-white flex items-center space-x-2">
                  <Terminal className="w-5 h-5 text-emerald-400" />
                  <span>Exécuter un Workflow Autonome (Ryan)</span>
                </h3>
                <p className="text-xs text-slate-400 mt-1">
                  Tous les workflows SSSF utilisent désormais le runner Antigravity (Gemini 3.7 Flash) avec enveloppes typées et gates vérifiées.
                </p>
              </div>

              {/* Workflow Selector Cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {AVAILABLE_WORKFLOWS.map((wf) => {
                  const isSelected = selectedWorkflow === wf.id;
                  return (
                    <div
                      key={wf.id}
                      onClick={() => {
                        setSelectedWorkflow(wf.id);
                        setWorkflowPrompt(wf.defaultPrompt);
                      }}
                      className={`p-3.5 rounded-xl border cursor-pointer transition-all ${
                        isSelected
                          ? 'bg-emerald-500/10 border-emerald-500/40 shadow-lg shadow-emerald-500/5 ring-1 ring-emerald-500/30'
                          : 'bg-slate-900/40 border-slate-800/80 hover:bg-slate-900/80 hover:border-slate-700'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-semibold text-sm text-slate-100">{wf.name}</span>
                        {isSelected && <CheckCircle2 className="w-4 h-4 text-emerald-400" />}
                      </div>
                      <p className="text-xs text-slate-400 mt-1 leading-relaxed">{wf.desc}</p>
                      <div className="mt-2 text-[11px] font-mono text-slate-500">{wf.id}</div>
                    </div>
                  );
                })}
              </div>

              {/* Prompt Input Form */}
              <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800 space-y-3">
                <label className="block text-xs font-semibold text-slate-300">
                  Instruction / Spécification transmise à Ryan & Antigravity :
                </label>
                <textarea
                  value={workflowPrompt}
                  onChange={(e) => setWorkflowPrompt(e.target.value)}
                  rows={3}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg p-3 text-xs text-slate-200 focus:outline-none focus:border-emerald-500/50 font-mono resize-none"
                  placeholder="Définissez l'objectif du workflow..."
                />

                <div className="flex items-center justify-between pt-1">
                  <div className="flex items-center space-x-2 text-xs text-slate-400">
                    <ShieldCheck className="w-4 h-4 text-emerald-400" />
                    <span>Enveloppes JSON validées • Sortie directe vers sssf.db</span>
                  </div>

                  <button
                    onClick={handleRunWorkflow}
                    disabled={runningWorkflow || !workflowPrompt.trim()}
                    className={`flex items-center space-x-2 px-5 py-2 rounded-lg text-xs font-semibold transition shadow-lg ${
                      runningWorkflow || !workflowPrompt.trim()
                        ? 'bg-slate-800 text-slate-500 cursor-not-allowed'
                        : 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-emerald-900/20'
                    }`}
                  >
                    {runningWorkflow ? (
                      <>
                        <RotateCcw className="w-3.5 h-3.5 animate-spin" />
                        <span>Exécution en cours...</span>
                      </>
                    ) : (
                      <>
                        <Play className="w-3.5 h-3.5 fill-current" />
                        <span>Lancer {selectedWorkflow}</span>
                      </>
                    )}
                  </button>
                </div>
              </div>

              {/* Result Preview */}
              {executionResult && (
                <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800 space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2 text-xs">
                      {executionResult.ok ? (
                        <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                      ) : (
                        <AlertCircle className="w-4 h-4 text-rose-400" />
                      )}
                      <span className="font-semibold text-slate-200">
                        Résultat d'exécution ({executionResult.executionTimeMs} ms)
                      </span>
                    </div>
                    <span className="text-[11px] text-slate-500 font-mono">
                      {executionResult.timestampEdt}
                    </span>
                  </div>

                  <div className="bg-slate-950 p-3 rounded-lg border border-slate-800/80 font-mono text-[11px] text-slate-300 max-h-60 overflow-y-auto whitespace-pre-wrap">
                    {executionResult.stdout || executionResult.stderr || executionResult.error}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* TAB 3: SESSIONS HISTORY */}
        {activeTab === 'sessions' && (
          <div className="w-full h-full flex overflow-hidden">
            {/* Sessions List */}
            <div className="w-1/2 h-full border-r border-slate-800/80 overflow-y-auto p-4 space-y-2">
              <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
                Sessions SSSF Enregistrées ({sessions.length})
              </div>

              {sessions.map((sess) => {
                const isSelected = selectedSession?.session?.adw_id === sess.adw_id;
                return (
                  <div
                    key={sess.adw_id}
                    onClick={() => loadSessionDetail(sess.adw_id)}
                    className={`p-3 rounded-xl border cursor-pointer transition ${
                      isSelected
                        ? 'bg-emerald-500/10 border-emerald-500/40'
                        : 'bg-slate-900/40 border-slate-800/80 hover:bg-slate-900'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <Layers className="w-3.5 h-3.5 text-emerald-400" />
                        <span className="font-mono text-xs font-semibold text-white">
                          {sess.adw_id}
                        </span>
                      </div>
                      <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-slate-800 text-slate-300">
                        {sess.phase_count} phases
                      </span>
                    </div>

                    <div className="mt-2 flex items-center justify-between text-[11px] text-slate-400">
                      <span>Phase active: <strong className="text-slate-200">{sess.current_phase || 'Complétée'}</strong></span>
                      <span className="font-mono">{sess.created_at?.slice(0, 19)}</span>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Session Detail View */}
            <div className="w-1/2 h-full overflow-y-auto p-4 bg-slate-950/40">
              {selectedSession ? (
                <div className="space-y-4">
                  <div>
                    <h4 className="text-sm font-bold text-white flex items-center space-x-2">
                      <span>Session {selectedSession.session?.adw_id}</span>
                    </h4>
                    <p className="text-xs text-slate-400 mt-0.5">
                      Issue #{selectedSession.session?.issue_number || 'N/A'} • Créé à {selectedSession.session?.created_at}
                    </p>
                  </div>

                  {/* Phases timeline */}
                  <div className="space-y-2">
                    <span className="text-xs font-semibold text-slate-400">Phases & Exécutions</span>
                    <div className="space-y-1.5">
                      {selectedSession.phases?.map((p: any) => (
                        <div
                          key={p.phase_id}
                          className="p-2.5 rounded-lg bg-slate-900 border border-slate-800 flex items-center justify-between text-xs"
                        >
                          <div className="flex items-center space-x-2">
                            <span className="w-2 h-2 rounded-full bg-emerald-400" />
                            <span className="font-medium text-slate-200">{p.phase_name}</span>
                          </div>
                          <div className="flex items-center space-x-3 text-slate-400 font-mono text-[11px]">
                            <span>{p.status}</span>
                            <span>{p.started_at?.slice(11, 19)}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Validation Gates */}
                  {selectedSession.gates && selectedSession.gates.length > 0 && (
                    <div className="space-y-2">
                      <span className="text-xs font-semibold text-slate-400">Portes de validation (Gates)</span>
                      <div className="space-y-1.5">
                        {selectedSession.gates.map((g: any) => (
                          <div
                            key={g.gate_id}
                            className="p-2.5 rounded-lg bg-slate-900 border border-slate-800 flex items-center justify-between text-xs"
                          >
                            <span className="font-mono text-slate-300">{g.gate_name}</span>
                            <span className={`px-2 py-0.5 rounded text-[10px] font-mono ${
                              g.status === 'passed'
                                ? 'bg-emerald-500/20 text-emerald-300'
                                : 'bg-rose-500/20 text-rose-300'
                            }`}>
                              {g.status}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div className="h-full flex flex-col items-center justify-center text-slate-500 text-xs space-y-2">
                  <Layers className="w-8 h-8 opacity-40" />
                  <span>Sélectionnez une session pour inspecter ses phases et gates.</span>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
export default App;
