import { z } from 'zod';

// --- System Status (Realtime, Auth, Degraded Modes) ---
export const SystemStatusSchema = z.enum([
  'ONLINE_AUTHENTICATED',
  'DEGRADED_PROVIDER',
  'OFFLINE_LOCAL',
  'MAINTENANCE',
  'UNAUTHENTICATED'
]);

export type SystemStatus = z.infer<typeof SystemStatusSchema>;

// --- Write-Path Authority Separation ---
export const WritePathAuthoritySchema = z.enum([
  'LOCAL_PROCESS',
  'LOCAL_SQLITE',
  'CLOUD_PROJECTION',
  'GIT_TRUTH'
]);

export type WritePathAuthority = z.infer<typeof WritePathAuthoritySchema>;

// --- Source Sync Fingerprint ---
export const SourceSyncFingerprintSchema = z.object({
  parentRepoSha: z.string().min(1, "Parent repo SHA is required"),
  parentGitlink: z.string().url("Must be a valid URL"),
  agentOsDesktopHeadSha: z.string().min(1, "Agent-OS-Desktop HEAD SHA is required"),
  agentOsDesktopIsDirty: z.boolean(),
});

export type SourceSyncFingerprint = z.infer<typeof SourceSyncFingerprintSchema>;

// --- Runtime Presence ---
// Implements no-fake-status invariant: existence != LIVE.
// Requires explicit observed_at and expires_at for liveness.
export const RuntimePresenceSchema = z.object({
  provenance: z.string(),
  observedAt: z.number().int().positive("Must be a positive timestamp"),
  expiresAt: z.number().int().positive("Must be a positive timestamp"),
  ttlSeconds: z.number().int().positive("Must be a positive TTL"),
  livenessReason: z.string(),
  evidenceRefs: z.array(z.string()),
  fencingLeaseIdentity: z.string(),
  // Derived state, not strictly part of the wire contract but useful for domain logic
  // A helper could calculate `isLive` based on current time vs `expiresAt`.
});

export type RuntimePresence = z.infer<typeof RuntimePresenceSchema>;

// --- Reconciliation Classification ---
// Classifies drift between different sources of truth
export const ReconciliationClassificationSchema = z.enum([
  'IN_SYNC',
  'STALE_CLOUD', // Local is ahead of Cloud
  'LIVE_LOCAL', // Process truth has unsaved changes
  'NESTED_REPO_DRIFT', // Agent-OS-Desktop git state differs from Aspace_OS_V3 gitlink
  'CLOUD_AHEAD', // Cloud is ahead of local
  'CONFLICT' // Both mutated
]);

export type ReconciliationClassification = z.infer<typeof ReconciliationClassificationSchema>;

// --- API Projection Layer Request/Response ---
export const ApiProjectionRequestSchema = z.object({
  requestId: z.string().uuid(),
  timestamp: z.number().int().positive(),
  authority: WritePathAuthoritySchema,
  payload: z.record(z.string(), z.unknown()),
});

export type ApiProjectionRequest = z.infer<typeof ApiProjectionRequestSchema>;

export const ApiProjectionResponseSchema = z.object({
  requestId: z.string().uuid(),
  timestamp: z.number().int().positive(),
  status: z.enum(['SUCCESS', 'ERROR', 'DEFERRED']),
  data: z.record(z.string(), z.unknown()).optional(),
  error: z.string().optional(),
  reconciliationState: ReconciliationClassificationSchema,
  systemStatus: SystemStatusSchema,
});

export type ApiProjectionResponse = z.infer<typeof ApiProjectionResponseSchema>;

// --- No Fake Status invariant validator ---
/**
 * Ensures that a presence is actually live based on its lease expiration.
 * The contract prevents static/registry existence from defaulting to ONLINE.
 */
export function isPresenceLive(presence: RuntimePresence, currentTimeMs: number = Date.now()): boolean {
  return currentTimeMs < presence.expiresAt;
}
