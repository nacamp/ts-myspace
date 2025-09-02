import { RSI, SMA } from 'trading-signals';

export function computeRSISeriesAsc(pricesAsc: number[], period: number): (number | null)[] {
  const rsi = new RSI(period);
  return pricesAsc.map((p) => {
    rsi.add(p);
    if (!rsi.isStable) return null;
    const v = rsi.getResultOrThrow();
    return typeof v?.toNumber === 'function' ? v.toNumber() : Number(v.toString());
  });
}

export function computeSMASeriesAsc(pricesAsc: number[], period: number): (number | null)[] {
  const sma = new SMA(period);
  return pricesAsc.map((p) => {
    sma.add(p);
    if (!sma.isStable) return null;
    const v = sma.getResultOrThrow();
    return typeof v?.toNumber === 'function' ? v.toNumber() : Number(v.toString());
  });
}
