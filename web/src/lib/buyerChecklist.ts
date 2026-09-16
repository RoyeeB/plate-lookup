/**
 * "Before you buy" — the facts on the page that a buyer should look at, in one
 * list. Each item is a statement of what the data says, never a verdict on the
 * car, and an item whose data didn't load is "unknown", never "fine": an empty
 * or failed source proves nothing.
 */
import { t } from '@/i18n';
import type { HistoryRaw, RecallRaw, VehicleEnrichment } from '@/api/types';
import type { OwnershipInfo } from '@/api/specMapper';
import type { LicenseStatus } from '@/lib/licenseStatus';
import type { MileageInsight } from '@/lib/vehicleSummary';
import { formatNumber } from '@/lib/vehicleSummary';

export type ChecklistStatus = 'ok' | 'attention' | 'unknown' | 'pending';

export interface ChecklistItem {
  id: string;
  status: ChecklistStatus;
  title: string;
  detail: string;
}

export interface ChecklistInput {
  license: LicenseStatus | null;
  isInactive: boolean;
  /** Undefined while loading or after the whole request failed. */
  enrichment: VehicleEnrichment | undefined;
  enrichmentLoading: boolean;
  ownership: OwnershipInfo | null;
  mileage: MileageInsight | null;
}

const LEASE = /החכר|ליסינג/;
const RENTAL = /השכר/;

function failed(enrichment: VehicleEnrichment | undefined, source: string): boolean {
  return enrichment === undefined || enrichment.failed.includes(source);
}

function pendingOrUnknown(input: ChecklistInput, id: string, title: string): ChecklistItem {
  return input.enrichmentLoading
    ? { id, status: 'pending', title, detail: t.checklist.loading }
    : { id, status: 'unknown', title, detail: t.checklist.unavailable };
}

function licenseItem(license: LicenseStatus | null): ChecklistItem {
  const title = t.checklist.license.title;
  if (!license) return { id: 'license', status: 'unknown', title, detail: t.checklist.unavailable };
  if (license.state === 'expired') {
    return {
      id: 'license',
      status: 'attention',
      title,
      detail: t.checklist.license.expired.replace('{date}', license.dateLabel),
    };
  }
  if (license.state === 'soon') {
    return {
      id: 'license',
      status: 'attention',
      title,
      detail: t.checklist.license.soon.replace('{relative}', license.relative),
    };
  }
  return {
    id: 'license',
    status: 'ok',
    title,
    detail: t.checklist.license.valid.replace('{date}', license.dateLabel),
  };
}

function recallItem(input: ChecklistInput): ChecklistItem {
  const title = t.checklist.recall.title;
  if (input.enrichmentLoading || failed(input.enrichment, 'openRecalls')) {
    return pendingOrUnknown(input, 'recall', title);
  }
  const recalls: RecallRaw[] = input.enrichment?.recalls ?? [];
  return recalls.length > 0
    ? {
        id: 'recall',
        status: 'attention',
        title,
        detail: t.checklist.recall.open.replace('{n}', String(recalls.length)),
      }
    : { id: 'recall', status: 'ok', title, detail: t.checklist.recall.none };
}

function mileageItem(input: ChecklistInput): ChecklistItem {
  const title = t.checklist.mileage.title;
  if (input.enrichmentLoading || failed(input.enrichment, 'history')) {
    return pendingOrUnknown(input, 'mileage', title);
  }
  if (!input.mileage) {
    return { id: 'mileage', status: 'unknown', title, detail: t.checklist.mileage.noData };
  }
  const rate = t.facts.perYear.replace('{km}', formatNumber(input.mileage.perYear));
  return input.mileage.band === 'high'
    ? { id: 'mileage', status: 'attention', title, detail: t.checklist.mileage.high.replace('{rate}', rate) }
    : { id: 'mileage', status: 'ok', title, detail: t.checklist.mileage.normal.replace('{rate}', rate) };
}

function flagItem(
  input: ChecklistInput,
  id: string,
  title: string,
  flag: keyof HistoryRaw,
  yes: string,
  no: string
): ChecklistItem {
  if (input.enrichmentLoading || failed(input.enrichment, 'history')) {
    return pendingOrUnknown(input, id, title);
  }
  const value = String(input.enrichment?.history?.[flag] ?? '').trim();
  if (value === '1') return { id, status: 'attention', title, detail: yes };
  if (value === '0') return { id, status: 'ok', title, detail: no };
  return { id, status: 'unknown', title, detail: t.checklist.unavailable };
}

function usageItem(input: ChecklistInput): ChecklistItem {
  const title = t.checklist.usage.title;
  const ownershipDown = failed(input.enrichment, 'ownership');
  const historyDown = failed(input.enrichment, 'history');
  if (input.enrichmentLoading || (ownershipDown && historyDown)) {
    return pendingOrUnknown(input, 'usage', title);
  }

  const types = [
    ...(input.ownership?.chain.map((link) => link.type) ?? []),
    String(input.enrichment?.history?.mkoriut_nm ?? ''),
  ];
  const leased = types.some((type) => LEASE.test(type));
  const rented = types.some((type) => RENTAL.test(type));
  if (leased || rented) {
    const kinds = [leased ? t.checklist.usage.lease : null, rented ? t.checklist.usage.rental : null]
      .filter(Boolean)
      .join(t.checklist.usage.and);
    return { id: 'usage', status: 'attention', title, detail: t.checklist.usage.found.replace('{kinds}', kinds) };
  }
  // Only a complete picture can say "none": with one source down, it's unknown.
  if (ownershipDown || historyDown || !input.ownership) {
    return { id: 'usage', status: 'unknown', title, detail: t.checklist.usage.partial };
  }
  return { id: 'usage', status: 'ok', title, detail: t.checklist.usage.none };
}

export function buildChecklist(input: ChecklistInput): ChecklistItem[] {
  const items: ChecklistItem[] = [];
  if (input.isInactive) {
    items.push({
      id: 'inactive',
      status: 'attention',
      title: t.checklist.inactive.title,
      detail: t.checklist.inactive.detail,
    });
  }
  items.push(
    licenseItem(input.license),
    recallItem(input),
    mileageItem(input),
    usageItem(input),
    flagItem(
      input,
      'structure',
      t.checklist.structure.title,
      'shinui_mivne_ind',
      t.checklist.structure.yes,
      t.checklist.structure.no
    ),
    flagItem(
      input,
      'color',
      t.checklist.color.title,
      'shnui_zeva_ind',
      t.checklist.color.yes,
      t.checklist.color.no
    )
  );
  return items;
}
