import { describe, it, expect } from 'vitest';
import { mean, stdev, linearRegression, obv } from '../scripts/lib/stats.mjs';

describe('mean', () => {
  it('returns arithmetic mean', () => {
    expect(mean([1, 2, 3, 4])).toBe(2.5);
  });
  it('handles single element', () => {
    expect(mean([5])).toBe(5);
  });
  it('returns 0 for empty', () => {
    expect(mean([])).toBe(0);
  });
});

describe('stdev', () => {
  it('returns sample stdev', () => {
    expect(stdev([2, 4, 4, 4, 5, 5, 7, 9])).toBeCloseTo(2.138, 2);
  });
  it('returns 0 for single element', () => {
    expect(stdev([5])).toBe(0);
  });
});

describe('linearRegression', () => {
  it('returns slope=1 intercept=1 for [1,2,3,4,5]', () => {
    const { slope, intercept } = linearRegression([1, 2, 3, 4, 5]);
    expect(slope).toBeCloseTo(1, 5);
    expect(intercept).toBeCloseTo(1, 5);
  });
  it('returns positive slope for ascending series', () => {
    expect(linearRegression([10, 11, 12, 13, 14, 15]).slope).toBeGreaterThan(0);
  });
  it('returns negative slope for descending series', () => {
    expect(linearRegression([15, 14, 13, 12, 11, 10]).slope).toBeLessThan(0);
  });
});

describe('obv', () => {
  it('accumulates volume by close direction', () => {
    const closes = [100, 101, 100, 102];
    const volumes = [1000, 2000, 1500, 3000];
    expect(obv(closes, volumes)).toEqual([0, 2000, 500, 3500]);
  });
});
