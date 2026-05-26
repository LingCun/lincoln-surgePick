import { describe, it, expect } from 'vitest';
import { classifyHorizon } from '../scripts/lib/horizon.mjs';

describe('classifyHorizon', () => {
  it('strong trend + strong momentum → 단기', () => {
    const r = classifyHorizon({
      scores: { A: 0.8, B: 0.5, C: 0.3 },
      metrics: { obvSlopeNormalized: 0.3 },
      mom1m: 0.06,
      vol20: 0.18,
    });
    expect(r.horizon).toBe('단기');
    expect(r.holdDays).toBe(14);
  });

  it('strong accumulation + low vol → 장기', () => {
    const r = classifyHorizon({
      scores: { A: 0.3, B: 0.4, C: 0.7 },
      metrics: { obvSlopeNormalized: 0.6 },
      mom1m: 0.01,
      vol20: 0.18,
    });
    expect(r.horizon).toBe('장기');
    expect(r.holdDays).toBe(365);
  });

  it('balanced scores → 중기', () => {
    const r = classifyHorizon({
      scores: { A: 0.4, B: 0.5, C: 0.4 },
      metrics: { obvSlopeNormalized: 0.3 },
      mom1m: 0.02,
      vol20: 0.20,
    });
    expect(r.horizon).toBe('중기');
    expect(r.holdDays).toBe(90);
  });

  it('high vol blocks 장기', () => {
    const r = classifyHorizon({
      scores: { A: 0.3, B: 0.4, C: 0.7 },
      metrics: { obvSlopeNormalized: 0.6 },
      mom1m: 0.01,
      vol20: 0.30,
    });
    expect(r.horizon).toBe('중기');
  });
});
