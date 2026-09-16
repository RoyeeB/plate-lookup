/**
 * Protects mapOfficialFields(): a "0" / "null" / empty value must be dropped
 * rather than rendered as a blank row, ISO-ish dates are reformatted to
 * DD/MM/YYYY, and the VIN (misgeret) row is the only one marked copyable.
 */
import { describe, expect, it } from 'vitest';
import { mapOfficialFields } from '@/api/mapper';
import type { VehicleRecordRaw } from '@/api/types';

describe('mapOfficialFields', () => {
  it('renders present fields with their Hebrew labels', () => {
    const record: VehicleRecordRaw = {
      tozeret_nm: 'טויוטה',
      shnat_yitzur: 2020,
      misgeret: 'JT123456789',
    };
    const fields = mapOfficialFields(record);
    const byKey = Object.fromEntries(fields.map((f) => [f.key, f]));

    expect(byKey.tozeret_nm.value).toBe('טויוטה');
    expect(byKey.tozeret_nm.label).toBe('יצרן');
    expect(byKey.shnat_yitzur.value).toBe('2020');
  });

  it('drops empty, "0", and "null" values instead of rendering a blank row', () => {
    const record: VehicleRecordRaw = {
      tozeret_nm: 'טויוטה',
      kinuy_mishari: '',
      degem_nm: '0',
      ramat_gimur: 'null',
      tzeva_rechev: undefined,
      nefach_manoa: null,
    };
    const fields = mapOfficialFields(record);
    const keys = fields.map((f) => f.key);

    expect(keys).toContain('tozeret_nm');
    expect(keys).not.toContain('kinuy_mishari');
    expect(keys).not.toContain('degem_nm');
    expect(keys).not.toContain('ramat_gimur');
    expect(keys).not.toContain('tzeva_rechev');
    expect(keys).not.toContain('nefach_manoa');
  });

  it('reformats ISO-ish dates (YYYY-MM-DD...) to DD/MM/YYYY', () => {
    const record: VehicleRecordRaw = {
      mivchan_acharon_dt: '2024-06-05',
      tokef_dt: '2025-06-05T00:00:00',
    };
    const fields = mapOfficialFields(record);
    const byKey = Object.fromEntries(fields.map((f) => [f.key, f]));

    expect(byKey.mivchan_acharon_dt.value).toBe('05/06/2024');
    expect(byKey.tokef_dt.value).toBe('05/06/2025');
  });

  it('marks only the VIN (misgeret) row as copyable', () => {
    const record: VehicleRecordRaw = {
      tozeret_nm: 'טויוטה',
      misgeret: 'JT123456789',
    };
    const fields = mapOfficialFields(record);
    const byKey = Object.fromEntries(fields.map((f) => [f.key, f]));

    expect(byKey.misgeret.copyable).toBe(true);
    expect(byKey.tozeret_nm.copyable).toBe(false);
  });

  it('returns an empty list for a record with nothing usable', () => {
    expect(mapOfficialFields({})).toEqual([]);
  });
});
