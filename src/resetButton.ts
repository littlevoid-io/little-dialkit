import type { Mounted } from './dom';
import type { Edits } from './edits';
import { ICONS, iconButton } from './icon';

/** Button of a control's row, enabled while the control differs from the selected version: sets it back. */
export class ResetButton implements Mounted {
  private readonly button: HTMLButtonElement;

  constructor(host: HTMLElement, private readonly edits: Edits, private readonly path: string) {
    this.button = iconButton('little-button little-reset', 'Reset to the version', ICONS.reset, () => edits.reset(path));
    host.append(this.button);
    this.update();
  }

  public update(): void {
    this.button.disabled = !this.edits.changed(this.path);
  }

  public destroy(): void {
    this.button.remove();
  }
}
