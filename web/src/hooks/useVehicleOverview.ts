/**
 * One vehicle's lookup, enrichment and derived overview, for screens that show
 * more than one car (the comparison page).
 */
import { useMemo } from 'react';
import { isNotFound, useVehicle, useVehicleEnrichment } from '@/api/queries';
import { buildOverview, type VehicleOverview } from '@/lib/vehicleOverview';

export interface VehicleOverviewState {
  overview: VehicleOverview | null;
  loading: boolean;
  notFound: boolean;
  failed: boolean;
}

export function useVehicleOverview(plate: string): VehicleOverviewState {
  const vehicle = useVehicle(plate);
  const enrichment = useVehicleEnrichment(vehicle.data);

  const overview = useMemo(
    () =>
      vehicle.data
        ? buildOverview(vehicle.data, enrichment.data, {
            loading: enrichment.isLoading,
            error: enrichment.isError,
          })
        : null,
    [vehicle.data, enrichment.data, enrichment.isLoading, enrichment.isError]
  );

  return {
    overview,
    loading: vehicle.isLoading,
    notFound: vehicle.isError && isNotFound(vehicle.error),
    failed: vehicle.isError && !isNotFound(vehicle.error),
  };
}
