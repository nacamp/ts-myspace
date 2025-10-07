'use client';

import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, ReactNode } from 'react';

type TimerState = {
  running: boolean;
  elapsedMs: number; // 표시용 (ms)
};

type TimerActions = {
  start: () => void;
  pause: () => void;
  reset: () => void;
  toggle: () => void;
  openHUD: () => void;
  closeHUD: () => void;
};

type TimerContextValue = TimerState &
  TimerActions & {
    hudOpen: boolean;
  };

const TimerContext = createContext<TimerContextValue | null>(null);

const STORAGE_KEY = 'global_timer_state_v1';

type Persisted = {
  running: boolean;
  accumulated: number; // 정지시까지 누적(ms)
  startAt: number | null; // running일 때만 값 있음 (epoch ms)
};

function loadPersist(): Persisted {
  if (typeof window === 'undefined') return { running: false, accumulated: 0, startAt: null };
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return { running: false, accumulated: 0, startAt: null };
    const p = JSON.parse(raw) as Persisted;

    // running 중이던 상태 복원 시, 새로고침 순간부터 지금까지 추가 반영
    if (p.running && p.startAt) {
      const now = Date.now();
      const delta = Math.max(0, now - p.startAt);
      return { running: true, accumulated: p.accumulated, startAt: now - delta + delta }; // 그대로
    }
    return p;
  } catch {
    return { running: false, accumulated: 0, startAt: null };
  }
}

function savePersist(p: Persisted) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(p));
  } catch {
    /* empty */
  }
}

export function TimerProvider({ children }: { children: ReactNode }) {
  // 내부 원장값: accumulated/startAt/running
  const [{ accumulated, startAt, running }, setCore] = useState<Persisted>(() => loadPersist());
  const [hudOpen, setHudOpen] = useState(false);
  const rafRef = useRef<number | null>(null);
  const [elapsedMs, setElapsedMs] = useState<number>(() => {
    if (running && startAt) return accumulated + (Date.now() - startAt);
    return accumulated;
  });

  // UI 표시 업데이트: requestAnimationFrame으로 부드럽게 (1초 단위면 setInterval(1000)로 바꿔도 됨)
  const tick = useCallback(() => {
    if (!running) return;
    const now = Date.now();
    if (startAt) {
      setElapsedMs(accumulated + (now - startAt));
    }
    rafRef.current = requestAnimationFrame(tick);
  }, [running, startAt, accumulated]);

  useEffect(() => {
    if (running) {
      rafRef.current = requestAnimationFrame(tick);
      return () => {
        if (rafRef.current) cancelAnimationFrame(rafRef.current);
      };
    } else {
      // 멈춘 상태에선 고정
      setElapsedMs(accumulated);
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    }
  }, [running, tick, accumulated]);

  // 저장
  useEffect(() => {
    savePersist({ running, accumulated, startAt });
  }, [running, accumulated, startAt]);

  const start = useCallback(() => {
    if (running) return;
    const now = Date.now();
    setCore((prev) => ({ ...prev, running: true, startAt: now }));
  }, [running]);

  const pause = useCallback(() => {
    if (!running) return;
    const now = Date.now();
    setCore((prev) => {
      const add = prev.startAt ? now - prev.startAt : 0;
      return { running: false, startAt: null, accumulated: prev.accumulated + add };
    });
  }, [running]);

  const reset = useCallback(() => {
    setCore({ running: false, accumulated: 0, startAt: null });
  }, []);

  const toggle = useCallback(() => {
    if (running) pause();
    else start();
  }, [running, pause, start]);

  const openHUD = useCallback(() => setHudOpen(true), []);
  const closeHUD = useCallback(() => setHudOpen(false), []);

  const value = useMemo<TimerContextValue>(
    () => ({ running, elapsedMs, start, pause, reset, toggle, hudOpen, openHUD, closeHUD }),
    [running, elapsedMs, start, pause, reset, toggle, hudOpen, openHUD, closeHUD],
  );

  return <TimerContext.Provider value={value}>{children}</TimerContext.Provider>;
}

export function useTimer() {
  const ctx = useContext(TimerContext);
  if (!ctx) throw new Error('useTimer must be used within TimerProvider');
  return ctx;
}

// 표시용 유틸
export function formatHMS(ms: number) {
  const totalSec = Math.floor(ms / 1000);
  const h = Math.floor(totalSec / 3600);
  const m = Math.floor((totalSec % 3600) / 60);
  const s = totalSec % 60;
  const hh = h.toString();
  const mm = String(m).padStart(2, '0');
  const ss = String(s).padStart(2, '0');
  return h > 0 ? `${hh}:${mm}:${ss}` : `${mm}:${ss}`;
}
