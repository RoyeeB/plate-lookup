/**
 * Maps a raw registry record to an ordered list of display fields with Hebrew
 * labels. Empty fields are dropped so no blank rows are ever rendered.
 */
import { t } from '@/i18n';
import type { DisplayField, VehicleRecordRaw, CkanValue } from './types';
import { resolveManufacturer } from '@shared/manufacturer';

/** The official fields to show, in display order, with their Hebrew labels. */
const FIELD_ORDER: ReadonlyArray<{ key: keyof typeof t.fields; copyable?: boolean }> = [
  { key: 'tozeret_nm' },
  { key: 'tozeret_eretz_nm' },
  { key: 'kinuy_mishari' },
  { key: 'degem_nm' },
  { key: 'ramat_gimur' },
  { key: 'shnat_yitzur' },
  { key: 'tzeva_rechev' },
  { key: 'nefach_manoa' },
  { key: 'sug_delek_nm' },
  { key: 'misgeret', copyable: true }, // VIN — long-press to copy
  { key: 'baalut' },
  { key: 'mivchan_acharon_dt' },
  { key: 'tokef_dt' },
  { key: 'ramat_eivzur_betihuty' },
  { key: 'kvutzat_zihum' },
];

const DATE_KEYS = new Set<string>(['mivchan_acharon_dt', 'tokef_dt']);

function isEmpty(value: CkanValue | undefined): boolean {
  if (value === null || value === undefined) return true;
  const s = String(value).trim();
  return s === '' || s === '0' || s.toLowerCase() === 'null';
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

export interface MappedField extends DisplayField {
  copyable: boolean;
}

export function mapOfficialFields(record: VehicleRecordRaw): MappedField[] {
  const fields: MappedField[] = [];

  // The registry packs brand and country into one truncated `tozeret_nm`
  // ("פולקסווגן גרמנ"); show them as the two fields they really are.
  const manufacturer = resolveManufacturer(record);
  const resolved: Partial<Record<keyof typeof t.fields, string | null>> = {
    tozeret_nm: manufacturer?.brand ?? null,
    tozeret_eretz_nm: manufacturer?.country ?? null,
  };

  for (const { key, copyable } of FIELD_ORDER) {
    const raw = key in resolved ? resolved[key] : record[key];
    if (isEmpty(raw)) continue; // hide empty rather than render a blank row

    const value = DATE_KEYS.has(key) ? formatDate(raw as CkanValue) : String(raw).trim();

    fields.push({
      key,
      label: t.fields[key],
      value,
      copyable: copyable ?? false,
    });
  }

  return fields;
}
