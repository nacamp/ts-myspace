import { z } from 'zod';

export const CandleSchema = z.object({
  timestamp: z.string(), // ISO-like 문자열 (JSON-safe)
  open: z.number(),
  high: z.number(),
  low: z.number(),
  close: z.number(),
  sma15: z.number().nullable(),
  sma50: z.number().nullable(),
  rsi: z.number().nullable(),
});

export const CandlesResponseSchema = z.object({
  code: z.string(),
  rsiPeriod: z.number().int().positive().optional(),
  count: z.number().int().nonnegative().optional(),
  candles: z.array(CandleSchema), // 최신→과거
  lastRSI: z.number().nullable().optional(),
});

export type Candle = z.infer<typeof CandleSchema>;
export type CandlesResponse = z.infer<typeof CandlesResponseSchema>;
