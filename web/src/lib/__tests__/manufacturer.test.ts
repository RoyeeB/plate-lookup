/**
 * Protects how manufacturer and importer names are shown. The registry's
 * `tozeret_nm` is brand + country, truncated; these cases are real values
 * from data.gov.il, so a regression here means a real car is mislabelled.
 */
import { describe, expect, it } from 'vitest';
import {
  displayBrand,
  displayImporter,
  resolveManufacturer,
  splitRegistryName,
} from '@/lib/manufacturer';

describe('resolveManufacturer — from the Ministry catalogue', () => {
  it('splits brand and country by code', () => {
    expect(resolveManufacturer({ tozeret_cd: 845, tozeret_nm: 'יונדאי טורקיה' })).toEqual({
      brand: 'יונדאי',
      country: 'טורקיה',
    });
  });

  it('recovers truncated countries', () => {
    expect(resolveManufacturer({ tozeret_cd: 724, tozeret_nm: 'פולקסווגן גרמנ' })).toEqual({
      brand: 'פולקסווגן',
      country: 'גרמניה',
    });
    expect(resolveManufacturer({ tozeret_cd: 751, tozeret_nm: 'שברולט ד.קוריא' })?.country).toBe(
      'דרום קוריאה'
    );
  });

  it('unifies the Ministry’s own spelling variants of one brand', () => {
    expect(resolveManufacturer({ tozeret_cd: 593, tozeret_nm: 'מרצדס בנץ גרמנ' })?.brand).toBe('מרצדס-בנץ');
    expect(resolveManufacturer({ tozeret_cd: 283, tozeret_nm: 'אודי מקסיקו' })?.brand).toBe('אאודי');
    expect(resolveManufacturer({ tozeret_cd: 143, tozeret_nm: 'ב מ וו גרמניה' })?.brand).toBe('ב.מ.וו');
  });

  it('uses the Latin initialism brands are sold under', () => {
    expect(resolveManufacturer({ tozeret_cd: 443, tozeret_nm: 'מ.ג סין' })?.brand).toBe('MG');
    expect(resolveManufacturer({ tozeret_cd: 1014, tozeret_nm: 'בי ווי די' })).toEqual({
      brand: 'BYD',
      country: 'סין',
    });
  });

  it('normalises country spellings', () => {
    expect(resolveManufacturer({ tozeret_cd: 961, tozeret_nm: 'שברולט ארהב"' })?.country).toBe('ארה"ב');
    expect(resolveManufacturer({ tozeret_cd: 637, tozeret_nm: 'ניסאן אנגליה' })?.country).toBe('בריטניה');
  });

  it('finds a known registry name even without its code', () => {
    expect(resolveManufacturer({ tozeret_nm: 'אלפא רומיאו_אי' })).toEqual({
      brand: 'אלפא רומיאו',
      country: 'איטליה',
    });
  });

  it('is null for an empty name', () => {
    expect(resolveManufacturer({ tozeret_nm: '' })).toBeNull();
    expect(resolveManufacturer({ tozeret_nm: 'null' })).toBeNull();
  });
});

describe('splitRegistryName — codes the catalogue lacks', () => {
  it('peels a country off after a space, hyphen, underscore or final dot', () => {
    expect(splitRegistryName('קוואסאקי תאילנ')).toEqual({ brand: 'קוואסאקי', country: 'תאילנד' });
    expect(splitRegistryName('קגיבה-איטליה')).toEqual({ brand: 'קגיבה', country: 'איטליה' });
    expect(splitRegistryName('לונגג\'יה_סין')).toEqual({ brand: "לונגג'יה", country: 'סין' });
    expect(splitRegistryName('סי.אף.מוטו.סין')).toEqual({ brand: 'סי.אף.מוטו', country: 'סין' });
  });

  it('handles two-word country tails', () => {
    expect(splitRegistryName('יוסנג ד.קוריאה')).toEqual({ brand: 'יוסנג', country: 'דרום קוריאה' });
  });

  it('drops an ambiguous truncated country instead of guessing it', () => {
    // "סלוב" could be Slovakia or Slovenia.
    expect(splitRegistryName('פולקסווגן סלוב')).toEqual({ brand: 'פולקסווגן', country: null });
  });

  it('leaves a name with no recognisable country whole', () => {
    expect(splitRegistryName('הארלי דיוידסון')).toEqual({ brand: 'הארלי דיוידסון', country: null });
    // A short word is never taken for a truncated country.
    expect(splitRegistryName('סי אר אר סי')).toEqual({ brand: 'סי אר אר סי', country: null });
  });

  it('prefers a dataset’s own country column when present', () => {
    expect(
      resolveManufacturer({ tozeret_nm: 'אס ווי אם וויא', tozeret_eretz_nm: 'וייטנאם' })
    ).toEqual({ brand: 'אס ווי אם וויא', country: 'וייטנאם' });
  });
});

describe('displayBrand', () => {
  it('cleans a raw registry name stored by an older recent-searches entry', () => {
    expect(displayBrand('יונדאי טורקיה')).toBe('יונדאי');
  });

  it('leaves an already-clean brand alone', () => {
    expect(displayBrand('יונדאי')).toBe('יונדאי');
    expect(displayBrand('מרוטי סוזוקי')).toBe('מרוטי סוזוקי');
  });
});

describe('displayImporter', () => {
  const NOW = new Date(2026, 8, 1);

  it('drops the legal suffix, including its truncated forms', () => {
    expect(displayImporter('יוניון מוטורס בע"מ', NOW)).toBe('יוניון מוטורס');
    expect(displayImporter('מאיר חברה למכוניות ומשאיות בע"', NOW)).toBe('מאיר חברה למכוניות ומשאיות');
    expect(displayImporter('ק.מ.י - קוריאה מוטורס ישראל בע', NOW)).toBe('ק.מ.י - קוריאה מוטורס ישראל');
  });

  it('restores years and parentheses stored in visual order', () => {
    expect(displayImporter('מאי מוטורס )5102( בע"מ', NOW)).toBe('מאי מוטורס (2015)');
    expect(displayImporter('מכשירי תנועה ומכוניות 4002 בעמ', NOW)).toBe('מכשירי תנועה ומכוניות 2004');
    expect(displayImporter('אוטוארט)אי.אל(בע"מ', NOW)).toBe('אוטוארט (אי.אל)');
  });

  it('leaves a number alone when reversing it would not give a past year', () => {
    expect(displayImporter('קבוצת שיווק 8402 בע"מ', NOW)).toBe('קבוצת שיווק 8402');
    expect(displayImporter('קומפוננט ח. )1991( בע"מ', NOW)).toBe('קומפוננט ח. (1991)');
  });

  it('does not strip letters that merely end a word', () => {
    expect(displayImporter('מוטורס ארבע', NOW)).toBe('מוטורס ארבע');
  });

  it('collapses doubled spaces', () => {
    expect(displayImporter("צ'מפיון  קאר ש.מ", NOW)).toBe("צ'מפיון קאר ש.מ");
  });
});
