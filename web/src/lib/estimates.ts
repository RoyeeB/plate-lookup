/**
 * Rough estimates for specs that are NOT in the vehicle registry: horsepower,
 * torque, curb weight, and 0-100 km/h. These are heuristic approximations
 * derived from manufacturer + commercial name + trim + year + engine
 * displacement + fuel type — never authoritative. The UI renders them in a
 * clearly-separated "נתונים משוערים" section.
 */
import { t } from '@/i18n';
import type { EstimatedSpec, VehicleRecordRaw, CkanValue } from '@/api/types';

function toNumber(value: CkanValue | undefined): number | null {
  if (value === null || value === undefined) return null;
  const n = typeof value === 'number' ? value : Number(String(value).replace(/[^\d.]/g, ''));
  return Number.isFinite(n) && n > 0 ? n : null;
}

function toText(value: CkanValue | undefined): string {
  return value === null || value === undefined ? '' : String(value);
}

type FuelKind = 'diesel' | 'electric' | 'hybrid' | 'petrol' | 'unknown';

function classifyFuel(fuelName: string): FuelKind {
  const f = fuelName.trim();
  if (/חשמל/.test(f)) return 'electric';
  if (/היבר|hybrid/i.test(f)) return 'hybrid';
  if (/דיזל|סולר/.test(f)) return 'diesel';
  if (/בנזין/.test(f)) return 'petrol';
  return 'unknown';
}

/**
 * Specific output (hp per cc) has risen over the decades thanks to turbocharging
 * and direct injection. Scale the base factor by model year.
 */
function yearFactor(year: number | null): number {
  if (year === null) return 1;
  if (year >= 2020) return 1.25;
  if (year >= 2015) return 1.15;
  if (year >= 2008) return 1.0;
  if (year >= 2000) return 0.9;
  return 0.8;
}

/** Sporty trims / commercial names nudge the estimate up a touch. */
function trimFactor(trim: string, commercialName: string): number {
  const hay = `${trim} ${commercialName}`.toLowerCase();
  if (/\b(gti|gts|gt|sport|turbo|amg|rs|st|type ?r|s[- ]?line)\b/.test(hay)) {
    return 1.15;
  }
  return 1;
}

function round5(n: number): number {
  return Math.round(n / 5) * 5;
}

/**
 * Estimate horsepower from displacement, fuel type, year and trim.
 * Returns null when there is no engine displacement to work from (e.g. EV).
 */
function estimateHorsepower(
  displacementCc: number | null,
  fuel: FuelKind,
  year: number | null,
  trim: string,
  commercialName: string
): number | null {
  if (displacementCc === null) return null;
  // Base naturally-aspirated specific output per fuel (hp per cc).
  const baseByFuel: Record<FuelKind, number> = {
    petrol: 0.072,
    hybrid: 0.078,
    diesel: 0.055,
    electric: 0,
    unknown: 0.068,
  };
  const base = baseByFuel[fuel];
  if (base === 0) return null;
  const hp = displacementCc * base * yearFactor(year) * trimFactor(trim, commercialName);
  return round5(hp);
}

/** Torque (Nm). Diesels make far more torque per hp than petrol engines. */
function estimateTorque(hp: number | null, fuel: FuelKind): number | null {
  if (hp === null) return null;
  const ratio = fuel === 'diesel' ? 2.0 : fuel === 'hybrid' ? 1.5 : 1.35;
  return round5(hp * ratio);
}

/** Curb weight (kg) bracketed by displacement, nudged for fuel type. */
function estimateCurbWeight(
  displacementCc: number | null,
  fuel: FuelKind
): number | null {
  if (displacementCc === null) return null;
  let weight: number;
  if (displacementCc < 1200) weight = 1100;
  else if (displacementCc < 1600) weight = 1280;
  else if (displacementCc < 2000) weight = 1470;
  else if (displacementCc < 3000) weight = 1720;
  else weight = 2050;
  if (fuel === 'diesel' || fuel === 'hybrid') weight += 120;
  return round5(weight);
}

/**
 * 0-100 km/h (s) from power-to-weight ratio, using CURB weight.
 *
 * Calibrated against a handful of known cars (i10 1.0, Corolla 1.6, Subaru XV,
 * BMW M850i): seconds ≈ kg-per-hp, within about a second across that range.
 */
function estimateZeroToHundred(
  hp: number | null,
  curbWeightKg: number | null
): number | null {
  if (hp === null || curbWeightKg === null) return null;
  const seconds = curbWeightKg / hp; // kg per hp ≈ seconds
  const clamped = Math.min(20, Math.max(3.5, seconds));
  return Math.round(clamped * 10) / 10;
}

/**
 * The model catalogue publishes `mishkal_kolel` — GROSS weight, i.e. fully
 * laden. Curb weight runs roughly three quarters of that across the fleet,
 * which is what the acceleration maths needs.
 */
const CURB_FRACTION_OF_GROSS = 0.75;

/**
 * Officially published figures, when the model catalogue had them. Passing
 * these in turns most of this module from a guess into arithmetic on real
 * numbers — notably 0-100, which is just power-to-weight.
 */
export interface OfficialBasis {
  /** Officially published horsepower (`koah_sus`). */
  hp?: number | null;
  /** Officially published GROSS weight (`mishkal_kolel`), in kg. */
  grossWeightKg?: number | null;
}

/**
 * Build the estimated-spec list for a record. Only specs we can actually derive
 * are included — callers hide the whole section if the array is empty.
 *
 * Anything supplied in `official` is used as-is rather than estimated, and is
 * not repeated in the output (the spec card already shows it).
 */
export function estimateSpecs(
  record: VehicleRecordRaw,
  official: OfficialBasis = {}
): EstimatedSpec[] {
  const displacement = toNumber(record.nefach_manoa);
  const year = toNumber(record.shnat_yitzur);
  const fuel = classifyFuel(toText(record.sug_delek_nm));
  const trim = toText(record.ramat_gimur);
  const commercialName = toText(record.kinuy_mishari);

  // If the dataset already carries a real power figure (motorcycle dataset has
  // `hespek`), prefer it as the horsepower basis but still present it as an
  // estimate-adjacent value in this section.
  const declaredPower = toNumber(record.hespek);
  const officialHp = official.hp ?? null;
  const hp =
    officialHp ??
    declaredPower ??
    estimateHorsepower(displacement, fuel, year, trim, commercialName);

  const officialGross = official.grossWeightKg ?? null;
  const curbWeight =
    officialGross !== null
      ? Math.round(officialGross * CURB_FRACTION_OF_GROSS)
      : estimateCurbWeight(displacement, fuel);

  // Both remaining formulas are calibrated on combustion cars and are simply
  // wrong for an EV: an electric motor makes far more torque per horsepower,
  // and its instant full torque beats what power-to-weight predicts. Showing a
  // confident-looking wrong number is worse than showing nothing, so for an EV
  // we publish neither and the section disappears.
  const isElectric = fuel === 'electric';
  const torque = isElectric ? null : estimateTorque(hp, fuel);
  const zeroTo100 = isElectric ? null : estimateZeroToHundred(hp, curbWeight);

  const specs: EstimatedSpec[] = [];
  const { approx } = t.estimates;

  // Only estimate what the official catalogue did not already give us.
  if (officialHp === null && hp !== null) {
    specs.push({ key: 'horsepower', label: t.estimates.horsepower, value: `${approx}${hp}` });
  }
  if (torque !== null) {
    specs.push({ key: 'torque', label: t.estimates.torque, value: `${approx}${torque}` });
  }
  // When the catalogue gave a real gross weight, the spec card already shows it
  // — don't restate a derived curb figure next to it.
  if (officialGross === null && curbWeight !== null) {
    specs.push({
      key: 'curbWeight',
      label: t.estimates.curbWeight,
      value: `${approx}${curbWeight}`,
    });
  }
  if (zeroTo100 !== null) {
    specs.push({
      key: 'zeroToHundred',
      label: t.estimates.zeroToHundred,
      value: `${approx}${zeroTo100}`,
    });
  }

  return specs;
}
