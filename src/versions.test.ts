import { describe, expect, it } from 'vitest';
import { nextName } from './versions';

describe('nextName', () => {
  it('starts at v02', () => expect(nextName('look', ['look'])).toBe('look-v02'));
  it('counts up from a numbered name', () => expect(nextName('look-v02', ['look', 'look-v02'])).toBe('look-v03'));
  it('skips names that are taken', () => expect(nextName('look', ['look', 'look-v02', 'look-v03'])).toBe('look-v04'));
  it('keeps the digits of longer numbers', () => expect(nextName('look-v99', [])).toBe('look-v100'));
});
