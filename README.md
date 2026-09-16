# Plate Lookup · איתור לוחית

Cross-platform (iOS + Android) app that takes an Israeli license plate — typed
or captured by camera — and returns the vehicle's official registry details from
Israeli government open data (data.gov.il). Hebrew-first, RTL, on-device OCR, no
API key, no owner personal information.

Built with **Expo + TypeScript (strict) + expo-router**. This repo currently
pins `expo@58.0.0-canary` with `react-native@0.87.0` — the canary was adopted to
clear the Swift 6.2 toolchain gap described below.

---

## 🌐 There is also a web build, in `web/`

`web/` is a standalone **Vite + React** port of the same product: same Hebrew
RTL design, same data source, same honesty rules — but it runs in a browser, so
it needs no Xcode, no prebuild and no app store. It is an installable PWA with
offline support, dark mode, browser OCR via tesseract.js, and a unit-test suite.

```bash
cd web && npm install && npm run dev     # http://localhost:5173
```

It shares no code with the native app at runtime — the pure TypeScript layers
were copied over and the React Native pieces rewritten. See `web/README.md`.
**If you change shared logic (plate parsing, estimates, ownership rules), it
must be changed in both places.**

---

## ⚠️ This app requires a development build (not Expo Go)

On-device OCR uses `@react-native-ml-kit/text-recognition`, which is a **native
module**. It will **not** run in Expo Go. The project is configured for a
development build from the start (prebuild + config plugins).

### First-time setup

```bash
# 1. Install JS dependencies
npm install

# 2. Reconcile native dependency versions with the Expo SDK (recommended)
npx expo install --fix

# 3. (Optional) regenerate the yellow-plate app icon / splash / adaptive icon
npm run assets

# 4. Generate the native iOS & Android projects
npx expo prebuild
```

### Run on a device / simulator (dev commands)

```bash
# iOS (Mac + Xcode required)
npx expo run:ios

# Android (Android Studio / SDK required)
npx expo run:android
```

After the first `run:ios` / `run:android`, the dev client is installed on the
device. For subsequent JS-only changes you can just start the bundler:

```bash
npm start        # expo start --dev-client
```

> **Do not use `expo start` + Expo Go.** ML Kit is missing there and the scan
> screen will crash on capture.

---

## ⚠️ Toolchain compatibility (Xcode / Swift version)

> **Status:** the dependency bump to the SDK 58 canary (above) was made to get
> past this. Whether a local `expo run:ios` now completes has **not** been
> re-verified since the bump — if it still fails, the EAS path below applies.
> The history below is kept because it explains *why* the canary is pinned.

Expo SDK 57 is validated against **Xcode 16.x / 26.0 (Swift 6.0–6.1)**. Its core
native package `expo-modules-jsi` (57.0.8, the latest published) is compiled
**from source** during the app build (the npm package ships only a stub
xcframework), and its Swift sources do **not** compile under **Xcode 26.2's
Swift 6.2** compiler — the stricter region-based data-race checker rejects the
`sending` of pointers into `JavaScriptActor.assumeIsolated` closures in
`JavaScriptRuntime.swift`, even though those captures are annotated
`nonisolated(unsafe)`. Swift 5 language mode doesn't help (the code uses Swift 6
syntax). There is no stable fix — only SDK 58 canary.

**If your `xcodebuild -version` reports 26.2, use one of these to build/run:**

1. **EAS Build (recommended, no local Xcode needed):**
   ```bash
   npx eas build --platform ios --profile development
   ```
   EAS uses a build image whose Xcode matches the SDK.
2. **Install Xcode 26.0** alongside 26.2 and select it:
   ```bash
   sudo xcode-select -s /Applications/Xcode_26.0.app/Contents/Developer
   npx expo run:ios
   ```
3. **Upgrade to Expo SDK 58** once it ships stable (its `expo-modules-jsi`
   targets the newer Swift), then `npx expo run:ios`.

Everything else is verified working on this machine (Xcode 26.2): `expo prebuild`
generates the native project and **CocoaPods installs cleanly**, TypeScript
type-checks with zero errors, `expo config` resolves all plugins, and the live
data.gov.il query returns and maps correctly. The blocker is strictly the
upstream Swift-compiler-version gap above, not the app code.

> Note: the bundled ML Kit config plugin sets the iOS deployment target to
> **16.4** (the max of ML Kit's 15.5 minimum and Expo SDK 57's own 16.4 pod
> requirement) — the default prebuild template's 15.5 is too low for the Expo
> pods and fails `pod install`.

---

## 🔁 RTL note (important)

Hebrew is the default language and the UI is forced RTL at app start via
`I18nManager.forceRTL(true)` in `app/_layout.tsx`.

React Native only applies a **forced** RTL layout after a **full JS reload** — a
Fast Refresh is not enough. If the first launch looks LTR, reload the app once
(shake → Reload, or press `r` in the terminal). On a fresh install this happens
automatically on the second render.

---

## 📂 Project structure

```
app/                      # expo-router file-based routes
  _layout.tsx             # RTL bootstrap, providers, Stack, splash handling
  index.tsx               # Home: plate input + scan button + recent searches
  scan.tsx                # Camera + ML Kit OCR + confirm sheet
  vehicle/[plate].tsx     # Result: official specs + estimated specs

src/
  api/
    datasets.ts           # ordered list of data.gov.il resource_ids (fallbacks)
    client.ts             # CKAN fetch + sequential fallback + error types
    queries.ts            # React Query hooks + recent-searches hook
    mapper.ts             # registry record → labeled display fields (hides empty)
    types.ts              # explicit API interfaces (no `any`)
  lib/
    plate.ts              # validation / normalization / pretty formatting
    ocr.ts                # ML Kit blocks → best plate guess + confusion fixes
    estimates.ts          # heuristic horsepower / torque / weight / 0-100
    recentSearches.ts     # AsyncStorage (plate numbers only)
  components/             # PlateInput, PlateBadge, SpecCard, EstimatesCard, …
  hooks/                  # useNetworkStatus (expo-network), useToast
  providers/              # QueryProvider (react-query)
  i18n/                   # single string module (Hebrew) — add English here
  theme/                  # colors / spacing / radius / plate aspect ratio

plugins/
  withMlKitTextRecognition.js  # config plugin: raises iOS deployment target
scripts/
  generate-assets.js      # draws the yellow-plate PNGs (pure Node, no deps)
```

---

## 🗄️ Data source

Israeli government open data (CKAN datastore), no API key:

```
GET https://data.gov.il/api/3/action/datastore_search
    ?resource_id=<id>&q={"mispar_rechev":"<PLATE_DIGITS>"}
```

The app queries these resources **in sequence** until a record is found
(`src/api/datasets.ts`):

| Order | Class | resource_id | Notes |
|------:|-------|-------------|-------|
| 1 | Private / commercial / heavy | `053cea08-09bc-40ec-8f7a-156f0677aff3` | Trucks & heavy goods vehicles live here too (distinguished by `sug_rechev`, not a separate dataset) |
| 2 | Motorcycles / two-wheelers | `bf9df4e2-d90d-4c0a-a400-19e15af8e95f` | Confirmed active, keyed by `mispar_rechev` |
| 3 | Inactive (with model code) | `f6efe89a-fb3d-43a4-bb61-9bf12a9b9099` | Lets us tell the user a plate is likely deregistered |
| 4 | Inactive | `cf29862d-ca25-4691-84f6-1be60dcb4a1e` | Fallback for deregistered vehicles |

**On off-road vehicles:** actively-registered off-road vehicles (רכב שטח /
טרקטורונים) appear in the main resource (#1). At the time of writing there is no
separate off-road datastore keyed by `mispar_rechev`; if the Ministry publishes
one, add it to `DATASETS` in `src/api/datasets.ts` — the fallback chain is fully
data-driven, so no other code changes are needed.

> Re-verify the resource IDs on data.gov.il (Ministry of Transport) if lookups
> stop returning data — the Ministry occasionally re-publishes resources.

### Fields shown

Official registry fields are mapped to Hebrew labels in `src/i18n/strings.ts`
(`fields`) and rendered in order by `src/api/mapper.ts`. Empty fields are hidden.
**No owner personal information is ever read, displayed, or persisted.**

### Estimated specs

Horsepower, torque, curb weight and 0-100 km/h are **not** in the registry. They
are heuristic estimates (`src/lib/estimates.ts`) derived from manufacturer,
commercial name, trim, year, displacement and fuel type, and are shown in a
visually distinct **"נתונים משוערים"** section — never mixed with official data.

---

## 📸 OCR pipeline (`src/lib/ocr.ts`)

1. Collect every text block ML Kit returns.
2. Apply character-confusion corrections (`O→0, I/l→1, S→5, B→8, Z→2`, …).
3. Strip non-digits from each candidate token.
4. Pick the longest digit run of length **5–8**.
5. If nothing qualifies → *"לא זוהה מספר — נסה שוב או הקלד ידנית"* (never guess).

The detected number is shown in an **editable confirm sheet**; the app **never
searches automatically** after a scan.

---

## 🔐 Permissions & native config

- Camera permission strings are in `app.json` (`NSCameraUsageDescription` in
  Hebrew for iOS; `android.permission.CAMERA` for Android).
- A dedicated permission-denied screen explains why and offers **Open Settings**
  (`expo-linking`).
- **Bundle identifier / package name** are placeholders you can change:
  `com.example.platelookup` (iOS `bundleIdentifier`, Android `package` in
  `app.json`).

---

## ✅ Quality bar implemented

- Skeleton placeholders while loading (`VehicleSkeleton`), not a bare spinner.
- Distinct **not-found** (may be a vehicle class outside the dataset, or
  deregistered), **network-error** (with retry), and **offline** states
  (`expo-network`).
- Empty fields hidden, never rendered as blank rows.
- **Long-press the VIN (`מספר שלדה`) to copy**, with a toast confirmation.
- Explicit TypeScript interfaces for the API — no `any` (`tsconfig` strict +
  `noUncheckedIndexedAccess`).
- Haptic feedback on a successful scan (`expo-haptics`).
- One-handed layout: bottom-anchored primary actions, ≥56px tap targets.
- All strings in one i18n module for future English support.

Type-check the project with:

```bash
npm run lint   # tsc --noEmit
```
