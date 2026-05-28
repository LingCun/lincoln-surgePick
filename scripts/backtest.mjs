import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { fetchMany, fetchChart } from './fetch-yahoo.mjs';
import { simulate } from './lib/backtest-engine.mjs';
import { portfolioMetrics, sellReasonBreakdown } from './lib/backtest-aggregate.mjs';
import { buildBearMap } from './lib/regime-detect.mjs';

const __dirname = dirname(fileURLToPath(import.meta.url));
const SIM_START = '2022-01-01';
const INITIAL_KR = 10_000_000;
const INITIAL_US = 10_000;

function todayStr() {
  const d = new Date();
  return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, '0')}-${String(d.getUTCDate()).padStart(2, '0')}`;
}

function loadJson(name) {
  return JSON.parse(readFileSync(resolve(__dirname, name), 'utf8'));
}

async function main() {
  const today = todayStr();
  console.log('[backtest] fetching ^GSPC, ^KS11 (5y)...');
  const [gspcData, ksData] = await Promise.all([
    fetchChart('^GSPC', '5y'),
    fetchChart('^KS11', '5y'),
  ]);
  if (!gspcData || !ksData) {
    console.error('[backtest] index fetch failed — aborting');
    process.exit(1);
  }
  const bearByMarket = {
    US: buildBearMap(gspcData.dates, gspcData.closes),
    KR: buildBearMap(ksData.dates, ksData.closes),
  };
  const indexByMarket = {
    US: { dates: gspcData.dates, closes: gspcData.closes },
    KR: { dates: ksData.dates, closes: ksData.closes },
  };

  // Merge stock + ETF universes into single per-market pool
  const krStock = loadJson('universe-kr.json');
  const krEtf = loadJson('universe-etf-kr.json');
  const usStock = loadJson('universe-us.json');
  const usEtf = loadJson('universe-etf-us.json');
  const kr = [...krStock, ...krEtf];
  const us = [...usStock, ...usEtf];

  console.log(`[backtest] fetching ${kr.length + us.length} tickers @ range=5y...`);
  const krFetched = await fetchMany(kr.map((t) => ({ ...t, market: 'KR' })), { range: '5y', delayMs: 200 });
  const usFetched = await fetchMany(us.map((t) => ({ ...t, market: 'US' })), { range: '5y', delayMs: 200 });

  const tickers = [...krFetched, ...usFetched]
    .filter((row) => row.data && row.data.dates && row.data.dates.length >= 200)
    .map((row) => ({
      ticker: row.ticker, name: row.name, market: row.market,
      dates: row.data.dates, closes: row.data.closes,
      volumes: row.data.volumes, highs: row.data.highs, lows: row.data.lows,
    }));
  console.log(`[backtest] usable tickers: ${tickers.length} (KR ${tickers.filter((t) => t.market === 'KR').length}, US ${tickers.filter((t) => t.market === 'US').length})`);

  console.log(`[backtest] simulating ${SIM_START} -> ${today}...`);
  const t0 = Date.now();
  const result = simulate({
    tickers,
    simStart: SIM_START, simEnd: today, today,
    initialCapital: { krInitial: INITIAL_KR, usInitial: INITIAL_US },
    indexByMarket, bearByMarket,
  });
  console.log(`[backtest] sim done in ${Date.now() - t0}ms, ledger=${result.ledger.length}, positions=${result.positions.length}, curve=${result.equityCurve.length}`);

  const metrics = portfolioMetrics(result.equityCurve);
  const sells = sellReasonBreakdown(result.ledger);
  console.log(`[backtest] CAGR=${(metrics.cagr * 100).toFixed(2)}% MDD=${(metrics.maxDrawdown * 100).toFixed(2)}% Sharpe=${metrics.sharpe.toFixed(2)}`);
  console.log('[backtest] sell reasons:', sells);

  const out = {
    asOf: new Date().toISOString(),
    window: { start: SIM_START, end: today },
    initialCapital: { krInitial: INITIAL_KR, usInitial: INITIAL_US },
    metrics,
    sellReasonBreakdown: sells,
    equityCurve: result.equityCurve,
    ledger: result.ledger,
    positions: result.positions,
  };
  const outputPath = resolve(__dirname, '../src/data/backtest.json');
  mkdirSync(dirname(outputPath), { recursive: true });
  writeFileSync(outputPath, JSON.stringify(out, null, 2) + '\n', 'utf8');
  console.log(`[backtest] wrote ${outputPath}`);
}

main().catch((err) => {
  console.error('[backtest] failed:', err);
  process.exit(1);
});
