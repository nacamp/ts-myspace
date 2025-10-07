import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const date = searchParams.get('date');
  if (!date) return NextResponse.json({ error: 'date is required' }, { status: 400 });

  const data = await prisma.todo.findMany({
    where: { date },
    orderBy: [{ order: 'asc' }, { createdAt: 'asc' }],
  });
  return NextResponse.json(data);
}

export async function POST(req: Request) {
  const body = await req.json();
  const { date, content, order, done } = body as {
    date?: string;
    content?: string;
    order?: number;
    done?: boolean;
  };
  if (!date) return NextResponse.json({ error: 'date is required' }, { status: 400 });
  if (typeof content !== 'string') return NextResponse.json({ error: 'content is required' }, { status: 400 });

  // order 미지정 시 해당 날짜의 최대 order+1 부여
  let nextOrder = order;
  if (typeof nextOrder !== 'number') {
    const max = await prisma.todo.aggregate({
      _max: { order: true },
      where: { date },
    });
    nextOrder = (max._max.order ?? 0) + 1;
  }

  const created = await prisma.todo.create({
    data: { date, content, order: nextOrder, done: !!done },
  });
  return NextResponse.json(created, { status: 201 });
}
