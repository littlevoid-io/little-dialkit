import { DialStore } from 'dialkit/vanilla';
import { element, type Mounted, placeBelow, textButton } from './dom';
import type { Edits } from './edits';
import { icon, ICONS } from './icon';
import type { Undo } from './undo';
import { versionPrompt } from './versionPrompt';
import { type RowActions, versionRow } from './versionRow';
import { activeVersion, listVersions, selectVersion, type VersionEntry } from './versions';

/**
 * The versions of a panel: a button in the toolbar naming the selected one (with `*` while it has edits) and its menu:
 * select, rename, delete, save or discard the edits, save as a new version.
 * Edits become part of a version only when saved: leaving an edited version asks first.
 */
export class VersionMenu implements Mounted, RowActions {
  private readonly button = element('button', 'little-version-button');
  private readonly label = element('span', 'little-version-label');
  private readonly menu = element('div', 'little-version-menu');
  private open = false;
  /** What the open menu shows, to redraw it only when that changes. */
  private shown = '';
  /** The version to select once the edits are saved or discarded. */
  private pending: VersionEntry | undefined;
  /** Id of the version being renamed (null: the base); undefined: none. */
  private renaming: VersionEntry['id'] | undefined;

  constructor(
    private readonly panelId: string,
    private readonly root: HTMLElement,
    private readonly toolbar: HTMLElement,
    private readonly edits: Edits,
    private readonly history: Undo,
  ) {
    this.button.type = 'button';
    this.button.popoverTargetElement = this.menu;
    this.button.append(this.label, icon(ICONS.expand));
    this.menu.popover = 'auto';
    this.menu.addEventListener('beforetoggle', (event) => this.toggle(event.newState === 'open'));
    toolbar.append(this.button);
    root.append(this.menu);
    this.update();
  }

  public get entries(): VersionEntry[] {
    return listVersions(this.panelId);
  }

  public get active(): VersionEntry {
    return activeVersion(this.panelId);
  }

  public get edited(): boolean {
    return this.edits.any;
  }

  /** Selects a version. With edits on the selected one, the menu opens and asks to save or discard them. */
  public select(entry: VersionEntry): void {
    if (entry.id === this.active.id) this.menu.hidePopover();
    else if (!this.edited) this.leave(entry, true);
    else {
      this.pending = entry;
      if (this.open) this.draw();
      else this.menu.showPopover();
    }
  }

  public edit(entry: VersionEntry): void {
    this.renaming = entry.id;
    this.draw();
  }

  public rename(entry: VersionEntry, name: string): void {
    this.renaming = undefined;
    if (name !== entry.name) DialStore.renamePreset(this.panelId, entry.id, name);
    this.draw();
  }

  /** Deleting the selected version selects the base. */
  public remove(entry: VersionEntry): void {
    if (entry.id !== null) DialStore.deletePreset(this.panelId, entry.id);
  }

  /** Makes the edits part of the selected version. */
  public save(): void {
    DialStore.keepEdits(this.panelId);
  }

  public discard(): void {
    this.edits.resetAll();
  }

  /** Saves the visible values as a new version and selects it, ready to be named. The version left keeps what it held. */
  public add(): void {
    this.renaming = DialStore.saveNewPreset(this.panelId);
    this.draw();
  }

  public update(): void {
    const { name } = this.active;
    this.label.textContent = this.edited ? `${name} *` : name;
    this.button.title = this.edited ? `Version: ${name} (edited)` : `Version: ${name}`;
    this.draw();
  }

  public destroy(): void {
    this.button.remove();
    this.menu.remove();
  }

  /** The menu has its rows only while it is open. */
  private toggle(open: boolean): void {
    this.open = open;
    this.shown = '';
    if (open) {
      this.draw();
      // Under the toolbar, or under the panel's icon while the panel is collapsed.
      placeBelow(this.menu, this.toolbar.offsetWidth > 0 ? this.toolbar : this.root);
      return;
    }
    this.menu.replaceChildren();
    this.pending = undefined;
    this.renaming = undefined;
  }

  /** `keep`: the edits become part of the version that is left. One undo step. */
  private leave(next: VersionEntry, keep: boolean): void {
    this.history.suspend(() => {
      if (!keep) this.edits.resetAll();
      selectVersion(this.panelId, next.id);
    });
    this.menu.hidePopover();
  }

  private draw(): void {
    const { entries, active, edited, pending, renaming } = this;
    const shown = JSON.stringify({ entries, active, edited, pending, renaming: renaming ?? (renaming === null ? 'base' : '') });
    if (!this.open || shown === this.shown) return;
    this.shown = shown;
    this.menu.replaceChildren(...(pending ? versionPrompt(active, pending, (keep) => this.leave(pending, keep), () => this.menu.hidePopover()) : this.list()));
    const field = this.menu.querySelector('input');
    field?.focus();
    field?.select();
  }

  private list(): HTMLElement[] {
    const { active, edited, renaming } = this;
    const rows = this.entries.map((entry) => versionRow(entry, { active: entry.id === active.id, edited, renaming: entry.id === renaming }, this));
    return [...rows, textButton('little-version-add', 'Save as new version', () => this.add())];
  }
}
