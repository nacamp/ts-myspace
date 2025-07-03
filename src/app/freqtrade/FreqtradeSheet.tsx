// import React, { useState, useEffect } from "react";
import prisma from '@/lib/prisma'
import FreqtradeSheetClient from "./FreqtradeSheetClient";

//  const initialData = [
//   {
//     exchange: "upbit",
//     coin: "btc",
//     buyQty: "1",
//     sellQty: "1",
//     buyPrice: "50000",
//     sellPrice: "51000",
//   },
//   {
//     exchange: "bithumb",
//     coin: "sol",
//     buyQty: "24.78314745",
//     sellQty: "24.78314745",
//     buyPrice: "201750",
//     sellPrice: "203959",
//   },
// ];
// {initialData.map((item, i) => (
//       <FreqtradeRow key={i} {...item} />
// ))}  


export default  async function FreqtradeSheet() {
  const freqtrade = await prisma.freqtrade.findMany();
   return <FreqtradeSheetClient initialData={freqtrade} />;
}
