/**
 * Select daily themes from a scored pool.
 * Input: pool = [{ id, name, score, mom1m, mom3m, vol20, ... }, ...]
 * Output: { popular, value } — non-overlapping, up to 8 each.
 */
export function selectThemes(pool) {
  const byMomentum = [...pool]
    .map((t) => ({ ...t, _mom: t.mom1m * 0.4 + t.mom3m * 0.6 }))
    .sort((a, b) => b._mom - a._mom);

  const popular = byMomentum.slice(0, 8).map(({ _mom, ...t }) => t);
  const popularIds = new Set(popular.map((t) => t.id));

  const valueCandidates = pool
    .filter((t) =>
      t.score >= 1 &&
      t.vol20 < 0.25 &&
      t.mom3m > -0.05 &&
      !popularIds.has(t.id)
    )
    .sort((a, b) => b.score - a.score);

  const value = valueCandidates.slice(0, 8);

  return { popular, value };
}
