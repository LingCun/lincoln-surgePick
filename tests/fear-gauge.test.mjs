import { describe, it, expect } from 'vitest';
import { fearGauge } from '../scripts/lib/fear-gauge.mjs';

describe('fearGauge', () => {
  it('VIX < 14 → 극도의 탐욕', () => {
    const r = fearGauge(12);
    expect(r.level).toBe('극도의 탐욕');
    expect(r.step).toBe(1);
    expect(r.color).toBe('extremeGreed');
  });
  it('VIX 16 → 탐욕', () => {
    expect(fearGauge(16).level).toBe('탐욕');
  });
  it('VIX 20 → 중립', () => {
    expect(fearGauge(20).level).toBe('중립');
  });
  it('VIX 25 → 공포', () => {
    expect(fearGauge(25).level).toBe('공포');
  });
  it('VIX 32 → 극도의 공포', () => {
    expect(fearGauge(32).level).toBe('극도의 공포');
    expect(fearGauge(32).step).toBe(5);
  });
});
