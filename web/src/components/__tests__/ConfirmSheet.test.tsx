// @vitest-environment jsdom
/**
 * The post-scan confirmation dialog: seeded from the OCR result, never submits
 * an invalid plate, closes on Escape, and behaves as a real modal for keyboard
 * users (focus stays inside, and returns to the opener on close).
 */
import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ConfirmSheet } from '@/components/ConfirmSheet';
import { t } from '@/i18n';

function setup(initialPlate = '1234567', open = true) {
  const onConfirm = vi.fn();
  const onCancel = vi.fn();
  const utils = render(
    <ConfirmSheet open={open} initialPlate={initialPlate} onConfirm={onConfirm} onCancel={onCancel} />
  );
  return { ...utils, onConfirm, onCancel };
}

const input = () => screen.getByRole('textbox', { name: t.home.plateInputLabel }) as HTMLInputElement;
const confirmButton = () =>
  screen.getByRole('button', { name: t.scan.confirmSearch }) as HTMLButtonElement;

describe('ConfirmSheet', () => {
  it('renders nothing while closed', () => {
    setup('1234567', false);
    expect(screen.queryByRole('dialog')).toBeNull();
  });

  it('is a labelled modal dialog seeded with the detected digits', () => {
    setup('1234567');
    const dialog = screen.getByRole('dialog', { name: t.scan.confirmTitle });
    expect(dialog.getAttribute('aria-modal')).toBe('true');
    expect(input().value).toBe('1234567');
    expect(document.activeElement).toBe(input());
  });

  it('confirms the edited plate', async () => {
    const { onConfirm } = setup('1234567');
    await userEvent.clear(input());
    await userEvent.type(input(), '7654321');
    await userEvent.click(confirmButton());
    expect(onConfirm).toHaveBeenCalledWith('7654321');
  });

  it('flags an invalid plate and refuses to confirm it', async () => {
    const { onConfirm } = setup('1234567');
    await userEvent.clear(input());
    await userEvent.type(input(), '12{Enter}');

    expect(screen.getByRole('alert').textContent).toBe(t.home.invalidPlate);
    expect(input().getAttribute('aria-invalid')).toBe('true');
    expect(input().getAttribute('aria-describedby')).toBe(screen.getByRole('alert').id);
    expect(confirmButton().disabled).toBe(true);
    expect(onConfirm).not.toHaveBeenCalled();
  });

  it('closes on Escape', async () => {
    const { onCancel } = setup();
    await userEvent.keyboard('{Escape}');
    expect(onCancel).toHaveBeenCalledOnce();
  });

  it('keeps Tab focus inside the sheet', async () => {
    setup('1234567');
    const cancel = screen.getByRole('button', { name: t.scan.confirmCancel });

    cancel.focus();
    await userEvent.tab();
    expect(document.activeElement).toBe(input());

    await userEvent.tab({ shift: true });
    expect(document.activeElement).toBe(cancel);
  });

  it('re-seeds the field when a new detection reopens it', () => {
    const { rerender } = setup('1234567');
    rerender(<ConfirmSheet open initialPlate="9999999" onConfirm={vi.fn()} onCancel={vi.fn()} />);
    expect(input().value).toBe('9999999');
  });

  it('returns focus to the element that opened it', () => {
    const opener = document.createElement('button');
    document.body.appendChild(opener);
    opener.focus();

    const { rerender } = render(
      <ConfirmSheet open initialPlate="1234567" onConfirm={vi.fn()} onCancel={vi.fn()} />
    );
    expect(document.activeElement).not.toBe(opener);

    rerender(<ConfirmSheet open={false} initialPlate="1234567" onConfirm={vi.fn()} onCancel={vi.fn()} />);
    expect(document.activeElement).toBe(opener);
    opener.remove();
  });
});
