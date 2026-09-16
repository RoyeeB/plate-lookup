// @vitest-environment jsdom
/**
 * The theme toggle cycles system → light → dark, applies the result to
 * <html data-theme> immediately, and remembers an explicit choice.
 */
import { beforeEach, describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ThemeToggle } from '@/components/ThemeToggle';
import { THEME_STORAGE_KEY, nextThemeChoice, resolveTheme } from '@/lib/theme';
import { t } from '@/i18n';

describe('theme resolution', () => {
  it('follows the system only when no explicit choice was made', () => {
    expect(resolveTheme('system', true)).toBe('dark');
    expect(resolveTheme('system', false)).toBe('light');
    expect(resolveTheme('light', true)).toBe('light');
    expect(resolveTheme('dark', false)).toBe('dark');
  });

  it('cycles through every state', () => {
    expect(nextThemeChoice('system')).toBe('light');
    expect(nextThemeChoice('light')).toBe('dark');
    expect(nextThemeChoice('dark')).toBe('system');
  });
});

describe('ThemeToggle', () => {
  beforeEach(() => {
    localStorage.clear();
    document.documentElement.removeAttribute('data-theme');
    document.head.innerHTML = '<meta name="theme-color" content="#F4C400" />';
    window.matchMedia = ((query: string) => ({
      matches: false,
      media: query,
      addEventListener: () => {},
      removeEventListener: () => {},
    })) as unknown as typeof window.matchMedia;
  });

  it('names the current state in its label', () => {
    render(<ThemeToggle />);
    expect(screen.getByRole('button').getAttribute('aria-label')).toContain(t.theme.system);
  });

  it('applies and remembers each choice as it cycles', async () => {
    render(<ThemeToggle />);
    const button = screen.getByRole('button');

    await userEvent.click(button);
    expect(document.documentElement.dataset.theme).toBe('light');
    expect(localStorage.getItem(THEME_STORAGE_KEY)).toBe('light');

    await userEvent.click(button);
    expect(document.documentElement.dataset.theme).toBe('dark');
    expect(localStorage.getItem(THEME_STORAGE_KEY)).toBe('dark');
    expect(document.querySelector('meta[name="theme-color"]')?.getAttribute('content')).toBe('#0f1115');

    // Back to "system" forgets the override.
    await userEvent.click(button);
    expect(localStorage.getItem(THEME_STORAGE_KEY)).toBeNull();
    expect(document.documentElement.dataset.theme).toBe('light');
  });
});
