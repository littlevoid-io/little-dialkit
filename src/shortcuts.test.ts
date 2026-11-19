import { describe, expect, it } from 'vitest';
import { chord } from './shortcuts';

const NONE = { ctrlKey: false, metaKey: false, altKey: false, shiftKey: false };

describe('chord', () => {
  it('names a plain key', () => expect(chord({ ...NONE, key: 'Escape' })).toBe('escape'));
  it('names Ctrl and Shift', () => expect(chord({ ...NONE, key: 'S', ctrlKey: true, shiftKey: true })).toBe('ctrl+shift+s'));
  it('takes Cmd as Ctrl', () => expect(chord({ ...NONE, key: 'z', metaKey: true })).toBe('ctrl+z'));
  it('takes AltGr as no Ctrl', () => expect(chord({ ...NONE, key: '[', ctrlKey: true, altKey: true })).toBe('['));
  it('leaves Shift to the typed character', () => expect(chord({ ...NONE, key: ']', shiftKey: true })).toBe(']'));
});
