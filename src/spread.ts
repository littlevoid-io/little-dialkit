import { DialStore } from 'dialkit/vanilla';
import type { Edits } from './edits';
import type { Undo } from './undo';
import type { Values } from './values';
import { listVersions, selectVersion } from './versions';

/**
 * Writes the visible values at `paths` into every version, the selected one included.
 * `held`: what the selected version holds. Its edits at other paths stay edits.
 */
export function applyToVersions(panelId: string, paths: string[], held: Values): void {
  const activeId = DialStore.getActivePresetId(panelId);
  const edited = DialStore.getValues(panelId);
  const values = Object.fromEntries(paths.map((path) => [path, edited[path]]));
  // Leaving a version merges its edits into it (DialKit): each one is left holding only what is written here.
  DialStore.updateValues(panelId, held);
  for (const { id } of [{ id: activeId }, ...listVersions(panelId).filter((version) => version.id !== activeId)]) {
    selectVersion(panelId, id);
    DialStore.updateValues(panelId, values);
    DialStore.keepEdits(panelId);
  }
  selectVersion(panelId, activeId);
  DialStore.updateValues(panelId, edited);
}

/** Applies a control's visible value to all versions. Not an undo step: undo covers the visible values only. */
export class Spread {
  constructor(private readonly panelId: string, private readonly edits: Edits, private readonly history: Undo) {}

  /** There are other versions. */
  public get possible(): boolean {
    return DialStore.getPresets(this.panelId).length > 0;
  }

  /** The value at `path`, and those below it, into every version. */
  public apply(path: string): void {
    const paths = Object.keys(DialStore.getValues(this.panelId)).filter((key) => key === path || key.startsWith(`${path}.`));
    this.history.suspend(() => applyToVersions(this.panelId, paths, this.edits.held));
  }
}
