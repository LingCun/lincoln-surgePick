export function mean(arr) {
  if (arr.length === 0) return 0;
  return arr.reduce((a, b) => a + b, 0) / arr.length;
}

export function stdev(arr) {
  if (arr.length < 2) return 0;
  const m = mean(arr);
  const sq = arr.reduce((a, b) => a + (b - m) ** 2, 0);
  return Math.sqrt(sq / (arr.length - 1));
}

export function linearRegression(ys) {
  const n = ys.length;
  if (n < 2) return { slope: 0, intercept: ys[0] ?? 0 };
  const xs = ys.map((_, i) => i);
  const xMean = mean(xs);
  const yMean = mean(ys);
  let num = 0;
  let den = 0;
  for (let i = 0; i < n; i++) {
    num += (xs[i] - xMean) * (ys[i] - yMean);
    den += (xs[i] - xMean) ** 2;
  }
  const slope = den === 0 ? 0 : num / den;
  const intercept = yMean - slope * xMean;
  return { slope, intercept };
}

export function obv(closes, volumes) {
  const out = [0];
  for (let i = 1; i < closes.length; i++) {
    const prev = out[i - 1];
    if (closes[i] > closes[i - 1]) out.push(prev + volumes[i]);
    else if (closes[i] < closes[i - 1]) out.push(prev - volumes[i]);
    else out.push(prev);
  }
  return out;
}
