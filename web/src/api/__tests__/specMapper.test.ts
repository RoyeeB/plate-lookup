/**
 * Protects the ownership-chain honesty rules in specMapper: a dealer holding
 * the car between two owners must not inflate the hand count, a car that
 * predates the January-2017 transfer log must be flagged as a minimum count
 * rather than presented as fact, and an empty log must read as "unknown"
 * rather than implicitly "first owner". Also covers the YYYYMM date format
 * and the ordinal-label fallback once the Hebrew ordinal list runs out.
 */
import { describe, expect, it } from 'vitest';
import { firstRoadYear, summarizeOwnership } from '@/api/specMapper';
import type { HistoryRaw, OwnershipRaw } from '@/api/types';

function transfer(baalut_dt: string, baalut: string): OwnershipRaw {
  return { baalut_dt, baalut };
}

describe('summarizeOwnership', () => {
  it('returns null for an empty log — unknown, not "first owner"', () => {
    expect(summarizeOwnership([], null)).toBeNull();
  });

  it('shows a dealer transfer in the chain but does not count it as a hand', () => {
    const rows: OwnershipRaw[] = [
      transfer('201701', 'פרטי'),
      transfer('201803', 'סוחר'),
      transfer('201806', 'פרטי'),
    ];
    const result = summarizeOwnership(rows, 2015);
    expect(result).not.toBeNull();
    expect(result?.chain).toHaveLength(3);
    expect(result?.chain[1].isDealer).toBe(true);
    expect(result?.owners).toBe(2); // dealer excluded
    expect(result?.dealerTransfers).toBe(1);
    expect(result?.handLabel).toBe('יד שנייה');
  });

  it('flags isMinimum when the car first went on the road before the log starts (2017)', () => {
    const rows: OwnershipRaw[] = [transfer('201703', 'פרטי')];
    const result = summarizeOwnership(rows, 2015);
    expect(result?.isMinimum).toBe(true);
  });

  it('does not flag isMinimum for a car on the road from 2017 onward', () => {
    const rows: OwnershipRaw[] = [transfer('201703', 'פרטי')];
    const result = summarizeOwnership(rows, 2017);
    expect(result?.isMinimum).toBe(false);
  });

  it('does not flag isMinimum when the first-road year is unknown', () => {
    const rows: OwnershipRaw[] = [transfer('201703', 'פרטי')];
    const result = summarizeOwnership(rows, null);
    expect(result?.isMinimum).toBe(false);
  });

  it('formats YYYYMM as MM/YYYY in the chain', () => {
    const rows: OwnershipRaw[] = [transfer('201701', 'פרטי')];
    const result = summarizeOwnership(rows, null);
    expect(result?.chain[0].date).toBe('01/2017');
  });

  it('falls back to "יד 12" once past the ordinal word list', () => {
    const rows: OwnershipRaw[] = Array.from({ length: 12 }, (_, i) =>
      transfer(`2018${String((i % 12) + 1).padStart(2, '0')}`, 'פרטי')
    );
    const result = summarizeOwnership(rows, null);
    expect(result?.owners).toBe(12);
    expect(result?.handLabel).toBe('יד 12');
  });

  it('returns null when every row is a dealer (no actual owners)', () => {
    const rows: OwnershipRaw[] = [transfer('201701', 'סוחר')];
    expect(summarizeOwnership(rows, null)).toBeNull();
  });

  it('drops rows missing a usable date or type rather than crashing', () => {
    const rows: OwnershipRaw[] = [
      { baalut_dt: undefined, baalut: 'פרטי' },
      { baalut_dt: '201701', baalut: undefined },
      transfer('201801', 'פרטי'),
    ];
    const result = summarizeOwnership(rows, null);
    expect(result?.chain).toHaveLength(1);
    expect(result?.owners).toBe(1);
  });
});

describe('firstRoadYear', () => {
  it('prefers the history dataset\'s full ISO date', () => {
    const history: HistoryRaw = { rishum_rishon_dt: '2016-09-12' };
    expect(firstRoadYear({ moed_aliya_lakvish: '2018-3', shnat_yitzur: 2018 }, history)).toBe(
      2016
    );
  });

  it('falls back to moed_aliya_lakvish ("2016-9" style) when history has none', () => {
    expect(firstRoadYear({ moed_aliya_lakvish: '2016-9', shnat_yitzur: 2018 }, null)).toBe(2016);
  });

  it('falls back to shnat_yitzur when neither history nor road date is available', () => {
    expect(firstRoadYear({ shnat_yitzur: 2019 }, null)).toBe(2019);
  });

  it('returns null when nothing is usable', () => {
    expect(firstRoadYear({}, null)).toBeNull();
  });
});
