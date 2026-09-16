/**
 * data.gov.il CKAN client. Queries each configured dataset in sequence until a
 * record is found, then returns a normalized result.
 */
import {
  CKAN_BASE_URL,
  DATASETS,
  type DatasetConfig,
} from './datasets';
import type {
  DatastoreSearchResponse,
  VehicleLookupResult,
  VehicleRecordRaw,
} from './types';

const REQUEST_TIMEOUT_MS = 12000;

/** Thrown when we cannot reach / parse the API (distinct from "not found"). */
export class VehicleApiError extends Error {
  constructor(message: string, override readonly cause?: unknown) {
    super(message);
    this.name = 'VehicleApiError';
  }
}

/** Thrown when the plate is valid but no dataset returned a record. */
export class VehicleNotFoundError extends Error {
  constructor(readonly plate: string) {
    super(`No vehicle record found for plate ${plate}`);
    this.name = 'VehicleNotFoundError';
  }
}

/**
 * CKAN offers two ways to match a column. `filters` is an exact match on an
 * indexed column; `q` is a fuzzy full-text search that can match a record whose
 * plate merely contains the digits. Filters is both stricter and faster, so it
 * goes first — `q` stays as a fallback for any resource where the column is
 * stored as padded text and so never matches a number.
 */
type MatchMode = 'filters' | 'q';

function buildUrl(resourceId: string, plate: string, mode: MatchMode): string {
  const params = new URLSearchParams({ resource_id: resourceId, limit: '1' });

  if (mode === 'filters') {
    // The registry stores mispar_rechev numerically, so leading zeros must go —
    // which is also what the enrichment joins do with the same plate.
    params.set('filters', JSON.stringify({ mispar_rechev: Number(plate) }));
  } else {
    params.set('q', JSON.stringify({ mispar_rechev: plate }));
  }

  return `${CKAN_BASE_URL}?${params.toString()}`;
}

async function fetchOne(
  url: string,
  signal: AbortSignal
): Promise<VehicleRecordRaw | null> {
  let response: Response;
  try {
    response = await fetch(url, {
      method: 'GET',
      headers: { Accept: 'application/json' },
      signal,
    });
  } catch (err) {
    if (signal.aborted) throw err;
    throw new VehicleApiError('Network request failed', err);
  }

  if (!response.ok) {
    throw new VehicleApiError(`HTTP ${response.status} from data.gov.il`);
  }

  let json: DatastoreSearchResponse<VehicleRecordRaw>;
  try {
    json = (await response.json()) as DatastoreSearchResponse<VehicleRecordRaw>;
  } catch (err) {
    throw new VehicleApiError('Failed to parse API response', err);
  }

  if (!json.success || !json.result) {
    // A malformed resource_id or a datastore that is temporarily down returns
    // success:false — treat as a soft miss so the fallback chain continues.
    return null;
  }

  const record = json.result.records[0];
  return record ?? null;
}

async function queryDataset(
  dataset: DatasetConfig,
  plate: string,
  signal: AbortSignal
): Promise<VehicleRecordRaw | null> {
  // An all-digit plate can be matched exactly; anything else only by search.
  if (/^\d+$/.test(plate)) {
    const exact = await fetchOne(buildUrl(dataset.id, plate, 'filters'), signal);
    if (exact) return exact;
  }
  return fetchOne(buildUrl(dataset.id, plate, 'q'), signal);
}

/**
 * Look up a plate across all datasets in order. Resolves with the first match,
 * throws {@link VehicleNotFoundError} if none match, or {@link VehicleApiError}
 * on a transport/parse failure.
 */
export async function fetchVehicle(
  plate: string,
  signal: AbortSignal
): Promise<VehicleLookupResult> {
  let lastApiError: VehicleApiError | null = null;

  for (const dataset of DATASETS) {
    try {
      const record = await queryDataset(dataset, plate, signal);
      if (record) {
        return {
          plate,
          record,
          datasetId: dataset.id,
          datasetLabel: dataset.label,
          isInactive: dataset.inactive,
        };
      }
    } catch (err) {
      if (err instanceof VehicleApiError) {
        // Remember it but keep trying the remaining datasets; one flaky
        // resource shouldn't block a match in another.
        lastApiError = err;
        continue;
      }
      throw err; // abort or unexpected
    }
  }

  // No record anywhere. If every attempt also failed at the transport level,
  // surface that as an API error so the user sees "retry" instead of "not found".
  if (lastApiError) throw lastApiError;
  throw new VehicleNotFoundError(plate);
}

/** Wrap fetchVehicle with a timeout, composing an external abort signal. */
export async function fetchVehicleWithTimeout(
  plate: string,
  externalSignal?: AbortSignal
): Promise<VehicleLookupResult> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

  const onExternalAbort = () => controller.abort();
  if (externalSignal) {
    if (externalSignal.aborted) controller.abort();
    else externalSignal.addEventListener('abort', onExternalAbort);
  }

  try {
    return await fetchVehicle(plate, controller.signal);
  } finally {
    clearTimeout(timeout);
    externalSignal?.removeEventListener('abort', onExternalAbort);
  }
}
