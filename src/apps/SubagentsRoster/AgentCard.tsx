import { useRuntimePresence } from '../../hooks/useRuntimePresence';
import type { Subagent } from './index';

interface AgentCardProps {
  agent: Subagent;
  invokingId: string | null;
  invokeAgent: (id: string) => void;
}

export function AgentCard({ agent, invokingId, invokeAgent }: AgentCardProps) {
  const { status, reconciliationState, systemStatus, evidenceRefs, presence, fingerprint } = useRuntimePresence(agent.id);

  const getStatusColor = (statusStr: string) => {
    switch (statusStr) {
      case 'AVAILABLE':
      case 'EXECUTING':
      case 'BOUND': return 'bg-emerald-950/80 text-emerald-400 border-emerald-800';
      case 'STALE': return 'bg-amber-950/80 text-amber-400 border-amber-800';
      case 'DEGRADED': return 'bg-orange-950/80 text-orange-400 border-orange-800';
      case 'OFFLINE': return 'bg-rose-950/80 text-rose-400 border-rose-800';
      case 'LOADING': return 'bg-slate-900/80 text-slate-400 border-slate-700';
      default: return 'bg-slate-800/80 text-slate-400 border-slate-600'; // UNKNOWN
    }
  };

  const statusColor = getStatusColor(status);
  
  return (
    <div className="p-4 rounded-xl bg-slate-900/70 border border-slate-800 hover:border-slate-700 transition-all flex flex-col justify-between">
      <div>
        <div className="flex items-start justify-between">
          <div>
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              {agent.name}
              <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 border border-slate-700">
                {agent.layer}
              </span>
            </h3>
            <p className="text-xs text-indigo-300 font-medium mt-0.5">{agent.role}</p>
          </div>

          <div className="flex flex-col items-end gap-1">
             <span className={`flex items-center gap-1.5 px-2 py-1 rounded text-[10px] font-bold border ${statusColor}`}>
                {(status === 'AVAILABLE' || status === 'EXECUTING') && (
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                )}
                {status}
             </span>
             {status === 'STALE' && (
                 <span className="text-[9px] text-amber-400">{reconciliationState}</span>
             )}
             {status === 'DEGRADED' && (
                 <span className="text-[9px] text-orange-400">{systemStatus}</span>
             )}
          </div>
        </div>

        <p className="text-xs text-slate-400 mt-2 line-clamp-2 leading-relaxed">
          {agent.mission}
        </p>

        {agent.scheduledTasks && agent.scheduledTasks.length > 0 && (
          <div className="mt-3 pt-2 border-t border-slate-800/80">
            <div className="text-[10px] uppercase tracking-wider font-semibold text-slate-400 mb-1">
              Tâche Programmée :
            </div>
            <div className="flex flex-wrap gap-1.5">
              {agent.scheduledTasks.map((t: any) => (
                <span
                  key={t.id}
                  className="px-2 py-0.5 rounded bg-slate-800 text-cyan-300 text-[10px] font-mono border border-slate-700 flex items-center gap-1"
                  title={t.purpose}
                >
                  <span className="font-bold">{t.id}</span>
                  <span className="text-slate-400">· {t.frequency}</span>
                </span>
              ))}
            </div>
          </div>
        )}
      </div>

      <div className="mt-4 pt-3 border-t border-slate-800 flex flex-col gap-2">
        <div className="flex items-center justify-between">
          <div className="flex flex-col gap-0.5">
            <span className="text-[10px] text-slate-500 font-mono">
              {evidenceRefs && evidenceRefs.length > 0 ? `Evidence: ${evidenceRefs.join(', ')}` : 'No valid evidence'}
            </span>
            <span className="text-[10px] text-slate-500 font-mono">
              {presence ? `Observed: ${new Date(presence.observedAt).toLocaleTimeString()}` : ''}
            </span>
          </div>

          <button
            onClick={() => invokeAgent(agent.id)}
            disabled={invokingId === agent.id}
            className="px-3 py-1.5 text-xs font-semibold rounded-lg bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white transition-colors flex items-center gap-1.5 shadow-sm"
          >
            <span>{invokingId === agent.id ? '⏳' : '⚡'}</span>
            <span>{invokingId === agent.id ? 'En cours...' : 'Invoquer'}</span>
          </button>
        </div>
        
        {fingerprint && (
          <div className="bg-slate-950/50 p-2 rounded border border-slate-800 flex flex-col gap-1 mt-2">
             <div className="text-[9px] text-slate-400 font-mono flex flex-col gap-0.5">
                <span>AgentOS HEAD: {fingerprint.agentOsDesktopHeadSha.substring(0, 8)}{fingerprint.agentOsDesktopIsDirty ? '*' : ''}</span>
                <span>Parent Gitlink: {fingerprint.parentGitlinkCommitSha.substring(0, 8)}</span>
                <span>Parent Repo: {fingerprint.parentRepoSha.substring(0, 8)}</span>
             </div>
          </div>
        )}
      </div>
    </div>
  );
}
