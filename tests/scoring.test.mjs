import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { scorePicks } from '../scripts/lib/scoring.mjs';

const __dirname = dirname(fileURLToPath(import.meta.url));
const load = (name) =>
  JSON.parse(readFileSync(resolve(__dirname, 'fixtures', name), 'utf8'));

describe('scorePicks', () => {
  it('passes all 3 conditions on uptrend-accumulation fixture', () => {
    const r = scorePicks(load('uptrend-accumulation.json'));
    expect(r.passes.trendUp).toBe(true);
    expect(r.passes.volumeUp).toBe(true);
    expect(r.passes.accumulation).toBe(true);
    expect(r.total).toBeGreaterThan(0);
  });

  it('fails trendUp on spike-heavy fixture', () => {
    const r = scorePicks(load('spike-heavy.json'));
    expect(r.passes.trendUp).toBe(false);
  });

  it('fails on flat fixture', () => {
    const r = scorePicks(load('flat.json'));
    expect(r.passes.trendUp).toBe(false);
    expect(r.passes.volumeUp).toBe(false);
  });

  it('returns metrics object', () => {
    const r = scorePicks(load('uptrend-accumulation.json'));
    expect(r.metrics).toHaveProperty('slope');
    expect(r.metrics).toHaveProperty('volRatio');
    expect(r.metrics).toHaveProperty('pricePosition');
    expect(r.metrics).toHaveProperty('maxDailyReturn');
    expect(r.metrics).toHaveProperty('spikeCount');
  });
});
