import { NextRequest, NextResponse } from "next/server";
import { RSI } from "trading-signals";

type UpbitDayCandleBase = {
  market: string;
  candle_date_time_kst: string;
  opening_price: number;
  high_price: number;
  low_price: number;
  trade_price: number;
};

type UpbitDayCandle = UpbitDayCandleBase & { rsi: number | null };

function computeRSISeriesAsc(pricesAsc: number[], period: number): (number | null)[] {
  const rsi = new RSI(period);
  return pricesAsc.map((p) => {
    // 확정 일봉이므로 두 번째 인자는 생략(=true)하거나 true로 전달
    rsi.update(p);
    if (!rsi.isStable) return null;
    const v: any = rsi.getResultOrThrow();
    return typeof v?.toNumber === "function" ? v.toNumber() : parseFloat(v.toString());
  });
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const market = searchParams.get("market") ?? "KRW-BTC";
    const count = Math.max(1, Number(searchParams.get("count") ?? 3));
    const period = Math.max(2, Number(searchParams.get("period") ?? 14));

    // 넉넉히 요청 (period + count)로 확보 → 필요한 만큼만 잘라 사용
    const needed = period + count;
    const upstream = new URL("https://api.upbit.com/v1/candles/days");
    upstream.searchParams.set("market", market);
    upstream.searchParams.set("count", String(needed));

    const res = await fetch(upstream.toString(), { headers: { Accept: "application/json" } });
    if (!res.ok) {
      const text = await res.text();
      return NextResponse.json({ error: "Upbit API error", detail: text }, { status: res.status });
    }

    const candlesDescRaw: UpbitDayCandleBase[] = await res.json(); // 최신→과거
    if (!Array.isArray(candlesDescRaw) || candlesDescRaw.length < period) {
      return NextResponse.json({
        market,
        period,
        count: 0,
        candles: [] as UpbitDayCandle[],
        lastRSI: null,
        note: "Not enough candles from upstream to compute RSI",
      });
    }

    // 1) RSI 계산은 과거→최신
    const closesAsc = candlesDescRaw.map((c) => c.trade_price).reverse();

    // 2) 전체 RSI 시계열(과거→최신) 계산
    const rsiAsc = computeRSISeriesAsc(closesAsc, period);

    // 3) 최신 count개의 RSI만 추출해서 최신→과거로 뒤집기
    const latestRsiDesc = rsiAsc.slice(-count).reverse();

    // 4) 최신 count개의 캔들(최신→과거)과 병합
    const latestCandlesDesc = candlesDescRaw.slice(0, count);
    const candles: UpbitDayCandle[] = latestCandlesDesc.map((c, i) => ({
      ...c,
      rsi: latestRsiDesc[i] ?? null,
    }));

    // 최신 캔들의 RSI (최신→과거 배열에서 0번)
    const lastRSI = candles[0]?.rsi ?? null;

    return NextResponse.json({
      market,
      period,
      count: candles.length,
      candles,
      lastRSI,
    });
  } catch (err: any) {
    return NextResponse.json(
      { error: "Unexpected server error", detail: err?.message ?? String(err) },
      { status: 500 }
    );
  }
}
