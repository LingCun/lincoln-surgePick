import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { fetchMany } from './fetch-yahoo.mjs';
import { scorePicks } from './lib/scoring.mjs';
import { pickReason } from './lib/reason-template.mjs';
import { classifyHorizon } from './lib/horizon.mjs';

const __dirname = dirname(fileURLToPath(import.meta.url));
const OUTPUT = resolve(__dirname, '../src/data/picks.json');

function load(name) {
  return JSON.parse(readFileSync(resolve(__dirname, name), 'utf8'));
}

function dailyReturn(closes) {
  if (closes.length < 22) return 0;
  return closes[closes.length - 1] / closes[closes.length - 22] - 1;
}

function vol20(closes) {
  if (closes.length < 21) return 0.2;
  const rets = [];
  for (let i = closes.length - 20; i < closes.length; i++) {
    if (i <= 0) continue;
    rets.push((closes[i] - closes[i - 1]) / closes[i - 1]);
  }
  const mean = rets.reduce((a, b) => a + b, 0) / rets.length;
  const variance = rets.reduce((a, b) => a + (b - mean) ** 2, 0) / Math.max(1, rets.length - 1);
  return Math.sqrt(variance) * Math.sqrt(252);
}

function todayDate() {
  return new Date().toISOString().slice(0, 10);
}

function makeId(market, ticker) {
  return `${market.toLowerCase()}-${todayDate()}-${ticker.replace(/[.^]/g, '')}`;
}

async function scanGroup(universe, marketLabel) {
  console.log(`[scan-picks] ${marketLabel} fetching ${universe.length} tickers...`);
  const fetched = await fetchMany(universe, { range: '4mo', delayMs: 200 });
  const candidates = [];

  for (const row of fetched) {
    if (!row.data || row.data.closes.length < 30) continue;
    try {
      const s = scorePicks(row.data);
      if (!s.passes.trendUp || !s.passes.volumeUp || !s.passes.accumulation) continue;

      const mom1m = dailyReturn(row.data.closes);
      const v20 = vol20(row.data.closes);
      const { horizon, holdDays } = classifyHorizon({
        scores: s.scores,
        metrics: s.metrics,
        mom1m,
        vol20: v20,
      });

      candidates.push({
        ticker: row.ticker,
        name: row.name,
        market: row.market,
        score: Math.round(s.total * 100),
        horizon,
        holdDays,
        mom1m,
        vol20: v20,
        scores: s.scores,
        metrics: s.metrics,
        closes30: row.data.closes.slice(-30),
        reason: pickReason({ scores: s.scores, metrics: s.metrics }),
        buyPrice: row.data.closes[row.data.closes.length - 1],
      });
    } catch (e) {
      console.warn(`[scan-picks] score failed for ${row.ticker}: ${e.message}`);
    }
  }

  candidates.sort((a, b) => b.score - a.score);
  const top = candidates[0] ?? null;
  if (top) {
    top.id = makeId(marketLabel, top.ticker);
    top.buyDate = todayDate();
  }
  console.log(`[scan-picks] ${marketLabel} candidates ${candidates.length}, top: ${top?.ticker ?? 'none'}`);
  return top;
}

async function main() {
  const kr = load('universe-kr.json');
  const us = load('universe-us.json');
  const krPick = await scanGroup(kr, 'KR');
  const usPick = await scanGroup(us, 'US');

  const out = {
    asOf: new Date().toISOString(),
    kr: krPick,
    us: usPick,
  };

  mkdirSync(dirname(OUTPUT), { recursive: true });
  writeFileSync(OUTPUT, JSON.stringify(out, null, 2) + '\n', 'utf8');
  console.log(`[scan-picks] wrote ${OUTPUT}`);
}

main().catch((err) => {
  console.error('[scan-picks] failed:', err);
  process.exit(1);
});
