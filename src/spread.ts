import { DialStore } from 'dialkit/vanilla';
import type { Edits } from './edits';
import type { Undo } from './undo';
import type { Values } from './values';
import { exportVersions, type VersionData } from './versionData';
import { listVersions, selectVersion } from './versions';

/**
 * Writes the visible values at `paths` into every version, the selected one included.
 * `held`: what the selected version holds. Its edits at other paths stay edits.
 * `applied` is called while the selected version shows what it holds now, before those edits are back.
 */
export function applyToVersions(panelId: string, paths: string[], held: Values, applied?: () => void): void {
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
  applied?.();
  DialStore.updateValues(panelId, edited);
}

/** Applies a control's visible value to all versions. Not an undo step: undo covers the visible values only. */
export class Spread {
  /**
   * Called after a value went into all versions, with the versions as they are held: for the page to write them somewhere.
   * `Panel.exportVersions` would make the selected version's other edits part of it.
   */
  public onApply?: (data: VersionData) => void;

  constructor(private readonly panelId: string, private readonly edits: Edits, private readonly history: Undo) {}

  /** There are other versions. */
  public get possible(): boolean {
    return DialStore.getPresets(this.panelId).length > 0;
  }

  /** The value at `path`, and those below it, into every version. */
  public apply(path: string): void {
    const paths = Object.keys(DialStore.getValues(this.panelId)).filter((key) => key === path || key.startsWith(`${path}.`));
    const { panelId, onApply } = this;
    this.history.suspend(() => applyToVersions(panelId, paths, this.edits.held, onApply && (() => onApply(exportVersions(panelId)))));
  }
}
