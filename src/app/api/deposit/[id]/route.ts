import { NextResponse, NextRequest } from "next/server";
import prisma from "@/lib/prisma";
import { getSearchDate } from "@/lib/utils";
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { searchParams } = new URL(req.url);

  const { id } = await params;
  const depositProductId = parseInt(id, 10);

  const startAt = searchParams.get("startAt");
  const endAt = searchParams.get("endAt");

  if (startAt && ![6, 8].includes(startAt.length)) {
    return NextResponse.json(
      { error: "startAt : Valid yyyymm or yyyymmdd query is required" },
      { status: 400 }
    );
  }
  if (endAt && ![6, 8].includes(endAt.length)) {
    return NextResponse.json(
      { error: "endAt : Valid yyyymm or yyyymmdd query is required" },
      { status: 400 }
    );
  }

  const whereClause = {
    ...(startAt &&
      endAt && {
        startAt: { gte: getSearchDate(startAt, "start") },
        endAt: { lte: getSearchDate(endAt, "end") },
      }),
    depositProductId,
  };

  const data = await prisma.demandDepositTransaction.findMany({
    where: whereClause,
  });
  return NextResponse.json(data);
}

export async function POST(req: Request) {
  const data = await req.json();
  const createdData = await prisma.demandDepositTransaction.create({ data });

  return NextResponse.json({
    success: true,
    id: createdData.id,
    // data: createdData
  });
}

export async function PUT(req: Request) {
  const data = await req.json();
  const { id, ...updateFields } = data;

  if (!data.id) {
    return NextResponse.json({ error: "Missing id" }, { status: 400 });
  }
  console.log(data);
  try {
    const updated = await prisma.demandDepositTransaction.update({
      where: { id: data.id },
      data: updateFields,
    });

    return NextResponse.json({ success: true, data: updated });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Update failed" }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  const { id } = await req.json();
  await prisma.demandDepositTransaction.delete({
    where: { id },
  });
  return NextResponse.json({ success: true });
}
