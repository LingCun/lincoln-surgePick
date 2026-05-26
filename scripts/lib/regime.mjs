import { mean, stdev } from './stats.mjs';

function ma(closes, n) {
  if (closes.length < n) return null;
  return mean(closes.slice(-n));
}

/**
 * Compute regime score for a single market.
 * Input: { closes:number[] (>=22), vix:number|null, market:'KR'|'US' }
 * Output: { score, metrics:{ trend, mom1m, mom3m, vol20, vix, ma50, ma200 } }
 */
export function scoreRegime({ closes, vix, market }) {
  const ma50 = ma(closes, 50);
  const ma200 = ma(closes, 200);
  const last = closes[closes.length - 1];

  let trend;
  if (ma50 != null && ma200 != null && last > ma50 && ma50 > ma200) trend = 'up';
  else if (ma200 != null && last < ma200) trend = 'down';
  else trend = 'chop';

  const mom1m = closes.length >= 22 ? last / closes[closes.length - 22] - 1 : 0;
  const mom3m = closes.length >= 64 ? last / closes[closes.length - 64] - 1 : 0;

  const returns = [];
  const start = Math.max(1, closes.length - 20);
  for (let i = start; i < closes.length; i++) {
    returns.push((closes[i] - closes[i - 1]) / closes[i - 1]);
  }
  const vol20 = stdev(returns) * Math.sqrt(252);

  let score = 0;
  if (trend === 'up') score += 2;
  else if (trend === 'down') score -= 2;
  if (mom1m > 0.02) score += 1;
  else if (mom1m < -0.02) score -= 1;
  if (mom3m > 0.05) score += 1;
  else if (mom3m < -0.05) score -= 1;

  if (market === 'US' && vix != null) {
    if (vix < 18) score += 1;
    else if (vix > 25) score -= 1;
  } else {
    if (vol20 < 0.15) score += 1;
    else if (vol20 > 0.30) score -= 1;
  }

  return {
    score,
    metrics: { trend, mom1m, mom3m, vol20, vix: market === 'US' ? vix : null, ma50, ma200 },
  };
}

export function labelFromScore(score) {
  if (score >= 3)  return { label: '풀매수',          weight: '90~100%' };
  if (score >= 1)  return { label: '분할매수',        weight: '60~80%'  };
  if (score >= -1) return { label: '관망/존버',       weight: '40~60%'  };
  return             { label: '비중축소+이익실현',    weight: '10~30%'  };
}
