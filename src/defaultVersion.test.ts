import { DialStore } from 'dialkit/vanilla';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { copyToBase } from './defaultVersion';
import { Edits } from './edits';
import { exportVersions, type VersionData } from './versionData';

const ID = 'default-test';
const CONFIG = { size: [1, 0, 10, 1] as [number, number, number, number], blur: [2, 0, 10, 1] as [number, number, number, number] };

function saved(id: string): object | undefined {
  return DialStore.getPresets(ID).find((version) => version.id === id)?.values;
}

describe('copyToBase', () => {
  beforeEach(() => DialStore.registerPanel(ID, 'Test', CONFIG));
  afterEach(() => DialStore.unregisterPanel(ID));

  it('copies what a version holds, without its edits, and keeps them as edits', () => {
    const edits = new Edits(ID);
    DialStore.updateValues(ID, { size: 3, blur: 4 });
    const two = DialStore.savePreset(ID, 'Two');
    edits.update();
    DialStore.updateValue(ID, 'size', 8);
    edits.update();
    const exported: VersionData[] = [];
    copyToBase(ID, two, edits.held, () => exported.push(exportVersions(ID)));
    expect(exported[0]?.base.values).toMatchObject({ size: 3, blur: 4 });
    expect(DialStore.getActivePresetId(ID)).toBe(two);
    expect(DialStore.getValues(ID)).toMatchObject({ size: 8, blur: 4 });
    expect(saved(two)).toMatchObject({ size: 3, blur: 4 });
    expect(DialStore.hasEdits(ID)).toBe(true);
  });

  it('replaces what an edited base holds and keeps its edits', () => {
    const edits = new Edits(ID);
    DialStore.updateValues(ID, { size: 3, blur: 4 });
    const two = DialStore.savePreset(ID, 'Two');
    DialStore.updateValues(ID, { size: 3, blur: 4 });
    DialStore.clearActivePreset(ID);
    edits.update();
    DialStore.updateValue(ID, 'blur', 7);
    edits.update();
    copyToBase(ID, two, edits.held);
    expect(DialStore.getActivePresetId(ID)).toBeNull();
    expect(DialStore.getValues(ID)).toMatchObject({ size: 3, blur: 7 });
    DialStore.updateValue(ID, 'blur', 4);
    expect(DialStore.hasEdits(ID)).toBe(false);
    expect(saved(two)).toMatchObject({ size: 3, blur: 4 });
  });
});
