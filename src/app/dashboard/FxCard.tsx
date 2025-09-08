'use client';
import React from 'react';
import { DashboardMetricCard } from './DashboardMetricCard';

type FxData = {
  rate: number;
  timestamp: number;
  source?: string;
};

function fmtNumber(n: number, digits = 3) {
  return n.toLocaleString(undefined, { maximumFractionDigits: digits });
}

function fmtTime(ts: number) {
  return new Date(ts * 1000).toLocaleString();
}

export function FxCard({ data }: { data: FxData }) {
  const { rate, timestamp, source } = data;

  return (
    <DashboardMetricCard
      key="fx"
      title="USD/KRW"
      subtitle={[fmtTime(timestamp), source].filter(Boolean).join(' at ')}
      className="w-[320px] gap-2"
    >
      <div className="text-2xl font-semibold tabular-nums font-mono">{fmtNumber(rate, 3)}</div>
    </DashboardMetricCard>
  );
}
