"use client";
import React, { useState, useEffect } from "react";

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
import { Freqtrade } from "@/generated/prisma";

import { toDateFromYYYYMMDD, toYYYYMMDDfromDate } from "@/lib/utils";
import CommaNumberInput from "@/components/CommaNumberInput";

type FreqtradeRowProps = {
  row: Partial<Freqtrade>;
  isNew?: boolean;
  index?: number;
  onProfitChange?: (profit: number) => void;
};

type FreqtradeForm = Partial<Freqtrade> & {
  tradedAtInput?: string;
};

export default function FreqtradeRow({
  row,
  isNew = false,
  index,
  onProfitChange,
}: FreqtradeRowProps) {
  const [profit, setProfit] = useState("");
  const [isVisible, setIsVisible] = useState(true);

  const [form, setForm] = useState<FreqtradeForm>({
    ...row,
    tradedAtInput: row.tradedAt ? toYYYYMMDDfromDate(row.tradedAt) : "",
  });

  useEffect(() => {
    handleCalc();
  }, []);

  const handleCalc = async () => {
    if (form.buyQty && form.sellQty && form.buyPrice && form.sellPrice) {
      let fee = 0.0005;
      if (form.exchange === "Bithumb") fee = 0.0004;
      const result =
        form.sellQty * form.sellPrice * (1 - fee) -
        form.buyQty * form.buyPrice * (1 + fee);
      setProfit(result.toFixed(0));
      onProfitChange?.(result); // 부모에 전달
    } else {
      setProfit("");
    }
  };

  const handleChange = (field: keyof FreqtradeForm, value: any) => {
    console.log(value);
    const updated = { ...form, [field]: value };

    if (field === "tradedAtInput") {
      updated.tradedAt = toDateFromYYYYMMDD(value);
    }
    setForm(updated);
    handleCalc();
  };

  const handleSaveOrUpdate = async (isSave: boolean) => {
    const { tradedAtInput, ...formToSend } = form;
    const method = isSave ? "POST" : "PUT";
    const url = "/api/freqtrade";

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
    const url = "/api/freqtrade";
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
    <div className="flex items-center gap-4">
      <span className="w-[50px] text-right text-muted-foreground">{index}</span>
      <Input
        placeholder="yyyymmdd"
        className="w-[100px]"
        value={form.tradedAtInput}
        onChange={(e) => handleChange("tradedAtInput", e.target.value)}
      />

      <Select
        value={form.strategy ?? ""}
        onValueChange={(value) => handleChange("strategy", value)}
      >
        <SelectTrigger className="w-[150px]">
          <SelectValue placeholder="Strategy" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="StrategyV1">StrategyV1</SelectItem>
          <SelectItem value="StrategyV11">StrategyV11</SelectItem>
          <SelectItem value="Draft">Draft</SelectItem>
        </SelectContent>
      </Select>

      <Select
        value={form.exchange ?? ""}
        onValueChange={(value) => handleChange("exchange", value)}
      >
        <SelectTrigger className="w-[150px]">
          <SelectValue placeholder="Exchange" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="Bithumb">Bithumb</SelectItem>
          <SelectItem value="Upbit">Upbit</SelectItem>
        </SelectContent>
      </Select>

      <Select
        value={form.coin ?? ""}
        onValueChange={(value) => handleChange("coin", value)}
      >
        <SelectTrigger className="w-[100px]">
          <SelectValue placeholder="Coin" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="BTC">BTC</SelectItem>
          <SelectItem value="ETH">ETH</SelectItem>
          <SelectItem value="SOL">SOL</SelectItem>
          <SelectItem value="ADA">ADA</SelectItem>
          <SelectItem value="XRP">XRP</SelectItem>
          <SelectItem value="LINK">LINK</SelectItem>
          <SelectItem value="DOGE">DOGE</SelectItem>
          <SelectItem value="IOST">IOST</SelectItem>
          <SelectItem value="TRX">TRX</SelectItem>
          <SelectItem value="SUI">SUI</SelectItem>
        </SelectContent>
      </Select>

      <CommaNumberInput
        value={form.buyPrice ?? null}
        onChange={(val) => handleChange("buyPrice", val)}
        placeholder="Buy Price"
        className="w-[100px]"
      />

      <CommaNumberInput
        value={form.buyQty ?? null}
        onChange={(val) => handleChange("buyQty", val)}
        placeholder="Buy Qty"
        className="w-[100px]"
      />

      <CommaNumberInput
        value={form.sellPrice ?? null}
        onChange={(val) => handleChange("sellPrice", val)}
        placeholder="Sell Price"
        className="w-[100px]"
      />

      <CommaNumberInput
        value={form.sellQty ?? null}
        onChange={(val) => handleChange("sellQty", val)}
        placeholder="Sell Qty"
        className="w-[100px]"
      />

      <Button className="w-[50px]" onClick={() => handleSaveOrUpdate(!form.id)}>
        {form.id ? "Update" : "Save"}
      </Button>
      <Button className="w-[50px]" onClick={handleDelete}>
        Delete
      </Button>

      <span className="w-[100px] text-right text-muted-foreground">
        {Number(profit).toLocaleString()}
      </span>
    </div>
  );
}
