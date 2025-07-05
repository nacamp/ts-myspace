"use client";
import React, { useState, useEffect } from "react";
import FreqtradeRow from "./FreqtradeRow";

export interface Freqtrade {
  id?: string;
  strategy?: string | null
  exchange: string;
  coin: string;
  buyQty: number;
  sellQty: number;
  buyPrice: number;
  sellPrice: number;
  createdAt?: Date;
  tradedAt?: Date | null;
}

type FreqtradeSheetClientProps = {
  initialData: Freqtrade[];
};

function formatDateToKST(date: Date): string {
  const kstDate = new Date(date.getTime() + 9 * 60 * 60 * 1000); // +9시간 보정
  const yyyy = kstDate.getFullYear();
  const mm = String(kstDate.getMonth() + 1).padStart(2, "0");
  const dd = String(kstDate.getDate()).padStart(2, "0");
  return `${yyyy}${mm}${dd}`;
}

export default function FreqtradeSheetClient({
  initialData,
}: FreqtradeSheetClientProps) {
  const [rows, setRows] = useState(initialData);
  const handleAddRow = () => {
    setRows([
      ...rows,
      {
        strategy: "",
        exchange: "",
        coin: "",
        buyQty: 0,
        sellQty: 0,
        buyPrice: 0,
        sellPrice: 0,
      },
    ]);
  };
  return (
    <div className="flex flex-col gap-3 p-6">
      {/* 1. 타이틀 헤더 */}
      <div className="flex items-center gap-4 text-sm  text-foreground font-medium">
        <div className="w-[100px]">Date</div>
        <div className="w-[150px]">Strategy</div>
        <div className="w-[150px]">Exchange</div>
        <div className="w-[100px]">Coin</div>
        <div className="w-[100px]">Buy Price</div>
        <div className="w-[100px]">Buy Qty</div>
        <div className="w-[100px]">Sell Price</div>
        <div className="w-[100px]">Sell Qty</div>
        <div className="w-[100px]">Calc/Save</div>
        <div className="w-[100px]">Profit</div>
      </div>
      {rows.map((item, i) => (
        <FreqtradeRow
          key={i}
          id={item.id}
          strategy={item.strategy ?? ""}
          exchange={item.exchange}
          coin={item.coin}
          buyQty={item.buyQty}
          sellQty={item.sellQty}
          buyPrice={item.buyPrice}
          sellPrice={item.sellPrice}
          tradedAt={
            item.tradedAt instanceof Date
              ? formatDateToKST(item.tradedAt)
              // ? item.tradedAt.toISOString().slice(0, 10).replace(/-/g, "")
              : item.tradedAt ?? ""
          }
        />
      ))}
      <button
        onClick={handleAddRow}
        className="mt-4 self-start rounded bg-primary px-3 py-1 text-white"
      >
        + Add Row
      </button>
    </div>
  );
}
