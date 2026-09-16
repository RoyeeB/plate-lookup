/**
 * Protects the plate helpers: digit extraction, the 5-8 digit validity
 * window, and the grouping used to render a plate like the physical one.
 * A regression here would either reject real plates or send a malformed
 * query string to data.gov.il.
 */
import { describe, expect, it } from 'vitest';
import { digitsOnly, formatPlate, isValidPlate, normalizePlate } from '@/lib/plate';

describe('digitsOnly', () => {
  it('strips separators and letters, keeping only ASCII digits', () => {
    expect(digitsOnly('12-345-67')).toBe('1234567');
    expect(digitsOnly('AB 123 CD 45')).toBe('12345');
    expect(digitsOnly('')).toBe('');
    expect(digitsOnly('----')).toBe('');
  });
});

describe('isValidPlate', () => {
  it('rejects fewer than 5 digits', () => {
    expect(isValidPlate('1234')).toBe(false);
  });

  it('accepts the 5-digit boundary', () => {
    expect(isValidPlate('12345')).toBe(true);
  });

  it('accepts 6, 7 and 8 digit plates', () => {
    expect(isValidPlate('123456')).toBe(true);
    expect(isValidPlate('1234567')).toBe(true);
    expect(isValidPlate('12345678')).toBe(true);
  });

  it('rejects 9 digits, one past the boundary', () => {
    expect(isValidPlate('123456789')).toBe(false);
  });

  it('validates on the stripped digit count, ignoring separators and junk', () => {
    expect(isValidPlate('12-345-6')).toBe(true); // 6 digits once stripped
    expect(isValidPlate('ab-cd')).toBe(false); // no digits at all
  });
});

describe('normalizePlate', () => {
  it('is the canonical digits-only form used for storage/query keys', () => {
    expect(normalizePlate('12-345-67')).toBe('1234567');
    expect(normalizePlate('  123 456  ')).toBe('123456');
  });
});

describe('formatPlate', () => {
  it('groups 8 digits as NNN-NN-NNN', () => {
    expect(formatPlate('12345678')).toBe('123-45-678');
  });

  it('groups 7 digits as NN-NNN-NN', () => {
    expect(formatPlate('1234567')).toBe('12-345-67');
  });

  it('groups 6 digits as NNN-NNN', () => {
    expect(formatPlate('123456')).toBe('123-456');
  });

  it('leaves other digit counts as-is (e.g. 5-digit legacy plates)', () => {
    expect(formatPlate('12345')).toBe('12345');
  });

  it('formats from a raw, separator-laden input', () => {
    expect(formatPlate('12-345-678')).toBe('123-45-678');
  });
});
