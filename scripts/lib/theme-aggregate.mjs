/**
 * Aggregate multiple stock close-series into a single normalized theme index.
 * Each stock normalized to 100 on first valid day, then averaged daily.
 * Days where a stock has null are dropped from that day's mean.
 *
 * Input:  [{ ticker, closes: (number|null)[] }, ...]
 * Output: (number|null)[]
 */
export function aggregateTheme(stocks) {
  if (stocks.length === 0) return [];
  const maxLen = Math.max(...stocks.map((s) => s.closes.length));
  if (maxLen === 0) return [];

  const normalized = stocks.map((s) => {
    const base = s.closes.find((c) => c != null);
    if (base == null || base === 0) return s.closes.map(() => null);
    return s.closes.map((c) => (c == null ? null : (c / base) * 100));
  });

  const out = [];
  for (let i = 0; i < maxLen; i++) {
    const vals = normalized.map((n) => n[i]).filter((v) => v != null);
    if (vals.length === 0) out.push(null);
    else out.push(vals.reduce((a, b) => a + b, 0) / vals.length);
  }
  return out;
}
