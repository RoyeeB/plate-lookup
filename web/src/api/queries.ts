/**
 * React Query hooks for vehicle lookups and recent-search history.
 */
import {
  useQuery,
  useQueryClient,
  type UseQueryResult,
} from '@tanstack/react-query';
import { useCallback, useState } from 'react';
import {
  fetchVehicleWithTimeout,
  VehicleApiError,
  VehicleNotFoundError,
} from './client';
import type { VehicleEnrichment, VehicleLookupResult } from './types';
import { fetchEnrichment } from './enrich';
import { fetchVehicleImage, type VehicleImage } from '@/lib/vehicleImage';
import { resolveManufacturer } from '@shared/manufacturer';
import { normalizePlate, isValidPlate } from '@/lib/plate';
import {
  addRecentSearch,
  clearRecentSearches,
  getRecentSearches,
  type RecentSearch,
  type RecentSearchDetails,
} from '@/lib/recentSearches';

export const vehicleQueryKey = (plate: string) => ['vehicle', normalizePlate(plate)] as const;

export function useVehicle(plate: string): UseQueryResult<VehicleLookupResult, Error> {
  const normalized = normalizePlate(plate);

  return useQuery<VehicleLookupResult, Error>({
    queryKey: vehicleQueryKey(normalized),
    enabled: isValidPlate(normalized),
    queryFn: ({ signal }) => fetchVehicleWithTimeout(normalized, signal),
    staleTime: 1000 * 60 * 30, // registry data barely changes; cache 30 min
    gcTime: 1000 * 60 * 60,
    retry: (failureCount, error) => {
      // Never retry a genuine "not found" — only transient transport errors.
      if (error instanceof VehicleNotFoundError) return false;
      if (error instanceof VehicleApiError) return failureCount < 2;
      return false;
    },
    retryDelay: (attempt) => Math.min(1000 * 2 ** attempt, 4000),
  });
}

/**
 * Secondary datasets (model catalogue, price list, history, recalls), fetched
 * once the main record exists. Kept as its own query so the page can render the
 * registry fields immediately and fill the rest in as it arrives — and so a
 * failure here never turns a successful lookup into an error screen.
 */
export function useVehicleEnrichment(
  result: VehicleLookupResult | undefined
): UseQueryResult<VehicleEnrichment, Error> {
  return useQuery<VehicleEnrichment, Error>({
    queryKey: ['vehicle-enrichment', result?.plate ?? '', result?.datasetId ?? ''],
    enabled: result !== undefined,
    queryFn: ({ signal }) => fetchEnrichment(result!.record, result!.plate, signal),
    staleTime: 1000 * 60 * 60 * 24, // model specs and list prices are static
    gcTime: 1000 * 60 * 60 * 24,
    retry: 1,
  });
}

/**
 * Illustrative model photo from Wikipedia. Separate from the enrichment query
 * because it hits a different service that rate-limits, and because the page
 * must render perfectly well without it.
 */
export function useVehicleImage(
  result: VehicleLookupResult | undefined
): UseQueryResult<VehicleImage | null, Error> {
  const make = result ? (resolveManufacturer(result.record)?.brand ?? '') : '';
  const model = String(result?.record.kinuy_mishari ?? '').trim();

  return useQuery<VehicleImage | null, Error>({
    queryKey: ['vehicle-image', make, model],
    enabled: make !== '' && model !== '',
    queryFn: ({ signal }) => fetchVehicleImage(make, model, signal),
    // Keyed by model, not plate, so every car of the same model shares one
    // lookup. Wikipedia returns 429 under load, so never retry.
    staleTime: 1000 * 60 * 60 * 24,
    gcTime: 1000 * 60 * 60 * 24,
    retry: false,
  });
}

export function isNotFound(error: unknown): boolean {
  return error instanceof VehicleNotFoundError;
}

/**
 * Recent searches, backed by localStorage. Reads are synchronous, so the list
 * is seeded from storage on first render — no loading flash.
 */
export function useRecentSearches() {
  const [recent, setRecent] = useState<RecentSearch[]>(getRecentSearches);
  const queryClient = useQueryClient();

  const refresh = useCallback(() => {
    setRecent(getRecentSearches());
  }, []);

  /**
   * Called twice per lookup: once on submit with the plate alone, and again
   * once the record resolves, to fill in what the car actually is.
   */
  const add = useCallback((plate: string, details?: RecentSearchDetails) => {
    setRecent(addRecentSearch(plate, details));
  }, []);

  const clear = useCallback(() => {
    clearRecentSearches();
    setRecent([]);
    // Drop cached lookups too so nothing lingers.
    queryClient.removeQueries({ queryKey: ['vehicle'] });
  }, [queryClient]);

  return { recent, add, clear, refresh };
}
