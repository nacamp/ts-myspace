import { NextResponse, NextRequest } from "next/server";
import prisma from "@/lib/prisma";

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const depositProductId = parseInt(id, 10);

  const whereClause = {
    depositProductId,
  };

  const result = await prisma.demandDepositTransaction.aggregate({
    _sum: {
      profit: true,
    },
    where: whereClause,
  });
  const profit = result._sum.profit ?? 0;

  try {
    const updated = await prisma.depositProduct.update({
      where: { id: depositProductId },
      data: { profit },
    });
    return NextResponse.json({ success: true, data: updated });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Update failed" }, { status: 500 });
  }
}
