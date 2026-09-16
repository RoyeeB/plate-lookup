#!/usr/bin/env node
/**
 * Builds shared/manufacturers.json: for every manufacturer code in the car
 * registry, the clean brand and country of manufacture as the Ministry of
 * Transport itself publishes them.
 *
 * Why: the registry's `tozeret_nm` is brand + country squeezed into a fixed-width
 * field and cut off ("פולקסווגן גרמנ", "שברולט ד.קוריא", "אלפא רומיאו_אי"). The
 * Ministry's WLTP model catalogue carries the same codes with separate `tozar`
 * (brand) and `tozeret_eretz_nm` (country) columns, so there is an official,
 * untruncated answer to look up instead of guessing by cutting strings.
 *
 * The JSON holds the Ministry's values verbatim; all spelling normalisation is
 * done in shared/manufacturer.ts, where it is visible and tested.
 *
 * Usage: node scripts/build-manufacturers.mjs
 *
 * Note: CKAN's `distinct=true` is unreliable for large result sets on this API
 * (it silently returns a partial list), so codes are collected per dataset and
 * then every code is resolved with its own small, filtered query.
 */
import { writeFile } from 'node:fs/promises';

const API = 'https://data.gov.il/api/3/action/datastore_search';
const REGISTRY = [
  '053cea08-09bc-40ec-8f7a-156f0677aff3', // private / commercial / heavy
  'f6efe89a-fb3d-43a4-bb61-9bf12a9b9099', // inactive, with model code
  'cf29862d-ca25-4691-84f6-1be60dcb4a1e', // inactive
];
const WLTP = '142afde2-6228-49f9-8a29-9b6c3a0cbe40';

async function query(params, attempt = 1) {
  const url = `${API}?${new URLSearchParams(params)}`;
  try {
    const res = await fetch(url);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const json = await res.json();
    if (!json.success) throw new Error('unsuccessful');
    return json.result.records;
  } catch (err) {
    if (attempt >= 4) throw new Error(`${url}: ${err.message}`);
    await new Promise((r) => setTimeout(r, 500 * attempt));
    return query(params, attempt + 1);
  }
}

async function pool(items, size, work) {
  const out = [];
  let next = 0;
  await Promise.all(
    Array.from({ length: size }, async () => {
      while (next < items.length) {
        const i = next++;
        out[i] = await work(items[i]);
      }
    })
  );
  return out;
}

const codes = new Set();
for (const id of [...REGISTRY, WLTP]) {
  const rows = await query({ resource_id: id, fields: 'tozeret_cd', distinct: 'true', limit: '32000' });
  for (const row of rows) if (row.tozeret_cd !== null) codes.add(row.tozeret_cd);
}
console.log(`${codes.size} manufacturer codes`);

const entries = await pool([...codes].sort((a, b) => a - b), 8, async (cd) => {
  const filters = JSON.stringify({ tozeret_cd: cd });
  const names = new Set();
  for (const id of REGISTRY) {
    const rows = await query({ resource_id: id, filters, fields: 'tozeret_nm', distinct: 'true', limit: '50' });
    for (const row of rows) if (row.tozeret_nm) names.add(String(row.tozeret_nm).trim());
  }
  const wltp = await query({
    resource_id: WLTP,
    filters,
    fields: 'tozeret_nm,tozar,tozeret_eretz_nm',
    distinct: 'true',
    limit: '50',
  });
  for (const row of wltp) if (row.tozeret_nm) names.add(String(row.tozeret_nm).trim());

  const brands = [...new Set(wltp.map((r) => String(r.tozar ?? '').trim()).filter(Boolean))];
  const countries = [...new Set(wltp.map((r) => String(r.tozeret_eretz_nm ?? '').trim()).filter(Boolean))];
  return {
    cd,
    // Only trusted when the catalogue is unanimous for the code.
    brand: brands.length === 1 ? brands[0] : null,
    country: countries.length === 1 ? countries[0] : null,
    names: [...names].sort(),
  };
});

const useful = entries.filter((e) => e.brand || e.names.length > 0);
await writeFile(
  new URL('../shared/manufacturers.json', import.meta.url),
  `${JSON.stringify(useful, null, 0).replace(/\},\{/g, '},\n{')}\n`
);
console.log(
  `wrote ${useful.length} entries (${useful.filter((e) => e.brand).length} with an official brand)`
);
