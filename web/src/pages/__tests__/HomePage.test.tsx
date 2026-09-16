// @vitest-environment jsdom
/**
 * Home screen search: an invalid plate explains itself instead of silently
 * doing nothing, and a valid one navigates to the vehicle page.
 */
import { beforeEach, describe, expect, it } from 'vitest';
import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import HomePage from '@/pages/HomePage';
import { renderWithProviders } from '@/test/render';
import { t } from '@/i18n';
import { addRecentSearch } from '@/lib/recentSearches';

const input = () => screen.getByRole('textbox', { name: t.home.plateInputLabel });
const search = () => screen.getByRole('button', { name: t.home.searchButton });

describe('HomePage', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('has a single h1-level heading owned by the app header, not the page', () => {
    renderWithProviders(<HomePage />, { path: '/' });
    expect(screen.queryAllByRole('heading', { level: 1 })).toHaveLength(0);
    expect(screen.getByRole('heading', { level: 2, name: t.home.title })).toBeTruthy();
  });

  it('shows the empty recent-searches state', () => {
    renderWithProviders(<HomePage />, { path: '/' });
    expect(screen.getByText(t.home.recentEmptyTitle)).toBeTruthy();
    expect(screen.queryByRole('button', { name: t.home.clearRecent })).toBeNull();
  });

  it('explains an invalid plate when search is pressed', async () => {
    renderWithProviders(<HomePage />, { path: '/' });
    await userEvent.type(input(), '123');
    await userEvent.click(search());

    expect(screen.getByRole('alert').textContent).toBe(t.home.invalidPlate);
    expect(input().getAttribute('aria-invalid')).toBe('true');

    // Editing clears the error again.
    await userEvent.type(input(), '4');
    expect(screen.queryByRole('alert')).toBeNull();
  });

  it('marks the plate field complete once the number is valid', async () => {
    const { container } = renderWithProviders(<HomePage />, { path: '/' });
    // Plates are 5–8 digits.
    await userEvent.type(input(), '1234');
    expect(container.querySelector('.plate-field--valid')).toBeNull();
    await userEvent.type(input(), '5');
    expect(container.querySelector('.plate-field--valid')).not.toBeNull();
  });

  it('navigates to the vehicle page for a valid plate', async () => {
    renderWithProviders(<HomePage />, { path: '/' });
    await userEvent.type(input(), '1234567');
    await userEvent.click(search());
    expect(screen.getByText('other page')).toBeTruthy();
  });

  it('lists a previous search with a descriptive accessible name', () => {
    addRecentSearch('1234567', { make: 'טויוטה', model: 'קורולה', year: '2019' });
    renderWithProviders(<HomePage />, { path: '/' });

    const row = screen.getByRole('button', { name: /^חפש שוב .*טויוטה.*, לוחית 12-345-67$/ });
    expect(row).toBeTruthy();
    expect(screen.queryByText(t.home.recentEmptyTitle)).toBeNull();
  });
});
