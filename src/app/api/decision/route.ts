import { NextResponse, NextRequest } from "next/server";
import prisma from "@/lib/prisma";
import { getSearchDate } from "@/lib/utils";



export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);

  const whereClause = {
  };
  const data = await prisma.decision.findMany({
    where: whereClause, orderBy: {createdAt: 'asc'}
  });
  return NextResponse.json(data);
}

export async function POST(req: NextRequest) {
  const body = await req.json();

  const { title, why, result, judgments } = body;

  const created = await prisma.decision.create({
    data: {
      title,
      why,
      result,
      judgments: {
        create: judgments.map((j: any) => ({
          verdict: j.verdict,
          category: j.category,
          weight: j.weight,
          why: j.why,
        })),
      },
    },
    include: { judgments: true },
  });

  return Response.json(created);
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
