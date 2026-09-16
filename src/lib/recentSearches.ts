/**
 * Persists the last 10 searched plates (digit strings only) in AsyncStorage.
 * We store ONLY the plate number — never any vehicle owner information.
 */
import AsyncStorage from '@react-native-async-storage/async-storage';
import { normalizePlate } from './plate';

const STORAGE_KEY = 'plate-lookup:recent-searches:v1';
const MAX_RECENT = 10;

export async function getRecentSearches(): Promise<string[]> {
  try {
    const raw = await AsyncStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.filter((x): x is string => typeof x === 'string').slice(0, MAX_RECENT);
  } catch {
    return [];
  }
}

/** Add a plate to the front, de-duplicated, capped at MAX_RECENT. */
export async function addRecentSearch(plate: string): Promise<string[]> {
  const normalized = normalizePlate(plate);
  if (!normalized) return getRecentSearches();

  const current = await getRecentSearches();
  const next = [normalized, ...current.filter((p) => p !== normalized)].slice(0, MAX_RECENT);
  try {
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  } catch {
    // Best-effort; history is non-critical.
  }
  return next;
}

export async function clearRecentSearches(): Promise<void> {
  try {
    await AsyncStorage.removeItem(STORAGE_KEY);
  } catch {
    // ignore
  }
}
