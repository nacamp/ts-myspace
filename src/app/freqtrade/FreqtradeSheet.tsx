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
  exchange?: string;
  coin?: string;
  buyQty?: string | number;
  sellQty?: string | number;
  buyPrice?: string | number;
  sellPrice?: string | number;
};

export function CalculateRow({
  exchange = "",
  coin = "",
  buyQty: initialBuyQty = "",
  sellQty: initialSellQty = "",
  buyPrice: initialBuyPrice = "",
  sellPrice: initialSellPrice = "",
}: RowProps) {
  const [selectedExchange, setSelectedExchange] = useState(exchange);
  const [selectedCoin, setSelectedCoin] = useState(coin);
  const [buyQty, setBuyQty] = useState(String(initialBuyQty ?? ""));
  const [buyPrice, setBuyPrice] = useState(String(initialBuyPrice ?? ""));
  const [sellQty, setSellQty] = useState(String(initialSellQty ?? ""));
  const [sellPrice, setSellPrice] = useState(String(initialSellPrice ?? ""));
  const [profit, setProfit] = useState("");

  const handleCalc = () => {
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
      let fee = 0.0005
      if(selectedExchange === 'bithumb')
        fee = 0.0004
      console.log(fee, selectedExchange)
      const result = _sellQty * _sellPrice * (1 - fee) - _buyQty * _buyPrice * (1 + fee);
      console.debug(_sellQty * _sellPrice)
      console.debug()
      setProfit(result.toFixed(2));
    } else {
      setProfit("");
    }
  };

  return (
    <div className="flex items-center gap-4">
      {/* Exchange */}
      <Select value={selectedExchange} onValueChange={setSelectedExchange}>
        <SelectTrigger className="w-[100px]">
          <SelectValue placeholder="Exchange" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="bithumb">Bithum</SelectItem>
          <SelectItem value="upbit">Upbit</SelectItem>
        </SelectContent>
      </Select>

      {/* Coin */}
      <Select value={selectedCoin} onValueChange={setSelectedCoin}>
        <SelectTrigger className="w-[100px]">
          <SelectValue placeholder="Coin" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="btc">BTC</SelectItem>
          <SelectItem value="eth">ETH</SelectItem>
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
      <Button className="w-[100px]" onClick={handleCalc}>
        Save
      </Button>

      {/* Profit */}
      <span className="w-[100px] text-right text-muted-foreground">
        {profit}
      </span>
    </div>
  );
}

const initialData = [
  {
    exchange: "upbit",
    coin: "btc",
    buyQty: "1",
    sellQty: "1",
    buyPrice: "50000",
    sellPrice: "51000",
  },
  {
    exchange: "bithumb",
    coin: "sol",
    buyQty: "24.78314745",
    sellQty: "24.78314745",
    buyPrice: "201750",
    sellPrice: "203959",
  },
];


export default function FreqtradeSheet() {
  return (
    <div className="flex flex-col gap-3 p-6">
      {/* 1. 타이틀 헤더 */}
      <div className="flex items-center gap-4 text-sm  text-foreground font-medium">
        <div className="w-[100px]">Exchange</div>
        <div className="w-[100px]">Coin</div>
        <div className="w-[100px]">Buy Price</div>
        <div className="w-[100px]">Buy Qty</div>
        <div className="w-[100px]">Sell Price</div>
        <div className="w-[100px]">Sell Qty</div>
        <div className="w-[100px]">Calc/Save</div>
        <div className="w-[100px]">Profit</div>
      </div>
      {initialData.map((item, i) => (
        <CalculateRow key={i} {...item} />
      ))}
    </div>
  );
}
