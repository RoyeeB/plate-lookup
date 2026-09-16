/**
 * Maps the enrichment records (model catalogue, price list, history) into the
 * ordered label/value rows and feature chips the result screen renders.
 *
 * Same rule as the main mapper: an empty field is dropped, never rendered as a
 * blank row. Coverage across these datasets is patchy, so most cars will show a
 * subset of what is defined here.
 */
import { t } from '@/i18n';
import type {
  CkanValue,
  HistoryRaw,
  ModelSpecRaw,
  OwnershipRaw,
  PriceRaw,
} from './types';
import type { MappedField } from './mapper';
import { displayImporter } from '@/lib/manufacturer';

function isEmpty(value: CkanValue | undefined): boolean {
  if (value === null || value === undefined) return true;
  const s = String(value).trim();
  return s === '' || s === '0' || s.toLowerCase() === 'null' || s === 'לא ידוע קוד';
}

function num(value: CkanValue | undefined): number | null {
  if (isEmpty(value)) return null;
  const n = Number(String(value).replace(/[^\d.-]/g, ''));
  return Number.isFinite(n) && n > 0 ? n : null;
}

function text(value: CkanValue | undefined): string | null {
  return isEmpty(value) ? null : String(value).trim();
}

/** Thousands separators, Hebrew locale. */
function formatInt(n: number): string {
  return new Intl.NumberFormat('he-IL', { maximumFractionDigits: 0 }).format(n);
}

export function formatCurrency(n: number): string {
  return new Intl.NumberFormat('he-IL', {
    style: 'currency',
    currency: 'ILS',
    maximumFractionDigits: 0,
  }).format(n);
}

/** Format an ISO-ish date value (YYYY-MM-DD[...]) as DD/MM/YYYY when possible. */
function formatDate(value: CkanValue): string {
  const s = String(value).trim();
  const match = s.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (match) {
    const [, y, m, d] = match;
    return `${d}/${m}/${y}`;
  }
  return s;
}

function row(key: string, label: string, value: string | null): MappedField | null {
  return value === null ? null : { key, label, value, copyable: false };
}

function compact(fields: Array<MappedField | null>): MappedField[] {
  return fields.filter((f): f is MappedField => f !== null);
}

/* ------------------------------------------------------------------ *
 * Model specification
 * ------------------------------------------------------------------ */

export function mapModelSpec(spec: ModelSpecRaw | null): MappedField[] {
  if (!spec) return [];

  const hp = num(spec.koah_sus);
  const displacement = num(spec.nefah_manoa);
  const weight = num(spec.mishkal_kolel);
  const towing = num(spec.kosher_grira_im_blamim);
  const airbags = num(spec.mispar_kariot_avir);
  const safetyScore = num(spec.nikud_betihut);
  const safetyLevel = num(spec.ramat_eivzur_betihuty);
  const co2 = num(spec.CO2_WLTP);
  const green = num(spec.madad_yarok);

  // `automatic_ind` is a real 0/1 flag, so "0" is meaningful here and the
  // generic isEmpty() check would wrongly discard it.
  const gearbox =
    spec.automatic_ind === null || spec.automatic_ind === undefined
      ? null
      : String(spec.automatic_ind) === '1'
        ? t.spec.automatic
        : t.spec.manual;

  return compact([
    row('koah_sus', t.spec.horsepower, hp === null ? null : formatInt(hp)),
    row('nefah_manoa', t.spec.displacement, displacement === null ? null : formatInt(displacement)),
    row('gearbox', t.spec.gearbox, gearbox),
    row('hanaa_nm', t.spec.drivetrain, text(spec.hanaa_nm)),
    row('merkav', t.spec.body, text(spec.merkav)),
    row('mispar_dlatot', t.spec.doors, num(spec.mispar_dlatot)?.toString() ?? null),
    row('mispar_moshavim', t.spec.seats, num(spec.mispar_moshavim)?.toString() ?? null),
    row('mishkal_kolel', t.spec.grossWeight, weight === null ? null : formatInt(weight)),
    row('technologiat_hanaa_nm', t.spec.propulsion, text(spec.technologiat_hanaa_nm)),
    row('kosher_grira', t.spec.towing, towing === null ? null : formatInt(towing)),
    row('mispar_kariot_avir', t.spec.airbags, airbags?.toString() ?? null),
    row('nikud_betihut', t.spec.safetyScore, safetyScore?.toString() ?? null),
    row('ramat_eivzur', t.spec.safetyLevel, safetyLevel?.toString() ?? null),
    row('co2', t.spec.co2, co2 === null ? null : formatInt(co2)),
    row('madad_yarok', t.spec.greenIndex, green === null ? null : formatInt(green)),
    row('sug_tkina_nm', t.spec.standard, text(spec.sug_tkina_nm)),
  ]);
}

/**
 * Officially published power and gross weight, when the catalogue has them.
 * These let the estimate layer work from real numbers instead of guessing from
 * displacement.
 */
export function officialPowerAndWeight(spec: ModelSpecRaw | null): {
  hp: number | null;
  grossWeightKg: number | null;
} {
  if (!spec) return { hp: null, grossWeightKg: null };
  return { hp: num(spec.koah_sus), grossWeightKg: num(spec.mishkal_kolel) };
}

/* ------------------------------------------------------------------ *
 * Equipment / safety feature chips
 * ------------------------------------------------------------------ */

/** The 0/1 equipment columns worth surfacing, with Hebrew labels. */
const FEATURE_FLAGS: ReadonlyArray<{ key: string; label: string }> = [
  { key: 'abs_ind', label: 'ABS' },
  { key: 'bakarat_yatzivut_ind', label: 'בקרת יציבות' },
  { key: 'mazgan_ind', label: 'מיזוג אוויר' },
  { key: 'hege_koah_ind', label: 'הגה כוח' },
  { key: 'maarechet_ezer_labalam_ind', label: 'מערכת עזר לבלימה' },
  { key: 'bakarat_stiya_menativ_ind', label: 'בקרת סטייה מנתיב' },
  { key: 'nitur_merhak_milfanim_ind', label: 'ניטור מרחק מלפנים' },
  { key: 'zihuy_beshetah_nistar_ind', label: 'זיהוי בשטח מת' },
  { key: 'bakarat_shyut_adaptivit_ind', label: 'בקרת שיוט אדפטיבית' },
  { key: 'zihuy_holchey_regel_ind', label: 'זיהוי הולכי רגל' },
  { key: 'matzlemat_reverse_ind', label: 'מצלמת רוורס' },
  { key: 'blima_otomatit_nesia_leahor', label: 'בלימה אוטומטית ברוורס' },
  { key: 'blimat_hirum_lifnei_holhei_regel_ofanaim', label: 'בלימת חירום להולכי רגל' },
  { key: 'zihuy_tamrurey_tnua_ind', label: 'זיהוי תמרורים' },
  { key: 'zihuy_rechev_do_galgali', label: 'זיהוי דו-גלגלי' },
  { key: 'shlita_automatit_beorot_gvohim_ind', label: 'אור גבוה אוטומטי' },
  { key: 'teura_automatit_benesiya_kadima_ind', label: 'תאורה אוטומטית' },
  { key: 'hayshaney_lahatz_avir_batzmigim_ind', label: 'חיישני לחץ אוויר' },
  { key: 'hayshaney_hagorot_ind', label: 'חיישני חגורות' },
  { key: 'zihuy_matzav_hitkarvut_mesukenet_ind', label: 'זיהוי התקרבות מסוכנת' },
  { key: 'bakarat_mehirut_isa', label: 'בקרת מהירות חכמה (ISA)' },
  { key: 'galgaley_sagsoget_kala_ind', label: 'סגסוגת קלה' },
  { key: 'halon_bagg_ind', label: 'חלון בגג' },
  { key: 'alco_lock', label: 'נעילת אלכוהול' },
];

export interface Feature {
  key: string;
  label: string;
}

/** Only the equipment actually present (flag === 1). */
export function mapFeatures(spec: ModelSpecRaw | null): Feature[] {
  if (!spec) return [];
  return FEATURE_FLAGS.filter(({ key }) => String(spec[key] ?? '') === '1').map(
    ({ key, label }) => ({ key, label })
  );
}

/* ------------------------------------------------------------------ *
 * Price
 * ------------------------------------------------------------------ */

export interface PriceInfo {
  /** The (lowest) figure in shekels, for the count-up animation. */
  value: number;
  /** The same figure, formatted as currency. */
  amount: string;
  /** Highest figure when the model's trims were listed at different prices. */
  maxValue: number | null;
  maxAmount: string | null;
  /** Only when every matching row names the same importer. */
  importer: string | null;
  year: string | null;
}

/**
 * Summarise the price-list rows for one model. Several rows with different
 * prices are shown as a range — picking one of them would present an arbitrary
 * trim's price as this car's. Likewise the importer is shown only when the rows
 * agree on it.
 */
export function mapPrice(rows: PriceRaw[]): PriceInfo | null {
  const priced = rows
    .map((row) => ({ row, amount: num(row.mehir) }))
    .filter((entry): entry is { row: PriceRaw; amount: number } => entry.amount !== null);
  if (priced.length === 0) return null;

  const amounts = priced.map((entry) => entry.amount);
  const min = Math.min(...amounts);
  const max = Math.max(...amounts);

  const importers = new Set(
    priced
      .map((entry) => text(entry.row.shem_yevuan))
      .filter((name): name is string => name !== null)
      .map((name) => displayImporter(name))
  );

  return {
    value: min,
    amount: formatCurrency(min),
    maxValue: max > min ? max : null,
    maxAmount: max > min ? formatCurrency(max) : null,
    importer: importers.size === 1 ? [...importers][0] : null,
    year: text(priced[0].row.shnat_yitzur),
  };
}

/* ------------------------------------------------------------------ *
 * History
 * ------------------------------------------------------------------ */

/** A 0/1 column where "no" is still worth showing (an unmodified car is good
 *  news to a buyer), unlike the generic empty-field rule. */
function flagRow(key: string, label: string, value: CkanValue | undefined): MappedField | null {
  if (value === null || value === undefined || String(value).trim() === '') return null;
  const on = String(value) === '1';
  return { key, label, value: on ? t.history.yes : t.history.no, copyable: false };
}

export function mapHistory(history: HistoryRaw | null): MappedField[] {
  if (!history) return [];

  const km = num(history.kilometer_test_aharon);
  const firstReg = history.rishum_rishon_dt;

  return compact([
    row(
      'kilometer',
      t.history.odometer,
      km === null ? null : `${formatInt(km)} ${t.history.km}`
    ),
    row(
      'rishum_rishon',
      t.history.firstRegistration,
      isEmpty(firstReg) ? null : formatDate(firstReg as CkanValue)
    ),
    row('mkoriut', t.history.origin, text(history.mkoriut_nm)),
    flagRow('shinui_mivne', t.history.structuralChange, history.shinui_mivne_ind),
    flagRow('shnui_zeva', t.history.colorChange, history.shnui_zeva_ind),
    flagRow('shinui_zmig', t.history.tireChange, history.shinui_zmig_ind),
  ]);
}

/* ------------------------------------------------------------------ *
 * Ownership chain — "יד ראשונה / שנייה / שלישית"
 * ------------------------------------------------------------------ */

/** The transfer log begins here; anything earlier simply is not recorded. */
const OWNERSHIP_LOG_START_YEAR = 2017;

/** Israeli convention: a dealer holding a car between two owners is not a "hand". */
const DEALER = 'סוחר';

export interface OwnershipLink {
  key: string;
  /** MM/YYYY. */
  date: string;
  type: string;
  isDealer: boolean;
}

export interface OwnershipInfo {
  /** Non-dealer owners counted in the log. */
  owners: number;
  /** e.g. "יד שלישית", or "יד 12" past the ordinal list. */
  handLabel: string;
  /** True when the car predates the log, so `owners` is a floor. */
  isMinimum: boolean;
  dealerTransfers: number;
  chain: OwnershipLink[];
}

/** YYYYMM → MM/YYYY. */
function formatMonth(value: CkanValue | undefined): string | null {
  const s = String(value ?? '').trim();
  const m = s.match(/^(\d{4})(\d{2})$/);
  return m ? `${m[2]}/${m[1]}` : null;
}

function ordinal(n: number): string {
  const word = t.ownership.ordinals[n - 1];
  return word ? `${t.ownership.hand} ${word}` : `${t.ownership.hand} ${n}`;
}

/**
 * Summarise the transfer log into a hand number.
 *
 * `firstRoadYear` is the year the vehicle went on the road. When that is before
 * the log's start, earlier owners exist but are unrecorded, so the count is
 * reported as a minimum rather than as fact. No rows at all means unknown — an
 * empty log is NOT evidence of a single owner.
 */
export function summarizeOwnership(
  rows: OwnershipRaw[],
  firstRoadYear: number | null
): OwnershipInfo | null {
  if (rows.length === 0) return null;

  const chain: OwnershipLink[] = rows
    .map((row, index) => {
      const date = formatMonth(row.baalut_dt);
      const type = text(row.baalut);
      if (date === null || type === null) return null;
      return { key: `${row.baalut_dt}-${index}`, date, type, isDealer: type === DEALER };
    })
    .filter((link): link is OwnershipLink => link !== null);

  if (chain.length === 0) return null;

  const owners = chain.filter((link) => !link.isDealer).length;
  if (owners === 0) return null;

  const isMinimum = firstRoadYear !== null && firstRoadYear < OWNERSHIP_LOG_START_YEAR;

  return {
    owners,
    handLabel: ordinal(owners),
    isMinimum,
    dealerTransfers: chain.length - owners,
    chain,
  };
}

/**
 * The year the vehicle first went on the road, from whichever source has it.
 * `moed_aliya_lakvish` arrives as "2016-9"; history has a full ISO date.
 */
export function firstRoadYear(
  record: { moed_aliya_lakvish?: CkanValue; shnat_yitzur?: CkanValue },
  history: HistoryRaw | null
): number | null {
  const fromHistory = String(history?.rishum_rishon_dt ?? '').match(/^(\d{4})/);
  if (fromHistory) return Number(fromHistory[1]);
  const fromRoad = String(record.moed_aliya_lakvish ?? '').match(/^(\d{4})/);
  if (fromRoad) return Number(fromRoad[1]);
  return num(record.shnat_yitzur);
}
