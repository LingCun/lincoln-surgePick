import { describe, it, expect } from 'vitest';
import { createDcaPlan, createDistPlan, chunkDueOn, abortIfSignalChanged } from '../scripts/lib/dca-plan.mjs';

describe('createDcaPlan', () => {
  it('creates 3-chunk plan with day 1, day 6, day 11 schedule', () => {
    const plan = createDcaPlan({ startDate: '2024-01-02', totalShares: 30 });
    expect(plan.chunks).toEqual([
      { date: '2024-01-02', shares: 10, filled: false },
      { date: '2024-01-09', shares: 10, filled: false },
      { date: '2024-01-16', shares: 10, filled: false },
    ]);
    expect(plan.kind).toBe('dca');
  });
  it('rounds shares with last chunk absorbing remainder', () => {
    const plan = createDcaPlan({ startDate: '2024-01-02', totalShares: 10 });
    expect(plan.chunks.map((c) => c.shares)).toEqual([3, 3, 4]);
  });
});

describe('createDistPlan', () => {
  it('33/33/34 fraction split with 5-day spacing', () => {
    const plan = createDistPlan({ startDate: '2024-01-02', totalShares: 100 });
    expect(plan.chunks.map((c) => c.shares)).toEqual([33, 33, 34]);
    expect(plan.kind).toBe('dist');
  });
});

describe('chunkDueOn', () => {
  it('returns next unfilled chunk if date matches', () => {
    const plan = createDcaPlan({ startDate: '2024-01-02', totalShares: 30 });
    const due = chunkDueOn(plan, '2024-01-09');
    expect(due?.shares).toBe(10);
    expect(due?.date).toBe('2024-01-09');
  });
  it('returns next unfilled chunk if date >= scheduled date', () => {
    const plan = createDcaPlan({ startDate: '2024-01-02', totalShares: 30 });
    plan.chunks[0].filled = true;
    expect(chunkDueOn(plan, '2024-01-10')?.shares).toBe(10);
  });
  it('returns null if no chunks due', () => {
    const plan = createDcaPlan({ startDate: '2024-01-02', totalShares: 30 });
    plan.chunks[0].filled = true;
    expect(chunkDueOn(plan, '2024-01-03')).toBe(null);
  });
});

describe('abortIfSignalChanged', () => {
  it('aborts DCA when signal becomes rich', () => {
    const plan = createDcaPlan({ startDate: '2024-01-02', totalShares: 30 });
    expect(abortIfSignalChanged(plan, 'rich')).toBe(true);
  });
  it('aborts DCA when signal becomes neutral', () => {
    const plan = createDcaPlan({ startDate: '2024-01-02', totalShares: 30 });
    expect(abortIfSignalChanged(plan, 'neutral')).toBe(true);
  });
  it('does not abort DCA while signal stays cheap', () => {
    const plan = createDcaPlan({ startDate: '2024-01-02', totalShares: 30 });
    expect(abortIfSignalChanged(plan, 'cheap')).toBe(false);
  });
  it('aborts distribution when signal becomes cheap or neutral', () => {
    const plan = createDistPlan({ startDate: '2024-01-02', totalShares: 100 });
    expect(abortIfSignalChanged(plan, 'cheap')).toBe(true);
    expect(abortIfSignalChanged(plan, 'neutral')).toBe(true);
    expect(abortIfSignalChanged(plan, 'rich')).toBe(false);
  });
});
