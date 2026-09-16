/**
 * Tiny i18n shim. Today it always returns Hebrew, but everything reads through
 * `t` / `getLocale`, so adding English later is a matter of adding a locale map
 * and a language switch — no component changes.
 */
import { he, type Strings } from './strings';

export type Locale = 'he';

const locales: Record<Locale, Strings> = {
  he,
};

let currentLocale: Locale = 'he';

export function setLocale(locale: Locale): void {
  currentLocale = locale;
}

export function getLocale(): Locale {
  return currentLocale;
}

/** Whether the active locale is written right-to-left. */
export function isRTL(): boolean {
  return currentLocale === 'he';
}

/** The active string table. Access as `t.home.title`, `t.fields.tozeret_nm`, … */
export const t: Strings = locales[currentLocale];

export { he };
