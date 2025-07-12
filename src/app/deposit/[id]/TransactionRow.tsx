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
import { toast } from "sonner";
import { toDateFromYYYYMMDD, toYYYYMMDDfromDate } from "@/lib/utils";

import { DemandDepositTransaction, Prisma } from "@/generated/prisma";
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

/**
 * @param principal 원금 (예: 1000000)
 * @param annualRate 연이율 % (예: 3.0)
 * @param months 예치 개월 수 (예: 12)
 */
// function calculateFixedDepositInterest(
//   principal: number,
//   annualRate: number,
//   months: number
// ): number {
//   const rateDecimal = annualRate / 100;
//   const interest = principal * rateDecimal * (months / 12);
//   return Math.floor(interest); // 소수점 버림
// }

function calculateFixedDepositInterest(
  principal: number,
  annualRate: number,
  months: number
): number {
  const monthlyRate = annualRate / 100 / 12;
  const finalAmount = principal * Math.pow(1 + monthlyRate, months);
  const interest = finalAmount - principal;
  return Math.floor(interest); // 소수점 버림
}
/**
 * 정기적금 예상이자 계산 함수 (단리 기준, 세전)
 * @param monthlyAmount - 매월 납입액 (예: 100,000원)
 * @param annualRate - 연이율 (%) (예: 3.5)
 * @param months - 납입 개월 수 (예: 12)
 * @returns 총이자 (세전)
 */
function calculateRecurringDepositInterest(
  monthlyAmount: number,
  annualRate: number,
  months: number
): number {
  const rateDecimal = annualRate / 100;
  const interest = ((monthlyAmount * months * (months + 1)) / 24) * rateDecimal;
  return Math.floor(interest); // 소수점 버림
}

export default function DepositRow({
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
    console.log(value);
    const updated = { ...form, [field]: value };

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
    const url = "/api/deposit";
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
