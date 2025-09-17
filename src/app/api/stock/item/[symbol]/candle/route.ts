import { NextRequest, NextResponse } from 'next/server';
import { getKisToken } from '@/services/kis.server';
import { CandlesResponseSchema } from '@/shared';
import { buildOutputFromCandlesDesc, type InputCandleDesc } from '@/lib/candle-builder';
import { fetchDailyItemCandles } from '@/lib/kis-fetchers';
import { sortRowsDescByYmd, rowToYmd, ymdToKstIso, pick, KIS_KEYS, isPreOpenDummy } from '@/lib/kis-utils';

export async function GET(req: NextRequest, { params }: { params: Promise<{ symbol: string }> }) {
  try {
    const { searchParams } = new URL(req.url);
    const { symbol = '069500' } = await params;

    const rsiPeriod = Math.max(2, Number(searchParams.get('period') ?? 14));
    const count = 3;
    //const longestNeeded = 50;

    const accessToken = await getKisToken();

    const rowsRaw = await fetchDailyItemCandles(symbol, accessToken);
    const rowsDesc = sortRowsDescByYmd(rowsRaw);

    // 개장 전 더미 제거
    const rowsDescClean = rowsDesc.length && isPreOpenDummy(rowsDesc[0], rowsDesc[1]) ? rowsDesc.slice(1) : rowsDesc;

    const inputDesc: InputCandleDesc[] = rowsDescClean.map((r) => {
      const ymd = rowToYmd(r);
      return {
        timestamp: ymdToKstIso(ymd, '09:00:00'),
        open: pick(r, KIS_KEYS.open, true),
        high: pick(r, KIS_KEYS.high, true),
        low: pick(r, KIS_KEYS.low, true),
        close: pick(r, KIS_KEYS.close, true),
      };
    });

    const { candles, lastRSI } = buildOutputFromCandlesDesc(inputDesc, {
      shortMAPeriod: 20,
      longMAPeriod: 60,
      rsiPeriod,
      count,
      //longestNeeded,
    });

    return NextResponse.json(
      CandlesResponseSchema.parse({
        code: symbol,
        rsiPeriod,
        count: candles.length,
        candles,
        lastRSI,
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
