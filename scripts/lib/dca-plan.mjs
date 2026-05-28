function addCalendarDays(dateStr, days) {
  const d = new Date(dateStr + 'T00:00:00Z');
  d.setUTCDate(d.getUTCDate() + days);
  return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, '0')}-${String(d.getUTCDate()).padStart(2, '0')}`;
}

function splitInto3(total) {
  const base = Math.floor(total / 3);
  return [base, base, total - base * 2];
}

/**
 * Create a 3-chunk DCA buy plan over 10 calendar days (chunks at +0, +7, +14).
 * shares split as floor/floor/remainder.
 */
export function createDcaPlan({ startDate, totalShares }) {
  const [s1, s2, s3] = splitInto3(totalShares);
  return {
    kind: 'dca',
    startDate,
    chunks: [
      { date: startDate, shares: s1, filled: false },
      { date: addCalendarDays(startDate, 7), shares: s2, filled: false },
      { date: addCalendarDays(startDate, 14), shares: s3, filled: false },
    ],
  };
}

/**
 * Create a 3-chunk distribution sell plan.
 * shares: 33% / 33% / 34% (last absorbs remainder).
 */
export function createDistPlan({ startDate, totalShares }) {
  const s1 = Math.floor(totalShares * 0.33);
  const s2 = Math.floor(totalShares * 0.33);
  const s3 = totalShares - s1 - s2;
  return {
    kind: 'dist',
    startDate,
    chunks: [
      { date: startDate, shares: s1, filled: false },
      { date: addCalendarDays(startDate, 7), shares: s2, filled: false },
      { date: addCalendarDays(startDate, 14), shares: s3, filled: false },
    ],
  };
}

/**
 * Return the next unfilled chunk whose scheduled date <= currentDate, else null.
 */
export function chunkDueOn(plan, currentDate) {
  let result = null;
  for (const c of plan.chunks) {
    if (!c.filled && c.date <= currentDate) result = c;
  }
  return result;
}

/**
 * DCA aborts if signal flips off 'cheap'. Distribution aborts if signal flips off 'rich'.
 */
export function abortIfSignalChanged(plan, currentTag) {
  if (plan.kind === 'dca') return currentTag !== 'cheap';
  if (plan.kind === 'dist') return currentTag !== 'rich';
  return false;
}
