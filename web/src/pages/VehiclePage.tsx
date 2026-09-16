import { useEffect, useMemo } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { t } from '@/i18n';
import { isValidPlate, normalizePlate } from '@/lib/plate';
import {
  isNotFound,
  useRecentSearches,
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
import { licenseStatus } from '@/lib/licenseStatus';
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
import { LicenseBanner } from '@/components/LicenseBanner';
import { OwnershipCard } from '@/components/OwnershipCard';
import { VehicleImageCard } from '@/components/VehicleImageCard';
import { ShareButton } from '@/components/ShareButton';
import { Skeleton } from '@/components/Skeleton';

export default function VehiclePage() {
  const params = useParams<{ plate: string }>();
  const plate = normalizePlate(params.plate ?? '');
  const { offline } = useNetworkStatus();
  const navigate = useNavigate();

  const { data, isLoading, isError, error, refetch, isFetching } = useVehicle(plate);
  const {
    data: extra,
    isLoading: extraLoading,
    isFetching: extraFetching,
    refetch: refetchExtra,
  } = useVehicleEnrichment(data);
  const { data: image } = useVehicleImage(data);
  const { add } = useRecentSearches();

  const officialFields = useMemo(
    () => (data ? mapOfficialFields(data.record) : []),
    [data]
  );

  const modelSpecFields = useMemo(() => mapModelSpec(extra?.modelSpec ?? null), [extra]);
  const features = useMemo(() => mapFeatures(extra?.modelSpec ?? null), [extra]);
  const historyFields = useMemo(() => mapHistory(extra?.history ?? null), [extra]);
  const price = useMemo(() => mapPrice(extra?.price ?? null), [extra]);

  const license = useMemo(
    () => (data ? licenseStatus(data.record) : null),
    [data]
  );

  /** "טויוטה קורולה 2019" — used for the history list and the share text. */
  const carName = useMemo(() => {
    if (!data) return undefined;
    const parts = [data.record.tozeret_nm, data.record.kinuy_mishari, data.record.shnat_yitzur];
    const name = parts.map((p) => String(p ?? '').trim()).filter(Boolean).join(' ');
    return name || undefined;
  }, [data]);

  // Record what this plate actually is, so the recent-searches list on the home
  // screen reads as cars rather than as seven-digit numbers. This also covers
  // arriving straight at a shared link, which never passed through the home
  // screen's own "add".
  useEffect(() => {
    if (!data) return;
    add(plate, {
      make: String(data.record.tozeret_nm ?? '').trim() || undefined,
      model: String(data.record.kinuy_mishari ?? '').trim() || undefined,
      year: String(data.record.shnat_yitzur ?? '').trim() || undefined,
    });
  }, [add, data, plate]);

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

        {/* Both of these are things to act on, so they precede the data. The
            licence comes from the main record and is here immediately; recalls
            arrive with the enrichment. */}
        <LicenseBanner status={license} />
        {extra && <RecallBanner recalls={extra.recalls} />}

        <VehicleImageCard image={image} />

        <SpecCard title={t.vehicle.officialTitle} fields={officialFields} />

        {extraLoading ? (
          <EnrichmentSkeleton />
        ) : (
          <>
            {extra?.incomplete && (
              <div className="enrichment-note">
                <Icon name="info-circle" size={18} />
                <span className="enrichment-note__text">
                  <span className="enrichment-note__title">
                    {t.enrichment.partialTitle}
                  </span>
                  {t.enrichment.partialBody}
                  <button
                    type="button"
                    className="enrichment-note__retry"
                    onClick={() => void refetchExtra()}
                    disabled={extraFetching}
                  >
                    {t.states.retry}
                  </button>
                </span>
              </div>
            )}
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

      <div className="screen__actions screen__actions--row">
        <ShareButton plate={plate} description={carName} />
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
