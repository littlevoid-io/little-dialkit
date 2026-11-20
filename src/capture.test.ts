import { describe, expect, it } from 'vitest';
import { fileName, stamp } from './capture';

const DATE = new Date(2026, 10, 20, 14, 32, 5);

describe('stamp', () => {
  it('is the local date and time', () => expect(stamp(DATE)).toBe('2026-11-20-143205'));
});

describe('fileName', () => {
  it('joins panel, version, time and extension', () => {
    expect(fileName('scene', 'wide-v02', DATE, 'png')).toBe('scene-wide-v02-2026-11-20-143205.png');
  });
  it('replaces what a file name cannot hold', () => {
    expect(fileName('scene', 'Version 1: a/b', DATE, 'mp4')).toBe('scene-Version-1-a-b-2026-11-20-143205.mp4');
  });
});
