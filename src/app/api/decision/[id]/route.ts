import { NextResponse, NextRequest } from "next/server";
import prisma from "@/lib/prisma";
import { getSearchDate } from "@/lib/utils";

export async function GET(
  _: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const decisionId = parseInt(id, 10);
  console.log("here", decisionId);
  // const id = Number(params.id);
  // console.log(id)
  // if (isNaN(id)) return new Response("Invalid ID", { status: 400 });
  // console.log(decision)
  const decision = await prisma.decision.findUnique({
    where: { id: decisionId },
    include: { judgments: true },
  });
  console.log(decision);
  if (!decision) return new Response("Not found", { status: 404 });
  return Response.json(decision);
}

// PUT: 특정 decisionId 수정
export async function PUT(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const id = Number(params.id);
  if (isNaN(id)) return new Response("Invalid ID", { status: 400 });

  const body = await req.json();

  // 기존 judgment 모두 삭제 후 새로 저장 (간단한 방식)
  await prisma.judgment.deleteMany({
    where: { decisionId: id },
  });

  const updated = await prisma.decision.update({
    where: { id },
    data: {
      title: body.title,
      why: body.why,
      result: body.result,
      createdAt: body.createdAt,
      judgments: {
        create: body.judgments.map((j: any) => ({
          verdict: j.verdict,
          category: j.category,
          weight: j.weight,
          why: j.why,
        })),
      },
    },
    include: { judgments: true },
  });
  console.log(updated);
  return Response.json(updated);
}

export async function DELETE(
  _: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const decisionId = parseInt(id, 10);

  if (isNaN(decisionId)) {
    return NextResponse.json({ error: "Invalid ID" }, { status: 400 });
  }

  try {
    await prisma.decision.delete({
      where: { id: decisionId },
    });
    return NextResponse.json({ message: "Deleted" });
  } catch (err) {
    console.error("[DELETE] /api/decision/:id", err);
    return NextResponse.json({ error: "Failed to delete" }, { status: 500 });
  }
}
