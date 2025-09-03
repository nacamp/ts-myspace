import { env } from '@/config/env.server';
import { formatDate } from './kis-utils';

type KisDailyPriceRow = Record<string, string>;

/* KIS: 지수 일별 시세 */
export async function fetchIndexDailyPrice(indexCode: string, accessToken: string) {
  const BASE = env.KIS_BASE_URL;
  const url = new URL('/uapi/domestic-stock/v1/quotations/inquire-index-daily-price', BASE);
  const today = formatDate(new Date());

  url.searchParams.set('FID_COND_MRKT_DIV_CODE', 'U');
  url.searchParams.set('FID_INPUT_ISCD', indexCode);
  url.searchParams.set('FID_PERIOD_DIV_CODE', 'D');
  url.searchParams.set('FID_INPUT_DATE_1', today);

  const kisRes = await fetch(url.toString(), {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      custtype: 'P',
      authorization: `Bearer ${accessToken}`,
      appkey: env.KIS_APP_KEY,
      appsecret: env.KIS_APP_SECRET,
      tr_id: 'FHPUP02120000',
    },
  });

  if (!kisRes.ok) throw new Error(`[KIS] ${kisRes.status} ${await kisRes.text()}`);
  const data = await kisRes.json();
  const rows: KisDailyPriceRow[] = Array.isArray(data?.output2) ? data.output2 : [];
  if (!rows.length) throw new Error('[KIS] empty rows');
  return rows;
}

/* KIS: 종목 일별 시세 (기간) */
export async function fetchDailyItemCandles(symbol: string, accessToken: string) {
  const BASE = env.KIS_BASE_URL;
  const url = new URL('/uapi/domestic-stock/v1/quotations/inquire-daily-itemchartprice', BASE);

  const end = formatDate(new Date());
  const startDateObj = new Date();
  startDateObj.setDate(startDateObj.getDate() - 200);
  const start = formatDate(startDateObj);

  url.searchParams.set('FID_COND_MRKT_DIV_CODE', 'J');
  url.searchParams.set('FID_INPUT_ISCD', symbol);
  url.searchParams.set('FID_PERIOD_DIV_CODE', 'D');
  url.searchParams.set('FID_ORG_ADJ_PRC', '0');
  url.searchParams.set('FID_INPUT_DATE_1', start);
  url.searchParams.set('FID_INPUT_DATE_2', end);

  const kisRes = await fetch(url.toString(), {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      authorization: `Bearer ${accessToken}`,
      appkey: env.KIS_APP_KEY,
      appsecret: env.KIS_APP_SECRET,
      tr_id: 'FHKST03010100',
    },
  });

  if (!kisRes.ok) throw new Error(`[KIS] ${kisRes.status} ${await kisRes.text()}`);
  const data = await kisRes.json();
  const rows: KisDailyPriceRow[] = Array.isArray(data?.output2) ? data.output2 : [];
  if (!rows.length) throw new Error('[KIS] empty rows');
  return rows;
}
