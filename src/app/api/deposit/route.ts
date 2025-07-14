import { NextResponse, NextRequest } from "next/server";
import prisma from "@/lib/prisma";
import { getSearchDate } from "@/lib/utils";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);

  const year = searchParams.get("year");
  const userName = searchParams.get("userName");
  const category = searchParams.get("category");

  if (year && ![4].includes(year.length)) {
    return NextResponse.json(
      { error: "startAt : Valid yyyymm or yyyymmdd query is required" },
      { status: 400 }
    );
  }

  const whereClause = {
    ...(year && {
      maturityAt: {
        gte: getSearchDate(year, "start"),
        lte: getSearchDate(year, "end"),
      },
    }),
    ...(userName && {
      userName,
    }),
    ...(category && {
      category,
    }),
  };
  const data = await prisma.depositProduct.findMany({
    where: whereClause, orderBy: {maturityAt: 'asc'}
  });
  return NextResponse.json(data);
}

export async function POST(req: Request) {
  const data = await req.json();
  const createdData = await prisma.depositProduct.create({ data });

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
    const updated = await prisma.depositProduct.update({
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
  await prisma.depositProduct.delete({
    where: { id },
  });
  return NextResponse.json({ success: true });
}
