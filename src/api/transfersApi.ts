// 'Bridge' to the tx-api backend. Sends block requests to the API at
// 'http://localhost:8001/api' for AG Grid's infinite row model, and submits
// the whole grid atomically via /transfers/grid.

import type { Transfer, TransferRowInput } from '../types/Transfer';

export interface SortModelItem {
  colId: string;
  sort: 'asc' | 'desc';
}

// Shape the grid sends per block. filterModel is AG Grid's per-column filter
// state, passed through to the backend verbatim.
export interface TransferQueryRequest {
  startRow: number;
  endRow: number;
  sortModel: SortModelItem[];
  filterModel: Record<string, unknown>;
  search?: string;
}

export interface TransferBlockResponse {
  rows: Transfer[];
  lastRow: number; // total matching rows, lets the grid size its scrollbar
}

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

export async function queryTransfers(
  req: TransferQueryRequest,
): Promise<TransferBlockResponse> {
  const res = await fetch(`${BASE_URL}/transfers/query`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(req),
  });
  if (!res.ok) throw new Error(`Transfers API error: ${res.status}`);
  return res.json() as Promise<TransferBlockResponse>;
}

// Submit the whole grid. All-or-nothing: on success every row is inserted; on a
// 409 nothing is inserted and a DuplicateDevicesError is thrown.
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
