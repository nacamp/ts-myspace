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
  //TODO: id 정보를 클라이언트에게 전달하고, 클라이언트도 id를 state 뱐수로 관리하자
  return NextResponse.json({ success: true });
}

const parseKSTDate = (yyyymmdd: string) => {
  const yyyy = yyyymmdd.slice(0, 4);
  const mm = yyyymmdd.slice(4, 6);
  const dd = yyyymmdd.slice(6, 8);
  console.log(`${yyyy}-${mm}-${dd}T00:00:00+09:00`)
  const date = new Date(`${yyyy}-${mm}-${dd}T00:00:00+09:00`);
  return date;
};
export async function PUT(req: Request) {
  const data = await req.json();
  const { id, ...updateFields } = data;

  if (!data.id) {
    return NextResponse.json({ error: 'Missing id' }, { status: 400 });
  }
  console.log(data)
  try {
    const updated = await prisma.freqtrade.update({
      where: { id: data.id },
      data : updateFields,
      // data: {
      //   exchange: data.exchange,
      //   coin: data.coin,
      //   buyQty: data.buyQty,
      //   sellQty: data.sellQty,
      //   buyPrice: data.buyPrice,
      //   sellPrice: data.sellPrice,
      //   tradedAt: data.tradedAt,
      // },
    });

    return NextResponse.json({ success: true, data: updated });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'Update failed' }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  const { id } = await req.json();
  await prisma.freqtrade.delete({
    where: { id },
  });
  return NextResponse.json({ success: true });
}