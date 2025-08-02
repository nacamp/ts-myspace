import { NextResponse, NextRequest } from "next/server";
import prisma from "@/lib/prisma";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const date = searchParams.get("date"); // ex: "202507"
  const strategy = searchParams.get("strategy");
  const exchange = searchParams.get("exchange");
  const coin = searchParams.get("coin");

  if (!date || ![6, 8].includes(date.length)) {
    return NextResponse.json(
      { error: "Valid yyyymm or yyyymmdd query is required" },
      { status: 400 }
    );
  }

  const year = Number(date.slice(0, 4));
  const month = Number(date.slice(4, 6)) - 1; // JS Date는 0-indexed month
  // let whereClause: any;
  let startKST; // = KST 00:00
  let endKST; // = 다음달 KST 00:00
  if (date.length == 6) {
    // KST 기준 1일 00:00 → UTC로는 전날 15:00
    startKST = new Date(Date.UTC(year, month, 1, -9, 0, 0)); // = KST 00:00
    endKST = new Date(Date.UTC(year, month + 1, 1, -9, 0, 0)); // = 다음달 KST 00:00=
  } else {
    const day = Number(date.slice(6, 8));
    startKST = new Date(Date.UTC(year, month, day, -9, 0, 0)); // = KST 00:00
    endKST = new Date(Date.UTC(year, month, day + 1, -9, 0, 0)); // = 다음달 KST 00:00
  }
  const whereClause = {
    tradedAt: {
      gte: startKST,
      lt: endKST,
    },
    ...(strategy && {
      strategy
    }),
    ...(exchange && {
      exchange
    }),
    ...(coin && {
      coin
    }),
  };

  // whereClause = {
  //   tradedAt: {
  //     gte: startKST,
  //     lt: endKST,
  //   },
  // };
  // if (strategy) {
  //   whereClause.strategy = strategy;
  // }
  // if (exchange) {
  //   whereClause.exchange = exchange;
  // }
  const data = await prisma.freqtrade.findMany({
    where: whereClause,
    orderBy: { tradedAt: "asc" },
  });
  return NextResponse.json(data);
}

export async function POST(req: Request) {
  const data = await req.json();
  const createdData = await prisma.freqtrade.create({ data });

  return NextResponse.json({
    success: true,
    id: createdData.id,
    // data: createdData
  });
}

const parseKSTDate = (yyyymmdd: string) => {
  const yyyy = yyyymmdd.slice(0, 4);
  const mm = yyyymmdd.slice(4, 6);
  const dd = yyyymmdd.slice(6, 8);
  console.log(`${yyyy}-${mm}-${dd}T00:00:00+09:00`);
  const date = new Date(`${yyyy}-${mm}-${dd}T00:00:00+09:00`);
  return date;
};
export async function PUT(req: Request) {
  const data = await req.json();
  const { id, ...updateFields } = data;

  if (!data.id) {
    return NextResponse.json({ error: "Missing id" }, { status: 400 });
  }
  console.log(data);
  try {
    const updated = await prisma.freqtrade.update({
      where: { id: data.id },
      data: updateFields,
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
    return NextResponse.json({ error: "Update failed" }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  const { id } = await req.json();
  await prisma.freqtrade.delete({
    where: { id },
  });
  return NextResponse.json({ success: true });
}
