import { describe, it, expect } from 'vitest';
import { selectThemes } from '../scripts/lib/theme-select.mjs';

const sample = (n) =>
  Array.from({ length: n }, (_, i) => ({
    id: `t${i}`,
    name: `theme${i}`,
    score: ((i * 7) % 9) - 4,
    mom1m: ((i % 10) - 5) / 100,
    mom3m: ((i % 7) - 3) / 100,
    vol20: 0.10 + (i % 5) * 0.05,
  }));

describe('selectThemes', () => {
  it('returns 8 popular + value when pool has enough', () => {
    const { popular, value } = selectThemes(sample(30));
    expect(popular.length).toBe(8);
    expect(value.length).toBeLessThanOrEqual(8);
  });

  it('popular sorted by momentum descending', () => {
    const { popular } = selectThemes(sample(20));
    const moms = popular.map((t) => t.mom1m * 0.4 + t.mom3m * 0.6);
    for (let i = 1; i < moms.length; i++) {
      expect(moms[i]).toBeLessThanOrEqual(moms[i - 1] + 1e-9);
    }
  });

  it('value filtered by score>=1 AND vol20<0.40 AND mom3m>-0.05', () => {
    const { value } = selectThemes(sample(30));
    for (const t of value) {
      expect(t.score).toBeGreaterThanOrEqual(1);
      expect(t.vol20).toBeLessThan(0.40);
      expect(t.mom3m).toBeGreaterThan(-0.05);
    }
  });

  it('no overlap between popular and value', () => {
    const { popular, value } = selectThemes(sample(30));
    const popIds = new Set(popular.map((t) => t.id));
    for (const v of value) {
      expect(popIds.has(v.id)).toBe(false);
    }
  });
});
