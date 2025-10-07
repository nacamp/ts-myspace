import { ensureKisToken } from '@/services/kis.server';
import DashboardPage from './DashboardPage'; // 'use client'

export default async function Page() {
  await ensureKisToken(); // 서버에서 미리 토큰 보장
  return <DashboardPage />;
}
