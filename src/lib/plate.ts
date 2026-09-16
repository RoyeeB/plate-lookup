/**
 * Israeli license-plate helpers. Plates are 7 or 8 digits (older ones 5-6).
 * The registry is keyed by the bare digit string (no dashes).
 */

export const MIN_PLATE_DIGITS = 5;
export const MAX_PLATE_DIGITS = 8;

/** Strip everything except ASCII digits. */
export function digitsOnly(input: string): string {
  return input.replace(/\D+/g, '');
}

/** A plate is valid if it is 5-8 digits after stripping separators. */
export function isValidPlate(input: string): boolean {
  const d = digitsOnly(input);
  return d.length >= MIN_PLATE_DIGITS && d.length <= MAX_PLATE_DIGITS;
}

/** Canonical form used for API queries and storage keys: digits only. */
export function normalizePlate(input: string): string {
  return digitsOnly(input);
}

/**
 * Pretty-print a plate for display, LTR, grouped like the physical plate.
 *  - 8 digits → NN-NNN-NNN
 *  - 7 digits → NN-NNN-NN
 *  - 6 digits → NNN-NNN
 *  - otherwise → as-is
 * The digits themselves stay LTR even inside an RTL layout.
 */
export function formatPlate(input: string): string {
  const d = digitsOnly(input);
  switch (d.length) {
    case 8:
      return `${d.slice(0, 3)}-${d.slice(3, 5)}-${d.slice(5)}`;
    case 7:
      return `${d.slice(0, 2)}-${d.slice(2, 5)}-${d.slice(5)}`;
    case 6:
      return `${d.slice(0, 3)}-${d.slice(3)}`;
    default:
      return d;
  }
}
