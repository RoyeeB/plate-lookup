/**
 * The ordered list of data.gov.il datastore resources we query, in sequence,
 * until a record is found. The first hit wins.
 *
 * Resource IDs were verified against data.gov.il (Ministry of Transport) in
 * Sept 2026. If a lookup stops working, re-check the IDs on:
 *   https://data.gov.il/dataset/private-and-commercial-vehicles
 *   https://data.gov.il/dataset/motorcycle
 *   https://data.gov.il/dataset/rechev_le_pail_with_degem
 *
 * Notes on vehicle classes:
 *  - Private, commercial AND heavy goods vehicles (trucks/משא) all live in the
 *    main "private-and-commercial" resource — there is no separate heavy-vehicle
 *    datastore keyed by mispar_rechev; heavy vehicles are distinguished there by
 *    sug_rechev, not by dataset.
 *  - Motorcycles / two-wheelers are a separate resource.
 *  - Off-road vehicles (רכב שטח / טרקטורונים) that are actively registered also
 *    appear in the main resource. If the Ministry publishes a dedicated off-road
 *    resource in the future, add its id below with `class: 'offroad'`.
 *  - The two "inactive" resources let us tell the user a plate is likely
 *    deregistered rather than simply unknown.
 */

export type VehicleClass =
  | 'private_commercial'
  | 'motorcycle'
  | 'inactive';

export interface DatasetConfig {
  /** CKAN resource_id. */
  id: string;
  /** Short Hebrew label shown as the record's source. */
  label: string;
  /** Broad class this dataset represents. */
  class: VehicleClass;
  /** True if a record here means the vehicle is no longer active on the road. */
  inactive: boolean;
}

export const DATASETS: readonly DatasetConfig[] = [
  {
    id: '053cea08-09bc-40ec-8f7a-156f0677aff3',
    label: 'רכב פרטי / מסחרי / כבד',
    class: 'private_commercial',
    inactive: false,
  },
  {
    id: 'bf9df4e2-d90d-4c0a-a400-19e15af8e95f',
    label: 'רכב דו-גלגלי (אופנוע)',
    class: 'motorcycle',
    inactive: false,
  },
  {
    id: 'f6efe89a-fb3d-43a4-bb61-9bf12a9b9099',
    label: 'רכב לא פעיל (עם קוד דגם)',
    class: 'inactive',
    inactive: true,
  },
  {
    id: 'cf29862d-ca25-4691-84f6-1be60dcb4a1e',
    label: 'רכב לא פעיל',
    class: 'inactive',
    inactive: true,
  },
] as const;

export const CKAN_BASE_URL = 'https://data.gov.il/api/3/action/datastore_search';

/**
 * Secondary resources used to enrich a record once the plate has been found.
 *
 * The first two are keyed by the MODEL (tozeret_cd + degem_cd + shnat_yitzur),
 * which the main registry record carries; the rest are keyed by the plate.
 * Every one of them is best-effort — a lookup still succeeds without them.
 *
 * Resource IDs verified against data.gov.il in Sept 2026.
 */
export const ENRICHMENT_RESOURCES = {
  /** "תוצרים ודגמים של כלי רכב WLTP" — the real model spec: power, engine,
   *  body, safety kit. This is where officially published horsepower lives. */
  modelSpecs: '142afde2-6228-49f9-8a29-9b6c3a0cbe40',
  /** "יבואנים ומחירוני רכב חדש" — importer + list price when the model was new. */
  priceList: '39f455bf-6db0-4926-859d-017f34eacbcb',
  /** "היסטוריית כלי רכב פרטיים" — odometer at last test, first registration,
   *  structural/colour/tyre changes. */
  history: '56063a99-8a3e-4ff4-912e-5966c0279bad',
  /** The ownership-transfer log: one row per change of hands, with the month
   *  and the owner type. This is what "יד ראשונה / שנייה" is derived from.
   *
   *  IMPORTANT: the log only starts in January 2017. For a car that went on the
   *  road before then the count is a FLOOR, not the true number of owners, and
   *  an absence of rows means "unknown" — never "first owner". */
  ownership: 'bb2355dc-9ec7-4f06-9c3f-3344672171da',
  /** "כלי רכב שלא ביצעו ריקול" — outstanding manufacturer safety recalls.
   *  NOTE: this resource spells its columns in UPPERCASE. */
  openRecalls: '36bf1404-0be4-49d2-82dc-2f1ead4a8b93',
} as const;
