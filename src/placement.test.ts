import { describe, expect, it } from 'vitest';
import { clampOffset, nearestCorner } from './placement';

const VIEWPORT = { width: 1000, height: 800 };
const PANEL = { width: 280, height: 400 };

describe('clampOffset', () => {
  it('keeps a position that fits', () => {
    expect(clampOffset({ x: 100, y: 50 }, PANEL, VIEWPORT)).toEqual({ x: 100, y: 50 });
  });

  it('keeps the panel off every edge', () => {
    expect(clampOffset({ x: -50, y: -50 }, PANEL, VIEWPORT)).toEqual({ x: 8, y: 8 });
    expect(clampOffset({ x: 900, y: 700 }, PANEL, VIEWPORT)).toEqual({ x: 712, y: 392 });
  });

  it('pins a panel larger than the viewport to the top left', () => {
    expect(clampOffset({ x: 300, y: 300 }, { width: 1200, height: 900 }, VIEWPORT)).toEqual({ x: 8, y: 8 });
  });
});

describe('nearestCorner', () => {
  it.each([
    [{ x: 10, y: 10 }, 'top-left'],
    [{ x: 900, y: 10 }, 'top-right'],
    [{ x: 10, y: 700 }, 'bottom-left'],
    [{ x: 900, y: 700 }, 'bottom-right'],
  ] as const)('%j snaps to %s', (offset, corner) => {
    expect(nearestCorner(offset, VIEWPORT)).toBe(corner);
  });

  it('judges by the icon center', () => {
    expect(nearestCorner({ x: 478, y: 378 }, VIEWPORT)).toBe('top-left');
    expect(nearestCorner({ x: 479, y: 379 }, VIEWPORT)).toBe('bottom-right');
  });
});
