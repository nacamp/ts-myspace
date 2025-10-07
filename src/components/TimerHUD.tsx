'use client';

import { useTimer, formatHMS } from '@/app/providers/TimerProvider';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';

export default function TimerHUD() {
  const { hudOpen, closeHUD, running, elapsedMs, start, pause, reset } = useTimer();

  return (
    <Dialog open={hudOpen} onOpenChange={(open) => (!open ? closeHUD() : null)}>
      <DialogContent className="sm:max-w-[420px]">
        <DialogHeader>
          <DialogTitle>⏱ 타이머</DialogTitle>
        </DialogHeader>

        <div className="flex flex-col items-center gap-4 py-2">
          <div className="text-5xl font-bold tabular-nums">{formatHMS(elapsedMs)}</div>
          <div className="flex gap-2">
            {running ? (
              <Button variant="default" onClick={pause} className="rounded-2xl px-5">
                멈춤
              </Button>
            ) : (
              <Button variant="default" onClick={start} className="rounded-2xl px-5">
                시작
              </Button>
            )}
            <Button variant="secondary" onClick={reset} className="rounded-2xl px-5">
              리셋
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// 모달을 여는 우측 하단 플로팅 버튼
export function TimerFab() {
  const { openHUD, running, elapsedMs, toggle } = useTimer();

  return (
    <div className="fixed bottom-5 right-5 flex items-center gap-2 z-50">
      <button
        onClick={openHUD}
        className="rounded-full shadow-lg px-4 py-2 bg-white border hover:shadow-xl dark:bg-gray-800 dark:text-white"
        aria-label="Open timer"
      >
        ⏱ {formatHMS(elapsedMs)}
      </button>
      <button
        onClick={toggle}
        className="rounded-full shadow-lg px-4 py-2 bg-white border hover:shadow-xl dark:bg-gray-800 dark:text-white"
        aria-label="Toggle timer"
        title={running ? '멈추기' : '시작하기'}
      >
        {running ? '⏸' : '▶️'}
      </button>
    </div>
  );
}
