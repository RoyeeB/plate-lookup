/**
 * Explicit types for the data.gov.il CKAN datastore_search API.
 * No `any` anywhere — unknown values are typed as string | number | null.
 */

/** A single field value as CKAN may return it (numbers arrive as number or string). */
export type CkanValue = string | number | boolean | null;

/**
 * The registry fields we read. Every field is optional because the different
 * vehicle-class datasets do not all expose the same columns, and any field may
 * be absent or empty for a given record.
 *
 * IMPORTANT: We deliberately do NOT model any owner personal-information fields
 * (name, address, id number). They are never read, displayed, or persisted.
 */
export interface VehicleRecordRaw {
  _id?: number;
  mispar_rechev?: CkanValue;
  tozeret_nm?: CkanValue;
  kinuy_mishari?: CkanValue;
  degem_nm?: CkanValue;
  ramat_gimur?: CkanValue;
  shnat_yitzur?: CkanValue;
  tzeva_rechev?: CkanValue;
  nefach_manoa?: CkanValue;
  sug_delek_nm?: CkanValue;
  misgeret?: CkanValue;
  baalut?: CkanValue;
  mivchan_acharon_dt?: CkanValue;
  tokef_dt?: CkanValue;
  ramat_eivzur_betihuty?: CkanValue;
  kvutzat_zihum?: CkanValue;
  // Fields specific to some datasets, used for estimates when present.
  hespek?: CkanValue; // engine power (present in the motorcycle dataset)
  mishkal_kolel?: CkanValue; // gross weight (heavy/motorcycle datasets)
  [key: string]: CkanValue | number | undefined;
}

/** CKAN datastore_search "result" object. */
export interface DatastoreResult<T> {
  resource_id: string;
  total: number;
  records: T[];
}

/** Full CKAN datastore_search envelope. */
export interface DatastoreSearchResponse<T> {
  success: boolean;
  result?: DatastoreResult<T>;
  error?: {
    message?: string;
    __type?: string;
  };
}

/**
 * A normalized vehicle result: the raw record plus which dataset it came from
 * and whether that dataset represents a deregistered / inactive vehicle.
 */
export interface VehicleLookupResult {
  plate: string;
  record: VehicleRecordRaw;
  datasetId: string;
  datasetLabel: string;
  isInactive: boolean;
}

/** One official field mapped to a Hebrew label for rendering. */
export interface DisplayField {
  key: string;
  label: string;
  value: string;
}

/** Estimated (non-registry) spec. */
export interface EstimatedSpec {
  key: string;
  label: string;
  value: string;
}
