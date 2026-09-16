/**
 * Secondary lookups that run *after* a plate has been found in the registry.
 *
 * The main registry record is thin — it has no engine power, no price and no
 * odometer. Those live in separate data.gov.il resources which we join onto the
 * result here: two by model code, two by plate number.
 *
 * Every one of these is best-effort. Coverage genuinely varies (the history
 * file covers roughly two thirds of the fleet; the WLTP model file thins out
 * for older cars), so a miss is normal and must never fail the page.
 */
import { CKAN_BASE_URL, ENRICHMENT_RESOURCES } from './datasets';
import type {
  DatastoreSearchResponse,
  HistoryRaw,
  ModelSpecRaw,
  OwnershipRaw,
  PriceRaw,
  RecallRaw,
  VehicleEnrichment,
  VehicleRecordRaw,
} from './types';

type Filters = Record<string, string | number>;

/**
 * CKAN `filters` does an exact match on indexed columns — far more reliable
 * than the fuzzy `q` search the main lookup has to use.
 */
async function queryRows<T>(
  resourceId: string,
  filters: Filters,
  signal: AbortSignal,
  limit = 1,
  sort?: string
): Promise<T[]> {
  const params = new URLSearchParams({
    resource_id: resourceId,
    filters: JSON.stringify(filters),
    limit: String(limit),
  });
  if (sort) params.set('sort', sort);

  const response = await fetch(`${CKAN_BASE_URL}?${params.toString()}`, {
    method: 'GET',
    headers: { Accept: 'application/json' },
    signal,
  });
  if (!response.ok) return [];

  const json = (await response.json()) as DatastoreSearchResponse<T>;
  if (!json.success || !json.result) return [];
  return json.result.records;
}

/** Swallow anything that isn't an abort, so one bad join can't sink the page. */
async function soft<T>(work: Promise<T>, fallback: T, signal: AbortSignal): Promise<T> {
  try {
    return await work;
  } catch (err) {
    if (signal.aborted) throw err;
    return fallback;
  }
}

function toInt(value: unknown): number | null {
  if (value === null || value === undefined || value === '') return null;
  const n = Number(value);
  return Number.isFinite(n) ? n : null;
}

/**
 * Look up one model-keyed resource. Tries the exact production year first and
 * falls back to the same model in any year — model codes are stable across a
 * generation, and a car's registry year and the catalogue year sometimes differ
 * by one.
 */
async function queryByModel<T>(
  resourceId: string,
  tozeretCd: number,
  degemCd: number,
  year: number | null,
  signal: AbortSignal
): Promise<T | null> {
  if (year !== null) {
    const exact = await queryRows<T>(
      resourceId,
      { tozeret_cd: tozeretCd, degem_cd: degemCd, shnat_yitzur: year },
      signal
    );
    if (exact.length > 0) return exact[0];
  }

  const anyYear = await queryRows<T>(
    resourceId,
    { tozeret_cd: tozeretCd, degem_cd: degemCd },
    signal
  );
  return anyYear[0] ?? null;
}

async function queryHistory(
  plate: number,
  signal: AbortSignal
): Promise<HistoryRaw | null> {
  const rows = await queryRows<HistoryRaw>(
    ENRICHMENT_RESOURCES.history,
    { mispar_rechev: plate },
    signal
  );
  return rows[0] ?? null;
}

/** A vehicle can change hands many times; 60 rows is far beyond any real chain. */
const MAX_OWNERSHIP_ROWS = 60;

const EMPTY: VehicleEnrichment = {
  modelSpec: null,
  price: null,
  history: null,
  recalls: [],
  ownership: [],
};

/**
 * Join every secondary dataset onto a found registry record. All four run
 * concurrently — they are independent, and the page renders whatever arrives.
 */
export async function fetchEnrichment(
  record: VehicleRecordRaw,
  plate: string,
  signal: AbortSignal
): Promise<VehicleEnrichment> {
  const tozeretCd = toInt(record.tozeret_cd);
  const degemCd = toInt(record.degem_cd);
  const year = toInt(record.shnat_yitzur);
  const plateNumber = toInt(plate);

  const hasModelKey = tozeretCd !== null && degemCd !== null;

  const [modelSpec, price, history, recalls, ownership] = await Promise.all([
    hasModelKey
      ? soft(
          queryByModel<ModelSpecRaw>(
            ENRICHMENT_RESOURCES.modelSpecs,
            tozeretCd,
            degemCd,
            year,
            signal
          ),
          null,
          signal
        )
      : Promise.resolve(null),
    hasModelKey
      ? soft(
          queryByModel<PriceRaw>(
            ENRICHMENT_RESOURCES.priceList,
            tozeretCd,
            degemCd,
            year,
            signal
          ),
          null,
          signal
        )
      : Promise.resolve(null),
    plateNumber !== null
      ? soft(queryHistory(plateNumber, signal), null, signal)
      : Promise.resolve(null),
    plateNumber !== null
      ? soft(
          queryRows<RecallRaw>(
            ENRICHMENT_RESOURCES.openRecalls,
            { MISPAR_RECHEV: plateNumber },
            signal,
            10
          ),
          [],
          signal
        )
      : Promise.resolve([]),
    plateNumber !== null
      ? soft(
          queryRows<OwnershipRaw>(
            ENRICHMENT_RESOURCES.ownership,
            { mispar_rechev: plateNumber },
            signal,
            MAX_OWNERSHIP_ROWS,
            'baalut_dt asc'
          ),
          [],
          signal
        )
      : Promise.resolve([]),
  ]);

  return { modelSpec, price, history, recalls, ownership };
}

export { EMPTY as EMPTY_ENRICHMENT };
