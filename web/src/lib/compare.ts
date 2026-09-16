/**
 * Rows for comparing two vehicles side by side. Values are the same formatted
 * facts the vehicle page shows; `differs` only marks that the two cars differ
 * on a row, never which one is "better" — that depends on the buyer.
 */
import { t } from '@/i18n';
import { formatNumber } from '@/lib/vehicleSummary';
import type { VehicleOverview } from '@/lib/vehicleOverview';

export interface CompareRow {
  id: string;
  label: string;
  values: [string, string];
  differs: boolean;
}

type Cell = (overview: VehicleOverview) => string | null;

const BAND = { low: t.facts.bandLow, average: t.facts.bandAverage, high: t.facts.bandHigh } as const;

const LICENSE = {
  expired: t.compare.licenseExpired,
  soon: t.compare.licenseSoon,
  valid: t.compare.licenseValid,
} as const;

const CELLS: ReadonlyArray<{ id: string; label: string; cell: Cell }> = [
  { id: 'year', label: t.facts.year, cell: (o) => o.year },
  { id: 'trim', label: t.fields.ramat_gimur, cell: (o) => o.trim },
  { id: 'country', label: t.fields.tozeret_eretz_nm, cell: (o) => o.country },
  { id: 'fuel', label: t.facts.fuel, cell: (o) => o.fuel },
  {
    id: 'horsepower',
    label: t.spec.horsepower,
    cell: (o) => (o.horsepower === null ? null : formatNumber(o.horsepower)),
  },
  {
    id: 'hand',
    label: t.facts.hand,
    cell: (o) =>
      o.ownership
        ? `${o.ownership.isMinimum ? `${t.ownership.atLeast} ` : ''}${o.ownership.handLabel}`
        : o.ownershipFailed
          ? null
          : t.facts.unknown,
  },
  {
    id: 'km',
    label: t.facts.mileage,
    cell: (o) => (o.km === null ? null : `${formatNumber(o.km)} ${t.history.km}`),
  },
  {
    id: 'rate',
    label: t.compare.rate,
    cell: (o) =>
      o.mileage
        ? `${t.facts.perYear.replace('{km}', formatNumber(o.mileage.perYear))} · ${BAND[o.mileage.band]}`
        : null,
  },
  {
    id: 'license',
    label: t.checklist.license.title,
    cell: (o) =>
      o.license ? `${LICENSE[o.license.state]} · ${o.license.dateLabel}` : null,
  },
  {
    id: 'price',
    label: t.price.title,
    cell: (o) =>
      o.price
        ? o.price.maxAmount
          ? `${o.price.amount} – ${o.price.maxAmount}`
          : o.price.amount
        : null,
  },
  {
    id: 'attention',
    label: t.compare.attention,
    cell: (o) => {
      if (o.checklist.some((item) => item.status === 'pending')) return null;
      return String(o.checklist.filter((item) => item.status === 'attention').length);
    },
  },
];

export function buildComparison(
  a: VehicleOverview | null,
  b: VehicleOverview | null
): CompareRow[] {
  return CELLS.map(({ id, label, cell }) => {
    const left = a ? cell(a) : null;
    const right = b ? cell(b) : null;
    return {
      id,
      label,
      values: [left ?? t.facts.unavailable, right ?? t.facts.unavailable],
      // Only a real difference between two known values is marked.
      differs: left !== null && right !== null && left !== right,
    };
  });
}
