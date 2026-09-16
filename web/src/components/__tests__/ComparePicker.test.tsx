// @vitest-environment jsdom
/**
 * Picking the second car: recent searches (minus the current car) or a typed
 * plate, which must be valid and different from the current one.
 */
import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ComparePicker } from '@/components/ComparePicker';
import { t } from '@/i18n';

const recent = [
  { plate: '1111111', make: 'טויוטה', model: 'קורולה', year: '2019', at: 2 },
  { plate: '2222222', make: 'מאזדה', model: '3', year: '2020', at: 1 },
];

function setup() {
  const onPick = vi.fn();
  const onClose = vi.fn();
  render(
    <ComparePicker open currentPlate="1111111" recent={recent} onPick={onPick} onClose={onClose} />
  );
  return { onPick, onClose };
}

describe('ComparePicker', () => {
  it('offers recent searches except the current car', async () => {
    const { onPick } = setup();
    const dialog = screen.getByRole('dialog', { name: t.compare.pickTitle });
    expect(dialog.textContent).not.toContain('טויוטה קורולה');
    await userEvent.click(screen.getByRole('button', { name: /מאזדה 3/ }));
    expect(onPick).toHaveBeenCalledWith('2222222');
  });

  it('accepts a typed plate only when valid and different', async () => {
    const { onPick } = setup();
    const input = screen.getByRole('textbox', { name: t.home.plateInputLabel });
    const confirm = screen.getByRole('button', { name: t.compare.pickConfirm }) as HTMLButtonElement;

    await userEvent.type(input, '1111111');
    expect(confirm.disabled).toBe(true);

    await userEvent.clear(input);
    await userEvent.type(input, '3333333');
    await userEvent.click(confirm);
    expect(onPick).toHaveBeenCalledWith('3333333');
  });

  it('closes on Escape', async () => {
    const { onClose } = setup();
    await userEvent.keyboard('{Escape}');
    expect(onClose).toHaveBeenCalled();
  });
});
