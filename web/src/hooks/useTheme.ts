/**
 * The user's theme choice, kept in sync with <html data-theme>. While the
 * choice is "system", a change to the OS setting applies live.
 */
import { useCallback, useEffect, useState } from 'react';
import {
  applyTheme,
  nextThemeChoice,
  readThemeChoice,
  resolveTheme,
  saveThemeChoice,
  type ThemeChoice,
} from '@/lib/theme';

const DARK_QUERY = '(prefers-color-scheme: dark)';

function systemPrefersDark(): boolean {
  return typeof window.matchMedia === 'function' && window.matchMedia(DARK_QUERY).matches;
}

export function useTheme() {
  const [choice, setChoice] = useState<ThemeChoice>(readThemeChoice);

  useEffect(() => {
    applyTheme(resolveTheme(choice, systemPrefersDark()));
    if (choice !== 'system' || typeof window.matchMedia !== 'function') return;

    const media = window.matchMedia(DARK_QUERY);
    const onChange = () => applyTheme(resolveTheme('system', media.matches));
    media.addEventListener('change', onChange);
    return () => media.removeEventListener('change', onChange);
  }, [choice]);

  const cycle = useCallback(() => {
    // Let colours cross-fade for this one change only (see motion.css).
    const root = document.documentElement;
    root.classList.add('theme-transition');
    window.setTimeout(() => root.classList.remove('theme-transition'), 350);
    setChoice((current) => {
      const next = nextThemeChoice(current);
      saveThemeChoice(next);
      return next;
    });
  }, []);

  return { choice, cycle };
}
