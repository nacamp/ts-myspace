import { NextResponse } from 'next/server'
import prisma from "@/lib/prisma";

// GET: 사용자 목록 조회
export async function GET() {
  try {
    const freqtrades = await prisma.freqtrade.findMany();
    return NextResponse.json({ freqtrades })
  } catch (error) {
    return NextResponse.json(
      { error: '사용자 조회 실패' },
      { status: 500 }
    )
  }
}
export async function POST(req: Request) {
  const data = await req.json();
  await prisma.freqtrade.create({ data });
  return NextResponse.json({ success: true });
}

export async function PUT(req: Request) {
  const data = await req.json();

  if (!data.id) {
    return NextResponse.json({ error: 'Missing id' }, { status: 400 });
  }

  try {
    const updated = await prisma.freqtrade.update({
      where: { id: data.id },
      data: {
        exchange: data.exchange,
        coin: data.coin,
        buyQty: data.buyQty,
        sellQty: data.sellQty,
        buyPrice: data.buyPrice,
        sellPrice: data.sellPrice,
      },
    });

    return NextResponse.json({ success: true, data: updated });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'Update failed' }, { status: 500 });
  }
}