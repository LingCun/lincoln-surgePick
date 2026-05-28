import { describe, it, expect } from 'vitest';
import { rsi, sma, valuationTag } from '../scripts/lib/valuation.mjs';

describe('sma', () => {
  it('mean of last N values ending at endIdx', () => {
    const closes = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
    expect(sma(closes, 9, 5)).toBe(8);
    expect(sma(closes, 4, 5)).toBe(3);
  });
  it('NaN when insufficient', () => {
    expect(Number.isNaN(sma([1, 2, 3], 2, 5))).toBe(true);
  });
});

describe('rsi', () => {
  it('returns ~70 on monotonic uptrend (overbought)', () => {
    const closes = Array.from({ length: 30 }, (_, i) => 100 + i);
    const r = rsi(closes, 14);
    expect(r).toBeGreaterThan(95);
  });
  it('returns ~30 on monotonic downtrend (oversold)', () => {
    const closes = Array.from({ length: 30 }, (_, i) => 130 - i);
    const r = rsi(closes, 14);
    expect(r).toBeLessThan(5);
  });
  it('returns ~50 on flat series', () => {
    const closes = Array.from({ length: 30 }, () => 100);
    const r = rsi(closes, 14);
    expect(r).toBeCloseTo(50, 0);
  });
  it('NaN when insufficient history', () => {
    expect(Number.isNaN(rsi([1, 2, 3], 14))).toBe(true);
  });
});

describe('valuationTag', () => {
  it('cheap: RSI<35 + within 10% of MA200', () => {
    // Synthetic: 200 days rising, then pullback to near MA200 (oversold)
    const rising = Array.from({ length: 200 }, (_, i) => 100 + i * 0.1);
    const drop = [119.9, 119.8, 119.7, 119.5, 119.3, 119.0, 118.7, 118.3, 117.8, 117.0, 116.0, 114.5, 112.5, 109.9, 110];
    const closes = [...rising, ...drop];
    expect(valuationTag(closes)).toBe('cheap');
  });
  it('rich: RSI>70', () => {
    const flat = Array.from({ length: 200 }, () => 100);
    const surge = Array.from({ length: 20 }, (_, i) => 100 + i * 2);
    const closes = [...flat, ...surge];
    expect(valuationTag(closes)).toBe('rich');
  });
  it('rich: price > MA200 × 1.20 (even with moderate RSI)', () => {
    const closes = Array.from({ length: 220 }, (_, i) => 100 + i * 0.5);
    expect(valuationTag(closes)).toBe('rich');
  });
  it('neutral otherwise', () => {
    const closes = Array.from({ length: 220 }, (_, i) => 100 + Math.sin(i / 5));
    expect(valuationTag(closes)).toBe('neutral');
  });
  it('neutral when insufficient history', () => {
    expect(valuationTag([100, 101, 102])).toBe('neutral');
  });
});
