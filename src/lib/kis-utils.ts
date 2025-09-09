export type KisPrimitive = string | number | null | undefined;
export type KisRow = Record<string, KisPrimitive>;

/* 숫자 변환 (콤마/공백 안전) */
export function toNumSafe(v: unknown): number {
  if (v == null) return NaN;
  const n = Number(String(v).replace(/,/g, '').trim());
  return Number.isFinite(n) ? n : NaN;
}

/* 여러 후보 키 중 첫 값 반환 (toNum=true면 숫자 변환) */
// 1. 선언부: toNum=true면 number 리턴
export function pick(row: KisRow, keys: string[], toNum: true): number;

// 2. 선언부: toNum=false면 제너릭 T | undefined 리턴
export function pick<T = string>(row: KisRow, keys: string[], toNum?: false): T | undefined;

// 3. 구현부 (실제 함수 내용, 반환 타입은 합집합)
export function pick<T = string>(row: KisRow, keys: string[], toNum = false): number | (T | undefined) {
  for (const k of keys) {
    if (row[k] != null) {
      return toNum ? toNumSafe(row[k]) : (row[k] as T);
    }
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

// 공통 키셋 사용해 값 읽기
export function readNum(row: KisRow, keys: string[]): number {
  for (const k of keys) {
    if (k in row) {
      const n = toNumSafe(row[k]);
      if (!Number.isNaN(n)) return n;
    }
  }
  return NaN;
}

// 더미(개장 전) 판단:
// 1) 거래량=0 && 거래대금=0
// 2) OHLC 모두 같음(= 움직임 없음) && (가능하면 직전 종가와도 동일)
export function isPreOpenDummy(row: KisRow, prevRow?: KisRow) {
  const o = readNum(row, KIS_KEYS.open);
  const h = readNum(row, KIS_KEYS.high);
  const l = readNum(row, KIS_KEYS.low);
  const c = readNum(row, KIS_KEYS.close);

  const volZero = toNumSafe(row.acml_vol ?? row.tvol ?? row.acc_trdvol ?? 0) === 0;
  const valZero = toNumSafe(row.acml_tr_pbmn ?? row.tamt ?? row.acc_trdval ?? 0) === 0;

  if (volZero && valZero) return true;

  const ohlcAllEq = Number.isFinite(o) && o === h && h === l && l === c;

  if (ohlcAllEq) {
    if (prevRow) {
      const prevClose = readNum(prevRow, KIS_KEYS.close);
      if (Number.isFinite(prevClose) && prevClose === c) return true;
    }
    // prevRow가 없을 때도 개장 전엔 거의 항상 더미로 취급해도 무방
    return true;
  }

  return false;
}
