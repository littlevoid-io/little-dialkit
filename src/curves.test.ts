import { describe, expect, it } from 'vitest';
import { CURVE_NAMES, evaluate, invert } from './curves';

const SHARES = [0, 0.1, 0.25, 0.5, 0.75, 0.9, 1];

describe('curves', () => {
  it('lists linear and four variants of four families', () => {
    expect(CURVE_NAMES).toHaveLength(17);
    expect(CURVE_NAMES).toContain('quintOutIn');
  });

  it.each(CURVE_NAMES)('%s runs from 0 to 1 through the middle', (name) => {
    expect(evaluate(name, 0)).toBe(0);
    expect(evaluate(name, 1)).toBe(1);
    expect(evaluate(name, 0.5)).toBeGreaterThan(0);
    expect(evaluate(name, 0.5)).toBeLessThan(1);
  });

  it.each(CURVE_NAMES)('%s inverts to a position that gives the share', (name) => {
    for (const share of SHARES) expect(evaluate(name, invert(name, share))).toBeCloseTo(share, 9);
  });

  it('shapes the variants', () => {
    expect(evaluate('cubicIn', 0.5)).toBe(0.125);
    expect(evaluate('cubicOut', 0.5)).toBe(0.875);
    expect(evaluate('cubicInOut', 0.25)).toBe(0.0625);
    expect(evaluate('cubicOutIn', 0.25)).toBe(0.4375);
    expect(evaluate('cubicOutIn', 0.5)).toBe(0.5);
  });

  it('rejects unknown curves', () => {
    expect(() => evaluate('bounce' as never, 0.5)).toThrow('Unknown curve');
  });
});
