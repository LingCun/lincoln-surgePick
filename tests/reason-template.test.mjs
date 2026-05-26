import { describe, it, expect } from 'vitest';
import { pickReason } from '../scripts/lib/reason-template.mjs';

describe('pickReason', () => {
  it('all three conditions strong → user-friendly text', () => {
    const reason = pickReason({
      scores: { A: 0.8, B: 0.8, C: 0.8 },
      metrics: { slope: 0.003, volRatio: 1.7, pricePosition: 0.25 },
    });
    expect(reason).toMatch(/우상향|상승/);
    expect(reason).toMatch(/거래량/);
  });

  it('volume + accumulation dominant', () => {
    const reason = pickReason({
      scores: { A: 0.2, B: 0.9, C: 0.9 },
      metrics: { slope: 0.0012, volRatio: 2.1, pricePosition: 0.15 },
    });
    expect(reason).toMatch(/거래량/);
    expect(reason).toMatch(/바닥|저점|매집/);
  });

  it('no technical jargon', () => {
    const reason = pickReason({
      scores: { A: 0.8, B: 0.8, C: 0.8 },
      metrics: { slope: 0.003, volRatio: 1.7, pricePosition: 0.25 },
    });
    expect(reason).not.toMatch(/OBV|slope|regression|stdev/i);
  });

  it('returns non-empty string for any input', () => {
    expect(pickReason({ scores: { A: 0.1, B: 0.1, C: 0.1 }, metrics: { slope: 0, volRatio: 1, pricePosition: 0.5 } })).toBeTruthy();
  });
});
