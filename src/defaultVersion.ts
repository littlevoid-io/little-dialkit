import { DialStore } from 'dialkit/vanilla';
import { type Values, withoutActions } from './values';
import { selectVersion, type VersionEntry } from './versions';

/**
 * Writes what the saved version `id` holds into the base, in place of everything the base held.
 * `held`: what the selected version holds. Its edits stay edits, on the base too when that is the selected one.
 * `copied` is called while the selected version shows what it holds now, before those edits are back.
 */
export function copyToBase(panelId: string, id: VersionEntry['id'], held: Values, copied?: () => void): void {
  const activeId = DialStore.getActivePresetId(panelId);
  const visible = DialStore.getValues(panelId);
  const edits = Object.fromEntries(Object.entries(visible).filter(([path, value]) => value !== held[path]));
  // Leaving a version merges its edits into it (DialKit): it is left holding what it held.
  DialStore.updateValues(panelId, held);
  const source = DialStore.getPresets(panelId).find((version) => version.id === id);
  if (!source) throw new Error(`Panel "${panelId}" has no saved version "${id}"`);
  DialStore.clearActivePreset(panelId);
  DialStore.updateValues(panelId, withoutActions(source.values));
  DialStore.keepEdits(panelId);
  selectVersion(panelId, activeId);
  copied?.();
  DialStore.updateValues(panelId, edits);
}
