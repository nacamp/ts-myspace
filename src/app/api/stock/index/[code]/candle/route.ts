// app/api/kis/daily-index/[code]/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { RSI, SMA } from 'trading-signals';
import { env } from '@/config/env.server';
import { getKisToken } from '@/services/kis.server';

type KisRow = Record<string, any>;

type OutputCandle = {
  timestamp: string; // "YYYY-MM-DDTHH:mm:ss" (KST 가정)
  open: number;
  high: number;
  low: number;
  close: number;
  sma15: number | null;
  sma50: number | null;
  rsi: number | null;
};

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

/* ========== 인디케이터 계산 (ASC: 과거→현재) ========== */
function computeRSISeriesAsc(pricesAsc: number[], period: number): (number | null)[] {
  const rsi = new RSI(period);
  return pricesAsc.map((p) => {
    rsi.add(p);
    if (!rsi.isStable) return null;
    const v: any = rsi.getResultOrThrow();
    return typeof v?.toNumber === 'function' ? v.toNumber() : Number(v.toString());
  });
}
function computeSMASeriesAsc(pricesAsc: number[], period: number): (number | null)[] {
  const sma = new SMA(15); // placeholder, 실제 period는 아래에서 새 인스턴스 사용
  // 위 한 줄은 타입 힌트용으로 보이나 혼동 줄이려면 함수 분리:
  return pricesAsc.map((_, i) => null); // 이 줄은 실제 사용 안 됨
}
// 👉 위 혼동 방지: SMA는 아래 헬퍼로 계산
function computeSMAAsc(pricesAsc: number[], period: number): (number | null)[] {
  const sma = new SMA(period);
  return pricesAsc.map((p) => {
    sma.add(p);
    if (!sma.isStable) return null;
    const v: any = sma.getResultOrThrow();
    return typeof v?.toNumber === 'function' ? v.toNumber() : Number(v.toString());
  });
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

/* ========== 라우트 ========== */
export async function GET(req: NextRequest, { params }: { params: { code: string } }) {
  try {
    const { searchParams } = new URL(req.url);
    const indexCode = params.code || '0001';
    const period = Math.max(2, Number(searchParams.get('period') ?? 14));
    const count = 2; // 최신 2개만 응답

    const accessToken = await getKisToken();

    // 1) KIS 호출 (오늘 기준으로 100개 과거분)
    const rowsRaw = await fetchIndexDailyPrice(indexCode, accessToken);

    // 2) 날짜 기준 내림차순 정렬 (최신→과거)
    const rowsDesc = sortRowsDescByYmd(rowsRaw);

    // 3) 지표 계산은 과거→현재
    const rowsAsc = [...rowsDesc].reverse();

    const closeKeys = ['bstp_nmix_prpr', 'idx_clpr', 'stck_clpr', 'clsprc'];
    const openKeys = ['bstp_nmix_oprc', 'idx_oprc', 'stck_oprc', 'opnprc'];
    const highKeys = ['bstp_nmix_hgpr', 'idx_hgpr', 'stck_hgpr', 'hgprc'];
    const lowKeys = ['bstp_nmix_lwpr', 'idx_lwpr', 'stck_lwpr', 'lwprc'];

    const closesAsc = rowsAsc.map((r) => pick<number>(r, closeKeys, true));

    const rsiAsc = computeRSISeriesAsc(closesAsc, period);
    const sma15Asc = computeSMAAsc(closesAsc, 15);
    const sma50Asc = computeSMAAsc(closesAsc, 50);

    // 4) 최신 2개 생성
    const latestRowsDesc = rowsDesc.slice(0, count);
    const rsiDesc = rsiAsc.slice(-count).reverse();
    const sma15Desc = sma15Asc.slice(-count).reverse();
    const sma50Desc = sma50Asc.slice(-count).reverse();

    const candles: OutputCandle[] = latestRowsDesc.map((r, i) => {
      const ymd = rowToYmd(r);
      return {
        timestamp: ymdToKstIso(ymd, '09:00:00'), // 프론트 규칙: KST ISO
        open: pick<number>(r, openKeys, true),
        high: pick<number>(r, highKeys, true),
        low: pick<number>(r, lowKeys, true),
        close: pick<number>(r, closeKeys, true),
        sma15: Number.isFinite(sma15Desc[i] as number) ? (sma15Desc[i] as number) : null,
        sma50: Number.isFinite(sma50Desc[i] as number) ? (sma50Desc[i] as number) : null,
        rsi: Number.isFinite(rsiDesc[i] as number) ? (rsiDesc[i] as number) : null,
      };
    });

    const lastRSI = candles[0]?.rsi ?? null;

    return NextResponse.json({
      index: indexCode,
      period,
      count: candles.length, // 2
      candles, // 최신 → 과거
      lastRSI,
    });
  } catch (err: any) {
    return NextResponse.json(
      { error: 'Unexpected server error', detail: err?.message ?? String(err) },
      { status: 500 },
    );
  }
}
