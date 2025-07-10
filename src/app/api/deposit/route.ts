import { NextResponse, NextRequest } from "next/server";
import prisma from "@/lib/prisma";

export async function GET(req: NextRequest) {
  const data = await prisma.depositProduct.findMany();
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