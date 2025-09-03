// src/lib/kis-utils.ts
export type KisRow = Record<string, any>;

/* 숫자 변환 (콤마/공백 안전) */
export function toNumSafe(v: any): number {
  if (v == null) return NaN;
  const n = Number(String(v).replace(/,/g, '').trim());
  return Number.isFinite(n) ? n : NaN;
}

/* 여러 후보 키 중 첫 값 반환 (toNum=true면 숫자 변환) */
export function pick<T = string>(row: KisRow, keys: string[], toNum = false): any {
  for (const k of keys) {
    if (row[k] != null) return toNum ? toNumSafe(row[k]) : (row[k] as T);
  }
  return toNum ? NaN : undefined;
}

/* 날짜/정렬 유틸 */
export function ymdToKstIso(ymd: string, time: string = '09:00:00'): string {
  if (!ymd || ymd.length < 8) return '';
  const y = ymd.slice(0, 4);
  const m = ymd.slice(4, 6);
  const d = ymd.slice(6, 8);
  return `${y}-${m}-${d}T${time}`;
}
export function formatDate(date: Date): string {
  const yyyy = date.getFullYear();
  const mm = String(date.getMonth() + 1).padStart(2, '0');
  const dd = String(date.getDate()).padStart(2, '0');
  return `${yyyy}${mm}${dd}`;
}
const DATE_KEYS = ['stck_bsop_date', 'bsop_date', 'trdd', 'tdd_clsprc_dt', 'bas_dt'];
export function rowToYmd(row: KisRow): string {
  const raw = pick<string>(row, DATE_KEYS);
  return typeof raw === 'string' ? raw.replace(/\D/g, '').slice(0, 8) : '';
}
export function sortRowsDescByYmd(rows: KisRow[]): KisRow[] {
  return rows
    .map((r) => ({ r, ymd: rowToYmd(r) }))
    .filter((x) => /^\d{8}$/.test(x.ymd))
    .sort((a, b) => (a.ymd < b.ymd ? 1 : a.ymd > b.ymd ? -1 : 0))
    .map((x) => x.r);
}

/* 키셋 (KIS 응답마다 컬럼명이 달라질 수 있어 후보 배열로) */
export const KIS_KEYS = {
  close: ['bstp_nmix_prpr', 'idx_clpr', 'stck_clpr', 'clsprc'],
  open: ['bstp_nmix_oprc', 'idx_oprc', 'stck_oprc', 'opnprc'],
  high: ['bstp_nmix_hgpr', 'idx_hgpr', 'stck_hgpr', 'hgprc'],
  low: ['bstp_nmix_lwpr', 'idx_lwpr', 'stck_lwpr', 'lwprc'],
};
// 주식 일자별 /uapi/domestic-stock/v1/quotations/inquire-daily-itemchartprice
// stck_
// 지수 일별 /uapi/domestic-stock/v1/quotations/inquire-index-daily-price
// idx_ , bsop_date: 영업일자
