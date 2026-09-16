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
