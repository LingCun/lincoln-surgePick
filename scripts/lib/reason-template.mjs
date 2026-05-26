/**
 * Generate a one-line, user-friendly pick reason.
 * Picks dominant 2 of {A=trend, B=volume, C=accumulation} and composes a sentence.
 * Never exposes technical terms (slope, OBV, regression).
 */
export function pickReason({ scores, metrics }) {
  const volMult = metrics.volRatio.toFixed(1);
  const dailyPct = (metrics.slope * 100).toFixed(2);

  const fragments = {
    A_strong: `완만하게 우상향(일평균 +${dailyPct}%)`,
    A_mild: '꾸준히 우상향',
    B_strong: `거래량 ${volMult}배 증가`,
    B_mild: '거래량 증가세',
    C_strong: '바닥권에서 조용히 매집',
    C_mild: '저점권 매수세',
  };

  const ranked = Object.entries(scores)
    .map(([k, v]) => ({ k, v }))
    .sort((a, b) => b.v - a.v);

  const parts = ranked.slice(0, 2).map(({ k, v }) => {
    const tier = v >= 0.5 ? 'strong' : 'mild';
    return fragments[`${k}_${tier}`];
  });

  return `${parts[0]} + ${parts[1]}.`;
}
