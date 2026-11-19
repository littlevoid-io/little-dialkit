import type { DialConfig } from 'dialkit/vanilla';
import { actionRow, type RowAction } from './actionRow';
import { ICONS } from './icon';
import type { Panel } from './panel';

export type ActionName = 'save' | 'saveAs' | 'reset' | 'export';

/** Which buttons the action row has; all unless set to false. */
export type ActionChoice = Partial<Record<ActionName, boolean>>;

function download(name: string, text: string): void {
  const link = document.createElement('a');
  link.href = URL.createObjectURL(new Blob([text], { type: 'application/json' }));
  link.download = name;
  link.click();
  URL.revokeObjectURL(link.href);
}

/** What a panel's action row and its keys (`Shortcuts`) do: save, save as a new version, reset, export to a file. */
export class Actions {
  /** Called after `save` made the edits part of the selected version: for the page to write the versions somewhere. */
  public onSave?: () => void;
  /** Takes the place of `reset`'s own step: for a page that keeps the versions somewhere and reads them again. Asking first is the page's. */
  public onReset?: () => void;

  constructor(private readonly panel: Pick<Panel<DialConfig>, 'kit' | 'versions' | 'exportVersions'>) {}

  public save(): void {
    this.panel.versions.save();
    this.onSave?.();
  }

  /** Calls `VersionMenu.onAdd`. */
  public saveAs(): void {
    this.panel.versions.add();
  }

  /** Discards the edits on the selected version, after asking. */
  public reset(): void {
    if (this.onReset) return this.onReset();
    const { edited, active } = this.panel.versions;
    if (edited && confirm(`Discard the edits on "${active.name}"?`)) this.panel.versions.discard();
  }

  /** Downloads all versions as `<panel id>-versions.json` (`VersionData`). Edits on the selected version become part of it. */
  public export(): void {
    download(`${this.panel.kit.id}-versions.json`, JSON.stringify(this.panel.exportVersions(), null, 2));
  }

  /** The row of the chosen buttons; undefined when none is chosen. */
  public row(choice: ActionChoice): HTMLElement | undefined {
    const buttons: Record<ActionName, RowAction> = {
      save: { label: 'Save (Ctrl+S)', icon: ICONS.disk, run: () => this.save() },
      saveAs: { label: 'Save as new version (Ctrl+Shift+S)', icon: ICONS.copy, run: () => this.saveAs() },
      reset: { label: 'Reset (Esc)', icon: ICONS.reset, run: () => this.reset() },
      export: { label: 'Export versions to a file', icon: ICONS.download, run: () => this.export() },
    };
    const chosen = Object.entries(buttons).filter(([name]) => choice[name as ActionName] !== false);
    return chosen.length > 0 ? actionRow(chosen.map(([, button]) => button)) : undefined;
  }
}
