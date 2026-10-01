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
}

export class ServerProjectionService {
  private env: ProjectionEnv;

  constructor(env: ProjectionEnv = {}) {
    this.env = {
      SUPABASE_URL: env.SUPABASE_URL || process.env.SUPABASE_URL,
      SUPABASE_ANON_KEY: env.SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY,
    };
  }

  private async getLocalFingerprint(): Promise<SourceSyncFingerprint> {
    try {
      const { stdout: headSha } = await execFileAsync('git', ['rev-parse', 'HEAD'], { timeout: 2000 });
      const { stdout: statusOut } = await execFileAsync('git', ['status', '--porcelain'], { timeout: 2000 });
      
      return {
        parentRepoSha: 'UNKNOWN',
        parentGitlinkCommitSha: 'UNKNOWN',
        parentGitlink: 'local',
        agentOsDesktopHeadSha: headSha.trim() || 'UNKNOWN',
        agentOsDesktopIsDirty: statusOut.trim().length > 0
      };
    } catch (err) {
      return {
        parentRepoSha: 'UNKNOWN',
        parentGitlinkCommitSha: 'UNKNOWN',
        parentGitlink: 'local',
        agentOsDesktopHeadSha: 'UNKNOWN',
        agentOsDesktopIsDirty: false
      };
    }
  }

  private async checkLocalRuntimeHealth(): Promise<{ isAvailable: boolean, presence?: RuntimePresence, error?: string }> {
    try {
      const manifestPath = path.join(os.homedir(), '.aspace', 'dc', 'run', 'runtime.json');
      if (!fs.existsSync(manifestPath)) {
        return { isAvailable: false, error: 'Manifest not found' };
      }

      const manifestStr = fs.readFileSync(manifestPath, 'utf8');
      const manifest = JSON.parse(manifestStr);

      if (!manifest.url) {
        return { isAvailable: false, error: 'No URL in manifest' };
      }

      // Bound timeout for fetch
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 2000);
      
      const response = await fetch(`${manifest.url}/health`, { 
        signal: controller.signal 
      });
      clearTimeout(timeout);

      if (!response.ok) {
        return { isAvailable: false, error: `HTTP ${response.status}` };
      }

      const data = await response.json();
      
      if (data.schema === 'aspace.machine.health.v1') {
        return { isAvailable: true, presence: data.presence };
      }

      return { isAvailable: false, error: 'Invalid schema' };
    } catch (e: any) {
      return { isAvailable: false, error: e.message };
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

    if (!localAvailable) {
      return 'OFFLINE_LOCAL';
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
      
      const response = await fetch(`${this.env.SUPABASE_URL}/rest/v1/session_binding?select=id,status`, {
        headers: {
          'apikey': this.env.SUPABASE_ANON_KEY,
          'Authorization': `Bearer ${this.env.SUPABASE_ANON_KEY}`
        },
        signal: controller.signal
      });
      clearTimeout(timeout);
      
      if (!response.ok) {
        return [];
      }
      
      return ['cloud-session-binding-polled'];
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

      // In response to action: 'get_presence', attach actual presence from daemon if available
      if (request.payload.action === 'get_presence' && presence) {
        // Find if request identity matches
        // Actually, daemon health endpoint returns a presence structure, we pass it down
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
