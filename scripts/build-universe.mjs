import { writeFileSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

// KOSPI 200 / S&P 500 외 추가 종목 (수동 관리). 자동 빌드 후에도 살아남음.
const EXTRAS_KR = [
  { ticker: '163730.KQ', name: '핑거', market: 'KOSDAQ' },
];
const EXTRAS_US = [];

const stripTags = (s) =>
  s
    .replace(/<[^>]*>/g, '')
    .replace(/&amp;/g, '&')
    .replace(/&nbsp;/g, ' ')
    .replace(/&#\d+;/g, '')
    .trim();

// Wikipedia "List of S&P 500 companies" → ~500 tickers.
async function fetchSP500() {
  const res = await fetch('https://en.wikipedia.org/wiki/List_of_S%26P_500_companies', {
    headers: { 'User-Agent': 'Mozilla/5.0 surgepick-builder' },
  });
  if (!res.ok) throw new Error(`SP500 fetch HTTP ${res.status}`);
  const html = await res.text();
  const tableMatch = html.match(/<table[^>]*id="constituents"[^>]*>([\s\S]*?)<\/table>/);
  if (!tableMatch) throw new Error('S&P 500 constituents table not found');
  const rows = [...tableMatch[1].matchAll(/<tr>([\s\S]*?)<\/tr>/g)];
  const list = [];
  for (const r of rows) {
    const cells = [...r[1].matchAll(/<t[dh][^>]*>([\s\S]*?)<\/t[dh]>/g)];
    if (cells.length < 4) continue;
    let ticker = stripTags(cells[0][1]);
    const name = stripTags(cells[1][1]);
    if (!ticker || !name) continue;
    if (!/^[A-Z][A-Z0-9.\-]*$/.test(ticker)) continue;
    // Yahoo uses '-' for share class (BRK-B), Wikipedia/CSV uses '.' (BRK.B)
    ticker = ticker.replace(/\./g, '-');
    list.push({ ticker, name, market: 'SP500' });
  }
  return list;
}

// Korean Wikipedia "KOSPI 200" → ~200 tickers with Korean company names.
// English Wikipedia has the same table but English names, which makes Korean autocomplete useless.
// Parser: scan all <td>…</td><td>NNNNNN</td> adjacencies anywhere in the HTML
// — robust to nested templates and wikitable class variations.
async function fetchKospi200() {
  const res = await fetch('https://ko.wikipedia.org/wiki/KOSPI_200', {
    headers: { 'User-Agent': 'Mozilla/5.0 surgepick-builder' },
  });
  if (!res.ok) throw new Error(`KOSPI 200 fetch HTTP ${res.status}`);
  const html = await res.text();
  const pattern = /<td[^>]*>([\s\S]*?)<\/td>\s*<td[^>]*>\s*(\d{6})\s*<\/td>/g;
  const seen = new Map();
  for (const m of html.matchAll(pattern)) {
    // 일부 ko-Wikipedia 셀은 sector + name 을 multi-line 으로 묶음 → 마지막 비어있지 않은 줄만.
    const raw = stripTags(m[1]);
    const name = raw.split(/[\r\n]+/).map((s) => s.trim()).filter(Boolean).pop();
    const code = m[2];
    if (!name) continue;
    const ticker = `${code}.KS`;
    if (!seen.has(ticker)) seen.set(ticker, { ticker, name, market: 'KOSPI' });
  }
  return [...seen.values()];
}

async function main() {
  console.log('[build-universe] fetching S&P 500...');
  const us = await fetchSP500();
  console.log(`  → ${us.length} tickers`);
  if (us.length < 400) throw new Error(`S&P 500 too small: ${us.length}`);

  console.log('[build-universe] fetching KOSPI 200...');
  const kr = await fetchKospi200();
  console.log(`  → ${kr.length} tickers`);
  if (kr.length < 100) throw new Error(`KOSPI 200 too small: ${kr.length}`);

  // 자동 빌드 결과에 수동 extras 머지 (중복은 ticker 기준 dedup).
  const usMerged = dedupByTicker([...us, ...EXTRAS_US]);
  const krMerged = dedupByTicker([...kr, ...EXTRAS_KR]);

  writeFileSync(resolve(__dirname, 'universe-us.json'), JSON.stringify(usMerged, null, 2) + '\n');
  writeFileSync(resolve(__dirname, 'universe-kr.json'), JSON.stringify(krMerged, null, 2) + '\n');
  console.log(`✓ wrote universe-us.json (${usMerged.length}) + universe-kr.json (${krMerged.length})`);
}

function dedupByTicker(arr) {
  const seen = new Map();
  for (const x of arr) if (!seen.has(x.ticker)) seen.set(x.ticker, x);
  return [...seen.values()];
}

main().catch((err) => {
  console.error('[build-universe] failed:', err);
  process.exit(1);
});
