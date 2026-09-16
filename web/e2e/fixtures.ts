/**
 * Canned data.gov.il and Wikipedia responses, shaped like the real APIs.
 *
 * 8491639  Hyundai i10 2016 — a clean record.
 * 35000902 Volvo XC60 2021  — an open recall and a lease history.
 * 1234567  not in any dataset.
 */
import type { Page, Route } from '@playwright/test';

export const PLATES = { hyundai: '8491639', volvo: '35000902', unknown: '1234567' } as const;

const REGISTRY_MAIN = '053cea08-09bc-40ec-8f7a-156f0677aff3';
const RESOURCES = {
  modelSpecs: '142afde2-6228-49f9-8a29-9b6c3a0cbe40',
  priceList: '39f455bf-6db0-4926-859d-017f34eacbcb',
  history: '56063a99-8a3e-4ff4-912e-5966c0279bad',
  ownership: 'bb2355dc-9ec7-4f06-9c3f-3344672171da',
  openRecalls: '36bf1404-0be4-49d2-82dc-2f1ead4a8b93',
};

type Row = Record<string, string | number | null>;

const RECORDS: Record<string, Row> = {
  [PLATES.hyundai]: {
    mispar_rechev: 8491639,
    tozeret_cd: 845,
    tozeret_nm: 'יונדאי טורקיה',
    degem_cd: 27,
    degem_nm: 'A751A',
    kinuy_mishari: 'I10',
    ramat_gimur: 'INSIGHT',
    shnat_yitzur: 2016,
    tzeva_rechev: 'כסף',
    sug_delek_nm: 'בנזין',
    misgeret: 'NLHA751AAGZ211845',
    baalut: 'פרטי',
    mivchan_acharon_dt: '2026-09-02',
    tokef_dt: '2027-09-26',
    moed_aliya_lakvish: '2016-5',
  },
  [PLATES.volvo]: {
    mispar_rechev: 35000902,
    tozeret_cd: 361,
    tozeret_nm: 'וולבו שבדיה',
    degem_cd: 5,
    degem_nm: 'UZL1',
    kinuy_mishari: 'XC60 B5 FWD',
    ramat_gimur: 'MOMENTUM',
    shnat_yitzur: 2021,
    tzeva_rechev: 'שנהב לבן',
    sug_delek_nm: 'בנזין',
    misgeret: 'YV1UZL1VDN1940690',
    baalut: 'פרטי',
    mivchan_acharon_dt: '2026-08-31',
    tokef_dt: '2027-08-25',
    moed_aliya_lakvish: '2021-8',
  },
};

const MODEL_ROWS: Record<string, { spec: Row; price: Row }> = {
  '845/27': {
    spec: { tozeret_cd: 845, degem_cd: 27, degem_nm: 'A751A', shnat_yitzur: 2016, kinuy_mishari: 'I10', koah_sus: 66, nefah_manoa: 998, automatic_ind: 0, merkav: "הצ'בק", mispar_dlatot: 5, mispar_moshavim: 5 },
    price: { tozeret_cd: 845, degem_cd: 27, degem_nm: 'A751A', shnat_yitzur: 2016, mehir: 59900, shem_yevuan: 'כלמוביל יונדאי' },
  },
  '361/5': {
    spec: { tozeret_cd: 361, degem_cd: 5, degem_nm: 'UZL1', shnat_yitzur: 2021, kinuy_mishari: 'XC60', koah_sus: 250, nefah_manoa: 1969, automatic_ind: 1, merkav: 'פנאי-שטח', mispar_dlatot: 5, mispar_moshavim: 5 },
    price: { tozeret_cd: 361, degem_cd: 5, degem_nm: 'UZL1', shnat_yitzur: 2021, mehir: 309900, shem_yevuan: 'מאיר חברה למכוניות ומשאיות בע"מ' },
  },
};

const HISTORY: Record<string, Row> = {
  [PLATES.hyundai]: { mispar_rechev: 8491639, kilometer_test_aharon: 110000, rishum_rishon_dt: '2016-05-01', mkoriut_nm: 'פרטי', shinui_mivne_ind: 0, shnui_zeva_ind: 0, shinui_zmig_ind: 0 },
  [PLATES.volvo]: { mispar_rechev: 35000902, kilometer_test_aharon: 39470, rishum_rishon_dt: '2021-08-01', mkoriut_nm: 'החכר', shinui_mivne_ind: 0, shnui_zeva_ind: 0, shinui_zmig_ind: 0 },
};

const OWNERSHIP: Record<string, Row[]> = {
  [PLATES.hyundai]: [{ baalut_dt: 201605, baalut: 'פרטי' }],
  [PLATES.volvo]: [
    { baalut_dt: 202108, baalut: 'החכר' },
    { baalut_dt: 202405, baalut: 'פרטי' },
  ],
};

const RECALLS: Record<string, Row[]> = {
  [PLATES.volvo]: [
    { RECALL_ID: 5555, SUG_TAKALA: 'בלמים', TEUR_TAKALA: 'בדיקת צנרת הבלמים', TAARICH_PTICHA: '2025-03-01' },
  ],
};

function datastore(records: Row[]) {
  return { success: true, result: { resource_id: 'x', total: records.length, records } };
}

function plateFrom(params: URLSearchParams, key: string): string | null {
  const raw = params.get('filters') ?? params.get('q');
  if (!raw) return null;
  const value = (JSON.parse(raw) as Record<string, unknown>)[key];
  return value === undefined ? null : String(value);
}

async function answerDataGov(route: Route): Promise<void> {
  const url = new URL(route.request().url());
  const params = url.searchParams;
  const resource = params.get('resource_id');
  let records: Row[] = [];

  if (resource === REGISTRY_MAIN) {
    const plate = plateFrom(params, 'mispar_rechev');
    records = plate && RECORDS[plate] ? [RECORDS[plate]] : [];
  } else if (resource === RESOURCES.modelSpecs || resource === RESOURCES.priceList) {
    const filters = JSON.parse(params.get('filters') ?? '{}') as Record<string, unknown>;
    const model = MODEL_ROWS[`${filters.tozeret_cd}/${filters.degem_cd}`];
    if (model) records = [resource === RESOURCES.modelSpecs ? model.spec : model.price];
  } else if (resource === RESOURCES.history) {
    const plate = plateFrom(params, 'mispar_rechev');
    records = plate && HISTORY[plate] ? [HISTORY[plate]] : [];
  } else if (resource === RESOURCES.ownership) {
    records = OWNERSHIP[plateFrom(params, 'mispar_rechev') ?? ''] ?? [];
  } else if (resource === RESOURCES.openRecalls) {
    records = RECALLS[plateFrom(params, 'MISPAR_RECHEV') ?? ''] ?? [];
  }
  await route.fulfill({ json: datastore(records) });
}

/** A 1×1 PNG, served as the "Wikipedia" photo. */
const PIXEL = Buffer.from(
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8/5+hHgAHggJ/PchI7wAAAABJRU5ErkJggg==',
  'base64'
);

async function answerWikipedia(route: Route): Promise<void> {
  const params = new URL(route.request().url()).searchParams;
  const titles = params.get('titles') ?? '';
  // Only the exact-title lookup for the i10 has a photo; everything else is empty.
  if (/^Hyundai i10$/i.test(titles)) {
    await route.fulfill({
      json: {
        query: {
          pages: {
            '1': {
              title: 'Hyundai i10',
              pageimage: 'Hyundai_i10.png',
              thumbnail: { source: 'https://upload.wikimedia.org/e2e/hyundai-i10.png' },
            },
          },
        },
      },
    });
    return;
  }
  await route.fulfill({ json: { batchcomplete: '', query: { pages: { '-1': { missing: '' } } } } });
}

export async function mockNetwork(page: Page): Promise<void> {
  await page.route('https://data.gov.il/**', answerDataGov);
  await page.route('https://*.wikipedia.org/**', answerWikipedia);
  await page.route('https://upload.wikimedia.org/**', (route) =>
    route.fulfill({ contentType: 'image/png', body: PIXEL })
  );
}
