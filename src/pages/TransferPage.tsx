import { useState, useCallback } from 'react';
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
  // The staged grid rows live here; the grid edits them in place.
  const [rows, setRows] = useState<DraftRow[]>([]);
  const [duplicateDevices, setDuplicateDevices] = useState<Set<string>>(new Set());
  const [submitting, setSubmitting] = useState(false);
  const [banner, setBanner] = useState<{ kind: 'ok' | 'err'; text: string } | null>(null);
  const [clearConfirm, setClearConfirm] = useState(false);

  // Form Insert: append N freshly-built draft rows.
  const handleInsert = useCallback((newRows: TransferRowInput[]) => {
    setRows((prev) => [...prev, ...newRows.map((r) => ({ ...r, _key: nextKey() }))]);
    setBanner(null);
  }, []);

  const handleCellChanged = useCallback(
    (key: string, field: keyof TransferRowInput, value: unknown) => {
      setRows((prev) =>
        prev.map((r) => (r._key === key ? { ...r, [field]: value } : r)), //goes through every row, checks if that one was edited. If yes, overwrite the one field that was changed, if no, leave unchanged
      );
      // Editing a device clears its stale duplicate flag.
      if (field === 'device') setDuplicateDevices(new Set());
    },
    [],
  );

  const handleDeleteRow = useCallback((key: string) => {
    setRows((prev) => prev.filter((r) => r._key !== key));
  }, []);

  const handleClear = () => {
    setRows([]);
    setDuplicateDevices(new Set());
    setBanner(null);
    setClearConfirm(false);
  };

  const handleSubmit = async () => {
    setBanner(null);

    // Client-side guard: every row needs a device name.
    const missing = rows.some((r) => !r.device || !r.device.trim());
    if (missing) {
      setBanner({ kind: 'err', text: 'Every row needs a device name before submitting.' });
      return;
    }

    // Client-side duplicate check mirrors the backend so the user gets instant feedback.
    const seen = new Set<string>();
    const localDups = new Set<string>();
    for (const r of rows) {
      const n = normaliseDevice(r.device);
      if (seen.has(n)) localDups.add(n);
      seen.add(n);
    }
    if (localDups.size > 0) {
      setDuplicateDevices(localDups);
      setBanner({ kind: 'err', text: `Duplicate device names in the grid: ${[...localDups].join(', ')}` });
      return;
    }

    setSubmitting(true);
    try {
      // Strip the client-only _key before sending.
      const payload: TransferRowInput[] = rows.map(({ _key, ...rest }) => {
        void _key;
        return rest;
      });
      const result = await createTransferGrid(payload);
      setRows([]);
      setDuplicateDevices(new Set());
      setBanner({ kind: 'ok', text: `Inserted ${result.inserted} transfer${result.inserted === 1 ? '' : 's'}.` });
    } catch (err) {
      if (err instanceof DuplicateDevicesError) {
        setDuplicateDevices(new Set(err.duplicates.map(normaliseDevice)));
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
