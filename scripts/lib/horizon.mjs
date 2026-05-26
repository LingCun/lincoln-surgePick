/**
 * Classify a pick into 단기/중기/장기 based on score pattern + metrics.
 * Input: { scores: {A,B,C}, metrics: { obvSlopeNormalized, ... }, mom1m?:number, vol20?:number }
 * Output: { horizon: '단기'|'중기'|'장기', holdDays: 14|90|365 }
 *
 * Rule:
 *   단기 (14d) — strong trend + strong momentum → take profit fast
 *   장기 (365d) — strong accumulation + low vol → hold through
 *   중기 (90d) — balanced
 */
export function classifyHorizon({ scores, metrics, mom1m = 0, vol20 = 0.2 }) {
  if (scores.A >= 0.6 && mom1m >= 0.04) {
    return { horizon: '단기', holdDays: 14 };
  }
  if (
    scores.C >= 0.5 &&
    vol20 <= 0.25 &&
    (metrics.obvSlopeNormalized ?? 0) >= 0.5
  ) {
    return { horizon: '장기', holdDays: 365 };
  }
  return { horizon: '중기', holdDays: 90 };
}
