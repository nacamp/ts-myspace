import { computeRSISeriesAsc, computeSMASeriesAsc } from './indicators';
describe('Trading-signals tests', () => {
  describe('computeSMAAsc', () => {
    test('period=3, [1,2,3,4,5] ⇒ [null,null,2,3,4]', () => {
      const prices = [1, 2, 3, 4, 5];
      const period = 3;
      const sma = computeSMASeriesAsc(prices, period);
      expect(sma).toHaveLength(prices.length);
      expect(sma[0]).toBeNull();
      expect(sma[1]).toBeNull();
      expect(sma[2]).toBe(2); // (1+2+3)/3
      expect(sma[3]).toBe(3); // (2+3+4)/3
      expect(sma[4]).toBe(4); // (3+4+5)/3
    });

    test('소수점도 정확히 평균', () => {
      const prices = [1, 2, 2];
      const period = 2;
      const sma = computeSMASeriesAsc(prices, period);
      expect(sma).toEqual([null, 1.5, 2]);
    });

    test('period가 크면 앞부분은 null', () => {
      const prices = [10, 11, 12, 13];
      const period = 4;
      const sma = computeSMASeriesAsc(prices, period);
      expect(sma).toEqual([null, null, null, 11.5]); // (10+11+12+13)/4
    });
  });

  describe('computeRSISeriesAsc', () => {
    test('우상향 시 마지막 RSI가 상대적으로 높다(대략 70 이상 기대)', () => {
      const prices = Array.from({ length: 30 }, (_, i) => i + 1); // 꾸준히 상승
      const period = 14;
      const rsi = computeRSISeriesAsc(prices, period);
      const last = rsi[rsi.length - 1]!;
      // 구현에 따라 수치가 다를 수 있으니 "상대적" 검증
      expect(typeof last).toBe('number');
      expect(last).toBeGreaterThan(70);
    });

    test('우하향 시 마지막 RSI가 상대적으로 낮다(대략 30 이하 기대)', () => {
      const prices = Array.from({ length: 30 }, (_, i) => 100 - i); // 꾸준히 하락
      const period = 14;
      const rsi = computeRSISeriesAsc(prices, period);
      const last = rsi[rsi.length - 1]!;
      expect(typeof last).toBe('number');
      expect(last).toBeLessThan(30);
    });

    test('횡보에 가까운 시퀀스는 중립대 근처(너무 빡빡하지 않게)', () => {
      const prices = [10, 11, 10, 11, 10, 11, 10, 11, 10, 11, 10, 11, 10, 11, 10, 11, 10, 11, 10, 11];
      const period = 14;
      const rsi = computeRSISeriesAsc(prices, period);
      const last = rsi[rsi.length - 1]!;
      // 완전 50으로 떨어지지 않을 수 있으니 완화된 범위
      expect(typeof last).toBe('number');
      expect(last).toBeGreaterThan(35);
      expect(last).toBeLessThan(65);
    });
  });
});
