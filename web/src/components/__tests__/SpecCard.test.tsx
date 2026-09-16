// @vitest-environment jsdom
/**
 * SpecCard renders nothing for an empty field list — and the enrichment cards
 * go from empty to filled on the same instance. That transition used to break
 * the Rules of Hooks (an early return before useCallback).
 */
import { describe, expect, it, vi } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { SpecCard } from '@/components/SpecCard';
import type { MappedField } from '@/api/mapper';
import { renderWithProviders } from '@/test/render';
import { t } from '@/i18n';

const fields: MappedField[] = [
  { key: 'tozeret_nm', label: 'יצרן', value: 'טויוטה', copyable: false },
  { key: 'misgeret', label: 'מספר שלדה', value: 'JT123456789', copyable: true },
];

describe('SpecCard', () => {
  it('renders nothing when there are no fields', () => {
    const { container } = renderWithProviders(<SpecCard title="מפרט" fields={[]} />);
    expect(container.querySelector('.card')).toBeNull();
  });

  it('survives going from empty to filled and back without a hook-order error', () => {
    const errors = vi.spyOn(console, 'error').mockImplementation(() => {});
    const { rerender } = renderWithProviders(<SpecCard title="מפרט" fields={[]} />);

    rerender(<SpecCard title="מפרט" fields={fields} />);
    expect(screen.getByRole('heading', { name: 'מפרט' })).toBeTruthy();
    expect(screen.getByText('טויוטה')).toBeTruthy();

    rerender(<SpecCard title="מפרט" fields={[]} />);
    expect(screen.queryByRole('heading', { name: 'מפרט' })).toBeNull();

    expect(errors).not.toHaveBeenCalled();
    errors.mockRestore();
  });

  it('copies the VIN and confirms with a toast', async () => {
    const user = userEvent.setup();
    // user-event installs its own clipboard stub on setup; spy on that one.
    const writeText = vi.spyOn(navigator.clipboard, 'writeText');
    renderWithProviders(<SpecCard title="מפרט" fields={fields} />);

    await user.click(screen.getByText('JT123456789'));

    expect(writeText).toHaveBeenCalledWith('JT123456789');
    await waitFor(() => expect(screen.getByRole('status').textContent).toBe(t.vehicle.copyVin));
  });

  it('flashes the copied row and swaps its icon to a check', async () => {
    const user = userEvent.setup();
    const { container } = renderWithProviders(<SpecCard title="מפרט" fields={fields} />);

    await user.click(screen.getByText('JT123456789'));

    await waitFor(() =>
      expect(container.querySelector('.spec-row--copied')?.textContent).toContain('JT123456789')
    );
  });
});
