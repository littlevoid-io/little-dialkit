import { DialStore } from 'dialkit/vanilla';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { Edits } from './edits';
import { applyToVersions } from './spread';

const ID = 'spread-test';
const CONFIG = { size: [1, 0, 10, 1] as [number, number, number, number], blur: [2, 0, 10, 1] as [number, number, number, number] };

function held(id: string | null): object {
  if (id === null) DialStore.clearActivePreset(ID);
  else DialStore.loadPreset(ID, id);
  return DialStore.getValues(ID);
}

describe('applyToVersions', () => {
  beforeEach(() => DialStore.registerPanel(ID, 'Test', CONFIG));
  afterEach(() => DialStore.unregisterPanel(ID));

  it('writes an edit into every version and keeps the other edits', () => {
    DialStore.updateValues(ID, { size: 3, blur: 4 });
    const two = DialStore.savePreset(ID, 'Two');
    DialStore.updateValues(ID, { size: 5, blur: 6 });
    const three = DialStore.savePreset(ID, 'Three');
    DialStore.updateValues(ID, { size: 8, blur: 9 });
    const edits = new Edits(ID);
    applyToVersions(ID, ['size'], edits.held);
    expect(DialStore.getActivePresetId(ID)).toBe(three);
    expect(DialStore.getValues(ID)).toMatchObject({ size: 8, blur: 9 });
    expect(DialStore.getPresets(ID).find(({ id }) => id === three)?.values).toMatchObject({ size: 8, blur: 6 });
    expect(DialStore.getPresets(ID).find(({ id }) => id === two)?.values).toMatchObject({ size: 8, blur: 4 });
    DialStore.updateValues(ID, { size: 8, blur: 6 });
    expect(held(null)).toMatchObject({ size: 8, blur: 2 });
  });

  it('writes from an edited base version', () => {
    const edits = new Edits(ID);
    DialStore.updateValue(ID, 'size', 3);
    const two = DialStore.savePreset(ID, 'Two');
    DialStore.clearActivePreset(ID);
    edits.update();
    DialStore.updateValue(ID, 'blur', 7);
    edits.update();
    applyToVersions(ID, ['blur'], edits.held);
    expect(DialStore.getActivePresetId(ID)).toBeNull();
    expect(DialStore.getValues(ID)).toMatchObject({ size: 1, blur: 7 });
    expect(DialStore.hasEdits(ID)).toBe(false);
    expect(DialStore.getPresets(ID).find(({ id }) => id === two)?.values).toMatchObject({ size: 3, blur: 7 });
  });
});
