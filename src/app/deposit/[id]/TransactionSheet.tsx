"use client";
import React, { useState, useEffect, use } from "react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

import {
  Prisma,
  DemandDepositTransaction,
} from "@/generated/prisma";
import DepositRow from "./TransactionRow";

import { useParams } from "next/navigation";

export default function DepositSheet() {
  const params = useParams<{ id: string }>();
  const depositProductId = parseInt(params.id, 10);
  const defaultYyyymm = (() => {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, "0");
    return `${year}${month}`;
  })();
  const [rows, setRows] = useState<Partial<DemandDepositTransaction>[]>([]);
  // const [rows, setRows] = useState<Prisma.DepositProductCreateInput[]>([]);
  const [inputDate, setInputDate] = useState(defaultYyyymm);
  const [strategy, setStrategy] = useState("");
  const [exchange, setExchange] = useState("");

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setRows([]);

    const params = new URLSearchParams();
    // params.set("date", inputDate);
    // if (strategy) params.set("strategy", strategy);
    // if (exchange) params.set("exchange", exchange);

    const res = await fetch(`/api/deposit/${depositProductId}?${params.toString()}`, {
      cache: "no-store",
    });
    const data = await res.json();
    const parsedData = data.map((item: DemandDepositTransaction) => ({
      ...item,
      startAt: item.startAt ? new Date(item.startAt) : null,
      endAt: item.endAt ? new Date(item.endAt) : null,
    }));
    setRows(parsedData);
  };

  const handleAddRow = () => {
    setRows([
      ...rows,
      {
        startAt: new Date(), // 예치 시작일
        endAt: new Date(), // 예치 시작일
        totalDeposited: 0,
        interest: 0,
        useInterest: true,
        profit: 0,
        depositProductId
      },
    ]);
  };
  return (
    <div className="flex flex-col gap-3 p-6">
      <div className="flex gap-2 items-center">
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
        <div className="w-[100px]">시작일</div>
        <div className="w-[100px]">종료일</div>
        <div className="w-[130px]">최종잔액</div>
        <div className="w-[55px]">이율</div>
        <div className="w-[100px]">이율계산</div>
        <div className="w-[100px]">이자</div>
      </div>
      {rows.map((item, i) => (
        <DepositRow
          key={i}
          index={i + 1}
          row={item}
          onChange={(updatedRow) => {
            setRows((prev) => {
              const updated = [...prev];
              updated[i] = updatedRow;
              return updated;
            });
          }}
        />
      ))}
      <Button onClick={handleAddRow}>+ Add Row</Button>
      <div className="flex mt-3 justify-end font-bold space-y-1 space-x-3 ">
        <div>
          ✅ Total Profit:{" "}
          {rows
            .map((row) => row.profit ?? 0)
            .reduce((acc, val) => acc + val, 0)
            .toLocaleString("en-US", {
              maximumFractionDigits: 0,
            })}
        </div>
      </div>
    </div>
  );
}
