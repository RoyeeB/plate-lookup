/**
 * The four numbers a buyer asks first — year, hands, mileage, fuel — as tiles,
 * ahead of the long registry tables. Year and fuel come from the main record;
 * hands and mileage arrive with the enrichment, so those two tiles show their
 * own loading state rather than holding up the rest.
 */
import { t } from '@/i18n';
import type { OwnershipInfo } from '@/api/specMapper';
import { formatNumber, type MileageInsight } from '@/lib/vehicleSummary';
import { Icon, type IconName } from './Icon';
import { Skeleton } from './Skeleton';
import { MileageGauge } from './MileageGauge';

interface KeyFactsProps {
  year: string | null;
  fuel: string | null;
  /** Kilometres at the last test, or null when not published. */
  km: number | null;
  ownership: OwnershipInfo | null;
  mileage: MileageInsight | null;
  /** The enrichment is still on its way. */
  loading: boolean;
  /** The ownership log could not be fetched: its tile is unavailable, not "unknown". */
  ownershipFailed: boolean;
  /** The history file (odometer) could not be fetched. */
  historyFailed: boolean;
}

const BAND_LABEL = {
  low: t.facts.bandLow,
  average: t.facts.bandAverage,
  high: t.facts.bandHigh,
} as const;

interface FactProps {
  icon: IconName;
  label: string;
  value: string;
  qualifier?: string;
  loading?: boolean;
}

function Fact({ icon, label, value, qualifier, loading = false }: FactProps) {
  return (
    <div className="fact">
      <dt className="fact__label">
        <Icon name={icon} size={16} />
        {label}
      </dt>
      <dd className="fact__value">
        {loading ? (
          <>
            <Skeleton width={72} height={20} />
            <span className="visually-hidden">{t.facts.loading}</span>
          </>
        ) : (
          <>
            {qualifier && <span className="fact__qualifier">{qualifier}</span>}
            {value}
          </>
        )}
      </dd>
    </div>
  );
}

export function KeyFacts({
  year,
  fuel,
  km,
  ownership,
  mileage,
  loading,
  ownershipFailed,
  historyFailed,
}: KeyFactsProps) {
  // "Unknown" is a statement about the car (the log has no rows); a failed
  // request says nothing about the car, so it only ever gets a dash.
  const handValue = ownership
    ? ownership.handLabel
    : ownershipFailed
      ? t.facts.unavailable
      : t.facts.unknown;
  const kmValue =
    km !== null && !historyFailed ? `${formatNumber(km)} ${t.history.km}` : t.facts.unavailable;

  return (
    <section className="facts" aria-label={t.facts.title}>
      <dl className="facts__grid">
        <Fact icon="calendar" label={t.facts.year} value={year ?? t.facts.unavailable} />
        <Fact
          icon="key"
          label={t.facts.hand}
          value={handValue}
          qualifier={ownership?.isMinimum ? t.ownership.atLeast : undefined}
          loading={loading}
        />
        <Fact icon="gauge" label={t.facts.mileage} value={kmValue} loading={loading} />
        <Fact icon="fuel" label={t.facts.fuel} value={fuel ?? t.facts.unavailable} />
      </dl>

      {mileage && (
        <div className={`facts__insight facts__insight--${mileage.band}`}>
          <MileageGauge perYear={mileage.perYear} band={mileage.band} />
          <div className="facts__insight-text">
            <p className="facts__insight-head">
              <span className="facts__insight-rate">
                {t.facts.perYear.replace('{km}', formatNumber(mileage.perYear))}
              </span>
              <span className="facts__insight-band">{BAND_LABEL[mileage.band]}</span>
            </p>
            <p className="facts__insight-note">{t.facts.mileageNote}</p>
          </div>
        </div>
      )}
    </section>
  );
}
