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

import { Prisma, DepositProduct } from "@/generated/prisma";
import DepositRow from "./DepositRow";

export default function DepositSheet() {
  const defaultYyyymm = (() => {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, "0");
    return `${year}${month}`;
  })();
  const [rows, setRows] = useState<Partial<DepositProduct>[]>([]);
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

    const res = await fetch(`/api/deposit?${params.toString()}`, {
      cache: "no-store",
    });
    const data = await res.json();
    const parsedData = data.map((item: DepositProduct) => ({
      ...item,
      maturityAt: item.maturityAt ? new Date(item.maturityAt) : null,
    }));
    setRows(parsedData);
  };

  const handleAddRow = () => {
    setRows([
      ...rows,
      {
        name: "", // 상품 이름
        userName: "", // 가입자
        category: "", // 상품 종류

        interest: 0, // 연 이율
        useInterest: true, // 기본값이 true

        initialDeposit: null, // optional
        monthlyDeposit: null, // optional
        totalDeposited: null, // optional
        totalInstallments: null, // optional
        paidInstallments: null, // optional

        maturityAt: null, // optional
        isMatured: false, // 기본값 false
        profit: 0,
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
        <div className="w-[100px]">만기일</div>
        <div className="w-[100px]">예금명</div>
        <div className="w-[60px]">사용자</div>
        <div className="w-[100px]">예금종류</div>
        <div className="w-[100px]">이율계산</div>
        <div className="w-[55px]">이율</div>
        <div className="w-[100px]">월납입금</div>
        <div className="w-[50px]">계약월수</div>
        <div className="w-[50px]">입금월수</div>
        <div className="w-[120px]">계약금액</div>
        <div className="w-[120px]">누적금액</div>
        <div className="w-[100px]">이자</div>
        <div className="w-[100px]">만기여부</div>
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
