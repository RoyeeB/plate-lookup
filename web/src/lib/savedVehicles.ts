/**
 * The last few successful lookups, kept in localStorage so a car that was
 * already looked up can still be shown with no connection.
 *
 * Saved data is only ever shown as saved data: the page labels it with the
 * date it was fetched, because a licence can expire and a car can change
 * hands after that. Nothing here is owner information — the registry
 * datasets this app reads carry none.
 */
import type { VehicleEnrichment, VehicleLookupResult } from '@/api/types';

const STORAGE_KEY = 'plate-lookup:saved-vehicles:v1';
/** Matches the recent-searches list: the cars someone is likely to reopen. */
export const MAX_SAVED = 10;

export interface SavedVehicle {
  plate: string;
  /** Epoch ms of the lookup this was saved from. */
  savedAt: number;
  result: VehicleLookupResult;
  enrichment: VehicleEnrichment | null;
}

function isSaved(value: unknown): value is SavedVehicle {
  if (typeof value !== 'object' || value === null) return false;
  const entry = value as Partial<SavedVehicle>;
  return (
    typeof entry.plate === 'string' &&
    typeof entry.savedAt === 'number' &&
    typeof entry.result === 'object' &&
    entry.result !== null &&
    typeof entry.result.record === 'object'
  );
}

function readAll(): SavedVehicle[] {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    const parsed: unknown = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed.filter(isSaved) : [];
  } catch {
    return [];
  }
}

function writeAll(entries: SavedVehicle[]): void {
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(entries));
  } catch {
    // Quota or private mode: offline viewing is a convenience, not a promise.
  }
}

export function saveVehicle(
  result: VehicleLookupResult,
  enrichment: VehicleEnrichment | null,
  now: number = Date.now()
): void {
  const entry: SavedVehicle = { plate: result.plate, savedAt: now, result, enrichment };
  writeAll([entry, ...readAll().filter((e) => e.plate !== result.plate)].slice(0, MAX_SAVED));
}

export function loadSavedVehicle(plate: string): SavedVehicle | null {
  return readAll().find((entry) => entry.plate === plate) ?? null;
}

export function clearSavedVehicles(): void {
  try {
    window.localStorage.removeItem(STORAGE_KEY);
  } catch {
    // ignore
  }
}
