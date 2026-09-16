/**
 * Licence ("טסט") validity, derived from the registry's `tokef_dt`.
 *
 * This is the one field on the screen someone may have to act on today: driving
 * with an expired licence is illegal and can void insurance cover, and for a
 * buyer an expired test is a bargaining point and a cost. It is therefore
 * promoted out of the field list into a banner of its own.
 */
import { t } from '@/i18n';
import type { CkanValue, VehicleRecordRaw } from '@/api/types';

export type LicenseState = 'expired' | 'soon' | 'valid';

/** Within this many days of expiry we warn instead of reassuring. */
export const EXPIRY_WARNING_DAYS = 45;

export interface LicenseStatus {
  state: LicenseState;
  /** The expiry date as DD/MM/YYYY. */
  dateLabel: string;
  /** Whole days until expiry; negative once it has passed. */
  days: number;
  /** Human countdown: "בעוד 12 ימים" / "לפני 3 ימים" / "היום". */
  relative: string;
}

const MS_PER_DAY = 86_400_000;

interface ParsedDate {
  date: Date;
  label: string;
}

/** Registry dates arrive as `YYYY-MM-DD` (sometimes with a time suffix). */
function parseDate(value: CkanValue | undefined): ParsedDate | null {
  const match = String(value ?? '').match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (!match) return null;

  const [, year, month, day] = match;
  // Built from parts in local time, so the day-difference below is not skewed
  // by a UTC parse landing on the previous evening.
  const date = new Date(Number(year), Number(month) - 1, Number(day));
  if (Number.isNaN(date.getTime())) return null;

  return { date, label: `${day}/${month}/${year}` };
}

function relativeLabel(days: number): string {
  if (days === 0) return t.license.today;
  if (days === 1) return t.license.tomorrow;
  if (days === -1) return t.license.yesterday;
  return days > 0
    ? t.license.daysLeft.replace('{n}', String(days))
    : t.license.daysAgo.replace('{n}', String(-days));
}

/**
 * Returns null when the record carries no usable expiry date — a missing date
 * must render nothing rather than an implied "fine".
 */
export function licenseStatus(
  record: VehicleRecordRaw,
  now: Date = new Date()
): LicenseStatus | null {
  const parsed = parseDate(record.tokef_dt);
  if (!parsed) return null;

  // Compare date to date, not instant to instant: a licence expiring today has
  // not expired yet.
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const days = Math.round((parsed.date.getTime() - today.getTime()) / MS_PER_DAY);

  const state: LicenseState =
    days < 0 ? 'expired' : days <= EXPIRY_WARNING_DAYS ? 'soon' : 'valid';

  return { state, dateLabel: parsed.label, days, relative: relativeLabel(days) };
}
