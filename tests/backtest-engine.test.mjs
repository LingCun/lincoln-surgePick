import { describe, it, expect } from 'vitest';
import { simulate } from '../scripts/lib/backtest-engine.mjs';

function buildSyntheticTicker({ ticker, name, market, startDate, n, closeFn }) {
  const dates = [];
  const closes = [];
  const d = new Date(startDate + 'T00:00:00Z');
  let i = 0;
  while (dates.length < n) {
    const day = d.getUTCDay();
    if (day !== 0 && day !== 6) {
      dates.push(`${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, '0')}-${String(d.getUTCDate()).padStart(2, '0')}`);
      closes.push(closeFn(i));
      i++;
    }
    d.setUTCDate(d.getUTCDate() + 1);
  }
  return { ticker, name, market, dates, closes, volumes: closes.map(() => 1000), highs: closes, lows: closes };
}

describe('simulate (portfolio)', () => {
  it('returns equityCurve covering every sim day and ledger array', () => {
    const t = buildSyntheticTicker({
      ticker: 'A', name: 'A', market: 'KR', startDate: '2023-01-02', n: 250,
      closeFn: (i) => 100 + Math.sin(i / 5) * 2,
    });
    const result = simulate({
      tickers: [t],
      simStart: '2023-01-02', simEnd: t.dates[t.dates.length - 1],
      today: t.dates[t.dates.length - 1],
      initialCapital: { krInitial: 1_000_000, usInitial: 0 },
      indexByMarket: {},
      bearByMarket: {},
    });
    expect(result.equityCurve).toBeInstanceOf(Array);
    expect(result.equityCurve.length).toBeGreaterThan(0);
    expect(result.ledger).toBeInstanceOf(Array);
    expect(result.positions).toBeInstanceOf(Array);
  });

  it('opens a position via DCA when cheap signal appears', () => {
    // 200 rising days then plunge → final RSI<35, distance from MA200 < 10%
    const rising = Array.from({ length: 200 }, (_, i) => 100 + i * 0.1);
    const drop = [115, 114, 113, 110, 108, 105, 103, 102, 101, 100, 99, 98, 97, 96, 95];
    const closes = [...rising, ...drop];
    const t = buildSyntheticTicker({
      ticker: 'A', name: 'A', market: 'KR', startDate: '2023-01-02',
      n: closes.length, closeFn: (i) => closes[i],
    });
    const result = simulate({
      tickers: [t],
      simStart: '2023-01-02', simEnd: t.dates[t.dates.length - 1],
      today: t.dates[t.dates.length - 1],
      initialCapital: { krInitial: 1_000_000, usInitial: 0 },
      indexByMarket: {},
      bearByMarket: {},
    });
    const buys = result.ledger.filter((l) => l.action === 'buy' && l.ticker === 'A');
    expect(buys.length).toBeGreaterThan(0);
  });

  it('catastrophe gate fires when close drops 10% below avgCost', () => {
    // Cheap → buy → -15% plunge
    const rising = Array.from({ length: 200 }, (_, i) => 100 + i * 0.1);
    const drop = [115, 113, 110, 105, 100, 95, 90, 85, 80, 75];
    const closes = [...rising, ...drop];
    const t = buildSyntheticTicker({
      ticker: 'A', name: 'A', market: 'KR', startDate: '2023-01-02',
      n: closes.length, closeFn: (i) => closes[i],
    });
    const result = simulate({
      tickers: [t],
      simStart: '2023-01-02', simEnd: t.dates[t.dates.length - 1],
      today: t.dates[t.dates.length - 1],
      initialCapital: { krInitial: 1_000_000, usInitial: 0 },
      indexByMarket: {},
      bearByMarket: {},
    });
    const catastropheSells = result.ledger.filter(
      (l) => l.action === 'sell' && l.reason === 'catastrophe',
    );
    expect(catastropheSells.length).toBeGreaterThan(0);
  });

  it('bear-flip gate liquidates positions when regime turns bear', () => {
    const rising = Array.from({ length: 200 }, (_, i) => 100 + i * 0.1);
    const drop = [115, 114, 113, 110, 108, 105, 103, 102, 101, 100, 99];
    const closes = [...rising, ...drop, ...Array(50).fill(100)];
    const t = buildSyntheticTicker({
      ticker: 'A', name: 'A', market: 'KR', startDate: '2023-01-02',
      n: closes.length, closeFn: (i) => closes[i],
    });
    const bearByMarket = { KR: Object.fromEntries(t.dates.map((d, i) => [d, i > 220])) };
    const result = simulate({
      tickers: [t],
      simStart: '2023-01-02', simEnd: t.dates[t.dates.length - 1],
      today: t.dates[t.dates.length - 1],
      initialCapital: { krInitial: 1_000_000, usInitial: 0 },
      indexByMarket: {},
      bearByMarket,
    });
    const bearSells = result.ledger.filter((l) => l.action === 'sell' && l.reason === 'bear-flip');
    expect(bearSells.length).toBeGreaterThan(0);
  });

  it('respects maxSlots cap (only opens up to 5 positions per market)', () => {
    // 6 tickers, all hit cheap signal on day 220
    const mkClose = (offset) => (i) => {
      const base = 100 + offset;
      if (i < 200) return base + i * 0.1;
      return base + 20 - (i - 200) * 1.5;
    };
    const tickers = Array.from({ length: 6 }, (_, k) =>
      buildSyntheticTicker({
        ticker: `T${k}`, name: `T${k}`, market: 'KR', startDate: '2023-01-02',
        n: 220, closeFn: mkClose(k),
      }),
    );
    const result = simulate({
      tickers,
      simStart: '2023-01-02', simEnd: tickers[0].dates[219],
      today: tickers[0].dates[219],
      initialCapital: { krInitial: 10_000_000, usInitial: 0 },
      indexByMarket: {},
      bearByMarket: {},
    });
    const openPositions = new Set(
      result.ledger.filter((l) => l.action === 'buy').map((l) => l.ticker),
    );
    expect(openPositions.size).toBeLessThanOrEqual(5);
  });
});
