import type { Mounted } from './dom';
import { ICONS, iconButton } from './icon';
import type { Spread } from './spread';

const LABEL = 'Apply to all versions';

/** Button of a control's row: writes the control's value into all versions, after asking. Disabled while there is no other version. */
export class ApplyButton implements Mounted {
  private readonly button: HTMLButtonElement;

  constructor(host: HTMLElement, private readonly spread: Spread, private readonly path: string) {
    this.button = iconButton('little-button little-apply', LABEL, ICONS.versions, () => this.click());
    host.append(this.button);
    this.update();
  }

  public update(): void {
    this.button.disabled = !this.spread.possible;
  }

  public destroy(): void {
    this.button.remove();
  }

  private click(): void {
    if (confirm(`Apply "${this.path}" to all versions? This cannot be undone.`)) this.spread.apply(this.path);
  }
}
