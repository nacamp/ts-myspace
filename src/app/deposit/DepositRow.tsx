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

export default function DepositRow({
  row,
  isNew = false,
  index,
  onChange,
}: DepositRowProps) {

  const [form, setForm] = useState<DepositProductForm>({
    ...row,
    maturityAtInput: row.maturityAt ? toYYYYMMDDfromDate(row.maturityAt) : "",
  });

  const handleChange = (field: keyof DepositProductForm, value: any) => {
    console.log(value);
    const updated = { ...form, [field]: value };

    if (field === "maturityAtInput") {
      updated.maturityAt = toDateFromYYYYMMDD(value);
    } else if( field === "interestInput"){
      const floatValue = parseFloat(value);
      updated.interest = isNaN(floatValue) ? undefined : floatValue;
    }

    setForm(updated);
    onChange?.(updated);
  };

  const handleSave = async () => {
    console.log(form)
    const { maturityAtInput, interestInput, ...formToSend } = form;
    try {
      const res = await fetch("/api/deposit", {
        method: "POST",
        body: JSON.stringify(formToSend),
        headers: {
          "Content-Type": "application/json",
        },
      });

      const data = await res.json();
      if (!res.ok) {
        alert("❌ 저장 실패: " + data?.error);
      } else {
        console.log("✅ 저장 완료", data);

        // // 서버에서 id 포함된 전체 row를 응답했다면:
        // const updatedRow = { ...row, ...data }; // 또는 data.id만 합쳐도 됨
        // onSaved?.(updatedRow); // 부모 컴포넌트에 반영 요청
      }
    } catch (err) {
      console.error("❌ 네트워크 오류", err);
      alert("서버 저장 중 오류 발생");
    }
  };

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
        className="w-[100px]"
        value={form.userName ?? ""}
        onChange={(e) => handleChange("userName", e.target.value)}
      />

      <Input
        placeholder="유형 (예: 정기예금)"
        className="w-[100px]"
        value={form.category ?? ""}
        onChange={(e) => handleChange("category", e.target.value)}
      />

      <Input
        placeholder="이율"
        className="w-[100px]"
        value={form.interestInput ?? ""}
        onChange={(e) => handleChange("interestInput", e.target.value)}
      />

      <Input
        placeholder="일시불"
        className="w-[100px]"
        value={form.initialDeposit?.toString() ?? ""}
        onChange={(e) =>
          handleChange("initialDeposit", parseInt(e.target.value))
        }
      />

      <Input
        placeholder="월 납입"
        className="w-[100px]"
        value={form.monthlyDeposit?.toString() ?? ""}
        onChange={(e) =>
          handleChange("monthlyDeposit", parseInt(e.target.value))
        }
      />

      <Input
        placeholder="누적 납입"
        className="w-[100px]"
        value={form.totalDeposited?.toString() ?? ""}
        onChange={(e) =>
          handleChange("totalDeposited", parseInt(e.target.value))
        }
      />

      <Input
        placeholder="총 회차"
        className="w-[100px]"
        value={form.totalInstallments?.toString() ?? ""}
        onChange={(e) =>
          handleChange("totalInstallments", parseInt(e.target.value))
        }
      />

      <Input
        placeholder="납입 회차"
        className="w-[100px]"
        value={form.paidInstallments?.toString() ?? ""}
        onChange={(e) =>
          handleChange("paidInstallments", parseInt(e.target.value))
        }
      />

      <Input
        placeholder="수익"
        className="w-[100px]"
        value={form.profit?.toString() ?? ""}
        onChange={(e) => handleChange("profit", parseInt(e.target.value))}
      />
      <Input
        placeholder="만기여부"
        className="w-[100px]"
        value={form.isMatured?.toString() ?? "false"}
        onChange={(e) => handleChange("isMatured", e.target.value.trim().toLowerCase() === "true")}
      />
      {/* Button */}
      <Button className="w-[50px]" onClick={() => handleSave()}>
        Save
      </Button>
    </div>
  );
}
