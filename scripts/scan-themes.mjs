import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { fetchChart } from './fetch-yahoo.mjs';
import { aggregateTheme } from './lib/theme-aggregate.mjs';
import { scoreRegime, labelFromScore } from './lib/regime.mjs';
import { selectThemes } from './lib/theme-select.mjs';

const __dirname = dirname(fileURLToPath(import.meta.url));
const OUTPUT = resolve(__dirname, '../src/data/themes.json');

function load(name) {
  return JSON.parse(readFileSync(resolve(__dirname, name), 'utf8'));
}

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

function themeOneLiner({ name, mom1m, score }) {
  const pct = (mom1m * 100).toFixed(1);
  const sign = mom1m >= 0 ? '+' : '';
  if (score >= 3)  return `${name}: 한 달 ${sign}${pct}%, 추세 강함. 적극 비중.`;
  if (score >= 1)  return `${name}: 한 달 ${sign}${pct}%, 추세 양호. 분할매수.`;
  if (score >= -1) return `${name}: 한 달 ${sign}${pct}%, 방향 애매. 관망.`;
  return             `${name}: 한 달 ${sign}${pct}%, 약세. 일부 현금화.`;
}

async function fetchTheme(theme, cache) {
  const stocks = [];
  for (const ticker of theme.tickers) {
    let data = cache.get(ticker);
    if (data === undefined) {
      data = await fetchChart(ticker, '1y');
      cache.set(ticker, data);
      await sleep(200);
    }
    if (data) stocks.push({ ticker, closes: data.closes });
  }
  return stocks;
}

async function scanMarket(pool, market, vix) {
  console.log(`[scan-themes] ${market}: scoring ${pool.length} themes...`);
  const cache = new Map();
  const scored = [];

  for (const theme of pool) {
    const stocks = await fetchTheme(theme, cache);
    if (stocks.length === 0) continue;
    const aggregate = aggregateTheme(stocks).filter((v) => v != null);
    if (aggregate.length < 64) continue;

    const r = scoreRegime({ closes: aggregate, vix: market === 'US' ? vix : null, market });
    const { label, weight } = labelFromScore(r.score);
    scored.push({
      id: theme.id,
      name: theme.name,
      icon: theme.icon,
      score: r.score,
      mom1m: r.metrics.mom1m,
      mom3m: r.metrics.mom3m,
      vol20: r.metrics.vol20,
      label,
      weight,
      comment: themeOneLiner({ name: theme.name, mom1m: r.metrics.mom1m, score: r.score }),
      closes60: aggregate.slice(-60),
      tickers: theme.tickers,
    });
    console.log(`  · ${theme.name}: score=${r.score} mom1m=${(r.metrics.mom1m * 100).toFixed(1)}%`);
  }

  return selectThemes(scored);
}

async function main() {
  const krPool = load('themes-kr.json');
  const usPool = load('themes-us.json');

  let vix = null;
  try {
    const regime = JSON.parse(readFileSync(resolve(__dirname, '../src/data/regime.json'), 'utf8'));
    vix = regime.fearGauge?.vix ?? null;
  } catch {
    const vixData = await fetchChart('^VIX', '1mo');
    vix = vixData?.closes?.[vixData.closes.length - 1] ?? null;
  }
  console.log(`[scan-themes] using VIX=${vix}`);

  const kr = await scanMarket(krPool, 'KR', vix);
  const us = await scanMarket(usPool, 'US', vix);

  const out = {
    asOf: new Date().toISOString(),
    kr,
    us,
  };

  mkdirSync(dirname(OUTPUT), { recursive: true });
  writeFileSync(OUTPUT, JSON.stringify(out, null, 2) + '\n', 'utf8');
  console.log(`[scan-themes] wrote ${OUTPUT} — KR pop ${kr.popular.length} val ${kr.value.length} / US pop ${us.popular.length} val ${us.value.length}`);
}

main().catch((err) => {
  console.error('[scan-themes] failed:', err);
  process.exit(1);
});
