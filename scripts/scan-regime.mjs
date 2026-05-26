import { writeFileSync, mkdirSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { fetchChart } from './fetch-yahoo.mjs';
import { scoreRegime, labelFromScore } from './lib/regime.mjs';
import { fearGauge } from './lib/fear-gauge.mjs';
import { marketComment, overallComment } from './lib/market-comment.mjs';

const __dirname = dirname(fileURLToPath(import.meta.url));
const OUTPUT = resolve(__dirname, '../src/data/regime.json');

const INDICES = [
  { code: 'KOSPI',  index: '^KS11',  emoji: '🇰🇷', region: 'KR' },
  { code: 'KOSDAQ', index: '^KQ11',  emoji: '🇰🇷', region: 'KR' },
  { code: 'SP500',  index: '^GSPC',  emoji: '🇺🇸', region: 'US' },
  { code: 'NASDAQ', index: '^IXIC',  emoji: '🇺🇸', region: 'US' },
];

async function main() {
  console.log('[scan-regime] fetching indices + VIX...');

  const vixData = await fetchChart('^VIX', '1mo');
  const vix = vixData?.closes?.[vixData.closes.length - 1] ?? null;

  const markets = [];
  for (const idx of INDICES) {
    const data = await fetchChart(idx.index, '1y');
    if (!data || data.closes.length < 64) {
      console.warn(`[scan-regime] insufficient data for ${idx.index}`);
      continue;
    }
    const r = scoreRegime({ closes: data.closes, vix: idx.region === 'US' ? vix : null, market: idx.region });
    const { label, weight } = labelFromScore(r.score);

    const closes = data.closes;
    const last60 = closes.slice(-60);
    const startIdx = closes.length - 60;
    const ma50 = last60.map((_, i) => {
      const g = startIdx + i;
      if (g < 49) return null;
      const w = closes.slice(g - 49, g + 1);
      return w.reduce((a, b) => a + b, 0) / 50;
    });
    const ma200 = last60.map((_, i) => {
      const g = startIdx + i;
      if (g < 199) return null;
      const w = closes.slice(g - 199, g + 1);
      return w.reduce((a, b) => a + b, 0) / 200;
    });

    markets.push({
      code: idx.code,
      emoji: idx.emoji,
      label,
      weight,
      score: r.score,
      comment: marketComment(label),
      closes60: last60,
      ma50,
      ma200,
      _debug: r.metrics,
    });
  }

  const gauge = vix != null
    ? fearGauge(vix)
    : { vix: null, level: '데이터 없음', step: 3, color: 'neutral', comment: '' };
  const overall = overallComment(markets);

  const out = {
    asOf: new Date().toISOString(),
    fearGauge: gauge,
    markets,
    overall,
  };

  mkdirSync(dirname(OUTPUT), { recursive: true });
  writeFileSync(OUTPUT, JSON.stringify(out, null, 2) + '\n', 'utf8');
  console.log(`[scan-regime] wrote ${OUTPUT} — VIX ${vix?.toFixed(2)}, ${markets.length} markets`);
}

main().catch((err) => {
  console.error('[scan-regime] failed:', err);
  process.exit(1);
});
