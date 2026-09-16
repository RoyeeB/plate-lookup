/**
 * The last 10 lookups, in localStorage.
 *
 * v1 stored bare plate numbers, which made the list unreadable after a few
 * searches — nobody recognises a car by its digits. v2 stores the make, model
 * and year alongside, filled in once the lookup resolves. Still NO owner
 * information: the registry's personal fields are never read or persisted.
 *
 * localStorage is synchronous, but every access is wrapped: Safari in private
 * mode throws on `setItem`, and a blocked-cookies profile throws on read too.
 */
import { normalizePlate } from './plate';
import { displayBrand } from '@shared/manufacturer';

const STORAGE_KEY = 'plate-lookup:recent-searches:v2';
const LEGACY_KEY = 'plate-lookup:recent-searches:v1';
const MAX_RECENT = 10;

export interface RecentSearch {
  /** Digits only, canonical form. */
  plate: string;
  make?: string;
  model?: string;
  year?: string;
  /** When it was last searched, epoch ms. 0 for entries migrated from v1. */
  at: number;
}

/** What a resolved lookup contributes to the stored entry. */
export interface RecentSearchDetails {
  make?: string;
  model?: string;
  year?: string;
}

function read(key: string): unknown {
  try {
    const raw = window.localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as unknown) : null;
  } catch {
    return null;
  }
}

function write(entries: RecentSearch[]): void {
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(entries));
  } catch {
    // Best-effort; history is non-critical.
  }
}

function isEntry(value: unknown): value is RecentSearch {
  return (
    typeof value === 'object' &&
    value !== null &&
    typeof (value as RecentSearch).plate === 'string'
  );
}

/** v1 held `string[]`. Keep the plates, drop nothing, and stop reading v1. */
function migrateLegacy(): RecentSearch[] {
  const legacy = read(LEGACY_KEY);
  if (!Array.isArray(legacy)) return [];

  const entries = legacy
    .filter((x): x is string => typeof x === 'string')
    .map((plate) => ({ plate: normalizePlate(plate), at: 0 }))
    .filter((entry) => entry.plate !== '')
    .slice(0, MAX_RECENT);

  if (entries.length > 0) write(entries);
  try {
    window.localStorage.removeItem(LEGACY_KEY);
  } catch {
    // ignore
  }
  return entries;
}

export function getRecentSearches(): RecentSearch[] {
  const parsed = read(STORAGE_KEY);
  if (!Array.isArray(parsed)) return migrateLegacy();
  return parsed.filter(isEntry).slice(0, MAX_RECENT);
}

/**
 * Put a plate at the front. Any detail already known about it is preserved, so
 * re-searching a car does not blank out its name while the lookup is in flight.
 */
export function addRecentSearch(
  plate: string,
  details?: RecentSearchDetails
): RecentSearch[] {
  const normalized = normalizePlate(plate);
  if (!normalized) return getRecentSearches();

  const current = getRecentSearches();
  const existing = current.find((entry) => entry.plate === normalized);

  const next: RecentSearch[] = [
    {
      plate: normalized,
      make: details?.make ?? existing?.make,
      model: details?.model ?? existing?.model,
      year: details?.year ?? existing?.year,
      at: Date.now(),
    },
    ...current.filter((entry) => entry.plate !== normalized),
  ].slice(0, MAX_RECENT);

  write(next);
  return next;
}

export function clearRecentSearches(): void {
  try {
    window.localStorage.removeItem(STORAGE_KEY);
    window.localStorage.removeItem(LEGACY_KEY);
  } catch {
    // ignore
  }
}

/** "טויוטה קורולה · 2019" — the line under the plate badge. */
export function describeRecentSearch(entry: RecentSearch): string | null {
  // Entries saved before brands were cleaned hold the raw "יונדאי טורקיה".
  const make = entry.make ? displayBrand(entry.make) : undefined;
  const name = [make, entry.model].filter(Boolean).join(' ').trim();
  if (!name) return entry.year ?? null;
  return entry.year ? `${name} · ${entry.year}` : name;
}
