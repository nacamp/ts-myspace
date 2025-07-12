"use client";
import React, { useState, useEffect } from "react";
import { toast } from "sonner";

import { DemandDepositTransaction, Prisma } from "@/generated/prisma";
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
  toDateFromYYYYMMDD,
  toYYYYMMDDfromDate,
  getDaysBetween,
  calculateInterestByDay,
} from "@/lib/utils";
import CommaNumberInput from "@/components/CommaNumberInput";

type DepositRowProps = {
  row: Partial<DemandDepositTransaction>;
  isNew?: boolean;
  index?: number;
  onChange?: (row: Partial<DemandDepositTransaction>) => void;
};

type DemandDepositTransactionForm = Partial<DemandDepositTransaction> & {
  startAtInput?: string;
  endAtInput?: string;
};

export default function TransactionRow({
  row,
  isNew = false,
  index,
  onChange,
}: DepositRowProps) {
  const [isVisible, setIsVisible] = useState(true);
  const [form, setForm] = useState<DemandDepositTransactionForm>({
    ...row,
    startAtInput: row.startAt ? toYYYYMMDDfromDate(row.startAt) : "",
    endAtInput: row.endAt ? toYYYYMMDDfromDate(row.endAt) : "",
  });

  const handleChange = (
    field: keyof DemandDepositTransactionForm,
    value: any
  ) => {
    const updated = { ...form, [field]: value };

    if (field === "startAtInput" && value) {
      updated.startAt = toDateFromYYYYMMDD(value) ?? undefined;
    } else if (field === "endAtInput" && value) {
      updated.endAt = toDateFromYYYYMMDD(value) ?? undefined;
    }

    if (
      updated.startAtInput &&
      updated.endAtInput &&
      updated.totalDeposited &&
      updated.interest &&
      updated.useInterest
    ) {
      updated.profit = calculateInterestByDay(
        updated.totalDeposited,
        updated.interest ?? 0,
        getDaysBetween(updated.startAtInput, updated.endAtInput) ?? 0
      );
    }

    setForm(updated);
    onChange?.(updated);
  };

  const handleSaveOrUpdate = async (isSave: boolean) => {
    const { startAtInput, endAtInput, ...formToSend } = form;
    const method = isSave ? "POST" : "PUT";
    const url = `/api/deposit/${form.depositProductId}`;

    try {
      const res = await fetch(url, {
        method,
        body: JSON.stringify(formToSend),
        headers: { "Content-Type": "application/json" },
      });

      const data = await res.json();
      if (!res.ok) {
        console.error("❌ 저장 실패:", data);
        return;
      }
      toast.success("저장 완료"); //// toast("저장 완료")

      // 공통 후처리 로직
      if (isSave && data?.id) {
        handleChange("id", data.id);
      }
    } catch (err) {
      console.error("❌ 네트워크 오류", err);
    }
  };

  const handleDelete = async () => {
    const url = `/api/deposit/${form.depositProductId}`;
    try {
      const res = await fetch(url, {
        method: "DELETE",
        body: JSON.stringify({ id: form.id }),
        headers: {
          "Content-Type": "application/json",
        },
      });

      const data = await res.json();
      if (!res.ok) {
        console.error("❌ 삭제 실패:", data);
      } else {
        setIsVisible(false);
        toast.success("삭제 완료");
      }
    } catch (err) {
      console.error("❌ 네트워크 오류", err);
    }
  };
  if (!isVisible) return null;
  return (
    <div className="flex items-center gap-4 py-2">
      <span className="w-[50px] text-right text-muted-foreground">
        {index ?? ""}
      </span>

      <Input
        placeholder="yyyymmdd"
        className="w-[100px]"
        value={form.startAtInput || ""}
        onChange={(e) => handleChange("startAtInput", e.target.value)}
      />

      <Input
        placeholder="yyyymmdd"
        className="w-[100px]"
        value={form.endAtInput || ""}
        onChange={(e) => handleChange("endAtInput", e.target.value)}
      />

      <CommaNumberInput
        value={form.totalDeposited ?? null}
        onChange={(val) => handleChange("totalDeposited", val)}
        placeholder="잔금"
        className="w-[130px]"
      />

      <CommaNumberInput
        value={form.interest ?? null}
        onChange={(val) => handleChange("interest", val)}
        placeholder="이율"
        className="w-[55px]"
      />

      <Select
        value={
          form.useInterest === true
            ? "true"
            : form.useInterest === false
            ? "false"
            : ""
        }
        onValueChange={(value) => handleChange("useInterest", value === "true")}
      >
        <SelectTrigger className="w-[100px]">
          <SelectValue placeholder="이자자동계산" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="true">자동계산</SelectItem>
          <SelectItem value="false">직접입력</SelectItem>
        </SelectContent>
      </Select>

      <CommaNumberInput
        value={form.profit ?? null}
        onChange={(val) => handleChange("profit", val)}
        placeholder="이자"
        className="w-[100px]"
      />

      <Button className="w-[50px]" onClick={() => handleSaveOrUpdate(!form.id)}>
        {form.id ? "Update" : "Save"}
      </Button>
      <Button className="w-[50px]" onClick={handleDelete}>
        Delete
      </Button>
    </div>
  );
}
