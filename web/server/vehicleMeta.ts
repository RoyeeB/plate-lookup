/**
 * What a link preview needs to know about a plate: a title and description.
 * Server-side (edge middleware / OG image), so it imports only pure modules by
 * relative path — no Vite aliases, no browser APIs.
 */
import { DATASETS, CKAN_BASE_URL } from '../src/api/datasets';
import { formatPlate } from '../src/lib/plate';
import { resolveManufacturer } from '../../shared/manufacturer';

export interface VehicleMeta {
  plate: string;
  formattedPlate: string;
  /** "יונדאי I10", or null when the lookup failed or found nothing. */
  name: string | null;
  year: string | null;
}

type Fetch = typeof fetch;

interface Record {
  tozeret_cd?: unknown;
  tozeret_nm?: unknown;
  kinuy_mishari?: unknown;
  shnat_yitzur?: unknown;
}

function clean(value: unknown): string | null {
  const s = String(value ?? '').trim();
  return s && s.toLowerCase() !== 'null' ? s : null;
}

/**
 * Best-effort and quick: a preview must never hang the crawler, so a slow or
 * failing registry just yields a plate-only preview.
 */
export async function fetchVehicleMeta(
  plate: string,
  fetchImpl: Fetch = fetch,
  timeoutMs = 2500
): Promise<VehicleMeta> {
  const base: VehicleMeta = { plate, formattedPlate: formatPlate(plate), name: null, year: null };
  const signal = AbortSignal.timeout(timeoutMs);

  try {
    for (const dataset of DATASETS) {
      const params = new URLSearchParams({
        resource_id: dataset.id,
        filters: JSON.stringify({ mispar_rechev: Number(plate) }),
        limit: '1',
      });
      const response = await fetchImpl(`${CKAN_BASE_URL}?${params}`, { signal });
      if (!response.ok) continue;
      const json = (await response.json()) as { result?: { records?: Record[] } };
      const record = json.result?.records?.[0];
      if (!record) continue;

      const brand = resolveManufacturer({
        tozeret_cd: record.tozeret_cd as number | string | null,
        tozeret_nm: record.tozeret_nm as string | null,
      })?.brand;
      const name = [brand, clean(record.kinuy_mishari)].filter(Boolean).join(' ') || null;
      return { ...base, name, year: clean(record.shnat_yitzur) };
    }
  } catch {
    // Timeout or network: fall through to the plate-only preview.
  }
  return base;
}

export function previewTitle(meta: VehicleMeta): string {
  const car = [meta.name, meta.year].filter(Boolean).join(' ');
  return car ? `${car} · ${meta.formattedPlate}` : `פרטי רכב ${meta.formattedPlate}`;
}

export const PREVIEW_DESCRIPTION =
  'פרטי הרכב מהמאגר הרשמי של משרד התחבורה: רישיון, בעלויות, קילומטראז\', מחיר מחירון וריקולים.';
