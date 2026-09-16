/**
 * Guards the model-photo lookup against showing a photo of the wrong car.
 * Model strings are real registry values; the rejected titles are real
 * Wikipedia articles a search returns for them.
 */
import { describe, expect, it } from 'vitest';
import {
  cleanModel,
  isGenerationTitle,
  parseProductionYears,
  pickGeneration,
  titleMatchesModel,
} from '@/lib/vehicleImage';

describe('cleanModel', () => {
  it('strips the brand the registry repeats inside the model name', () => {
    expect(cleanModel('ALFA ROMEO 159', 'Alfa Romeo')).toBe('159');
    expect(cleanModel('ALFA MITO', 'Alfa Romeo')).toBe('MITO');
    expect(cleanModel('MAZDA 3', 'Mazda')).toBe('3');
  });

  it('repairs a letter O typed as a zero', () => {
    expect(cleanModel('ALFA R0ME0 159', 'Alfa Romeo')).toBe('159');
    expect(cleanModel('MIT0', 'Alfa Romeo')).toBe('MITO');
  });

  it('leaves real designations that contain a zero untouched', () => {
    expect(cleanModel('XC60 B5 FWD', 'Volvo')).toBe('XC60 B5 FWD');
    expect(cleanModel('I10', 'Hyundai')).toBe('I10');
    expect(cleanModel('CX-30', 'Mazda')).toBe('CX-30');
    expect(cleanModel('159', 'Alfa Romeo')).toBe('159');
  });

  it('drops engine sizes and body-style suffixes', () => {
    expect(cleanModel('ALFA BRERA 3,2', 'Alfa Romeo')).toBe('BRERA');
    expect(cleanModel('SPIDER 2.2', 'Alfa Romeo')).toBe('SPIDER');
    expect(cleanModel('CIVIC HB', 'Honda')).toBe('CIVIC');
  });

  it('never strips a brand word that is the whole model', () => {
    expect(cleanModel('MINI', 'Mini')).toBe('MINI');
  });
});

describe('titleMatchesModel', () => {
  it('accepts the make’s article about the model', () => {
    expect(titleMatchesModel('Alfa Romeo 159', 'Alfa Romeo', '159')).toBe(true);
    expect(titleMatchesModel('Alfa Romeo Brera and Spider', 'Alfa Romeo', 'BRERA')).toBe(true);
    expect(titleMatchesModel('Toyota Corolla (E210)', 'Toyota', 'COROLLA')).toBe(true);
    expect(titleMatchesModel('Mazda CX-5', 'Mazda', 'CX5')).toBe(true);
    expect(titleMatchesModel('Mazda3', 'Mazda', '3')).toBe(true);
    expect(titleMatchesModel('Škoda Octavia', 'Škoda', 'OCTAVIA')).toBe(true);
  });

  it('accepts a shorter article name when the rest is a numeric trim code', () => {
    expect(titleMatchesModel('Lexus IS', 'Lexus', 'IS300H')).toBe(true);
    expect(titleMatchesModel('Volvo XC60', 'Volvo', 'XC60 B5 FWD')).toBe(true);
  });

  it('rejects sibling articles that merely mention the make', () => {
    // What a 2009 Alfa Romeo 159 used to get.
    expect(titleMatchesModel('Alfa Romeo in motorsport', 'Alfa Romeo', '159')).toBe(false);
    expect(titleMatchesModel('Alfa Romeo', 'Alfa Romeo', '159')).toBe(false);
    expect(titleMatchesModel('Fiat Chrysler Automobiles', 'Alfa Romeo', '159')).toBe(false);
  });

  it('rejects a different model of the same make', () => {
    expect(titleMatchesModel('Alfa Romeo 156', 'Alfa Romeo', '159')).toBe(false);
    expect(titleMatchesModel('Alfa Romeo 1590', 'Alfa Romeo', '159')).toBe(false);
    expect(titleMatchesModel('Suzuki SX4', 'Suzuki', 'SWIFT')).toBe(false);
    expect(titleMatchesModel('Lexus ISF Racing', 'Lexus', 'RX450H')).toBe(false);
  });

  it('requires every word the article names to agree', () => {
    expect(titleMatchesModel('Tesla Model 3', 'Tesla', 'MODEL 3')).toBe(true);
    expect(titleMatchesModel('Tesla Model S', 'Tesla', 'MODEL 3')).toBe(false);
    expect(titleMatchesModel('BYD Atto 3', 'BYD', 'ATTO 3')).toBe(true);
    expect(titleMatchesModel('BYD Atto 2', 'BYD', 'ATTO 3')).toBe(false);
    // A family page doesn't stand in for a numbered model…
    expect(titleMatchesModel('BYD Atto', 'BYD', 'ATTO 3')).toBe(false);
    expect(titleMatchesModel('Tesla Model', 'Tesla', 'MODEL 3')).toBe(false);
    // …but it does when the leftover words are only trim.
    expect(titleMatchesModel('MG ZS (crossover)', 'MG', 'ZS EV')).toBe(true);
  });

  it('rejects a more specific variant the registry model does not name', () => {
    expect(titleMatchesModel('Honda Civic Type R', 'Honda', 'CIVIC')).toBe(false);
    expect(titleMatchesModel('Toyota Land Cruiser Prado', 'Toyota', 'LAND CRUISER')).toBe(false);
    expect(titleMatchesModel('Toyota Land Cruiser', 'Toyota', 'LAND CRUISER')).toBe(true);
  });

  it('works for Hebrew titles', () => {
    expect(titleMatchesModel('אלפא רומיאו 159', 'אלפא רומיאו', '159')).toBe(true);
    expect(titleMatchesModel('אלפא רומיאו', 'אלפא רומיאו', '159')).toBe(false);
  });
});

describe('parseProductionYears — real infobox shapes', () => {
  const NOW = new Date(2026, 8, 1);

  it('reads a simple range, with "present" as this year', () => {
    expect(parseProductionYears('| name = i10\n| production = 2007–present\n| body_style = hatch', NOW))
      .toEqual({ from: 2007, to: 2026 });
  });

  it('reads a multi-line list and ignores citation dates', () => {
    const wikitext = [
      '| production = {{unbulleted list',
      '  | June 2018 – present (hatchback)',
      '  | January 2019 – present (saloon/estate)<ref name="uk">{{cite news |date=16 January 2031}}</ref>',
      '}}',
      '| model_years = 2019–present',
    ].join('\n');
    expect(parseProductionYears(wikitext, NOW)).toEqual({ from: 2018, to: 2026 });
  });

  it('spans body-style variants on one line', () => {
    expect(parseProductionYears('| production = 2008–2013<br>2011–2016 (cabriolet)\n| x = y', NOW))
      .toEqual({ from: 2008, to: 2016 });
  });

  it('falls back to model years, and is null with neither', () => {
    expect(parseProductionYears('| model_years = 2009–2013', NOW)).toEqual({ from: 2009, to: 2013 });
    expect(parseProductionYears('| name = Something', NOW)).toBeNull();
  });
});

describe('isGenerationTitle', () => {
  it('recognises generation articles of this model', () => {
    expect(isGenerationTitle('Toyota Corolla (E210)', 'Toyota', 'COROLLA')).toBe(true);
    expect(isGenerationTitle('Volkswagen Golf Mk6', 'Volkswagen', 'GOLF')).toBe(true);
  });

  it('rejects the main article and other models', () => {
    expect(isGenerationTitle('Toyota Corolla', 'Toyota', 'COROLLA')).toBe(false);
    expect(isGenerationTitle('Toyota Corolla Cross (XG10)', 'Toyota', 'COROLLA')).toBe(false);
    expect(isGenerationTitle('Toyota Camry (XV70)', 'Toyota', 'COROLLA')).toBe(false);
  });
});

describe('pickGeneration', () => {
  // Real Corolla ranges, including the long regional tails that overlap.
  const generations = [
    { title: 'E120', from: 2000, to: 2017 },
    { title: 'E140', from: 2006, to: 2013 },
    { title: 'E170', from: 2013, to: 2026 },
    { title: 'E210', from: 2018, to: 2026 },
  ];

  it('picks the most recent generation in production that year', () => {
    expect(pickGeneration(generations, 2009)?.title).toBe('E140');
    expect(pickGeneration(generations, 2016)?.title).toBe('E170');
    expect(pickGeneration(generations, 2021)?.title).toBe('E210');
  });

  it('is not fooled by an old generation still built in one market', () => {
    // E120 ran in China until 2017, but a 2016 car is not an E120.
    expect(pickGeneration(generations, 2016)?.title).not.toBe('E120');
  });

  it('does not guess outside every range', () => {
    expect(pickGeneration(generations, 1999)).toBeNull();
  });
});
