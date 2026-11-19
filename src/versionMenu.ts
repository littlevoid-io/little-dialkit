import { DialStore } from 'dialkit/vanilla';
import { copyToBase } from './defaultVersion';
import { element, type Mounted, placeBelow, textButton } from './dom';
import type { Edits } from './edits';
import type { Prompt } from './prompt';
import type { Undo } from './undo';
import { VersionButton } from './versionButton';
import { exportVersions, type VersionData } from './versionData';
import { moveVersion } from './versionOrder';
import { defaultQuestion, leaveQuestion } from './versionPrompt';
import { type RowActions, versionRow } from './versionRow';
import { activeVersion, listVersions, saveNewVersion, selectVersion, type VersionEntry } from './versions';

/**
 * The versions of a panel: a button in the toolbar naming the selected one (with `*` while it has edits) and its menu:
 * select, rename, set as default, delete, drag to sort, save or discard the edits, save as a new version.
 * Edits become part of a version only when saved: leaving an edited version asks first (`Prompt`).
 */
export class VersionMenu implements Mounted, RowActions {
  private readonly menu = element('div', 'little-version-menu');
  private readonly button = new VersionButton(this.menu);
  /** The menu has its rows only while it is open. */
  private open = false;
  private shown = '';
  /** Id of the version being renamed (null: the base); undefined: none. */
  private renaming: VersionEntry['id'] | undefined;
  /** Called when a new version was saved (`add`), and again when its name is changed in the field `add` shows. */
  public onAdd?: () => void;
  private added: string | undefined;
  /** Called after a version was copied to the base (`makeDefault`), with the versions as they are held. */
  public onDefault?: (data: VersionData) => void;

  constructor(
    private readonly panelId: string, private readonly root: HTMLElement, private readonly toolbar: HTMLElement, private readonly edits: Edits, private readonly history: Undo, private readonly prompt: Prompt,
  ) {
    this.menu.popover = 'auto';
    this.menu.addEventListener('beforetoggle', (event) => this.toggle(event.newState === 'open'));
    toolbar.append(this.button.element);
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

  /** Selects a version. With edits on the selected one, asks to save or discard them first. */
  public select(entry: VersionEntry): void {
    if (entry.id === this.active.id) return this.menu.hidePopover();
    if (!this.edited) return this.leave(entry, true);
    this.prompt.ask(leaveQuestion(this.active, entry, (keep) => this.leave(entry, keep)));
  }

  /** After asking, copies what a saved version holds to the base (`copyToBase`). Not an undo step. */
  public makeDefault(entry: VersionEntry): void {
    const copy = () => this.history.suspend(() => copyToBase(this.panelId, entry.id, this.edits.held, () => this.onDefault?.(exportVersions(this.panelId))));
    this.prompt.ask(defaultQuestion(entry, this.entries[0], copy));
  }

  public edit(entry: VersionEntry): void {
    this.renaming = entry.id;
    this.draw();
  }

  public rename(entry: VersionEntry, name: string): void {
    this.renaming = undefined;
    if (name !== entry.name) DialStore.renamePreset(this.panelId, entry.id, name);
    if (name !== entry.name && entry.id === this.added) this.onAdd?.();
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

  /** Saves the visible values as a new version (`saveNewVersion`) and shows it in the menu, its name ready to be changed. The version left keeps what it held. */
  public add(): void {
    this.renaming = this.added = saveNewVersion(this.panelId);
    this.onAdd?.();
    if (!this.open) this.menu.showPopover();
    this.draw();
  }

  /** Puts a saved version before or after another one (`moveVersion`). Not an undo step. */
  public move(id: string, target: string, after: boolean): void {
    this.history.suspend(() => moveVersion(this.panelId, id, target, after, this.edits.held));
  }

  public update(): void {
    this.button.show(this.active.name, this.edited);
    this.draw();
  }

  public destroy(): void {
    this.button.element.remove();
    this.menu.remove();
  }

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
    const { entries, active, edited, renaming } = this;
    const shown = JSON.stringify({ entries, active, edited, renaming: renaming ?? (renaming === null ? 'base' : '') });
    if (!this.open || shown === this.shown) return;
    this.shown = shown;
    const rows = entries.map((entry) => versionRow(entry, { active: entry.id === active.id, edited, renaming: entry.id === renaming }, this));
    this.menu.replaceChildren(...rows, textButton('little-version-add', 'Save as new version', () => this.add()));
    const field = this.menu.querySelector('input');
    field?.focus();
    field?.select();
  }
}
