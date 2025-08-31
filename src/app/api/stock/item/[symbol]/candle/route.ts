// app/api/kis/daily-stock/[symbol]/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { RSI, SMA } from 'trading-signals';
import { env } from '@/config/env.server';
import { getKisToken } from '@/services/kis.server';

type KisRow = {
  stck_bsop_date: string; // YYYYMMDD (영업일)
  stck_clpr: string; // 종가
  stck_oprc: string; // 시가
  stck_hgpr: string; // 고가
  stck_lwpr: string; // 저가
  acml_vol?: string; // 거래량
  // 그 외 필드가 더 올 수 있음
};

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

/* ========= 유틸 ========= */
function toNumSafe(v: any): number {
  if (v == null) return NaN;
  const n = Number(String(v).replace(/,/g, '').trim());
  return Number.isFinite(n) ? n : NaN;
}
function ymdToKstIso(ymd: string, time = '09:00:00'): string {
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
function sortDescByYmd(rows: KisRow[]): KisRow[] {
  return [...rows].sort((a, b) => (a.stck_bsop_date < b.stck_bsop_date ? 1 : -1));
}

/* ========= 지표 계산 (과거→현재) ========= */
function computeRSISeriesAsc(pricesAsc: number[], period: number): (number | null)[] {
  const rsi = new RSI(period);
  return pricesAsc.map((p) => {
    rsi.add(p);
    if (!rsi.isStable) return null;
    const v: any = rsi.getResultOrThrow();
    return typeof v?.toNumber === 'function' ? v.toNumber() : Number(v.toString());
  });
}
function computeSMAAsc(pricesAsc: number[], period: number): (number | null)[] {
  const sma = new SMA(period);
  return pricesAsc.map((p) => {
    sma.add(p);
    if (!sma.isStable) return null;
    const v: any = sma.getResultOrThrow();
    return typeof v?.toNumber === 'function' ? v.toNumber() : Number(v.toString());
  });
}

/* ========= KIS 호출 ========= */
async function fetchDailyItemCandles(symbol: string, accessToken: string) {
  const BASE = env.KIS_BASE_URL;
  const url = new URL('/uapi/domestic-stock/v1/quotations/inquire-daily-itemchartprice', BASE);

  // 오늘 기준으로 충분한 기간을 잡아 조회 (KIS는 보통 최신→과거 반환, 하지만 정렬은 우리가 보정)
  const end = formatDate(new Date());
  const startDateObj = new Date();
  startDateObj.setDate(startDateObj.getDate() - 200); // 여유 있게 200영업일 전
  const start = formatDate(startDateObj);

  url.searchParams.set('FID_COND_MRKT_DIV_CODE', 'J'); // 종목
  url.searchParams.set('FID_INPUT_ISCD', symbol);
  url.searchParams.set('FID_PERIOD_DIV_CODE', 'D'); // 일봉
  url.searchParams.set('FID_ORG_ADJ_PRC', '0'); // (필요시 수정주가 옵션)
  url.searchParams.set('FID_INPUT_DATE_1', start);
  url.searchParams.set('FID_INPUT_DATE_2', end);

  const kisRes = await fetch(url.toString(), {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      authorization: `Bearer ${accessToken}`,
      appkey: env.KIS_APP_KEY,
      appsecret: env.KIS_APP_SECRET,
      tr_id: 'FHKST03010100', // 일봉(기간별 시세) TR_ID
    },
  });

  if (!kisRes.ok) {
    throw new Error(`KIS error ${kisRes.status}: ${await kisRes.text()}`);
  }

  const data = await kisRes.json();
  const rows: KisRow[] = Array.isArray(data?.output2) ? data.output2 : [];
  if (!rows.length) throw new Error('Empty rows from KIS');

  return rows;
}

/* ========= 라우트 ========= */
export async function GET(req: NextRequest, { params }: { params: { symbol: string } }) {
  try {
    const { searchParams } = new URL(req.url);
    const symbol = params.symbol || '069500'; // KODEX 200
    const period = Math.max(2, Number(searchParams.get('period') ?? 14));
    const count = 2; // 최신 2개만

    const accessToken = await getKisToken();

    // 1) KIS 호출
    const rowsRaw = await fetchDailyItemCandles(symbol, accessToken);

    // 2) 날짜 내림차순 정렬(최신→과거)로 보정
    const rowsDesc = sortDescByYmd(rowsRaw);

    // 3) 지표 계산은 과거→현재
    const rowsAsc = [...rowsDesc].reverse();

    const closesAsc = rowsAsc.map((r) => toNumSafe(r.stck_clpr));
    const rsiAsc = computeRSISeriesAsc(closesAsc, period);
    const sma15Asc = computeSMAAsc(closesAsc, 15);
    const sma50Asc = computeSMAAsc(closesAsc, 50);

    // 4) 최신 2개만 생성
    const latestRowsDesc = rowsDesc.slice(0, count);
    const rsiDesc = rsiAsc.slice(-count).reverse();
    const sma15Desc = sma15Asc.slice(-count).reverse();
    const sma50Desc = sma50Asc.slice(-count).reverse();

    const candles: OutputCandle[] = latestRowsDesc.map((r, i) => ({
      timestamp: ymdToKstIso(r.stck_bsop_date, '09:00:00'),
      open: toNumSafe(r.stck_oprc),
      high: toNumSafe(r.stck_hgpr),
      low: toNumSafe(r.stck_lwpr),
      close: toNumSafe(r.stck_clpr),
      sma15: Number.isFinite(sma15Desc[i] as number) ? (sma15Desc[i] as number) : null,
      sma50: Number.isFinite(sma50Desc[i] as number) ? (sma50Desc[i] as number) : null,
      rsi: Number.isFinite(rsiDesc[i] as number) ? (rsiDesc[i] as number) : null,
    }));

    const lastRSI = candles[0]?.rsi ?? null;

    return NextResponse.json({
      symbol,
      period, // RSI 기간
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
