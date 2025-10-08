import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

// 간단 스니펫: 첫 줄 기준으로 80자 자르기
function snippet(s: string, max = 80) {
  const firstLine = s.split(/\r?\n/)[0] ?? '';
  return firstLine.length > max ? firstLine.slice(0, max - 1) + '…' : firstLine;
}

// 'yyyymm' → 'yyyy-mm' & 월 시작/끝(문자열) 계산
function monthRangeFromYYYYMM(yyyymm: string) {
  const onlyDigits = yyyymm.replace(/[^\d]/g, '').slice(0, 6);
  if (!/^\d{6}$/.test(onlyDigits)) return null;
  const y = Number(onlyDigits.slice(0, 4));
  const m = Number(onlyDigits.slice(4, 6));
  const last = new Date(y, m, 0).getDate(); // 말일
  const ymDashed = `${y}-${String(m).padStart(2, '0')}`;
  const start = `${ymDashed}-01`;
  const end = `${ymDashed}-${String(last).padStart(2, '0')}`;
  return { start, end };
}

// GET /api/todo/summary-with-previews?k=3
// 응답: [{ date, total, done, previews: [{ id, done, snippet }] }]
export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const k = Math.max(1, Math.min(10, Number(searchParams.get('k') ?? 3))); // 1~10 제한
  const yyyymm = searchParams.get('yyyymm') ?? '';
  let todos: {
    id: number;
    date: string;
    done: boolean;
    content: string;
    order: number;
    createdAt: Date;
  }[] = [];
  if (yyyymm) {
    // 특정 월 검색
    const range = monthRangeFromYYYYMM(yyyymm);
    if (!range) {
      return NextResponse.json({ error: 'Invalid yyyymm. Use yyyymm like 202510.' }, { status: 400 });
    }

    todos = await prisma.todo.findMany({
      where: { date: { gte: range.start, lte: range.end } },
      select: { id: true, date: true, done: true, content: true, order: true, createdAt: true },
      orderBy: [{ date: 'desc' }, { order: 'asc' }, { createdAt: 'asc' }],
    });
  } else {
    // 날짜 조건이 없을 경우: 최신 순으로 5건만 조회
    todos = await prisma.todo.findMany({
      select: { id: true, date: true, done: true, content: true, order: true, createdAt: true },
      orderBy: [{ date: 'desc' }, { order: 'asc' }, { createdAt: 'asc' }],
      take: 10,
    });
  }

  const byDate = new Map<
    string,
    { total: number; done: number; items: { id: number; done: boolean; content: string }[] }
  >();

  for (const t of todos) {
    const e = byDate.get(t.date) ?? { total: 0, done: 0, items: [] };
    e.total += 1;
    if (t.done) e.done += 1;
    e.items.push({ id: t.id, done: t.done, content: t.content });
    byDate.set(t.date, e);
  }

  // 날짜 내림차순 + 미리보기 생성 (미완료 우선, 그 다음 완료)
  const result = Array.from(byDate.entries())
    .sort(([a], [b]) => (a < b ? 1 : a > b ? -1 : 0))
    .map(([date, { total, done, items }]) => {
      const ordered = [...items.filter((i) => !i.done), ...items.filter((i) => i.done)];
      const previews = ordered.slice(0, k).map((i) => ({
        id: i.id,
        done: i.done,
        snippet: snippet(i.content),
      }));
      return { date, total, done, previews };
    });

  return NextResponse.json(result);
}
