import * as path from "node:path";

export const DEFAULT_PROBE_TIMEOUT_MS = 15_000;
export const HARD_MAX_PROBE_TIMEOUT_MS = 60_000;
export const DEFAULT_PROBE_POLL_INTERVAL_MS = 500;
export const HARD_MAX_PROBE_POLL_INTERVAL_MS = 5_000;
export const DEFAULT_PROBE_WAIT_MAX_RETRIES = 1;
export const HARD_MAX_PROBE_WAIT_MAX_RETRIES = 10;

export function clampInt(n: number, min: number, max: number): number {
  if (!Number.isFinite(n)) return min;
  n = Math.trunc(n);
  if (n < min) return min;
  if (n > max) return max;
  return n;
}

export function isSubpath(parentAbs: string, childAbs: string): boolean {
  const parent = path.resolve(parentAbs);
  const child = path.resolve(childAbs);
  const rel = path.relative(parent, child);
  return rel !== "" && !rel.startsWith("..") && !path.isAbsolute(rel);
}

export function resolveUnderRoot(rootAbs: string, rel: string): string {
  if (path.isAbsolute(rel)) {
    throw new Error(`Absolute paths are not allowed: ${rel}`);
  }
  // Normalize slashes and remove any leading "./"
  const normalized = rel.replace(/\//g, path.sep).replace(/^[.][\\/]/, "");
  const resolved = path.resolve(rootAbs, normalized);
  const rootResolved = path.resolve(rootAbs);

  const relFromRoot = path.relative(rootResolved, resolved);
  if (relFromRoot.startsWith("..") || path.isAbsolute(relFromRoot)) {
    throw new Error(`Path escapes root: ${rel}`);
  }
  return resolved;
}
