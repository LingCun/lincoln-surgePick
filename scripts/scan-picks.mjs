import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { fetchMany, fetchChart } from './fetch-yahoo.mjs';
import { simulate } from './lib/backtest-engine.mjs';
import { buildBearMap } from './lib/regime-detect.mjs';
import { valuationTag, rsi, sma } from './lib/valuation.mjs';

const __dirname = dirname(fileURLToPath(import.meta.url));
const INITIAL_KR = 10_000_000;
const INITIAL_US = 10_000;
const PORTFOLIO_PATH = resolve(__dirname, '../src/data/portfolio.json');
const WATCHLIST_PATH = resolve(__dirname, '../src/data/watchlist.json');
const PICKS_PATH = resolve(__dirname, '../src/data/picks.json');

function todayStr() {
  const d = new Date();
  return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, '0')}-${String(d.getUTCDate()).padStart(2, '0')}`;
}

function loadJson(name) {
  return JSON.parse(readFileSync(resolve(__dirname, name), 'utf8'));
}

function loadPortfolio() {
  if (!existsSync(PORTFOLIO_PATH)) {
    return {
      lastUpdateDate: null,
      initialCapital: { krInitial: INITIAL_KR, usInitial: INITIAL_US },
    };
  }
  return JSON.parse(readFileSync(PORTFOLIO_PATH, 'utf8'));
}

async function main() {
  const today = todayStr();
  console.log(`[scan-picks] today=${today}`);

  const krStock = loadJson('universe-kr.json');
  const krEtf = loadJson('universe-etf-kr.json');
  const usStock = loadJson('universe-us.json');
  const usEtf = loadJson('universe-etf-us.json');
  const universe = [
    ...krStock.map((t) => ({ ...t, market: 'KR' })),
    ...krEtf.map((t) => ({ ...t, market: 'KR' })),
    ...usStock.map((t) => ({ ...t, market: 'US' })),
    ...usEtf.map((t) => ({ ...t, market: 'US' })),
  ];

  console.log(`[scan-picks] fetching ${universe.length} tickers @ range=1y...`);
  const fetched = await fetchMany(universe, { range: '1y', delayMs: 200 });
  const tickers = fetched
    .filter((row) => row.data && row.data.dates && row.data.dates.length >= 200)
    .map((row) => ({
      ticker: row.ticker, name: row.name, market: row.market,
      dates: row.data.dates, closes: row.data.closes,
      volumes: row.data.volumes, highs: row.data.highs, lows: row.data.lows,
    }));

  // Build watchlist (today's tags)
  const watchlist = { cheap: [], neutral: [], rich: [] };
  for (const t of tickers) {
    const tag = valuationTag(t.closes);
    const endIdx = t.closes.length - 1;
    const ma200 = sma(t.closes, endIdx, 200);
    const rsiVal = rsi(t.closes, 14);
    const price = t.closes[endIdx];
    const row = {
      ticker: t.ticker, name: t.name, market: t.market,
      price,
      rsi: Number.isNaN(rsiVal) ? null : rsiVal,
      ma200Distance: Number.isNaN(ma200) ? null : (price - ma200) / ma200,
      inPortfolio: false,
    };
    watchlist[tag].push(row);
  }
  watchlist.cheap.sort((a, b) => (a.ma200Distance ?? 0) - (b.ma200Distance ?? 0));
  watchlist.rich.sort((a, b) => (b.ma200Distance ?? 0) - (a.ma200Distance ?? 0));
  watchlist.asOf = new Date().toISOString();

  // Re-simulate to advance state (idempotent: re-run today gives same result)
  console.log('[scan-picks] running portfolio sim...');
  const portfolio = loadPortfolio();
  const SIM_START = '2022-01-01';
  // Fetch 5y series for the sim (idempotent; live picks happen on the very last bar)
  console.log('[scan-picks] fetching 5y series for sim...');
  const fetched5y = await fetchMany(universe, { range: '5y', delayMs: 200 });
  const fullTickers = fetched5y
    .filter((row) => row.data && row.data.dates && row.data.dates.length >= 200)
    .map((row) => ({
      ticker: row.ticker, name: row.name, market: row.market,
      dates: row.data.dates, closes: row.data.closes,
      volumes: row.data.volumes, highs: row.data.highs, lows: row.data.lows,
    }));
  const [gspc5, ks5] = await Promise.all([
    fetchChart('^GSPC', '5y'),
    fetchChart('^KS11', '5y'),
  ]);
  const bearByMarket5 = {
    US: gspc5 ? buildBearMap(gspc5.dates, gspc5.closes) : {},
    KR: ks5 ? buildBearMap(ks5.dates, ks5.closes) : {},
  };

  const result = simulate({
    tickers: fullTickers,
    simStart: SIM_START, simEnd: today, today,
    initialCapital: portfolio.initialCapital ?? { krInitial: INITIAL_KR, usInitial: INITIAL_US },
    indexByMarket: {},
    bearByMarket: bearByMarket5,
  });

  // Mark in-portfolio tickers in watchlist
  const heldTickers = new Set(result.positions.map((p) => p.ticker));
  for (const sec of ['cheap', 'neutral', 'rich']) {
    for (const row of watchlist[sec]) row.inPortfolio = heldTickers.has(row.ticker);
  }

  // Today's actions (ledger entries on `today`)
  const todayActions = result.ledger.filter((l) => l.date === today);

  // Write outputs
  mkdirSync(dirname(PORTFOLIO_PATH), { recursive: true });
  writeFileSync(PORTFOLIO_PATH, JSON.stringify({
    asOf: new Date().toISOString(),
    lastUpdateDate: today,
    initialCapital: portfolio.initialCapital ?? { krInitial: INITIAL_KR, usInitial: INITIAL_US },
    positions: result.positions,
  }, null, 2) + '\n', 'utf8');
  writeFileSync(WATCHLIST_PATH, JSON.stringify(watchlist, null, 2) + '\n', 'utf8');
  writeFileSync(PICKS_PATH, JSON.stringify({
    asOf: new Date().toISOString(),
    today,
    actions: todayActions,
  }, null, 2) + '\n', 'utf8');

  console.log(`[scan-picks] watchlist cheap=${watchlist.cheap.length} neutral=${watchlist.neutral.length} rich=${watchlist.rich.length}`);
  console.log(`[scan-picks] portfolio positions=${result.positions.length}`);
  console.log(`[scan-picks] today actions=${todayActions.length}`);
}

main().catch((err) => {
  console.error('[scan-picks] failed:', err);
  process.exit(1);
});
