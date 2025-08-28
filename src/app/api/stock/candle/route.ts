// app/api/kis/daily-rsi/route.ts
// export const runtime = "nodejs";

import { NextRequest, NextResponse } from "next/server";
import { RSI } from "trading-signals";
import { env } from "@/config/env.server";
import { getKisToken } from "@/services/kis.server";

// KIS 일봉 응답(하루치)
type KisDailyItem = {
  stck_bsop_date: string; // YYYYMMDD
  stck_clpr: string;      // 종가
  stck_oprc: string;      // 시가
  stck_hgpr: string;      // 고가
  stck_lwpr: string;      // 저가
  acml_vol: string;       // 거래량
  acml_tr_pbmn?: string;
};

// Upbit 호환 타입
type CandleBase = {
  market: string;
  candle_date_time_kst: string;
  opening_price: number;
  high_price: number;
  low_price: number;
  trade_price: number;
  volume?: number;
};
type CandleWithRSI = CandleBase & { rsi: number | null };

function computeRSISeriesAsc(pricesAsc: number[], period: number): (number | null)[] {
  const rsi = new RSI(period);
  return pricesAsc.map((p) => {
    rsi.update(p);
    if (!rsi.isStable) return null;
    const v: any = rsi.getResultOrThrow();
    return typeof v?.toNumber === "function" ? v.toNumber() : parseFloat(v.toString());
  });
}

function formatDate(date: Date): string {
  const yyyy = date.getFullYear();
  const mm = String(date.getMonth() + 1).padStart(2, "0");
  const dd = String(date.getDate()).padStart(2, "0");
  return `${yyyy}${mm}${dd}`;
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);

    // --- Query params ---
    const symbol = searchParams.get("symbol") ?? "069500"; // KODEX 200
    const count = Math.max(1, Number(searchParams.get("count") ?? 3));
    const period = Math.max(2, Number(searchParams.get("period") ?? 14));

    // --- 환경값 ---
    const BASE = env.KIS_BASE_URL; // 검증된 값
    const APP_KEY = env.KIS_APP_KEY;
    const APP_SECRET = env.KIS_APP_SECRET;
    const TR_ID = "FHKST03010100"; // 기간별 시세(일/주/월/년)

    // --- 조회 구간: 오늘을 end, (period + count - 1)일 전을 start ---
    const endDateObj = new Date();
    const startDateObj = new Date();
    startDateObj.setDate(endDateObj.getDate() - (period + count + 6));
    const start = formatDate(startDateObj);
    const end = formatDate(endDateObj);

    // --- URL 구성 ---
    const url = new URL("/uapi/domestic-stock/v1/quotations/inquire-daily-itemchartprice", BASE);
    url.searchParams.set("FID_COND_MRKT_DIV_CODE", "J");
    url.searchParams.set("FID_INPUT_ISCD", symbol);
    url.searchParams.set("FID_PERIOD_DIV_CODE", "D"); // 일봉
    url.searchParams.set("FID_ORG_ADJ_PRC", "0");     // 수정주가 권장
    url.searchParams.set("FID_INPUT_DATE_1", start);
    url.searchParams.set("FID_INPUT_DATE_2", end);

    // --- 토큰 획득 + 호출 ---
    const accessToken = await getKisToken();
    const kisRes = await fetch(url.toString(), {
      method: "GET",
      headers: {
        "Content-Type": "application/json; charset=utf-8",
        authorization: `Bearer ${accessToken}`,
        appkey: APP_KEY,
        appsecret: APP_SECRET,
        tr_id: TR_ID,
      },
    });

    if (!kisRes.ok) {
      const detail = await kisRes.text();
      return NextResponse.json({ error: "KIS API error", detail }, { status: kisRes.status });
    }

    const data = await kisRes.json();
    const rows: KisDailyItem[] = Array.isArray(data?.output2) ? data.output2 : [];

    // RSI 계산에 최소 period개 필요
    if (rows.length < period) {
      return NextResponse.json({
        symbol,
        period,
        start,
        end,
        count: 0,
        candles: [] as CandleWithRSI[],
        lastRSI: null,
        note: "Not enough candles from KIS to compute RSI",
      });
    }

    // rows: 최신→과거, RSI는 과거→최신 필요
    const rowsAsc = [...rows].reverse();
    const closesAsc = rowsAsc.map((r) => Number(r.stck_clpr));
    const rsiAsc = computeRSISeriesAsc(closesAsc, period); // 과거→최신
    const rsiDesc = [...rsiAsc].reverse();                 // 다시 최신→과거

    // 최신 count개만 사용
    const latestRowsDesc = rows.slice(0, Math.min(count, rows.length));
    const latestRsiDesc = rsiDesc.slice(0, latestRowsDesc.length);

    // 결과 병합(최신→과거)
    const candles: CandleWithRSI[] = latestRowsDesc.map((r, i) => ({
      market: symbol,
      candle_date_time_kst: r.stck_bsop_date, // "YYYYMMDD"
      opening_price: Number(r.stck_oprc),
      high_price: Number(r.stck_hgpr),
      low_price: Number(r.stck_lwpr),
      trade_price: Number(r.stck_clpr),
      volume: Number(r.acml_vol),
      rsi: latestRsiDesc[i] ?? null,
    }));

    const lastRSI = candles[0]?.rsi ?? null;

    return NextResponse.json({
      symbol,
      period,
      start,
      end,
      count: candles.length,
      candles, // 최신→과거
      lastRSI,
    });
  } catch (err: any) {
    return NextResponse.json(
      { error: "Unexpected server error", detail: err?.message ?? String(err) },
      { status: 500 }
    );
  }
}
