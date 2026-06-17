import { useMemo, useCallback } from 'react';
import { AgGridReact } from 'ag-grid-react';
import type {
  ColDef,
  ICellRendererParams,
  CellValueChangedEvent,
} from 'ag-grid-community';
import type { TransferRowInput } from '../types/Transfer';
import { gridTheme } from '../theme/gridTheme';

// Each draft row gets a stable client-side key so edits/deletes target the right
// row regardless of sorting. The key never leaves the client.
export interface DraftRow extends TransferRowInput {
  _key: string;
}

interface GridContext {
  onDeleteRow: (key: string) => void;
}

function DeleteCellRenderer({ data, context }: ICellRendererParams<DraftRow, unknown, GridContext>) {
  if (!data) return null;
  return (
    <span style={{ display: 'flex', alignItems: 'center', height: '100%' }}>
      <button
        className="action-btn"
        onClick={() => context.onDeleteRow(data._key)}
        title="Remove row"
      >
        <svg style={{ width: 14, height: 14, stroke: 'currentColor', fill: 'none', strokeWidth: 1.8, strokeLinecap: 'round', strokeLinejoin: 'round', verticalAlign: 'middle' }} viewBox="0 0 24 24" aria-hidden>
          <polyline points="3 6 5 6 21 6" />
          <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
          <path d="M10 11v6M14 11v6" />
          <path d="M9 6V4h6v2" />
        </svg>
      </button>
    </span>
  );
}

interface Props {
  rows: DraftRow[];
  // Highlight devices the backend rejected as duplicates (normalized: upper, no spaces).
  duplicateDevices: Set<string>;
  onCellChanged: (key: string, field: keyof TransferRowInput, value: unknown) => void;
  onDeleteRow: (key: string) => void;
}

function normalizeDevice(device: string | null | undefined): string {
  return (device ?? '').toUpperCase().replace(/\s/g, '');
}

export default function TransferDraftGrid({
  rows,
  duplicateDevices,
  onCellChanged,
  onDeleteRow,
}: Props) {
  const context = useMemo<GridContext>(() => ({ onDeleteRow }), [onDeleteRow]);

  const colDefs = useMemo<ColDef<DraftRow>[]>(() => [
    {
      field: 'device',
      headerName: 'Device *',
      flex: 1.4,
      editable: true,
      // Flag empty or duplicate device cells so the operator can see what to fix.
      cellClassRules: {
        'tx-cell-invalid': (p) =>
          !p.value || duplicateDevices.has(normalizeDevice(p.value as string)),
      },
    },
    { field: 'date', headerName: 'Date', flex: 1, editable: true },
    { field: 'bpId', headerName: 'BP ID', flex: 1, editable: true },
    { field: 'bpRow', headerName: 'BP Row', flex: 0.8, editable: true, type: 'numericColumn' },
    { field: 'bpColumn', headerName: 'BP Col', flex: 0.8, editable: true, type: 'numericColumn' },
    { field: 'waferId', headerName: 'Wafer ID', flex: 1, editable: true },
    { field: 'coupon', headerName: 'Coupon', flex: 0.8, editable: true, type: 'numericColumn' },
    { field: 'variation', headerName: 'Variation', flex: 1, editable: true },
    { field: 'arrayAddress', headerName: 'Array Addr', flex: 1, editable: true },
    { field: 'operator', headerName: 'Operator', flex: 1, editable: true },
    { field: 'comment', headerName: 'Comment', flex: 1.4, editable: true },
    { field: 'cracked', headerName: 'Cracked', flex: 0.8, editable: true, type: 'numericColumn' },
    { field: 'missing', headerName: 'Missing', flex: 0.8, editable: true, type: 'numericColumn' },
    { field: 'yield_', headerName: 'Yield %', flex: 0.8, editable: true, type: 'numericColumn' },
    {
      headerName: '',
      flex: 0.5,
      sortable: false,
      filter: false,
      editable: false,
      cellRenderer: DeleteCellRenderer,
    },
  ], [duplicateDevices]);

  const onCellValueChanged = useCallback((e: CellValueChangedEvent<DraftRow>) => {
    const field = e.colDef.field as keyof TransferRowInput | undefined;
    if (!field || !e.data) return;
    onCellChanged(e.data._key, field, e.newValue);
  }, [onCellChanged]);

  return (
    <div className="tx-grid-wrapper">
      <AgGridReact<DraftRow>
        theme={gridTheme}
        rowData={rows}
        columnDefs={colDefs}
        defaultColDef={{ sortable: true, resizable: true, filter: false }}
        getRowId={(p) => p.data._key}
        context={context}
        onCellValueChanged={onCellValueChanged}
        stopEditingWhenCellsLoseFocus
        suppressDragLeaveHidesColumns
        animateRows={false}
      />
    </div>
  );
}
