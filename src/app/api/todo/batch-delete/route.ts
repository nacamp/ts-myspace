import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function POST(req: Request) {
  const body = await req.json();
  const ids = (body?.ids ?? []) as (string | number)[];
  const numericIds = ids.map(Number).filter((n) => Number.isInteger(n));
  if (numericIds.length === 0) {
    return NextResponse.json({ error: 'ids is required' }, { status: 400 });
  }
  await prisma.todo.deleteMany({ where: { id: { in: numericIds } } });
  return NextResponse.json({ ok: true });
}
