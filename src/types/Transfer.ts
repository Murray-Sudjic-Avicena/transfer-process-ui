// transfer types

export interface Transfer {
  id: string;
  date: string | null;
  device: string | null;
  bpId: string | null;
  bpRow: number | null;
  bpColumn: number | null;
  waferId: string | null;
  coupon: number | null;
  recipeId: number | null;
  variation: string | null;
  arrayAddress: string | null;
  cleaningRecipeId: number | null;
  operator: string | null;
  comment: string | null;
  cracked: number | null;
  missing: number | null;
  yield_: number | null;
}

// One device row as submitted from the grid. device is required; the rest
// are optional so a sparsely-filled row still validates.
export interface TransferRowInput {
  device: string;
  date?: string | null;
  bpId?: string | null;
  bpRow?: number | null;
  bpColumn?: number | null;
  waferId?: string | null;
  coupon?: number | null;
  recipeId?: number | null;
  variation?: string | null;
  arrayAddress?: string | null;
  cleaningRecipeId?: number | null;
  operator?: string | null;
  comment?: string | null;
  cracked?: number | null;
  missing?: number | null;
  yield_?: number | null;
}
