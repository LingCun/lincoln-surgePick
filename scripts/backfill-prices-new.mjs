// 5y 가격 데이터 없는 (또는 적은) 종목만 backfill. 새 추가된 ticker 대응.
import { fetchChart } from './fetch-yahoo.mjs';
import { getDb } from './lib/db.mjs';

const MIN_ROWS = 1000;   // 5y 거래일 ~1250. 미달이면 backfill 대상.

const db = getDb();
const res = await db.execute(`
  SELECT t.ticker
  FROM tickers t
  WHERE active = 1
    AND (SELECT COUNT(*) FROM prices p WHERE p.ticker = t.ticker) < ${MIN_ROWS}
`);
const list = res.rows.map((r) => r.ticker);

if (list.length === 0) {
  console.log('no new tickers — all have ≥' + MIN_ROWS + ' price rows.');
  process.exit(0);
}

console.log(`backfilling ${list.length} new/sparse tickers (5y)...`);

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
let ok = 0, fail = 0, totalRows = 0;
for (let i = 0; i < list.length; i++) {
  const t = list[i];
  const data = await fetchChart(t, '5y');
  if (!data || !data.dates?.length) {
    fail++;
    console.warn(`[${i + 1}/${list.length}] ${t}: no data`);
    await sleep(200);
    continue;
  }
  const stmts = [];
  for (let j = 0; j < data.dates.length; j++) {
    stmts.push({
      sql: `INSERT OR REPLACE INTO prices (ticker, date, open, close, high, low)
            VALUES (?, ?, ?, ?, ?, ?)`,
      args: [t, data.dates[j], data.opens[j], data.closes[j], data.highs[j], data.lows[j]],
    });
  }
  for (let k = 0; k < stmts.length; k += 500) {
    await db.batch(stmts.slice(k, k + 500), 'write');
  }
  ok++;
  totalRows += data.dates.length;
  console.log(`[${i + 1}/${list.length}] ${t}: ok (${data.dates.length} rows)`);
  await sleep(200);
}
console.log(`done. ok=${ok} fail=${fail} total_rows=${totalRows}`);
