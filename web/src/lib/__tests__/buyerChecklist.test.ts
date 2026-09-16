/**
 * The buyer checklist states facts; these tests pin down the one rule that
 * matters most — missing or failed data is "unknown", never "fine".
 */
import { describe, expect, it } from 'vitest';
import { buildChecklist, type ChecklistInput } from '@/lib/buyerChecklist';
import type { VehicleEnrichment } from '@/api/types';
import type { OwnershipInfo } from '@/api/specMapper';

const enrichment = (overrides: Partial<VehicleEnrichment> = {}): VehicleEnrichment => ({
  modelSpec: null,
  price: [],
  history: { shinui_mivne_ind: '0', shnui_zeva_ind: '0', mkoriut_nm: 'פרטי' },
  recalls: [],
  ownership: [],
  failed: [],
  incomplete: false,
  ...overrides,
});

const privateOwner: OwnershipInfo = {
  owners: 1,
  handLabel: 'יד ראשונה',
  isMinimum: false,
  dealerTransfers: 0,
  chain: [{ key: 'a', date: '01/2020', type: 'פרטי', isDealer: false }],
};

const base: ChecklistInput = {
  license: { state: 'valid', dateLabel: '01/01/2027', days: 200, relative: 'בעוד 200 ימים' },
  isInactive: false,
  enrichment: enrichment(),
  enrichmentLoading: false,
  ownership: privateOwner,
  mileage: { perYear: 12_000, band: 'average' },
};

const status = (input: ChecklistInput) =>
  Object.fromEntries(buildChecklist(input).map((item) => [item.id, item.status]));

describe('buildChecklist', () => {
  it('marks a clean record as fine across the board', () => {
    expect(status(base)).toEqual({
      license: 'ok',
      recall: 'ok',
      mileage: 'ok',
      usage: 'ok',
      structure: 'ok',
      color: 'ok',
    });
  });

  it('flags what a buyer should check', () => {
    const result = status({
      ...base,
      isInactive: true,
      license: { state: 'expired', dateLabel: '01/01/2025', days: -10, relative: 'לפני 10 ימים' },
      enrichment: enrichment({
        recalls: [{ RECALL_ID: 1 }],
        history: { shinui_mivne_ind: '1', shnui_zeva_ind: '1', mkoriut_nm: 'החכר' },
      }),
      mileage: { perYear: 26_000, band: 'high' },
    });
    expect(result).toEqual({
      inactive: 'attention',
      license: 'attention',
      recall: 'attention',
      mileage: 'attention',
      usage: 'attention',
      structure: 'attention',
      color: 'attention',
    });
  });

  it('reports rental use found in the ownership chain', () => {
    const items = buildChecklist({
      ...base,
      ownership: { ...privateOwner, chain: [{ key: 'b', date: '01/2019', type: 'השכרה', isDealer: false }] },
    });
    expect(items.find((i) => i.id === 'usage')).toMatchObject({ status: 'attention' });
  });

  it('never calls a failed source fine', () => {
    const result = status({
      ...base,
      enrichment: enrichment({ failed: ['openRecalls', 'history', 'ownership'], history: null }),
      ownership: null,
      mileage: null,
    });
    expect(result.recall).toBe('unknown');
    expect(result.mileage).toBe('unknown');
    expect(result.usage).toBe('unknown');
    expect(result.structure).toBe('unknown');
  });

  it('does not claim "no lease" when the ownership log is missing', () => {
    const result = status({ ...base, enrichment: enrichment({ failed: ['ownership'] }), ownership: null });
    expect(result.usage).toBe('unknown');
  });

  it('shows enrichment-backed items as pending while loading', () => {
    const result = status({ ...base, enrichment: undefined, enrichmentLoading: true });
    expect(result.recall).toBe('pending');
    expect(result.license).toBe('ok');
  });

  it('treats an unknown licence date as unknown', () => {
    expect(status({ ...base, license: null }).license).toBe('unknown');
  });
});
