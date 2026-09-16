/**
 * Comparison rows: same facts as the vehicle page, differences marked only
 * between two known values, and unknowns shown as a dash on either side.
 */
import { describe, expect, it } from 'vitest';
import { buildComparison } from '@/lib/compare';
import { buildOverview } from '@/lib/vehicleOverview';
import type { VehicleEnrichment, VehicleLookupResult } from '@/api/types';
import { t } from '@/i18n';

const car = (record: VehicleLookupResult['record']): VehicleLookupResult => ({
  plate: '1234567',
  record,
  datasetId: 'x',
  datasetLabel: 'x',
  isInactive: false,
});

const enrichment: VehicleEnrichment = {
  modelSpec: { koah_sus: 122 },
  price: [{ mehir: 120_000 }],
  history: { kilometer_test_aharon: 60_000, rishum_rishon_dt: '2019-01-01' },
  recalls: [],
  ownership: [],
  failed: [],
  incomplete: false,
};

const overview = (record: VehicleLookupResult['record'], extra?: VehicleEnrichment) =>
  buildOverview(car(record), extra, { loading: false, error: false });

describe('buildComparison', () => {
  it('lines up the same facts for both cars and marks differences', () => {
    const rows = buildComparison(
      overview({ shnat_yitzur: 2019, sug_delek_nm: 'בנזין' }, enrichment),
      overview({ shnat_yitzur: 2021, sug_delek_nm: 'בנזין' }, enrichment)
    );
    const byId = Object.fromEntries(rows.map((row) => [row.id, row]));

    expect(byId.year.values).toEqual(['2019', '2021']);
    expect(byId.year.differs).toBe(true);
    expect(byId.fuel.differs).toBe(false);
    expect(byId.horsepower.values).toEqual(['122', '122']);
  });

  it('shows a dash for missing data and never marks it as a difference', () => {
    const rows = buildComparison(
      overview({ shnat_yitzur: 2019 }, enrichment),
      overview({ shnat_yitzur: 2019 })
    );
    const hp = rows.find((row) => row.id === 'horsepower');
    expect(hp?.values).toEqual(['122', t.facts.unavailable]);
    expect(hp?.differs).toBe(false);
  });

  it('handles a column that has not loaded at all', () => {
    const rows = buildComparison(overview({ shnat_yitzur: 2019 }), null);
    expect(rows.every((row) => row.values[1] === t.facts.unavailable && !row.differs)).toBe(true);
  });
});
