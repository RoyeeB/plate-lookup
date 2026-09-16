/**
 * Colour theme: follow the system, or a choice the user made. The resolved
 * theme lives on <html data-theme>, which theme.css keys the dark tokens on.
 * index.html runs the same resolution inline before first paint.
 */
export type ThemeChoice = 'system' | 'light' | 'dark';
export type Theme = 'light' | 'dark';

export const THEME_STORAGE_KEY = 'plate-lookup:theme';

/** Browser chrome colour per theme (the address bar on mobile). */
const THEME_COLOR: Record<Theme, string> = { light: '#F4C400', dark: '#0f1115' };

export function resolveTheme(choice: ThemeChoice, systemPrefersDark: boolean): Theme {
  if (choice === 'light' || choice === 'dark') return choice;
  return systemPrefersDark ? 'dark' : 'light';
}

/** system → light → dark → system: every state reachable from one button. */
export function nextThemeChoice(choice: ThemeChoice): ThemeChoice {
  return choice === 'system' ? 'light' : choice === 'light' ? 'dark' : 'system';
}

export function readThemeChoice(): ThemeChoice {
  try {
    const stored = window.localStorage.getItem(THEME_STORAGE_KEY);
    return stored === 'light' || stored === 'dark' ? stored : 'system';
  } catch {
    return 'system';
  }
}

export function saveThemeChoice(choice: ThemeChoice): void {
  try {
    if (choice === 'system') window.localStorage.removeItem(THEME_STORAGE_KEY);
    else window.localStorage.setItem(THEME_STORAGE_KEY, choice);
  } catch {
    // Not persisted (private mode); it still applies for this visit.
  }
}

export function applyTheme(theme: Theme): void {
  document.documentElement.dataset.theme = theme;
  document.querySelector('meta[name="theme-color"]')?.setAttribute('content', THEME_COLOR[theme]);
}
