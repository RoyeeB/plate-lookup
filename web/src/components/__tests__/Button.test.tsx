// @vitest-environment jsdom
/**
 * The loading state replaces the visible label with a spinner; the button must
 * still have an accessible name and announce that it's busy.
 */
import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Button } from '@/components/Button';

describe('Button', () => {
  it('is named by its visible label and fires onClick', async () => {
    const onClick = vi.fn();
    render(<Button label="חפש רכב" onClick={onClick} />);

    await userEvent.click(screen.getByRole('button', { name: 'חפש רכב' }));
    expect(onClick).toHaveBeenCalledOnce();
  });

  it('keeps its name while loading, is busy, and ignores clicks', async () => {
    const onClick = vi.fn();
    render(<Button label="חפש רכב" loading onClick={onClick} />);

    const button = screen.getByRole('button', { name: 'חפש רכב' });
    expect(button.getAttribute('aria-busy')).toBe('true');
    expect((button as HTMLButtonElement).disabled).toBe(true);

    await userEvent.click(button);
    expect(onClick).not.toHaveBeenCalled();
  });
});
