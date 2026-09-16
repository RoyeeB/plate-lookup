/**
 * Best-effort illustrative photo of the vehicle MODEL, from Wikipedia.
 *
 * There is no official source of vehicle photographs in Israel, and nothing on
 * data.gov.il carries images. Wikipedia is free, CORS-enabled and needs no key,
 * but it can only ever show *some* example of the model — not this car, and not
 * necessarily the right year, trim or colour. The UI must caption it as such.
 *
 * Accuracy matters more than coverage here: a photo of the wrong model is worse
 * than no photo, so anything that resolves to a brand logo or an unrelated
 * article is discarded rather than shown.
 */

/**
 * Hebrew brand → Latin, for the English Wikipedia lookup. Keyed by the clean
 * display brand from lib/manufacturer.ts (so "וולבו", not the registry's
 * "וולבו שבדיה"); brands already shown in Latin ("MG", "BYD") pass through.
 * Matched by prefix as a safety net for any brand string that still carries a
 * suffix. Longest keys are tried first, so "מרוטי סוזוקי" wins over "סוזוקי".
 */
const MAKES: Readonly<Record<string, string>> = {
  'מרוטי סוזוקי': 'Suzuki',
  'מרצדס-בנץ': 'Mercedes-Benz',
  'מרצדס בנץ': 'Mercedes-Benz',
  'אלפא רומיאו': 'Alfa Romeo',
  'אסטון מרטין': 'Aston Martin',
  'לנד רובר': 'Land Rover',
  'לינק אנד קו': 'Lynk & Co',
  'גרייט וול': 'Great Wall',
  'סאנגיונג': 'SsangYong',
  'פולקסווגן': 'Volkswagen',
  'מיצובישי': 'Mitsubishi',
  'אינפיניטי': 'Infiniti',
  'ליפמוטור': 'Leapmotor',
  'סיטרואן': 'Citroën',
  'דייהטסו': 'Daihatsu',
  'קרייזלר': 'Chrysler',
  'קאדילאק': 'Cadillac',
  'אקספנג': 'XPeng',
  'דונגפנג': 'Dongfeng',
  'שברולט': 'Chevrolet',
  'יונדאי': 'Hyundai',
  'סובארו': 'Subaru',
  'פורשה': 'Porsche',
  'מזארטי': 'Maserati',
  'ביואיק': 'Buick',
  'אומודה': 'Omoda',
  'ג\'אקו': 'Jaecoo',
  'מקסוס': 'Maxus',
  'סקיוול': 'Skywell',
  'אוואטר': 'Avatr',
  'דיפאל': 'Deepal',
  'איווייס': 'Aiways',
  'אינאוס': 'Ineos',
  'דאצ\'יה': 'Dacia',
  'לנצ\'יה': 'Lancia',
  'טויוטה': 'Toyota',
  'סוזוקי': 'Suzuki',
  'ניסאן': 'Nissan',
  'סקודה': 'Škoda',
  'איסוזו': 'Isuzu',
  'יגואר': 'Jaguar',
  'לקסוס': 'Lexus',
  'הונדה': 'Honda',
  'טסלה': 'Tesla',
  'וולבו': 'Volvo',
  'וולוו': 'Volvo',
  'בנטלי': 'Bentley',
  'פרארי': 'Ferrari',
  'לוטוס': 'Lotus',
  'קופרה': 'Cupra',
  'דייהו': 'Daewoo',
  'סאאב': 'Saab',
  'פוטון': 'Foton',
  'באייק': 'BAIC',
  'וויה': 'Voyah',
  'איון': 'Aion',
  'סרס': 'Seres',
  'פיג\'ו': 'Peugeot',
  'אאודי': 'Audi',
  'מאזדה': 'Mazda',
  'מזדה': 'Mazda',
  'ב.מ.וו': 'BMW',
  'רנו': 'Renault',
  'פורד': 'Ford',
  'סיאט': 'SEAT',
  'אופל': 'Opel',
  'פיאט': 'Fiat',
  'מיני': 'Mini',
  'ג\'יפ': 'Jeep',
  'ג\'אק': 'JAC',
  'דודג\'': 'Dodge',
  'צ\'רי': 'Chery',
  'סמארט': 'Smart',
  'האמר': 'Hummer',
  'גילי': 'Geely',
  'זיקר': 'Zeekr',
  'אורה': 'Ora',
  'קיה': 'Kia',
};

const MAKE_KEYS = Object.keys(MAKES).sort((a, b) => b.length - a.length);

/** Body-style and trim tokens that are not part of the model name. */
const BODY_TOKENS = new Set([
  'SDN', 'HB', 'SW', 'CPE', 'COUPE', 'CABRIO', 'CABR', 'VAN', 'WAGON',
  'ESTATE', 'HATCH', '4X4', '4X2', 'AT', 'MT', 'AUT', 'LTD', 'NEW',
]);

/** Files that are a brand mark rather than a photograph of a car. */
const NOT_A_CAR = /logo|emblem|wordmark|badge|marque|\.svg$/i;

export interface VehicleImage {
  /** Direct thumbnail URL. */
  url: string;
  /** Wikipedia article the photo came from — shown as the credit. */
  articleTitle: string;
  articleUrl: string;
  lang: 'en' | 'he';
}

function latinMake(brand: string): string | null {
  const name = brand.trim();
  // Already Latin ("MG", "BYD", "KGM") — that is the name to search for.
  if (/^[A-Za-z][A-Za-z0-9 &.-]*$/.test(name)) return name;
  for (const key of MAKE_KEYS) {
    if (name.startsWith(key)) return MAKES[key];
  }
  return null;
}

/**
 * The registry types model names by hand, and it shows: the letter O keyed as
 * a zero ("ALFA R0ME0", "MIT0"). Only tokens whose sole digit is 0 are touched,
 * so real designations like "XC60", "I10" or "CX-30" are left alone.
 */
function fixZeroTypos(token: string): string {
  const letters = token.replace(/[^A-Z]/gi, '').length;
  return letters >= 2 && /0/.test(token) && !/[1-9]/.test(token)
    ? token.replace(/0/g, 'O')
    : token;
}

/** Engine size tokens ("3,2", "2.2", "1.6T") — trim detail, not the model. */
const DISPLACEMENT = /^\d[.,]\d[A-Z]?$/i;

/**
 * The model as Wikipedia would title it. `kinuy_mishari` often repeats the
 * brand ("ALFA ROMEO 159", or just "ALFA MITO") — left in, the lookup searches
 * for "Alfa Romeo Alfa Romeo 159" and misses the real article.
 */
export function cleanModel(kinuyMishari: string, make: string | null): string {
  let tokens = kinuyMishari
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .map(fixZeroTypos)
    .filter((token) => !DISPLACEMENT.test(token));

  while (tokens.length > 1 && BODY_TOKENS.has(tokens[tokens.length - 1].toUpperCase())) {
    tokens.pop();
  }

  // Strip leading brand words: all of them ("ALFA ROMEO 159") or a leading
  // part ("ALFA MITO"), but never the whole model ("MINI" for a Mini).
  if (make) {
    const makeWords = fold(make).split(/[\s-]+/);
    let i = 0;
    while (i < makeWords.length && i < tokens.length - 1 && fold(tokens[i]) === makeWords[i]) i++;
    tokens = tokens.slice(i);
  }
  return tokens.join(' ');
}

function compact(value: string): string {
  return fold(value).replace(/[^a-z0-9\u0590-\u05ff]/g, '');
}

/** Two words match when equal, or when the registry adds a numeric trim code
 *  to the article's name ("IS" for "IS300H"). */
function sameModelWord(articleWord: string, modelWord: string): boolean {
  if (articleWord === modelWord) return true;
  return (
    articleWord.length >= 2 &&
    /[a-z\u0590-\u05ff]/.test(articleWord) &&
    modelWord.startsWith(articleWord) &&
    /^\d/.test(modelWord.slice(articleWord.length))
  );
}

/**
 * Whether an article title is this make's article about this model — not a
 * sibling article that merely mentions it. After the make, the article's name
 * must be the model's leading words exactly:
 *
 *  - "Alfa Romeo 159" for "159"; "Volvo XC60" for "XC60 B5 FWD" (the extra
 *    registry words are trim).
 *  - Not "Alfa Romeo in motorsport" or the bare "Alfa Romeo" page.
 *  - Not "Tesla Model S" for "MODEL 3": every word the article names must agree.
 *  - A joint article ("Alfa Romeo Brera and Spider") is fine once the whole
 *    model has matched.
 */
export function titleMatchesModel(title: string, make: string, model: string): boolean {
  const foldedTitle = fold(title).trim();
  const foldedMake = fold(make).trim();
  if (!foldedTitle.startsWith(foldedMake)) return false;

  const words = (value: string) =>
    value
      .replace(/\([^)]*\)/g, ' ') // "(E210)" generation codes
      .split(/\s+/)
      .map(compact)
      .filter(Boolean);
  const articleWords = words(foldedTitle.slice(foldedMake.length));
  const modelWords = words(model);
  if (articleWords.length === 0 || modelWords.length === 0) return false;

  let matched = 0;
  while (
    matched < articleWords.length &&
    matched < modelWords.length &&
    sameModelWord(articleWords[matched], modelWords[matched])
  ) {
    matched++;
  }
  if (matched === 0) return false;
  if (matched === articleWords.length) {
    // Leftover registry words are fine when they're trim ("B5", "FWD", "EV"),
    // but a bare number or letter is part of the name: "BYD Atto" is a family
    // page, not the "ATTO 3".
    const next = modelWords[matched];
    return next === undefined || !/^(\d{1,2}|[a-z])$/.test(next);
  }
  return matched === modelWords.length && articleWords[matched] === 'and';
}

interface WikiPage {
  title?: string;
  index?: number;
  pageimage?: string;
  thumbnail?: { source?: string };
}

/** Case- and diacritic-insensitive comparison ("Škoda" ≡ "skoda"). */
function fold(value: string): string {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase();
}

async function wikiQuery(
  lang: 'en' | 'he',
  params: Record<string, string>,
  signal: AbortSignal,
  /** Only an article this returns true for is used. */
  accept: (title: string) => boolean
): Promise<VehicleImage | null> {
  const search = new URLSearchParams({
    action: 'query',
    format: 'json',
    origin: '*',
    prop: 'pageimages',
    piprop: 'thumbnail|name',
    pithumbsize: '640',
    ...params,
  });

  const response = await fetch(`https://${lang}.wikipedia.org/w/api.php?${search}`, { signal });
  if (!response.ok) return null;

  const json = (await response.json()) as { query?: { pages?: Record<string, WikiPage> } };
  const pages = json.query?.pages;
  if (!pages) return null;

  // A search generator returns pages keyed by id in arbitrary order; `index`
  // carries the ranking, so sort by it rather than trusting object order.
  const ranked = Object.entries(pages)
    .filter(([id]) => id !== '-1')
    .map(([, page]) => page)
    .sort((a, b) => (a.index ?? 0) - (b.index ?? 0));

  for (const page of ranked) {
    const url = page.thumbnail?.source;
    const file = page.pageimage ?? '';
    if (!url || NOT_A_CAR.test(file) || !page.title) continue;
    // A search — or even a redirect — can land on the manufacturer's page or a
    // sibling article ("Alfa Romeo in motorsport" for a 159) whose lead image
    // is some other car. Every strategy has to prove the title is the model.
    if (!accept(page.title)) continue;
    return {
      url,
      articleTitle: page.title,
      articleUrl: `https://${lang}.wikipedia.org/wiki/${encodeURIComponent(page.title)}`,
      lang,
    };
  }
  return null;
}

/**
 * Resolve a model photo. Tries the most precise strategy first and stops at the
 * first result that actually looks like a car:
 *
 *  1. Exact English article title (follows redirects — "Mazda 3" → "Mazda3").
 *  2. English title-scoped search, which keeps both make and model in the title
 *     and so cannot drift to an unrelated model.
 *  3. Hebrew free search, for makes with no Latin mapping.
 */
export async function fetchVehicleImage(
  /** The clean brand from lib/manufacturer.ts, not the raw `tozeret_nm`. */
  brand: string,
  kinuyMishari: string,
  signal: AbortSignal
): Promise<VehicleImage | null> {
  const make = latinMake(brand);
  const model = cleanModel(kinuyMishari, make);
  if (!model) return null;

  if (make) {
    const isModel = (title: string) => titleMatchesModel(title, make, model);

    const exact = await wikiQuery(
      'en',
      { titles: `${make} ${model}`, redirects: '1' },
      signal,
      isModel
    );
    if (exact) return exact;

    const scoped = await wikiQuery(
      'en',
      {
        generator: 'search',
        gsrsearch: `intitle:"${make}" intitle:"${model.split(' ')[0]}"`,
        gsrlimit: '5',
      },
      signal,
      isModel
    );
    if (scoped) return scoped;

    // "IS300H" never appears in a title; the article is "Lexus IS".
    const family = model.split(' ')[0].match(/^([A-Za-z]{2,3})\d/)?.[1];
    if (family) {
      const byFamily = await wikiQuery(
        'en',
        { generator: 'search', gsrsearch: `intitle:"${make}" intitle:"${family}"`, gsrlimit: '5' },
        signal,
        isModel
      );
      if (byFamily) return byFamily;
    }
  }

  const hebrewMake = brand.trim();
  // Model words are usually Latin even in Hebrew titles, so strip a Latin make
  // from the model here too, if there is one.
  const hebrewModel = make ? model : cleanModel(kinuyMishari, null);
  return wikiQuery(
    'he',
    { generator: 'search', gsrsearch: `${hebrewMake} ${hebrewModel}`, gsrlimit: '3' },
    signal,
    (title) => titleMatchesModel(title, hebrewMake, hebrewModel)
  );
}
