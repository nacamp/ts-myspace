"use client";

import { useEffect, useState } from "react";
import { Card, CardHeader, CardContent } from "@/components/ui/card";

import { Prisma, CoinTimeline } from "@/generated/prisma";

type Coin = {
  id: number;
  coin: string;
  timestamp: string;
  close: number;
  volume: number;
  rsi: number;
  ema15: number;
  ema50: number;
  ema100: number;
  cross15: boolean;
  cross50: boolean;
};

export const dummyCoinData: Coin[] = [
  {
    id: 1,
    coin: "BTC",
    timestamp: "2025-07-22T09:00:00Z",
    close: 48200.12,
    volume: 215721623.16,
    rsi: 87.04,
    ema15: 41372.12,
    ema50: 35337.56,
    ema100: 34280.68,
    cross15: true,
    cross50: true,
  },
  {
    id: 2,
    coin: "ETH",
    timestamp: "2025-07-22T09:00:00Z",
    close: 3250.65,
    volume: 175831000.32,
    rsi: 70.21,
    ema15: 3100.45,
    ema50: 2950.0,
    ema100: 2800.12,
    cross15: true,
    cross50: true,
  },
  {
    id: 3,
    coin: "SOL",
    timestamp: "2025-07-22T09:00:00Z",
    close: 145.72,
    volume: 103290000.0,
    rsi: 65.01,
    ema15: 140.0,
    ema50: 132.5,
    ema100: 128.0,
    cross15: true,
    cross50: false,
  },
  {
    id: 4,
    coin: "XRP",
    timestamp: "2025-07-22T09:00:00Z",
    close: 0.78,
    volume: 75000000.0,
    rsi: 59.78,
    ema15: 0.75,
    ema50: 0.7,
    ema100: 0.68,
    cross15: true,
    cross50: false,
  },
  {
    id: 5,
    coin: "ADA",
    timestamp: "2025-07-22T09:00:00Z",
    close: 0.41,
    volume: 64000000.0,
    rsi: 53.67,
    ema15: 0.39,
    ema50: 0.36,
    ema100: 0.34,
    cross15: false,
    cross50: false,
  },
];

export function formatNumber(
  value?: number,
  fractionDigits: number = 2
): string {
  return (value ?? 0).toLocaleString(undefined, {
    minimumFractionDigits: fractionDigits,
    maximumFractionDigits: fractionDigits,
  });
}

export default function DashboardPage() {
  // const [coins, setCoins] = useState<Coin[]>([]);
  const [coins, setCoins] = useState<Partial<CoinTimeline>[]>([]);
  //const [coins, setCoins] = useState<CoinTimeline[]>([]);

  useEffect(() => {
    fetch("/api/coin/latest")
      .then((res) => res.json())
      .then((data) => setCoins(data));
  }, []);

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">📊 Coin Dashboard</h1>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
        {coins.map((coin) => (
          <Card key={coin.id}>
            <CardHeader>
              <h2 className="text-xl font-bold">{coin.coin}</h2>
              <p className="text-sm text-gray-500">{coin.yyyymmdd}</p>
            </CardHeader>
            <CardContent>
              <p>
                <strong>Close:</strong> {formatNumber(coin.close, 1)}
              </p>
              <p>
                <strong>RSI:</strong> {formatNumber(coin.rsi, 1)}
              </p>
              <p>
                <strong>Volume:</strong> {formatNumber(coin.volume, 0)}
              </p>
              <p>
                <strong>15:</strong> {formatNumber(coin.ema15, 1)}
              </p>
              <p>
                <strong>50:</strong> {formatNumber(coin.ema50, 1)}
              </p>
              <p>
                <strong>100:</strong> {formatNumber(coin.ema100, 1)}
              </p>
              <p>
                <strong>Cross15:</strong> {coin.cross15 ? "Yes" : "No"}
              </p>
              <p>
                <strong>Cross50:</strong> {coin.cross50 ? "Yes" : "No"}
              </p>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
