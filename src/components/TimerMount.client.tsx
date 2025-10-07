'use client';

import dynamic from 'next/dynamic';

// 클라에서만 렌더 (SSR 끔)
const TimerHUD = dynamic(() => import('@/components/TimerHUD'), { ssr: false });
const TimerFab = dynamic(() => import('@/components/TimerHUD').then((m) => m.TimerFab), { ssr: false });

export default function TimerMount() {
  return (
    <>
      <TimerHUD />
      <TimerFab />
    </>
  );
}
