// @vitest-environment jsdom
/**
 * The update prompt stays hidden until the service worker reports new code,
 * and can be dismissed without reloading.
 */
import { describe, expect, it } from 'vitest';
import { act, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { UPDATE_EVENT, UpdateBanner } from '@/components/UpdateBanner';
import { t } from '@/i18n';

describe('UpdateBanner', () => {
  it('appears only after an update event, and can be dismissed', async () => {
    render(<UpdateBanner />);
    expect(screen.queryByText(t.update.available)).toBeNull();

    act(() => {
      window.dispatchEvent(new Event(UPDATE_EVENT));
    });
    expect(screen.getByRole('status').textContent).toContain(t.update.available);
    expect(screen.getByRole('button', { name: t.update.reload })).toBeTruthy();

    await userEvent.click(screen.getByRole('button', { name: t.update.dismiss }));
    expect(screen.queryByText(t.update.available)).toBeNull();
  });
});
