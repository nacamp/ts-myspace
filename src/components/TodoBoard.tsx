'use client';

import React, { useEffect, useMemo, useState } from 'react';
import dayjs from 'dayjs';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export type Todo = {
  id: number;
  date: string;
  content: string;
  order: number;
  done: boolean;
};

type Props = { date: string };

const isYYYYMMDD = (s: string) => /^\d{4}-\d{2}-\d{2}$/.test(s);

export default function TodoBoard({ date }: Props) {
  const [rows, setRows] = useState<Todo[]>([]);
  const [loading, setLoading] = useState(true);
  const [editMode, setEditMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());

  // ⬇️ 보드 상단에서 선택할 날짜(초기값은 prop의 date)
  const [boardDate, setBoardDate] = useState<string>(date);
  useEffect(() => setBoardDate(date), [date]); // 부모가 바뀌면 동기화

  const timersRef = React.useRef<Map<number, ReturnType<typeof setTimeout>>>(new Map());
  const pendingRef = React.useRef<Map<number, Partial<Todo>>>(new Map());

  const flushSave = async (id: number) => {
    const patch = pendingRef.current.get(id);
    if (!patch) return;
    pendingRef.current.delete(id);
    try {
      await fetch(`/api/todo/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(patch),
        keepalive: true,
      });
    } catch (e) {
      // eslint-disable-next-line no-console
      console.error('[flushSave] error:', e);
      const prev = pendingRef.current.get(id) ?? {};
      pendingRef.current.set(id, { ...prev, ...patch });
    }
  };

  const scheduleSave = (id: number, patch: Partial<Todo>, delay = 600) => {
    const prev = pendingRef.current.get(id) ?? {};
    pendingRef.current.set(id, { ...prev, ...patch });
    const t = timersRef.current.get(id);
    if (t) clearTimeout(t);
    timersRef.current.set(
      id,
      setTimeout(() => {
        timersRef.current.delete(id);
        flushSave(id);
      }, delay),
    );
  };

  // ⬇️ 리스트는 항상 'boardDate' 기준으로 가져옴
  useEffect(() => {
    (async () => {
      try {
        setLoading(true);
        const r = await fetch(`/api/todo?date=${encodeURIComponent(boardDate)}`, { cache: 'no-store' });
        const json = await r.json();
        setRows(json as Todo[]);
      } finally {
        setLoading(false);
      }
    })();
  }, [boardDate]);

  const selectedCount = selectedIds.size;
  const allSelected = useMemo(
    () => editMode && rows.length > 0 && rows.every((r) => selectedIds.has(r.id)),
    [editMode, rows, selectedIds],
  );

  const toggleRowSelect = (id: number, checked: boolean) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (checked) next.add(id);
      else next.delete(id);
      return next;
    });
  };

  const toggleSelectAll = (checked: boolean) => {
    if (!editMode) return;
    setSelectedIds(checked ? new Set(rows.map((r) => r.id)) : new Set());
  };

  // ⬇️ ADD는 현재 보드 날짜(boardDate)로 생성 → 미래 날짜 선택 후 ADD 누르면 그 날짜로 생성됨
  const handleAdd = async () => {
    if (!isYYYYMMDD(boardDate)) return;
    const res = await fetch('/api/todo', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ date: boardDate, content: '' }),
    });
    if (!res.ok) return;
    const created = (await res.json()) as Todo;
    setRows((prev) => [...prev, created]);
  };

  const handleDeleteSelected = async () => {
    if (selectedIds.size === 0) return;
    const ids = Array.from(selectedIds);
    setRows((prev) => prev.filter((r) => !selectedIds.has(r.id))); // optimistic
    setSelectedIds(new Set());
    await fetch('/api/todo/batch-delete', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ids }),
    });
  };

  const handleContentChange = (id: number, value: string) => {
    setRows((prev) => prev.map((r) => (r.id === id ? { ...r, content: value } : r)));
    scheduleSave(id, { content: value }, 5000);
  };

  const handleDoneToggle = (id: number, done: boolean) => {
    setRows((prev) => prev.map((r) => (r.id === id ? { ...r, done } : r)));
    scheduleSave(id, { done }, 200);
  };

  // 편의 버튼
  const shift = (iso: string, days: number) => dayjs(iso).add(days, 'day').format('YYYY-MM-DD');
  const todayStr = dayjs().format('YYYY-MM-DD');

  return (
    <div className="space-y-6">
      {/* 상단: 날짜 선택 + 빠른 버튼들 */}
      <div className="flex items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold">📝 TODO</h1>
          <div className="text-sm text-muted-foreground">날짜를 바꾸고 ADD를 누르면 그 날짜로 생성됩니다.</div>
        </div>
        <div className="flex items-center gap-2">
          <Input type="date" value={boardDate} onChange={(e) => setBoardDate(e.target.value)} className="w-[160px]" />
          <Button variant="outline" size="sm" onClick={() => setBoardDate(todayStr)}>
            오늘
          </Button>
          <Button variant="outline" size="sm" onClick={() => setBoardDate(shift(boardDate || todayStr, 1))}>
            내일
          </Button>
          <Button variant="outline" size="sm" onClick={() => setBoardDate(shift(boardDate || todayStr, 2))}>
            모레
          </Button>
          <Button variant="outline" size="sm" onClick={() => setBoardDate(shift(boardDate || todayStr, 7))}>
            +1주
          </Button>
        </div>
      </div>

      <Card className="shadow-sm">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-lg">
            날짜: <span className="font-mono">{boardDate}</span>
          </CardTitle>
          <div className="flex items-center gap-2">
            {editMode && (
              <Button variant="destructive" disabled={selectedCount === 0} onClick={handleDeleteSelected}>
                Delete ({selectedCount})
              </Button>
            )}
            <Button
              variant={editMode ? 'secondary' : 'outline'}
              onClick={() => {
                setEditMode((v) => !v);
                setSelectedIds(new Set());
              }}
            >
              {editMode ? 'Done' : 'Edit'}
            </Button>
            <Button onClick={handleAdd}>ADD</Button> {/* ← 항상 boardDate로 생성 */}
          </div>
        </CardHeader>

        <CardContent>
          {loading ? (
            <div className="p-6 text-muted-foreground">로딩 중…</div>
          ) : (
            <div className="rounded-lg border overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    {editMode && (
                      <TableHead className="w-[44px]">
                        <div className="flex items-center justify-center">
                          <Checkbox checked={allSelected} onCheckedChange={(v) => toggleSelectAll(Boolean(v))} />
                        </div>
                      </TableHead>
                    )}
                    <TableHead>내용</TableHead>
                    <TableHead className="w-[110px] text-center">완료</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {rows.map((row) => {
                    const selected = selectedIds.has(row.id);
                    return (
                      <TableRow key={row.id} className={selected ? 'bg-muted/40' : ''}>
                        {editMode && (
                          <TableCell className="text-center">
                            <Checkbox checked={selected} onCheckedChange={(v) => toggleRowSelect(row.id, Boolean(v))} />
                          </TableCell>
                        )}
                        <TableCell>
                          <Textarea
                            value={row.content}
                            onChange={(e) => handleContentChange(row.id, e.target.value)}
                            onBlur={() => flushSave(row.id)}
                            placeholder="할 일을 입력하세요 (멀티라인)"
                            className="min-h-[80px]"
                          />
                        </TableCell>
                        <TableCell className="text-center">
                          <div className="flex items-center justify-center">
                            <Checkbox
                              checked={row.done}
                              onCheckedChange={(v) => handleDoneToggle(row.id, Boolean(v))}
                            />
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })}

                  {rows.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={editMode ? 3 : 2} className="text-center text-muted-foreground py-8">
                        항목이 없습니다. <span className="font-medium">ADD</span>로 추가하세요.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          )}

          <div className="flex items-center justify-between text-sm text-muted-foreground mt-3">
            <div>
              총 <span className="font-medium text-foreground">{rows.length}</span>개 • 완료{' '}
              <span className="font-medium text-foreground">{rows.filter((r) => r.done).length}</span>개
            </div>
            <div className="hidden sm:block">내용/완료는 자동 저장 • 날짜 선택 후 ADD로 생성</div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
