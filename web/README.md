# איתור לוחית — Web

Web port of the Plate Lookup app. Same product, same Hebrew RTL design, same
data source — but it runs in a browser, so there is no native build, no Xcode,
and no app store.

Look up an Israeli vehicle by its plate number against the Ministry of
Transport's public registry on **data.gov.il**, or point your phone camera at a
plate and let on-device OCR read the digits.

## Run it

```bash
npm install
npm run dev        # http://localhost:5173
```

```bash
npm run build      # type-check + production bundle into dist/
npm run preview    # serve the production build locally
npm run lint       # tsc --noEmit
npm test           # vitest run — unit tests for the pure logic
npm run test:watch # vitest in watch mode
```

`dist/` is plain static files — deploy it to Netlify, Vercel, Cloudflare Pages,
GitHub Pages, or any static host. The app talks to data.gov.il directly from the
browser (their API sends `Access-Control-Allow-Origin: *`), so **no backend and
no proxy are required**.

Deep links like `/vehicle/8491639` need the host to rewrite unknown paths to
`index.html`; `public/_redirects` (Netlify/Cloudflare) and `vercel.json` are
already in the repo.

## Install it (PWA)

The build is an installable PWA: `public/manifest.webmanifest` plus a hand-
written service worker in `public/sw.js`. On a phone that means "add to home
screen" gives a standalone, address-bar-free app — which is how this thing is
actually used, standing next to a car.

What the service worker does, and deliberately does not do:

- **Precaches the app shell** (`/`, `/index.html`, the manifest and icons) so
  the app opens with no connection. Deep links work offline too: navigations
  fall back to the cached `/` shell and client-side routing takes over.
- **Never caches data.gov.il or Wikipedia.** The whole point of the app is live
  registry data; a stale cached answer would be worse than an error. Any
  cross-origin request goes straight to the network.
- **Stale-while-revalidate for `/assets/*`**, the content-hashed build output,
  so repeat visits are instant but a new deploy is still picked up.

> **Bump `CACHE_VERSION` in `public/sw.js` when you change the app shell.**
> Nothing does it automatically. Navigations are network-first so online users
> always get fresh HTML, but the precached offline shell only refreshes when the
> service worker itself changes.

Icons are generated, not hand-drawn: `node scripts/make-icons.mjs` writes the
PNGs in `public/icons/` (plus `apple-touch-icon.png`) using only `node:zlib` —
a small hand-rolled PNG encoder, no image dependency.

## Dark mode

Follows the OS via `prefers-color-scheme`. Every colour is a custom property in
`src/styles/theme.css`, and the dark block repoints the surface / text / border
/ state tokens. The **plate motif is deliberately excluded**: the yellow field,
black border and blue strip are the brand and stay identical in both themes.

## Camera scanning

The scan screen needs a **secure context** — `https://` or `localhost`. Opening
the dev server over a LAN IP (`http://192.168.x.x:5173`) will show an explicit
"needs HTTPS" state rather than failing silently, because browsers refuse
`getUserMedia` there. To test scanning on a real phone, either tunnel the dev
server over HTTPS or deploy the build.

OCR runs entirely in the browser via **tesseract.js** in a Web Worker. The frame
never leaves the device. The pipeline, per shutter press:

1. Capture **three frames ~150 ms apart**, cropped to the on-screen guide
   rectangle and upscaled.
2. Grayscale contrast stretch — black-on-yellow is a weak luminance contrast.
   If a frame yields nothing, retry it **inverted and binarised**, which gives
   Tesseract the light-on-dark shape it handles best.
3. Character-confusion corrections, then the longest 5-8 digit run per frame.
4. **Majority vote across the frames** (`pickConsensus`), so one blurred frame
   can no longer decide the answer. Ties go to the earliest frame, captured
   before hand shake builds up.

A **torch toggle** appears when the camera reports the capability — low light is
the single biggest cause of failed captures. It is hidden, not disabled, where
unsupported (iOS Safari), and is switched off when the screen closes.

Expect browser OCR to be less accurate than the native ML Kit build. The flow
never auto-searches: a detection always lands in an editable confirm sheet.

## The result screen leads with what you must act on

Registry fields are data; two things on that page are decisions:

- **Licence validity (טסט)** — `src/lib/licenseStatus.ts` reads `tokef_dt` and
  promotes it into a banner: expired (alert), expiring within 45 days (warning),
  or valid, each with a day countdown. A licence expiring *today* counts as
  valid, not expired. A missing date renders nothing rather than implying "fine".
- **Open safety recalls** — as before, above the specs.

The page can also be **shared**: the native share sheet on a phone, copy-link
everywhere else. Every lookup already had its own URL; now there is a way to
hand it to someone.

Search history shows **what the car is**, not just its digits — the make, model
and year are written back to the entry once the lookup resolves (including when
you arrive from a shared link, which never passes through the home screen).

## What came over from the native app

Ported unchanged (pure TypeScript, no React Native):

| Module | Purpose |
| --- | --- |
| `src/api/client.ts` | CKAN datastore client, dataset fallback chain, timeouts |
| `src/api/datasets.ts` | The four registry resources queried in order |
| `src/api/mapper.ts` | Registry fields → ordered Hebrew label/value rows |
| `src/api/types.ts` | CKAN response types |
| `src/lib/plate.ts` | Plate validation, normalization, `NN-NNN-NN` formatting |
| `src/lib/estimates.ts` | Heuristic torque / weight / 0-100 estimates |
| `src/lib/ocr.ts` | Digit extraction, confusion fixes, multi-frame consensus |
| `src/i18n/` | Hebrew string table |

Rewritten for the web:

| Native | Web |
| --- | --- |
| `AsyncStorage` | `localStorage` (`src/lib/recentSearches.ts`) |
| `expo-camera` | `getUserMedia` (`src/hooks/useCamera.ts`) |
| `@react-native-ml-kit/text-recognition` | `tesseract.js` (`src/lib/webOcr.ts`) |
| `expo-router` | `react-router-dom` |
| `expo-clipboard` | `navigator.clipboard` / `navigator.share` |
| `expo-network` | `navigator.onLine` + online/offline events |
| `@expo/vector-icons` | Inline SVG (`src/components/Icon.tsx`) |
| `StyleSheet` + `I18nManager.forceRTL` | CSS + `<html dir="rtl">` |
| `src/theme/index.ts` tokens | `src/styles/theme.css` custom properties |

React Query, the Hebrew copy, the plate-styled input and badge, the estimates
disclaimer, and the not-found / offline / error states all behave as before. A
render error is caught by an `ErrorBoundary` and shown as a screen with a reload
action, rather than unmounting the app to a blank page.

## Tests

```bash
npm test    # 7 files, ~70 tests, no browser required
```

The suite (`vitest`, `environment: 'node'`) covers the pure logic, concentrating
on the rules that would mislead a user if they broke:

- **Ownership honesty** — a dealer is shown but not counted as a hand; a car on
  the road before 2017 reports a *minimum*; an empty transfer log is "unknown",
  never "first owner".
- **Licence boundaries** — expiring today is `soon`, not `expired`; 45 days is
  `soon`, 46 is `valid`; a garbage date returns null.
- **Estimates** — official figures are used rather than estimated and not
  repeated; an electric car produces no torque or 0-100 figure at all.
- Plate validity and grouping, the recent-search store (cap, de-dup, v1→v2
  migration, a throwing localStorage), field mapping, and the OCR consensus vote.

## Privacy

Only the plate number is ever sent, and only to data.gov.il. Owner
personal-information fields are not modelled, read, displayed, or stored.
Search history is the last 10 lookups in `localStorage` — plate number plus the
make, model and year, which are vehicle attributes, not owner data — and is
clearable from the home screen. Camera frames stay in the page.

## Lookup: exact match first

CKAN offers two ways to match a column. `filters` is an exact match on an
indexed column; `q` is a fuzzy full-text search that can match a record merely
*containing* the digits. The lookup tries `filters` first (leading zeros
dropped, since the registry stores the plate numerically) and falls back to `q`
only if that finds nothing — the enrichment joins already worked this way.

## Enrichment: where the extra detail comes from

The main registry record is thin — no engine power, no price, no odometer. Once
a plate is found, `src/api/enrich.ts` joins four more data.gov.il resources onto
it, concurrently and best-effort. A failed join never fails the page.

| Resource | Joined on | Gives |
| --- | --- | --- |
| `142afde2…` תוצרים ודגמים WLTP | `tozeret_cd` + `degem_cd` + `shnat_yitzur` | **Horsepower** (`koah_sus`), displacement, gross weight, body style, doors, seats, gearbox, drivetrain, towing capacity, airbags, safety score, CO₂, green index, ~24 driver-assist flags |
| `39f455bf…` יבואנים ומחירוני רכב חדש | same model key | **List price when new** (`mehir`) + importer |
| `56063a99…` / `bb2355dc…` היסטוריית כלי רכב | `mispar_rechev` | **Odometer at last test**, first registration, prior use (leasing/rental), structural / colour / tyre change flags |
| `36bf1404…` רכבים שלא ביצעו ריקול | `MISPAR_RECHEV` (uppercase!) | **Outstanding safety recalls** with description and open date |
| `bb2355dc…` היסטוריית כלי רכב | `mispar_rechev` | **Ownership transfers** — one row per change of hands, with month and owner type |

Model-keyed lookups try the exact production year first, then fall back to the
same model in any year — registry year and catalogue year sometimes differ by
one. Coverage is uneven: the history file covers roughly two thirds of the
fleet, and the WLTP catalogue thins out for older cars. Missing rows are simply
not rendered.

**A failed join is not the same as an empty one.** A 5xx or a malformed response
used to be swallowed and rendered identically to "this car has no history".
Failures are now recorded per join, and the page says so with a retry, so a
server error can't masquerade as an absence of data.

### Estimates vs. official figures

`src/lib/estimates.ts` receives the officially published horsepower and gross
weight when the catalogue has them, so it only estimates what nobody publishes:
torque, and 0-100 km/h.

`mishkal_kolel` is **gross** (fully laden) weight, so it is scaled by 0.75 to
approximate curb weight before the acceleration maths. Calibrated against four
known cars:

| Car | Estimated 0-100 | Real |
| --- | --- | --- |
| Hyundai i10 1.0 (2016) | ~16.4 s | 14.7 s |
| Toyota Corolla 1.6 (2019) | ~10.4 s | 10.5 s |
| Subaru XV 2.0 (2018) | ~9.3 s | 10.4 s |
| BMW M850i xDrive (2022) | ~3.7 s | 3.7 s |

When the catalogue has no entry at all, the old displacement-based heuristic
still runs as a fallback.

**Electric cars get no torque or 0-100 estimate.** Both formulas are calibrated
on combustion engines — an electric motor makes far more torque per horsepower,
and its instant full torque beats what power-to-weight predicts. The estimates
section simply disappears for an EV rather than printing a confident wrong
number.

### Ownership — "יד ראשונה / שנייה"

Derived in `summarizeOwnership()` from the transfer log, with two rules that
matter for not misleading a buyer:

- **Dealers are shown but not counted.** A `סוחר` row between two owners is a
  flip, not a hand — matching Israeli convention.
- **The log only starts January 2017.** For a car that went on the road before
  then the number is a floor, labelled `לפחות`. With no rows at all the card
  says the count is *unknown* — an empty log is never reported as "first owner".

### Model photo

`src/lib/vehicleImage.ts` fetches an illustrative photo of the model from
Wikipedia (free, CORS-enabled, no API key). It is captioned in the UI as
`תמונה להמחשה בלבד — אינה תמונת הרכב הזה`, because it can only ever be *some*
example of the model.

Accuracy is preferred over coverage, since a photo of the wrong car is worse
than none:

1. Exact English article title, following redirects (`Mazda 3` → `Mazda3`,
   `Subaru XV` → `Subaru Crosstrek`). Trusted outright.
2. Title-scoped English search (`intitle:"Škoda" intitle:"Octavia"`).
3. Hebrew free search, for makes with no Latin mapping.

Results from (2) and (3) must name the model in the article title, which is what
stops an Octavia landing on the *Škoda Auto* company page. Brand logos and SVGs
are rejected. Trim-heavy names (`M850I XDRIVE`) may find nothing and show no
photo — the intended failure mode.

`tozeret_nm` is truncated at ~14 characters (`פולקסווגן גרמנ`), so the country
suffix cannot be stripped by matching country names; makes are matched by
**prefix** against a Hebrew→Latin table instead.

Wikipedia returns **HTTP 429** under rapid load. One lookup per page view is
fine, results are cached by model for 24h, and the query never retries.

## What is NOT available

- **A photo of the actual car.** No official Israeli source publishes vehicle
  images. The Wikipedia photo above is of the model, not the vehicle. An
  accurate per-car render would need a paid service such as imagin.studio.
- **Current market value.** The public price list is the manufacturer's list
  price in the model's production year — not what the car is worth today. Used
  valuations (מחירון לוי יצחק) are commercial and not openly licensed. The price
  card says so explicitly rather than implying a valuation.
- **Torque and 0-100 as published figures.** Not in any public Israeli dataset;
  both remain clearly-labelled estimates.
