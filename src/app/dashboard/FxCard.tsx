// app/(dashboard)/FxCard.tsx
'use client';
import React from 'react';

type FxData = {
  rate: number; // USDKRW
  timestamp: number; // epoch sec
  source?: string; // "CURRENCYLAYER.COM"
};

function fmtNumber(n: number, digits = 3) {
  return n.toLocaleString(undefined, { maximumFractionDigits: digits });
}

function fmtTime(ts: number) {
  // epoch sec → 로컬 시각
  return new Date(ts * 1000).toLocaleString();
}

export function FxCard({ data }: { data: FxData }) {
  const { rate, timestamp, source } = data;

  return (
    <div className="surface w-[320px] gap-2 rounded-2xl p-4 shadow">
      <div className="text-sm muted">USD/KRW</div>
      <div className="mt-1 text-2xl font-semibold">{fmtNumber(rate, 3)}</div>

      <div className="mt-3 text-xs muted">
        {fmtTime(timestamp)} at {source ? `${source}` : ''}
      </div>
    </div>
  );
}
