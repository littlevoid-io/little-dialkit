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

/** Name for a version saved from the one named `name`: the next free `-vNN` (`look` -> `look-v02`, `look-v02` -> `look-v03`). */
export function nextName(name: string, taken: string[]): string {
  const [, stem = name, number = '1'] = /^(.*)-v(\d+)$/.exec(name) ?? [];
  for (let version = Number(number) + 1; ; version++) {
    const next = `${stem}-v${String(version).padStart(2, '0')}`;
    if (!taken.includes(next)) return next;
  }
}

/** Saves the visible values as a new version named after the selected one and selects it. Returns its id. */
export function saveNewVersion(panelId: string): string {
  const name = nextName(activeVersion(panelId).name, listVersions(panelId).map((version) => version.name));
  return DialStore.savePreset(panelId, name);
}

/** Edits on the version that is left become part of it (DialKit). */
export function selectVersion(panelId: string, id: VersionEntry['id']): void {
  if (id === null) DialStore.clearActivePreset(panelId);
  else DialStore.loadPreset(panelId, id);
}
