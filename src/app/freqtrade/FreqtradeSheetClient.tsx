"use client";
import React, { useState, useEffect } from "react";
import FreqtradeRow from "./FreqtradeRow";

export interface Freqtrade {
  id?: string;
  exchange: string;
  coin: string;
  buyQty: number;
  sellQty: number;
  buyPrice: number;
  sellPrice: number;
  createdAt?: Date;
}

type FreqtradeSheetClientProps = {
  initialData: Freqtrade[];
};

export default function FreqtradeSheetClient({
  initialData,
}: FreqtradeSheetClientProps) {
  const [rows, setRows] = useState(initialData);
  const handleAddRow = () => {
    setRows([
      ...rows,
      {
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
        <div className="w-[100px]">Exchange</div>
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
          exchange={item.exchange}
          coin={item.coin}
          buyQty={item.buyQty}
          sellQty={item.sellQty}
          buyPrice={item.buyPrice}
          sellPrice={item.sellPrice}
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
