import { NextResponse } from 'next/server';
import { env } from '@/config/env.server';

export async function GET() {
  const url = `http://apilayer.net/api/live?access_key=${env.CURRENCYLAYER_COM_APP_KEY}&currencies=KRW&source=USD&format=1`;
  const res = await fetch(url, { cache: 'no-store' });

  if (!res.ok) {
    return NextResponse.json({ error: 'Failed to fetch fx rate' }, { status: 502 });
  }

  const data = await res.json();

  if (!data.success) {
    return NextResponse.json({ error: 'API returned error' }, { status: 500 });
  }

  const timestamp: number = data.timestamp;
  const rate: number = data.quotes?.USDKRW;

  return NextResponse.json({
    timestamp,
    rate,
  });
}
