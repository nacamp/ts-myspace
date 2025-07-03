// import React, { useState, useEffect } from "react";
import prisma from '@/lib/prisma'
import FreqtradeRow from "./FreqtradeRow";

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


export default  async function FreqtradeSheet() {
  const freqtrade = await prisma.freqtrade.findMany();
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
      {freqtrade.map((item, i) => (
        <FreqtradeRow
          key={i}
          exchange={item.exchange}
          coin={item.coin}
          buyQty={item.buyQty}
          sellQty={item.sellQty}
          buyPrice={item.buyPrice}
          sellPrice={item.sellPrice}
        />
      ))}
      {/* {initialData.map((item, i) => (
        <FreqtradeRow key={i} {...item} />
      ))} */}
    </div>
  );
}
