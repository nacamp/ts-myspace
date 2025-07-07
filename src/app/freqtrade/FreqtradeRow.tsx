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

type RowProps = {
  id?: string;
  index: number;
  strategy?: string;
  exchange?: string;
  coin?: string;
  buyQty?: string | number;
  sellQty?: string | number;
  buyPrice?: string | number;
  sellPrice?: string | number;
  tradedAt?: string; // YYYYMMDD 형식의 문자열로 처리
  //onProfitChange?: (index: number, profit: number) => void;
  onProfitChange?: (profit: number) => void;
};

export default function FreqtradeRow({
  index = 0,
  id = "",
  strategy = "",
  exchange = "",
  coin = "",
  buyQty: initialBuyQty = "",
  sellQty: initialSellQty = "",
  buyPrice: initialBuyPrice = "",
  sellPrice: initialSellPrice = "",
  tradedAt: initialTradedAt = "",
  onProfitChange,
}: RowProps) {
  const [selectedStrategy, setSelectedStrategy] = useState(strategy);
  const [selectedExchange, setSelectedExchange] = useState(exchange);
  const [selectedCoin, setSelectedCoin] = useState(coin);
  const [buyQty, setBuyQty] = useState(String(initialBuyQty ?? ""));
  const [buyPrice, setBuyPrice] = useState(String(initialBuyPrice ?? ""));
  const [sellQty, setSellQty] = useState(String(initialSellQty ?? ""));
  const [sellPrice, setSellPrice] = useState(String(initialSellPrice ?? ""));
  const [profit, setProfit] = useState("");
  const [isVisible, setIsVisible] = useState(true);
  const [tradedAt, setTradedAt] = useState(initialTradedAt);

  useEffect(() => {
    handleCalc();
  }, [selectedExchange, buyQty, buyPrice, sellQty, sellPrice]);

  useEffect(() => {
    setSelectedExchange(exchange);
    setSelectedCoin(coin);
  }, [exchange, coin]);

  const handleCalc = async () => {
    const _buyQty = parseFloat(buyQty);
    const _buyPrice = parseFloat(buyPrice);
    const _sellQty = parseFloat(sellQty);
    const _sellPrice = parseFloat(sellPrice);

    if (
      !isNaN(_buyQty) &&
      !isNaN(_sellQty) &&
      !isNaN(_buyPrice) &&
      !isNaN(_sellPrice)
    ) {
      let fee = 0.0005;
      if (selectedExchange === "Bithumb") fee = 0.0004;
      const result =
        _sellQty * _sellPrice * (1 - fee) - _buyQty * _buyPrice * (1 + fee);
      setProfit(result.toFixed(0));
      onProfitChange?.(result); // 부모에 전달
    } else {
      setProfit("");
    }
  };

  const toDateFromYYYYMMDD = (yyyymmdd: string): Date => {
    const yyyy = yyyymmdd.slice(0, 4);
    const mm = yyyymmdd.slice(4, 6);
    const dd = yyyymmdd.slice(6, 8);
    return new Date(`${yyyy}-${mm}-${dd}T00:00:00+09:00`);
  };
  const handleClick = async (isSave: boolean) => {
    const _buyQty = parseFloat(buyQty);
    const _buyPrice = parseFloat(buyPrice);
    const _sellQty = parseFloat(sellQty);
    const _sellPrice = parseFloat(sellPrice);

    const form = {
      id,
      strategy: selectedStrategy,
      exchange: selectedExchange,
      coin: selectedCoin,
      buyQty: _buyQty,
      sellQty: _sellQty,
      buyPrice: _buyPrice,
      sellPrice: _sellPrice,
      tradedAt: toDateFromYYYYMMDD(tradedAt),
    };
    const { id: _, ...rest } = form;
    const body = isSave ? rest : form;
    try {
      let res;
      // TODO: save 후 id를 발급받지 못해서 버튼이 여전히 save 이다.
      if (isSave) {
        res = await fetch("/api/freqtrade", {
          method: "POST",
          body: JSON.stringify(body),
          headers: {
            "Content-Type": "application/json",
          },
        });
      } else {
        res = await fetch("/api/freqtrade", {
          method: "PUT",
          body: JSON.stringify(body),
          headers: {
            "Content-Type": "application/json",
          },
        });
      }

      const data = await res.json();
      if (!res.ok) {
        alert("❌ 저장 실패: " + data?.error);
      } else {
        console.log("✅ 저장 완료", data);
      }
    } catch (err) {
      console.error("❌ 네트워크 오류", err);
      alert("서버 저장 중 오류 발생");
    }
  };

  const handleDelete = async () => {
    try {
      const res = await fetch("/api/freqtrade", {
        method: "DELETE",
        body: JSON.stringify({ id }),
        headers: {
          "Content-Type": "application/json",
        },
      });

      const data = await res.json();
      if (!res.ok) {
        alert("❌ 저장 실패: " + data?.error);
      } else {
        setIsVisible(false);
        console.log("✅ 저장 완료", data);
      }
    } catch (err) {
      console.error("❌ 네트워크 오류", err);
      alert("서버 저장 중 오류 발생");
    }
  };
  if (!isVisible) return null;
  return (
    <div className="flex items-center gap-4">
      <span className="w-[50px] text-right text-muted-foreground">
        {index}
      </span>
      <Input
        placeholder="yyyymmdd"
        className="w-[100px]"
        value={tradedAt}
        onChange={(e) => setTradedAt(e.target.value)}
      />

      {/* strategy */}
      <Select value={selectedStrategy} onValueChange={setSelectedStrategy}>
        <SelectTrigger className="w-[150px]">
          <SelectValue placeholder="Strategy" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="StrategyV1">StrategyV1</SelectItem>
          <SelectItem value="StrategyV11">StrategyV11</SelectItem>
        </SelectContent>
      </Select>

      {/* Exchange */}
      <Select value={selectedExchange} onValueChange={setSelectedExchange}>
        <SelectTrigger className="w-[150px]">
          <SelectValue placeholder="Exchange" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="Bithumb">Bithumb</SelectItem>
          <SelectItem value="Upbit">Upbit</SelectItem>
        </SelectContent>
      </Select>

      {/* Coin */}
      <Select value={selectedCoin} onValueChange={setSelectedCoin}>
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
        </SelectContent>
      </Select>

      {/* Buy Price */}
      <Input
        placeholder="Buy Price"
        className="w-[100px]"
        value={buyPrice}
        onChange={(e) => setBuyPrice(e.target.value)}
      />

      {/* Buy Qty */}
      <Input
        placeholder="Buy Qty"
        className="w-[100px]"
        value={buyQty}
        onChange={(e) => setBuyQty(e.target.value)}
      />

      {/* Sell Price */}
      <Input
        placeholder="Sell Price"
        className="w-[100px]"
        value={sellPrice}
        onChange={(e) => setSellPrice(e.target.value)}
      />

      {/* Sell Qty */}
      <Input
        placeholder="Sell Qty"
        className="w-[100px]"
        value={sellQty}
        onChange={(e) => setSellQty(e.target.value)}
      />

      {/* Button */}
      <Button className="w-[50px]" onClick={() => handleClick(!id)}>
        {id ? "Update" : "Save"}
      </Button>
      <Button className="w-[50px]" onClick={handleDelete}>
        Delete
      </Button>

      {/* Profit */}
      <span className="w-[100px] text-right text-muted-foreground">
        {Number(profit).toLocaleString()}
      </span>
    </div>
  );
}
