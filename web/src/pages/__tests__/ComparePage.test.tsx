// @vitest-environment jsdom
/**
 * The comparison page: a table with both cars as column headers, per-column
 * loading, and a clear message for an invalid pair.
 */
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { screen, within } from '@testing-library/react';
import ComparePage from '@/pages/ComparePage';
import { renderWithProviders } from '@/test/render';
import { buildOverview } from '@/lib/vehicleOverview';
import type { VehicleOverviewState } from '@/hooks/useVehicleOverview';
import { t } from '@/i18n';

const states = vi.hoisted(() => new Map<string, VehicleOverviewState>());
vi.mock('@/hooks/useVehicleOverview', () => ({
  useVehicleOverview: (plate: string) => states.get(plate),
}));

const ready = (name: string, year: number): VehicleOverviewState => ({
  overview: buildOverview(
    {
      plate: 'x',
      record: { tozeret_cd: 839, tozeret_nm: 'טויוטה טורקיה', kinuy_mishari: name, shnat_yitzur: year },
      datasetId: 'x',
      datasetLabel: 'x',
      isInactive: false,
    },
    undefined,
    { loading: false, error: false }
  ),
  loading: false,
  notFound: false,
  failed: false,
});

const renderAt = (a: string, b: string) =>
  renderWithProviders(<ComparePage />, { route: `/compare/${a}/${b}`, path: '/compare/:a/:b' });

describe('ComparePage', () => {
  beforeEach(() => {
    states.clear();
    states.set('1111111', ready('קורולה', 2019));
    states.set('2222222', ready('יאריס', 2021));
  });

  it('renders both cars as columns of one table', () => {
    renderAt('1111111', '2222222');
    const table = screen.getByRole('table', { name: t.compare.title });
    const headers = within(table).getAllByRole('columnheader');
    expect(headers.map((h) => h.textContent)).toEqual([
      expect.stringContaining('טויוטה קורולה'),
      expect.stringContaining('טויוטה יאריס'),
    ]);
    const yearRow = within(table).getByRole('rowheader', { name: t.facts.year }).closest('tr');
    expect(yearRow?.textContent).toContain('2019');
    expect(yearRow?.textContent).toContain('2021');
    expect(yearRow?.className).toContain('compare__row--differs');
  });

  it('shows a column as not found without breaking the other', () => {
    states.set('2222222', { overview: null, loading: false, notFound: true, failed: false });
    renderAt('1111111', '2222222');
    expect(screen.getByText(t.states.notFoundTitle)).toBeTruthy();
    expect(screen.getAllByRole('columnheader')[0].textContent).toContain('טויוטה קורולה');
  });

  it('refuses to compare a car with itself', () => {
    renderAt('1111111', '1111111');
    expect(screen.getByText(t.compare.invalidTitle)).toBeTruthy();
    expect(screen.queryByRole('table')).toBeNull();
  });
});
