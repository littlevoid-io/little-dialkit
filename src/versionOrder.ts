import { DialStore } from 'dialkit/vanilla';
import { type Values, withoutActions } from './values';
import { exportVersions, importVersions } from './versionData';

/** `list` with the item at `from` taken out and put before the item at `to`, or `after` it. */
export function reordered<Item>(list: Item[], from: number, to: number, after: boolean): Item[] {
  const rest = list.filter((_, index) => index !== from);
  const at = rest.indexOf(list[to]) + (after ? 1 : 0);
  return [...rest.slice(0, at), list[from], ...rest.slice(at)];
}

/**
 * Puts the saved version `id` before the saved version `target`, or `after` it. DialKit has no call to reorder:
 * the versions are written anew in that order and get new ids. `held`: what the selected version holds; its edits stay edits.
 */
export function moveVersion(panelId: string, id: string, target: string, after: boolean, held: Values): void {
  const ids = DialStore.getPresets(panelId).map((preset) => preset.id);
  if (id === target || !ids.includes(id) || !ids.includes(target)) return;
  const edited = withoutActions(DialStore.getValues(panelId));
  // An export merges the edits into the selected version: without them it holds what it held.
  DialStore.updateValues(panelId, withoutActions(held));
  const data = exportVersions(panelId);
  importVersions(panelId, { ...data, versions: reordered(data.versions, ids.indexOf(id), ids.indexOf(target), after) });
  DialStore.updateValues(panelId, edited);
}
