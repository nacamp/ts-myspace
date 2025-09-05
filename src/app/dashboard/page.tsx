'use client';
import React, { useEffect, useState } from 'react';
import { CandlesResponse, CandlesResponseSchema } from '@/shared';
import { DashboardMetricCard, buildRsiSubtitle, MetricsGrid } from './DashboardMetricCard';

const COIN_MARKETS = ['KRW-BTC', 'KRW-ETH', 'KRW-XRP'] as const;
const STOCK_INDICES = ['0001'] as const;
const STOCK_SYMBOLS = ['069500', '114260', '438330'] as const;
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

  useEffect(() => {
    (async () => {
      try {
        const [coins, indices, symbols] = await Promise.all([
          fetchCoins(COIN_MARKETS, LATEST_N, 14),
          fetchStockIndices(STOCK_INDICES, 14),
          fetchStockItems(STOCK_SYMBOLS, 14),
        ]);
        setCoinData(coins);
        setIndexData(indices);
        setSymbolData(symbols);
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

      {/* ===== Coins ===== */}
      <section>
        <h2 className="text-xl font-semibold mb-3">🪙 Coins</h2>
        <div className="flex flex-row gap-6 flex-wrap">
          {COIN_MARKETS.map((market) => {
            if (!coinData[market]) return null;
            return (
              <DashboardMetricCard
                title={market}
                subtitle={buildRsiSubtitle(coinData[market])}
                className="w-[320px] gap-2"
              >
                <MetricsGrid candles={coinData[market].candles} firstColWidth={50} gapX={2} />
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
                title={code}
                subtitle={buildRsiSubtitle(indexData[code])}
                className="w-[320px] gap-2"
              >
                <MetricsGrid candles={indexData[code].candles} firstColWidth={50} gapX={2} />
              </DashboardMetricCard>
            );
          })}

          {/* 개별 종목 카드 */}
          {STOCK_SYMBOLS.map((sym) => {
            if (!symbolData[sym]) return null;
            return (
              <DashboardMetricCard title={sym} subtitle={buildRsiSubtitle(symbolData[sym])} className="w-[320px] gap-2">
                <MetricsGrid candles={symbolData[sym].candles} firstColWidth={50} gapX={2} />
              </DashboardMetricCard>
            );
          })}
        </div>
      </section>
    </div>
  );
}
