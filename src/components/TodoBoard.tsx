// 'use client';

// import React, { useEffect, useMemo, useState } from 'react';
// import { Button } from '@/components/ui/button';
// import { Checkbox } from '@/components/ui/checkbox';
// import { Textarea } from '@/components/ui/textarea';
// import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
// import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

// type Todo = {
//   id: string;
//   content: string; // 멀티라인 입력
//   done: boolean;
// };

// type Props = {
//   /** 화면 상단 타이틀에 보여줄 날짜 문자열 (예: "2025-10-04") */
//   date: string;
// };

// function uid() {
//   return Math.random().toString(36).slice(2, 10);
// }

// export default function TodoBoard({ date }: Props) {
//   const STORAGE_KEY = `todo_rows_v2:${date}`; // 날짜별 저장 분리

//   const [rows, setRows] = useState<Todo[]>([]);
//   const [editMode, setEditMode] = useState(false);
//   const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

//   // ---- Load / Save ----
//   useEffect(() => {
//     try {
//       const raw = localStorage.getItem(STORAGE_KEY);
//       if (raw) {
//         setRows(JSON.parse(raw) as Todo[]);
//       } else {
//         setRows([{ id: uid(), content: '', done: false }]);
//       }
//     } catch {
//       // 무시
//     }
//     // eslint-disable-next-line react-hooks/exhaustive-deps
//   }, [STORAGE_KEY]);

//   useEffect(() => {
//     localStorage.setItem(STORAGE_KEY, JSON.stringify(rows));
//   }, [rows, STORAGE_KEY]);

//   // ---- Derived ----
//   const selectedCount = selectedIds.size;
//   const allSelected = useMemo(() => {
//     if (!editMode || rows.length === 0) return false;
//     return rows.every((r) => selectedIds.has(r.id));
//   }, [editMode, rows, selectedIds]);

//   // ---- Handlers ----
//   const handleAdd = () => {
//     setRows((prev) => [...prev, { id: uid(), content: '', done: false }]);
//   };

//   const handleToggleEdit = () => {
//     setEditMode((prev) => !prev);
//     setSelectedIds(new Set());
//   };

//   const handleDeleteSelected = () => {
//     if (selectedIds.size === 0) return;
//     setRows((prev) => prev.filter((r) => !selectedIds.has(r.id)));
//     setSelectedIds(new Set());
//   };

//   const toggleRowSelect = (id: string, checked: boolean) => {
//     setSelectedIds((prev) => {
//       const next = new Set(prev);
//       if (checked) next.add(id);
//       else next.delete(id);
//       return next;
//     });
//   };

//   const toggleSelectAll = (checked: boolean) => {
//     if (!editMode) return;
//     setSelectedIds(checked ? new Set(rows.map((r) => r.id)) : new Set());
//   };

//   const updateRow = <K extends keyof Todo>(id: string, key: K, value: Todo[K]) => {
//     setRows((prev) => prev.map((r) => (r.id === id ? { ...r, [key]: value } : r)));
//   };

//   const doneCount = rows.filter((r) => r.done).length;

//   return (
//     <div className="space-y-6">
//       <h1 className="text-2xl font-bold">
//         📝 TODO — <span className="font-mono">{date}</span>
//       </h1>

//       <Card className="shadow-sm">
//         <CardHeader className="flex flex-row items-center justify-between">
//           <CardTitle className="text-lg">할 일</CardTitle>
//           <div className="flex items-center gap-2">
//             {editMode && (
//               <Button variant="destructive" disabled={selectedCount === 0} onClick={handleDeleteSelected}>
//                 Delete ({selectedCount})
//               </Button>
//             )}
//             <Button variant={editMode ? 'secondary' : 'outline'} onClick={handleToggleEdit}>
//               {editMode ? 'Done' : 'Edit'}
//             </Button>
//             <Button onClick={handleAdd}>ADD</Button>
//           </div>
//         </CardHeader>

//         <CardContent>
//           <div className="rounded-lg border">
//             <Table>
//               <TableHeader>
//                 <TableRow>
//                   {editMode && (
//                     <TableHead className="w-[44px]">
//                       <div className="flex items-center justify-center">
//                         <Checkbox
//                           checked={allSelected}
//                           onCheckedChange={(v) => toggleSelectAll(Boolean(v))}
//                           aria-label="select all rows"
//                         />
//                       </div>
//                     </TableHead>
//                   )}
//                   <TableHead>내용</TableHead>
//                   <TableHead className="w-[110px] text-center">완료</TableHead>
//                 </TableRow>
//               </TableHeader>

//               <TableBody>
//                 {rows.map((row) => {
//                   const selected = selectedIds.has(row.id);
//                   return (
//                     <TableRow key={row.id} className={selected ? 'bg-muted/40' : ''}>
//                       {editMode && (
//                         <TableCell className="text-center">
//                           <Checkbox
//                             checked={selected}
//                             onCheckedChange={(v) => toggleRowSelect(row.id, Boolean(v))}
//                             aria-label="select row"
//                           />
//                         </TableCell>
//                       )}

//                       {/* 내용: 멀티라인 */}
//                       <TableCell>
//                         <Textarea
//                           value={row.content}
//                           onChange={(e) => updateRow(row.id, 'content', e.target.value)}
//                           placeholder="할 일을 입력하세요 (멀티라인 지원)"
//                           className="min-h-[80px]"
//                         />
//                       </TableCell>

//                       {/* 완료 여부 */}
//                       <TableCell className="text-center">
//                         <div className="flex items-center justify-center">
//                           <Checkbox
//                             checked={row.done}
//                             onCheckedChange={(v) => updateRow(row.id, 'done', Boolean(v))}
//                             aria-label="toggle done"
//                           />
//                         </div>
//                       </TableCell>
//                     </TableRow>
//                   );
//                 })}

//                 {rows.length === 0 && (
//                   <TableRow>
//                     <TableCell colSpan={editMode ? 3 : 2} className="text-center text-muted-foreground py-8">
//                       항목이 없습니다. <span className="font-medium">ADD</span>로 추가하세요.
//                     </TableCell>
//                   </TableRow>
//                 )}
//               </TableBody>
//             </Table>
//           </div>

//           <div className="flex items-center justify-between text-sm text-muted-foreground mt-3">
//             <div>
//               총 <span className="font-medium text-foreground">{rows.length}</span>개 • 완료{' '}
//               <span className="font-medium text-foreground">{doneCount}</span>개
//             </div>
//             <div className="hidden sm:block">로컬에 자동 저장됨</div>
//           </div>
//         </CardContent>
//       </Card>
//     </div>
//   );
// }

'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Textarea } from '@/components/ui/textarea';
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

export default function TodoBoard({ date }: Props) {
  const [rows, setRows] = useState<Todo[]>([]);
  const [loading, setLoading] = useState(true);
  const [editMode, setEditMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set()); // 컴포넌트 내부 상단에 추가
  const timersRef = React.useRef<Map<number, ReturnType<typeof setTimeout>>>(new Map());
  const pendingRef = React.useRef<Map<number, Partial<Todo>>>(new Map());

  const flushSave = async (id: number) => {
    const patch = pendingRef.current.get(id);
    if (!patch) {
      return;
    }
    pendingRef.current.delete(id);

    try {
      await fetch(`/api/todo/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(patch),
        keepalive: true, // 탭 닫힐 때도 전송 시도 (지원 브라우저 한정)
      });
    } catch (e) {
      // eslint-disable-next-line no-console
      console.error('[flushSave] error:', e);
      // 실패 시 다시 대기열로 되돌리기(옵션)
      const prev = pendingRef.current.get(id) ?? {};
      pendingRef.current.set(id, { ...prev, ...patch });
    }
  };

  // 디바운스 스케줄러
  const scheduleSave = (id: number, patch: Partial<Todo>, delay = 600) => {
    // pending 병합
    const prev = pendingRef.current.get(id) ?? {};
    pendingRef.current.set(id, { ...prev, ...patch });

    // 타이머 재설정
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

  // ---- Fetch list ----
  useEffect(() => {
    (async () => {
      try {
        setLoading(true);
        const r = await fetch(`/api/todo?date=${encodeURIComponent(date)}`, { cache: 'no-store' });
        const json = await r.json();
        setRows(json as Todo[]);
      } finally {
        setLoading(false);
      }
    })();
  }, [date]);

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

  // ---- CRUD ----
  const handleAdd = async () => {
    const res = await fetch('/api/todo', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ date, content: '' }),
    });
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

  // 내용 변경 시: 로컬 상태만 즉시 업데이트 + 디바운스 저장 스케줄
  const handleContentChange = (id: number, value: string) => {
    // console.log(111);
    setRows((prev) => prev.map((r) => (r.id === id ? { ...r, content: value } : r)));
    scheduleSave(id, { content: value }, 5000); // 700ms 후 저장 (원하면 500~1000 조절)
  };

  // 체크박스 변경은 즉시 저장해도 보통 무난 (토글은 이벤트 빈도 낮음)
  const handleDoneToggle = (id: number, done: boolean) => {
    setRows((prev) => prev.map((r) => (r.id === id ? { ...r, done } : r)));
    // 즉시 저장 또는 짧은 디바운스
    scheduleSave(id, { done }, 200);
  };

  const doneCount = rows.filter((r) => r.done).length;

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">
        📝 TODO — <span className="font-mono">{date}</span>
      </h1>

      <Card className="shadow-sm">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-lg">할 일</CardTitle>
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
            <Button onClick={handleAdd}>ADD</Button>
          </div>
        </CardHeader>

        <CardContent>
          {loading ? (
            <div className="p-6 text-muted-foreground">로딩 중…</div>
          ) : (
            <div className="rounded-lg border">
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
                            // onChange={(e) => updateField(row.id, { content: e.target.value })}
                            onChange={(e) => handleContentChange(row.id, e.target.value)}
                            onBlur={() => {
                              flushSave(row.id);
                            }}
                            placeholder="할 일을 입력하세요 (멀티라인)"
                            className="min-h-[80px]"
                          />
                        </TableCell>
                        <TableCell className="text-center">
                          <div className="flex items-center justify-center">
                            <Checkbox
                              checked={row.done}
                              // onCheckedChange={(v) => updateField(row.id, { done: Boolean(v) })}
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
              <span className="font-medium text-foreground">{doneCount}</span>개
            </div>
            <div className="hidden sm:block">DB에 자동 저장됨</div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
