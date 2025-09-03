import { NextRequest, NextResponse } from 'next/server';
import { Candle, CandlesResponseSchema } from '@/shared';
import { buildOutputFromCandlesDesc, type InputCandleDesc } from '@/lib/candle-builder';

type UpbitDayCandleBase = {
  market: string;
  candle_date_time_kst: string;
  opening_price: number;
  high_price: number;
  low_price: number;
  trade_price: number;
};

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

    const raw: UpbitDayCandleBase[] = await res.json(); // 최신→과거
    if (!Array.isArray(raw) || raw.length < longestNeeded) {
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

    const inputDesc: InputCandleDesc[] = raw.map((c) => ({
      timestamp: c.candle_date_time_kst,
      open: c.opening_price,
      high: c.high_price,
      low: c.low_price,
      close: c.trade_price,
    }));

    const { candles, lastRSI } = buildOutputFromCandlesDesc(inputDesc, {
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
