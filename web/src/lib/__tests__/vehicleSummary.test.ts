/**
 * Protects the at-a-glance summary. The mileage rate is shown to buyers as a
 * judgement ("high for its age"), so the measurement window, the minimum
 * history and the band edges are pinned down exactly.
 */
import { describe, expect, it } from 'vitest';
import { mileageInsight, vehicleName } from '@/lib/vehicleSummary';

describe('vehicleName', () => {
  it('joins make and model', () => {
    expect(vehicleName({ tozeret_nm: ' טויוטה ', kinuy_mishari: 'קורולה' })).toBe('טויוטה קורולה');
  });

  it('uses whichever part exists', () => {
    expect(vehicleName({ kinuy_mishari: 'i10' })).toBe('i10');
  });

  it('is null when there is nothing to name', () => {
    expect(vehicleName({ tozeret_nm: '', kinuy_mishari: 'null' })).toBeNull();
  });
});

describe('mileageInsight', () => {
  it('divides by the time up to the test, not up to today', () => {
    // Four years between first registration and the test.
    const insight = mileageInsight(
      { mivchan_acharon_dt: '2024-01-01' },
      { kilometer_test_aharon: 60_000, rishum_rishon_dt: '2020-01-01' }
    );
    expect(insight).toEqual({ perYear: 15_000, band: 'average' });
  });

  it('falls back to the on-road month when history has no registration date', () => {
    const insight = mileageInsight(
      { mivchan_acharon_dt: '2022-09-01', moed_aliya_lakvish: '2016-9' },
      { kilometer_test_aharon: '60000' }
    );
    expect(insight?.perYear).toBe(10_000);
    expect(insight?.band).toBe('low');
  });

  it('bands above 20,000 km/year as high', () => {
    const insight = mileageInsight(
      { mivchan_acharon_dt: '2023-01-01' },
      { kilometer_test_aharon: 63_000, rishum_rishon_dt: '2020-01-01' }
    );
    expect(insight?.band).toBe('high');
  });

  it('refuses to extrapolate from less than a year', () => {
    expect(
      mileageInsight(
        { mivchan_acharon_dt: '2020-06-01' },
        { kilometer_test_aharon: 9_000, rishum_rishon_dt: '2020-01-01' }
      )
    ).toBeNull();
  });

  it('is null when any input is missing or zero', () => {
    const history = { kilometer_test_aharon: 50_000, rishum_rishon_dt: '2018-01-01' };
    expect(mileageInsight({}, history)).toBeNull();
    expect(mileageInsight({ mivchan_acharon_dt: '2023-01-01' }, null)).toBeNull();
    expect(
      mileageInsight({ mivchan_acharon_dt: '2023-01-01' }, { ...history, kilometer_test_aharon: 0 })
    ).toBeNull();
  });
});
