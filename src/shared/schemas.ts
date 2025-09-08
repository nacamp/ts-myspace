import { z } from 'zod';

export const CandleSchema = z.object({
  timestamp: z.string(), // ISO-like 문자열 (JSON-safe)
  open: z.number(),
  high: z.number(),
  low: z.number(),
  close: z.number(),
  shortMA: z.number().nullable(),
  longMA: z.number().nullable(),
  rsi: z.number().nullable(),
});

export const CandlesResponseSchema = z.object({
  code: z.string(),
  rsiPeriod: z.number().int().positive().optional(),
  count: z.number().int().nonnegative().optional(),
  candles: z.array(CandleSchema), // 최신→과거
  lastRSI: z.number().nullable().optional(),
});

export const FxResponseSchema = z.object({
  timestamp: z.number(),
  rate: z.number(),
  source: z.string().optional(), // 옵션: API 제공자
});

export type Candle = z.infer<typeof CandleSchema>;
export type CandlesResponse = z.infer<typeof CandlesResponseSchema>;
export type FxResponse = z.infer<typeof FxResponseSchema>;
