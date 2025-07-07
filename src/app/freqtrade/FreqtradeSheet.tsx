"use client";
import React, { useState, useEffect } from "react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
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
  const defaultYyyymm = (() => {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, "0");
    return `${year}${month}`;
  })();

  const [rows, setRows] = useState<Freqtrade[]>([]);
  const [profits, setProfits] = useState<number[]>([0]);
  const [inputDate, setInputDate] = useState(defaultYyyymm);
  const [strategy, setStrategy] = useState("");
  const [exchange, setExchange] = useState("");

  useEffect(() => {
    fetchData();
  }, []);

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

  const fetchData = async () => {
    setRows([]);
    setProfits([]);

    const params = new URLSearchParams();
    params.set("date", inputDate);
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
        tradedAt : new Date(Date.now() - 9 * 60 * 60 * 1000),
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
        {/* <input
          // type="date"
          value={inputDate}
          onChange={(e) => setInputDate(e.target.value)}
          className="border px-2 py-1 rounded"
        /> */}
        <Input
          placeholder="Sell Qty"
          className="w-[100px]"
          value={inputDate}
          onChange={(e) => setInputDate(e.target.value)}
        />
        <Select
          value={strategy}
          onValueChange={(val) => {
            setStrategy(val === "__all__" ? "" : val);
          }}
        >
          <SelectTrigger className="w-[150px]">
            <SelectValue placeholder="Strategy" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="__all__">All</SelectItem>
            <SelectItem value="StrategyV1">StrategyV1</SelectItem>
            <SelectItem value="StrategyV11">StrategyV11</SelectItem>
          </SelectContent>
        </Select>

        <Select
          value={exchange}
          onValueChange={(val) => {
            setExchange(val === "__all__" ? "" : val);
          }}
        >
          <SelectTrigger className="w-[150px]">
            <SelectValue placeholder="Exchange" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="__all__">All</SelectItem>
            <SelectItem value="Bithumb">Bithumb</SelectItem>
            <SelectItem value="Upbit">Upbit</SelectItem>
          </SelectContent>
        </Select>
        <Button className="w-[50px]" onClick={fetchData}>
          Search
        </Button>
      </div>

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
