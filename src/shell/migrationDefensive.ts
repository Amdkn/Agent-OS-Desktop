/**
 * migrationDefensive.ts — Helpers partagés pour les stores et la persistance de session V3.
 * Porté depuis BusinessOS pour immuniser Agent OS contre les écrans blancs et la corruption de state.
 */

function isPlainObject(v: unknown): v is Record<string, unknown> {
  return typeof v === 'object' && v !== null && !Array.isArray(v);
}

export interface DefensiveMergeSpec<T> {
  validators: Partial<Record<keyof T, (value: unknown) => unknown>>;
}

export function defensiveMerge<T extends object>(
  spec: DefensiveMergeSpec<T>,
): (persisted: unknown, current: T) => T {
  return (persisted: unknown, current: T): T => {
    if (!isPlainObject(persisted)) {
      return current;
    }
    const out = { ...current } as Record<string, unknown>;
    for (const [key, validator] of Object.entries(spec.validators)) {
      if (typeof validator !== 'function') continue;
      const v = (persisted as Record<string, unknown>)[key];
      out[key] = validator(v);
    }
    return out as T;
  };
}

export function defensiveMigrate<T>(currentVersion: number) {
  return (persisted: unknown, persistedVersion: number): T | undefined => {
    if (typeof persistedVersion === 'number' && persistedVersion < currentVersion) {
      return undefined;
    }
    if (!isPlainObject(persisted)) {
      return undefined;
    }
    return persisted as T;
  };
}

export interface VersionedEnvelope<T> {
  version: number;
  state: T;
}

export function decodeVersionedEnvelope<T>(
  raw: string | null,
  currentVersion: number,
): T | undefined {
  if (raw === null) return undefined;
  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    return undefined;
  }
  if (!isPlainObject(parsed)) return undefined;
  const v = (parsed as { version?: unknown }).version;
  if (typeof v !== 'number' || v < currentVersion) return undefined;
  const state = (parsed as { state?: unknown }).state;
  if (!isPlainObject(state)) return undefined;
  return state as T;
}
