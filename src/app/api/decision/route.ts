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

  const { title, why, result, createdAt, judgments } = body;

  const created = await prisma.decision.create({
    data: {
      title,
      why,
      result,
      createdAt,
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