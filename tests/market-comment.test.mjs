import { describe, it, expect } from 'vitest';
import { marketComment, overallComment } from '../scripts/lib/market-comment.mjs';

describe('marketComment', () => {
  it('풀매수 → 적극 표현', () => {
    expect(marketComment('풀매수')).toMatch(/적극|들고|강|좋/);
  });
  it('분할매수 → 나눠서 표현', () => {
    expect(marketComment('분할매수')).toMatch(/나눠|분할|일부/);
  });
  it('관망/존버 → 가만히 표현', () => {
    expect(marketComment('관망/존버')).toMatch(/가만|관망|존버|기다/);
  });
  it('비중축소+이익실현 → 현금화/이익 표현', () => {
    expect(marketComment('비중축소+이익실현')).toMatch(/현금|이익|축소|챙겨/);
  });
});

describe('overallComment', () => {
  it('all bullish → bullish overall', () => {
    const r = overallComment([
      { label: '풀매수' },
      { label: '풀매수' },
      { label: '분할매수' },
      { label: '풀매수' },
    ]);
    expect(r.weight).toMatch(/80|90|100/);
    expect(r.comment).toMatch(/좋|양호|강세|적극/);
  });
  it('all bearish → defensive overall', () => {
    const r = overallComment([
      { label: '비중축소+이익실현' },
      { label: '비중축소+이익실현' },
      { label: '관망/존버' },
      { label: '비중축소+이익실현' },
    ]);
    expect(r.weight).toMatch(/10|20|30/);
    expect(r.comment).toMatch(/축소|현금|위험|조심|이익/);
  });
});
