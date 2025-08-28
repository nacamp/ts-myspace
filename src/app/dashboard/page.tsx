"use client";
import React, { useEffect, useState } from "react";
import { Card, CardHeader, CardContent } from "@/components/ui/card";

type Candle = {
  candle_date_time_kst: string;
  opening_price: number;
  high_price: number;
  low_price: number;
  trade_price: number;
  volume: number;
  rsi: number | null;
};

type CandleApiResponse = {
  market: string;
  count: number;
  period: number;
  lastRSI?: number | null;
  candles: Candle[]; // 최신 → 과거
};

const MARKETS = ["KRW-BTC", "KRW-ETH", "KRW-XRP"];
const LATEST_N = 5;

// 숫자 키만 추출 (문자열 키인 candle_date_time_kst 제외)
type NumericKey = Exclude<keyof Candle, "candle_date_time_kst">;

// FIELDS를 날짜/숫자 구분(discriminated union)
type Field =
  | { kind: "date"; label: string }
  | { kind: "num"; key: NumericKey; label: string; digits?: number };

const FIELDS: Field[] = [
  { kind: "date", label: "날짜" },
  { kind: "num", key: "trade_price",   label: "종가",   digits: 0 },
  { kind: "num", key: "opening_price", label: "시가",   digits: 0 },
  { kind: "num", key: "high_price",    label: "고가",   digits: 0 },
  { kind: "num", key: "low_price",     label: "저가",   digits: 0 },
  { kind: "num", key: "volume",        label: "거래량", digits: 0 },
  { kind: "num", key: "rsi",           label: "RSI",    digits: 2 },
];

function toMD(kstIso: string) {
  const m = kstIso.slice(5, 7).replace(/^0/, "");
  const d = kstIso.slice(8, 10).replace(/^0/, "");
  return `${m}월 ${d}일`;
}

function formatNumber(n: number | null | undefined, digits = 0, fallback = "-") {
  if (n === null || n === undefined || Number.isNaN(n)) return fallback;
  return n.toLocaleString(undefined, {
    maximumFractionDigits: digits,
    minimumFractionDigits: digits,
  });
}

export default function DashboardPage() {
  const [dataByMarket, setDataByMarket] = useState<Record<string, CandleApiResponse>>({});
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const qs = (m: string) =>
          `/api/coin/candle?market=${encodeURIComponent(m)}&count=${LATEST_N}&period=14`;
        const res = await Promise.all(
          MARKETS.map(async (m) => {
            const r = await fetch(qs(m));
            if (!r.ok) throw new Error(`${m} HTTP ${r.status}`);
            const j: CandleApiResponse = await r.json();
            return [m, j] as const;
          })
        );
        const map: Record<string, CandleApiResponse> = {};
        for (const [m, j] of res) map[m] = j;
        setDataByMarket(map);
      } catch (e: any) {
        setError(e?.message ?? String(e));
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  if (loading) return <div className="p-6">로딩 중…</div>;
  if (error)   return <div className="p-6 text-red-600">에러: {error}</div>;

  return (
    <div className="p-6 space-y-8">
      <h1 className="text-2xl font-bold">📊 Coin Dashboard</h1>

      {MARKETS.map((market) => {
        const data = dataByMarket[market];
        if (!data) return null;

        const latestN = data.candles.slice(0, LATEST_N); // 최신 → 과거

        return (
          <section key={market}>
            <Card>
              <CardHeader className="pb-3">
                <div className="text-xl font-semibold">{market}</div>
                <div className="text-xs text-gray-500">
                  RSI({data.period})
                  {typeof data.lastRSI !== "undefined" ? ` · 마지막 RSI: ${formatNumber(data.lastRSI, 2, "-")}` : ""}
                </div>
              </CardHeader>

              <CardContent className="text-sm overflow-x-auto">
                <div
                  className="grid gap-x-3 gap-y-2"
                  style={{ gridTemplateColumns: `120px repeat(${LATEST_N}, minmax(0,1fr))` }}
                >
                  {FIELDS.map((field) => (
                    <React.Fragment key={field.label}>
                      {/* 라벨 셀 */}
                      <div className="font-medium text-gray-600">{field.label}</div>

                      {/* 값 셀들 */}
                      {latestN.map((candle) => {
                        if (field.kind === "date") {
                          // 날짜는 왼쪽 정렬
                          return (
                            <div
                              key={`date-${candle.candle_date_time_kst}`}
                              className="text-right font-normal text-gray-700"
                            >
                              {toMD(candle.candle_date_time_kst)}
                            </div>
                          );
                        } else {
                          // 숫자는 오른쪽 정렬 (탭룰러 숫자 + 모노스페이스)
                          const value = candle[field.key] as number | null | undefined; // NumericKey로 안전
                          return (
                            <div
                              key={`${field.key}-${candle.candle_date_time_kst}`}
                              className="text-right tabular-nums font-mono"
                            >
                              {formatNumber(value, field.digits ?? 0, "-")}
                            </div>
                          );
                        }
                      })}
                    </React.Fragment>
                  ))}
                </div>
              </CardContent>
            </Card>
          </section>
        );
      })}
    </div>
  );
}
