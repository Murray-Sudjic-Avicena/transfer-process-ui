import { useState } from 'react';
import type { TransferRowInput } from '../types/Transfer';
import { numericCellError } from '../validation/transferValidation';

// Mirrors functionality of previous version. Insert spawns 
// N draft rows (one per device) into the grid below. Device 
// names are left blank for the operator to fill in per row.

type FormState = {
  numberOfDevices: string;
  date: string;
  bpId: string;
  bpRow: string;
  bpColumn: string;
  waferId: string;
  coupon: string;
  variation: string;
  arrayAddress: string;
  operator: string;
  comment: string;
};

const EMPTY: FormState = {
  numberOfDevices: '1',
  date: '',
  bpId: '',
  bpRow: '',
  bpColumn: '',
  waferId: '',
  coupon: '',
  variation: '',
  arrayAddress: '',
  operator: '',
  comment: '',
};

// Optional numeric field -> number | null (blank stays null).
function numOrNull(v: string): number | null {
  if (v.trim() === '') return null;
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
}

interface Props {
  // Emits the freshly-built draft rows for the page to append to the grid.
  onInsert: (rows: TransferRowInput[]) => void;
}

export default function TransferEntryForm({ onInsert }: Props) {
  const [form, setForm] = useState<FormState>(EMPTY);
  const [error, setError] = useState<string | null>(null);

  const set = <K extends keyof FormState>(key: K, value: FormState[K]) =>
    setForm((f) => ({ ...f, [key]: value }));

  const handleInsert = () => {
    setError(null);
    // Form type checks. These conform with the same rules as the grid validation.
    const count = Number(form.numberOfDevices);
    if (!Number.isInteger(count) || count < 1) {
      setError('Number of devices must be a whole number ≥ 1.');
      return;
    }
    if (!form.date.trim()) {
      setError('Date is required.');
      return;
    }
    if (!form.waferId.trim()) {
      setError('Wafer ID is required.');
      return;
    }
    if (!form.bpId.trim()) {
      setError('BP ID is required.');
      return;
    }
    // Numeric fields use the same domain rules as the grid (integer, in range),
    // so a value the form accepts is guaranteed to pass the grid's check.
    for (const [field, raw] of [
      ['bpRow', form.bpRow],
      ['bpColumn', form.bpColumn],
      ['coupon', form.coupon],
    ] as const) {
      const err = numericCellError(field, numOrNull(raw));
      if (err) {
        setError(err);
        return;
      }
    }

    // Shared values applied to every spawned row; device is filled in per row.
    const shared: Omit<TransferRowInput, 'device'> = {
      date: form.date.trim(),
      bpId: form.bpId.trim(),
      bpRow: numOrNull(form.bpRow),
      bpColumn: numOrNull(form.bpColumn),
      waferId: form.waferId.trim(),
      coupon: numOrNull(form.coupon),
      variation: form.variation.trim() || null,
      arrayAddress: form.arrayAddress.trim() || null,
      operator: form.operator.trim() || null,
      comment: form.comment.trim() || null,
    };

    const rows: TransferRowInput[] = Array.from({ length: count }, () => ({
      device: '',
      ...shared,
    }));

    onInsert(rows);
  };

  return (
    <fieldset className="tx-fieldset">
      <legend className="tx-legend">Transfer</legend>

      <div className="tx-form-grid">
        <label className="form-field">
          <span># Devices *</span>
          <input type="number" min={1} value={form.numberOfDevices} onChange={(e) => set('numberOfDevices', e.target.value)} />
        </label>
        <label className="form-field">
          <span>Date *</span>
          <input type="date" value={form.date} onChange={(e) => set('date', e.target.value)} />
        </label>
        <label className="form-field">
          <span>BP ID *</span>
          <input value={form.bpId} onChange={(e) => set('bpId', e.target.value)} />
        </label>
        <label className="form-field">
          <span>BP Row</span>
          <input type="number" value={form.bpRow} onChange={(e) => set('bpRow', e.target.value)} />
        </label>
        <label className="form-field">
          <span>BP Col</span>
          <input type="number" value={form.bpColumn} onChange={(e) => set('bpColumn', e.target.value)} />
        </label>
        <label className="form-field">
          <span>Wafer ID *</span>
          <input value={form.waferId} onChange={(e) => set('waferId', e.target.value)} />
        </label>
        <label className="form-field">
          <span>Coupon</span>
          <input type="number" value={form.coupon} onChange={(e) => set('coupon', e.target.value)} />
        </label>
        <label className="form-field">
          <span>Variation</span>
          <input value={form.variation} onChange={(e) => set('variation', e.target.value)} />
        </label>
        <label className="form-field">
          <span>Array Address</span>
          <input value={form.arrayAddress} onChange={(e) => set('arrayAddress', e.target.value)} />
        </label>
        <label className="form-field">
          <span>Operator</span>
          <input value={form.operator} onChange={(e) => set('operator', e.target.value)} />
        </label>
        <label className="form-field tx-form-comment">
          <span>Comment</span>
          <input value={form.comment} onChange={(e) => set('comment', e.target.value)} />
        </label>
      </div>

      {error && <p className="modal-error">{error}</p>}

      <div className="tx-form-actions">
        <button type="button" className="btn btn-primary" onClick={handleInsert}>
          Insert
        </button>
      </div>
    </fieldset>
  );
}
