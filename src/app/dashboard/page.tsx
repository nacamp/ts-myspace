'use client';
import React, { useEffect, useState } from 'react';
import { Card, CardHeader, CardContent } from '@/components/ui/card';

/** =========================
 * 공통 타입
 * ========================= */
type Candle = {
  candle_date_time_kst: string; // "YYYY-MM-DD..." or "YYYYMMDD"도 들어올 수 있음(백엔드에서 맞춰줬다면 OK)
  opening_price: number;
  high_price: number;
  low_price: number;
  trade_price: number;
  volume: number;
  rsi: number | null;
};

type CandleApiResponse = {
  market?: string; // coin용
  symbol?: string; // stock용
  count: number;
  period: number;
  lastRSI?: number | null;
  candles: Candle[]; // 최신 → 과거
};

/** =========================
 * 상수/필드 정의
 * ========================= */
const COIN_MARKETS = ['KRW-BTC', 'KRW-ETH', 'KRW-XRP'] as const;
const STOCK_SYMBOLS = ['0001'] as const; // 확장 가능
const LATEST_N = 5;

type NumericKey = Exclude<keyof Candle, 'candle_date_time_kst'>;

type Field = { kind: 'date'; label: string } | { kind: 'num'; key: NumericKey; label: string; digits?: number };

const FIELDS: Field[] = [
  { kind: 'date', label: '날짜' },
  { kind: 'num', key: 'trade_price', label: '종가', digits: 0 },
  { kind: 'num', key: 'opening_price', label: '시가', digits: 0 },
  { kind: 'num', key: 'high_price', label: '고가', digits: 0 },
  { kind: 'num', key: 'low_price', label: '저가', digits: 0 },
  { kind: 'num', key: 'volume', label: '거래량', digits: 0 },
  { kind: 'num', key: 'rsi', label: 'RSI', digits: 2 },
];

/** =========================
 * 유틸
 * ========================= */
function toMD(kst: string) {
  // "YYYY-MM-DD..." or "YYYYMMDD" 모두 허용
  const iso = kst.includes('-') ? kst : `${kst.slice(0, 4)}-${kst.slice(4, 6)}-${kst.slice(6, 8)}`;
  const m = iso.slice(5, 7).replace(/^0/, '');
  const d = iso.slice(8, 10).replace(/^0/, '');
  return `${m}월 ${d}일`;
}

function formatNumber(n: number | null | undefined, digits = 0, fallback = '-') {
  if (n === null || n === undefined || Number.isNaN(n)) return fallback;
  return n.toLocaleString(undefined, {
    maximumFractionDigits: digits,
    minimumFractionDigits: digits,
  });
}

/** =========================
 * 데이터 로더
 * ========================= */
async function fetchCoins(markets: readonly string[], count = LATEST_N, period = 14) {
  const res = await Promise.all(
    markets.map(async (m) => {
      const url = `/api/coin/candle?market=${encodeURIComponent(m)}&count=${count}&period=${period}`;
      const r = await fetch(url);
      if (!r.ok) throw new Error(`[coin] ${m} HTTP ${r.status}`);
      const j: CandleApiResponse = await r.json();
      return [m, j] as const;
    }),
  );
  // Record<market, response>
  return Object.fromEntries(res) as Record<string, CandleApiResponse>;
}

async function fetchStocks(symbols: readonly string[], count = LATEST_N, period = 14) {
  const res = await Promise.all(
    symbols.map(async (s) => {
      const url = `/api/stock/index/${s}/candle?count=${count}&period=${period}`;
      const r = await fetch(url);
      if (!r.ok) throw new Error(`[stock] ${s} HTTP ${r.status}`);
      const j: CandleApiResponse = await r.json();
      return [s, j] as const;
    }),
  );
  // Record<symbol, response>
  return Object.fromEntries(res) as Record<string, CandleApiResponse>;
}

/** =========================
 * 그리드 컴포넌트
 * ========================= */
function MetricsGrid({ candles }: { candles: Candle[] }) {
  const latestN = candles.slice(0, LATEST_N); // 최신 → 과거
  return (
    <div className="grid gap-x-3 gap-y-2" style={{ gridTemplateColumns: `120px repeat(${LATEST_N}, minmax(0,1fr))` }}>
      {FIELDS.map((field) => (
        <React.Fragment key={field.label}>
          {/* 라벨 셀 */}
          <div className="font-medium text-gray-600">{field.label}</div>

          {/* 값 셀들 */}
          {latestN.map((candle) => {
            if (field.kind === 'date') {
              return (
                <div key={`date-${candle.candle_date_time_kst}`} className="text-right font-normal text-gray-700">
                  {toMD(candle.candle_date_time_kst)}
                </div>
              );
            } else {
              const value = candle[field.key] as number | null | undefined;
              return (
                <div key={`${field.key}-${candle.candle_date_time_kst}`} className="text-right tabular-nums font-mono">
                  {formatNumber(value, field.digits ?? 0, '-')}
                </div>
              );
            }
          })}
        </React.Fragment>
      ))}
    </div>
  );
}

/** =========================
 * 메인 페이지
 * ========================= */
export default function DashboardPage() {
  const [coinData, setCoinData] = useState<Record<string, CandleApiResponse>>({});
  const [stockData, setStockData] = useState<Record<string, CandleApiResponse>>({});
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const [coins, stocks] = await Promise.all([
          fetchCoins(COIN_MARKETS, LATEST_N, 14),
          fetchStocks(STOCK_SYMBOLS, LATEST_N, 14),
        ]);
        setCoinData(coins);
        setStockData(stocks);
      } catch (e: any) {
        setError(e?.message ?? String(e));
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  if (loading) return <div className="p-6">로딩 중…</div>;
  if (error) return <div className="p-6 text-red-600">에러: {error}</div>;

  return (
    <div className="p-6 space-y-10">
      <h1 className="text-2xl font-bold">📊 Dashboard</h1>

      {/* ===== Coin 섹션 ===== */}
      <section>
        <h2 className="text-xl font-semibold mb-3">🪙 Coins</h2>
        <div className="space-y-6">
          {COIN_MARKETS.map((market) => {
            const data = coinData[market];
            if (!data) return null;
            return (
              <Card key={market}>
                <CardHeader className="pb-3">
                  <div className="text-lg font-semibold">{market}</div>
                  <div className="text-xs text-gray-500">
                    RSI({data.period})
                    {typeof data.lastRSI !== 'undefined' ? ` · 마지막 RSI: ${formatNumber(data.lastRSI, 2, '-')}` : ''}
                  </div>
                </CardHeader>
                <CardContent className="text-sm overflow-x-auto">
                  <MetricsGrid candles={data.candles} />
                </CardContent>
              </Card>
            );
          })}
        </div>
      </section>

      {/* ===== Stock 섹션 ===== */}
      <section>
        <h2 className="text-xl font-semibold mb-3">📈 Stocks</h2>
        <div className="space-y-6">
          {STOCK_SYMBOLS.map((symbol) => {
            const data = stockData[symbol];
            if (!data) return null;
            const title = `${symbol}${symbol === '069500' ? ' · KODEX 200' : ''}`;
            return (
              <Card key={symbol}>
                <CardHeader className="pb-3">
                  <div className="text-lg font-semibold">{title}</div>
                  <div className="text-xs text-gray-500">
                    RSI({data.period})
                    {typeof data.lastRSI !== 'undefined' ? ` · 마지막 RSI: ${formatNumber(data.lastRSI, 2, '-')}` : ''}
                  </div>
                </CardHeader>
                <CardContent className="text-sm overflow-x-auto">
                  <MetricsGrid candles={data.candles} />
                </CardContent>
              </Card>
            );
          })}
        </div>
      </section>
    </div>
  );
}
