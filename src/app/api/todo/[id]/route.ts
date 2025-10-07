import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function PATCH(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const idNum = parseInt(id, 10);
  if (!Number.isInteger(idNum)) {
    return NextResponse.json({ error: 'invalid id' }, { status: 400 });
  }
  const body = await _req.json();
  const { content, done, order } = body as { content?: string; done?: boolean; order?: number };
  const updated = await prisma.todo.update({
    where: { id: idNum },
    data: {
      ...(typeof content === 'string' ? { content } : {}),
      ...(typeof done === 'boolean' ? { done } : {}),
      ...(typeof order === 'number' ? { order } : {}),
    },
  });
  return NextResponse.json(updated);
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const idNum = parseInt(id, 10);
  if (!Number.isInteger(idNum)) {
    return NextResponse.json({ error: 'invalid id' }, { status: 400 });
  }
  await prisma.todo.delete({ where: { id: idNum } });
  return NextResponse.json({ ok: true });
}
