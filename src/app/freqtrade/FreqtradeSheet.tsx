"use client";
import React, { useState, useEffect } from "react";

import { Button } from "@/components/ui/button";
import { Freqtrade } from "@/generated/prisma";

import Search, { SearchField } from "@/components/Search";
import FreqtradeRow from "./FreqtradeRow";

export default function FreqtradeSheet() {
  const [rows, setRows] = useState<Partial<Freqtrade>[]>([]);
  const [profits, setProfits] = useState<number[]>([0]);

  const positiveStats = profits.reduce(
    (acc, val) => {
      if (val > 0) {
        acc.count += 1;
        acc.total += val;
      }
      return acc;
    },
    { count: 0, total: 0 }
  );

  const negativeStats = profits.reduce(
    (acc, val) => {
      if (val < 0) {
        acc.count += 1;
        acc.total += val;
      }
      return acc;
    },
    { count: 0, total: 0 }
  );

  const fetchData = async (filters: Record<string, string> = {}) => {
    setRows([]);
    const params = new URLSearchParams();

    Object.entries(filters).forEach(([key, value]) => {
      if (value) params.set(key, value);
    });

    const res = await fetch(`/api/freqtrade?${params.toString()}`, {
      cache: "no-store",
    });
    const data = await res.json();
    const parsedData = data.map((item: Freqtrade) => ({
      ...item,
      tradedAt: item.tradedAt ? new Date(item.tradedAt) : null,
    }));
    setRows(parsedData);
    setProfits(parsedData.map(() => 0));
  };

  const handleAddRow = () => {
    setRows([
      ...rows,
      {
        tradedAt: new Date(Date.now() - 9 * 60 * 60 * 1000),
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

  // search
  const [searchValues, setSearchValues] = useState<Record<string, string>>({});
  const fields: SearchField[] = [
    { key: "date", label: "년도or년도일", type: "input" },
    {
      key: "strategy",
      label: "Strategy",
      type: "select",
      options: [
        { label: "StrategyV1", value: "StrategyV1" },
        { label: "StrategyV11", value: "StrategyV11" },
        { label: "Draft", value: "Draft" },
      ],
    },
    {
      key: "exchange",
      label: "Exchange",
      type: "select",
      options: [
        { label: "Bithumb", value: "Bithumb" },
        { label: "Upbit", value: "Upbit" },
      ],
    },
    {
      key: "coin",
      label: "coin",
      type: "select",
      options: [
        { label: "BTC", value: "BTC" },
        { label: "ETH", value: "ETH" },
        { label: "SOL", value: "SOL" },
        { label: "ADA", value: "ADA" },
        { label: "XRP", value: "XRP" },
        { label: "LINK", value: "LINK" },
        { label: "DOGE", value: "DOGE" },
        { label: "IOST", value: "IOST" },
        { label: "TRX", value: "TRX" },
        { label: "SUI", value: "SUI" },
      ],
    },
  ];

  const handleSearchChange = (key: string, val: string) => {
    setSearchValues((prev) => ({ ...prev, [key]: val }));
  };

  const handleSearch = () => {
    fetchData(searchValues);
  };

  return (
    <div className="flex flex-col gap-3 p-6">
      <Search
        title="코인거래 검색"
        fields={fields}
        values={searchValues}
        onChange={handleSearchChange}
        onSearch={handleSearch}
      />

      {/* 1. 타이틀 헤더 */}
      <div className="flex items-center gap-4 text-sm  text-foreground font-medium">
        <div className="w-[50px]">No</div>
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
          index={i + 1}
          row={item}
          onProfitChange={(value) => {
            setProfits((prev) => {
              const updated = [...prev];
              updated[i] = value;
              return updated;
            });
          }}
        />
      ))}
      <Button onClick={handleAddRow}>+ Add Row</Button>
      <div className="flex mt-3 justify-end font-bold space-y-1 space-x-3 ">
        <div>
          ✅ Total Profit:{" "}
          {profits
            .reduce((acc, val) => acc + val, 0)
            .toLocaleString("en-US", {
              maximumFractionDigits: 0,
            })}
        </div>
        <div>
          🟢 Positive ({positiveStats.count}건):{" "}
          {positiveStats.total.toLocaleString("en-US", {
            maximumFractionDigits: 0,
          })}
        </div>
        <div>
          🔴 Negative ({negativeStats.count}건):{" "}
          {negativeStats.total.toLocaleString("en-US", {
            maximumFractionDigits: 0,
          })}
        </div>
      </div>
    </div>
  );
}
