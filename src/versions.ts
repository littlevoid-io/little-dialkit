import { DialStore } from 'dialkit/vanilla';

/** A version in DialKit's store. */
export interface VersionEntry {
  /** Null: DialKit's base version, the values before any saved version. It cannot be deleted. */
  id: string | null;
  name: string;
}

/** The base version, then the saved ones. */
export function listVersions(panelId: string): VersionEntry[] {
  return [{ id: null, name: DialStore.getBaseName(panelId) }, ...DialStore.getPresets(panelId).map(({ id, name }) => ({ id, name }))];
}

export function activeVersion(panelId: string): VersionEntry {
  const activeId = DialStore.getActivePresetId(panelId);
  const active = listVersions(panelId).find(({ id }) => id === activeId);
  if (!active) throw new Error(`Panel "${panelId}" has no version "${activeId}"`);
  return active;
}

/** Edits on the version that is left become part of it (DialKit). */
export function selectVersion(panelId: string, id: VersionEntry['id']): void {
  if (id === null) DialStore.clearActivePreset(panelId);
  else DialStore.loadPreset(panelId, id);
}
