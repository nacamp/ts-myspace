"use client";
import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Prisma, Decision } from "@/generated/prisma";

import Search, { SearchField } from "@/components/Search";

import DecisionRow from "./DecisionRow";

export default function DepositSheet() {
  const router = useRouter();
  const defaultYyyymm = (() => {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, "0");
    return `${year}${month}`;
  })();
  const [rows, setRows] = useState<Partial<Decision>[]>([]);
  // const [rows, setRows] = useState<Prisma.DepositProductCreateInput[]>([]);
  const [inputDate, setInputDate] = useState(defaultYyyymm);
  const [strategy, setStrategy] = useState("");
  const [exchange, setExchange] = useState("");

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async (filters: Record<string, string> = {}) => {
    // setRows([]);
    // const params = new URLSearchParams();

    // Object.entries(filters).forEach(([key, value]) => {
    //   if (value) params.set(key, value);
    // });

    // const res = await fetch(`/api/decision?${params.toString()}`, {
    //   cache: "no-store",
    // });
    // const data = await res.json();
    // const parsedData = data.map((item: Decision) => ({
    //   ...item,
    //   createdAt: item.createdAt ? new Date(item.createdAt) : null,
    // }));
    // setRows(parsedData);
  };

  const handleAddRow = () => {
    router.push("/decision/0");

    // setRows([
    //   ...rows,
    //   {
    //     title: "",
    //     createdAt: null, // optional
    //   },
    // ]);
  };

  return (
    <div className="flex flex-col gap-3 p-6">
      {/* 1. 타이틀 헤더 */}
      <div className="flex items-center gap-4 text-sm  text-foreground font-medium">
        <div className="w-[50px]">No</div>
        <div className="w-[100px]">날짜</div>
        <div className="w-[100px]">제목</div>
      </div>
      {rows.map((item, i) => (
        <DecisionRow
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
    </div>
  );
}
