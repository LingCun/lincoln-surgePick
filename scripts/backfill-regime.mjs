import { fetchChart } from './fetch-yahoo.mjs';
import { scoreRegime } from './lib/regime.mjs';
import { stdev } from './lib/stats.mjs';
import { getDb } from './lib/db.mjs';

const INDICES = [
  { code: 'KS11',  market: 'KR' },
  { code: 'GSPC',  market: 'US' },
];

function labelFromScore(score) {
  if (score >= 2) return 'bull';
  if (score <= -2) return 'bear';
  return 'neutral';
}

function vixBand({ vix, vol20 }) {
  if (vix != null) {
    if (vix < 15) return 'low';
    if (vix < 25) return 'mid';
    return 'high';
  }
  if (vol20 == null) return null;
  if (vol20 < 0.15) return 'low';
  if (vol20 < 0.30) return 'mid';
  return 'high';
}

async function main() {
  console.log('[backfill-regime] fetching 5y indices + VIX...');
  const vixData = await fetchChart('^VIX', '5y');
  if (!vixData) throw new Error('VIX fetch failed');
  const vixByDate = new Map(vixData.dates.map((d, i) => [d, vixData.closes[i]]));

  const allRows = [];

  for (const idx of INDICES) {
    console.log(`[backfill-regime] processing ^${idx.code}...`);
    const data = await fetchChart(`^${idx.code}`, '5y');
    if (!data || data.closes.length < 200) {
      console.warn(`[backfill-regime] insufficient data for ^${idx.code}`);
      continue;
    }
    const { dates, closes } = data;
    let count = 0;
    // 매일 over the window; 최소 65 closes 필요 (mom3m=64 + 1)
    for (let i = 65; i < closes.length; i++) {
      const date = dates[i];
      const window = closes.slice(0, i + 1);
      const vixAtDay = idx.market === 'US' ? (vixByDate.get(date) ?? null) : null;
      const r = scoreRegime({ closes: window, vix: vixAtDay, market: idx.market });
      const label = labelFromScore(r.score);
      const band = vixBand({ vix: vixAtDay, vol20: r.metrics.vol20 });
      allRows.push({ date, market: idx.market, label, vix: vixAtDay, vix_band: band });
      count++;
    }
    console.log(`  → ${count} rows for ${idx.market}`);
  }

  if (allRows.length === 0) {
    console.error('[backfill-regime] no rows to insert');
    process.exit(1);
  }

  console.log(`[backfill-regime] inserting ${allRows.length} rows...`);
  const db = getDb();
  const CHUNK = 500;
  for (let i = 0; i < allRows.length; i += CHUNK) {
    const chunk = allRows.slice(i, i + CHUNK);
    const stmts = chunk.map((r) => ({
      sql: `INSERT OR REPLACE INTO regime (date, market, label, vix, vix_band) VALUES (?, ?, ?, ?, ?)`,
      args: [r.date, r.market, r.label, r.vix, r.vix_band],
    }));
    await db.batch(stmts, 'write');
    console.log(`  ${Math.min(i + CHUNK, allRows.length)}/${allRows.length}`);
  }
  console.log(`✓ backfill-regime done: ${allRows.length} rows`);
}

main().catch((err) => {
  console.error('[backfill-regime] failed:', err);
  process.exit(1);
});
