import { DialStore } from 'dialkit/vanilla';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { exportVersions, importVersions, type VersionData } from './versionData';

const ID = 'version-data-test';
const CONFIG = { size: [1, 0, 10, 1] as [number, number, number, number], label: 'a', run: { type: 'action' as const } };

const DATA: VersionData = {
  base: { name: 'Start', values: { size: 2, label: 'base' } },
  versions: [
    { name: 'Wide', values: { size: 8, label: 'wide' } },
    { name: 'Narrow', values: { size: 3, label: 'narrow' } },
  ],
  active: 'Wide',
};

describe('version data', () => {
  beforeEach(() => DialStore.registerPanel(ID, 'Test', CONFIG));
  afterEach(() => DialStore.unregisterPanel(ID));

  it('exports the base and the saved versions without actions', () => {
    DialStore.updateValue(ID, 'size', 4);
    DialStore.savePreset(ID, 'Four');
    DialStore.updateValue(ID, 'size', 5);
    expect(exportVersions(ID)).toEqual({
      base: { name: 'V1', values: { size: 1, label: 'a' } },
      versions: [{ name: 'Four', values: { size: 5, label: 'a' } }],
      active: 'Four',
    });
    expect(DialStore.getValue(ID, 'size')).toBe(5);
    expect(DialStore.getPresets(ID)).toHaveLength(1);
  });

  it('exports while the base is selected', () => {
    DialStore.updateValue(ID, 'size', 6);
    expect(exportVersions(ID)).toEqual({ base: { name: 'V1', values: { size: 6, label: 'a' } }, versions: [], active: null });
  });

  it('imports what it exports', () => {
    importVersions(ID, DATA);
    expect(DialStore.getValues(ID)).toMatchObject({ size: 8, label: 'wide' });
    expect(exportVersions(ID)).toEqual(DATA);
  });

  it('replaces the versions that were there', () => {
    DialStore.savePreset(ID, 'Old');
    importVersions(ID, { ...DATA, active: null });
    expect(DialStore.getPresets(ID).map(({ name }) => name)).toEqual(['Wide', 'Narrow']);
    expect(DialStore.getActivePresetId(ID)).toBeNull();
    expect(DialStore.getValues(ID)).toMatchObject({ size: 2, label: 'base' });
  });
});
