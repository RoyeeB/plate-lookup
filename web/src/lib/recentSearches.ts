/**
 * Persists the last 10 searched plates (digit strings only) in localStorage.
 * We store ONLY the plate number — never any vehicle owner information.
 *
 * localStorage is synchronous, but every access is wrapped: Safari in private
 * mode throws on `setItem`, and a blocked-cookies profile throws on read too.
 */
import { normalizePlate } from './plate';

const STORAGE_KEY = 'plate-lookup:recent-searches:v1';
const MAX_RECENT = 10;

export function getRecentSearches(): string[] {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.filter((x): x is string => typeof x === 'string').slice(0, MAX_RECENT);
  } catch {
    return [];
  }
}

/** Add a plate to the front, de-duplicated, capped at MAX_RECENT. */
export function addRecentSearch(plate: string): string[] {
  const normalized = normalizePlate(plate);
  if (!normalized) return getRecentSearches();

  const current = getRecentSearches();
  const next = [normalized, ...current.filter((p) => p !== normalized)].slice(0, MAX_RECENT);
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  } catch {
    // Best-effort; history is non-critical.
  }
  return next;
}

export function clearRecentSearches(): void {
  try {
    window.localStorage.removeItem(STORAGE_KEY);
  } catch {
    // ignore
  }
}
