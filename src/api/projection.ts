import type {
  ApiProjectionResponse,
  SystemStatus,
  ReconciliationClassification,
  SourceSyncFingerprint,
  WritePathAuthority
} from '../contracts/truth.ts';
import {
  ApiProjectionRequestSchema
} from '../contracts/truth.ts';

// Simulated environment configuration to determine how to route
// In a real implementation this would check process.env or similar
export interface ProjectionEnv {
  SUPABASE_URL?: string;
  SUPABASE_ANON_KEY?: string;
  LOCAL_RUNTIME_URL?: string;
}

// Result of a projected operation
export interface ProjectionResult {
  status: 'SUCCESS' | 'ERROR' | 'DEFERRED';
  data?: Record<string, unknown>;
  error?: string;
  reconciliationState: ReconciliationClassification;
  systemStatus: SystemStatus;
  fingerprint: SourceSyncFingerprint;
  evidenceRefs: string[];
}

export class ApiProjectionLayer {
  private env: ProjectionEnv;

  constructor(env: ProjectionEnv = {}) {
    this.env = env;
  }

  /**
   * Evaluates the current system status based on environment and network
   */
  async evaluateSystemStatus(): Promise<SystemStatus> {
    // In actual implementation, we'd ping endpoints
    if (this.env.SUPABASE_URL && this.env.SUPABASE_ANON_KEY) {
      return 'ONLINE_AUTHENTICATED';
    }

    if (this.env.LOCAL_RUNTIME_URL) {
      return 'DEGRADED_PROVIDER';
    }

    return 'OFFLINE_LOCAL';
  }

  /**
   * Generates a deterministic mock fingerprint for local/offline modes
   */
  private getLocalFingerprint(): SourceSyncFingerprint {
    return {
      parentRepoSha: 'offline-local-0000',
      parentGitlinkCommitSha: 'offline-gitlink-0000',
      parentGitlink: 'local',
      agentOsDesktopHeadSha: 'local-head-0000',
      agentOsDesktopIsDirty: true
    };
  }

  /**
   * Evaluates drift between local and remote state
   */
  async evaluateReconciliation(): Promise<ReconciliationClassification> {
    // In a real implementation, this would compare SHAs and local db state
    const status = await this.evaluateSystemStatus();
    if (status === 'OFFLINE_LOCAL') {
      return 'LIVE_LOCAL';
    }
    return 'IN_SYNC';
  }

  /**
   * Validates authority for write operations
   */
  private validateAuthority(authority: WritePathAuthority, _status: SystemStatus): boolean {
    if (authority === 'LOCAL_PROCESS' || authority === 'LOCAL_SQLITE') {
      return true; // Local authority always allowed
    }

    // Cloud projections can be deferred if we are offline, so they are not strictly blocked
    // if authority === CLOUD_PROJECTION and we are offline, we return true but handle deferment later.

    // Git truth requires process level access not typically available in browser
    if (authority === 'GIT_TRUTH') {
      return false; // Typically restricted from browser direct access
    }

    return true;
  }

  /**
   * Main projection entry point for UI requests
   */
  async project(request: unknown): Promise<ApiProjectionResponse> {
    try {
      // 1. Validate request shape
      const validReq = ApiProjectionRequestSchema.parse(request);

      // 2. Evaluate system state
      const status = await this.evaluateSystemStatus();
      const reconState = await this.evaluateReconciliation();

      // 3. Check authority against degraded modes
      if (!this.validateAuthority(validReq.authority, status)) {
        return {
          requestId: validReq.requestId,
          timestamp: Date.now(),
          status: 'ERROR',
          error: `Insufficient authority ${validReq.authority} for current system status ${status}`,
          systemStatus: status,
          reconciliationState: reconState,
          fingerprint: this.getLocalFingerprint(),
          evidenceRefs: []
        };
      }

      // 4. Route based on status and authority
      let resultData: Record<string, unknown> = {};
      let resultStatus: 'SUCCESS' | 'ERROR' | 'DEFERRED' = 'SUCCESS';

      if (status === 'OFFLINE_LOCAL' || status === 'DEGRADED_PROVIDER') {
        // Degraded routing
        resultData = {
          ...validReq.payload,
          _projected: true,
          _mode: 'local-fallback'
        };
        // If it was supposed to go to cloud, we defer it
        if (validReq.authority === 'CLOUD_PROJECTION') {
           resultStatus = 'DEFERRED';
        }
      } else {
        // Online routing
        resultData = {
          ...validReq.payload,
          _projected: true,
          _mode: 'online'
        };
      }

      return {
        requestId: validReq.requestId,
        timestamp: Date.now(),
        status: resultStatus,
        data: resultData,
        systemStatus: status,
        reconciliationState: reconState,
        fingerprint: this.getLocalFingerprint(),
        evidenceRefs: [`route-${status.toLowerCase()}`]
      };

    } catch (err: any) {
      return {
        requestId: 'unknown',
        timestamp: Date.now(),
        status: 'ERROR',
        error: err.message || 'Unknown projection error',
        systemStatus: await this.evaluateSystemStatus(),
        reconciliationState: await this.evaluateReconciliation(),
        fingerprint: this.getLocalFingerprint(),
        evidenceRefs: []
      };
    }
  }
}

// Singleton instance for client usage
export const projectionLayer = new ApiProjectionLayer();
