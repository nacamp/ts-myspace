"use client";
import React, { useState, useEffect } from "react";
import FreqtradeRow from "./FreqtradeRow";

export interface Freqtrade {
  id?: string;
  strategy?: string | null;
  exchange: string;
  coin: string;
  buyQty: number;
  sellQty: number;
  buyPrice: number;
  sellPrice: number;
  createdAt?: Date;
  tradedAt?: Date | null;
}

function formatDateToKST(date: Date): string {
  const kstDate = new Date(date.getTime() + 9 * 60 * 60 * 1000); // +9시간 보정
  const yyyy = kstDate.getFullYear();
  const mm = String(kstDate.getMonth() + 1).padStart(2, "0");
  const dd = String(kstDate.getDate()).padStart(2, "0");
  return `${yyyy}${mm}${dd}`;
}

export default function FreqtradeSheet() {
  const [rows, setRows] = useState<Freqtrade[]>([]);
  const [profits, setProfits] = useState<number[]>([0]);

  const defaultYyyymm = (() => {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, "0");
    return `${year}${month}`;
  })();
  const [inputDate, setInputDate] = useState(defaultYyyymm);
  const [selectedDate, setSelectedDate] = useState(defaultYyyymm);
  const [strategy, setStrategy] = useState("");
  const [exchange, setExchange] = useState("");
  // useEffect(() => {
  //   // const fetchData = async () => {
  //   //   setRows([]); // 👈 이전 데이터 명확히 제거
  //   //   setProfits([]);

  //   //   const res = await fetch(`/api/freqtrade?yyyymm=${selectedDate}`);
  //   //   const data: Freqtrade[] = await res.json();
  //   //   setRows(data);
  //   //   setProfits(data.map(() => 0));
  //   // };
  //   const fetchData = async () => {
  //     setRows([]); // 초기화
  //     setProfits([]);

  //     const params = new URLSearchParams();
  //     params.set("yyyymm", selectedDate);
  //     if (strategy) params.set("strategy", strategy);
  //     if (exchange) params.set("exchange", exchange);

  //     const res = await fetch(`/api/freqtrade?${params.toString()}`, {
  //       cache: "no-store",
  //     });
  //     const data = await res.json();
  //     setRows(data);
  //     setProfits(data.map(() => 0));
  //   };
  //   fetchData();
  // }, [selectedDate]);
  const fetchData = async () => {
    setRows([]); // 초기화
    setProfits([]);

    const params = new URLSearchParams();
    params.set("yyyymm", selectedDate);
    if (strategy) params.set("strategy", strategy);
    if (exchange) params.set("exchange", exchange);

    const res = await fetch(`/api/freqtrade?${params.toString()}`, {
      cache: "no-store",
    });
    const data = await res.json();
    setRows(data);
    setProfits(data.map(() => 0));
  };
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
      <div className="flex gap-2 items-center">
        <input
          // type="date"
          value={inputDate}
          onChange={(e) => setInputDate(e.target.value)}
          className="border px-2 py-1 rounded"
        />

        <label className="text-sm">
          전략:
          <select
            value={strategy}
            onChange={(e) => setStrategy(e.target.value)}
            className="ml-1 border rounded px-2 py-1"
          >
            <option value="">전체</option>
            <option value="StrategyV1">StrategyV1</option>
            <option value="StrategyV11">StrategyV11</option>
            {/* 필요시 동적 목록으로 변경 가능 */}
          </select>
        </label>

        <label className="text-sm">
          거래소:
          <select
            value={exchange}
            onChange={(e) => setExchange(e.target.value)}
            className="ml-1 border rounded px-2 py-1"
          >
            <option value="">전체</option>
            <option value="Bithumb">Bithumb</option>
            <option value="Upbit">Upbit</option>
          </select>
        </label>

        <button
          onClick={() => fetchData()}
          className="bg-blue-500 text-white px-3 py-1 rounded"
        >
          조회
        </button>
      </div>

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
          tradedAt={formatDateToKST(new Date(String(item.tradedAt)))}
          onProfitChange={(value) => {
            setProfits((prev) => {
              const updated = [...prev];
              updated[i] = value;
              return updated;
            });
          }}
        />
      ))}
      <button
        onClick={handleAddRow}
        className="mt-4 self-start rounded bg-primary px-3 py-1 text-white"
      >
        + Add Row
      </button>
      <div className="mt-6 text-right font-bold">
        Total Profit:{" "}
        {Number(
          profits.reduce((acc, val) => acc + val, 0).toFixed(2)
        ).toLocaleString()}
      </div>
    </div>
  );
}
