import { NextRequest, NextResponse } from 'next/server';
import { computeRSISeriesAsc, computeSMASeriesAsc } from '@/lib/indicators';
import { Candle, CandlesResponseSchema } from '@/shared';

type UpbitDayCandleBase = {
  market: string;
  candle_date_time_kst: string;
  opening_price: number;
  high_price: number;
  low_price: number;
  trade_price: number;
};

export type BuildOptions = {
  rsiPeriod: number;
  count: number; // 최종 반환 개수 (최신→과거)
  longestNeeded: number; // SMA50 등 가장 긴 윈도우
};

export function buildOutputFromCandles(
  candlesDescRaw: UpbitDayCandleBase[],
  opts: BuildOptions,
): { candles: Candle[]; lastRSI: number | null } {
  const { rsiPeriod, count, longestNeeded } = opts;

  if (!Array.isArray(candlesDescRaw) || candlesDescRaw.length < longestNeeded) {
    return { candles: [], lastRSI: null };
  }

  // 지표 입력 종가: 과거→최신
  const closesAsc = [...candlesDescRaw].reverse().map((c) => c.trade_price);

  // 전구간 계산
  const rsiAsc = computeRSISeriesAsc(closesAsc, rsiPeriod);
  const sma15Asc = computeSMASeriesAsc(closesAsc, 15);
  const sma50Asc = computeSMASeriesAsc(closesAsc, 50);

  // 최신 count개만 추출 후 최신→과거
  const rsiDesc = rsiAsc.slice(-count).reverse();
  const sma15Desc = sma15Asc.slice(-count).reverse();
  const sma50Desc = sma50Asc.slice(-count).reverse();

  // 원본 최신→과거 중 최신 count개
  const latestCandlesDesc = candlesDescRaw.slice(0, count);

  const candles: Candle[] = latestCandlesDesc.map((c, i) => ({
    timestamp: c.candle_date_time_kst,
    open: c.opening_price,
    high: c.high_price,
    low: c.low_price,
    close: c.trade_price,
    sma15: sma15Desc[i] ?? null,
    sma50: sma50Desc[i] ?? null,
    rsi: rsiDesc[i] ?? null,
  }));

  const lastRSI = candles[0]?.rsi ?? null;
  return { candles, lastRSI };
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const market = searchParams.get('market') ?? 'KRW-BTC';
    const rsiPeriod = 14;
    const count = 2; // ✅ 최근 2일치만 반환
    const longestNeeded = 50;
    // 계산을 위해 윈도우 + 반환 건수만큼 확보
    const needed = longestNeeded + count;

    const upstream = new URL('https://api.upbit.com/v1/candles/days');
    upstream.searchParams.set('market', market);
    upstream.searchParams.set('count', String(needed));

    const res = await fetch(upstream.toString(), { headers: { Accept: 'application/json' } });
    if (!res.ok) {
      const text = await res.text();
      return NextResponse.json({ error: 'Upbit API error', detail: text }, { status: res.status });
    }

    const candlesDescRaw: UpbitDayCandleBase[] = await res.json(); // 최신→과거
    if (!Array.isArray(candlesDescRaw) || candlesDescRaw.length < longestNeeded) {
      return NextResponse.json(
        CandlesResponseSchema.parse({
          code: market,
          rsiPeriod,
          count: 0,
          candles: [] as Candle[],
          lastRSI: null,
          note: 'Not enough candles from upstream to compute SMA50/RSI',
        }),
        { status: 200 },
      );
    }

    const { candles, lastRSI } = buildOutputFromCandles(candlesDescRaw, {
      rsiPeriod,
      count,
      longestNeeded,
    });

    return NextResponse.json(
      CandlesResponseSchema.parse({
        code: market,
        rsiPeriod,
        count: candles.length, // 항상 2
        candles, // 최신→과거
        lastRSI, // 가장 최신 캔들의 RSI
      }),
      { status: 200 },
    );
  } catch (err) {
    if (err instanceof Error) {
      return NextResponse.json({ error: 'Unexpected server error', detail: err.message }, { status: 500 });
    }
    return NextResponse.json({ error: 'Unexpected server error', detail: String(err) }, { status: 500 });
  }
}
