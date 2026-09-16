/**
 * Protects licenseStatus(): this drives the legal warning banner, so the
 * expired/soon/valid boundaries and the "unknown means nothing" fallback are
 * exercised precisely, always against an explicit `now` so the suite never
 * depends on the day it happens to run.
 */
import { describe, expect, it } from 'vitest';
import { licenseStatus } from '@/lib/licenseStatus';
import type { VehicleRecordRaw } from '@/api/types';

// Fixed reference "today": 15 Jan 2026.
const NOW = new Date(2026, 0, 15);

function record(tokef_dt: VehicleRecordRaw['tokef_dt']): VehicleRecordRaw {
  return { tokef_dt };
}

describe('licenseStatus', () => {
  it('is expired the day after tokef_dt (expired yesterday)', () => {
    const status = licenseStatus(record('2026-01-14'), NOW);
    expect(status?.state).toBe('expired');
    expect(status?.days).toBe(-1);
    expect(status?.relative).toBe('אתמול');
  });

  it('treats expiring today as "soon", NOT "expired"', () => {
    const status = licenseStatus(record('2026-01-15'), NOW);
    expect(status?.state).toBe('soon');
    expect(status?.days).toBe(0);
    expect(status?.relative).toBe('היום');
  });

  it('is still "soon" exactly 45 days out (inclusive boundary)', () => {
    const status = licenseStatus(record('2026-03-01'), NOW);
    expect(status?.state).toBe('soon');
    expect(status?.days).toBe(45);
  });

  it('flips to "valid" at 46 days out', () => {
    const status = licenseStatus(record('2026-03-02'), NOW);
    expect(status?.state).toBe('valid');
    expect(status?.days).toBe(46);
  });

  it('returns null for a missing tokef_dt — never an implied "fine"', () => {
    expect(licenseStatus(record(undefined), NOW)).toBeNull();
  });

  it('returns null for a garbage tokef_dt', () => {
    expect(licenseStatus(record('not-a-date'), NOW)).toBeNull();
    expect(licenseStatus(record(''), NOW)).toBeNull();
    expect(licenseStatus(record(null), NOW)).toBeNull();
  });

  it('labels tomorrow correctly', () => {
    const status = licenseStatus(record('2026-01-16'), NOW);
    expect(status?.days).toBe(1);
    expect(status?.relative).toBe('מחר');
  });

  it('labels a past date as "לפני N ימים"', () => {
    const status = licenseStatus(record('2026-01-12'), NOW);
    expect(status?.days).toBe(-3);
    expect(status?.relative).toBe('לפני 3 ימים');
  });

  it('labels a future date as "בעוד N ימים"', () => {
    const status = licenseStatus(record('2026-01-25'), NOW);
    expect(status?.days).toBe(10);
    expect(status?.relative).toBe('בעוד 10 ימים');
  });

  it('formats the date label as DD/MM/YYYY', () => {
    const status = licenseStatus(record('2026-03-01'), NOW);
    expect(status?.dateLabel).toBe('01/03/2026');
  });
});
