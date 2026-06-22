// Bridge to backend. Submits the transfer grid for insertion.

import type { Transfer, TransferRowInput } from '../types/Transfer';

export interface TransferCreateResult {
  inserted: number;
  transfers: Transfer[];
}

// Error thrown when the backend rejects the grid for duplicate device names.
// Carries the offending names so the UI can highlight them.
export class DuplicateDevicesError extends Error {
  duplicates: string[];
  constructor(duplicates: string[]) {
    super(`Duplicate device names: ${duplicates.join(', ')}`);
    this.name = 'DuplicateDevicesError';
    this.duplicates = duplicates;
  }
}

const BASE_URL = 'http://localhost:8001/api';

// Attempts to submit the whole grid. All-or-nothing: on success every row is inserted,
// on a 409 nothing is inserted and a DuplicateDevicesError is thrown.
export async function createTransferGrid(
  rows: TransferRowInput[],
): Promise<TransferCreateResult> {
  const res = await fetch(`${BASE_URL}/transfers/grid`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ rows }),
  });

  if (res.status === 409) {
    const body = await res.json().catch(() => null);
    const dups: string[] = body?.detail?.duplicates ?? [];
    throw new DuplicateDevicesError(dups);
  }
  if (!res.ok) throw new Error(`Create transfer grid failed: ${res.status}`);
  return res.json() as Promise<TransferCreateResult>;
}