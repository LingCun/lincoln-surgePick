/**
 * Simple moving average of the last N values ending at endIdx (inclusive).
 */
export function sma(closes, endIdx, window) {
  if (endIdx < window - 1) return NaN;
  let sum = 0;
  for (let i = endIdx - window + 1; i <= endIdx; i++) sum += closes[i];
  return sum / window;
}

/**
 * Wilder's RSI(period) over the full series, returns latest value.
 * NaN if closes.length <= period.
 */
export function rsi(closes, period = 14) {
  if (closes.length <= period) return NaN;
  let avgGain = 0;
  let avgLoss = 0;
  for (let i = 1; i <= period; i++) {
    const diff = closes[i] - closes[i - 1];
    if (diff > 0) avgGain += diff;
    else avgLoss += -diff;
  }
  avgGain /= period;
  avgLoss /= period;
  for (let i = period + 1; i < closes.length; i++) {
    const diff = closes[i] - closes[i - 1];
    const gain = diff > 0 ? diff : 0;
    const loss = diff < 0 ? -diff : 0;
    avgGain = (avgGain * (period - 1) + gain) / period;
    avgLoss = (avgLoss * (period - 1) + loss) / period;
  }
  if (avgLoss === 0) return avgGain === 0 ? 50 : 100;
  const rs = avgGain / avgLoss;
  return 100 - 100 / (1 + rs);
}

/**
 * Return CHEAP / RICH / NEUTRAL tag for the latest close.
 * cheap: rsi<35 AND |price - ma200| / ma200 < 0.10
 * rich:  rsi>70 OR price > ma200 * 1.20
 * neutral: otherwise (also when insufficient history)
 */
export function valuationTag(closes) {
  if (closes.length < 201) return 'neutral';
  const endIdx = closes.length - 1;
  const price = closes[endIdx];
  const ma200 = sma(closes, endIdx, 200);
  if (Number.isNaN(ma200)) return 'neutral';
  const rsiVal = rsi(closes, 14);
  if (Number.isNaN(rsiVal)) return 'neutral';
  const distance = Math.abs(price - ma200) / ma200;
  if (rsiVal > 70 || price > ma200 * 1.20) return 'rich';
  if (rsiVal < 35 && distance < 0.10) return 'cheap';
  return 'neutral';
}
