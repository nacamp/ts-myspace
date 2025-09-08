// src/lib/candle-builder.ts
import { computeRSISeriesAsc, computeSMASeriesAsc } from '@/lib/indicators';
import type { Candle } from '@/shared';

export type BuildOptions = {
  rsiPeriod: number;
  shortMAPeriod: number; // 🔹 추가
  longMAPeriod: number; // 🔹 추가
  count: number; // 최종 반환 개수 (최신→과거)
  longestNeeded?: number; // (선택) 외부에서 강제로 지정하고 싶을 때만 사용
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
  const { rsiPeriod, shortMAPeriod, longMAPeriod, count, longestNeeded } = opts;

  // 필요한 최소 윈도우를 내부에서 안전하게 계산
  const requiredWindow = Math.max(rsiPeriod, shortMAPeriod, longMAPeriod);
  const minNeeded = longestNeeded ? Math.max(requiredWindow, longestNeeded) : requiredWindow;

  if (!Array.isArray(candlesDesc) || candlesDesc.length < minNeeded) {
    return { candles: [], lastRSI: null };
  }

  // 지표 입력은 과거→현재
  const closesAsc = [...candlesDesc].reverse().map((c) => c.close);

  const rsiAsc = computeRSISeriesAsc(closesAsc, rsiPeriod);
  const shortMAAsc = computeSMASeriesAsc(closesAsc, shortMAPeriod);
  const longMAAsc = computeSMASeriesAsc(closesAsc, longMAPeriod);

  // 최신 count개만 추출 → 최신→과거
  const rsiDesc = rsiAsc.slice(-count).reverse();
  const shortMADesc = shortMAAsc.slice(-count).reverse();
  const longMADesc = longMAAsc.slice(-count).reverse();

  // 원본 최신→과거 중 최신 count개
  const latestDesc = candlesDesc.slice(0, count);

  const candles: Candle[] = latestDesc.map((c, i) => ({
    timestamp: c.timestamp,
    open: c.open,
    high: c.high,
    low: c.low,
    close: c.close,
    shortMA: Number.isFinite(shortMADesc[i] as number) ? (shortMADesc[i] as number) : null,
    longMA: Number.isFinite(longMADesc[i] as number) ? (longMADesc[i] as number) : null,
    rsi: Number.isFinite(rsiDesc[i] as number) ? (rsiDesc[i] as number) : null,
  }));

  const lastRSI = candles[0]?.rsi ?? null;
  return { candles, lastRSI };
}
