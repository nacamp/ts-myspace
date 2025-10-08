'use client';

import React, { useEffect, useMemo, useState } from 'react';
import dynamic from 'next/dynamic';
import dayjs from 'dayjs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';

import Search, { SearchField } from '@/components/Search';

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
  const [isFiltered, setIsFiltered] = useState(false); // ← 검색 모드 플래그

  const today = dayjs().format('YYYY-MM-DD');

  useEffect(() => {
    (async () => {
      setLoading(true);
      try {
        const r = await fetch('/api/todo/summary-with-previews?k=3', { cache: 'no-store' });
        const data = (await r.json()) as SummaryWithPreviews[];
        setRowsRaw(data);
        setIsFiltered(false); // 초기 진입은 비검색 모드
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  // 오늘이 없다면 가상 행 추가 (단, 검색 모드가 아닐 때만)
  const rows = useMemo<SummaryWithPreviews[]>(() => {
    const hasToday = rowsRaw.some((s) => s.date === today);
    if (!isFiltered && !hasToday) {
      return [{ date: today, total: 0, done: 0, previews: [] }, ...rowsRaw];
    }
    return rowsRaw;
  }, [rowsRaw, today, isFiltered]);

  // 최초 진입 시(비검색 모드) 오늘이 실제 rows에 있을 때만 자동 오픈
  useEffect(() => {
    if (rows.length === 0) return;
    if (isFiltered) return; // 검색 중이면 자동 오픈 X
    if (!rows.some((r) => r.date === today)) return; // rows에 today가 실제로 있을 때만
    setOpenItems((prev) => (prev.includes(today) ? prev : [today, ...prev]));
  }, [rows, today, isFiltered]);

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

    // 요약 데이터 즉시 갱신
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

  // search
  const [searchValues, setSearchValues] = useState<Record<string, string>>({});
  const fields: SearchField[] = [{ key: 'date', label: '년월(YYYYMM)', type: 'input' }];

  const handleSearchChange = (key: string, val: string) => {
    setSearchValues((prev) => ({ ...prev, [key]: val }));
  };

  const normalizeToYYYYMM = (s: string) => s.replace(/[^\d]/g, '').slice(0, 6); // 숫자만 6자리
  const toDashed = (yyyymm: string) => (yyyymm.length === 6 ? `${yyyymm.slice(0, 4)}-${yyyymm.slice(4, 6)}` : '');

  const fetchMonthSummary = async (monthYYYYMM: string) => {
    const yyyymm = normalizeToYYYYMM(monthYYYYMM);
    const month = toDashed(yyyymm); // 'YYYY-MM'
    if (!/^\d{4}-\d{2}$/.test(month)) {
      throw new Error('월 형식이 올바르지 않습니다. 예) 202510 또는 2025-10');
    }
    const r = await fetch(`/api/todo/summary-with-previews?yyyymm=${yyyymm}&k=3`, { cache: 'no-store' });
    if (!r.ok) {
      const text = await r.text().catch(() => '');
      throw new Error(`[month/summary] HTTP ${r.status} ${text}`);
    }
    const data = (await r.json()) as SummaryWithPreviews[];
    return { data, month };
  };

  const handleSearch = async () => {
    setLoading(true);
    try {
      const monthInput = searchValues.date ?? '';
      const { data, month } = await fetchMonthSummary(monthInput);

      // 월 검색 결과 반영 + 검색 모드 진입
      setRowsRaw(data);
      setIsFiltered(true);

      // 그 달에 오늘이 포함되면 오늘을, 아니면 결과 첫 날짜를 오픈
      const todayInMonth = data.some((x) => x.date.startsWith(month));
      if (data.length > 0) {
        const firstDate = data[0].date;
        setOpenItems(todayInMonth ? [today] : [firstDate]);
      } else {
        setOpenItems([]);
      }
    } catch (e) {
      // eslint-disable-next-line no-console
      console.log(e);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6 space-y-6">
      <Search
        title="월별 검색"
        fields={fields}
        values={searchValues}
        onChange={handleSearchChange}
        onSearch={handleSearch}
      />
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
