import { NextResponse, NextRequest } from "next/server";
import prisma from "@/lib/prisma";
import { getSearchDate } from "@/lib/utils";



export async function GET() {
  const latestDate = await prisma.coinTimeline.aggregate({
    _max: { yyyymmdd: true },
  });

  const coins = await prisma.coinTimeline.findMany({
    where: { yyyymmdd: latestDate._max.yyyymmdd! },
    orderBy: { rsi: 'desc' }, // 예: RSI 상위 5개
    take: 10,
  });

  return NextResponse.json(coins);
}