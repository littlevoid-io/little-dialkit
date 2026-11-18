import { DialStore } from 'dialkit/vanilla';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { Edits } from './edits';

const ID = 'edits-test';
const CONFIG = { size: [1, 0, 10, 1] as [number, number, number, number], blur: { radius: [2, 0, 10, 1] as [number, number, number, number], label: 'a' } };

describe('edits', () => {
  beforeEach(() => DialStore.registerPanel(ID, 'Test', CONFIG));
  afterEach(() => DialStore.unregisterPanel(ID));

  it('reports and resets edits on the base version', () => {
    const edits = new Edits(ID);
    DialStore.updateValues(ID, { 'size': 4, 'blur.radius': 5 });
    edits.update();
    expect(edits.any).toBe(true);
    expect(edits.changed('blur')).toBe(true);
    expect(edits.changed('blur.label')).toBe(false);
    edits.reset('blur');
    edits.update();
    expect(DialStore.getValues(ID)).toMatchObject({ 'size': 4, 'blur.radius': 2 });
    edits.resetAll();
    edits.update();
    expect(edits.any).toBe(false);
    expect(DialStore.hasEdits(ID)).toBe(false);
  });

  it('reads what an edited base holds without changing the versions', () => {
    DialStore.updateValue(ID, 'size', 7);
    const edits = new Edits(ID);
    expect(DialStore.getPresets(ID)).toHaveLength(0);
    expect(DialStore.getActivePresetId(ID)).toBeNull();
    expect(DialStore.getValue(ID, 'size')).toBe(7);
    expect(edits.changed('size')).toBe(true);
    edits.reset('size');
    expect(DialStore.getValue(ID, 'size')).toBe(1);
  });

  it('follows the selected version', () => {
    const edits = new Edits(ID);
    DialStore.updateValue(ID, 'size', 3);
    const id = DialStore.savePreset(ID, 'Three');
    edits.update();
    expect(edits.any).toBe(false);
    DialStore.updateValue(ID, 'size', 9);
    edits.update();
    edits.resetAll();
    expect(DialStore.getValue(ID, 'size')).toBe(3);
    DialStore.clearActivePreset(ID);
    edits.update();
    expect(DialStore.getValue(ID, 'size')).toBe(1);
    DialStore.updateValue(ID, 'size', 6);
    edits.update();
    edits.resetAll();
    expect(DialStore.getValue(ID, 'size')).toBe(1);
    DialStore.loadPreset(ID, id);
    expect(DialStore.getValue(ID, 'size')).toBe(3);
  });
});
