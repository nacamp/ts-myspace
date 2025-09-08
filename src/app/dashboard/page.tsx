'use client';
import React, { useEffect, useState } from 'react';
import { CandlesResponse, CandlesResponseSchema } from '@/shared';
import { DashboardMetricCard, buildRsiSubtitle, MetricsGrid, enrichCandles } from './DashboardMetricCard';
import { FxCard } from './FxCard';

async function fetchFx() {
  const r = await fetch('/api/fx?base=USD&quotes=KRW', { cache: 'no-store' });
  if (!r.ok) throw new Error(`[fx] HTTP ${r.status}`);
  return r.json() as Promise<{ timestamp: number; rate: number; source?: string }>;
}

const COIN_MARKETS = ['KRW-BTC', 'KRW-ETH', 'KRW-XRP'] as const;
const STOCK_INDICES = ['0001'] as const;
const STOCK_SYMBOLS = ['069500', '114260', '438330'] as const;

const INDEX_LABEL = {
  '0001': 'KOSPI',
} satisfies Record<(typeof STOCK_INDICES)[number], string>;

const SYMBOL_LABEL = {
  '069500': 'KODEX 200',
  '114260': 'KODEX 국고3년채',
  '438330': 'TIGER 우량회사채액티브',
} satisfies Record<(typeof STOCK_SYMBOLS)[number], string>;

const COIN_LABEL = {
  // 'KRW-BTC': 'Bitcoin',
  // 'KRW-ETH': 'Ethereum',
};

const LABELS: Record<string, string> = {
  ...INDEX_LABEL,
  ...SYMBOL_LABEL,
  ...COIN_LABEL,
};

/** 코드와 이름을 함께 반환: "이름 (코드)". 매핑 없으면 코드만 */
export function displayLabel(id: string) {
  const name = LABELS[id];
  return name ? `${name} (${id})` : id;
}

const LATEST_N = 5;

async function fetchCoins(markets: readonly string[], count = LATEST_N, period = 14) {
  const res = await Promise.all(
    markets.map(async (m) => {
      const url = `/api/coin/candle?market=${encodeURIComponent(m)}&count=${count}&period=${period}`;
      const r = await fetch(url);
      if (!r.ok) throw new Error(`[coin] ${m} HTTP ${r.status}`);
      const json = await r.json();
      const parsed = CandlesResponseSchema.parse(json);
      return [m, parsed] as const;
    }),
  );
  return Object.fromEntries(res) as Record<string, CandlesResponse>;
}

// 지수
async function fetchStockIndices(indices: readonly string[], period = 14) {
  const res = await Promise.all(
    indices.map(async (code) => {
      const url = `/api/stock/index/${encodeURIComponent(code)}/candle?period=${period}`;
      const r = await fetch(url);
      if (!r.ok) throw new Error(`[index] ${code} HTTP ${r.status}`);
      const json = await r.json();
      const parsed = CandlesResponseSchema.parse(json);
      return [code, parsed] as const;
    }),
  );
  return Object.fromEntries(res) as Record<string, CandlesResponse>;
}

// 개별 종목
async function fetchStockItems(symbols: readonly string[], period = 14) {
  const res = await Promise.all(
    symbols.map(async (sym) => {
      const url = `/api/stock/item/${encodeURIComponent(sym)}/candle?period=${period}`;
      const r = await fetch(url);
      if (!r.ok) throw new Error(`[symbol] ${sym} HTTP ${r.status}`);
      const json = await r.json();
      const parsed = CandlesResponseSchema.parse(json);
      return [sym, parsed] as const;
    }),
  );
  return Object.fromEntries(res) as Record<string, CandlesResponse>;
}

export default function DashboardPage() {
  const [coinData, setCoinData] = useState<Record<string, CandlesResponse>>({});
  const [indexData, setIndexData] = useState<Record<string, CandlesResponse>>({});
  const [symbolData, setSymbolData] = useState<Record<string, CandlesResponse>>({});
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [fx, setFx] = React.useState<{ timestamp: number; rate: number; source?: string } | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const [coins, indices, symbols, fxNow] = await Promise.all([
          fetchCoins(COIN_MARKETS, LATEST_N, 14),
          fetchStockIndices(STOCK_INDICES, 14),
          fetchStockItems(STOCK_SYMBOLS, 14),
          fetchFx(),
        ]);
        setCoinData(coins);
        setIndexData(indices);
        setSymbolData(symbols);
        setFx(fxNow);
      } catch (e) {
        if (e instanceof Error) {
          setError(e.message);
        } else {
          setError(String(e));
        }
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  if (loading) return <div className="p-6">로딩 중…</div>;
  if (error) return <div className="p-6 text-red-600">에러: {error}</div>;

  return (
    <div className="p-6 space-y-8">
      <h1 className="text-2xl font-bold">📊 Dashboard</h1>
      {/* ===== FX ===== */}
      <section>
        <h2 className="text-xl font-semibold mb-3">💱 FX</h2>
        <div className="flex flex-row gap-6 flex-wrap">
          {fx && (
            <FxCard
              data={{ rate: fx.rate, timestamp: fx.timestamp, source: (fx as any).source ?? 'CURRENCYLAYER.COM' }}
            />
          )}
        </div>
      </section>
      {/* ===== Coins ===== */}
      <section>
        <h2 className="text-xl font-semibold mb-3">🪙 Coins</h2>
        <div className="flex flex-row gap-6 flex-wrap">
          {COIN_MARKETS.map((market) => {
            if (!coinData[market]) return null;
            return (
              <DashboardMetricCard
                key={market}
                title={displayLabel(market)}
                subtitle={buildRsiSubtitle(coinData[market])}
                className="w-[320px] gap-2"
              >
                <MetricsGrid candles={enrichCandles(coinData[market].candles)} firstColWidth={50} gapX={2} />
              </DashboardMetricCard>
            );
          })}
        </div>
      </section>

      {/* ===== Indices & Stocks (한 줄) ===== */}
      <section>
        <h2 className="text-xl font-semibold mb-3">📈 Indices & Stocks</h2>
        <div className="flex flex-row gap-6 flex-wrap">
          {/* 지수 카드 */}
          {STOCK_INDICES.map((code) => {
            if (!indexData[code]) return null;
            return (
              <DashboardMetricCard
                key={code}
                title={displayLabel(code)}
                subtitle={buildRsiSubtitle(indexData[code])}
                className="w-[320px] gap-2"
              >
                <MetricsGrid candles={enrichCandles(indexData[code].candles)} firstColWidth={50} gapX={2} />
              </DashboardMetricCard>
            );
          })}

          {/* 개별 종목 카드 */}
          {STOCK_SYMBOLS.map((sym) => {
            if (!symbolData[sym]) return null;
            return (
              <DashboardMetricCard
                key={sym}
                title={displayLabel(sym)}
                subtitle={buildRsiSubtitle(symbolData[sym])}
                className="w-[320px] gap-2"
              >
                <MetricsGrid candles={enrichCandles(symbolData[sym].candles)} firstColWidth={50} gapX={2} />
              </DashboardMetricCard>
            );
          })}
        </div>
      </section>
    </div>
  );
}
