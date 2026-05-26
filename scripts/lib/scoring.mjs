import { mean, linearRegression, obv } from './stats.mjs';

const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v));

/**
 * Score a single stock over its last 30 days of OHLCV.
 * Input: { closes:number[], volumes:number[], highs:number[], lows:number[] }
 * Output: { passes, scores, total, metrics }
 *
 * Conditions:
 *   A — gradual uptrend, no spikes
 *   B — volume increasing
 *   C — accumulation near range low + rising OBV
 */
export function scorePicks(series) {
  const closes = series.closes.slice(-30);
  const volumes = series.volumes.slice(-30);
  const highs = series.highs.slice(-30);
  const lows = series.lows.slice(-30);

  // A: trend
  const slopeRaw = linearRegression(closes).slope;
  const slope = slopeRaw / closes[0];
  const dailyReturns = [];
  for (let i = 1; i < closes.length; i++) {
    dailyReturns.push((closes[i] - closes[i - 1]) / closes[i - 1]);
  }
  const maxDailyReturn = dailyReturns.length ? Math.max(...dailyReturns) : 0;
  const spikeCount = dailyReturns.filter((r) => r >= 0.05).length;
  const trendUp = slope > 0.0002 && maxDailyReturn < 0.11 && spikeCount <= 4;
  const score_A = clamp(slope / 0.005, 0, 1) * Math.max(0, 1 - spikeCount / 5);

  // B: volume
  const volFirst = mean(volumes.slice(0, 15));
  const volSecond = mean(volumes.slice(15));
  const volRatio = volFirst === 0 ? 0 : volSecond / volFirst;
  const logVols = volumes.map((v) => Math.log(Math.max(v, 1)));
  const volSlope = linearRegression(logVols).slope;
  const volumeUp = volRatio >= 1.10 && volSlope > 0;
  const score_B = clamp((volRatio - 1) / 1.0, 0, 1);

  // C: accumulation
  const high30 = Math.max(...highs);
  const low30 = Math.min(...lows);
  const range = high30 - low30;
  const pricePosition = range === 0 ? 0.5 : (closes[closes.length - 1] - low30) / range;
  const obvSeries = obv(closes, volumes);
  const obvSlope = linearRegression(obvSeries).slope;
  const meanVol = mean(volumes);
  const obvSlopeNormalized = meanVol === 0 ? 0 : clamp(obvSlope / meanVol, 0, 1);
  const accumulation = pricePosition <= 0.8 && obvSlope > 0;
  const score_C = (1 - pricePosition) * obvSlopeNormalized;

  const total = 0.35 * score_A + 0.30 * score_B + 0.35 * score_C;

  return {
    passes: { trendUp, volumeUp, accumulation },
    scores: { A: score_A, B: score_B, C: score_C },
    total,
    metrics: {
      slope,
      maxDailyReturn,
      spikeCount,
      volRatio,
      volSlope,
      pricePosition,
      obvSlope,
      obvSlopeNormalized,
    },
  };
}
