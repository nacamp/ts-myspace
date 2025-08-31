import { NextRequest, NextResponse } from 'next/server';
import { RSI, SMA } from 'trading-signals';

type UpbitDayCandleBase = {
  market: string;
  candle_date_time_kst: string;
  opening_price: number;
  high_price: number;
  low_price: number;
  trade_price: number;
};

type OutputCandle = {
  timestamp: string;
  open: number;
  high: number;
  low: number;
  close: number;
  sma15: number | null;
  sma50: number | null;
  rsi: number | null;
};

function toNumber(x: unknown): number {
  if (x == null) return NaN;
  // trading-signals BigLike 대응
  // @ts-ignore
  if (typeof x?.toNumber === 'function') return x.toNumber();
  const n = Number.parseFloat(String(x));
  return Number.isFinite(n) ? n : NaN;
}

function computeRSISeriesAsc(pricesAsc: number[], period: number): (number | null)[] {
  const rsi = new RSI(period);
  return pricesAsc.map((p) => {
    rsi.add(p); // ✅ add 사용
    return rsi.isStable ? toNumber(rsi.getResultOrThrow()) : null;
  });
}

function computeSMASeriesAsc(pricesAsc: number[], period: number): (number | null)[] {
  const sma = new SMA(period);
  return pricesAsc.map((p) => {
    sma.add(p); // ✅ add 사용
    return sma.isStable ? toNumber(sma.getResultOrThrow()) : null;
  });
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
        {
          market,
          rsiPeriod,
          count: 0,
          candles: [] as OutputCandle[],
          lastRSI: null,
          note: 'Not enough candles from upstream to compute SMA50/RSI',
        },
        { status: 200 },
      );
    }

    // 지표 입력용 종가 시계열: 과거→최신
    const closesAsc = candlesDescRaw.map((c) => c.trade_price).reverse();

    // 지표 전 구간 계산(과거→최신)
    const rsiAsc = computeRSISeriesAsc(closesAsc, rsiPeriod);
    const sma15Asc = computeSMASeriesAsc(closesAsc, 15);
    const sma50Asc = computeSMASeriesAsc(closesAsc, 50);

    // 최신 count개만 추출 후 최신→과거 정렬
    const rsiDesc = rsiAsc.slice(-count).reverse();
    const sma15Desc = sma15Asc.slice(-count).reverse();
    const sma50Desc = sma50Asc.slice(-count).reverse();

    // 원본 캔들도 최신→과거 2개만
    const latestCandlesDesc = candlesDescRaw.slice(0, count);

    // 출력 매핑
    const candles: OutputCandle[] = latestCandlesDesc.map((c, i) => ({
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

    return NextResponse.json(
      {
        market,
        rsiPeriod,
        count: candles.length, // 항상 2
        candles, // 최신→과거
        lastRSI, // 가장 최신 캔들의 RSI
      },
      { status: 200 },
    );
  } catch (err: any) {
    return NextResponse.json(
      { error: 'Unexpected server error', detail: err?.message ?? String(err) },
      { status: 500 },
    );
  }
}
