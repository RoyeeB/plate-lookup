import { useMemo } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { t } from '@/i18n';
import { isValidPlate, normalizePlate } from '@/lib/plate';
import {
  isNotFound,
  useVehicle,
  useVehicleEnrichment,
  useVehicleImage,
} from '@/api/queries';
import { mapOfficialFields } from '@/api/mapper';
import {
  firstRoadYear,
  mapFeatures,
  mapHistory,
  mapModelSpec,
  mapPrice,
  officialPowerAndWeight,
  summarizeOwnership,
} from '@/api/specMapper';
import { estimateSpecs } from '@/lib/estimates';
import { useNetworkStatus } from '@/hooks/useNetworkStatus';
import { PlateBadge } from '@/components/PlateBadge';
import { SpecCard } from '@/components/SpecCard';
import { EstimatesCard } from '@/components/EstimatesCard';
import { VehicleSkeleton } from '@/components/Skeleton';
import { StateView } from '@/components/StateView';
import { Button } from '@/components/Button';
import { Icon } from '@/components/Icon';
import { PriceCard } from '@/components/PriceCard';
import { FeatureChips } from '@/components/FeatureChips';
import { RecallBanner } from '@/components/RecallBanner';
import { OwnershipCard } from '@/components/OwnershipCard';
import { VehicleImageCard } from '@/components/VehicleImageCard';
import { Skeleton } from '@/components/Skeleton';

export default function VehiclePage() {
  const params = useParams<{ plate: string }>();
  const plate = normalizePlate(params.plate ?? '');
  const { offline } = useNetworkStatus();
  const navigate = useNavigate();

  const { data, isLoading, isError, error, refetch, isFetching } = useVehicle(plate);
  const { data: extra, isLoading: extraLoading } = useVehicleEnrichment(data);
  const { data: image } = useVehicleImage(data);

  const officialFields = useMemo(
    () => (data ? mapOfficialFields(data.record) : []),
    [data]
  );

  const modelSpecFields = useMemo(() => mapModelSpec(extra?.modelSpec ?? null), [extra]);
  const features = useMemo(() => mapFeatures(extra?.modelSpec ?? null), [extra]);
  const historyFields = useMemo(() => mapHistory(extra?.history ?? null), [extra]);
  const price = useMemo(() => mapPrice(extra?.price ?? null), [extra]);

  const ownership = useMemo(() => {
    if (!data || !extra) return null;
    return summarizeOwnership(
      extra.ownership,
      firstRoadYear(data.record, extra.history)
    );
  }, [data, extra]);

  // Feed the officially published power/weight into the estimate layer, so the
  // remaining derived numbers are arithmetic on real figures rather than
  // guesses from engine displacement.
  const estimatedSpecs = useMemo(() => {
    if (!data) return [];
    return estimateSpecs(data.record, officialPowerAndWeight(extra?.modelSpec ?? null));
  }, [data, extra]);

  const goHome = () => navigate('/', { replace: true });

  // Invalid plate in the URL.
  if (!isValidPlate(plate)) {
    return (
      <div className="screen">
        <StateView
          icon="help-circle"
          title={t.states.notFoundTitle}
          body={t.home.invalidPlate}
          actions={[{ label: t.states.notFoundCta, icon: 'search', onClick: goHome }]}
        />
      </div>
    );
  }

  // Offline with nothing cached to show.
  if (offline && !data) {
    return (
      <div className="screen">
        <StateView
          icon="cloud-offline"
          iconColor="var(--warning)"
          title={t.states.offlineTitle}
          body={t.states.offlineBody}
          actions={[{ label: t.states.retry, icon: 'refresh', onClick: () => void refetch() }]}
        />
      </div>
    );
  }

  // Loading — skeleton, not a bare spinner.
  if (isLoading) {
    return (
      <div className="screen">
        <div className="screen__scroll">
          <VehicleSkeleton />
        </div>
      </div>
    );
  }

  // Not found vs. transport error.
  if (isError) {
    if (isNotFound(error)) {
      return (
        <div className="screen">
          <div className="badge-header" style={{ paddingTop: 'var(--sp-xl)' }}>
            <PlateBadge plate={plate} size="md" />
          </div>
          <StateView
            icon="car"
            title={t.states.notFoundTitle}
            body={t.states.notFoundBody}
            actions={[{ label: t.states.notFoundCta, icon: 'search', onClick: goHome }]}
          />
        </div>
      );
    }
    return (
      <div className="screen">
        <StateView
          icon="warning"
          iconColor="var(--danger)"
          title={t.states.errorTitle}
          body={t.states.errorBody}
          actions={[{ label: t.states.retry, icon: 'refresh', onClick: () => void refetch() }]}
        />
      </div>
    );
  }

  if (!data) return null;

  // Success.
  return (
    <div className="screen">
      <div className="screen__scroll">
        <div className="badge-header">
          <PlateBadge plate={plate} size="lg" />
        </div>

        {data.isInactive && (
          <div className="inactive-banner">
            <Icon name="alert-circle" size={20} />
            <span>{data.datasetLabel}</span>
          </div>
        )}

        <VehicleImageCard image={image} />

        {extra && <RecallBanner recalls={extra.recalls} />}

        <SpecCard title={t.vehicle.officialTitle} fields={officialFields} />

        {extraLoading ? (
          <EnrichmentSkeleton />
        ) : (
          <>
            <PriceCard price={price} />
            <OwnershipCard ownership={ownership} loaded={extra !== undefined} />
            <SpecCard
              title={t.spec.title}
              subtitle={t.spec.subtitle}
              fields={modelSpecFields}
            />
            <SpecCard title={t.history.title} fields={historyFields} />
            <FeatureChips features={features} />
          </>
        )}

        <EstimatesCard specs={estimatedSpecs} />

        <p className="source-note">{t.vehicle.source}</p>
      </div>

      <div className="screen__actions">
        <Button
          label={t.vehicle.searchAgain}
          icon="search"
          onClick={goHome}
          loading={isFetching && !isLoading}
        />
      </div>
    </div>
  );
}

/** Placeholder for the secondary datasets, which resolve after the main record. */
function EnrichmentSkeleton() {
  return (
    <div className="skeleton-card">
      <Skeleton width={140} height={14} />
      {Array.from({ length: 4 }).map((_, i) => (
        <div key={i} className="skeleton-row">
          <Skeleton width={90} height={14} />
          <Skeleton width={70} height={14} />
        </div>
      ))}
    </div>
  );
}
