import { describe, it, expect } from 'vitest';
import { initState, buyShares, sellShares, computeEquity, freeSlots } from '../scripts/lib/portfolio.mjs';

describe('initState', () => {
  it('initializes per-market cash + empty positions', () => {
    const s = initState({ krInitial: 10_000_000, usInitial: 10_000, maxSlots: 5 });
    expect(s.kr.cash).toBe(10_000_000);
    expect(s.us.cash).toBe(10_000);
    expect(s.kr.positions).toEqual([]);
    expect(s.us.positions).toEqual([]);
    expect(s.maxSlots).toBe(5);
  });
});

describe('buyShares', () => {
  it('creates new position when ticker absent', () => {
    const s = initState({ krInitial: 1_000_000, usInitial: 0, maxSlots: 5 });
    const next = buyShares(s, { market: 'KR', ticker: '005930.KS', name: 'A', shares: 10, price: 50000, date: '2024-01-02' });
    expect(next.kr.cash).toBe(500_000);
    expect(next.kr.positions).toHaveLength(1);
    expect(next.kr.positions[0]).toMatchObject({
      ticker: '005930.KS',
      shares: 10,
      costBasis: 500_000,
      avgCost: 50_000,
      peak: 50_000,
      firstBuyDate: '2024-01-02',
    });
  });
  it('averages cost on second buy of same ticker', () => {
    let s = initState({ krInitial: 1_000_000, usInitial: 0, maxSlots: 5 });
    s = buyShares(s, { market: 'KR', ticker: 'X', name: 'X', shares: 10, price: 100, date: '2024-01-02' });
    s = buyShares(s, { market: 'KR', ticker: 'X', name: 'X', shares: 10, price: 80, date: '2024-01-09' });
    const p = s.kr.positions[0];
    expect(p.shares).toBe(20);
    expect(p.costBasis).toBe(1800);
    expect(p.avgCost).toBe(90);
    expect(p.firstBuyDate).toBe('2024-01-02');
    expect(p.lastBuyDate).toBe('2024-01-09');
  });
});

describe('sellShares', () => {
  it('reduces shares + cash gain at sale price', () => {
    let s = initState({ krInitial: 1_000_000, usInitial: 0, maxSlots: 5 });
    s = buyShares(s, { market: 'KR', ticker: 'X', name: 'X', shares: 10, price: 100, date: '2024-01-02' });
    s = sellShares(s, { market: 'KR', ticker: 'X', shares: 5, price: 150, date: '2024-02-01' });
    const p = s.kr.positions[0];
    expect(p.shares).toBe(5);
    expect(s.kr.cash).toBe(1_000_000 - 1000 + 750);
  });
  it('removes position when shares reach 0', () => {
    let s = initState({ krInitial: 1_000_000, usInitial: 0, maxSlots: 5 });
    s = buyShares(s, { market: 'KR', ticker: 'X', name: 'X', shares: 10, price: 100, date: '2024-01-02' });
    s = sellShares(s, { market: 'KR', ticker: 'X', shares: 10, price: 150, date: '2024-02-01' });
    expect(s.kr.positions).toHaveLength(0);
  });
});

describe('computeEquity', () => {
  it('cash + sum(positions × current price) per market, FX-bridged total', () => {
    let s = initState({ krInitial: 1_000_000, usInitial: 1000, maxSlots: 5 });
    s = buyShares(s, { market: 'KR', ticker: 'A', name: 'A', shares: 10, price: 50_000, date: '2024-01-02' });
    s = buyShares(s, { market: 'US', ticker: 'B', name: 'B', shares: 4, price: 100, date: '2024-01-02' });
    const eq = computeEquity(s, { 'A': 55_000, 'B': 120 }, { usdKrw: 1300 });
    expect(eq.kr.cash).toBe(500_000);
    expect(eq.kr.posValue).toBe(550_000);
    expect(eq.us.cash).toBe(600);
    expect(eq.us.posValue).toBe(480);
    expect(eq.totalKrwEquiv).toBe(500_000 + 550_000 + (600 + 480) * 1300);
  });
});

describe('freeSlots', () => {
  it('returns slots - filled positions per market', () => {
    let s = initState({ krInitial: 1_000_000, usInitial: 1000, maxSlots: 5 });
    s = buyShares(s, { market: 'KR', ticker: 'A', name: 'A', shares: 1, price: 100, date: '2024-01-02' });
    s = buyShares(s, { market: 'KR', ticker: 'B', name: 'B', shares: 1, price: 100, date: '2024-01-02' });
    expect(freeSlots(s, 'KR')).toBe(3);
    expect(freeSlots(s, 'US')).toBe(5);
  });
});
