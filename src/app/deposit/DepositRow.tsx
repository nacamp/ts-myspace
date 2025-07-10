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

import { DepositProduct, Prisma } from "@/generated/prisma";
type DepositRowProps = {
  row: Partial<DepositProduct>;
  isNew?: boolean;
  index?: number;
  onChange?: (row: Partial<DepositProduct>) => void;
};

type DepositProductForm = Partial<DepositProduct> & {
  maturityAtInput?: string;
  interestInput?: string;
};

/**
 * @param principal 원금 (예: 1000000)
 * @param annualRate 연이율 % (예: 3.0)
 * @param months 예치 개월 수 (예: 12)
 */
function calculateFixedDepositInterest(
  principal: number,
  annualRate: number,
  months: number
): number {
  const rateDecimal = annualRate / 100;
  const interest = principal * rateDecimal * (months / 12);
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
  const [form, setForm] = useState<DepositProductForm>({
    ...row,
    maturityAtInput: row.maturityAt ? toYYYYMMDDfromDate(row.maturityAt) : "",
  });

  const handleChange = (field: keyof DepositProductForm, value: any) => {
    console.log(value);
    const updated = { ...form, [field]: value };

    if (field === "maturityAtInput") {
      updated.maturityAt = toDateFromYYYYMMDD(value);
    } else if (field === "interestInput") {
      const floatValue = parseFloat(value);
      updated.interest = isNaN(floatValue) ? undefined : floatValue;
    }
    // console.log(
    //   updated.totalDeposited,
    //   updated.interest,
    //   updated.totalInstallments
    // );
    if (updated.category === "recurring") {
      if (updated.monthlyDeposit && updated.paidInstallments &&  updated.totalInstallments) {
        // console.log(updated.monthlyDeposit, updated.paidInstallments);
        updated.totalDeposited =
          updated.monthlyDeposit * updated.paidInstallments;
        updated.initialDeposit =
          updated.monthlyDeposit * updated.totalInstallments;
        if (updated.useInterest) {
          updated.profit = calculateRecurringDepositInterest(
            updated.monthlyDeposit,
            updated.interest ?? 0,
            updated.totalInstallments ?? 0
          );
        }
      }
    } else if (updated.category === "fixed") {
      if (
        updated.useInterest &&
        updated.initialDeposit &&
        updated.interest &&
        updated.totalInstallments
      ) {
        updated.totalDeposited = updated.initialDeposit;
        updated.profit = calculateFixedDepositInterest(
          updated.totalDeposited,
          updated.interest,
          12
        );
      }
    }

    setForm(updated);
    onChange?.(updated);
  };

  const handleSaveOrUpdate = async (isSave: boolean) => {
    const { maturityAtInput, interestInput, ...formToSend } = form;
    const method = isSave ? "POST" : "PUT";
    const url = "/api/deposit";

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
        value={form.maturityAtInput || ""}
        onChange={(e) => handleChange("maturityAtInput", e.target.value)}
      />

      <Input
        placeholder="상품명"
        className="w-[100px]"
        value={form.name ?? ""}
        onChange={(e) => handleChange("name", e.target.value)}
      />

      <Input
        placeholder="가입자"
        className="w-[60px]"
        value={form.userName ?? ""}
        onChange={(e) => handleChange("userName", e.target.value)}
      />

      <Select
        value={form.category ?? ""}
        onValueChange={(value) => handleChange("category", value)}
      >
        <SelectTrigger className="w-[100px]">
          <SelectValue placeholder="예금종류" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="fixed">정기예금</SelectItem>
          <SelectItem value="recurring">정기적금</SelectItem>
          <SelectItem value="demand">입출금</SelectItem>
        </SelectContent>
      </Select>

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

      <Input
        placeholder="이율"
        className="w-[55px]"
        value={form.interestInput ?? ""}
        onChange={(e) => handleChange("interestInput", e.target.value)}
      />

      <Input
        placeholder="일시불"
        inputMode="numeric"
        className="w-[120px]"
        value={form.initialDeposit?.toString() ?? ""}
        onChange={(e) =>
          handleChange("initialDeposit", parseInt(e.target.value))
        }
      />

      <Input
        placeholder="월 납입"
        className="w-[90px]"
        value={form.monthlyDeposit?.toString() ?? ""}
        onChange={(e) =>
          handleChange("monthlyDeposit", parseInt(e.target.value))
        }
      />

      <Input
        placeholder="회차"
        className="w-[50px]"
        value={form.totalInstallments?.toString() ?? ""}
        onChange={(e) =>
          handleChange("totalInstallments", parseInt(e.target.value))
        }
      />

      <Input
        placeholder="회차"
        className="w-[50px]"
        value={form.paidInstallments?.toString() ?? ""}
        onChange={(e) =>
          handleChange("paidInstallments", parseInt(e.target.value))
        }
      />

      <Input
        placeholder="누적 납입"
        className="w-[120px]"
        value={form.totalDeposited?.toString() ?? ""}
        onChange={(e) =>
          handleChange("totalDeposited", parseInt(e.target.value))
        }
      />

      <Input
        placeholder="이자"
        className="w-[100px]"
        value={form.profit?.toString() ?? ""}
        onChange={(e) => handleChange("profit", parseInt(e.target.value))}
      />
      {/* <Input
        placeholder="만기여부"
        className="w-[100px]"
        value={form.isMatured?.toString() ?? "false"}
        onChange={(e) =>
          handleChange(
            "isMatured",
            e.target.value.trim().toLowerCase() === "true"
          )
        }
      /> */}

      <Select
        value={
          form.isMatured === true
            ? "true"
            : form.isMatured === false
            ? "false"
            : ""
        }
        onValueChange={(value) => handleChange("isMatured", value === "true")}
      >
        <SelectTrigger className="w-[100px]">
          <SelectValue placeholder="만기여부" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="true">만기</SelectItem>
          <SelectItem value="false">만기이전</SelectItem>
        </SelectContent>
      </Select>

      <Button className="w-[50px]" onClick={() => handleSaveOrUpdate(!form.id)}>
        {form.id ? "Update" : "Save"}
      </Button>
      <Button className="w-[50px]" onClick={handleDelete}>
        Delete
      </Button>
    </div>
  );
}
