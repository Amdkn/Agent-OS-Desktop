import type {
  ApiProjectionResponse,
  SystemStatus,
  ReconciliationClassification,
  SourceSyncFingerprint
} from '../contracts/truth.ts';
import {
  ApiProjectionRequestSchema
} from '../contracts/truth.ts';

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
  private _url: string;

  constructor(baseUrl: string = '/api/tech-os') {
    this._url = `${baseUrl}/projection`;
  }

  /**
   * Main projection entry point for UI requests
   * It is now a real client to the server-side projection API
   */
  async project(request: unknown): Promise<ApiProjectionResponse> {
    try {
      // 1. Validate request shape client-side
      const validReq = ApiProjectionRequestSchema.parse(request);

      // 2. HTTP POST to real server endpoint
      const response = await fetch(this._url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(validReq)
      });

      if (!response.ok) {
        throw new Error(`HTTP Error ${response.status}`);
      }

      const json = await response.json();
      return json as ApiProjectionResponse;

    } catch (err: any) {
      return {
        requestId: 'unknown',
        timestamp: Date.now(),
        status: 'ERROR',
        error: err.message || 'Unknown projection error',
        systemStatus: 'OFFLINE_LOCAL',
        reconciliationState: 'LIVE_LOCAL', // default fallback for offline client error
        fingerprint: {
          parentRepoSha: 'UNKNOWN',
          parentGitlinkCommitSha: 'UNKNOWN',
          parentGitlink: 'UNKNOWN',
          agentOsDesktopHeadSha: 'UNKNOWN',
          agentOsDesktopIsDirty: false
        },
        evidenceRefs: []
      };
    }
  }
}

// Singleton instance for client usage
export const projectionLayer = new ApiProjectionLayer();
