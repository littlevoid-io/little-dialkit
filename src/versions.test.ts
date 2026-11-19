import { DialStore } from 'dialkit/vanilla';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { Edits } from './edits';
import { nextName, selectVersion, show, shown } from './versions';

const ID = 'versions-test';
const CONFIG = { size: [1, 0, 10, 1] as [number, number, number, number] };

describe('nextName', () => {
  it('starts at v02', () => expect(nextName('look', ['look'])).toBe('look-v02'));
  it('counts up from a numbered name', () => expect(nextName('look-v02', ['look', 'look-v02'])).toBe('look-v03'));
  it('skips names that are taken', () => expect(nextName('look', ['look', 'look-v02', 'look-v03'])).toBe('look-v04'));
  it('keeps the digits of longer numbers', () => expect(nextName('look-v99', [])).toBe('look-v100'));
});

describe('show', () => {
  beforeEach(() => {
    DialStore.registerPanel(ID, 'Test', CONFIG);
    for (const size of [2, 3]) {
      DialStore.updateValue(ID, 'size', size);
      DialStore.savePreset(ID, `v${size}`);
    }
  });
  afterEach(() => DialStore.unregisterPanel(ID));

  it('goes back to the version left and its edits, without merging edits into the one shown', () => {
    const edits = new Edits(ID);
    const [two, three] = DialStore.getPresets(ID);
    selectVersion(ID, two.id);
    DialStore.updateValue(ID, 'size', 5);
    const step = shown(ID);
    DialStore.updateValue(ID, 'size', 2);
    selectVersion(ID, three.id);
    DialStore.updateValue(ID, 'size', 8);
    edits.update();
    show(ID, step, edits.held);
    expect(shown(ID)).toEqual({ values: { size: 5 }, version: 'v2' });
    expect(DialStore.hasEdits(ID)).toBe(true);
    expect(DialStore.getPresets(ID).map(({ values }) => values.size)).toEqual([2, 3]);
  });

  it('sets the values only when the version is gone', () => {
    show(ID, { values: { size: 6 }, version: 'gone' }, new Edits(ID).held);
    expect(shown(ID)).toEqual({ values: { size: 6 }, version: 'v3' });
  });
});
