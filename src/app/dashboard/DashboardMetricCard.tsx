'use client';
import React from 'react';
import { TrendingUp } from 'lucide-react';
import { Card, CardHeader, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import type { Candle, CandlesResponse } from '@/shared';

type CandleWithFlags = Candle & {
  isUpFromPrev?: boolean; // 어제 종가보다 상승했는가
  isBullish?: boolean; // close > sma15 > sma50 조건 충족
};

export function enrichCandles(candles: Candle[]): CandleWithFlags[] {
  return candles.map((c, i, arr) => {
    const prev = arr[i + 1]; // 바로 다음이 어제
    const isUpFromPrev = typeof c.close === 'number' && typeof prev?.close === 'number' && c.close > prev.close;

    const isBullish =
      typeof c.close === 'number' &&
      typeof c.sma15 === 'number' &&
      typeof c.sma50 === 'number' &&
      c.close > c.sma15 &&
      c.sma15 > c.sma50;

    return { ...c, isUpFromPrev, isBullish };
  });
}

export type DashboardMetricCardProps = {
  title: React.ReactNode;
  subtitle?: React.ReactNode;
  children?: React.ReactNode;
  className?: string;
};

export function DashboardMetricCard({ title, subtitle, children, className }: DashboardMetricCardProps) {
  return (
    <Card className={className}>
      <CardHeader className="pb-3">
        <div className="text-lg font-semibold leading-tight">{title}</div>
        {subtitle ? <div className="text-xs text-muted-foreground mt-1 leading-snug">{subtitle}</div> : null}
      </CardHeader>
      <CardContent className="text-sm overflow-x-auto">{children}</CardContent>
    </Card>
  );
}

/**************************************
 * MetricsGrid (동일 로직 재사용)
 **************************************/
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

export function MetricsGrid({
  candles,
  firstColWidth = 90,
  gapX = 2,
}: {
  candles: CandleWithFlags[];
  firstColWidth?: number;
  gapX?: 1 | 2 | 3 | 4;
}) {
  const latestN = candles.slice(0, LATEST_N);
  const cols = latestN.length;
  return (
    <div
      className={cn('grid gap-y-2', {
        'gap-x-1': gapX === 1,
        'gap-x-2': gapX === 2,
        'gap-x-3': gapX === 3,
        'gap-x-4': gapX === 4,
      })}
      style={{
        gridTemplateColumns: `${firstColWidth}px repeat(${cols}, minmax(0,1fr))`,
      }}
    >
      {FIELDS.map((field) => (
        <React.Fragment key={field.label}>
          {/* Header column */}
          <div className="font-medium text-muted-foreground">{field.label}</div>

          {/* Data cells */}
          {latestN.map((candle, i) => {
            if (field.kind === 'string') {
              return (
                <div
                  key={`cell-date-${candle.timestamp}`}
                  className="text-right font-normal text-foreground/70"
                  title={candle.timestamp + ' KST'}
                >
                  {toDateLabelFromKstIso(candle.timestamp)}
                </div>
              );
            } else {
              const value = candle[field.key] as number | null | undefined;

              // === close 전용: isUpFromPrev / isBullish 안전 계산 ===
              if (field.key === 'close') {
                const prevClose = latestN[i + 1]?.close;

                const isUpFromPrev =
                  candle.isUpFromPrev ??
                  (typeof value === 'number' && typeof prevClose === 'number' && value > prevClose);

                const isBullish =
                  candle.isBullish ??
                  (typeof candle.close === 'number' &&
                    typeof candle.sma15 === 'number' &&
                    typeof candle.sma50 === 'number' &&
                    candle.close > candle.sma15 &&
                    candle.sma15 > candle.sma50);

                // 스타일: 상승이면 빨강, 불리시면 배경+굵기 추가 (빨강 유지)
                const extra = cn(
                  isUpFromPrev && 'text-destructive font-semibold',
                  isBullish && 'bg-accent/10 text-destructive font-bold rounded-sm px-1',
                );

                return (
                  <div
                    key={`cell-close-${candle.timestamp}`}
                    className={cn('flex items-center justify-end gap-1 tabular-nums font-mono', extra)}
                  >
                    {/* 아이콘 슬롯(고정폭) → 정렬 흔들림 방지 */}
                    {isBullish && <TrendingUp className="w-4 h-4" />}
                    <span>{formatNumber(value, 0, '-')}</span>
                  </div>
                );
              }

              // 기본 숫자 셀
              return (
                <div key={`cell-${field.key}-${candle.timestamp}`} className="text-right tabular-nums font-mono">
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

/**************************************
 * 헬퍼: CandlesResponse 기반 subtitle 생성기
 **************************************/
export function buildRsiSubtitle(data?: CandlesResponse) {
  if (!data) return null;
  const period = data.rsiPeriod;
  const last = typeof data.lastRSI !== 'undefined' ? ` · 마지막 RSI: ${formatNumber(data.lastRSI, 0, '-')}` : '';
  return `${period ? `RSI(${period})` : 'RSI'}${last}`;
}
