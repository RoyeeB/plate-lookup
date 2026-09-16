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
 * Hebrew manufacturer → Latin, matched by PREFIX.
 *
 * `tozeret_nm` is a fixed-width field that gets truncated ("פולקסווגן גרמנ",
 * "מרצדס בנץ גרמנ"), so the country suffix cannot be stripped reliably by
 * matching country names — but the make is always at the start.
 *
 * Longest keys are tried first, so "מרוטי סוזוקי" wins over "סוזוקי".
 */
const MAKES: Readonly<Record<string, string>> = {
  'מרוטי סוזוקי': 'Suzuki',
  'מרצדס בנץ': 'Mercedes-Benz',
  'אלפא רומיאו': 'Alfa Romeo',
  'לנד רובר': 'Land Rover',
  'סאנגיונג': 'SsangYong',
  'פולקסווגן': 'Volkswagen',
  'מיצובישי': 'Mitsubishi',
  'אינפיניטי': 'Infiniti',
  'סיטרואן': 'Citroën',
  'דייהטסו': 'Daihatsu',
  'קרייזלר': 'Chrysler',
  'שברולט': 'Chevrolet',
  'לינק אנד קו': 'Lynk & Co',
  'מיצובישי פוסו': 'Mitsubishi Fuso',
  'יונדאי': 'Hyundai',
  'סובארו': 'Subaru',
  'פורשה': 'Porsche',
  'דאצ\'יה': 'Dacia',
  'טויוטה': 'Toyota',
  'סוזוקי': 'Suzuki',
  'ניסאן': 'Nissan',
  'סקודה': 'Škoda',
  'איסוזו': 'Isuzu',
  'יגואר': 'Jaguar',
  'לקסוס': 'Lexus',
  'הונדה': 'Honda',
  'טסלה': 'Tesla',
  'וולוו': 'Volvo',
  'פיג\'ו': 'Peugeot',
  'אאודי': 'Audi',
  'מאזדה': 'Mazda',
  'מזדה': 'Mazda',
  'רנו': 'Renault',
  'פורד': 'Ford',
  'סיאט': 'SEAT',
  'אופל': 'Opel',
  'פיאט': 'Fiat',
  'מיני': 'Mini',
  'ג\'יפ': 'Jeep',
  'דודג\'': 'Dodge',
  'צ\'רי': 'Chery',
  'גילי': 'Geely',
  'זיקר': 'Zeekr',
  'אורה': 'Ora',
  'קיה': 'Kia',
  'בי ווי די': 'BYD',
  'ב מ וו': 'BMW',
  'אם ג\'י': 'MG',
  'אמ ג\'י': 'MG',
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

function latinMake(tozeretNm: string): string | null {
  const name = tozeretNm.trim();
  for (const key of MAKE_KEYS) {
    if (name.startsWith(key)) return MAKES[key];
  }
  return null;
}

/** Hebrew make with the (possibly truncated) country suffix removed. */
function hebrewMake(tozeretNm: string): string {
  const name = tozeretNm.trim();
  for (const key of MAKE_KEYS) {
    if (name.startsWith(key)) return key;
  }
  // Unknown make: drop the last word, which is nearly always the country.
  const parts = name.split(/[\s-]+/);
  return parts.length > 1 ? parts.slice(0, -1).join(' ') : name;
}

function cleanModel(kinuyMishari: string, make: string | null): string {
  let tokens = kinuyMishari.trim().split(/\s+/).filter(Boolean);

  while (tokens.length > 1 && BODY_TOKENS.has(tokens[tokens.length - 1].toUpperCase())) {
    tokens.pop();
  }
  // "MAZDA 3" with make "Mazda" → "3", so we don't build "Mazda Mazda 3".
  if (make && tokens.length > 1 && tokens[0].toUpperCase() === make.toUpperCase()) {
    tokens = tokens.slice(1);
  }
  return tokens.join(' ');
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
  /** When set, only accept an article whose title names the model. */
  requireModel?: string
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
    // A fuzzy search can drift onto the manufacturer's own article, whose lead
    // image is a factory or an unrelated car. Insist the model is named.
    if (requireModel && !fold(page.title).includes(fold(requireModel))) continue;
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
  tozeretNm: string,
  kinuyMishari: string,
  signal: AbortSignal
): Promise<VehicleImage | null> {
  const make = latinMake(tozeretNm);
  const model = cleanModel(kinuyMishari, make);
  if (!model) return null;

  if (make) {
    const exact = await wikiQuery(
      'en',
      { titles: `${make} ${model}`, redirects: '1' },
      signal
    );
    if (exact) return exact;

    const scoped = await wikiQuery(
      'en',
      {
        generator: 'search',
        gsrsearch: `intitle:"${make}" intitle:"${model.split(' ')[0]}"`,
        gsrlimit: '3',
      },
      signal,
      model.split(' ')[0]
    );
    if (scoped) return scoped;
  }

  return wikiQuery(
    'he',
    { generator: 'search', gsrsearch: `${hebrewMake(tozeretNm)} ${model}`, gsrlimit: '3' },
    signal,
    model.split(' ')[0]
  );
}
