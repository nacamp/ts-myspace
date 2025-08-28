// src/services/kis/token.global.ts
import { env } from "@/config/env.server";

type Cache = { token: string | null; exp: number };
const TOKEN_SKEW_MS = 2 * 60 * 1000; // 만료 2분 전부터 새로 받기

function getCache(): Cache {
  const g = globalThis as any;
  if (!g.__kisTokenCache) {
    g.__kisTokenCache = { token: null, exp: 0 } as Cache;
    // --------------------------------------------------------
    // FIXME: remove hardcoded seed (개발/테스트용)
    g.__kisTokenCache.token =
      "...";
    g.__kisTokenCache.exp = new Date("2025-08-29T10:19:20+09:00").getTime();
    // --------------------------------------------------------
  }
  return g.__kisTokenCache;
}

async function fetchNewToken(): Promise<Cache> {
  const res = await fetch("https://openapi.koreainvestment.com:9443/oauth2/tokenP", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      grant_type: "client_credentials",
      appkey: env.KIS_APP_KEY,
      appsecret: env.KIS_APP_SECRET,
    }),
  });
  if (!res.ok) throw new Error(await res.text());
  const data = await res.json();
  return {
    token: String(data.access_token),
    exp: Date.now() + (Number(data.expires_in ?? 3600) * 1000),
  };
}

export async function getKisToken(): Promise<string> {
  const cache = getCache();
  const now = Date.now();

  // 캐시에 있고 아직 유효하면 그대로 사용
  if (cache.token && now + TOKEN_SKEW_MS < cache.exp) {
    return cache.token;
  }

  // 아니면 새 토큰 요청
  const fresh = await fetchNewToken();
  cache.token = fresh.token;
  cache.exp = fresh.exp;
  return cache.token!;
}
