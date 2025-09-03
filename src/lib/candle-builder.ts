// src/lib/candle-builder.ts
import { computeRSISeriesAsc, computeSMASeriesAsc } from '@/lib/indicators';
import type { Candle } from '@/shared';

export type BuildOptions = {
  rsiPeriod: number;
  count: number; // 최종 반환 개수 (최신→과거)
  longestNeeded: number; // 가장 긴 윈도우(예: SMA50)
};

// 공통 입력 포맷: 최신→과거
export type InputCandleDesc = {
  timestamp: string; // ISO 같은 문자열 (표시용)
  open: number;
  high: number;
  low: number;
  close: number;
};

/**
 * 최신→과거(InputCandleDesc[])를 받아 RSI/SMA 계산 후
 * 최신→과거(Candle[])로 반환
 */
export function buildOutputFromCandlesDesc(
  candlesDesc: InputCandleDesc[],
  opts: BuildOptions,
): { candles: Candle[]; lastRSI: number | null } {
  const { rsiPeriod, count, longestNeeded } = opts;

  if (!Array.isArray(candlesDesc) || candlesDesc.length < longestNeeded) {
    return { candles: [], lastRSI: null };
  }

  // 지표 입력은 과거→현재
  const closesAsc = [...candlesDesc].reverse().map((c) => c.close);

  const rsiAsc = computeRSISeriesAsc(closesAsc, rsiPeriod);
  const sma15Asc = computeSMASeriesAsc(closesAsc, 15);
  const sma50Asc = computeSMASeriesAsc(closesAsc, 50);

  // 최신 count개만 추출 → 최신→과거
  const rsiDesc = rsiAsc.slice(-count).reverse();
  const sma15Desc = sma15Asc.slice(-count).reverse();
  const sma50Desc = sma50Asc.slice(-count).reverse();

  // 원본 최신→과거 중 최신 count개
  const latestDesc = candlesDesc.slice(0, count);

  const candles: Candle[] = latestDesc.map((c, i) => ({
    timestamp: c.timestamp,
    open: c.open,
    high: c.high,
    low: c.low,
    close: c.close,
    sma15: Number.isFinite(sma15Desc[i] as number) ? (sma15Desc[i] as number) : null,
    sma50: Number.isFinite(sma50Desc[i] as number) ? (sma50Desc[i] as number) : null,
    rsi: Number.isFinite(rsiDesc[i] as number) ? (rsiDesc[i] as number) : null,
  }));

  const lastRSI = candles[0]?.rsi ?? null;
  return { candles, lastRSI };
}
