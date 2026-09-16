/**
 * The at-a-glance layer of the result screen: what the car is called, and how
 * hard it has been driven.
 *
 * The mileage insight is arithmetic on official figures only — the odometer
 * reading taken at the last licence test, divided by the time between first
 * registration and that same test. Measuring to the test date (not to today) is
 * what keeps it honest: the reading is months old, and dividing it by the car's
 * current age would understate the yearly rate.
 */
import type { CkanValue, HistoryRaw, VehicleRecordRaw } from '@/api/types';
import { resolveManufacturer } from '@shared/manufacturer';

/** Rough Israeli private-car average, used only to band the result. */
export const AVERAGE_KM_PER_YEAR = 15_000;
const LOW_BELOW = 12_000;
const HIGH_ABOVE = 20_000;

/** Under a year of history, a yearly rate is extrapolation, not measurement. */
const MIN_YEARS = 1;

const MS_PER_YEAR = 365.25 * 86_400_000;

export type MileageBand = 'low' | 'average' | 'high';

export interface MileageInsight {
  /** Kilometres per year, rounded to the nearest hundred. */
  perYear: number;
  band: MileageBand;
}

/** Thousands separators, Hebrew locale. */
export function formatNumber(n: number): string {
  return new Intl.NumberFormat('he-IL', { maximumFractionDigits: 0 }).format(n);
}

function clean(value: CkanValue | undefined): string {
  const s = String(value ?? '').trim();
  return s.toLowerCase() === 'null' ? '' : s;
}

/**
 * "טויוטה קורולה" — brand and model, or null when the record has neither. The
 * brand is the clean one: the registry's "טויוטה טורקיה" names a factory, not
 * the car.
 */
export function vehicleName(record: VehicleRecordRaw): string | null {
  const brand = resolveManufacturer(record)?.brand ?? '';
  const name = [brand, clean(record.kinuy_mishari)].filter(Boolean).join(' ');
  return name || null;
}

/** `YYYY-MM-DD[...]` → local Date. */
function parseIsoDate(value: CkanValue | undefined): Date | null {
  const m = clean(value).match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (!m) return null;
  const date = new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3]));
  return Number.isNaN(date.getTime()) ? null : date;
}

/** `moed_aliya_lakvish` arrives as "2016-9" (year-month, unpadded). */
function parseYearMonth(value: CkanValue | undefined): Date | null {
  const m = clean(value).match(/^(\d{4})-(\d{1,2})$/);
  if (!m) return null;
  const month = Number(m[2]);
  if (month < 1 || month > 12) return null;
  return new Date(Number(m[1]), month - 1, 1);
}

export function positiveNumber(value: CkanValue | undefined): number | null {
  const s = clean(value);
  if (s === '') return null;
  const n = Number(s.replace(/[^\d.]/g, ''));
  return Number.isFinite(n) && n > 0 ? n : null;
}

export function mileageInsight(
  record: VehicleRecordRaw,
  history: HistoryRaw | null
): MileageInsight | null {
  const km = positiveNumber(history?.kilometer_test_aharon);
  const measuredAt = parseIsoDate(record.mivchan_acharon_dt);
  const since =
    parseIsoDate(history?.rishum_rishon_dt) ?? parseYearMonth(record.moed_aliya_lakvish);
  if (km === null || !measuredAt || !since) return null;

  const years = (measuredAt.getTime() - since.getTime()) / MS_PER_YEAR;
  if (years < MIN_YEARS) return null;

  const perYear = Math.round(km / years / 100) * 100;
  const band: MileageBand =
    perYear < LOW_BELOW ? 'low' : perYear > HIGH_ABOVE ? 'high' : 'average';

  return { perYear, band };
}
