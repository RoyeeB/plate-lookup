// @vitest-environment jsdom
/**
 * VehiclePage's state machine, with the data hooks stubbed: loading skeleton,
 * not-found vs. transport error, the success layout, and — the case that used
 * to render nothing at all — a failed enrichment request.
 */
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import VehiclePage from '@/pages/VehiclePage';
import { VehicleNotFoundError } from '@/api/client';
import type { VehicleLookupResult } from '@/api/types';
import { renderWithProviders } from '@/test/render';
import { t } from '@/i18n';
import { saveVehicle } from '@/lib/savedVehicles';

const hooks = vi.hoisted(() => ({
  useVehicle: vi.fn(),
  useVehicleEnrichment: vi.fn(),
}));

vi.mock('@/api/queries', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/api/queries')>();
  return {
    ...actual,
    useVehicle: hooks.useVehicle,
    useVehicleEnrichment: hooks.useVehicleEnrichment,
    useVehicleImage: () => ({ data: undefined, isLoading: false }),
    useRecentSearches: () => ({ recent: [], add: vi.fn(), clear: vi.fn(), refresh: vi.fn() }),
  };
});

const network = vi.hoisted(() => ({ offline: false }));
vi.mock('@/hooks/useNetworkStatus', () => ({ useNetworkStatus: () => ({ offline: network.offline }) }));

const PLATE = '1234567';

const result: VehicleLookupResult = {
  plate: PLATE,
  datasetId: 'private',
  datasetLabel: 'רכב פרטי',
  isInactive: false,
  // Real registry shape: brand and country packed into tozeret_nm.
  record: { tozeret_cd: 839, tozeret_nm: 'טויוטה טורקיה', kinuy_mishari: 'קורולה', shnat_yitzur: 2019 },
};

function vehicle(overrides: Record<string, unknown> = {}) {
  return {
    data: undefined,
    isLoading: false,
    isError: false,
    error: null,
    isFetching: false,
    refetch: vi.fn(),
    ...overrides,
  };
}

function enrichment(overrides: Record<string, unknown> = {}) {
  return {
    data: undefined,
    isLoading: false,
    isError: false,
    isFetching: false,
    refetch: vi.fn(),
    ...overrides,
  };
}

const renderPage = () =>
  renderWithProviders(<VehiclePage />, { route: `/vehicle/${PLATE}`, path: '/vehicle/:plate' });

describe('VehiclePage', () => {
  beforeEach(() => {
    network.offline = false;
    localStorage.clear();
    hooks.useVehicle.mockReturnValue(vehicle());
    hooks.useVehicleEnrichment.mockReturnValue(enrichment());
  });

  it('rejects a malformed plate in the URL without looking it up', () => {
    renderWithProviders(<VehiclePage />, { route: '/vehicle/12', path: '/vehicle/:plate' });
    expect(screen.getByText(t.home.invalidPlate)).toBeTruthy();
  });

  it('shows an announced skeleton while loading', () => {
    hooks.useVehicle.mockReturnValue(vehicle({ isLoading: true, isFetching: true }));
    renderPage();
    expect(screen.getByRole('status', { name: t.states.loading })).toBeTruthy();
  });

  it('distinguishes "not found" from a network error', () => {
    hooks.useVehicle.mockReturnValue(
      vehicle({ isError: true, error: new VehicleNotFoundError(PLATE) })
    );
    renderPage();
    expect(screen.getByText(t.states.notFoundTitle)).toBeTruthy();
    expect(screen.queryByText(t.states.errorTitle)).toBeNull();
  });

  it('offers a retry on a network error', async () => {
    const refetch = vi.fn();
    hooks.useVehicle.mockReturnValue(vehicle({ isError: true, error: new Error('boom'), refetch }));
    renderPage();

    expect(screen.getByText(t.states.errorTitle)).toBeTruthy();
    await userEvent.click(screen.getByRole('button', { name: t.states.retry }));
    expect(refetch).toHaveBeenCalledOnce();
  });

  it('renders the official record on success', () => {
    hooks.useVehicle.mockReturnValue(vehicle({ data: result }));
    renderPage();
    expect(screen.getByRole('heading', { name: t.vehicle.officialTitle })).toBeTruthy();
    expect(screen.getByText('טויוטה')).toBeTruthy();
    expect(screen.queryByText(t.enrichment.failedTitle)).toBeNull();
  });

  it('names the car by brand — not by the registry\'s brand-plus-country field', () => {
    hooks.useVehicle.mockReturnValue(vehicle({ data: result }));
    renderPage();
    expect(screen.getByRole('heading', { level: 2, name: 'טויוטה קורולה' })).toBeTruthy();
    expect(screen.getByText('2019 · תוצרת טורקיה')).toBeTruthy();
    expect(screen.queryByText('טויוטה טורקיה')).toBeNull();
  });

  it('shows manufacturer and country of manufacture as separate official rows', () => {
    hooks.useVehicle.mockReturnValue(vehicle({ data: result }));
    renderPage();
    const labelled = (label: string) =>
      screen.getByText(label).closest('.spec-row')?.querySelector('.spec-row__value')?.textContent;
    expect(labelled(t.fields.tozeret_nm)).toBe('טויוטה');
    expect(labelled(t.fields.tozeret_eretz_nm)).toBe('טורקיה');
  });

  it('keeps the compact bar out of the accessibility tree', () => {
    hooks.useVehicle.mockReturnValue(vehicle({ data: result }));
    const { container } = renderPage();
    const bar = container.querySelector('.compact-bar');
    expect(bar?.getAttribute('aria-hidden')).toBe('true');
    expect(bar?.hasAttribute('inert')).toBe(true);
  });

  it('shows the known plate while the record loads', () => {
    hooks.useVehicle.mockReturnValue(vehicle({ isLoading: true, isFetching: true }));
    const { container } = renderPage();
    expect(container.querySelector('.plate-badge--hero')?.textContent).toContain('12-345-67');
  });

  it('says so, with a retry, when the whole enrichment request fails', async () => {
    const refetchExtra = vi.fn();
    hooks.useVehicle.mockReturnValue(vehicle({ data: result }));
    hooks.useVehicleEnrichment.mockReturnValue(
      enrichment({ isError: true, error: new Error('boom'), refetch: refetchExtra })
    );
    renderPage();

    // The official data is still there; the failure is a note, not a screen.
    expect(screen.getByText('טויוטה')).toBeTruthy();
    expect(screen.getByText(t.enrichment.failedTitle)).toBeTruthy();

    await userEvent.click(screen.getByRole('button', { name: t.states.retry }));
    expect(refetchExtra).toHaveBeenCalledOnce();
  });

  it('never reports a failed ownership lookup as "unknown owners"', () => {
    hooks.useVehicle.mockReturnValue(vehicle({ data: result }));
    hooks.useVehicleEnrichment.mockReturnValue(
      enrichment({
        data: {
          modelSpec: null,
          price: [],
          history: null,
          recalls: [],
          ownership: [],
          failed: ['ownership'],
          incomplete: true,
        },
      })
    );
    renderPage();

    expect(screen.getByText(t.enrichment.partialTitle)).toBeTruthy();
    expect(screen.queryByText(t.ownership.unknownTitle)).toBeNull();
    expect(screen.queryByText(t.facts.unknown)).toBeNull();
  });

  it('shows the saved copy offline, labelled with when it was saved', () => {
    saveVehicle(result, null, new Date(2026, 5, 1, 9, 30).getTime());
    network.offline = true;
    renderPage();

    expect(screen.getByText(/מידע שמור מ-01\.06\.2026/)).toBeTruthy();
    expect(screen.getByText(t.saved.bodyOffline)).toBeTruthy();
    expect(screen.getByRole('heading', { level: 2, name: 'טויוטה קורולה' })).toBeTruthy();
  });

  it('falls back to the saved copy when the server fails, with a retry', () => {
    saveVehicle(result, null);
    hooks.useVehicle.mockReturnValue(vehicle({ isError: true, error: new Error('boom') }));
    renderPage();

    expect(screen.getByText(t.saved.bodyError)).toBeTruthy();
    expect(screen.queryByText(t.states.errorTitle)).toBeNull();
    expect(screen.getByRole('button', { name: t.states.retry })).toBeTruthy();
  });

  it('never uses a saved copy to contradict a definite "not found"', () => {
    saveVehicle(result, null);
    hooks.useVehicle.mockReturnValue(
      vehicle({ isError: true, error: new VehicleNotFoundError(PLATE) })
    );
    renderPage();
    expect(screen.getByText(t.states.notFoundTitle)).toBeTruthy();
    expect(screen.queryByText(t.saved.bodyError)).toBeNull();
  });

  it('shows the offline state when nothing was saved', () => {
    network.offline = true;
    renderPage();
    expect(screen.getByText(t.states.offlineTitle)).toBeTruthy();
  });

  it('saves a successful lookup for offline use', () => {
    hooks.useVehicle.mockReturnValue(vehicle({ data: result }));
    renderPage();
    expect(localStorage.getItem('plate-lookup:saved-vehicles:v1')).toContain(PLATE);
  });

  it('disables the enrichment retry while it is in flight', () => {
    hooks.useVehicle.mockReturnValue(vehicle({ data: result }));
    hooks.useVehicleEnrichment.mockReturnValue(
      enrichment({ isError: true, error: new Error('boom'), isFetching: true })
    );
    renderPage();

    const retry = screen.getByRole('button', { name: t.states.retrying }) as HTMLButtonElement;
    expect(retry.disabled).toBe(true);
  });
});
