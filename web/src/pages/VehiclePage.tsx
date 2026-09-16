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
import { mileageInsight, positiveNumber, vehicleName } from '@/lib/vehicleSummary';
import { resolveManufacturer } from '@shared/manufacturer';
import { loadSavedVehicle, saveVehicle } from '@/lib/savedVehicles';
import { useNetworkStatus } from '@/hooks/useNetworkStatus';
import { useInView } from '@/hooks/useInView';
import { PlateBadge } from '@/components/PlateBadge';
import { SpecCard } from '@/components/SpecCard';
import { EstimatesCard } from '@/components/EstimatesCard';
import { Skeleton, VehicleSkeleton } from '@/components/Skeleton';
import { StateView } from '@/components/StateView';
import { Button } from '@/components/Button';
import { Icon } from '@/components/Icon';
import { PriceCard } from '@/components/PriceCard';
import { FeatureChips } from '@/components/FeatureChips';
import { RecallBanner } from '@/components/RecallBanner';
import { LicenseBanner } from '@/components/LicenseBanner';
import { OwnershipCard } from '@/components/OwnershipCard';
import { ShareButton } from '@/components/ShareButton';
import { EnrichmentNote } from '@/components/EnrichmentNote';
import { VehicleHero } from '@/components/VehicleHero';
import { KeyFacts } from '@/components/KeyFacts';
import { CompactVehicleBar } from '@/components/CompactVehicleBar';
import { SavedNotice } from '@/components/SavedNotice';
import { BuyerChecklist } from '@/components/BuyerChecklist';
import { buildChecklist } from '@/lib/buyerChecklist';

function clean(value: unknown): string | undefined {
  const s = String(value ?? '').trim();
  return s || undefined;
}

export default function VehiclePage() {
  const params = useParams<{ plate: string }>();
  const plate = normalizePlate(params.plate ?? '');
  const { offline } = useNetworkStatus();
  const navigate = useNavigate();
  const [plateRef, plateInView] = useInView<HTMLDivElement>();

  const { data: live, isLoading, isError, error, refetch, isFetching } = useVehicle(plate);
  const {
    data: liveExtra,
    isLoading: extraLoading,
    isError: extraError,
    isFetching: extraFetching,
    refetch: refetchExtra,
  } = useVehicleEnrichment(live);

  // With no connection (or a failing server), fall back to the copy saved the
  // last time this car was looked up — clearly labelled as such below.
  const saved = useMemo(() => loadSavedVehicle(plate), [plate]);
  const transportFailed = isError && !isNotFound(error);
  const showingSaved = !live && saved !== null && (offline || transportFailed);
  const data = live ?? (showingSaved ? saved.result : undefined);
  const extra = liveExtra ?? (showingSaved ? (saved.enrichment ?? undefined) : undefined);

  useEffect(() => {
    // Save once the enrichment has settled, so the offline copy is complete.
    if (!live || extraLoading) return;
    saveVehicle(live, liveExtra ?? null);
  }, [live, liveExtra, extraLoading]);
  const { data: image, isLoading: imageLoading } = useVehicleImage(data);
  const { add } = useRecentSearches();

  const officialFields = useMemo(
    () => (data ? mapOfficialFields(data.record) : []),
    [data]
  );

  const modelSpecFields = useMemo(() => mapModelSpec(extra?.modelSpec ?? null), [extra]);
  const features = useMemo(() => mapFeatures(extra?.modelSpec ?? null), [extra]);
  const historyFields = useMemo(() => mapHistory(extra?.history ?? null), [extra]);
  const price = useMemo(() => mapPrice(extra?.price ?? []), [extra]);

  const license = useMemo(
    () => (data ? licenseStatus(data.record) : null),
    [data]
  );

  const name = useMemo(() => (data ? vehicleName(data.record) : null), [data]);
  const year = data ? clean(data.record.shnat_yitzur) ?? null : null;

  /** "טויוטה קורולה 2019" — used for the history list and the share text. */
  const carName = [name, year].filter(Boolean).join(' ') || undefined;

  const country = data ? resolveManufacturer(data.record)?.country : null;
  const heroMeta = [
    year,
    clean(data?.record.ramat_gimur),
    country ? t.vehicle.madeIn.replace('{country}', country) : null,
  ]
    .filter(Boolean)
    .join(' · ');

  // Record what this plate actually is, so the recent-searches list on the home
  // screen reads as cars rather than as seven-digit numbers. This also covers
  // arriving straight at a shared link, which never passed through the home
  // screen's own "add".
  useEffect(() => {
    if (!data) return;
    add(plate, {
      // The clean brand ("יונדאי"), not the registry's "יונדאי טורקיה".
      make: resolveManufacturer(data.record)?.brand,
      model: clean(data.record.kinuy_mishari),
      year: clean(data.record.shnat_yitzur),
    });
  }, [add, data, plate]);

  const ownership = useMemo(() => {
    if (!data || !extra) return null;
    return summarizeOwnership(
      extra.ownership,
      firstRoadYear(data.record, extra.history)
    );
  }, [data, extra]);

  const mileage = useMemo(
    () => (data && extra ? mileageInsight(data.record, extra.history) : null),
    [data, extra]
  );

  // Feed the officially published power/weight into the estimate layer, so the
  // remaining derived numbers are arithmetic on real figures rather than
  // guesses from engine displacement.
  const estimatedSpecs = useMemo(() => {
    if (!data) return [];
    return estimateSpecs(data.record, officialPowerAndWeight(extra?.modelSpec ?? null));
  }, [data, extra]);

  const checklist = useMemo(
    () =>
      data
        ? buildChecklist({
            license,
            isInactive: data.isInactive,
            enrichment: extra,
            enrichmentLoading: extraLoading,
            ownership,
            mileage,
          })
        : [],
    [data, extra, extraLoading, license, mileage, ownership]
  );

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
          <VehicleSkeleton plate={plate} />
        </div>
      </div>
    );
  }

  // Not found vs. transport error (unless a saved copy is standing in).
  if (isError && !showingSaved) {
    if (isNotFound(error)) {
      return (
        <div className="screen">
          <div className="badge-header badge-header--spaced">
            <PlateBadge plate={plate} size="md" hero />
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

  const enrichmentFailed = extraError && !extra;
  const retryEnrichment = () => void refetchExtra();
  // Per-source failures: a failed join must never read as "no records".
  const ownershipFailed = enrichmentFailed || Boolean(extra?.failed.includes('ownership'));
  const historyFailed = enrichmentFailed || Boolean(extra?.failed.includes('history'));

  // Success. Two columns from tablet-landscape up: the summary (what the car is
  // and what to act on) beside the detail tables; one column on phones, in the
  // same reading order.
  return (
    <div className="screen">
      <CompactVehicleBar plate={plate} name={name} visible={!plateInView} />

      <div className="screen__scroll vehicle-layout">
        <div className="vehicle-layout__summary reveal-stack">
          {showingSaved && saved && (
            <SavedNotice
              savedAt={saved.savedAt}
              offline={offline}
              onRetry={() => void refetch()}
              retrying={isFetching}
            />
          )}

          <VehicleHero
            plate={plate}
            name={name}
            meta={heroMeta}
            image={image}
            imageLoading={imageLoading}
            plateRef={plateRef}
          />

          {data.isInactive && (
            <div className="inactive-banner" role="alert">
              <Icon name="alert-circle" size={20} />
              <span>{data.datasetLabel}</span>
            </div>
          )}

          {/* Both of these are things to act on, so they precede the data. The
              licence comes from the main record and is here immediately; recalls
              arrive with the enrichment. */}
          <LicenseBanner status={license} />
          {extra && <RecallBanner recalls={extra.recalls} />}

          <KeyFacts
            year={year}
            fuel={clean(data.record.sug_delek_nm) ?? null}
            km={positiveNumber(extra?.history?.kilometer_test_aharon)}
            ownership={ownership}
            mileage={mileage}
            loading={extraLoading}
            ownershipFailed={ownershipFailed}
            historyFailed={historyFailed}
          />

          <BuyerChecklist items={checklist} />

          {extraLoading ? (
            <Skeleton height={148} radius={16} />
          ) : (
            <>
              <PriceCard price={price} />
              <OwnershipCard
                ownership={ownership}
                loaded={extra !== undefined && !ownershipFailed}
              />
            </>
          )}
        </div>

        <div className="vehicle-layout__detail reveal-stack">
          <SpecCard title={t.vehicle.officialTitle} fields={officialFields} />

          {/* Placed after the official card, which their copy refers to as
              "above". The whole-request failure matters most: without it the
              price, ownership and spec cards would just silently not exist. */}
          {enrichmentFailed && (
            <EnrichmentNote kind="failed" onRetry={retryEnrichment} retrying={extraFetching} />
          )}
          {extra?.incomplete && (
            <EnrichmentNote kind="partial" onRetry={retryEnrichment} retrying={extraFetching} />
          )}

          {extraLoading ? (
            <EnrichmentSkeleton />
          ) : (
            <>
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
