// app/api/kis/daily-index/[code]/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { env } from '@/config/env.server';
import { getKisToken } from '@/services/kis.server';
import { Candle, CandlesResponseSchema } from '@/shared';
// import { computeRSISeriesAsc, computeSMASeriesAsc } from '@/lib/indicators';
import { buildOutputFromCandlesDesc, type InputCandleDesc, type BuildOptions } from '@/lib/candle-builder';

type KisRow = Record<string, any>;

/* ========== 공통 유틸 ========== */
function toNumSafe(v: any): number {
  if (v == null) return NaN;
  const n = Number(String(v).replace(/,/g, '').trim());
  return Number.isFinite(n) ? n : NaN;
}
function pick<T = string>(row: Record<string, any>, keys: string[], toNum = false): any {
  for (const k of keys) {
    if (row[k] != null) return toNum ? toNumSafe(row[k]) : (row[k] as T);
  }
  return toNum ? NaN : undefined;
}
function ymdToKstIso(ymd: string, time: string = '09:00:00'): string {
  if (!ymd || ymd.length < 8) return '';
  const y = ymd.slice(0, 4);
  const m = ymd.slice(4, 6);
  const d = ymd.slice(6, 8);
  return `${y}-${m}-${d}T${time}`;
}
function formatDate(date: Date): string {
  const yyyy = date.getFullYear();
  const mm = String(date.getMonth() + 1).padStart(2, '0');
  const dd = String(date.getDate()).padStart(2, '0');
  return `${yyyy}${mm}${dd}`;
}

/* ========== 날짜 키 추출 & 정렬 보정 ========== */
const DATE_KEYS = [
  'stck_bsop_date',
  'bsop_date',
  'trdd',
  'tdd_clsprc_dt',
  'bas_dt', // 일부 응답에서 사용
]; // 모두 YYYYMMDD 기대

function rowToYmd(row: KisRow): string {
  const ymd = pick<string>(row, DATE_KEYS);
  return typeof ymd === 'string' ? ymd.replace(/\D/g, '').slice(0, 8) : '';
}

function sortRowsDescByYmd(rows: KisRow[]): KisRow[] {
  // 유효 날짜만 남기고, ymd DESC로 정렬 (최신→과거)
  return rows
    .map((r) => ({ r, ymd: rowToYmd(r) }))
    .filter((x) => /^\d{8}$/.test(x.ymd))
    .sort((a, b) => (a.ymd < b.ymd ? 1 : a.ymd > b.ymd ? -1 : 0))
    .map((x) => x.r);
}

/* ===== 키셋(지수/종목 API마다 일부 키 다를 수 있어 후보 배열로) ===== */
const closeKeys = ['bstp_nmix_prpr', 'idx_clpr', 'stck_clpr', 'clsprc'];
const openKeys = ['bstp_nmix_oprc', 'idx_oprc', 'stck_oprc', 'opnprc'];
const highKeys = ['bstp_nmix_hgpr', 'idx_hgpr', 'stck_hgpr', 'hgprc'];
const lowKeys = ['bstp_nmix_lwpr', 'idx_lwpr', 'stck_lwpr', 'lwprc'];

// /* ===== BuildOptions & 계산기 (KIS 전용 1차 리팩터링) ===== */
// export type BuildOptions = {
//   rsiPeriod: number;
//   count: number; // 최종 반환 개수 (최신→과거)
//   longestNeeded: number; // 가장 긴 윈도우 (예: SMA50)
// };

/**
 * KIS rows(최신→과거)를 받아 RSI/SMA 계산해 Candle[] 반환
 * - Upbit 쪽은 이 변경의 영향 없음 (2차에 공통화 예정)
 */
// export function buildOutputFromCandles(
//   rowsDesc: KisRow[],
//   opts: BuildOptions,
// ): { candles: Candle[]; lastRSI: number | null } {
//   const { rsiPeriod, count, longestNeeded } = opts;

//   if (!Array.isArray(rowsDesc) || rowsDesc.length < longestNeeded) {
//     return { candles: [], lastRSI: null };
//   }

//   // 지표 계산은 과거→현재
//   const rowsAsc = [...rowsDesc].reverse();
//   const closesAsc = rowsAsc.map((r) => pick<number>(r, closeKeys, true));

//   // 전구간 계산
//   const rsiAsc = computeRSISeriesAsc(closesAsc, rsiPeriod);
//   const sma15Asc = computeSMASeriesAsc(closesAsc, 15);
//   const sma50Asc = computeSMASeriesAsc(closesAsc, 50);

//   // 최신 count개만 추출 후 최신→과거로 반전
//   const rsiDesc = rsiAsc.slice(-count).reverse();
//   const sma15Desc = sma15Asc.slice(-count).reverse();
//   const sma50Desc = sma50Asc.slice(-count).reverse();

//   // 원본 최신→과거 중 최신 count개
//   const latestRowsDesc = rowsDesc.slice(0, count);

//   const candles: Candle[] = latestRowsDesc.map((r, i) => {
//     const ymd = rowToYmd(r);
//     return {
//       timestamp: ymdToKstIso(ymd, '09:00:00'), // 프론트 규칙: KST ISO
//       open: pick<number>(r, openKeys, true),
//       high: pick<number>(r, highKeys, true),
//       low: pick<number>(r, lowKeys, true),
//       close: pick<number>(r, closeKeys, true),
//       sma15: Number.isFinite(sma15Desc[i] as number) ? (sma15Desc[i] as number) : null,
//       sma50: Number.isFinite(sma50Desc[i] as number) ? (sma50Desc[i] as number) : null,
//       rsi: Number.isFinite(rsiDesc[i] as number) ? (rsiDesc[i] as number) : null,
//     };
//   });

//   const lastRSI = candles[0]?.rsi ?? null; // ✅ Upbit과 동일한 패턴
//   return { candles, lastRSI };
// }

/* ========== KIS 호출: inquire-index-daily-price (당일 기준) ========== */
async function fetchIndexDailyPrice(indexCode: string, accessToken: string) {
  const BASE = env.KIS_BASE_URL;
  const url = new URL('/uapi/domestic-stock/v1/quotations/inquire-index-daily-price', BASE);

  // 오늘 날짜 기준으로 100개 과거분 조회
  const today = formatDate(new Date());

  url.searchParams.set('FID_COND_MRKT_DIV_CODE', 'U'); // 업종/지수
  url.searchParams.set('FID_INPUT_ISCD', indexCode); // 지수 코드
  url.searchParams.set('FID_PERIOD_DIV_CODE', 'D'); // 일봉
  url.searchParams.set('FID_INPUT_DATE_1', today); // 기준일(오늘)부터 과거로 조회
  // FID_INPUT_DATE_2 불필요

  const kisRes = await fetch(url.toString(), {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      custtype: 'P',
      authorization: `Bearer ${accessToken}`,
      appkey: env.KIS_APP_KEY,
      appsecret: env.KIS_APP_SECRET,
      tr_id: 'FHPUP02120000', // 문서 기준 일봉 조회 TR_ID
    },
  });

  if (!kisRes.ok) throw new Error(`[KIS] ${kisRes.status} ${await kisRes.text()}`);

  const data = await kisRes.json();
  const rows: KisRow[] = Array.isArray(data?.output2) ? data.output2 : [];
  if (!rows.length) throw new Error('[KIS] empty rows');

  return rows; // 정렬은 아래에서 보정
}

export async function GET(req: NextRequest, { params }: { params: { code: string } }) {
  try {
    const { searchParams } = new URL(req.url);
    const indexCode = params.code || '0001';
    const period = Math.max(2, Number(searchParams.get('period') ?? 14));
    const count = 2; // 최신 2개만 응답
    const longestNeeded = 50;

    const accessToken = await getKisToken();

    // 1) KIS 호출 (오늘 기준으로 100개 과거분)
    const rowsRaw = await fetchIndexDailyPrice(indexCode, accessToken);

    // 2) 날짜 기준 내림차순 정렬 (최신→과거)
    const rowsDesc = sortRowsDescByYmd(rowsRaw);

    const inputDesc: InputCandleDesc[] = rowsDesc.map((r) => {
      const ymd = rowToYmd(r);
      return {
        timestamp: ymdToKstIso(ymd, '09:00:00'),
        open: pick<number>(r, openKeys, true),
        high: pick<number>(r, highKeys, true),
        low: pick<number>(r, lowKeys, true),
        close: pick<number>(r, closeKeys, true),
      };
    });
    const { candles, lastRSI } = buildOutputFromCandlesDesc(inputDesc, {
      rsiPeriod: period,
      count,
      longestNeeded,
    });
    // const { candles, lastRSI } = buildOutputFromCandles(rowsDesc, {
    //   rsiPeriod: period,
    //   count,
    //   longestNeeded,
    // });

    return NextResponse.json(
      CandlesResponseSchema.parse({
        code: indexCode,
        rsiPeriod: period,
        count: candles.length,
        candles: candles,
        lastRSI: lastRSI,
      }),
      { status: 200 },
    );
  } catch (err: any) {
    return NextResponse.json(
      { error: 'Unexpected server error', detail: err?.message ?? String(err) },
      { status: 500 },
    );
  }
}
