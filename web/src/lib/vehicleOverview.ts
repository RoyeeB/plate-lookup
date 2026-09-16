/**
 * Everything the app derives about one vehicle from its registry record and
 * enrichment, in one pure function. The vehicle page and the comparison page
 * both read from this, so a figure can never be computed two different ways.
 */
import { t } from '@/i18n';
import type { VehicleEnrichment, VehicleLookupResult } from '@/api/types';
import {
  firstRoadYear,
  mapPrice,
  summarizeOwnership,
  type OwnershipInfo,
  type PriceInfo,
} from '@/api/specMapper';
import { resolveManufacturer } from '@shared/manufacturer';
import { licenseStatus, type LicenseStatus } from '@/lib/licenseStatus';
import {
  mileageInsight,
  positiveNumber,
  vehicleName,
  type MileageInsight,
} from '@/lib/vehicleSummary';
import { buildChecklist, type ChecklistItem } from '@/lib/buyerChecklist';

export interface VehicleOverview {
  /** "טויוטה קורולה" */
  name: string | null;
  year: string | null;
  trim: string | null;
  brand: string | null;
  country: string | null;
  /** "2019 · GLI · תוצרת טורקיה" */
  meta: string;
  /** "טויוטה קורולה 2019" — for share text and the recent-searches list. */
  fullName: string | null;
  model: string | null;
  fuel: string | null;
  /** Officially published horsepower, from the model catalogue. */
  horsepower: number | null;
  /** Odometer at the last test. */
  km: number | null;
  license: LicenseStatus | null;
  ownership: OwnershipInfo | null;
  mileage: MileageInsight | null;
  price: PriceInfo | null;
  checklist: ChecklistItem[];
  /** The whole enrichment request failed (as opposed to one source). */
  enrichmentFailed: boolean;
  ownershipFailed: boolean;
  historyFailed: boolean;
}

interface EnrichmentState {
  loading: boolean;
  error: boolean;
}

function clean(value: unknown): string | null {
  const s = String(value ?? '').trim();
  return s && s.toLowerCase() !== 'null' ? s : null;
}

export function buildOverview(
  result: VehicleLookupResult,
  enrichment: VehicleEnrichment | undefined,
  state: EnrichmentState
): VehicleOverview {
  const { record } = result;
  const manufacturer = resolveManufacturer(record);
  const year = clean(record.shnat_yitzur);
  const trim = clean(record.ramat_gimur);
  const name = vehicleName(record);

  const enrichmentFailed = state.error && !enrichment;
  const ownershipFailed = enrichmentFailed || Boolean(enrichment?.failed.includes('ownership'));
  const historyFailed = enrichmentFailed || Boolean(enrichment?.failed.includes('history'));

  const license = licenseStatus(record);
  const ownership = enrichment
    ? summarizeOwnership(enrichment.ownership, firstRoadYear(record, enrichment.history))
    : null;
  const mileage = enrichment ? mileageInsight(record, enrichment.history) : null;

  return {
    name,
    year,
    trim,
    brand: manufacturer?.brand ?? null,
    country: manufacturer?.country ?? null,
    meta: [
      year,
      trim,
      manufacturer?.country ? t.vehicle.madeIn.replace('{country}', manufacturer.country) : null,
    ]
      .filter(Boolean)
      .join(' · '),
    fullName: [name, year].filter(Boolean).join(' ') || null,
    model: clean(record.kinuy_mishari),
    fuel: clean(record.sug_delek_nm),
    horsepower: positiveNumber(enrichment?.modelSpec?.koah_sus),
    km: historyFailed ? null : positiveNumber(enrichment?.history?.kilometer_test_aharon),
    license,
    ownership,
    mileage,
    price: mapPrice(enrichment?.price ?? []),
    checklist: buildChecklist({
      license,
      isInactive: result.isInactive,
      enrichment,
      enrichmentLoading: state.loading,
      ownership,
      mileage,
    }),
    enrichmentFailed,
    ownershipFailed,
    historyFailed,
  };
}
