import { RSI, SMA } from 'trading-signals';

describe('Trading-signals learning tests', () => {
  describe('RSI', () => {
    it('RSI(3) for strictly up: [1,2,3,4] → 100', () => {
      const rsi = new RSI(3);
      [1, 2, 3, 4].forEach((v) => rsi.add(v));
      expect(rsi.isStable).toBe(true);
      expect(rsi.getResultOrThrow().toNumber()).toBeCloseTo(100, 5);
    });

    it('RSI(3) for [1,2,3,3,2,3] ≈ 73.91', () => {
      // 주의: 마지막 3개를 가지고 RSI를 만든다(3,2,3)
      const rsi = new RSI(3);
      [1, 2, 3, 3, 2, 3].forEach((v) => rsi.add(v));
      expect(rsi.isStable).toBe(true);
      expect(rsi.getResultOrThrow().toNumber()).toBeCloseTo(73.91, 2);
    });

    it('isStable 의미: 최소 period+1개 입력 전엔 결과 없음', () => {
      const rsi = new RSI(3);
      [1, 2, 3].forEach((v) => rsi.add(v));
      expect(rsi.isStable).toBe(false);
      rsi.add(4);
      expect(rsi.isStable).toBe(true);
    });
  });

  describe('SMA', () => {
    it('SMA(3) for [1,2,3] → not stable yet', () => {
      const sma = new SMA(3);
      [1, 2, 3, 4].forEach((v) => sma.add(v));
      // period만큼 입력해야 안정화됨
      expect(sma.isStable).toBe(true); // SMA는 period개 입력되면 안정화
      expect(sma.getResultOrThrow().toNumber()).toBeCloseTo(3, 5); // (2+3+4)/3
    });

    it('SMA(3) for [1,2,3,4] → (2+3+4)/3 = 3', () => {
      const sma = new SMA(3);
      [1, 2, 3, 4].forEach((v) => sma.add(v));
      expect(sma.isStable).toBe(true);
      expect(sma.getResultOrThrow().toNumber()).toBeCloseTo(3, 5);
    });

    it('SMA(2) for [10,20,30] → 마지막은 (20+30)/2 = 25', () => {
      const sma = new SMA(2);
      [10, 20, 30].forEach((v) => sma.add(v));
      expect(sma.isStable).toBe(true);
      expect(sma.getResultOrThrow().toNumber()).toBeCloseTo(25, 5);
    });
  });
});
