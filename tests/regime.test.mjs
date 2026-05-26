import { describe, it, expect } from 'vitest';
import { scoreRegime, labelFromScore } from '../scripts/lib/regime.mjs';

// Generate synthetic 240-day index series, low-vol gentle uptrend.
function genBullIndex() {
  const closes = [];
  for (let i = 0; i < 240; i++) {
    closes.push(+(4000 * (1 + 0.0008 * i + 0.005 * Math.sin(i / 10))).toFixed(2));
  }
  return closes;
}

describe('scoreRegime', () => {
  it('returns positive score for bull index with low VIX (US)', () => {
    const closes = genBullIndex();
    const r = scoreRegime({ closes, vix: 13.5, market: 'US' });
    expect(r.score).toBeGreaterThan(0);
    expect(r.metrics.trend).toBe('up');
  });

  it('returns negative score when closes < MA200 + high VIX', () => {
    const closes = genBullIndex().reverse();
    const r = scoreRegime({ closes, vix: 30, market: 'US' });
    expect(r.score).toBeLessThan(0);
    expect(r.metrics.trend).toBe('down');
  });

  it('uses vol20 instead of VIX for KR market', () => {
    const closes = genBullIndex();
    const r = scoreRegime({ closes, vix: null, market: 'KR' });
    expect(r.metrics).toHaveProperty('vol20');
    expect(r.metrics.vix).toBe(null);
  });
});

describe('labelFromScore', () => {
  it('+3 → 풀매수', () => {
    expect(labelFromScore(3).label).toBe('풀매수');
    expect(labelFromScore(3).weight).toBe('90~100%');
  });
  it('+1 → 분할매수', () => {
    expect(labelFromScore(1).label).toBe('분할매수');
  });
  it('0 → 관망/존버', () => {
    expect(labelFromScore(0).label).toBe('관망/존버');
  });
  it('-2 → 비중축소+이익실현', () => {
    expect(labelFromScore(-2).label).toBe('비중축소+이익실현');
  });
});
