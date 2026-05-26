/**
 * Map VIX to 5-step fear gauge.
 * Input: VIX numeric value
 * Output: { vix, level, step (1-5), color, comment }
 */
export function fearGauge(vix) {
  if (vix < 14) return { vix, level: '극도의 탐욕',  step: 1, color: 'extremeGreed', comment: '시장 너무 들떠 있음. 과열 조심.' };
  if (vix < 18) return { vix, level: '탐욕',         step: 2, color: 'greed',        comment: '분위기 좋음. 위험 자산 강세.' };
  if (vix < 22) return { vix, level: '중립',         step: 3, color: 'neutral',      comment: '평소 수준. 평범한 시장.' };
  if (vix < 28) return { vix, level: '공포',         step: 4, color: 'fear',         comment: '겁먹기 시작. 신중하게.' };
  return              { vix, level: '극도의 공포',  step: 5, color: 'extremeFear',  comment: '공포 극심. 이럴 때 바닥 만들어짐.' };
}
