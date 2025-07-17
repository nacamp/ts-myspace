"use client";
import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { ArrowRight } from "lucide-react";

import { toast } from "sonner";
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

import { Decision, Prisma } from "@/generated/prisma";
import CommaNumberInput from "@/components/CommaNumberInput";
type DecisionRowProps = {
  row: Partial<Decision>;
  isNew?: boolean;
  index?: number;
  onChange?: (row: Partial<Decision>) => void;
};

type DecisionForm = Partial<Decision> & {
  createdAtInput?: string;
  // interestInput?: string;
};



export default function DecisionRow({
  row,
  isNew = false,
  index,
  onChange,
}: DecisionRowProps) {
  const router = useRouter();
  const [isVisible, setIsVisible] = useState(true);
  const [form, setForm] = useState<DecisionForm>({
    ...row,
    createdAtInput: row.createdAt ? toYYYYMMDDfromDate(row.createdAt) : "",
  });

  const handleChange = (field: keyof DecisionForm, value: any) => {
    console.log(value);
    const updated = { ...form, [field]: value };

    if (field === "createdAtInput") {
      updated.createdAt = toDateFromYYYYMMDD(value);
      // } else if (field === "interestInput") {
      //   const floatValue = parseFloat(value);
      //   updated.interest = isNaN(floatValue) ? undefined : floatValue;
    }
    // if (updated.category === "recurring") {
    //   if (
    //     updated.monthlyDeposit &&
    //     updated.paidInstallments &&
    //     updated.totalInstallments
    //   ) {
    //     // console.log(updated.monthlyDeposit, updated.paidInstallments);
    //     updated.totalDeposited =
    //       updated.monthlyDeposit * updated.paidInstallments;
    //     updated.initialDeposit =
    //       updated.monthlyDeposit * updated.totalInstallments;
    //     if (updated.useInterest) {
    //       updated.profit = calculateRecurringDepositInterest(
    //         updated.monthlyDeposit,
    //         updated.interest ?? 0,
    //         updated.totalInstallments ?? 0
    //       );
    //     }
    //   }
    // } else if (updated.category === "fixed") {
    //   if (updated.initialDeposit) {
    //     updated.totalDeposited = updated.initialDeposit;
    //   }
    //   if (
    //     updated.useInterest &&
    //     updated.initialDeposit &&
    //     updated.interest &&
    //     updated.totalInstallments
    //   ) {
    //     updated.totalDeposited = updated.initialDeposit;
    //     updated.profit = calculateFixedDepositInterest(
    //       updated.totalDeposited,
    //       updated.interest,
    //       updated.totalInstallments
    //     );
    //   }
    // }

    setForm(updated);
    onChange?.(updated);
  };

  const handleSaveOrUpdate = async (isSave: boolean) => {
    // const { maturityAtInput, interestInput, ...formToSend } = form;
    // const method = isSave ? "POST" : "PUT";
    // const url = "/api/deposit";

    // try {
    //   const res = await fetch(url, {
    //     method,
    //     body: JSON.stringify(formToSend),
    //     headers: { "Content-Type": "application/json" },
    //   });

    //   const data = await res.json();
    //   if (!res.ok) {
    //     console.error("❌ 저장 실패:", data);
    //     return;
    //   }
    //   toast.success("저장 완료"); //// toast("저장 완료")

    //   // 공통 후처리 로직
    //   if (isSave && data?.id) {
    //     handleChange("id", data.id);
    //   }
    // } catch (err) {
    //   console.error("❌ 네트워크 오류", err);
    // }
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
        value={form.createdAtInput || ""}
        onChange={(e) => handleChange("createdAtInput", e.target.value)}
      />

      <Input
        placeholder="제목"
        className="w-[100px]"
        value={form.title ?? ""}
        onChange={(e) => handleChange("title", e.target.value)}
      />
 

      <Button className="w-[50px]" onClick={() => handleSaveOrUpdate(!form.id)}>
        {form.id ? "Update" : "Save"}
      </Button>
      <Button className="w-[50px]" onClick={handleDelete}>
        Delete
      </Button>
      {/* {form.category === "demand" && (
        <Button
          className="w-[50px]"
          onClick={() => form.id && router.push(`/deposit/${form.id}`)}
        >
          <ArrowRight className="w-4 h-4" />
        </Button>
      )} */}
    </div>
  );
}
