// @vitest-environment jsdom
/**
 * The facts grid must never turn "not loaded yet" or "failed to load" into a
 * claim — an unknown hand count is "unknown", a failed request is a dash, and
 * a floor ("at least") keeps its qualifier.
 */
import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import { KeyFacts } from '@/components/KeyFacts';
import type { OwnershipInfo } from '@/api/specMapper';
import { t } from '@/i18n';

const ownership: OwnershipInfo = {
  owners: 2,
  handLabel: 'יד שנייה',
  isMinimum: true,
  dealerTransfers: 0,
  chain: [],
};

const base = {
  year: '2019',
  fuel: 'בנזין',
  km: 84_000,
  ownership: null,
  mileage: null,
  loading: false,
  ownershipFailed: false,
  historyFailed: false,
};

/** The <dd> paired with a fact's label. */
function valueOf(label: string): string {
  const dt = screen.getByText(label).closest('dt');
  return dt?.nextElementSibling?.textContent ?? '';
}

describe('KeyFacts', () => {
  it('shows the record facts as a labelled description list', () => {
    render(<KeyFacts {...base} ownership={ownership} />);
    expect(screen.getByRole('region', { name: t.facts.title })).toBeTruthy();
    expect(valueOf(t.facts.year)).toBe('2019');
    expect(valueOf(t.facts.fuel)).toBe('בנזין');
    expect(valueOf(t.facts.mileage)).toMatch(/84,000/);
  });

  it('keeps the "at least" qualifier on a partial ownership count', () => {
    render(<KeyFacts {...base} ownership={ownership} />);
    expect(valueOf(t.facts.hand)).toBe(`${t.ownership.atLeast}יד שנייה`);
  });

  it('says "unknown" — not first hand — when the log has no rows', () => {
    render(<KeyFacts {...base} />);
    expect(valueOf(t.facts.hand)).toBe(t.facts.unknown);
  });

  it('shows a dash, not "unknown", when those requests failed', () => {
    render(<KeyFacts {...base} ownershipFailed historyFailed />);
    expect(valueOf(t.facts.hand)).toBe(t.facts.unavailable);
    expect(valueOf(t.facts.mileage)).toBe(t.facts.unavailable);
  });

  it('announces loading for the enrichment-backed tiles only', () => {
    render(<KeyFacts {...base} km={null} loading />);
    expect(valueOf(t.facts.hand)).toBe(t.facts.loading);
    expect(valueOf(t.facts.year)).toBe('2019');
  });

  it('shows the mileage band with its explanation', () => {
    render(<KeyFacts {...base} mileage={{ perYear: 24_000, band: 'high' }} />);
    expect(screen.getByText(t.facts.bandHigh)).toBeTruthy();
    expect(screen.getByText(t.facts.mileageNote)).toBeTruthy();
  });
});
