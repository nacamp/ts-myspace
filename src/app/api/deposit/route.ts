import { NextResponse, NextRequest } from "next/server";
import prisma from "@/lib/prisma";

export async function GET(req: NextRequest) {
  const data = await prisma.depositProduct.findMany();
  return NextResponse.json(data);
}

export async function POST(req: Request) {
  const data = await req.json();
  await prisma.depositProduct.create({ data });
  return NextResponse.json({ success: true });
}