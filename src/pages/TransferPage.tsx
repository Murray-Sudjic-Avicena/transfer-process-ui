import { useState, useCallback, useMemo } from 'react';
import Header from '../components/Header';
import TransferToolbar from '../components/TransferToolbar';
import TransferEntryForm from '../components/TransferEntryForm';
import TransferDraftGrid, { type DraftRow } from '../components/TransferDraftGrid';
import ConfirmDialog from '../components/ConfirmDialog';
import {
  createTransferGrid,
  DuplicateDevicesError,
} from '../api/transfersApi';
import type { TransferRowInput } from '../types/Transfer';
import '../tx.css';

let keyCounter = 0;
const nextKey = () => `draft-${keyCounter++}`; //function creates a temporary key used only in the frontend, to distinguish rows before they are submitted

function normaliseDevice(device: string | null | undefined): string {
  return (device ?? '').toUpperCase().replace(/\s/g, '');
}

export default function TransferPage() {
  // state variables
  const [rows, setRows] = useState<DraftRow[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [banner, setBanner] = useState<{ kind: 'ok' | 'err'; text: string } | null>(null);
  const [clearConfirm, setClearConfirm] = useState(false);

  // Device names that appear more than once in the grid right now. Recomputes on every change to rows
  const duplicateDevices = useMemo(() => {
    const seen = new Set<string>();
    const dups = new Set<string>();
    for (const r of rows) {
      const n = normaliseDevice(r.device);
      if (!n) continue; // empty cells don't count as duplicates
      if (seen.has(n)) dups.add(n);
      seen.add(n);
    }
    return dups;
  }, [rows]);

  // appends n draft rows.
  const handleInsert = useCallback((newRows: TransferRowInput[]) => {
    setRows((prev) => [...prev, ...newRows.map((r) => ({ ...r, _key: nextKey() }))]);
    setBanner(null);
  }, []);

  const handleCellChanged = useCallback(
    (key: string, field: keyof TransferRowInput, value: unknown) => {
      // updates the rows. Note that duplicateDevices recomputes itself from rows.
      setRows((prev) =>
        prev.map((r) => (r._key === key ? { ...r, [field]: value } : r)),
      );
    },
    [],
  );

  const handleDeleteRow = useCallback((key: string) => {
    setRows((prev) => prev.filter((r) => r._key !== key));
  }, [setRows]);

  const handleClear = () => {
    setRows([]);
    setBanner(null);
    setClearConfirm(false);
  };

  const handleSubmit = async () => {
    setBanner(null);

    // Every row needs a device name.
    const missing = rows.some((r) => !r.device || !r.device.trim());
    if (missing) {
      setBanner({ kind: 'err', text: 'Every row needs a device name before submitting.' });
      return;
    }

    if (duplicateDevices.size > 0) {
      setBanner({ kind: 'err', text: `Duplicate device names in the grid: ${[...duplicateDevices].join(', ')}` });
      return;
    }

    setSubmitting(true);
    try {
      // Strip the client-only '_key' before sending.
      const payload: TransferRowInput[] = rows.map(({ _key, ...rest }) => {
        void _key;
        return rest;
      });
      const result = await createTransferGrid(payload);
      setRows([]);
      setBanner({ kind: 'ok', text: `Inserted ${result.inserted} transfer${result.inserted === 1 ? '' : 's'}.` });
    } catch (err) {
      if (err instanceof DuplicateDevicesError) {
        // DB clashes can't be detected from the grid alone - need to lookup. The banner names them.
        setBanner({
          kind: 'err',
          text: `Backend rejected duplicates (nothing inserted): ${err.duplicates.join(', ')}`,
        });
      } else {
        console.error(err);
        setBanner({ kind: 'err', text: err instanceof Error ? err.message : 'Submit failed.' });
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="tile-page-shell">
      <Header />
      <div className="tile-page-content">
        <TransferToolbar
          draftCount={rows.length}
          submitting={submitting}
          onSubmit={handleSubmit}
          onClear={() => setClearConfirm(true)}
        />

        {banner && (
          <p className={banner.kind === 'ok' ? 'tx-banner tx-banner--ok' : 'tx-banner tx-banner--err'}>
            {banner.text}
          </p>
        )}

        <TransferEntryForm onInsert={handleInsert} />

        <TransferDraftGrid
          rows={rows}
          duplicateDevices={duplicateDevices}
          onCellChanged={handleCellChanged}
          onDeleteRow={handleDeleteRow}
        />
      </div>

      {clearConfirm && (
        <ConfirmDialog
          title="Clear staged rows"
          message={`Remove all ${rows.length} staged row(s)? This cannot be undone.`}
          confirmLabel="Clear"
          onConfirm={handleClear}
          onCancel={() => setClearConfirm(false)}
        />
      )}
    </div>
  );
}