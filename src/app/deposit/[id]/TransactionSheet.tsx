"use client";
import React, { useState, useEffect, use } from "react";
import { useParams } from "next/navigation";

import { Button } from "@/components/ui/button";
import { Prisma, DemandDepositTransaction } from "@/generated/prisma";
import Search, { SearchField } from "@/components/Search";
// import { defaultYyyymmdd } from "@/lib/utils";

import DepositRow from "./TransactionRow";

export default function TransactionSheet() {
  const params = useParams<{ id: string }>();
  const depositProductId = parseInt(params.id, 10);
  const [rows, setRows] = useState<Partial<DemandDepositTransaction>[]>([]);

  // 초기 데이터가 너무 많다.
  // useEffect(() => {
  //   fetchData();
  // }, []);

  const fetchData = async (filters: Record<string, string> = {}) => {
    setRows([]);
    const params = new URLSearchParams();

    Object.entries(filters).forEach(([key, value]) => {
      if (value) params.set(key, value);
    });

    const res = await fetch(
      `/api/deposit/${depositProductId}?${params.toString()}`,
      {
        cache: "no-store",
      }
    );
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
        startAt: new Date(),
        endAt: new Date(),
        totalDeposited: 0,
        interest: 0,
        useInterest: true,
        profit: 0,
        depositProductId,
      },
    ]);
  };

  // search
  const [searchValues, setSearchValues] = useState<Record<string, string>>({});
  const fields: SearchField[] = [
    { key: "startAt", label: "시작(YYYYMMDD)", type: "input" },
    { key: "endAt", label: "종료(YYYYMMDD)", type: "input" },
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
        title="예치 상품 검색"
        fields={fields}
        values={searchValues}
        onChange={handleSearchChange}
        onSearch={handleSearch}
      />

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
