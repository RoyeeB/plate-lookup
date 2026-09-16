// @vitest-environment jsdom
/**
 * The offline copy of looked-up cars: newest first, capped, replaced rather
 * than duplicated, and never trusted if storage holds something malformed.
 */
import { beforeEach, describe, expect, it } from 'vitest';
import {
  MAX_SAVED,
  clearSavedVehicles,
  loadSavedVehicle,
  saveVehicle,
} from '@/lib/savedVehicles';
import type { VehicleLookupResult } from '@/api/types';

function result(plate: string): VehicleLookupResult {
  return { plate, record: { tozeret_nm: 'טויוטה' }, datasetId: 'x', datasetLabel: 'x', isInactive: false };
}

describe('savedVehicles', () => {
  beforeEach(() => localStorage.clear());

  it('saves and loads a lookup with its timestamp', () => {
    saveVehicle(result('1234567'), null, 1_000);
    expect(loadSavedVehicle('1234567')).toMatchObject({ plate: '1234567', savedAt: 1_000 });
    expect(loadSavedVehicle('7654321')).toBeNull();
  });

  it('replaces an older copy of the same plate', () => {
    saveVehicle(result('1234567'), null, 1_000);
    saveVehicle(result('1234567'), null, 2_000);
    expect(loadSavedVehicle('1234567')?.savedAt).toBe(2_000);
  });

  it(`keeps only the ${MAX_SAVED} most recent`, () => {
    for (let i = 0; i < MAX_SAVED + 2; i++) saveVehicle(result(String(1_000_000 + i)), null, i);
    expect(loadSavedVehicle('1000000')).toBeNull();
    expect(loadSavedVehicle(String(1_000_000 + MAX_SAVED + 1))).not.toBeNull();
  });

  it('clears everything', () => {
    saveVehicle(result('1234567'), null);
    clearSavedVehicles();
    expect(loadSavedVehicle('1234567')).toBeNull();
  });

  it('ignores malformed storage instead of throwing', () => {
    localStorage.setItem('plate-lookup:saved-vehicles:v1', '{not json');
    expect(loadSavedVehicle('1234567')).toBeNull();
    localStorage.setItem('plate-lookup:saved-vehicles:v1', JSON.stringify([{ plate: '1234567' }]));
    expect(loadSavedVehicle('1234567')).toBeNull();
  });
});
