/**
 * React Query hooks for vehicle lookups and recent-search history.
 */
import {
  useQuery,
  useQueryClient,
  type UseQueryResult,
} from '@tanstack/react-query';
import { useCallback, useEffect, useState } from 'react';
import {
  fetchVehicleWithTimeout,
  VehicleApiError,
  VehicleNotFoundError,
} from './client';
import type { VehicleLookupResult } from './types';
import { normalizePlate, isValidPlate } from '@/lib/plate';
import {
  addRecentSearch,
  clearRecentSearches,
  getRecentSearches,
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

export function isNotFound(error: unknown): boolean {
  return error instanceof VehicleNotFoundError;
}

/**
 * Recent searches, backed by AsyncStorage. Exposes the list plus add/clear
 * helpers. Kept as local state synced to storage (history is small & simple).
 */
export function useRecentSearches() {
  const [recent, setRecent] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const queryClient = useQueryClient();

  const refresh = useCallback(async () => {
    const list = await getRecentSearches();
    setRecent(list);
    setLoading(false);
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const add = useCallback(async (plate: string) => {
    const next = await addRecentSearch(plate);
    setRecent(next);
  }, []);

  const clear = useCallback(async () => {
    await clearRecentSearches();
    setRecent([]);
    // Drop cached lookups too so nothing lingers.
    queryClient.removeQueries({ queryKey: ['vehicle'] });
  }, [queryClient]);

  return { recent, loading, add, clear, refresh };
}
