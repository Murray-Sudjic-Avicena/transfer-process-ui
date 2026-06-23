// Client-side validation for the transfer draft grid.
//
// NOTE: this is UX-only fast feedback. The backend independently rejects DB-level
// duplicates (DuplicateDevicesError), which the grid alone cannot detect.
import type { TransferRowInput } from '../types/Transfer';

// Normalises a device name for comparison: uppercased, whitespace removed.
export function normaliseDevice(device: string | null | undefined): string {
  return (device ?? '').toUpperCase().replace(/\s/g, '');
}

// Devices that appear more than once in the grid (compared after normalisation).
// Empty cells are ignored.
export function findDuplicateDevices(
  rows: ReadonlyArray<{ device?: string | null }>,
): Set<string> {
  const seen = new Set<string>();
  const dups = new Set<string>();
  for (const r of rows) {
    const n = normaliseDevice(r.device);
    if (!n) continue;
    if (seen.has(n)) dups.add(n);
    seen.add(n);
  }
  return dups;
}

// Per-field rules for numeric columns. Blank cells are always allowed, apart from device
// these rules apply once a value is present. We validate the numeric entries with further 
// conditions on top of JS "number"; i.e., finite, integer, within range etc.,
interface NumericFieldSpec {
  field: keyof TransferRowInput;
  label: string;
  integer?: boolean;
  min?: number;
  max?: number;
}

const NUMERIC_FIELDS: NumericFieldSpec[] = [
  { field: 'bpRow', label: 'BP Row', integer: true, min: 0 },
  { field: 'bpColumn', label: 'BP Col', integer: true, min: 0 },
  { field: 'coupon', label: 'Coupon', integer: true, min: 0 },
  { field: 'cracked', label: 'Cracked', integer: true, min: 0 },
  { field: 'missing', label: 'Missing', integer: true, min: 0 },
  { field: 'yield_', label: 'Yield %', min: 0, max: 100 },
];

const NUMERIC_SPEC_BY_FIELD = new Map<keyof TransferRowInput, NumericFieldSpec>(
  NUMERIC_FIELDS.map((s) => [s.field, s]),
);

// Returns an error string for a single numeric cell, or null if it's acceptable
// (including blank). The grid uses this to highlight bad cells. `value` is the
// already-parsed cell value (number | null), matching what the grid stores.
export function numericCellError(
  field: keyof TransferRowInput,
  value: unknown,
): string | null {
  const spec = NUMERIC_SPEC_BY_FIELD.get(field);
  if (!spec) return null; // not a validated numeric field
  if (value == null || value === '') return null; // blank is allowed

  const n = typeof value === 'number' ? value : Number(value);
  if (!Number.isFinite(n)) return `${spec.label} must be a number.`;
  if (spec.integer && !Number.isInteger(n)) return `${spec.label} must be a whole number.`;
  if (spec.min != null && n < spec.min) return `${spec.label} must be at least ${spec.min}.`;
  if (spec.max != null && n > spec.max) return `${spec.label} must be at most ${spec.max}.`;
  return null;
}

export interface ValidationResult {
  ok: boolean;
  // First user-facing message to show in the banner, if any.
  error: string | null;
  duplicates: Set<string>;
  // True when at least one row is missing a device name.
  missingDevice: boolean;
}

// Validates the whole draft grid before submission.
export function validateDraftRows(
  rows: ReadonlyArray<TransferRowInput>,
): ValidationResult {
  const missingDevice = rows.some((r) => !r.device || !r.device.trim());
  const duplicates = findDuplicateDevices(rows);

  // First numeric problem found, if any (e.g. NaN, decimal where a whole number
  // is required, or out of range).
  let numericError: string | null = null;
  for (const r of rows) {
    for (const spec of NUMERIC_FIELDS) {
      const err = numericCellError(spec.field, r[spec.field]);
      if (err) {
        numericError = err;
        break;
      }
    }
    if (numericError) break;
  }

  let error: string | null = null;
  if (missingDevice) {
    error = 'Every row needs a device name before submitting.';
  } else if (duplicates.size > 0) {
    error = `Duplicate device names in the grid: ${[...duplicates].join(', ')}`;
  } else if (numericError) {
    error = numericError;
  }

  return { ok: error === null, error, duplicates, missingDevice };
}