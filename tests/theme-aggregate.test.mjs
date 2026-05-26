import { describe, it, expect } from 'vitest';
import { aggregateTheme } from '../scripts/lib/theme-aggregate.mjs';

describe('aggregateTheme', () => {
  const stocks = [
    { ticker: 'A', closes: [100, 102, 104, 103, 105] },
    { ticker: 'B', closes: [50, 51, 52, 53, 55] },
    { ticker: 'C', closes: [200, 198, 202, 205, 210] },
  ];

  it('returns array same length as longest input', () => {
    expect(aggregateTheme(stocks).length).toBe(5);
  });

  it('starts at 100 (normalized)', () => {
    expect(aggregateTheme(stocks)[0]).toBeCloseTo(100, 5);
  });

  it('ignores stocks with missing data for a given day', () => {
    const s = [
      { ticker: 'A', closes: [100, 110, 120] },
      { ticker: 'B', closes: [50, null, 60] },
    ];
    expect(aggregateTheme(s)[1]).toBeCloseTo(110, 1);
  });

  it('returns empty for no stocks', () => {
    expect(aggregateTheme([])).toEqual([]);
  });
});
