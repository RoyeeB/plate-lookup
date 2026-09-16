/**
 * Protects estimateSpecs(): official figures must win over (and not be
 * duplicated alongside) the derived ones, and the combustion-calibrated
 * torque/0-100 formulas must never fire for an electric vehicle — a real bug
 * this suite guards against regressing on.
 */
import { describe, expect, it } from 'vitest';
import { estimateSpecs } from '@/lib/estimates';
import type { VehicleRecordRaw } from '@/api/types';

function keysOf(specs: ReturnType<typeof estimateSpecs>): string[] {
  return specs.map((s) => s.key);
}

describe('estimateSpecs', () => {
  it('uses the official horsepower rather than estimating, and does not repeat it', () => {
    const record: VehicleRecordRaw = {
      sug_delek_nm: 'בנזין',
      nefach_manoa: 1600,
      shnat_yitzur: 2020,
    };
    const specs = estimateSpecs(record, { hp: 999 });
    // The spec card already renders the official hp — this section must not.
    expect(keysOf(specs)).not.toContain('horsepower');
    // But it does still drive torque/0-100 downstream.
    expect(keysOf(specs)).toContain('torque');
  });

  it('estimates horsepower when no official figure is given', () => {
    const record: VehicleRecordRaw = {
      sug_delek_nm: 'בנזין',
      nefach_manoa: 1600,
      shnat_yitzur: 2020,
    };
    const specs = estimateSpecs(record);
    expect(keysOf(specs)).toContain('horsepower');
  });

  it('suppresses the derived curb-weight row when an official gross weight exists', () => {
    const record: VehicleRecordRaw = {
      sug_delek_nm: 'בנזין',
      nefach_manoa: 1600,
      shnat_yitzur: 2020,
    };
    const withoutOfficial = estimateSpecs(record);
    expect(keysOf(withoutOfficial)).toContain('curbWeight');

    const withOfficialGross = estimateSpecs(record, { grossWeightKg: 2000 });
    expect(keysOf(withOfficialGross)).not.toContain('curbWeight');
  });

  it('produces no torque and no 0-100 for an electric vehicle, even with an official hp', () => {
    const record: VehicleRecordRaw = {
      sug_delek_nm: 'חשמל',
      nefach_manoa: 1800,
      shnat_yitzur: 2022,
    };
    const specs = estimateSpecs(record, { hp: 204 });
    expect(keysOf(specs)).not.toContain('torque');
    expect(keysOf(specs)).not.toContain('zeroToHundred');
    expect(keysOf(specs)).not.toContain('horsepower');
  });

  it('the same displacement/hp as a combustion car WOULD show torque and 0-100 (contrast check)', () => {
    const record: VehicleRecordRaw = {
      sug_delek_nm: 'בנזין',
      nefach_manoa: 1800,
      shnat_yitzur: 2022,
    };
    const specs = estimateSpecs(record, { hp: 204 });
    expect(keysOf(specs)).toContain('torque');
    expect(keysOf(specs)).toContain('zeroToHundred');
  });

  it('gives diesel a higher torque ratio than petrol for the same horsepower', () => {
    const dieselSpecs = estimateSpecs({ sug_delek_nm: 'דיזל' }, { hp: 150 });
    const petrolSpecs = estimateSpecs({ sug_delek_nm: 'בנזין' }, { hp: 150 });

    const dieselTorque = Number(
      dieselSpecs.find((s) => s.key === 'torque')?.value.replace(/[^\d.]/g, '')
    );
    const petrolTorque = Number(
      petrolSpecs.find((s) => s.key === 'torque')?.value.replace(/[^\d.]/g, '')
    );

    expect(dieselTorque).toBeGreaterThan(petrolTorque);
    expect(dieselTorque).toBe(300); // 150 * 2.0
    expect(petrolTorque).toBe(205); // round5(150 * 1.35) = round5(202.5) = 205 (Math.round rounds .5 up)
  });

  it('returns an empty array when nothing usable is available', () => {
    const record: VehicleRecordRaw = {};
    expect(estimateSpecs(record)).toEqual([]);
  });
});
