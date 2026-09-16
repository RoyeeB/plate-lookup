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

/* ------------------------------------------------------------------ *
 * Enrichment records — secondary datasets joined onto the main result.
 * ------------------------------------------------------------------ */

/** A row from the WLTP model dataset (`142afde2…`). ~90 columns; these are the
 *  ones we surface. Note the spelling `nefah_manoa` — the main registry uses
 *  `nefach_manoa`, this dataset drops the `c`. */
export interface ModelSpecRaw {
  kinuy_mishari?: CkanValue;
  ramat_gimur?: CkanValue;
  /** Engine displacement, cc. */
  nefah_manoa?: CkanValue;
  /** Officially published horsepower. */
  koah_sus?: CkanValue;
  mishkal_kolel?: CkanValue;
  /** Body style, e.g. הצ'בק / קופה / פנאי-שטח. */
  merkav?: CkanValue;
  mispar_dlatot?: CkanValue;
  mispar_moshavim?: CkanValue;
  /** 1 = automatic gearbox. */
  automatic_ind?: CkanValue;
  /** Drivetrain, e.g. 4X2 / 4X4. */
  hanaa_nm?: CkanValue;
  technologiat_hanaa_nm?: CkanValue;
  delek_nm?: CkanValue;
  /** Safety rating, 0-8ish. */
  nikud_betihut?: CkanValue;
  ramat_eivzur_betihuty?: CkanValue;
  CO2_WLTP?: CkanValue;
  /** "Green index" — lower is cleaner. */
  madad_yarok?: CkanValue;
  kvutzat_zihum?: CkanValue;
  kosher_grira_im_blamim?: CkanValue;
  mispar_kariot_avir?: CkanValue;
  sug_tkina_nm?: CkanValue;
  [key: string]: CkanValue | undefined;
}

/** A row from the new-car price list (`39f455bf…`). */
export interface PriceRaw {
  /** List price in ILS when the model was sold new — NOT a current valuation. */
  mehir?: CkanValue;
  shem_yevuan?: CkanValue;
  shnat_yitzur?: CkanValue;
}

/** A row from the vehicle-history dataset (`56063a99…` / `bb2355dc…`). */
export interface HistoryRaw {
  kilometer_test_aharon?: CkanValue;
  rishum_rishon_dt?: CkanValue;
  mispar_manoa?: CkanValue;
  /** Ownership origin, e.g. החכר (leasing), השכרה (rental). */
  mkoriut_nm?: CkanValue;
  shinui_mivne_ind?: CkanValue;
  shnui_zeva_ind?: CkanValue;
  shinui_zmig_ind?: CkanValue;
  gapam_ind?: CkanValue;
}

/** One ownership record from the transfer log (`bb2355dc…`). */
export interface OwnershipRaw {
  /** Month of the transfer, as YYYYMM. */
  baalut_dt?: CkanValue;
  /** Owner type: פרטי / סוחר / החכר / חברה / השכרה. */
  baalut?: CkanValue;
}

/** A row from the outstanding-recalls dataset (`36bf1404…`), UPPERCASE columns. */
export interface RecallRaw {
  RECALL_ID?: CkanValue;
  SUG_RECALL?: CkanValue;
  SUG_TAKALA?: CkanValue;
  TEUR_TAKALA?: CkanValue;
  TAARICH_PTICHA?: CkanValue;
}

/** Everything we managed to join on. Each part is independently nullable —
 *  coverage varies a lot by vehicle age and class. */
export interface VehicleEnrichment {
  modelSpec: ModelSpecRaw | null;
  price: PriceRaw | null;
  history: HistoryRaw | null;
  recalls: RecallRaw[];
  /** Chronological ownership transfers; empty when the car predates the log. */
  ownership: OwnershipRaw[];
  /**
   * Joins whose request actually failed — as opposed to returning no rows,
   * which is normal. Without this the two are indistinguishable on screen and a
   * server error looks exactly like "this car has no history".
   */
  failed: string[];
  /** True when at least one join failed, so the page is showing partial data. */
  incomplete: boolean;
}
