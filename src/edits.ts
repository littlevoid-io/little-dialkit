import { type DialValue, DialStore } from 'dialkit/vanilla';
import type { Values } from './values';

function same(a: DialValue | undefined, b: DialValue | undefined): boolean {
  return a === b || JSON.stringify(a) === JSON.stringify(b);
}

/**
 * What the base version holds while it is selected with edits. DialKit does not expose it:
 * a temporary version takes the edits, the base then shows what it held.
 */
function heldBase(panelId: string): Values {
  const edited = DialStore.getValues(panelId);
  const id = DialStore.savePreset(panelId, 'little-dialkit');
  DialStore.clearActivePreset(panelId);
  const base = DialStore.getValues(panelId);
  DialStore.deletePreset(panelId, id);
  DialStore.updateValues(panelId, edited);
  return base;
}

/** The edits on the selected version: the visible values that differ from what the version holds. */
export class Edits {
  /** What the base version holds; current whenever the base is selected. */
  private base: Values = {};
  /** Paths of the values that differ. */
  private paths: string[] = [];

  /** Create before anything that records store changes: reading an edited base writes to the store. */
  constructor(private readonly panelId: string) {
    if (!DialStore.getActivePresetId(panelId) && DialStore.hasEdits(panelId)) this.base = heldBase(panelId);
    this.update();
  }

  /** Call on every store change, before anything reads the edits. */
  public update(): void {
    const { panelId } = this;
    const edited = DialStore.hasEdits(panelId);
    const values = DialStore.getValues(panelId);
    if (!DialStore.getActivePresetId(panelId) && !edited) this.base = values;
    const { held } = this;
    this.paths = edited ? Object.keys(values).filter((path) => !same(values[path], held[path])) : [];
  }

  public get any(): boolean {
    return this.paths.length > 0;
  }

  /** Whether the value at `path`, or one below it, differs. */
  public changed(path: string): boolean {
    return this.under(path).length > 0;
  }

  /** Sets the value at `path`, and those below it, back to what the version holds. */
  public reset(path: string): void {
    this.write(this.under(path));
  }

  public resetAll(): void {
    this.write(this.paths);
  }

  /** What the selected version holds. */
  public get held(): Values {
    const activeId = DialStore.getActivePresetId(this.panelId);
    return DialStore.getPresets(this.panelId).find(({ id }) => id === activeId)?.values ?? this.base;
  }

  private under(path: string): string[] {
    return this.paths.filter((changed) => changed === path || changed.startsWith(`${path}.`));
  }

  private write(paths: string[]): void {
    const { held } = this;
    DialStore.updateValues(this.panelId, Object.fromEntries(paths.map((path) => [path, held[path]])));
  }
}
