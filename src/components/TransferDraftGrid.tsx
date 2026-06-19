import { useCallback } from 'react';
import type { TransferRowInput } from '../types/Transfer';

// Each draft row gets a stable client-side key so edits/deletes target the right
// row regardless of order. The key never leaves the client.
export interface DraftRow extends TransferRowInput {
  _key: string;
}

interface Props {
  rows: DraftRow[];
  // Highlight devices the backend rejected as duplicates (normalized: upper, no spaces).
  duplicateDevices: Set<string>;
  onCellChanged: (key: string, field: keyof TransferRowInput, value: unknown) => void;
  onDeleteRow: (key: string) => void;
}

// Column config drives both the header row and each body cell. `flex` is a
// relative width weight (same meaning as the old grid), `numeric` switches the
// input to a number field and parses the value back to a number.
interface Column {
  field: keyof TransferRowInput;
  header: string;
  flex: number;
  numeric?: boolean;
}

const COLUMNS: Column[] = [
  { field: 'device', header: 'Device *', flex: 1.4 },
  { field: 'date', header: 'Date', flex: 1 },
  { field: 'bpId', header: 'BP ID', flex: 1 },
  { field: 'bpRow', header: 'BP Row', flex: 0.8, numeric: true },
  { field: 'bpColumn', header: 'BP Col', flex: 0.8, numeric: true },
  { field: 'waferId', header: 'Wafer ID', flex: 1 },
  { field: 'coupon', header: 'Coupon', flex: 0.8, numeric: true },
  { field: 'variation', header: 'Variation', flex: 1 },
  { field: 'arrayAddress', header: 'Array Addr', flex: 1 },
  { field: 'operator', header: 'Operator', flex: 1 },
  { field: 'comment', header: 'Comment', flex: 1.4 },
  { field: 'cracked', header: 'Cracked', flex: 0.8, numeric: true },
  { field: 'missing', header: 'Missing', flex: 0.8, numeric: true },
  { field: 'yield_', header: 'Yield %', flex: 0.8, numeric: true },
];

const ACTION_COL_FLEX = 0.5;
const TOTAL_FLEX =
  COLUMNS.reduce((sum, c) => sum + c.flex, 0) + ACTION_COL_FLEX;

function normaliseDevice(device: string | null | undefined): string {
  return (device ?? '').toUpperCase().replace(/\s/g, '');
}

export default function TransferDraftGrid({
  rows,
  duplicateDevices,
  onCellChanged,
  onDeleteRow,
}: Props) {
  const handleChange = useCallback(
    (key: string, col: Column, raw: string) => {
      // Numeric columns store a number (or null when blank) so the row stays
      // type-correct before it's submitted.
      const value: unknown = col.numeric ? (raw === '' ? null : Number(raw)) : raw;
      onCellChanged(key, col.field, value);
    },
    [onCellChanged],
  );

  return (
    <div className="tx-grid-wrapper">
      <table className="tx-grid">
        <thead>
          <tr>
            {COLUMNS.map((c) => (
              <th key={c.field} style={{ width: `${(c.flex / TOTAL_FLEX) * 100}%` }}>
                {c.header}
              </th>
            ))}
            <th
              className="tx-grid-action-col"
              style={{ width: `${(ACTION_COL_FLEX / TOTAL_FLEX) * 100}%` }}
              aria-label="Actions"
            />
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row._key}>
              {COLUMNS.map((c) => {
                const value = row[c.field];
                // Flag empty or duplicate device cells so the operator can see what to fix.
                const invalid =
                  c.field === 'device' &&
                  (!value || duplicateDevices.has(normaliseDevice(value as string)));
                return (
                  <td key={c.field}>
                    <input
                      className={`tx-grid-input${invalid ? ' tx-cell-invalid' : ''}`}
                      type={c.numeric ? 'number' : 'text'}
                      value={value == null ? '' : String(value)}
                      onChange={(e) => handleChange(row._key, c, e.target.value)}
                    />
                  </td>
                );
              })}
              <td className="tx-grid-action-col">
                <button
                  className="action-btn"
                  onClick={() => onDeleteRow(row._key)}
                  title="Remove row"
                  type="button"
                >
                  <svg style={{ width: 14, height: 14, stroke: 'currentColor', fill: 'none', strokeWidth: 1.8, strokeLinecap: 'round', strokeLinejoin: 'round', verticalAlign: 'middle' }} viewBox="0 0 24 24" aria-hidden>
                    <polyline points="3 6 5 6 21 6" />
                    <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
                    <path d="M10 11v6M14 11v6" />
                    <path d="M9 6V4h6v2" />
                  </svg>
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
