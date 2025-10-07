'use client';

import React, { useEffect, useMemo, useState } from 'react';
import dynamic from 'next/dynamic';
import dayjs from 'dayjs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';

const TodoBoard = dynamic(() => import('@/components/TodoBoard'), { ssr: false });

type SummaryWithPreviews = {
  date: string;
  total: number;
  done: number;
  previews: { id: number; done: boolean; snippet: string }[];
};

export default function TodoHomePage() {
  const [rowsRaw, setRowsRaw] = useState<SummaryWithPreviews[]>([]);
  const [loading, setLoading] = useState(true);
  const [openItems, setOpenItems] = useState<string[]>([]);
  const [bootstrappedDates, setBootstrappedDates] = useState<Set<string>>(new Set());

  const today = dayjs().format('YYYY-MM-DD');

  useEffect(() => {
    (async () => {
      setLoading(true);
      try {
        const r = await fetch('/api/todo/summary-with-previews?k=3', { cache: 'no-store' });
        const data = (await r.json()) as SummaryWithPreviews[];
        setRowsRaw(data);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  // 오늘이 없다면 가상 행 추가
  const rows = useMemo<SummaryWithPreviews[]>(() => {
    if (rowsRaw.some((s) => s.date === today)) return rowsRaw;
    return [{ date: today, total: 0, done: 0, previews: [] }, ...rowsRaw];
  }, [rowsRaw, today]);

  // 최초 진입 시 오늘 펼치기
  useEffect(() => {
    if (rows.length === 0) return;
    setOpenItems((prev) => (prev.includes(today) ? prev : [today, ...prev]));
  }, [rows, today]);

  // Quick Add (오늘/빈 날짜에서 첫 항목 생성 후 TodoBoard로 전환)
  const [quickContent, setQuickContent] = useState<Record<string, string>>({});
  const handleQuickAdd = async (date: string) => {
    const content = (quickContent[date] ?? '').trim();
    const res = await fetch('/api/todo', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ date, content }),
    });
    if (!res.ok) return;

    // 요약 데이터 즉시 갱신: total + 1, previews에 방금 내용 한 개 추가(미완료 우선)
    setRowsRaw((prev) => {
      const next = [...prev];
      const idx = next.findIndex((x) => x.date === date);
      const createdPreview = { id: Date.now(), done: false, snippet: content || '(빈 항목)' };
      if (idx >= 0) {
        const row = next[idx];
        const previews = [createdPreview, ...row.previews].slice(0, 3);
        next[idx] = { ...row, total: row.total + 1, previews };
      } else {
        next.unshift({ date, total: 1, done: 0, previews: [createdPreview] });
      }
      return next;
    });

    setBootstrappedDates((s) => new Set(s).add(date));
    setQuickContent((c) => ({ ...c, [date]: '' }));
  };

  return (
    <div className="p-6 space-y-6">
      <h1 className="text-2xl font-bold">📅 Todo by Date</h1>

      <Card className="shadow-sm">
        <CardHeader>
          <CardTitle className="text-lg">일별 목록</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="p-4 text-muted-foreground">로딩 중…</div>
          ) : rows.length === 0 ? (
            <div className="p-4 text-muted-foreground">데이터가 없습니다. Todo를 추가해 주세요.</div>
          ) : (
            <Accordion
              type="multiple"
              value={openItems}
              onValueChange={(v) => setOpenItems(Array.isArray(v) ? v : [v])}
              className="w-full"
            >
              {rows.map(({ date, total, done, previews }) => {
                const remaining = total - done;
                const isToday = date === today;
                const showQuick = total === 0 && !bootstrappedDates.has(date);

                return (
                  <AccordionItem key={date} value={date} className="border-b">
                    <AccordionTrigger className="block">
                      <div className="flex items-center justify-between w-full">
                        <div className="flex items-center gap-4">
                          <span className="font-mono">{date}</span>
                          <span className="text-sm text-muted-foreground">
                            총 <span className="text-foreground font-medium">{total}</span> • 완료{' '}
                            <span className="text-foreground font-medium">{done}</span> • 미완료{' '}
                            <span className="text-foreground font-medium">{remaining}</span>
                          </span>
                        </div>
                      </div>

                      {/* 미리보기: 최대 3개 한 줄/두 줄 요약 */}
                      <div className="mt-2 flex flex-wrap gap-2">
                        {previews.length > 0 ? (
                          previews.map((p) => (
                            <span
                              key={p.id}
                              className={`text-xs px-2 py-1 rounded border ${
                                p.done ? 'line-through text-muted-foreground' : ''
                              }`}
                              title={p.snippet}
                            >
                              {p.snippet || '(빈 항목)'}
                            </span>
                          ))
                        ) : (
                          <span className="text-xs text-muted-foreground">
                            미리보기가 없습니다.
                            {isToday && total === 0 ? ' (오늘 항목을 추가해 보세요)' : ''}
                          </span>
                        )}
                      </div>
                    </AccordionTrigger>

                    <AccordionContent className="pt-4">
                      {showQuick ? (
                        <div className="space-y-3">
                          <p className="text-sm text-muted-foreground">
                            첫 항목을 추가해 보세요. 추가 후 상세 화면이 표시됩니다.
                          </p>
                          <Textarea
                            value={quickContent[date] ?? ''}
                            onChange={(e) => setQuickContent((c) => ({ ...c, [date]: e.target.value }))}
                            placeholder={`${date}에 할 일을 입력하세요 (멀티라인)`}
                            className="min-h-[100px]"
                          />
                          <div className="flex gap-2">
                            <Button onClick={() => handleQuickAdd(date)}>추가</Button>
                            <Button variant="secondary" onClick={() => handleQuickAdd(date)}>
                              내용 없이 추가
                            </Button>
                          </div>
                        </div>
                      ) : (
                        <TodoBoard date={date} />
                      )}
                    </AccordionContent>
                  </AccordionItem>
                );
              })}
            </Accordion>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
