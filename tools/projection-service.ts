import os from 'node:os';
import path from 'node:path';
import fs from 'node:fs';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import type {
  ApiProjectionRequest,
  ApiProjectionResponse,
  SystemStatus,
  ReconciliationClassification,
  SourceSyncFingerprint,
  RuntimePresence
} from '../src/contracts/truth.ts';

const execFileAsync = promisify(execFile);

export interface ProjectionEnv {
  SUPABASE_URL?: string;
  SUPABASE_ANON_KEY?: string;
  RUNTIME_MANIFEST_PATH?: string;
  WORKSPACE_REGISTRY_PATH?: string;
}

interface DcRuntimeManifestV1 {
  schema: 'aspace.dc.runtime.v1';
  state?: string;
  gateway_url?: string;
  health_urls?: {
    filesystem?: string;
    process?: string;
    browser?: string;
  };
  url?: string;
}

interface DcBrowserHealthV1 {
  schema: 'aspace.machine.health.v1';
  daemon?: string;
  worker?: string;
  aggregate?: string;
  capabilities?: Record<string, unknown>;
  worker_ref?: string | null;
  fencing_token?: number | null;
  degraded_reason?: string | null;
  presence?: {
    active?: boolean;
    ttl_expired?: boolean;
    last_seen?: string | null;
    session_id?: string | null;
    fencing_token?: number | null;
    worker_id?: string | null;
  };
}

function runtimeManifestPath(override?: string): string {
  return override || path.join(os.homedir(), '.aspace', 'dc', 'run', 'runtime.json');
}

interface WorkspaceRegistrySourcePaths {
  parentRepoPath?: string;
  parentGitlinkPath?: string;
  agentOsDesktopPath?: string;
}

function workspaceRegistryPath(override?: string): string {
  return override || process.env.ASPACE_WORKSPACE_REGISTRY ||
    path.join(os.homedir(), 'ASpace_OS_V3', 'ASPACE_WORKSPACE_REGISTRY.json');
}

export function resolveWorkspaceSourcePaths(registry: unknown): WorkspaceRegistrySourcePaths {
  if (!registry || typeof registry !== 'object') return {};
  const root = registry as any;
  return {
    parentRepoPath: root?.repositories?.core?.aspace_v3?.local_path,
    parentGitlinkPath: root?.repositories?.satellites?.agent_os?.legacy_v3_gitlink,
    agentOsDesktopPath: root?.repositories?.satellites?.agent_os_desktop?.local_path,
  };
}

async function gitOutput(cwd: string, args: string[]): Promise<string> {
  const { stdout } = await execFileAsync('git', args, { cwd, timeout: 2500 });
  return stdout.trim();
}

async function readGitlinkCommit(parentRepoPath: string, gitlinkPath: string): Promise<string> {
  const relative = path.relative(parentRepoPath, gitlinkPath).replace(/\\/g, '/');
  if (!relative || relative.startsWith('../')) return 'UNKNOWN';
  try {
    const row = await gitOutput(parentRepoPath, ['ls-tree', 'HEAD', '--', relative]);
    const match = row.match(/^160000\s+commit\s+([0-9a-f]{40})\t/);
    return match?.[1] || 'UNKNOWN';
  } catch {
    return 'UNKNOWN';
  }
}

export function resolveBrowserHealthUrl(manifest: unknown): string {
  if (!manifest || typeof manifest !== 'object') {
    throw new Error('Runtime manifest malformed');
  }

  const candidate = manifest as Partial<DcRuntimeManifestV1>;

  if (
    candidate.schema === 'aspace.dc.runtime.v1' &&
    candidate.health_urls &&
    typeof candidate.health_urls.browser === 'string' &&
    candidate.health_urls.browser.length > 0
  ) {
    return candidate.health_urls.browser;
  }

  // Backward-compatible fallback for the pre-v1 manifest used by early Agent OS builds.
  if (typeof candidate.url === 'string' && candidate.url.length > 0) {
    return `${candidate.url.replace(/\/$/, '')}/health`;
  }

  throw new Error('Runtime manifest missing browser health URL');
}

export function mapBrowserHealthToPresence(
  data: DcBrowserHealthV1,
  observedAt: number = Date.now(),
  ttlSeconds: number = 5
): RuntimePresence {
  const raw = data.presence || {};
  const active = raw.active === true && data.worker === 'UP';
  const identity =
    raw.worker_id ||
    raw.session_id ||
    data.worker_ref ||
    'aspace-dc-browser';

  return {
    identity,
    provenance: 'aspace.dc.runtime.v1/health_urls.browser',
    observedAt,
    expiresAt: active ? observedAt + ttlSeconds * 1000 : Math.max(1, observedAt - 1),
    ttlSeconds,
    livenessReason: active
      ? 'browser_worker_active'
      : raw.ttl_expired
        ? 'browser_worker_ttl_expired'
        : (data.degraded_reason || 'browser_worker_unavailable'),
    evidenceRefs: [
      'runtime-manifest:aspace.dc.runtime.v1',
      'runtime-health:aspace.machine.health.v1'
    ],
    fencingLeaseIdentity:
      raw.fencing_token != null
        ? `fence:${raw.fencing_token}`
        : data.fencing_token != null
          ? `fence:${data.fencing_token}`
          : '',
    capabilities: data.capabilities || {}
  };
}

export class ServerProjectionService {
  private env: ProjectionEnv;

  constructor(env: ProjectionEnv = {}) {
    this.env = {
      SUPABASE_URL: env.SUPABASE_URL || process.env.SUPABASE_URL,
      SUPABASE_ANON_KEY: env.SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY,
      RUNTIME_MANIFEST_PATH: env.RUNTIME_MANIFEST_PATH || process.env.ASPACE_DC_RUNTIME_MANIFEST,
      WORKSPACE_REGISTRY_PATH: env.WORKSPACE_REGISTRY_PATH || process.env.ASPACE_WORKSPACE_REGISTRY
    };
  }

  private async getLocalFingerprint(): Promise<SourceSyncFingerprint> {
    let sourcePaths: WorkspaceRegistrySourcePaths = {};
    const registryPath = workspaceRegistryPath(this.env.WORKSPACE_REGISTRY_PATH);

    try {
      if (fs.existsSync(registryPath)) {
        sourcePaths = resolveWorkspaceSourcePaths(
          JSON.parse(fs.readFileSync(registryPath, 'utf8'))
        );
      }
    } catch {
      sourcePaths = {};
    }

    const agentRepoPath = sourcePaths.agentOsDesktopPath || process.cwd();
    let agentOsDesktopHeadSha = 'UNKNOWN';
    let agentOsDesktopIsDirty = false;
    try {
      agentOsDesktopHeadSha = (await gitOutput(agentRepoPath, ['rev-parse', 'HEAD'])) || 'UNKNOWN';
      agentOsDesktopIsDirty = (await gitOutput(agentRepoPath, ['status', '--porcelain'])).length > 0;
    } catch {
      // Keep explicit UNKNOWN; projection must not synthesize a source SHA.
    }

    let parentRepoSha = 'UNKNOWN';
    if (sourcePaths.parentRepoPath) {
      try {
        parentRepoSha = (await gitOutput(sourcePaths.parentRepoPath, ['rev-parse', 'HEAD'])) || 'UNKNOWN';
      } catch {
        parentRepoSha = 'UNKNOWN';
      }
    }

    const parentGitlink = sourcePaths.parentGitlinkPath || 'UNKNOWN';
    const parentGitlinkCommitSha =
      sourcePaths.parentRepoPath && sourcePaths.parentGitlinkPath
        ? await readGitlinkCommit(sourcePaths.parentRepoPath, sourcePaths.parentGitlinkPath)
        : 'UNKNOWN';

    return {
      parentRepoSha,
      parentGitlinkCommitSha,
      parentGitlink,
      agentOsDesktopHeadSha,
      agentOsDesktopIsDirty
    };
  }

  private async checkLocalRuntimeHealth(): Promise<{ isAvailable: boolean, presence?: RuntimePresence, error?: string }> {
    const manifestPath = runtimeManifestPath(this.env.RUNTIME_MANIFEST_PATH);

    try {
      if (!fs.existsSync(manifestPath)) {
        return { isAvailable: false, error: 'Runtime manifest not found' };
      }

      let manifest: unknown;
      try {
        manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
      } catch {
        return { isAvailable: false, error: 'Runtime manifest malformed' };
      }

      let healthUrl: string;
      try {
        healthUrl = resolveBrowserHealthUrl(manifest);
      } catch (error: any) {
        return { isAvailable: false, error: error.message };
      }

      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 2000);

      try {
        const response = await fetch(healthUrl, { signal: controller.signal });

        if (!response.ok) {
          return { isAvailable: false, error: `Runtime health HTTP ${response.status}` };
        }

        const data = await response.json() as DcBrowserHealthV1;

        if (data.schema !== 'aspace.machine.health.v1') {
          return { isAvailable: false, error: 'Runtime health schema invalid' };
        }

        return {
          isAvailable: true,
          presence: mapBrowserHealthToPresence(data)
        };
      } finally {
        clearTimeout(timeout);
      }
    } catch (e: any) {
      const message = e?.name === 'AbortError'
        ? 'Runtime health unavailable: timeout'
        : `Runtime health unavailable: ${e?.message || 'unknown error'}`;
      return { isAvailable: false, error: message };
    }
  }

  async evaluateSystemStatus(localAvailable: boolean): Promise<SystemStatus> {
    const hasCloud = Boolean(this.env.SUPABASE_URL && this.env.SUPABASE_ANON_KEY);

    if (hasCloud && localAvailable) {
      return 'ONLINE_AUTHENTICATED';
    }

    if (localAvailable && !hasCloud) {
      return 'DEGRADED_PROVIDER';
    }

    return 'OFFLINE_LOCAL';
  }

  private async getCloudEvidenceRefs(): Promise<string[]> {
    if (!this.env.SUPABASE_URL || !this.env.SUPABASE_ANON_KEY) {
      return [];
    }

    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 2000);

      try {
        const response = await fetch(`${this.env.SUPABASE_URL}/rest/v1/session_binding?select=id,status`, {
          headers: {
            'apikey': this.env.SUPABASE_ANON_KEY,
            'Authorization': `Bearer ${this.env.SUPABASE_ANON_KEY}`
          },
          signal: controller.signal
        });

        if (!response.ok) {
          return [];
        }

        return ['cloud-session-binding-polled'];
      } finally {
        clearTimeout(timeout);
      }
    } catch {
      return [];
    }
  }

  async evaluateReconciliation(status: SystemStatus, evidenceRefs: string[]): Promise<ReconciliationClassification> {
    if (status === 'OFFLINE_LOCAL') {
      return 'LIVE_LOCAL';
    }
    if (status === 'DEGRADED_PROVIDER' || evidenceRefs.length === 0) {
      return 'STALE_CLOUD';
    }
    return 'IN_SYNC';
  }

  async project(request: ApiProjectionRequest): Promise<ApiProjectionResponse> {
    try {
      const { isAvailable, presence } = await this.checkLocalRuntimeHealth();
      const status = await this.evaluateSystemStatus(isAvailable);
      const cloudEvidenceRefs = await this.getCloudEvidenceRefs();
      const reconState = await this.evaluateReconciliation(status, cloudEvidenceRefs);
      const fingerprint = await this.getLocalFingerprint();

      if (request.authority === 'GIT_TRUTH') {
        return {
          requestId: request.requestId,
          timestamp: Date.now(),
          status: 'ERROR',
          error: `Insufficient authority ${request.authority} for current system status ${status}`,
          systemStatus: status,
          reconciliationState: reconState,
          fingerprint,
          evidenceRefs: []
        };
      }

      let resultStatus: 'SUCCESS' | 'ERROR' | 'DEFERRED' = 'SUCCESS';

      if (request.authority === 'CLOUD_PROJECTION' && (status === 'OFFLINE_LOCAL' || status === 'DEGRADED_PROVIDER')) {
        resultStatus = 'DEFERRED';
      }

      const resultData: Record<string, unknown> = {
        ...request.payload,
        _projected: true,
        _mode: (status === 'OFFLINE_LOCAL' || status === 'DEGRADED_PROVIDER') ? 'local-fallback' : 'online'
      };

      if (request.payload.action === 'get_presence' && presence) {
        resultData.presence = presence;
      }

      return {
        requestId: request.requestId,
        timestamp: Date.now(),
        status: resultStatus,
        data: resultData,
        systemStatus: status,
        reconciliationState: reconState,
        fingerprint,
        evidenceRefs: [`route-${status.toLowerCase()}`, ...cloudEvidenceRefs]
      };

    } catch (err: any) {
      return {
        requestId: request.requestId || 'unknown',
        timestamp: Date.now(),
        status: 'ERROR',
        error: err.message || 'Unknown projection error',
        systemStatus: 'OFFLINE_LOCAL',
        reconciliationState: 'LIVE_LOCAL',
        fingerprint: await this.getLocalFingerprint(),
        evidenceRefs: []
      };
    }
  }
}
