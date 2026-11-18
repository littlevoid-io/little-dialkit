import { DialStore } from 'dialkit/vanilla';
import { type Values, withoutActions } from './values';

export interface Version {
  name: string;
  values: Values;
}

/** A panel's versions as plain data, for a file or a request body. */
export interface VersionData {
  /** DialKit's base version: the values before any saved version. */
  base: Version;
  versions: Version[];
  /** Name of the selected saved version; null while the base is selected. */
  active: string | null;
}

/** Reads all versions. Edits on the selected version become part of it, as when leaving it in the panel. */
export function exportVersions(panelId: string): VersionData {
  const activeId = DialStore.getActivePresetId(panelId);
  // The base values are readable only while the base is selected.
  DialStore.clearActivePreset(panelId);
  const base = { name: DialStore.getBaseName(panelId), values: withoutActions(DialStore.getValues(panelId)) };
  const presets = DialStore.getPresets(panelId);
  if (activeId) DialStore.loadPreset(panelId, activeId);
  return {
    base,
    versions: presets.map(({ name, values }) => ({ name, values: withoutActions(values) })),
    active: presets.find(({ id }) => id === activeId)?.name ?? null,
  };
}

/** Replaces all versions of the panel. Values of controls the panel does not have are ignored. */
export function importVersions(panelId: string, data: VersionData): void {
  for (const { id } of DialStore.getPresets(panelId)) DialStore.deletePreset(panelId, id);
  DialStore.clearActivePreset(panelId);
  DialStore.renamePreset(panelId, null, data.base.name);
  DialStore.updateValues(panelId, data.base.values);
  DialStore.keepEdits(panelId);
  // A new version takes the visible values with it; the version selected before keeps what it held.
  for (const { name, values } of data.versions) {
    DialStore.updateValues(panelId, values);
    DialStore.savePreset(panelId, name);
  }
  const active = DialStore.getPresets(panelId).find(({ name }) => name === data.active);
  if (active) DialStore.loadPreset(panelId, active.id);
  else DialStore.clearActivePreset(panelId);
}
