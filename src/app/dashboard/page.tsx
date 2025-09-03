'use client';
import React, { useEffect, useState } from 'react';
import { Card, CardHeader, CardContent } from '@/components/ui/card';
import { CandlesResponse, CandlesResponseSchema } from '@/shared';

/** =========================
 * 공통 타입 (Freqtrade OHLCV 호환)
 * ========================= */
type Candle = {
  timestamp: string; // "YYYY-MM-DDTHH:mm:ss" (KST 가정)
  open: number;
  high: number;
  low: number;
  close: number;
  sma15: number | null;
  sma50: number | null;
  rsi: number | null;
};

type CandleApiResponse = {
  market?: string; // coin
  index?: string; // stock index (KIS)
  symbol?: string; // stock item (KIS)
  count: number;
  period?: number;
  rsiPeriod?: number;
  lastRSI?: number | null;
  candles: Candle[]; // 최신 → 과거
};

/** =========================
 * 상수/필드 정의
 * ========================= */
const COIN_MARKETS = ['KRW-BTC', 'KRW-ETH', 'KRW-XRP'] as const;

// 지수 + 개별 종목
const STOCK_INDICES = ['0001'] as const; // 예: 0001(KOSPI)
const INDEX_LABEL: Record<string, string> = { '0001': 'KOSPI' };

const STOCK_SYMBOLS = ['069500', '114260', '438330'] as const; // 예: KODEX200, 삼성전자, NAVER
const SYMBOL_LABEL: Record<string, string> = {
  '069500': 'KODEX 200',
  '114260': 'KODEX 국고3년채',
  '438330': 'TIGER 우량회사채액티브',
};

const LATEST_N = 5;

type NumericKey = Exclude<keyof Candle, 'timestamp'>;

type Field = { kind: 'string'; label: string } | { kind: 'num'; key: NumericKey; label: string; digits?: number };

const FIELDS: Field[] = [
  { kind: 'string', label: '날짜' },
  { kind: 'num', key: 'close', label: '종가' },
  { kind: 'num', key: 'open', label: '시가' },
  { kind: 'num', key: 'high', label: '고가' },
  { kind: 'num', key: 'low', label: '저가' },
  { kind: 'num', key: 'sma15', label: 'SMA15' },
  { kind: 'num', key: 'sma50', label: 'SMA50' },
  { kind: 'num', key: 'rsi', label: 'RSI' },
];

/** =========================
 * 유틸 (KST ISO 문자열 처리)
 * ========================= */
function parseKstIsoToUtcMs(iso: string): number {
  if (!iso) return NaN;
  if (/Z|[+\-]\d{2}:\d{2}$/.test(iso)) return Date.parse(iso);
  return Date.parse(`${iso}+09:00`);
}
function ymdKST(msUtc: number) {
  const d = new Date(msUtc + 9 * 60 * 60 * 1000);
  return { y: d.getUTCFullYear(), m: d.getUTCMonth() + 1, d: d.getUTCDate() };
}
function sameKstDay(aMsUtc: number, bMsUtc: number) {
  const A = ymdKST(aMsUtc);
  const B = ymdKST(bMsUtc);
  return A.y === B.y && A.m === B.m && A.d === B.d;
}
function toDateLabelFromKstIso(iso: string) {
  const ts = parseKstIsoToUtcMs(iso);
  if (!Number.isFinite(ts)) return '-';
  const now = Date.now();
  if (sameKstDay(ts, now)) return '오늘';
  const yesterday = now - 24 * 60 * 60 * 1000;
  if (sameKstDay(ts, yesterday)) return '어제';
  const { m, d } = ymdKST(ts);
  return `${m}월 ${d}일`;
}
function formatNumber(n: number | null | undefined, digits = 0, fallback = '-') {
  if (n === null || n === undefined || Number.isNaN(n)) return fallback;
  return n.toLocaleString(undefined, { maximumFractionDigits: digits, minimumFractionDigits: digits });
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
      const json = await r.json();
      const parsed = CandlesResponseSchema.parse(json);
      return [m, parsed] as const;
      // const j: CandleApiResponse = await r.json();
      // return [m, j] as const;
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
      // const j: CandleApiResponse = await r.json();
      // return [code, j] as const;
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
      const j: CandleApiResponse = await r.json();
      return [sym, j] as const;
      // const json = await r.json();
      // const parsed = CandlesResponseSchema.parse(json);
      // return [sym, parsed] as const;
    }),
  );
  return Object.fromEntries(res) as Record<string, CandleApiResponse>;
}

/** =========================
 * 그리드 컴포넌트
 * ========================= */
function MetricsGrid({ candles }: { candles: Candle[] }) {
  const latestN = candles.slice(0, LATEST_N);
  const cols = latestN.length;
  return (
    <div className="grid gap-x-3 gap-y-2" style={{ gridTemplateColumns: `120px repeat(${cols}, minmax(0,1fr))` }}>
      {FIELDS.map((field) => (
        <React.Fragment key={field.label}>
          <div className="font-medium text-gray-600">{field.label}</div>
          {latestN.map((candle) => {
            if (field.kind === 'string') {
              return (
                <div
                  key={`date-${candle.timestamp}`}
                  className="text-right font-normal text-gray-700"
                  title={candle.timestamp + ' KST'}
                >
                  {toDateLabelFromKstIso(candle.timestamp)}
                </div>
              );
            } else {
              const value = candle[field.key] as number | null | undefined;
              return (
                <div key={`${field.key}-${candle.timestamp}`} className="text-right tabular-nums font-mono">
                  {formatNumber(value, 0, '-')}
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
  const [coinData, setCoinData] = useState<Record<string, CandlesResponse>>({});
  const [indexData, setIndexData] = useState<Record<string, CandlesResponse>>({});
  const [symbolData, setSymbolData] = useState<Record<string, CandleApiResponse>>({});
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
    <div className="p-6 space-y-8">
      <h1 className="text-2xl font-bold">📊 Dashboard</h1>

      {/* ===== Coins ===== */}
      <section>
        <h2 className="text-xl font-semibold mb-3">🪙 Coins</h2>
        <div className="flex flex-row gap-6 flex-wrap">
          {COIN_MARKETS.map((market) => {
            const data = coinData[market];
            if (!data) return null;
            const period = data.period ?? data.rsiPeriod;
            return (
              <Card key={market} className="w-[420px]">
                <CardHeader className="pb-3">
                  <div className="text-lg font-semibold">{market}</div>
                  <div className="text-xs text-gray-500">
                    {period ? `RSI(${period})` : 'RSI'}
                    {typeof data.lastRSI !== 'undefined' ? ` · 마지막 RSI: ${formatNumber(data.lastRSI, 0, '-')}` : ''}
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

      {/* ===== Indices & Stocks (한 줄) ===== */}
      <section>
        <h2 className="text-xl font-semibold mb-3">📈 Indices & Stocks</h2>
        <div className="flex flex-row gap-6 flex-wrap">
          {/* 지수 카드 */}
          {STOCK_INDICES.map((code) => {
            const data = indexData[code];
            if (!data) return null;
            const period = data.period ?? data.rsiPeriod;
            const title = `${INDEX_LABEL[code] ?? code} (${code})`;
            return (
              <Card key={`idx-${code}`} className="w-[420px]">
                <CardHeader className="pb-3">
                  <div className="text-lg font-semibold">{title}</div>
                  <div className="text-xs text-gray-500">
                    {period ? `RSI(${period})` : 'RSI'}
                    {typeof data.lastRSI !== 'undefined' ? ` · 마지막 RSI: ${formatNumber(data.lastRSI, 0, '-')}` : ''}
                  </div>
                </CardHeader>
                <CardContent className="text-sm overflow-x-auto">
                  <MetricsGrid candles={data.candles} />
                </CardContent>
              </Card>
            );
          })}

          {/* 개별 종목 카드 */}
          {STOCK_SYMBOLS.map((sym) => {
            const data = symbolData[sym];
            if (!data) return null;
            const period = data.period ?? data.rsiPeriod;
            const title = `${SYMBOL_LABEL[sym] ?? sym} (${sym})`;
            return (
              <Card key={`sym-${sym}`} className="w-[420px]">
                <CardHeader className="pb-3">
                  <div className="text-lg font-semibold">{title}</div>
                  <div className="text-xs text-gray-500">
                    {period ? `RSI(${period})` : 'RSI'}
                    {typeof data.lastRSI !== 'undefined' ? ` · 마지막 RSI: ${formatNumber(data.lastRSI, 0, '-')}` : ''}
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
