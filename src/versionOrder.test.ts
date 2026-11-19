import { DialStore } from 'dialkit/vanilla';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { Edits } from './edits';
import { moveVersion, reordered } from './versionOrder';

const ID = 'version-order-test';
const CONFIG = { size: [1, 0, 10, 1] as [number, number, number, number] };

function names(): string[] {
  return DialStore.getPresets(ID).map(({ name }) => name);
}

function id(name: string): string {
  return DialStore.getPresets(ID).find((preset) => preset.name === name)?.id ?? '';
}

describe('reordered', () => {
  it('moves down, after the target', () => expect(reordered(['a', 'b', 'c'], 0, 2, true)).toEqual(['b', 'c', 'a']));
  it('moves up, before the target', () => expect(reordered(['a', 'b', 'c'], 2, 0, false)).toEqual(['c', 'a', 'b']));
  it('moves down, before the target', () => expect(reordered(['a', 'b', 'c'], 0, 2, false)).toEqual(['b', 'a', 'c']));
  it('keeps the order next to itself', () => expect(reordered(['a', 'b', 'c'], 0, 1, false)).toEqual(['a', 'b', 'c']));
});

describe('moveVersion', () => {
  beforeEach(() => {
    DialStore.registerPanel(ID, 'Test', CONFIG);
    for (const size of [2, 3, 4]) {
      DialStore.updateValue(ID, 'size', size);
      DialStore.savePreset(ID, `v${size}`);
    }
  });
  afterEach(() => DialStore.unregisterPanel(ID));

  it('reorders and keeps the selection, the values and the edits', () => {
    DialStore.updateValue(ID, 'size', 9);
    moveVersion(ID, id('v4'), id('v2'), false, new Edits(ID).held);
    expect(names()).toEqual(['v4', 'v2', 'v3']);
    expect(DialStore.getActivePresetId(ID)).toBe(id('v4'));
    expect(DialStore.getValue(ID, 'size')).toBe(9);
    expect(DialStore.getPresets(ID).map(({ values }) => values.size)).toEqual([4, 2, 3]);
    expect(DialStore.hasEdits(ID)).toBe(true);
  });

  it('reorders while the edited base is selected', () => {
    const edits = new Edits(ID);
    DialStore.clearActivePreset(ID);
    edits.update();
    DialStore.updateValue(ID, 'size', 7);
    edits.update();
    moveVersion(ID, id('v2'), id('v3'), true, edits.held);
    expect(names()).toEqual(['v3', 'v2', 'v4']);
    expect(DialStore.getActivePresetId(ID)).toBeNull();
    expect(DialStore.getValue(ID, 'size')).toBe(7);
    DialStore.updateValue(ID, 'size', 1);
    expect(DialStore.hasEdits(ID)).toBe(false);
  });
});
