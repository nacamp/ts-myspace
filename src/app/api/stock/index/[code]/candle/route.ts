// app/api/kis/daily-rsi/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { RSI } from 'trading-signals';
import { env } from '@/config/env.server';
import { getKisToken } from '@/services/kis.server';

type KisDailyIndexItem = Record<string, string>;

type CandleBase = {
  market: string;
  candle_date_time_kst: string;
  opening_price: number;
  high_price: number;
  low_price: number;
  trade_price: number;
  volume?: number;
};
type CandleWithRSI = CandleBase & { rsi: number | null };

// 쉼표/공백 제거 후 안전 숫자 변환
function toNumSafe(v: any): number {
  if (v == null) return NaN;
  const n = Number(String(v).replace(/,/g, '').trim());
  return Number.isFinite(n) ? n : NaN;
}

// 여러 키 후보 중 처음 존재하는 값을 선택
function pick<T = string>(row: Record<string, any>, keys: string[], toNum = false): any {
  for (const k of keys) {
    if (row[k] != null) return toNum ? toNumSafe(row[k]) : (row[k] as T);
  }
  return toNum ? NaN : undefined;
}

function computeRSISeriesAsc(pricesAsc: number[], period: number): (number | null)[] {
  const rsi = new RSI(period);
  return pricesAsc.map((p) => {
    rsi.update(p);
    if (!rsi.isStable) return null;
    const v: any = rsi.getResultOrThrow();
    return typeof v?.toNumber === 'function' ? v.toNumber() : parseFloat(v.toString());
  });
}

function formatDate(date: Date): string {
  const yyyy = date.getFullYear();
  const mm = String(date.getMonth() + 1).padStart(2, '0');
  const dd = String(date.getDate()).padStart(2, '0');
  return `${yyyy}${mm}${dd}`;
}

export async function GET(
  req: NextRequest,
  { params }: { params: { code: string } }, // ← 여기서 code를 받음
) {
  try {
    const { searchParams } = new URL(req.url);

    // 기본 지수 코드: 0001 (KIS 코드테이블 확인 권장)
    // const indexCode = searchParams.get('index') ?? '0001';
    const indexCode = params.code || '0001';
    const count = Math.max(1, Number(searchParams.get('count') ?? 3));
    const period = Math.max(2, Number(searchParams.get('period') ?? 14));

    const BASE = env.KIS_BASE_URL;
    const APP_KEY = env.KIS_APP_KEY;
    const APP_SECRET = env.KIS_APP_SECRET;

    // 업종/지수 기간별 시세 TR_ID (개발자 포털 값으로 맞춰주세요)
    const TR_ID = 'FHKUP03500100';

    // 조회 구간
    const endDateObj = new Date();
    const startDateObj = new Date();
    startDateObj.setDate(endDateObj.getDate() - (period + count + 6));
    const start = formatDate(startDateObj);
    const end = formatDate(endDateObj);

    // 엔드포인트: 업종/지수 기간별 시세(일/주/월/년)
    const url = new URL('/uapi/domestic-stock/v1/quotations/inquire-daily-indexchartprice', BASE);
    url.searchParams.set('FID_COND_MRKT_DIV_CODE', 'U'); // 업종/지수
    url.searchParams.set('FID_INPUT_ISCD', indexCode); // 지수 코드
    url.searchParams.set('FID_PERIOD_DIV_CODE', 'D'); // 일봉
    url.searchParams.set('FID_INPUT_DATE_1', start);
    url.searchParams.set('FID_INPUT_DATE_2', end);

    const accessToken = await getKisToken();

    const kisRes = await fetch(url.toString(), {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json; charset=utf-8',
        custtype: 'P',
        authorization: `Bearer ${accessToken}`,
        appkey: APP_KEY,
        appsecret: APP_SECRET,
        tr_id: TR_ID,
      },
    });

    if (!kisRes.ok) {
      const detail = await kisRes.text();
      return NextResponse.json({ error: 'KIS API error', detail }, { status: kisRes.status });
    }

    const data = await kisRes.json();
    const rows: KisDailyIndexItem[] = Array.isArray(data?.output2) ? data.output2 : [];

    if (rows.length < period) {
      return NextResponse.json({
        index: indexCode,
        period,
        start,
        end,
        count: 0,
        candles: [] as CandleWithRSI[],
        lastRSI: null,
        note: 'Not enough candles from KIS (index endpoint) to compute RSI',
      });
    }

    // 최신 -> 과거 응답을 과거 -> 최신으로 뒤집어 RSI 계산
    const rowsAsc = [...rows].reverse();

    // 날짜/가격/거래량 후보 키들 (지수 전용 bstp_nmix_* 우선)
    const dateKeys = ['stck_bsop_date', 'bsop_date', 'trdd', 'tdd_clsprc_dt'];
    const closeKeys = ['bstp_nmix_prpr', 'idx_clpr', 'stck_clpr', 'clsprc'];
    const openKeys = ['bstp_nmix_oprc', 'idx_oprc', 'stck_oprc', 'opnprc'];
    const highKeys = ['bstp_nmix_hgpr', 'idx_hgpr', 'stck_hgpr', 'hgprc'];
    const lowKeys = ['bstp_nmix_lwpr', 'idx_lwpr', 'stck_lwpr', 'lwprc'];
    const volKeys = ['acml_vol', 'sum_vol', 'tvol', 'trqu'];

    // RSI(종가 기반)
    const closesAsc = rowsAsc.map((r) => pick<number>(r, closeKeys, true));
    const rsiAsc = computeRSISeriesAsc(closesAsc, period);
    const rsiDesc = [...rsiAsc].reverse();

    const latestRowsDesc = rows.slice(0, Math.min(count, rows.length));
    const latestRsiDesc = rsiDesc.slice(0, latestRowsDesc.length);

    const candles: CandleWithRSI[] = latestRowsDesc.map((r, i) => ({
      market: indexCode,
      candle_date_time_kst: pick<string>(r, dateKeys) ?? '',
      opening_price: pick<number>(r, openKeys, true),
      high_price: pick<number>(r, highKeys, true),
      low_price: pick<number>(r, lowKeys, true),
      trade_price: pick<number>(r, closeKeys, true),
      volume: pick<number>(r, volKeys, true),
      rsi: latestRsiDesc[i] ?? null,
    }));

    const lastRSI = candles[0]?.rsi ?? null;

    return NextResponse.json({
      index: indexCode,
      period,
      start,
      end,
      count: candles.length,
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
