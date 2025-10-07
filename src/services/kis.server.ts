import prisma from '@/lib/prisma';
import { env } from '@/config/env.server';

const PROVIDER = 'kis';
const TOKEN_SKEW_MS = 2 * 60 * 1000; // 만료 2분 전부터 갱신

type KisTokenResp = { access_token: string; expires_in?: number };

const isValid = (expAt: Date) => Date.now() + TOKEN_SKEW_MS < expAt.getTime();

async function requestKisTokenFromAPI(): Promise<{ token: string; expAt: Date }> {
  const res = await fetch('https://openapi.koreainvestment.com:9443/oauth2/tokenP', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      grant_type: 'client_credentials',
      appkey: env.KIS_APP_KEY,
      appsecret: env.KIS_APP_SECRET,
    }),
  });
  if (!res.ok) {
    const text = await res.text().catch(() => '');
    throw new Error(`[KIS token] HTTP ${res.status} ${text}`);
  }
  const data = (await res.json()) as KisTokenResp;
  const ttlSec = Number(data.expires_in ?? 3600);
  return { token: String(data.access_token), expAt: new Date(Date.now() + ttlSec * 1000) };
}

export async function ensureKisToken(): Promise<{ token: string; from: 'cache' | 'refresh' }> {
  const rec = await prisma.apiToken.findUnique({ where: { provider: PROVIDER } });

  if (rec && rec.token && isValid(rec.expAt)) {
    return { token: rec.token, from: 'cache' };
  }

  const fresh = await requestKisTokenFromAPI();
  await prisma.apiToken.upsert({
    where: { provider: PROVIDER },
    update: { token: fresh.token, expAt: fresh.expAt },
    create: { provider: PROVIDER, token: fresh.token, expAt: fresh.expAt },
  });

  return { token: fresh.token, from: 'refresh' };
}

export async function readKisTokenFromDB(): Promise<string | null> {
  const rec = await prisma.apiToken.findUnique({ where: { provider: PROVIDER } });
  if (!rec || !rec.token || !isValid(rec.expAt)) return null;
  return rec.token;
}

/** 강제 갱신(관리/디버그용) */
export async function forceRefreshKisToken(): Promise<string> {
  const fresh = await requestKisTokenFromAPI();
  await prisma.apiToken.upsert({
    where: { provider: PROVIDER },
    update: { token: fresh.token, expAt: fresh.expAt },
    create: { provider: PROVIDER, token: fresh.token, expAt: fresh.expAt },
  });
  return fresh.token;
}
