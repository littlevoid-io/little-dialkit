import type { Mounted } from './dom';
import type { Edits } from './edits';
import { ICONS, iconButton } from './icon';

/** Button at the end of a control's row, there while the control differs from the selected version: sets it back. */
export class ResetButton implements Mounted {
  private readonly button: HTMLButtonElement;

  constructor(private readonly row: HTMLElement, private readonly edits: Edits, private readonly path: string) {
    this.button = iconButton('little-button little-reset', 'Reset to the version', ICONS.reset, () => edits.reset(path));
    this.update();
  }

  public update(): void {
    if (!this.edits.changed(this.path)) this.button.remove();
    else if (!this.button.isConnected) this.row.append(this.button);
  }

  public destroy(): void {
    this.button.remove();
  }
}
